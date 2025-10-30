// modules/audio/player.ts
import * as Tone from "tone";
import type { ChordBlock } from "../progression/types";
import { chordNotesFromDegree } from "../theory/roman";

// ---------- Nodos de audio (singleton) ----------
const limiter = new Tone.Limiter(-3).toDestination();
const compressor = new Tone.Compressor({
  threshold: -16,
  ratio: 3,
  attack: 0.01,
  release: 0.2,
});
const reverb = new Tone.Reverb({ decay: 2.2, wet: 0.12 });
const chorus = new Tone.Chorus({
  frequency: 0.8,
  depth: 0.5,
  delayTime: 2.5,
  wet: 0.18,
}).start();
const tremolo = new Tone.Tremolo({
  frequency: 4,
  depth: 0.22,
  spread: 180,
  wet: 0.12,
}).start();
const volume = new Tone.Volume(-12);

// Cadena: synth → volume → tremolo → chorus → reverb → compressor → limiter → out
reverb.connect(compressor);
compressor.connect(limiter);
chorus.connect(reverb);
tremolo.connect(chorus);
volume.connect(tremolo);

const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 0.012, decay: 0.18, sustain: 0.55, release: 0.7 },
}).connect(volume);

// Limitar polifonía (no tipeado por TS, pero soportado en runtime)
(synth as any).maxPolyphony = 8;
// Atenuación extra del instrumento
if ((synth as any).volume?.value !== undefined) {
  (synth as any).volume.value = -4;
}

// ---------- Estado ----------
let scheduledIds: number[] = [];
let pendingReschedule: number | null = null;

// ---------- Utilidades ----------
function clearScheduled() {
  scheduledIds.forEach((id) => Tone.Transport.clear(id));
  scheduledIds = [];
}

function totalBeats(blocks: ChordBlock[]) {
  return blocks.reduce((acc, b) => acc + b.durationBeats, 0);
}

// ---------- API ----------
export async function play() {
  await Tone.start();
  Tone.Transport.start("+0.02"); // pequeña rampa para evitar clicks
}

export function stop() {
  Tone.Transport.stop();
  synth.releaseAll();
}

export function scheduleProgression(
  progression: ChordBlock[],
  bpm: number,
  key: string
) {
  clearScheduled();

  // Suavizar cambios de tempo
  Tone.Transport.bpm.rampTo(bpm, 0.05);

  // Loop según 4/4
  const beats = Math.max(1, totalBeats(progression));
  const measures = beats / 4;
  Tone.Transport.loop = true;
  Tone.Transport.loopStart = "0:0:0";
  Tone.Transport.loopEnd = `${measures}:0:0`;

  // Para limitar colas que crucen el loop
  const loopEndSec = Tone.Time(Tone.Transport.loopEnd).toSeconds();

  // Capturar tonalidad local
  const localKey = key;

  // Programar acordes
  let cursorBeats = 0;
  progression.forEach((b) => {
    const bar = Math.floor(cursorBeats / 4);
    const beat = cursorBeats % 4;
    const when = `${bar}:${beat}:0`; // bars:beats:sixteenths

    const id = Tone.Transport.schedule((time) => {
      try {
        const notes = chordNotesFromDegree(localKey, b.degree);

        // Duración proporcional a beats (1 beat = 4n)
        const durBeatsSec = Tone.Time(`${b.durationBeats}*4n`).toSeconds();

        // Limitar para no cruzar loopEnd (con pequeño margen)
        const whenSec = Tone.Time(when).toSeconds();
        const maxDurSec = Math.max(0, loopEndSec - whenSec - 0.02);
        const durSec = Math.min(durBeatsSec * 0.96, maxDurSec);

        synth.triggerAttackRelease(notes, durSec, time);
      } catch (e) {
        console.warn("[schedule] chord error:", e);
      }
    }, when);

    scheduledIds.push(id);
    cursorBeats += b.durationBeats;
  });

  // Limpieza justo antes del reinicio del loop (evita colas colgadas)
  const cleanupId = Tone.Transport.schedule(() => {
    synth.releaseAll();
  }, loopEndSec - 0.01);
  scheduledIds.push(cleanupId);
}

/**
 * Reprograma casi inmediato (~30ms) para reflejar cambios en vivo
 * sin cortar el loop ni generar clicks.
 */
export function rescheduleAtNextDownbeat(
  progression: ChordBlock[],
  bpm: number,
  key: string
) {
  const running = Tone.Transport.state === "started";

  if (!running) {
    scheduleProgression(progression, bpm, key);
    return;
  }

  // cancelar reschedule anterior si existe
  if (pendingReschedule !== null) {
    Tone.Transport.clear(pendingReschedule);
    pendingReschedule = null;
  }

  // aplica en ~30ms para que el reorder se escuche al toque
  pendingReschedule = Tone.Transport.scheduleOnce(() => {
    clearScheduled();
    scheduleProgression(progression, bpm, key);
    pendingReschedule = null;
  }, "+0.03");
}
