// ---------------------------------------------
// 🎼 Motor teórico "pro" para RomanNumerals
// ---------------------------------------------
// - Soporta 12 tonalidades mayores
// - Diatónicos, prestados del modo menor,
//   y dominantes secundarios (triadas).
// - Devuelve triadas en MIDI para análisis
//   y nombres textuales para la UI.
// ---------------------------------------------

// 12 tonalidades mayores (por ahora sin bemoles separados)
export type TonalKey =
  | "C" | "C#" | "D" | "D#" | "E" | "F"
  | "F#" | "G" | "G#" | "A" | "A#" | "B";

// RomanDegree ampliado (triadas)
export type RomanDegree =
  // Diatónicos mayor
  | "I" | "ii" | "iii" | "IV" | "V" | "vi" | "vii°"
  // Prestados del modo menor
  | "bIII" | "iv" | "bVI" | "bVII"
  // Dominantes secundarios
  | "V/ii" | "V/iii" | "V/IV" | "V/V" | "V/vi";

// Escala mayor en semitonos desde la tónica
// Grados: I, ii, iii, IV, V, vi, vii°
const MAJOR_SCALE: number[] = [0, 2, 4, 5, 7, 9, 11];

// Mapa Key → nota MIDI de la tónica (C3 = 60 por comodidad con tu sampler)
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
  return KEY_TO_MIDI[key] ?? 60; // fallback a C3
}

/* ---------------------------------------------
   Intervalos según "calidad" implícita del grado
   (triadas mayores, menores, disminuidas)
   --------------------------------------------- */
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
      // 1–3–5
      return [0, 4, 7];

    // Triadas menores
    case "ii":
    case "iii":
    case "vi":
    case "iv":
      // 1–b3–5
      return [0, 3, 7];

    // Disminuido
    case "vii°":
      // 1–b3–b5
      return [0, 3, 6];

    // Fallback: mayor (no debería pasar si RomanDegree está bien)
    default:
      return [0, 4, 7];
  }
}

/* ---------------------------------------------
   Offset de la fundamental según el grado
   (en semitonos desde la tónica)
   --------------------------------------------- */
function degreeRootOffset(degree: RomanDegree): number {
  switch (degree) {
    // Diatónicos (modo mayor)
    case "I":    return MAJOR_SCALE[0]; // 0
    case "ii":   return MAJOR_SCALE[1]; // 2
    case "iii":  return MAJOR_SCALE[2]; // 4
    case "IV":   return MAJOR_SCALE[3]; // 5
    case "V":    return MAJOR_SCALE[4]; // 7
    case "vi":   return MAJOR_SCALE[5]; // 9
    case "vii°": return MAJOR_SCALE[6]; // 11

    // Prestados (paralelo menor)
    // En C mayor:
    //   iv   → Fm  → mismo grado que IV
    //   bIII → Eb  → semitono abajo de E (4 - 1 = 3)
    //   bVI  → Ab  → semitono abajo de A (9 - 1 = 8)
    //   bVII → Bb  → semitono abajo de B (11 - 1 = 10)
    case "iv":   return MAJOR_SCALE[3];
    case "bIII": return (MAJOR_SCALE[2] - 1 + 12) % 12;
    case "bVI":  return (MAJOR_SCALE[5] - 1 + 12) % 12;
    case "bVII": return (MAJOR_SCALE[6] - 1 + 12) % 12;

    // Dominantes secundarios (V de cada grado diatónico)
    // Idea: V/ii = una 5ª justa (7 semitonos) por encima del grado ii
    case "V/ii":  return (MAJOR_SCALE[1] + 7) % 12;
    case "V/iii": return (MAJOR_SCALE[2] + 7) % 12;
    case "V/IV":  return (MAJOR_SCALE[3] + 7) % 12;
    case "V/V":   return (MAJOR_SCALE[4] + 7) % 12;
    case "V/vi":  return (MAJOR_SCALE[5] + 7) % 12;

    default:
      return 0;
  }
}

/* ---------------------------------------------
   Conversor principal: Roman → triada MIDI
   Devuelve [fundamental, 3ª, 5ª] en número MIDI.
   --------------------------------------------- */
export function romanToMidiTriad(
  key: TonalKey,
  degree: RomanDegree
): number[] {
  const keyRoot = keyToMidiRoot(key);        // C3, G3, etc.
  const offset = degreeRootOffset(degree);   // 0–11
  const intervals = degreeQuality(degree);   // [0,4,7], [0,3,7], [0,3,6]

  const root = keyRoot + offset;
  return intervals.map((i) => root + i);
}

/* ---------------------------------------------
   MIDI → nombre de nota (C3, F#4, etc.)
   --------------------------------------------- */
export function midiToNoteName(midi: number): string {
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${names[pc]}${octave}`;
}

/* ---------------------------------------------
   Para la UI: Roman → nombre textual del acorde
   (solo raíz + indicación m / ° según grado)
   --------------------------------------------- */
export function degreeToChordName(
  key: TonalKey,
  degree: RomanDegree
): string {
  const triad = romanToMidiTriad(key, degree);
  const rootName = midiToNoteName(triad[0]);

  const quality = (() => {
    if (degree.includes("°")) return "°";
    if (["ii","iii","vi","iv"].includes(degree)) return "m";
    return ""; // mayor
  })();

  return rootName.replace(/\d+$/, "") + quality;
}
