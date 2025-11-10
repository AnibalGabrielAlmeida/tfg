import { useMemo } from "react";
import type { Style } from "./markov";
import { getScoredSuggestions } from "./scoring";
import { getSuggestionExplanation } from "./explanations";

export interface UISuggestion {
  degree: string;
  score: number;
  explanation: string;
}

interface UseSuggestionsParams {
  style: Style;
  keyName: string;
  currentDegree: string | null;
  limit?: number;
}

/**
 * Hook de alto nivel para la UI:
 * devuelve el top-N de sugerencias con explicación corta.
 */
export function useSuggestions({
  style,
  keyName,
  currentDegree,
  limit = 3,
}: UseSuggestionsParams): UISuggestion[] {
  return useMemo(() => {
    if (!currentDegree) return [];

    const scored = getScoredSuggestions({
      style,
      key: keyName,
      currentDegree,
      alpha: style === "Pop" ? 1 : 0, // por ahora Pop=1, Neo=0
      limit,
    });

    return scored.map((s) => ({
      degree: s.degree,
      score: s.score,
      explanation: getSuggestionExplanation({
        fromDegree: currentDegree,
        toDegree: s.degree,
        style,
      }),
    }));
  }, [style, keyName, currentDegree, limit]);
}
