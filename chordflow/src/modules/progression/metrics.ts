// src/modules/progression/metrics.ts
import type { ChordBlock } from "./types";

export function getBarWarnings(blocks: ChordBlock[]) {
let beatCursor = 0;
    const barUsage: Record<number, number> = {};
    for (const b of blocks) {
      const bar = Math.floor(beatCursor / 4);
      barUsage[bar] = (barUsage[bar] || 0) + b.durationBeats;
      beatCursor += b.durationBeats;
    }
    return Object.entries(barUsage)
      .filter(([_, beats]) => beats > 4)
      .map(([bar, beats]) => ({ bar: Number(bar) + 1, beats }));
  }