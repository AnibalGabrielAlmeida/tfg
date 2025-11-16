// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Motor de audio (Tone.js)
// --------------------------------------------------
// Responsabilidades principales:
//
// - Inicializar y gestionar el instrumento principal (Rhodes Sampler)
//   a través de createEPInstrument().
// - Programar la reproducción de una progresión completa sobre el
//   Tone.Transport con un loop 4/4 estable (basado en Ticks).
// - Aplicar humanización ligera mediante micro-variaciones de tiempo
//   y dinámica (velocity).
// - Generar voicings de acordes utilizando drop-2 y smooth voice leading
//   entre acordes consecutivos.
// - Reprogramar la progresión de forma limpia en el próximo downbeat,
//   para evitar cortes bruscos al cambiar de progresión durante la
//   reproducción.
// --------------------------------------------------

import * as Tone from "tone";
import type { ChordBlock } from "../progression/types";
import { chordNotesFromDegree } from "../theory/roman";
import { applyVoicing, smoothVoiceLeading } from "../theory/voicings";
import { createEPInstrument } from "./fxChain";

// --------------------------------------------------
// 🎛️ Inicialización de transporte e instrumento
// --------------------------------------------------
const Transport = Tone.getTransport();
let instrument: Tone.Sampler | null = null;

/**
 * Garantiza que el instrumento principal (Rhodes Sampler)
 * esté inicializado antes de ser utilizado.
 */
async function ensureInstrument() {
  if (!instrument) {
    instrument = await createEPInstrument();
  }
  return instrument;
}

// --------------------------------------------------
// 🧠 Estado interno del motor de audio
// --------------------------------------------------
let scheduledIds: number[] = [];
let pendingReschedule: number | null = null;

// Último voicing ejecutado (para aplicar smooth voice leading)
let lastVoicing: string[] | null = null;

// Listener para informar qué bloque de la progresión está activo
let activeBlockListener: ((id: string | null) => void) | null = null;

function notifyActiveBlock(id: string | null) {
  if (activeBlockListener) activeBlockListener(id);
}

// --------------------------------------------------
// Utilidades internas
// --------------------------------------------------

/**
 * Limpia todos los eventos previamente programados en el Transport.
 */
function clearScheduled() {
  scheduledIds.forEach((id) => Transport.clear(id));
  scheduledIds = [];
}

/**
 * Calcula la cantidad total de beats sumando las duraciones
 * de todos los bloques de la progresión.
 */
function totalBeats(blocks: ChordBlock[]) {
  return blocks.reduce((acc, b) => acc + b.durationBeats, 0);
}

/**
 * Aplica una pequeña variación al tiempo base para simular
 * interpretación humana (micro-delay de ±20 ms aprox.).
 */
function humanizeTime(baseTime: number): number {
  const jitter = Math.random() * 0.04 - 0.02; // ±20 ms
  return baseTime + jitter;
}

/**
 * Genera una velocity aleatoria en un rango acotado, para evitar
 * que todas las notas suenen con la misma intensidad.
 */
function humanizeVelocity(): number {
  return 0.65 + Math.random() * 0.35; // 0.65–1.0
}

// --------------------------------------------------
// ▶️ API pública
// --------------------------------------------------

/**
 * Permite que otros módulos (ej.: usePlayback) se suscriban
 * para recibir el ID del bloque actualmente activo.
 */
export function subscribeActiveBlock(
  listener: (id: string | null) => void
): void {
  activeBlockListener = listener;
}

/**
 * Inicia la reproducción del Transport luego de asegurarse
 * de que el contexto de audio y el instrumento estén listos.
 */
export async function play() {
  await Tone.start();
  await ensureInstrument();
  Transport.start("+0.02");
}

/**
 * Detiene la reproducción, libera notas sostenidas y limpia
 * la indicación de bloque activo.
 */
export function stop() {
  Transport.stop();
  instrument?.releaseAll();
  notifyActiveBlock(null);
}

/**
 * Programa la progresión en el Transport con un loop basado en Ticks.
 *
 * Características:
 * - Timing preciso utilizando la resolución interna de Tone.Transport (PPQ).
 * - Humanización ligera de tiempo y dinámica.
 * - Voicings con drop-2 en el primer acorde y smooth voice leading
 *   en los siguientes, reutilizando el último voicing generado.
 * - Respeta un margen de seguridad (safetyTicks) antes del final
 *   del loop para evitar solapamientos de notas.
 */
export async function scheduleProgression(
  progression: ChordBlock[],
  bpm: number,
  key: string
) {
  const synth = await ensureInstrument();
  clearScheduled();
  lastVoicing = null;
  notifyActiveBlock(null);

  // Ajuste suave del tempo
  Transport.bpm.rampTo(bpm, 0.05);

  const ppq = Tone.Transport.PPQ;
  const beats = Math.max(1, totalBeats(progression));
  const loopStartTicks = 0;
  const loopEndTicks = beats * ppq;

  // Definición del loop en términos de Ticks
  Transport.loop = true;
  Transport.loopStart = Tone.Ticks(loopStartTicks).toSeconds();
  Transport.loopEnd = Tone.Ticks(loopEndTicks).toSeconds();

  // Evento inicial para asegurar que no queden notas sostenidas
  const releaseId = Transport.schedule(() => synth.releaseAll(), "0:0:0");
  scheduledIds.push(releaseId);

  const safetyTicks = Math.max(1, Math.floor(ppq * 0.02));
  let cursorTicks = 0;

  progression.forEach((b) => {
    const startTicks = cursorTicks;
    const durTicks = Math.max(1, Math.floor(b.durationBeats * ppq));
    const maxEndTicks = loopEndTicks - safetyTicks;

    // Se acorta ligeramente la duración efectiva para evitar solapamientos
    const noteOffTicks = Math.min(
      startTicks + Math.floor(durTicks * 0.96),
      maxEndTicks
    );
    const effDurTicks = Math.max(1, noteOffTicks - startTicks);

    const id = Transport.schedule((time) => {
      try {
        // Notifica qué bloque acaba de comenzar a sonar
        notifyActiveBlock(b.id);

        const rawNotes = chordNotesFromDegree(key, b.degree);

        // Generación de voicing:
        // - Primer acorde del loop: drop2.
        // - Acordes siguientes: smooth voice leading desde el último voicing.
        let voiced: string[];
        const isLoopStart = startTicks === loopStartTicks;

        if (!lastVoicing || isLoopStart) {
          voiced = applyVoicing(rawNotes, "drop2");
        } else {
          voiced = smoothVoiceLeading(lastVoicing, rawNotes);
        }

        const durSec = Tone.Ticks(effDurTicks).toSeconds();
        const humanTime = humanizeTime(time);
        const velocity = humanizeVelocity();

        synth.triggerAttackRelease(voiced, durSec, humanTime, velocity);
        lastVoicing = voiced;
      } catch (e) {
        console.warn("[schedule] chord error:", e);
      }
    }, Tone.Ticks(startTicks));

    scheduledIds.push(id);
    cursorTicks += durTicks;
  });
}

/**
 * Reprograma la progresión en el PRÓXIMO DOWNBEAT (inicio del siguiente
 * compás completo), evitando cortes abruptos cuando se actualizan
 * la progresión, el tempo o la tonalidad mientras el Transport
 * se encuentra en reproducción.
 */
export async function rescheduleAtNextDownbeat(
  progression: ChordBlock[],
  bpm: number,
  key: string
) {
  const running = Tone.Transport.state === "started";

  // Si el transporte no está corriendo, programa y retorna
  if (!running) {
    await scheduleProgression(progression, bpm, key);
    return;
  }

  // Si ya hay un reschedule pendiente, se limpia antes de programar otro
  if (pendingReschedule !== null) {
    Transport.clear(pendingReschedule);
    pendingReschedule = null;
  }

  const ppq = Tone.Transport.PPQ;
  const ticksPerMeasure = ppq * 4;
  const nowTicks = Tone.Transport.ticks;

  // Cálculo del próximo inicio de compás (downbeat)
  const nextDownbeatTicks =
    Math.ceil(nowTicks / ticksPerMeasure) * ticksPerMeasure;

  pendingReschedule = Transport.scheduleOnce(async () => {
    await scheduleProgression(progression, bpm, key);
    pendingReschedule = null;
  }, Tone.Ticks(nextDownbeatTicks));
}
