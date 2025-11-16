// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Conversión de grados a notas (triadas)
// --------------------------------------------------
// Este módulo actúa como adaptador entre la notación funcional
// (grado en números romanos) y las notas concretas empleadas por
// el motor de audio.
//
// Comportamiento:
// - Si la tonalidad y el grado están soportados por el motor
//   teórico PRO (roman2), se calculan triadas en formato MIDI
//   y luego se convierten a nombres de nota ("C4", "E4", etc.).
// - Si no se puede utilizar roman2 (por tonalidad o grado no
//   contemplado), se recurre a un motor manual para tonalidades
//   mayores básicas: C, G, D y F.
//
// De este modo se mantiene compatibilidad con el código previo,
// mientras se aprovechan las mejoras del motor teórico PRO.
// --------------------------------------------------

import {
  romanToMidiTriad,
  midiToNoteName,
  type TonalKey,
  type RomanDegree,
} from "./roman2";

/**
 * Lista de tonalidades admitidas por el motor PRO.
 */
const TONAL_KEYS: TonalKey[] = [
  "C","C#","D","D#","E","F","F#","G","G#","A","A#","B",
];

function isValidTonalKey(k: string): k is TonalKey {
  return TONAL_KEYS.includes(k as TonalKey);
}

/**
 * Conjunto de grados soportados por el motor PRO.
 * Debe mantenerse consistente con RomanDegree en roman2.
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
 * Devuelve las notas de la triada asociada a un grado dado en una
 * tonalidad mayor, en formato de nombre de nota ("C4", "E4", "G4").
 *
 * Estrategia:
 * - Intentar primero el motor teórico PRO (roman2) para tonalidades
 *   y grados soportados.
 * - Si no es posible (error o grado no contemplado), utilizar un
 *   motor manual diatónico para C, G, D y F mayor.
 */
export function chordNotesFromDegree(key: string, degree: string): string[] {
  // 1) Intentar usar el motor PRO
  if (isValidTonalKey(key) && isValidRomanDegree(degree)) {
    try {
      const midis = romanToMidiTriad(key as TonalKey, degree as RomanDegree);
      // Conversión a nombres de nota aceptados por Tone.Sampler
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
    default:     return triad(0); // Si el grado no se reconoce, se asume I
  }
}
