// --------------------------------------------------
// 🎛️ ChordFlow — SuggestionPanel (vista educativa)
// --------------------------------------------------
// Panel lateral tipo "plugin".
// - Muestra contexto (tonalidad, grado actual, función T/S/D).
// - Lista sugerencias con color por función.
// - Indica tensión / resolución de forma simple.
// - Usa explicaciones de getFullSuggestionExplanation.
// - Botón 🔊 opcional para pre-escuchar cada sugerencia.
// --------------------------------------------------

import { useMemo, useState } from "react";
import type { Style } from "../modules/recommendation/markov";
import { getScoredSuggestions } from "../modules/recommendation/scoring";
import { getFullSuggestionExplanation } from "../modules/recommendation/explanations";
import { functionalRoleMajor } from "../modules/theory/functions";
import InfoTooltip from "./InfoTooltip";

type Props = {
  style: Style;
  keyName: string;
  currentDegree: string;
  onApplySuggestion: (degree: string) => void;
  // Opcional: para pre-escuchar la sugerencia sola
  onPreviewSuggestion?: (degree: string) => void;
};

type FunctionalRole = "T" | "S" | "D";

const ROLE_LABEL: Record<FunctionalRole, string> = {
  T: "Tónica",
  S: "Subdominante",
  D: "Dominante",
};

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
      {/* Header: tabs + contexto */}
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

      {/* Si no hay sugerencias, mensaje breve */}
      {suggestions.length === 0 && (
        <p className="text-soft" style={{ fontSize: 12 }}>
          No hay sugerencias disponibles para este punto de la progresión.
        </p>
      )}

      {/* Lista de sugerencias */}
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
              {/* Columna principal: grado + función + descripción */}
              <div className="suggestion-card-main">
                <div className="suggestion-card-header-row">
                  <span className="suggestion-degree">{sug.degree}</span>
                  <span className={getRoleClass(role)}>{ROLE_LABEL[role]}</span>
                  <span className="badge-tension">{ROLE_TENSION[role]}</span>
                </div>
                <p className="suggestion-description">{full.short}</p>

                {/* Línea extra según tab */}
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

              {/* Acciones: preview + insertar */}
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

      {/* Nota educativa al pie */}
      <p className="note-bar">
        Recordá la regla funcional básica:{" "}
        <strong>T → S → D → T</strong>. Probá moverte de la tónica hacia
        subdominante y dominante para crear tensión, y volver a T para resolver.
      </p>
    </section>
  );
}
