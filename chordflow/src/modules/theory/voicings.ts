// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Voicings (drop-2 y voice leading suave)
// --------------------------------------------------
// Este módulo define utilidades para generar voicings de acordes
// y suavizar el movimiento entre ellos:
//
// - drop2(): aplica la técnica clásica de drop-2 sobre una triada
//   o acorde cerrado, bajando la segunda voz más aguda una octava.
// - smoothVoiceLeading(): ajusta el siguiente acorde para que quede
//   próximo al anterior, favoreciendo un "cluster" compacto y un
//   voice leading más suave.
//
// Se trabaja con nombres de nota tipo "C4", "F#3", etc., y se
// convierte internamente a número MIDI para poder comparar alturas.
// --------------------------------------------------

/** Modos de voicing disponibles (extensible a futuro). */
export type VoicingMode = "closed" | "drop2";

/** Representación interna de una nota: pitch class, octava y valor MIDI. */
type ParsedNote = {
  pc: string;
  octave: number;
  midi: number;
};

// Mapeo simple de pitch class → semitonos (C = 0)
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

/**
 * Convierte una nota textual (por ejemplo "C4", "F#3") a su
 * representación interna con pitch class, octava y valor MIDI.
 * En caso de no poder parsear, devuelve un valor por defecto (C4).
 */
function parseNote(note: string): ParsedNote {
  const m = note.match(/^([A-G][b#]?)(\d)$/);
  if (!m) {
    // Fallback simple y seguro
    return { pc: "C", octave: 4, midi: 60 };
  }
  const pc = m[1];
  const octave = parseInt(m[2], 10);
  const semis = PC_MAP[pc] ?? 0;
  const midi = (octave + 1) * 12 + semis;
  return { pc, octave, midi };
}

/**
 * Reconstruye una nota textual a partir de la pitch class y el
 * valor MIDI, calculando la octava correspondiente.
 */
function toNote(pc: string, midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${pc}${octave}`;
}

/**
 * Ordena una lista de notas (texto) de grave a agudo utilizando
 * su valor MIDI como referencia.
 */
function sortByPitch(notes: string[]): ParsedNote[] {
  return notes.map(parseNote).sort((a, b) => a.midi - b.midi);
}

/**
 * Aplica el voicing drop-2: toma el acorde ordenado de grave a agudo
 * y baja una octava la segunda voz más aguda.
 *
 * Si el acorde tiene menos de tres notas, se devuelve una copia sin cambios.
 */
export function drop2(notes: string[]): string[] {
  if (notes.length < 3) return notes.slice();

  const parsed = sortByPitch(notes);
  const idx = parsed.length - 2; // segunda voz desde arriba
  parsed[idx] = {
    ...parsed[idx],
    midi: parsed[idx].midi - 12,
  };

  // Reordenar de grave a agudo tras el desplazamiento
  const reSorted = [...parsed].sort((a, b) => a.midi - b.midi);
  return reSorted.map((n) => toNote(n.pc, n.midi));
}

/**
 * Genera un voicing suave para el siguiente acorde a partir del
 * acorde anterior, manteniendo las notas próximas en altura.
 *
 * Estrategia:
 * - Calcula el centro de alturas del acorde anterior (promedio MIDI).
 * - Para cada nota del nuevo acorde, busca la octava más cercana a ese
 *   centro, probando desplazamientos de hasta ±2 octavas.
 * - Devuelve el resultado ordenado de grave a agudo.
 */
export function smoothVoiceLeading(
  prev: string[],
  nextRaw: string[]
): string[] {
  if (!prev.length) return drop2(nextRaw);

  const prevParsed = sortByPitch(prev);
  const nextParsed = nextRaw.map(parseNote);

  // Centro promedio del acorde anterior
  const avgPrev =
    prevParsed.reduce((sum, n) => sum + n.midi, 0) / prevParsed.length;

  // Para cada nota del siguiente acorde se busca la octava más cercana
  const voiced = nextParsed.map((n) => {
    let bestMidi = n.midi;
    let bestDist = Math.abs(n.midi - avgPrev);

    // Probar desplazamientos de ±2 octavas
    for (let k = -2; k <= 2; k++) {
      const candidate = n.midi + 12 * k;
      const dist = Math.abs(candidate - avgPrev);
      if (dist < bestDist) {
        bestDist = dist;
        bestMidi = candidate;
      }
    }
    return { ...n, midi: bestMidi };
  });

  const reSorted = voiced.sort((a, b) => a.midi - b.midi);
  return reSorted.map((n) => toNote(n.pc, n.midi));
}

/**
 * Aplicador genérico de voicing.
 *
 * Por ahora admite:
 * - "closed": devuelve el acorde tal como llega.
 * - "drop2": aplica la transformación de drop-2 definida arriba.
 *
 * El diseño del tipo VoicingMode permite incorporar más variantes
 * en futuras extensiones (por ejemplo, drop-3, inversiones, etc.).
 */
export function applyVoicing(
  notes: string[],
  mode: VoicingMode = "closed"
): string[] {
  if (mode === "drop2") return drop2(notes);
  return notes.slice();
}
