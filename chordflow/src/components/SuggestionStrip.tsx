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
    <section className="panel suggestion-strip" style={{ fontSize: 13 }}>
      <div className="suggestion-strip-header">
        <span className="suggestion-strip-title">
          Sugerencias según estilo <strong>{style}</strong> (desde{" "}
          <strong>{currentDegree}</strong>):
        </span>
      </div>

      <div className="suggestion-strip-chips">
        {suggestions.map((s) => (
          <button
  key={s.degree}
  onClick={() => onApplySuggestion(s.degree)}
  className="chip"
>
  <span style={{ fontWeight: 600 }}>{s.degree}</span>
  <span style={{ fontSize: 11, opacity: 0.8 }}>{s.explanation}</span>
</button>

        ))}
      </div>
    </section>
  );
};

export default SuggestionStrip;
