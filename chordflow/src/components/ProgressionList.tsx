import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import type { ChordBlock } from "../modules/progression/types";
import { functionalRoleMajor } from "../modules/theory/functions";
import ProgressionItem from "./ProgressionItem";

export type ProgressionListProps = {
  progression: ChordBlock[];
  onReorder: (activeId: string, overId: string) => void;
  onChangeDuration: (id: string, newBeats: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function ProgressionList({
  progression,
  onReorder,
  onChangeDuration,
  onDuplicate,
  onDelete,
}: ProgressionListProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={progression.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="progression-list">
          {(() => {
            let beatCursor = 0;
            return progression.map((block) => {
              const role = functionalRoleMajor(block.degree);
              const barIndex = Math.floor(beatCursor / 4);
              const beatInBar = beatCursor % 4;
              beatCursor += block.durationBeats;

              return (
                <ProgressionItem
                  key={block.id}
                  block={block}
                  role={role}
                  barIndex={barIndex}
                  beatInBar={beatInBar}
                  onChangeDuration={onChangeDuration}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              );
            });
          })()}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
