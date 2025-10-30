import type { ChordBlock } from "../progression/types";

export type SimplePreset = {
  title: string;
  key: "C" | "G" | "D" | "F";      // ajustado a tus keys actuales
  bpm: number;
  style: "Pop" | "Neo";
  progression: ChordBlock[];
};

// Pop clásico: I–vi–IV–V (4 beats c/u)
export function getPopPreset(): SimplePreset {
  return {
    title: "Pop — I–vi–IV–V",
    key: "C",
    bpm: 100,
    style: "Pop",
    progression: [
      { id: "b1", degree: "I",  durationBeats: 4 },
      { id: "b2", degree: "vi", durationBeats: 4 },
      { id: "b3", degree: "IV", durationBeats: 4 },
      { id: "b4", degree: "V",  durationBeats: 4 },
    ],
  };
}

// Neo simple (diatónico para tu motor actual): ii–V–I–vi
export function getNeoPreset(): SimplePreset {
  return {
    title: "Neo — ii–V–I–vi",
    key: "C",
    bpm: 86,
    style: "Neo",
    progression: [
      { id: "b1", degree: "ii", durationBeats: 4 },
      { id: "b2", degree: "V",  durationBeats: 4 },
      { id: "b3", degree: "I",  durationBeats: 4 },
      { id: "b4", degree: "vi", durationBeats: 4 },
    ],
  };
}
