// components/ProgressionItem.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ChordBlock } from "../modules/progression/types";

export type ProgressionItemProps = {
  block: ChordBlock;
  role: "T" | "S" | "D";
  barIndex: number;
  beatInBar: number;
  onChangeDuration: (id: string, newBeats: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

function bgForRole(r: "T" | "S" | "D") {
  return r === "T" ? "#1e3a8a" : r === "S" ? "#166534" : "#7f1d1d";
}

const ProgressionItem: React.FC<ProgressionItemProps> = ({
  block,
  role,
  barIndex,
  beatInBar,
  onChangeDuration,
  onDuplicate,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: bgForRole(role),
    cursor: "grab",
  };

  return (
    <li
      ref={setNodeRef}
      className="card progression-item"
      style={style}
      {...attributes}
      {...listeners}
    >
      {/* IZQ: grado + función */}
      <div style={{ minWidth: 80 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: "bold",
            lineHeight: 1.2,
          }}
        >
          {block.degree}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.2 }}>{role}</div>
      </div>

      {/* CENTRO: duración */}
      <div style={{ minWidth: 100 }}>
        <label style={{ fontSize: 12 }}>
          duración:&nbsp;
          <select
            value={block.durationBeats}
            onChange={(e) =>
              onChangeDuration(block.id, parseInt(e.target.value, 10))
            }
          >
            <option value={1}>1 beat</option>
            <option value={2}>2 beats</option>
            <option value={4}>4 beats</option>
          </select>
        </label>
        <div
          style={{
            fontSize: 12,
            opacity: 0.7,
            lineHeight: 1.2,
            marginTop: 4,
          }}
        >
          total: {block.durationBeats} beats
        </div>
      </div>

      {/* DER: métrica (compás/beat) */}
      <div style={{ minWidth: 120, textAlign: "right" }}>
        <div style={{ fontSize: 12, lineHeight: 1.2 }}>
          compás {barIndex + 1}
        </div>
        <div
          style={{
            fontSize: 12,
            opacity: 0.7,
            lineHeight: 1.2,
          }}
        >
          beat {beatInBar + 1} de 4
        </div>
      </div>

      {/* Acciones por bloque */}
      <div
        style={{
          display: "flex",
          gap: 8,
          fontSize: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(block.id);
          }}
        >
          Duplicar
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
        >
          🗑
        </button>
      </div>
    </li>
  );
};

export default ProgressionItem;
