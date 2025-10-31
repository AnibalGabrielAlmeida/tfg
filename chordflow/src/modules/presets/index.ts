// --------------------------------------------------
// 🎵 ChordFlow — Presets de progresiones base
// --------------------------------------------------
// Este módulo define presets prearmados (Pop y Neo)
// que se pueden cargar en la app para probar el motor
// de audio, la reproducción y las recomendaciones.
// --------------------------------------------------

import type { ChordBlock } from "../progression/types";

// 🎚️ Estructura de un preset simple (nombre, tonalidad, bpm, estilo, progresión)
export type SimplePreset = {
  title: string;                    // Nombre visible del preset
  key: "C" | "G" | "D" | "F";       // Tonalidad (limitada a las disponibles en el panel)
  bpm: number;                      // Velocidad de reproducción
  style: "Pop" | "Neo";             // Estilo (define la matriz de Markov)
  progression: ChordBlock[];        // Lista de acordes que conforman la progresión
};

// --------------------------------------------------
// 🎸 Preset Pop clásico: I–vi–IV–V
// --------------------------------------------------
// Progresión fundamental del pop/rock.
// Cada acorde dura 4 beats (un compás completo en 4/4).
// Tonalidad por defecto: C mayor, BPM: 100.
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
// 🎹 Preset Neo-Soul simple: ii–V–I–vi
// --------------------------------------------------
// Secuencia característica de progresiones suaves
// o reharmonizadas (muy usada en neo-soul y jazz).
// Tonalidad por defecto: C mayor, BPM: 86.
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
