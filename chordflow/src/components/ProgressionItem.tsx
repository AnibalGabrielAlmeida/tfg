// components/ProgressionItem.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ChordBlock } from "../modules/progression/types";
import { getFullExplanation } from "../modules/recommendation/explanations";
import { functionalRoleMajor } from "../modules/theory/functions";

export type ProgressionItemProps = {
  block: ChordBlock;
  role: "T" | "S" | "D";
  barIndex: number;
  beatInBar: number;
  onChangeDuration: (id: string, newBeats: number) => void;
  onDelete: (id: string) => void;
};

function stylesForRole(r: "T" | "S" | "D") {
  switch (r) {
    case "T":
      return {
        background: "rgba(37,99,235,0.18)",
        border: "1px solid #60a5fa",
        color: "#dbeafe",
      };
    case "S":
      return {
        background: "rgba(5,150,105,0.18)",
        border: "1px solid #34d399",
        color: "#d1fae5",
      };
    case "D":
    default:
      return {
        background: "rgba(220,38,38,0.18)",
        border: "1px solid #f87171",
        color: "#fee2e2",
      };
  }
}

const ProgressionItem: React.FC<ProgressionItemProps> = ({
  block,
  role,
  barIndex,
  beatInBar,
  onChangeDuration,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.id });

  const roleStyles = stylesForRole(role);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
    ...roleStyles,
  };

  const full = getFullExplanation(block.degree);
  const funcLabel = functionalRoleMajor(block.degree);

  return (
    <li 
    ref={setNodeRef} 
    className="card progression-item" 
    style={style} 
    title={
      `${block.degree} (${funcLabel})\n` +
      `${full.origin}\n` +
      `${full.color}\n` +
      `${full.styleUsage}`
    }>
      {/* 🔹 Zona draggeable grande: grado + duración + métrica */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          flex: 1,
          alignItems: "center",
        }}
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
          <div style={{ fontSize: 13, lineHeight: 1.2 }}>
            {role}
            <span
              style={{
                fontSize: 10,
                opacity: 0.7,
                marginLeft: 4,
              }}
            >
              ⠿
            </span>
          </div>
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
      </div>

      {/* 🔸 Zona NO draggeable: solo borrar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={(e) => {
            e.stopPropagation(); // que no empuje drag
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
