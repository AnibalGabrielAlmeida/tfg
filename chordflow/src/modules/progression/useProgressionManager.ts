import { useState, useRef, useMemo } from "react";
import type { ChordBlock } from "./types";
import { barsUsage, exceedsAnyBar } from "./types";
import { arrayMove } from "@dnd-kit/sortable";
import { getBarWarnings } from "./metrics";

// Progresión inicial (la misma que tenías en App)
const INITIAL_PROGRESSION: ChordBlock[] = [
  { id: "b1", degree: "I",  durationBeats: 4 },
  { id: "b2", degree: "vi", durationBeats: 4 },
  { id: "b3", degree: "IV", durationBeats: 4 },
  { id: "b4", degree: "V",  durationBeats: 4 },
];

export function useProgressionManager() {
  const nextIdRef = useRef<number>(INITIAL_PROGRESSION.length + 1);
  const [progression, setProgression] = useState<ChordBlock[]>(
    INITIAL_PROGRESSION
  );

  // --- Helpers derivados ---
  const barWarnings = useMemo(
    () => getBarWarnings(progression),
    [progression]
  );

  const lastBlock = progression[progression.length - 1] ?? null;
  const suggestionBaseDegree = lastBlock?.degree ?? "I";

  // --- CRUD con validación 4/4 ---

  // Cambiar duración de bloque (manteniendo compás válido)
  function updateBlockDuration(id: string, newBeats: number) {
    setProgression((prev) => {
      const next = prev.map((b) =>
        b.id === id ? { ...b, durationBeats: newBeats } : b
      );
      return exceedsAnyBar(next) ? prev : next;
    });
  }

  // Agregar bloque nuevo, con wrap inteligente 4/4
  function addBlock() {
    setProgression((prev) => {
      const newBlock: ChordBlock = {
        id: `b${nextIdRef.current++}`,
        degree: "I",
        durationBeats: 4,
      };

      const candidate: ChordBlock[] = [...prev, newBlock];
      if (!exceedsAnyBar(candidate)) return candidate;

      const lastUsage = barsUsage(prev).at(-1) ?? 0;
      const dur = lastUsage <= 3 ? 1 : 4;

      const wrapped: ChordBlock = {
        id: `b${nextIdRef.current++}`,
        degree: "I",
        durationBeats: dur,
      };
      return [...prev, wrapped];
    });
  }

  function duplicateBlock(id: string) {
    setProgression((prev) => {
      const original = prev.find((b) => b.id === id);
      if (!original) return prev;

      const newId = `b${nextIdRef.current++}`;
      const clone: ChordBlock = { ...original, id: newId };
      const idx = prev.findIndex((b) => b.id === id);
      const copy = prev.slice();
      copy.splice(idx + 1, 0, clone);
      return exceedsAnyBar(copy) ? prev : copy;
    });
  }

  function deleteBlock(id: string) {
    setProgression((prev) => prev.filter((b) => b.id !== id));
  }

  function handleReorder(activeId: string, overId: string) {
    setProgression((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === activeId);
      const newIndex = prev.findIndex((b) => b.id === overId);
      const next = arrayMove(prev, oldIndex, newIndex);
      return exceedsAnyBar(next) ? prev : next;
    });
  }

  // Append genérico (para sugerencias, presets, etc.)
  function appendBlockWithDegree(
    degree: ChordBlock["degree"],
    durationBeats: number = 4
  ) {
    setProgression((prev) => {
      const newBlock: ChordBlock = {
        id: `b${nextIdRef.current++}`,
        degree,
        durationBeats,
      };
      const candidate = [...prev, newBlock];
      return exceedsAnyBar(candidate) ? prev : candidate;
    });
  }

  // Reemplazar progresión completa (desde presets / librería)
  function setFromPreset(blocks: ChordBlock[]) {
    // reindexa ids y actualiza nextIdRef
    let n = 1;
    const reId = blocks.map((b) => ({
      ...b,
      id: `b${n++}`,
    }));
    nextIdRef.current = n;
    setProgression(reId);
  }

  return {
    progression,
    barWarnings,
    lastBlock,
    suggestionBaseDegree,
    addBlock,
    updateBlockDuration,
    duplicateBlock,
    deleteBlock,
    handleReorder,
    appendBlockWithDegree,
    setFromPreset,
  };
}
