// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Presets de progresiones base
// --------------------------------------------------
// Este módulo define un conjunto mínimo de presets que pueden
// cargarse en la interfaz para:
//
// - Probar rápidamente el motor de audio.
// - Explorar la reproducción automática.
// - Visualizar sugerencias armónicas en diferentes estilos.
// - Contar con ejemplos educativos de progresiones típicas.
//
// Los presets incluyen: Pop (I–vi–IV–V) y Neo-Soul (ii–V–I–vi).
// --------------------------------------------------

import type { ChordBlock } from "../progression/types";

/**
 * Estructura básica de un preset simple utilizado por la aplicación.
 * Incluye información descriptiva, tonalidad, tempo, estilo y la lista
 * de bloques de acordes que conforman la progresión.
 */
export type SimplePreset = {
  /** Nombre del preset mostrado en la interfaz */
  title: string;

  /** Tonalidad de la progresión (limitada a las disponibles en el panel) */
  key: "C" | "G" | "D" | "F";

  /** Velocidad de reproducción en BPM */
  bpm: number;

  /** Estilo armónico que utilizará la matriz de recomendación */
  style: "Pop" | "Neo";

  /** Lista de acordes que conforman la progresión */
  progression: ChordBlock[];
};

// --------------------------------------------------
// Preset Pop clásico: I–vi–IV–V
// --------------------------------------------------
// Progresión fundamental en pop y rock contemporáneo.
// Cada acorde dura un compás completo (4 beats).
// Valores por defecto:
// - Tonalidad: C mayor
// - BPM: 100
// --------------------------------------------------
export function getPopPreset(): SimplePreset {
  return {
    title: "Pop — I–vi–IV–V",
    key: "C",
    bpm: 100,
    style: "Pop",
    progression: [
      { id: "b1", degree: "I",  durationBeats: 4 },
      { id: "b2", degree: "vi", durationBeats: 4 },
      { id: "b3", degree: "IV", durationBeats: 4 },
      { id: "b4", degree: "V",  durationBeats: 4 },
    ],
  };
}

// --------------------------------------------------
// Preset Neo-Soul simple: ii–V–I–vi
// --------------------------------------------------
// Secuencia característica utilizada en neo-soul y jazz,
// especialmente en contextos de armonía suavizada o reharmonización.
// Valores por defecto:
// - Tonalidad: C mayor
// - BPM: 86
// --------------------------------------------------
export function getNeoPreset(): SimplePreset {
  return {
    title: "Neo — ii–V–I–vi",
    key: "C",
    bpm: 86,
    style: "Neo",
    progression: [
      { id: "b1", degree: "ii", durationBeats: 4 },
      { id: "b2", degree: "V",  durationBeats: 4 },
      { id: "b3", degree: "I",  durationBeats: 4 },
      { id: "b4", degree: "vi", durationBeats: 4 },
    ],
  };
}
