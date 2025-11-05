// --------------------------------------------------
// 🔊 ChordFlow — Motor de audio (Tone.js)
// --------------------------------------------------
// - Usa Rhodes Sampler real desde fxChain.ts
// - Humanización: micro-delay ±20 ms y velocity variable
// - Loop 4/4 estable (Ticks, sin redondeos)
// - ADSR suave y sin clicks
// - Re-schedule al próximo downbeat (compás siguiente)
// --------------------------------------------------

import * as Tone from "tone";
import type { ChordBlock } from "../progression/types";
import { chordNotesFromDegree } from "../theory/roman";
import { createEPInstrument } from "./fxChain";

// --------------------------------------------------
// 🎛️ Inicialización
// --------------------------------------------------
const Transport = Tone.getTransport();
let instrument: Tone.Sampler | null = null;

// Carga el instrumento una sola vez
async function ensureInstrument() {
  if (!instrument) {
    instrument = await createEPInstrument();
  }
  return instrument;
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

// Humanización: micro-delay y velocity
function humanizeTime(baseTime: number): number {
  const jitter = (Math.random() * 0.04) - 0.02; // ±20 ms
  return baseTime + jitter;
}

function humanizeVelocity(): number {
  return 0.65 + Math.random() * 0.35; // 0.65–1.0
}

// --------------------------------------------------
// ▶️ API pública
// --------------------------------------------------
export async function play() {
  await Tone.start();
  await ensureInstrument();
  Transport.start("+0.02");
}

export function stop() {
  Transport.stop();
  instrument?.releaseAll();
}

/**
 * Programa la progresión en el Transport con loop 4/4.
 * - Timing preciso con Ticks
 * - Humanización ligera por acorde
 */
export async function scheduleProgression(
  progression: ChordBlock[],
  bpm: number,
  key: string
) {
  const synth = await ensureInstrument();
  clearScheduled();

  Transport.bpm.rampTo(bpm, 0.05);

  const ppq = Tone.Transport.PPQ;
  const beats = Math.max(1, totalBeats(progression));
  const loopStartTicks = 0;
  const loopEndTicks = beats * ppq;

  Transport.loop = true;
  Transport.loopStart = Tone.Ticks(loopStartTicks).toSeconds();
  Transport.loopEnd = Tone.Ticks(loopEndTicks).toSeconds();

  // Limpieza al inicio de cada vuelta
  const releaseId = Transport.schedule(() => synth.releaseAll(), "0:0:0");
  scheduledIds.push(releaseId);

  const safetyTicks = Math.max(1, Math.floor(ppq * 0.02));
  let cursorTicks = 0;

  progression.forEach((b) => {
    const startTicks = cursorTicks;
    const durTicks = Math.max(1, Math.floor(b.durationBeats * ppq));
    const maxEndTicks = loopEndTicks - safetyTicks;
    const noteOffTicks = Math.min(
      startTicks + Math.floor(durTicks * 0.96),
      maxEndTicks
    );
    const effDurTicks = Math.max(1, noteOffTicks - startTicks);

    const id = Transport.schedule((time) => {
      try {
        const notes = chordNotesFromDegree(key, b.degree);
        const durSec = Tone.Ticks(effDurTicks).toSeconds();

        // 🎹 Aplicar humanización
        const humanTime = humanizeTime(time);
        const velocity = humanizeVelocity();

        synth.triggerAttackRelease(notes, durSec, humanTime, velocity);
      } catch (e) {
        console.warn("[schedule] chord error:", e);
      }
    }, Tone.Ticks(startTicks));

    scheduledIds.push(id);
    cursorTicks += durTicks;
  });
}

/**
 * Reprograma al PRÓXIMO DOWNBEAT (inicio de compás siguiente)
 */
export async function rescheduleAtNextDownbeat(
  progression: ChordBlock[],
  bpm: number,
  key: string
) {
  const running = Tone.Transport.state === "started";

  if (!running) {
    await scheduleProgression(progression, bpm, key);
    return;
  }

  if (pendingReschedule !== null) {
    Tone.Transport.clear(pendingReschedule);
    pendingReschedule = null;
  }

  const ppq = Tone.Transport.PPQ;
  const ticksPerMeasure = ppq * 4;
  const nowTicks = Tone.Transport.ticks;
  const nextDownbeatTicks =
    Math.ceil(nowTicks / ticksPerMeasure) * ticksPerMeasure;

  pendingReschedule = Transport.scheduleOnce(async () => {
    await scheduleProgression(progression, bpm, key);
    pendingReschedule = null;
  }, Tone.Ticks(nextDownbeatTicks));
}
