// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Componente: ProgressionItem
// --------------------------------------------------
// Representa visualmente un bloque individual dentro de la progresión
// armónica. Cada ítem:
//
// - Muestra el grado, su función tonal (T/S/D) y el número de compás.
// - Puede reordenarse mediante drag & drop (dnd-kit).
// - Destaca el ítem actualmente activo durante la reproducción.
// - Permite eliminar el bloque mediante un botón de acción.
//
// Este componente se integra con ProgressionList, que se encarga de
// proveer el contexto de orden y la referencia externa para el scroll.
// --------------------------------------------------

import React, { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ChordBlock } from "../modules/progression/types";
import { getFullExplanation } from "../modules/recommendation/explanations";
import { functionalRoleMajor } from "../modules/theory/functions";

export type ProgressionItemProps = {
  /** Bloque de acorde que se va a renderizar */
  block: ChordBlock;

  /** Función tonal del bloque (Tónica, Subdominante o Dominante) */
  role: "T" | "S" | "D";

  /** Índice de compás dentro de la progresión (0-based) */
  barIndex: number;

  /** Posición dentro del compás (reservado para futuras extensiones) */
  beatInBar: number;

  /** Callback para modificar la duración del bloque en beats */
  onChangeDuration: (id: string, newBeats: number) => void;

  /** Callback para eliminar el bloque de la progresión */
  onDelete: (id: string) => void;

  /** Indica si el bloque está activo (por ejemplo, en reproducción) */
  isActive?: boolean;
};

// Etiquetas legibles para la función tonal
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
      //beatInBar, actualmente no se muestra en la interfaz
      //onChangeDuration, reservado para futuras extensiones
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

    // Combina la referencia interna de dnd-kit con la referencia externa
    // que recibe desde ProgressionList (para manejo de scroll, etc.).
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
        {/* Sección principal arrastrable del bloque */}
        <div className="progression-item-main" {...attributes} {...listeners}>
          {/* Izquierda: grado, función y número de compás */}
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

        {/* Acciones del bloque (no arrastrables) */}
        <div className="progression-actions">
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(block.id);
            }}
            title="Eliminar"
          >
            {/* Icono de papelera para la acción de eliminar */}
            <svg width="12" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="10"
                y1="11"
                x2="10"
                y2="17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="14"
                y1="11"
                x2="14"
                y2="17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </li>
    );
  }
);

export default ProgressionItem;
