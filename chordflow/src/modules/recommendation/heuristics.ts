// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Heurísticas de voice leading
// --------------------------------------------------
// Este módulo define utilidades numéricas para evaluar la relación
// entre acordes a nivel de alturas (voicings). En particular:
//
// - Conversión de notas a número MIDI.
// - Obtención de pitch class ignorando octava.
// - Cálculo de distancia media entre acordes (en semitonos).
// - Conteo de pitch classes en común entre dos conjuntos de notas.
// - Cálculo de un costo de voice leading en función de distancia y notas comunes.
//
// Todas las funciones aceptan notas representadas como string ("C4")
// o como número MIDI (60).
// --------------------------------------------------

/**
 * Convierte una nota representada como string ("C4", "F#3", "Bb5")
 * o como número MIDI a un valor MIDI numérico.
 * Convención: C4 = 60.
 */
export function noteToMidi(note: string | number): number {
  // Si ya viene como número MIDI, se utiliza directamente
  if (typeof note === "number") {
    return note;
  }

  // Si es string, se parsea con notación de letra + alteración + octava
  const m = note.match(/^([A-G][b#]?)(-?\d+)$/);
  if (!m) {
    // Fallback seguro en caso de formato no reconocido
    return 60; // C4
  }
  const pc = m[1];
  const octave = parseInt(m[2], 10);

  const PC_MAP: Record<string, number> = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
  };

  const semis = PC_MAP[pc] ?? 0;
  const midi = (octave + 1) * 12 + semis;
  return midi;
}

/**
 * Devuelve únicamente la pitch class (C, D#, Bb, etc.),
 * ignorando la octava. Soporta notas como string o como
 * número MIDI.
 */
export function getPitchClass(note: string | number): string {
  // Para números MIDI se utiliza el resto módulo 12
  if (typeof note === "number") {
    const midiToPc = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const idx = ((note % 12) + 12) % 12;
    return midiToPc[idx];
  }

  // Para strings se extrae la parte de pitch (sin octava)
  const m = note.match(/^([A-G][b#]?)/);
  return m ? m[1] : "C";
}

/**
 * Calcula la distancia media en semitonos entre dos acordes,
 * entendidos como conjuntos de notas. Para ello:
 *
 * - Convierte cada nota a número MIDI.
 * - Calcula el promedio de las alturas en cada acorde.
 * - Devuelve el valor absoluto de la diferencia entre los promedios.
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
 * Cuenta cuántas pitch classes tienen en común dos acordes,
 * ignorando la octava. Por ejemplo, C4–E4–G4 y C3–G3
 * comparten dos pitch classes (C y G).
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
 * Calcula un costo de voice leading entre dos acordes a partir de:
 *
 * 1) Distancia media de centros (en semitonos):
 *    - ≤ 4 semitonos  → costo 0
 *    - 4–8 semitonos  → costo 1
 *    - > 8 semitonos  → costo 2
 *
 * 2) Notas en común:
 *    - Si existe al menos una pitch class en común, se resta 0.5
 *      al costo calculado (sin permitir valores negativos).
 *
 * El resultado es un valor numérico donde 0 indica una conexión
 * muy suave, y valores mayores indican un movimiento más abrupto.
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

  // El costo nunca debe ser negativo
  return Math.max(0, cost);
}
