// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Componente: SuggestionPanel (vista educativa)
// --------------------------------------------------
// Panel lateral que presenta sugerencias de acordes en función de:
//
// - La tonalidad seleccionada.
// - El estilo actual (p. ej. pop, neo-soul, etc.).
// - El grado actual dentro de la progresión.
//
// Muestra información educativa sobre función tonal (T/S/D),
// nivel de tensión (reposo / transición / tensión) y una breve
// explicación teórica o estilística para cada sugerencia.
//
// Además, expone acciones para:
// - Agregar la sugerencia a la progresión.
// - Pre-escuchar una transición sugerida (si se provee onPreviewSuggestion).
// --------------------------------------------------

import { useMemo, useState } from "react";
import type { Style } from "../modules/recommendation/markov";
import { getScoredSuggestions } from "../modules/recommendation/scoring";
import { getFullSuggestionExplanation } from "../modules/recommendation/explanations";
import { functionalRoleMajor } from "../modules/theory/functions";
import InfoTooltip from "./InfoTooltip";

type Props = {
  /** Estilo armónico activo (define el comportamiento del motor de recomendación) */
  style: Style;

  /** Tonalidad actual (ej.: "C", "G", "F#") */
  keyName: string;

  /** Grado actual de la progresión (en notación romana) */
  currentDegree: string;

  /** Callback para aplicar la sugerencia seleccionada a la progresión */
  onApplySuggestion: (degree: string) => void;

  /**
   * Opcional: callback para pre-escuchar solo la sugerencia
   * antes de insertarla en la progresión.
   */
  onPreviewSuggestion?: (degree: string) => void;
};

type FunctionalRole = "T" | "S" | "D";

// Etiquetas legibles para la función tonal
const ROLE_LABEL: Record<FunctionalRole, string> = {
  T: "Tónica",
  S: "Subdominante",
  D: "Dominante",
};

// Etiquetas simplificadas de tensión asociadas a cada función
const ROLE_TENSION: Record<FunctionalRole, string> = {
  T: "Reposo",
  S: "Transición",
  D: "Tensión",
};

export default function SuggestionPanel({
  style,
  keyName,
  currentDegree,
  onApplySuggestion,
  onPreviewSuggestion,
}: Props) {
  const [tab, setTab] = useState<"theory" | "style">("theory");

  // Calcula las sugerencias ponderadas según el estilo, tonalidad y grado actual
  const suggestions = useMemo(
    () =>
      getScoredSuggestions({
        style,
        key: keyName,
        currentDegree,
        alpha: 1,
        limit: 3,
      }),
    [style, keyName, currentDegree]
  );

  const currentRole = functionalRoleMajor(currentDegree) as FunctionalRole;

  const titleLine = `Contexto: ${keyName} mayor · Grado actual: ${currentDegree}`;

  const getRoleClass = (role: FunctionalRole) => {
    return `badge-role badge-role-${role}`;
  };

  return (
    <section className="panel suggestion-panel">
      {/* Encabezado: pestañas + contexto armónico */}
      <header className="suggestion-panel-header">
        <div className="suggestion-panel-header-main">
          <div className="suggestion-panel-tabs">
            <button
              type="button"
              className={`tab ${tab === "theory" ? "tab-active" : ""}`}
              onClick={() => setTab("theory")}
            >
              Teoría
            </button>
            <button
              type="button"
              className={`tab ${tab === "style" ? "tab-active" : ""}`}
              onClick={() => setTab("style")}
            >
              Estilo
            </button>
          </div>

          <p className="suggestion-panel-context">
            {titleLine} · Función:{" "}
            <span className={getRoleClass(currentRole)}>
              {ROLE_LABEL[currentRole]}
            </span>
          </p>
        </div>

        <InfoTooltip text="Estas sugerencias se basan en la tonalidad y el estilo actual. Usalas para explorar tensión (D), transición (S) y reposo (T) de manera guiada.">
          <span className="help-icon" aria-label="Ayuda" role="button">
            ?
          </span>
        </InfoTooltip>
      </header>

      {/* Mensaje en caso de no contar con sugerencias válidas */}
      {suggestions.length === 0 && (
        <p className="text-soft" style={{ fontSize: 12 }}>
          No hay sugerencias disponibles para este punto de la progresión.
        </p>
      )}

      {/* Lista de sugerencias generadas por el motor de recomendación */}
      <div className="suggestion-panel-list">
        {suggestions.map((sug) => {
          const role = functionalRoleMajor(sug.degree) as FunctionalRole;
          const full = getFullSuggestionExplanation({
            style,
            fromDegree: currentDegree,
            toDegree: sug.degree,
          });

          return (
            <article
              key={sug.degree}
              className={`suggestion-card role-${role}`}
            >
              {/* Columna principal: grado, función, nivel de tensión y descripción */}
              <div className="suggestion-card-main">
                <div className="suggestion-card-header-row">
                  <span className="suggestion-degree">{sug.degree}</span>
                  <span className={getRoleClass(role)}>{ROLE_LABEL[role]}</span>
                  <span className="badge-tension">{ROLE_TENSION[role]}</span>
                </div>
                <p className="suggestion-description">{full.short}</p>

                {/* Línea secundaria según la pestaña activa (teoría/estilo) */}
                {tab === "theory" ? (
                  <p className="suggestion-meta">
                    {full.full.func} · {full.full.movement}
                  </p>
                ) : (
                  <p className="suggestion-meta">
                    {full.full.styleUsage}
                  </p>
                )}
              </div>

              {/* Acciones por sugerencia: pre-escuchar y agregar a la progresión */}
              <div className="suggestion-card-actions">
                {onPreviewSuggestion && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Escuchar sugerencia"
                    onClick={() => onPreviewSuggestion(sug.degree)}
                  >
                    🔊
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => onApplySuggestion(sug.degree)}
                >
                  Agregar
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Nota educativa al pie sobre el flujo funcional básico */}
      <p className="note-bar">
        Recordá la regla funcional básica:{" "}
        <strong>T → S → D → T</strong>. Probá moverte de la tónica hacia
        subdominante y dominante para crear tensión, y volver a T para resolver.
      </p>
    </section>
  );
}
