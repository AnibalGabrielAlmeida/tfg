// --------------------------------------------------
// 🔊 ChordFlow — Motor de audio (Tone.js)
// --------------------------------------------------
// - Usa instrumento Rhodes desde fxChain.ts
// - Loop 4/4 estable (Ticks, sin redondeos)
// - ADSR suave para evitar clicks
// - Re-schedule al próximo downbeat (compás siguiente) en vivo
// --------------------------------------------------

import * as Tone from "tone";
import type { ChordBlock } from "../progression/types";
import { chordNotesFromDegree } from "../theory/roman";
import { createEPInstrument } from "./fxChain"; // ✅ nuevo módulo

// --------------------------------------------------
// 🎛️ Inicialización
// --------------------------------------------------
const Transport = Tone.getTransport();
const synth = createEPInstrument(); // el instrumento ya incluye FX

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
  const ppq = Tone.Transport.PPQ;
  const beats = Math.max(1, totalBeats(progression));
  const loopStartTicks = 0;
  const loopEndTicks = beats * ppq;

  Transport.loop = true;
  Transport.loopStart = Tone.Ticks(loopStartTicks).toSeconds();
  Transport.loopEnd = Tone.Ticks(loopEndTicks).toSeconds();

  // --- Limpieza al inicio de cada vuelta
  const releaseId = Tone.Transport.schedule(() => synth.releaseAll(), "0:0:0");
  scheduledIds.push(releaseId);

  // --- Programar acordes
  const safetyTicks = Math.max(1, Math.floor(ppq * 0.02)); // ~20ms
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

  if (pendingReschedule !== null) {
    Tone.Transport.clear(pendingReschedule);
    pendingReschedule = null;
  }

  const ppq = Tone.Transport.PPQ;
  const ticksPerMeasure = ppq * 4;
  const nowTicks = Tone.Transport.ticks;

  const nextDownbeatTicks =
    Math.ceil(nowTicks / ticksPerMeasure) * ticksPerMeasure;

  pendingReschedule = Tone.Transport.scheduleOnce(() => {
    scheduleProgression(progression, bpm, key);
    pendingReschedule = null;
  }, Tone.Ticks(nextDownbeatTicks));
}
