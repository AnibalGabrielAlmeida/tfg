// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Motor teórico PRO para grados romanos
// --------------------------------------------------
// Este módulo implementa un motor teórico intermedio que:
//
// - Soporta 12 tonalidades mayores (sin distinción entre sostenidos
//   y bemoles en esta versión).
// - Trabaja con grados diatónicos, acordes prestados del modo menor
//   e incluye dominantes secundarios.
// - Devuelve triadas en formato MIDI para análisis y generación
//   de voicings.
// - Ofrece nombres textuales de acordes para la interfaz.
//
// Se utiliza como base para:
// - Cálculo de triadas en el motor de audio.
// - Cálculo de costos de voice leading.
// - Etiquetado de acordes en componentes de UI.
// --------------------------------------------------

// 12 tonalidades mayores soportadas por el motor
export type TonalKey =
  | "C" | "C#" | "D" | "D#" | "E" | "F"
  | "F#" | "G" | "G#" | "A" | "A#" | "B";

// Grados romanos contemplados (triadas)
export type RomanDegree =
  // Diatónicos en modo mayor
  | "I" | "ii" | "iii" | "IV" | "V" | "vi" | "vii°"
  // Prestados del modo menor
  | "bIII" | "iv" | "bVI" | "bVII"
  // Dominantes secundarios
  | "V/ii" | "V/iii" | "V/IV" | "V/V" | "V/vi";

// Escala mayor en semitonos desde la tónica
// Grados: I, ii, iii, IV, V, vi, vii°
const MAJOR_SCALE: number[] = [0, 2, 4, 5, 7, 9, 11];

// Mapa tonalidad → nota MIDI de la tónica
// Se toma C3 = 60 como referencia para facilitar el uso con el sampler.
const KEY_TO_MIDI: Record<TonalKey, number> = {
  C: 60,  "C#": 61,
  D: 62,  "D#": 63,
  E: 64,
  F: 65,  "F#": 66,
  G: 67,  "G#": 68,
  A: 69,  "A#": 70,
  B: 71,
};

function keyToMidiRoot(key: TonalKey): number {
  return KEY_TO_MIDI[key] ?? 60; // Fallback a C3 si la tonalidad no se encuentra
}

/**
 * Devuelve los intervalos de triada (en semitonos) según la calidad
 * implícita del grado romano.
 *
 * - Triadas mayores: [0, 4, 7]
 * - Triadas menores: [0, 3, 7]
 * - Triada disminuida: [0, 3, 6]
 */
function degreeQuality(degree: RomanDegree): number[] {
  switch (degree) {
    // Triadas mayores
    case "I":
    case "IV":
    case "V":
    case "bIII":
    case "bVI":
    case "bVII":
    case "V/ii":
    case "V/iii":
    case "V/IV":
    case "V/V":
    case "V/vi":
      return [0, 4, 7];

    // Triadas menores
    case "ii":
    case "iii":
    case "vi":
    case "iv":
      return [0, 3, 7];

    // Disminuido
    case "vii°":
      return [0, 3, 6];

    // Fallback: triada mayor (no debería utilizarse si RomanDegree está bien tipado)
    default:
      return [0, 4, 7];
  }
}

/**
 * Devuelve el offset de la fundamental (en semitonos desde la tónica)
 * según el grado romano.
 *
 * Se trabaja sobre la escala mayor y se ajusta para acordes prestados
 * y dominantes secundarios.
 */
function degreeRootOffset(degree: RomanDegree): number {
  switch (degree) {
    // Diatónicos en modo mayor
    case "I":    return MAJOR_SCALE[0]; // 0
    case "ii":   return MAJOR_SCALE[1]; // 2
    case "iii":  return MAJOR_SCALE[2]; // 4
    case "IV":   return MAJOR_SCALE[3]; // 5
    case "V":    return MAJOR_SCALE[4]; // 7
    case "vi":   return MAJOR_SCALE[5]; // 9
    case "vii°": return MAJOR_SCALE[6]; // 11

    // Prestados de la paralela menor (descrito para C mayor como referencia)
    //   iv   → Fm   → usa el mismo grado que IV
    //   bIII → Eb   → un semitono por debajo de E (4 - 1 = 3)
    //   bVI  → Ab   → un semitono por debajo de A (9 - 1 = 8)
    //   bVII → Bb   → un semitono por debajo de B (11 - 1 = 10)
    case "iv":   return MAJOR_SCALE[3];
    case "bIII": return (MAJOR_SCALE[2] - 1 + 12) % 12;
    case "bVI":  return (MAJOR_SCALE[5] - 1 + 12) % 12;
    case "bVII": return (MAJOR_SCALE[6] - 1 + 12) % 12;

    // Dominantes secundarios (V del grado correspondiente)
    // Ejemplo conceptual en C mayor:
    //   V/ii = una quinta justa (7 semitonos) por encima del grado ii.
    case "V/ii":  return (MAJOR_SCALE[1] + 7) % 12;
    case "V/iii": return (MAJOR_SCALE[2] + 7) % 12;
    case "V/IV":  return (MAJOR_SCALE[3] + 7) % 12;
    case "V/V":   return (MAJOR_SCALE[4] + 7) % 12;
    case "V/vi":  return (MAJOR_SCALE[5] + 7) % 12;

    default:
      return 0;
  }
}

/**
 * Conversor principal Roman → triada en MIDI.
 *
 * Devuelve un arreglo [fundamental, tercera, quinta] en número MIDI
 * para el grado y tonalidad especificados.
 */
export function romanToMidiTriad(
  key: TonalKey,
  degree: RomanDegree
): number[] {
  const keyRoot = keyToMidiRoot(key);
  const offset = degreeRootOffset(degree);
  const intervals = degreeQuality(degree); // [0,4,7], [0,3,7], [0,3,6]

  const root = keyRoot + offset;
  return intervals.map((i) => root + i);
}

/**
 * Convierte un número MIDI a nombre de nota en formato texto,
 * por ejemplo: 60 → "C4", 61 → "C#4".
 */
export function midiToNoteName(midi: number): string {
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${names[pc]}${octave}`;
}

/**
 * Devuelve un nombre textual de acorde a partir de una tonalidad
 * y un grado romano, utilizando:
 *
 * - La fundamental de la triada (sin la octava).
 * - Un sufijo de calidad: "m" para acordes menores, "°" para disminuidos.
 *
 * Ejemplos:
 * - degreeToChordName("C", "ii")  → "Dm"
 * - degreeToChordName("G", "V")   → "D"
 */
export function degreeToChordName(
  key: TonalKey,
  degree: RomanDegree
): string {
  const triad = romanToMidiTriad(key, degree);
  const rootName = midiToNoteName(triad[0]);

  const quality = (() => {
    if (degree.includes("°")) return "°";
    if (["ii","iii","vi","iv"].includes(degree)) return "m";
    return ""; // triada mayor
  })();

  // Eliminar la octava del nombre (C4 → C, F#3 → F#)
  return rootName.replace(/\d+$/, "") + quality;
}
