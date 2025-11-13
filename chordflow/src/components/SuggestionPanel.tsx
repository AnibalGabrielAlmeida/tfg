import { useMemo, useState } from "react";
import type { Style } from "../modules/recommendation/markov";
import { getScoredSuggestions } from "../modules/recommendation/scoring";
import { getFullSuggestionExplanation } from "../modules/recommendation/explanations";
import { functionalRoleMajor } from "../modules/theory/functions";

type Props = {
  style: Style;
  keyName: string;
  currentDegree: string;
  onApplySuggestion: (degree: string) => void;
};

export default function SuggestionPanel({
  style,
  keyName,
  currentDegree,
  onApplySuggestion,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = useMemo(
    () =>
      getScoredSuggestions({
        style,
        key: keyName,
        currentDegree,
        alpha: 1,
        limit: 4,
      }),
    [style, keyName, currentDegree]
  );

  const titleLine = `Recomendaciones para la posición actual — Tonalidad: ${keyName} mayor`;

  const getFunctionColor = (degree: string) => {
    const f = functionalRoleMajor(degree);
    if (f === "T") return "#1e3a8a"; // azul
    if (f === "S") return "#166534"; // verde
    return "#7f1d1d"; // dominante / tensión
  };

  return (
    <section className="panel suggestion-strip" style={{ fontSize: 13 }}>
      {/* Header + toggle */}
      <header
        className="suggestion-strip-header"
        style={{ marginBottom: isOpen ? 8 : 0 }}
      >
        <span className="suggestion-strip-title">{titleLine}</span>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? "Ocultar explicación" : "Ver explicación"}
        </button>
      </header>

      {!isOpen && (
        <p className="text-soft" style={{ marginTop: 4 }}>
          Usá “Ver explicación” para ver por qué se sugieren estos acordes.
        </p>
      )}

      {isOpen && (
        <div className="suggestion-strip-list">
          {suggestions.map((sug) => {
            const func = functionalRoleMajor(sug.degree);
            const color = getFunctionColor(sug.degree);
            const full = getFullSuggestionExplanation({
              style,
              fromDegree: currentDegree,
              toDegree: sug.degree,
            });

            return (
              <div
                key={sug.degree}
                className="card-suggestion"
                style={{ borderColor: color }}
                title={
                  `${full.full.origin}\n` +
                  `${full.full.func}\n` +
                  `${full.full.movement}\n` +
                  `${full.full.color}\n` +
                  `${full.full.styleUsage}`
                }
              >
                {/* Columna izquierda: grado + función */}
                <div style={{ minWidth: 90 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 2,
                      color,
                    }}
                  >
                    {sug.degree}
                  </div>
                  <div className="text-soft" style={{ fontSize: 11 }}>
                    Función: {func}
                  </div>
                </div>

                {/* Columna central: explicación corta */}
                <div style={{ flex: 1, fontSize: 12 }}>
                  {full.short}
                </div>

                {/* Columna derecha: botón Insertar */}
                <div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => onApplySuggestion(sug.degree)}
                  >
                    Insertar
                  </button>
                </div>
              </div>
            );
          })}

          <p className="note-bar">
            Nota: al insertar, el acorde se adapta a la tonalidad y función
            armónica vigentes.
          </p>
        </div>
      )}
    </section>
  );
}
