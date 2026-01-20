// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Explicaciones de sugerencias armónicas
// --------------------------------------------------
// Este módulo genera explicaciones textuales breves y extendidas para
// movimientos entre grados (from → to), combinando:
//
// - Función tonal básica (T/S/D).
// - Tipo de transición funcional (reposo, preparación, tensión).
// - Reglas específicas de armonía tonal (por ejemplo, patrones Berklee).
//
// Se utiliza principalmente en el SuggestionPanel y en tooltips
// educativos dentro de la interfaz.
// --------------------------------------------------

import { functionalRoleMajor } from "../theory/functions";
import { getBerkleeExplanation } from "../theory/berklee";
import type { Style } from "./markov";

export interface SuggestionExplanationParams {
  /** Grado actual dentro de la progresión (I, ii, V, bVII, etc.) */
  fromDegree: string;

  /** Grado sugerido por el motor de recomendación */
  toDegree: string;

  /** Estilo armónico activo ("Pop" | "Neo") */
  style: Style;
}

type Role = "T" | "S" | "D";

/**
 * Etiqueta corta en texto natural para cada rol funcional.
 */
function roleLabel(role: Role): string {
  switch (role) {
    case "T":
      return "tónica";
    case "S":
      return "subdominante";
    case "D":
      return "dominante";
    default:
      return "tónica";
  }
}

/**
 * Devuelve una breve descripción del tipo de movimiento funcional
 * entre dos roles tonales (T/S/D).
 */
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

/**
 * Etiqueta corta para el estilo armónico.
 */
function styleLabel(style: Style): string {
  return style === "Pop" ? "estilo Pop" : "estilo Neo";
}

/**
 * Genera una explicación corta para el movimiento from → to.
 *
 * Ejemplos:
 * - "ii (subdominante) → V (dominante): preparación → tensión (cadencia)."
 * - "IVm7 → I: backdoor (Berklee)."
 */
export function getSuggestionExplanation(
  params: SuggestionExplanationParams
): string {
  const { fromDegree, toDegree, style } = params;

  // Funciones tonales básicas (modo mayor)
  const fromRole = functionalRoleMajor(fromDegree) as Role;
  const toRole = functionalRoleMajor(toDegree) as Role;

  const fromTag = `${fromDegree} (${roleLabel(fromRole)})`;
  const toTag = `${toDegree} (${roleLabel(toRole)})`;

  // Intentar primero una explicación específica basada en reglas Berklee
  const berkleeText = getBerkleeExplanation(fromDegree, toDegree);

  if (berkleeText) {
    return `${fromTag} → ${toTag}: ${berkleeText}.`;
  }

  // Si no hay regla específica, se usa una descripción funcional general
  const trans = transitionLabel(fromRole, toRole);
  const styleTxt = styleLabel(style);

  return `${fromTag} → ${toTag}: ${trans} (${styleTxt}).`;
}

export interface BriefExtraInfo {
  origin: string;     // Ejemplo: "Prestado del modo eólico"
  color: string;      // Ejemplo: "Color oscuro/triste"
  styleHint: string;  // Ejemplo: "Típico en Neo-Soul"
}

export interface FullExplanation {
  origin: string;
  func: string;
  movement: string;
  color: string;
  styleUsage: string;
  contextual?: string; // Relación con el acorde anterior (extensible a futuro)
}

// --------------------------------------------------
// Diccionario armónico básico por grado
// --------------------------------------------------

export const CHORD_INFO: Record<string, BriefExtraInfo> = {
  // Grados provenientes de intercambio modal
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

  // Dominantes secundarios
  "V/ii": {
    origin: "Dominante secundario → ii",
    color: "Tensión dirigida",
    styleHint: "Común en Pop, jazz tonal y gospel",
  },
  "V/iii": {
    origin: "Dominante secundario → iii",
    color: "Tensión mayor luminosa",
    styleHint: "Frecuente en Pop y R&B",
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

  // Grados diatónicos (resumen genérico)
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
// Explicación completa por grado sugerido
// --------------------------------------------------

/**
 * Construye una explicación ampliada para un grado específico.
 * Si el grado no se encuentra en CHORD_INFO, devuelve un texto
 * genérico adecuado para la tonalidad mayor.
 */
export function getFullExplanation(toDegree: string): FullExplanation {
  const info = CHORD_INFO[toDegree];

  if (!info) {
    return {
      origin: "Acorde dentro de la tonalidad",
      func: "Función tonal básica",
      movement: "Movimiento tonal estándar",
      color: "Color neutro",
      styleUsage: "Común en estilos Pop y Neo",
    };
  }

  // Clasificación de función general a partir del grado
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
// (marco para extensiones futuras)
// --------------------------------------------------

/**
 * Punto de extensión para generar explicaciones contextuales
 * que tengan en cuenta la relación entre el acorde anterior
 * y el acorde sugerido.
 *
 * En esta versión se deja intencionalmente vacío para futuras mejoras.
 */
export function getContextualExplanation(
  fromDegree: string | null,
): string {
  if (!fromDegree) return "";
  // En futuras versiones se integrará con un motor más detallado
  // de análisis funcional (por ejemplo, romanPro y heurísticas adicionales).
  return "";
}

// --------------------------------------------------
// Empaquetado final: explicación completa de la sugerencia
// --------------------------------------------------

/**
 * Devuelve un objeto con diferentes niveles de explicación
 * para una sugerencia concreta:
 *
 * - short: explicación funcional breve basada en T/S/D y estilo.
 * - brief: información resumida del acorde (origen, color, estilo).
 * - full: explicación extendida para tooltips más largos.
 * - contextual: reservado para explicaciones dependientes del acorde anterior.
 */
export function getFullSuggestionExplanation(
  params: SuggestionExplanationParams
) {
  const short = getSuggestionExplanation(params);
  const brief = CHORD_INFO[params.toDegree];
  const full = getFullExplanation(params.toDegree);
  const contextual = getContextualExplanation(
    params.fromDegree,
  );

  return {
    short,
    brief,
    full,
    contextual,
  };
}
