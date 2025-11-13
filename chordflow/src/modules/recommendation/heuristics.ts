// --------------------------------------------------
// 🧮 ChordFlow — Heurísticas de voice-leading
// --------------------------------------------------
// Soporta notas como string ("C4") o como número MIDI (60).
// Internamente todo se convierte a MIDI para medir distancias.
// --------------------------------------------------

/**
 * Convierte "C4", "F#3", "Bb5" o un número MIDI a número MIDI.
 * C4 = 60.
 */
export function noteToMidi(note: string | number): number {
  // 🔹 Si ya viene como número (MIDI), lo usamos directo
  if (typeof note === "number") {
    return note;
  }

  // 🔹 Si es string, usamos el parser original
  const m = note.match(/^([A-G][b#]?)(-?\d+)$/);
  if (!m) {
    // fallback tosco pero seguro
    return 60; // C4
  }
  const pc = m[1];
  const octave = parseInt(m[2], 10);

  const PC_MAP: Record<string, number> = {
    C: 0,
    "C#": 1, Db: 1,
    D: 2,
    "D#": 3, Eb: 3,
    E: 4,
    F: 5,
    "F#": 6, Gb: 6,
    G: 7,
    "G#": 8, Ab: 8,
    A: 9,
    "A#": 10, Bb: 10,
    B: 11,
  };

  const semis = PC_MAP[pc] ?? 0;
  const midi = (octave + 1) * 12 + semis;
  return midi;
}

/**
 * Devuelve solo la "pitch class" (C, D#, Bb...),
 * ignorando la octava.
 *
 * Soporta string ("C4") o número MIDI (60).
 */
export function getPitchClass(note: string | number): string {
  // Si es número MIDI, usamos modulo 12
  if (typeof note === "number") {
    const midiToPc = [
      "C", "C#", "D", "D#", "E", "F",
      "F#", "G", "G#", "A", "A#", "B",
    ];
    const idx = ((note % 12) + 12) % 12;
    return midiToPc[idx];
  }

  // Si es string, extraemos la parte de pitch
  const m = note.match(/^([A-G][b#]?)/);
  return m ? m[1] : "C";
}

/**
 * Distancia media (en semitonos) entre dos acordes.
 * Tomamos el promedio de las notas de origen y destino
 * y medimos la diferencia entre los centros.
 *
 * Soporta arrays de strings o de números.
 */
export function getAverageDistance(
  fromNotes: Array<string | number>,
  toNotes: Array<string | number>
): number {
  if (!fromNotes.length || !toNotes.length) return 0;

  const fromMidis = fromNotes.map(noteToMidi);
  const toMidis = toNotes.map(noteToMidi);

  const avg = (xs: number[]) =>
    xs.reduce((s, x) => s + x, 0) / xs.length;

  const fromAvg = avg(fromMidis);
  const toAvg = avg(toMidis);

  return Math.abs(toAvg - fromAvg);
}

/**
 * Cuenta cuántas pitch classes tienen en común
 * (sin considerar octava). Ej.: C4–E4–G4 y C3–G3
 * comparten 2 (C y G).
 *
 * Soporta arrays de strings o de números.
 */
export function countCommonPitchClasses(
  fromNotes: Array<string | number>,
  toNotes: Array<string | number>
): number {
  const fromSet = new Set(fromNotes.map(getPitchClass));
  const toSet = new Set(toNotes.map(getPitchClass));

  let count = 0;
  fromSet.forEach((pc) => {
    if (toSet.has(pc)) count++;
  });
  return count;
}

/**
 * Calcula un costo de voice-leading:
 *
 * - Base por distancia media de centros:
 *   - ≤4 semitonos → costo 0
 *   - 4–8          → costo 1
 *   - >8           → costo 2
 *
 * - Si hay notas en común:
 *   - restamos 0.5 al costo (mínimo 0).
 *
 * Soporta arrays de strings o de números.
 */
export function getVoiceLeadingCost(
  fromNotes: Array<string | number>,
  toNotes: Array<string | number>
): number {
  const dist = getAverageDistance(fromNotes, toNotes);
  let cost = 0;

  if (dist <= 4) {
    cost = 0;
  } else if (dist <= 8) {
    cost = 1;
  } else {
    cost = 2;
  }

  const commons = countCommonPitchClasses(fromNotes, toNotes);
  if (commons > 0) {
    cost -= 0.5;
  }

  // nunca negativo
  return Math.max(0, cost);
}
