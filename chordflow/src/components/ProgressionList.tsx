// components/ProgressionList.tsx
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
  progression: ChordBlock[];
  activeBlockId?: string | null;
  onReorder: (activeId: string, overId: string) => void;
  onChangeDuration: (id: string, newBeats: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function ProgressionList({
  progression,
  activeBlockId,
  onReorder,
  onChangeDuration,
  onDuplicate, // queda para futuro
  onDelete,
}: ProgressionListProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

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
            const barIndex = index; // compás = índice + 1

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
