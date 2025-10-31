// --------------------------------------------------
// 🔊 ChordFlow — Motor de audio (Tone.js)
// --------------------------------------------------
// - EP/Rhodes simple con cadena FX
// - Programación de acordes en loop 4/4 (Ticks, sin redondeos)
// - ADSR suave para evitar clicks (duración acotada < loopEnd)
// - Re-schedule al próximo downbeat (compás siguiente) en vivo
// --------------------------------------------------

import * as Tone from "tone";
import type { ChordBlock } from "../progression/types";
import { chordNotesFromDegree } from "../theory/roman";

// --------------------------------------------------
// 🎛️ Nodos de audio
// synth → volume → tremolo → chorus → reverb → comp → limiter → out
// --------------------------------------------------
const Transport = Tone.getTransport();
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

reverb.connect(compressor);
compressor.connect(limiter);
chorus.connect(reverb);
tremolo.connect(chorus);
volume.connect(tremolo);

// EP simple con ADSR “amable”
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 0.012, decay: 0.18, sustain: 0.55, release: 0.7 },
}).connect(volume);

// Límite de polifonía (runtime)
(synth as any).maxPolyphony = 8;
// Atenuación extra del instrumento
if ((synth as any).volume?.value !== undefined) {
  (synth as any).volume.value = -4;
}

// --------------------------------------------------
// 🧠 Estado interno
// --------------------------------------------------
let scheduledIds: number[] = [];
let pendingReschedule: number | null = null;

// --------------------------------------------------
// 🛠️ Utilidades
// --------------------------------------------------
function clearScheduled() {
  scheduledIds.forEach((id) => Transport.clear(id));
  scheduledIds = [];
}

function totalBeats(blocks: ChordBlock[]) {
  return blocks.reduce((acc, b) => acc + b.durationBeats, 0);
}

// --------------------------------------------------
// ▶️ API pública
// --------------------------------------------------
export async function play() {
  await Tone.start();
  Transport.start("+0.02"); // rampa corta evita click inicial
}

export function stop() {
  Transport.stop();
  synth.releaseAll();
}

/**
 * Programa la progresión en el Transport con loop 4/4.
 * - Usa Ticks para timing preciso
 * - Limita duración de cada acorde para no cruzar loopEnd
 */
export function scheduleProgression(
  progression: ChordBlock[],
  bpm: number,
  key: string
) {
  clearScheduled();

  // Suavizar cambios de tempo
  Transport.bpm.rampTo(bpm, 0.05);

  // --- Loop 4/4 en Ticks
  const ppq = Tone.Transport.PPQ; // ticks por negra
  const beats = Math.max(1, totalBeats(progression)); // evitar loop 0
  const loopStartTicks = 0;
  const loopEndTicks = beats * ppq; // 1 beat = PPQ ticks

  Transport.loop = true;
  Transport.loopStart = Tone.Ticks(loopStartTicks).toSeconds();
  Transport.loopEnd = Tone.Ticks(loopEndTicks).toSeconds();

  // --- Limpieza de seguridad al inicio de cada vuelta
  // (schedule con posición "0:0:0" se repite en cada loop)
  const releaseId = Tone.Transport.schedule(() => synth.releaseAll(), "0:0:0");
  scheduledIds.push(releaseId);

  // --- Programar acordes bloque por bloque (Ticks)
  const safetyTicks = Math.max(1, Math.floor(ppq * 0.02)); // ~20ms en ticks
  let cursorTicks = 0;

  progression.forEach((b) => {
    const startTicks = cursorTicks;
    const durTicks = Math.max(1, Math.floor(b.durationBeats * ppq));

    // duración efectiva < fin de bloque y < fin de loop (margen)
    const maxEndTicks = loopEndTicks - safetyTicks;
    const noteOffTicks = Math.min(startTicks + Math.floor(durTicks * 0.96), maxEndTicks);
    const effDurTicks = Math.max(1, noteOffTicks - startTicks);

    const id = Tone.Transport.schedule((time) => {
      try {
        const notes = chordNotesFromDegree(key, b.degree);

        // Ejecutamos en 'time' (ya alineado a startTicks) y pasamos duración en segundos
        const durSec = Tone.Ticks(effDurTicks).toSeconds();
        synth.triggerAttackRelease(notes, durSec, time);
      } catch (e) {
        console.warn("[schedule] chord error:", e);
      }
    }, Tone.Ticks(startTicks));

    scheduledIds.push(id);
    cursorTicks += durTicks;
  });
}

/**
 * Reprograma al PRÓXIMO DOWNBEAT (inicio de compás siguiente).
 * - Si el transporte está parado, programa directo.
 * - Si está corriendo, agenda en Ticks para evitar pérdidas de pulsos.
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

  // Cancelar reschedule previo
  if (pendingReschedule !== null) {
    Tone.Transport.clear(pendingReschedule);
    pendingReschedule = null;
  }

  const ppq = Tone.Transport.PPQ;
  const ticksPerMeasure = ppq * 4; // 4/4
  const nowTicks = Tone.Transport.ticks;

  // Próximo múltiplo de compás completo
  const nextDownbeatTicks =
    Math.ceil(nowTicks / ticksPerMeasure) * ticksPerMeasure;

  pendingReschedule = Tone.Transport.scheduleOnce(() => {
    scheduleProgression(progression, bpm, key);
    pendingReschedule = null;
  }, Tone.Ticks(nextDownbeatTicks));
}
