// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: useSuggestions — Sugerencias listas para la interfaz
// --------------------------------------------------
// Este hook actúa como una capa de integración entre el motor de
// recomendación armónica (Markov + Berklee + voice leading) y la UI.
//
// Combina tres elementos:
//
// 1) getScoredSuggestions → genera el top-N ordenado según score total.
// 2) getSuggestionExplanation → genera una explicación corta T/S/D.
// 3) Formato reducido para consumo directo por la interfaz.
//
// El resultado es un arreglo de sugerencias simplificadas que se pueden
// renderizar en paneles, tooltips o componentes auxiliares.
// --------------------------------------------------

import { useMemo } from "react";
import type { Style } from "./markov";
import { getScoredSuggestions } from "./scoring";
import { getSuggestionExplanation } from "./explanations";

export interface UISuggestion {
  /** Grado sugerido (I, ii, V, bVII, etc.) */
  degree: string;

  /** Score total basado en modelo híbrido (Markov + Berklee − voice leading) */
  score: number;

  /** Explicación corta en lenguaje funcional (tónica, subdominante, etc.) */
  explanation: string;
}

interface UseSuggestionsParams {
  /** Estilo armónico activo ("Pop" | "Neo") */
  style: Style;

  /** Tonalidad actual del proyecto */
  keyName: string;

  /** Grado actual desde el cual se sugieren movimientos */
  currentDegree: string | null;

  /** Cantidad de sugerencias a devolver */
  limit?: number;
}

/**
 * Hook orientado a la capa de interfaz.
 * Devuelve un conjunto reducido de sugerencias armónicas
 * con su score global y una explicación funcional breve.
 *
 * Si no hay grado actual, retorna un arreglo vacío.
 */
export function useSuggestions({
  style,
  keyName,
  currentDegree,
  limit = 3,
}: UseSuggestionsParams): UISuggestion[] {
  return useMemo(() => {
    if (!currentDegree) return [];

    // 1) Obtener sugerencias del motor avanzado
    const scored = getScoredSuggestions({
      style,
      key: keyName,
      currentDegree,
      alpha: style === "Pop" ? 1 : 0, // En esta versión, Pop = 1, Neo = 0
      limit,
    });

    // 2) Transformar resultado en formato apto para la UI
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
