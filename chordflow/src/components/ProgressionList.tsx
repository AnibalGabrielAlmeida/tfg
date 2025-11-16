// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// --------------------------------------------------
// Componente: ProgressionList
// --------------------------------------------------
// Renderiza y gestiona la lista principal de bloques de acordes de una
// progresión armónica. Permite:
//
// - Reordenar acordes mediante drag & drop (dnd-kit).
// - Mantener enfocado en pantalla el bloque actualmente activo.
// - Propagar cambios de duración y eliminación al componente padre.
//
// Este componente funciona como contenedor de <ProgressionItem /> y se
// apoya en la matriz de funciones tonales para mostrar información
// educativa asociada a cada acorde.
// --------------------------------------------------

import { useEffect, useRef } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import type { ChordBlock } from "../modules/progression/types";
import { functionalRoleMajor } from "../modules/theory/functions";
import ProgressionItem from "./ProgressionItem";

export type ProgressionListProps = {
  /** Lista de bloques de acordes que conforman la progresión actual */
  progression: ChordBlock[];

  /** Identificador del bloque actualmente activo (por ejemplo, en reproducción) */
  activeBlockId?: string | null;

  /** Callback para actualizar el orden de los bloques luego de un drag & drop */
  onReorder: (activeId: string, overId: string) => void;

  /** Callback para actualizar la duración (en beats) de un bloque */
  onChangeDuration: (id: string, newBeats: number) => void;

  /**
   * Callback para duplicar un bloque existente.
   * Se expone para posibles extensiones futuras de la interfaz.
   */
  onDuplicate: (id: string) => void;

  /** Callback para eliminar un bloque de la progresión */
  onDelete: (id: string) => void;
};

export default function ProgressionList({
  progression,
  activeBlockId,
  onReorder,
  onChangeDuration,
  //onDuplicate,
  onDelete,
}: ProgressionListProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  // Referencias a cada ítem para poder hacer scroll hacia el bloque activo
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    if (!activeBlockId) return;
    const el = itemRefs.current[activeBlockId];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeBlockId]);

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={progression.map((b) => b.id)}
        strategy={horizontalListSortingStrategy}
      >
        <ul className="progression-list">
          {progression.map((block, index) => {
            const role = functionalRoleMajor(block.degree);
            const barIndex = index; // El compás puede interpretarse como índice + 1 en la capa de presentación

            return (
              <ProgressionItem
                key={block.id}
                ref={(el) => {
                  itemRefs.current[block.id] = el;
                }}
                block={block}
                role={role}
                barIndex={barIndex}
                beatInBar={0}
                isActive={block.id === activeBlockId}
                onChangeDuration={onChangeDuration}
                onDelete={onDelete}
              />
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
