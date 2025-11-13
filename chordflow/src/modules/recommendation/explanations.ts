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

export interface BriefExtraInfo {
  origin: string; // "Prestado del modo eólico"
  color: string;  // "Color oscuro/triste"
  styleHint: string; // "Típico en Neo-Soul"
}

export interface FullExplanation {
  origin: string;
  func: string;
  movement: string;
  color: string;
  styleUsage: string;
  contextual?: string; // relacion con el acorde anterior
}

// --------------------------------------------------
// Diccionario armónico básico (por grado)
// --------------------------------------------------

export const CHORD_INFO: Record<string, BriefExtraInfo> = {
  // --- Modales ---
  bIII: {
    origin: "Prestado del modo eólico",
    color: "Color cinematográfico / expansivo",
    styleHint: "Usado en pop moderno y progresivo",
  },
  bVI: {
    origin: "Prestado del modo eólico",
    color: "Color oscuro y profundo",
    styleHint: "Frecuente en Neo-Soul y R&B",
  },
  bVII: {
    origin: "Prestado del modo mixolidio",
    color: "Color modal fuerte",
    styleHint: "Típico en soul, funk y rock clásico",
  },
  iv: {
    origin: "Prestado del modo eólico (paralela menor)",
    color: "Color triste / emocional",
    styleHint: "Muy usado en Neo-Soul y baladas Pop",
  },

  // --- Dominantes secundarios ---
  "V/ii": {
    origin: "Dominante secundario → ii",
    color: "Tensión dirigida",
    styleHint: "Común en Pop, jazz tonal y gospel",
  },
  "V/iii": {
    origin: "Dominante secundario → iii",
    color: "Tensión mayor luminosa",
    styleHint: "Frecuente en Pop / R&B",
  },
  "V/IV": {
    origin: "Dominante secundario → IV",
    color: "Brillo clásico",
    styleHint: "Muy típico en Pop",
  },
  "V/V": {
    origin: "Dominante del dominante",
    color: "Tensión fuerte y clara",
    styleHint: "Estándar en progresiones cadenciales",
  },
  "V/vi": {
    origin: "Dominante secundario → vi",
    color: "Brillante / emotivo",
    styleHint: "Común en Pop y baladas",
  },

  // --- Diatónicos (breves genéricos) ---
  I: {
    origin: "Acorde de tónica",
    color: "Reposo / estabilidad",
    styleHint: "Presente en todos los géneros",
  },
  ii: {
    origin: "Subdominante",
    color: "Preparación suave",
    styleHint: "Clave en progresiones Pop y Jazz",
  },
  iii: {
    origin: "Tónica débil",
    color: "Color suave",
    styleHint: "Conecta I–vi",
  },
  IV: {
    origin: "Subdominante",
    color: "Apertura / brillo",
    styleHint: "Muy usado en Pop",
  },
  V: {
    origin: "Dominante",
    color: "Tensión clásica",
    styleHint: "Fundamental en cualquier cadencia",
  },
  vi: {
    origin: "Relativa menor",
    color: "Color melancólico suave",
    styleHint: "Muy común en Pop moderno",
  },
  "vii°": {
    origin: "Dominante débil",
    color: "Tensión ligera",
    styleHint: "Usado para conducir a I",
  },
};

// --------------------------------------------------
// Explicación completa (para tooltips extendidos)
// --------------------------------------------------

export function getFullExplanation(toDegree: string): FullExplanation {
  const info = CHORD_INFO[toDegree];

  if (!info) {
    return {
      origin: "Acorde dentro de la tonalidad",
      func: "Función tonal básica",
      movement: "Movimiento tonal estándar",
      color: "Color neutro",
      styleUsage: "Común en estilos Pop / Neo",
    };
  }

  // Clasificación de función general
  let func = "Tónica";
  if (["ii", "IV", "iv"].includes(toDegree)) func = "Subdominante";
  if (["V", "vii°", "V/ii", "V/V", "V/vi"].includes(toDegree)) func = "Dominante";
  if (["bIII", "bVI", "bVII"].includes(toDegree)) func = "Modal";

  return {
    origin: info.origin,
    func,
    movement: "Movimiento tonal característico (suave o moderado)",
    color: info.color,
    styleUsage: info.styleHint,
  };
}

// --------------------------------------------------
// Contexto: relación entre from → to
// (por ahora vacío, lo completamos en fase 2)
// --------------------------------------------------

export function getContextualExplanation(
  fromDegree: string | null,
  toDegree: string
): string {
  if (!fromDegree) return "";
  // acá luego usamos romanPro + heuristics
  return "";
}

// --------------------------------------------------
// Empaquetado final: explicación completa de sugerencia
// --------------------------------------------------

export function getFullSuggestionExplanation(params: SuggestionExplanationParams) {
  const short = getSuggestionExplanation(params); // tu motor actual
  const brief = CHORD_INFO[params.toDegree];
  const full = getFullExplanation(params.toDegree);
  const contextual = getContextualExplanation(params.fromDegree, params.toDegree);

  return {
    short,       // explicación funcional
    brief,       // origen / color / estilo
    full,        // tooltip largo
    contextual,  // próximamente contextual
  };
}
