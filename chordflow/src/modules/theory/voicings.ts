// --------------------------------------------------
// 🎹 ChordFlow — Voicings (drop-2 + voice leading)
// --------------------------------------------------
// - drop2(): baja la 2ª voz desde arriba una octava
// - smoothVoiceLeading(): agrupa el siguiente acorde
//   cerca del anterior (cluster suave)
// --------------------------------------------------

/** Modos de voicing disponibles (para futuro) */
export type VoicingMode = "closed" | "drop2";

/** Nota parseada: pitch class + octave + midi */
type ParsedNote = {
  pc: string;
  octave: number;
  midi: number;
};

// Mapeo simple de pc → semitonos (C=0)
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

function parseNote(note: string): ParsedNote {
  const m = note.match(/^([A-G][b#]?)(\d)$/);
  if (!m) {
    // fallback tosco: C4
    return { pc: "C", octave: 4, midi: 60 };
  }
  const pc = m[1];
  const octave = parseInt(m[2], 10);
  const semis = PC_MAP[pc] ?? 0;
  const midi = (octave + 1) * 12 + semis;
  return { pc, octave, midi };
}

function toNote(pc: string, midi: number): string {
  // reconstruimos octave desde midi
  const octave = Math.floor(midi / 12) - 1;
  return `${pc}${octave}`;
}

/** Ordena notas de grave a agudo */
function sortByPitch(notes: string[]): ParsedNote[] {
  return notes.map(parseNote).sort((a, b) => a.midi - b.midi);
}

/**
 * drop-2: baja la segunda voz más aguda una octava
 * (si hay menos de 3 notas, devuelve igual)
 */
export function drop2(notes: string[]): string[] {
  if (notes.length < 3) return notes.slice();

  const parsed = sortByPitch(notes);
  const idx = parsed.length - 2; // 2ª voz desde arriba
  parsed[idx] = {
    ...parsed[idx],
    midi: parsed[idx].midi - 12,
  };

  // reordenar de grave a agudo
  const reSorted = [...parsed].sort((a, b) => a.midi - b.midi);
  return reSorted.map((n) => toNote(n.pc, n.midi));
}

/**
 * Ajusta el siguiente acorde cerca del anterior
 * manteniendo un cluster suave (voice leading).
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

  // Para cada nota del siguiente, buscamos la octava más cercana al cluster anterior
  const voiced = nextParsed.map((n) => {
    let bestMidi = n.midi;
    let bestDist = Math.abs(n.midi - avgPrev);

    // probamos desplazamientos de ±2 octavas
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

  // Ordenar y devolver
  const reSorted = voiced.sort((a, b) => a.midi - b.midi);
  return reSorted.map((n) => toNote(n.pc, n.midi));
}

/**
 * Aplicador genérico de voicing (para crecer después).
 * Por ahora usamos closed (tal cual) o drop2.
 */
export function applyVoicing(
  notes: string[],
  mode: VoicingMode = "closed"
): string[] {
  if (mode === "drop2") return drop2(notes);
  return notes.slice();
}
