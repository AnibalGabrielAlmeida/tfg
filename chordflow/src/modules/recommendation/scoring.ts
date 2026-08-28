// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Motor de score armónico avanzado 
// --------------------------------------------------
// Este módulo combina tres fuentes de información para evaluar
// sugerencias armónicas y devolver un top-N listo para la interfaz:
//
// 1) Modelo Markov (Pop / Neo) → probabilidad y afinidad estilística.
// 2) Reglas Berklee (getBerkleeBoost) → coherencia teórica y riqueza armónica.
// 3) Heurísticas de voice leading → suavidad del movimiento entre acordes.
//
// El resultado es una lista de candidatos con un score total y
// desglose de contribuciones (Markov, Berklee y costo de voice leading),
// utilizada en componentes como SuggestionPanel.
// --------------------------------------------------

// El motor roman original de teoría se reemplazó por roman2
// import { chordNotesFromDegree } from "../theory/roman";

import { getBerkleeBoost } from "../theory/berklee";
import { getVoiceLeadingCost } from "./heuristics";
import {
  getBlendedMarkovRow,
  applyPenalties,
  getSecondaryResolution,
} from "./markov";
import type { Style } from "./markov";

// Motor teórico actualizado (roman2)
import {
  romanToMidiTriad,
  type TonalKey,
  type RomanDegree,
} from "../theory/roman2";

export interface SuggestionScore {
  /** Grado sugerido (I, ii, V, bVII, etc.) */
  degree: string;

  /** Score total combinado (Markov + Berklee − costo de voice leading) */
  score: number;

  /** Peso base proveniente de la matriz Markov (afinidad estilística) */
  markovWeight: number;

  /** Incremento teórico según reglas Berklee (ii–V, backdoor, etc.) */
  berkleeBoost: number;

  /** Costo asociado a movimientos bruscos entre voicings (en semitonos) */
  voiceLeadingCost: number;
}

/**
 * Calcula un conjunto de sugerencias armónicas ordenadas por score total.
 *
 * Parámetros:
 * - style: estilo armónico ("Pop" | "Neo").
 * - key: tonalidad actual (C, G, D, F, etc.; mapeada a TonalKey).
 * - currentDegree: grado actual de la progresión (I, ii, V, etc.).
 * - history: grados de la progresión en orden, para penalizar bucles y
 *   repeticiones. Si se omite, sólo se considera el grado actual.
 * - alpha: mezcla de estilos Pop/Neo (alpha · Pop + (1 − alpha) · Neo).
 *   Por defecto se deriva del estilo: 1 para Pop, 0 para Neo.
 * - limit: cantidad máxima de sugerencias a devolver.
 */
export function getScoredSuggestions(params: {
  style: Style;
  key: string;
  currentDegree: string;
  history?: string[];
  alpha?: number;
  limit?: number;
}): SuggestionScore[] {
  const {
    style,
    key,
    currentDegree,
    history,
    alpha = style === "Pop" ? 1 : 0,
    limit = 3,
  } = params;

  // 1) Obtener fila Markov mezclada según estilo y alpha, y penalizarla
  //    con el historial reciente de la progresión
  const baseRow = getBlendedMarkovRow(style, currentDegree, alpha);
  const row = applyPenalties(baseRow, history?.length ? history : [currentDegree]);

  const entries = Object.entries(row);
  if (!entries.length) return [];

  // 2) Adaptar tonalidad y grado al motor teórico roman2
  const tonalKey = key as TonalKey;
  const currentDeg = currentDegree as RomanDegree;

  // Notas del acorde actual (triada en MIDI) para voice leading
  const fromNotes = romanToMidiTriad(tonalKey, currentDeg);

  // 3) Construir el score para cada candidato
  const scored: SuggestionScore[] = entries.map(([deg, weight]) => {
    const targetDeg = deg as RomanDegree;

    // Triada destino en MIDI usando el motor teórico PRO
    const toNotes = romanToMidiTriad(tonalKey, targetDeg);

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

  // 4) Ordenar por score descendente
  scored.sort((a, b) => b.score - a.score);

  // 5) Garantía de resolución: si el grado actual es un dominante
  //    secundario, su resolución encabeza la lista aunque el score no la
  //    hubiera dejado primera. Se hace antes de recortar, de modo que la
  //    resolución nunca puede quedar fuera del top-N.
  const resolution = getSecondaryResolution(currentDegree);
  if (resolution) {
    const idx = scored.findIndex((s) => s.degree === resolution);
    if (idx > 0) {
      const [item] = scored.splice(idx, 1);
      scored.unshift(item);
    }
  }

  return scored.slice(0, limit);
}
