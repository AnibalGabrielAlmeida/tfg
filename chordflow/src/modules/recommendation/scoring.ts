// --------------------------------------------------
// 🧠 ChordFlow — Motor de score armónico PRO
// --------------------------------------------------
// Combina 3 fuentes de información:
//
// 1) Markov (Pop/Neo) → probabilidad / estilo
// 2) Berklee (getBerkleeBoost) → riqueza teórica
// 3) Heurísticas de voice-leading → suavidad de movimiento
//
// Devuelve un top-N de sugerencias con score detallado
// listo para usar en la UI (SuggestionPanel, etc.).
// --------------------------------------------------

import { chordNotesFromDegree } from "../theory/roman";
import { getBerkleeBoost } from "../theory/berklee";
import { getVoiceLeadingCost } from "./heuristics";
import { getBlendedMarkovRow } from "./markov";
import type { Style } from "./markov";


export interface SuggestionScore {
  degree: string;         // grado sugerido (I, ii, V, bVII, etc.)
  score: number;          // score total combinado
  markovWeight: number;   // peso base de Markov
  berkleeBoost: number;   // bonus teórico
  voiceLeadingCost: number; // costo por movimiento brusco
}

/**
 * Calcula el top-N de sugerencias armónicas desde un grado actual,
 * en una tonalidad y estilo dados.
 *
 * - style: "Pop" | "Neo"
 * - key: tonalidad (C, G, D, F...)
 * - currentDegree: grado actual (I, ii, V, etc.)
 * - alpha: mezcla de estilos Pop/Neo (α·Pop + (1–α)·Neo)
 * - limit: cuántas sugerencias devolver (ej. 3)
 */
export function getScoredSuggestions(params: {
  style: Style;
  key: string;
  currentDegree: string;
  alpha?: number;
  limit?: number;
}): SuggestionScore[] {
  const { style, key, currentDegree, alpha = 1, limit = 3 } = params;

  // 1) Fila Markov mezclada según estilo/alpha
  const row = getBlendedMarkovRow(style, currentDegree, alpha);

  // Si no hay datos Markov para este grado, no sugerimos nada
  const entries = Object.entries(row);
  if (!entries.length) return [];

  // 2) Notas del acorde actual (para heurísticas)
  const fromNotes = chordNotesFromDegree(key, currentDegree);

  // 3) Construimos score por candidato
  const scored: SuggestionScore[] = entries.map(([deg, weight]) => {
    const toNotes = chordNotesFromDegree(key, deg);
    const berklee = getBerkleeBoost(currentDegree, deg);
    const vlCost = getVoiceLeadingCost(fromNotes, toNotes);

    const totalScore = weight + berklee - vlCost;

    return {
      degree: deg,
      score: totalScore,
      markovWeight: weight,
      berkleeBoost: berklee,
      voiceLeadingCost: vlCost,
    };
  });

  // 4) Ordenar por score descendente y devolver top-N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
