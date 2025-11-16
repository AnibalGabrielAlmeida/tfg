// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: useProgressionManager — Gestión de la progresión armónica
// --------------------------------------------------
// Este hook administra el estado interno de la progresión de acordes,
// incluyendo:
//
// - Progresión inicial por defecto (I–vi–IV–V).
// - Altas, bajas, duplicación y reordenamiento de bloques.
// - Control de duración de cada bloque con validación métrica en 4/4.
// - Cálculo de advertencias por compás (cuando se exceden los 4 beats).
// - Cálculo del grado base para sugerencias (último bloque de la progresión).
//
// Se utiliza como fuente única de verdad para la progresión que se muestra
// en la interfaz y la que se envía al motor de audio.
// --------------------------------------------------

import { useState, useRef, useMemo } from "react";
import type { ChordBlock } from "./types";
import { barsUsage, exceedsAnyBar } from "./types";
import { arrayMove } from "@dnd-kit/sortable";
import { getBarWarnings } from "./metrics";

// Progresión inicial por defecto utilizada al cargar la aplicación
const INITIAL_PROGRESSION: ChordBlock[] = [
  { id: "b1", degree: "I",  durationBeats: 4 },
  { id: "b2", degree: "vi", durationBeats: 4 },
  { id: "b3", degree: "IV", durationBeats: 4 },
  { id: "b4", degree: "V",  durationBeats: 4 },
];

/**
 * Hook responsable de gestionar la progresión actual y sus operaciones
 * de edición. Aplica validación métrica básica para mantener compases
 * consistentes en 4/4.
 */
export function useProgressionManager() {
  const nextIdRef = useRef<number>(INITIAL_PROGRESSION.length + 1);
  const [progression, setProgression] = useState<ChordBlock[]>(
    INITIAL_PROGRESSION
  );

  // Advertencias de compases que superan el límite de beats permitidos
  const barWarnings = useMemo(
    () => getBarWarnings(progression),
    [progression]
  );

  // Último bloque de la progresión y grado base sugerido
  const lastBlock = progression[progression.length - 1] ?? null;
  const suggestionBaseDegree = lastBlock?.degree ?? "I";

  // --------------------------------------------------
  // Operaciones CRUD con validación métrica 4/4
  // --------------------------------------------------

  /**
   * Actualiza la duración de un bloque específico, manteniendo
   * la métrica válida. Si el cambio hace que algún compás exceda
   * los 4 beats, se descarta la modificación.
   */
  function updateBlockDuration(id: string, newBeats: number) {
    setProgression((prev) => {
      const next = prev.map((b) =>
        b.id === id ? { ...b, durationBeats: newBeats } : b
      );
      return exceedsAnyBar(next) ? prev : next;
    });
  }

  /**
   * Agrega un nuevo bloque al final de la progresión.
   * Aplica una lógica simple de "wrap" para evitar que el último compás
   * exceda los 4 beats:
   * - Si el último compás tiene 3 beats o menos, se agrega un bloque de 1 beat.
   * - En caso contrario, se agrega un bloque completo de 4 beats.
   */
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

  /**
   * Duplica un bloque existente y lo inserta inmediatamente después
   * del original. Si la nueva disposición excede el límite métrico,
   * la operación se descarta.
   */
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

  /**
   * Elimina un bloque de la progresión a partir de su identificador.
   */
  function deleteBlock(id: string) {
    setProgression((prev) => prev.filter((b) => b.id !== id));
  }

  /**
   * Reordena la progresión mediante drag & drop utilizando arrayMove.
   * Si el nuevo orden viola la métrica de 4/4, el cambio se deshace.
   */
  function handleReorder(activeId: string, overId: string) {
    setProgression((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === activeId);
      const newIndex = prev.findIndex((b) => b.id === overId);
      const next = arrayMove(prev, oldIndex, newIndex);
      return exceedsAnyBar(next) ? prev : next;
    });
  }

  /**
   * Agrega un nuevo bloque con el grado indicado (por ejemplo,
   * desde el panel de sugerencias o el banco de acordes), siempre
   * que no exceda el límite métrico de 4/4.
   */
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

  /**
   * Reemplaza la progresión completa a partir de una lista de bloques
   * (por ejemplo, al cargar un preset o un elemento de la biblioteca).
   * Reasigna los identificadores para mantener una numeración coherente.
   */
  function setFromPreset(blocks: ChordBlock[]) {
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
