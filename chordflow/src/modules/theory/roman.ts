// --------------------------------------------------
// 🎵 ChordFlow — Conversión de grados a notas (triadas)
// --------------------------------------------------
// Adaptador hacia el motor teórico PRO (romanPro).
// - Si la tonalidad y el grado son soportados por romanPro
//   (I, ii, iii, IV, V, vi, vii°, bIII, iv, bVI, bVII, V/ii...)
//   se usan triadas calculadas en MIDI y convertidas a "C4", etc.
// - Si no, se usa el viejo sistema manual para C, G, D, F mayor.
// --------------------------------------------------

import {
  romanToMidiTriad,
  midiToNoteName,
  type TonalKey,
  type RomanDegree,
} from "./roman2";

/**
 * Chequea si una key string está dentro de TonalKey.
 */
const TONAL_KEYS: TonalKey[] = [
  "C","C#","D","D#","E","F","F#","G","G#","A","A#","B",
];

function isValidTonalKey(k: string): k is TonalKey {
  return TONAL_KEYS.includes(k as TonalKey);
}

/**
 * Conjunto de grados soportados por el motor PRO.
 * (Debe coincidir con RomanDegree en romanPro.ts)
 */
const ROMAN_DEGREES: RomanDegree[] = [
  "I","ii","iii","IV","V","vi","vii°",
  "bIII","iv","bVI","bVII",
  "V/ii","V/iii","V/IV","V/V","V/vi",
];

function isValidRomanDegree(d: string): d is RomanDegree {
  return ROMAN_DEGREES.includes(d as RomanDegree);
}

/**
 * Versión extendida de chordNotesFromDegree:
 * - Intenta usar romanPro para cualquier tonalidad mayor
 *   y grado incluido en RomanDegree.
 * - Si no, cae al motor manual original (C, G, D, F diatónicos).
 */
export function chordNotesFromDegree(key: string, degree: string): string[] {
  // 1) Intentar usar el motor PRO
  if (isValidTonalKey(key) && isValidRomanDegree(degree)) {
    try {
      const midis = romanToMidiTriad(key as TonalKey, degree as RomanDegree);
      // Convertimos a "C4", "E4", etc. (Tone.Sampler lo acepta perfecto)
      return midis.map(midiToNoteName);
    } catch (e) {
      console.warn("[roman] Error usando romanPro, fallback al motor manual:", e);
    }
  }

  // 2) Fallback: motor manual original para C, G, D, F
  const scales: Record<string, string[]> = {
    C: ["C", "D", "E", "F", "G", "A", "B"],
    G: ["G", "A", "B", "C", "D", "E", "F#"],
    D: ["D", "E", "F#", "G", "A", "B", "C#"],
    F: ["F", "G", "A", "Bb", "C", "D", "E"],
  };

  const scale = scales[key] || scales["C"];

  const triad = (rootIndex: number): string[] => {
    const note = (i: number) => scale[(rootIndex + i) % 7];
    return [
      `${note(0)}4`,
      `${note(2)}4`,
      `${note(4)}4`,
    ];
  };

  switch (degree) {
    case "I":    return triad(0);
    case "ii":   return triad(1);
    case "iii":  return triad(2);
    case "IV":   return triad(3);
    case "V":    return triad(4);
    case "vi":   return triad(5);
    case "vii°": return triad(6);
    default:     return triad(0); // fallback a I si el grado no se reconoce
  }
}
