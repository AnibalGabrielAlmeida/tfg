export type RomanDegree = "I" | "ii" | "iii" | "IV" | "V" | "vi" | "vii°";

export type ChordBlock = {
  id: string;              // identificador único
  degree: RomanDegree;     // grado (romanos)
  durationBeats: number;   // duración en beats (4 = compás entero en 4/4)
};

export function barsUsage(blocks: ChordBlock[]) {
  const usage: number[] = [];
  let cursor = 0;
  for (const b of blocks) {
    const bar = Math.floor(cursor / 4);
    usage[bar] = (usage[bar] ?? 0) + b.durationBeats;
    cursor += b.durationBeats;
  }
  return usage; // ej: [4, 4, 3, ...]
}
export function exceedsAnyBar(blocks: ChordBlock[]) {
  return barsUsage(blocks).some(u => (u ?? 0) > 4);
}
