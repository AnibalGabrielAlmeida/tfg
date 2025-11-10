// --------------------------------------------------
// 💬 ChordFlow — Explicaciones cortas de sugerencias
// --------------------------------------------------
// Dado un movimiento from→to y el estilo,
// genera un texto breve (≤ ~140 caract) que combine:
//
// - Función tonal básica (T/S/D)
// - Transición entre funciones (reposo → tensión, etc.)
// - Regla Berklee si aplica (ii–V, backdoor, intercambio modal…)
//
// Pensado para usarse en el SuggestionPanel / tooltips.
// --------------------------------------------------

import { functionalRoleMajor } from "../theory/functions";
import { getBerkleeExplanation } from "../theory/berklee";
import type { Style } from "./markov";

export interface SuggestionExplanationParams {
  fromDegree: string; // grado actual (I, ii, V, bVII, etc.)
  toDegree: string;   // grado sugerido
  style: Style;       // "Pop" | "Neo"
}

type Role = "T" | "S" | "D";

/** Texto corto para cada rol funcional */
function roleLabel(role: Role): string {
  switch (role) {
    case "T": return "tónica";
    case "S": return "subdominante";
    case "D": return "dominante";
    default:  return "tónica";
  }
}

/** Breve descripción del tipo de movimiento T/S/D */
function transitionLabel(fromRole: Role, toRole: Role): string {
  if (fromRole === "S" && toRole === "D") {
    return "preparación → tensión (cadencia)";
  }
  if (fromRole === "D" && toRole === "T") {
    return "tensión → reposo (resolución)";
  }
  if (fromRole === "T" && toRole === "S") {
    return "reposo → preparación";
  }
  if (fromRole === "T" && toRole === "D") {
    return "reposo → tensión";
  }
  if (fromRole === toRole) {
    return "variación dentro de la misma función";
  }
  return "movimiento funcional típico";
}

/** Etiqueta corta para el estilo */
function styleLabel(style: Style): string {
  return style === "Pop" ? "estilo Pop" : "estilo Neo";
}

/**
 * Genera una explicación corta para el movimiento from→to.
 * Ejemplos:
 *  - "ii (S) → V (D): preparación → tensión (cadencia)."
 *  - "IVm7 → I: backdoor (Berklee)."
 */
export function getSuggestionExplanation(
  params: SuggestionExplanationParams
): string {
  const { fromDegree, toDegree, style } = params;

  // Funciones tonales básicas (modo mayor por ahora)
  const fromRole = functionalRoleMajor(fromDegree) as Role;
  const toRole = functionalRoleMajor(toDegree) as Role;

  const fromTag = `${fromDegree} (${roleLabel(fromRole)})`;
  const toTag = `${toDegree} (${roleLabel(toRole)})`;

  // Intentar primero explicación específica Berklee
  const berkleeText = getBerkleeExplanation(fromDegree, toDegree);

  if (berkleeText) {
    // Ej.: "ii (subdominante) → V (dominante): ii prepara V (predominante → dominante)."
    return `${fromTag} → ${toTag}: ${berkleeText}.`;
  }

  // Si no hay regla Berklee, usamos solo función tonal + estilo
  const trans = transitionLabel(fromRole, toRole);
  const styleTxt = styleLabel(style);

  // Ej.: "I (tónica) → vi (subdominante): reposo → preparación (estilo Pop)."
  return `${fromTag} → ${toTag}: ${trans} (${styleTxt}).`;
}
