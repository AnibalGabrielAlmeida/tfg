// components/ProgressionItem.tsx
import React, { forwardRef } from "react";
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
  isActive?: boolean;
};

// Etiquetas legibles para la función
const ROLE_LABEL: Record<"T" | "S" | "D", string> = {
  T: "Tónica",
  S: "Subdominante",
  D: "Dominante",
};

const ProgressionItem = forwardRef<HTMLLIElement, ProgressionItemProps>(
  (
    {
      block,
      role,
      barIndex,
      beatInBar, // hoy no lo mostramos, queda para futuro
      onChangeDuration, // idem
      onDelete,
      isActive,
    },
    externalRef
  ) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: block.id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      cursor: "grab",
    };

    const full = getFullExplanation(block.degree);
    const funcLabel = functionalRoleMajor(block.degree);
    const roleClass = `progression-role-${role}`; // T / S / D
    const activeClass = isActive ? "progression-item--active" : "";
    const roleText = ROLE_LABEL[role];

    // combinamos ref de dnd-kit + ref que viene de ProgressionList
    const handleRef = (node: HTMLLIElement | null) => {
      setNodeRef(node);
      if (typeof externalRef === "function") {
        externalRef(node);
      } else if (externalRef) {
        (externalRef as React.MutableRefObject<HTMLLIElement | null>).current =
          node;
      }
    };

    return (
      <li
        ref={handleRef}
        className={`card progression-item ${roleClass} ${activeClass}`}
        style={style}
        title={
          `${block.degree} (${funcLabel})\n` +
          `${full.origin}\n` +
          `${full.color}\n` +
          `${full.styleUsage}`
        }
      >
        {/* Bloque principal draggeable */}
        <div className="progression-item-main" {...attributes} {...listeners}>
          {/* IZQ: grado + función + compás */}
          <div className="progression-chord">
            <div className="progression-degree">{block.degree}</div>

            <div className="progression-role">
              {roleText}
              <span className="progression-role-icon">⠿</span>
            </div>

            <div className="progression-compas">
              compás {barIndex + 1}
            </div>
          </div>
        </div>

        {/* Acciones (no drag) */}
        <div className="progression-actions">
          <button
            type="button"
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
  }
);

export default ProgressionItem;
