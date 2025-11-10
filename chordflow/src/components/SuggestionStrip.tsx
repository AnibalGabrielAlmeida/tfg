import React from "react";
import type { Style } from "../modules/recommendation/markov";
import { useSuggestions } from "../modules/recommendation/useSuggestions";

type SuggestionStripProps = {
  style: Style;
  keyName: string;
  currentDegree: string | null;
  onApplySuggestion: (degree: string) => void;
};

const SuggestionStrip: React.FC<SuggestionStripProps> = ({
  style,
  keyName,
  currentDegree,
  onApplySuggestion,
}) => {
  const suggestions = useSuggestions({ style, keyName, currentDegree });

  if (!currentDegree || suggestions.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        marginTop: 16,
        padding: 8,
        borderRadius: 8,
        background: "#111827",
        border: "1px solid #1f2933",
        color: "#e5e7eb",
        fontSize: 13,
      }}
    >
      <div style={{ marginBottom: 8, opacity: 0.9 }}>
        Sugerencias según estilo <strong>{style}</strong> (desde{" "}
        <strong>{currentDegree}</strong>):
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {suggestions.map((s) => (
          <button
            key={s.degree}
            onClick={() => onApplySuggestion(s.degree)}
            style={{
              borderRadius: 999,
              border: "1px solid #374151",
              padding: "4px 10px",
              background: "#111827",
              color: "#e5e7eb",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 600 }}>{s.degree}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{s.explanation}</div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default SuggestionStrip;
