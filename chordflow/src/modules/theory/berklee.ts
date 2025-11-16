// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Reglas Berklee / armonía moderna
// --------------------------------------------------
// Este módulo no reemplaza al modelo Markov, sino que lo complementa
// mediante "boosts" teóricos para ciertos movimientos típicos de la
// armonía funcional y moderna. Estos refuerzos se utilizan para:
//
// - Cadencias ii–V–I y IV–V–I.
// - Dominantes secundarios (V/ii, V/vi, V/V, etc.).
// - Sustituto tritonal (♭II7 → I).
// - Resoluciones backdoor (IVm7 → I, ♭VII → I).
// - Intercambio modal (♭III, ♭VI, ♭VII hacia I o V).
//
// La idea es que el motor de recomendación pueda sumar estos boosts
// al score base de Markov y además ofrecer explicaciones breves en la UI.
// --------------------------------------------------

export type BerkleeTag =
  | "cadence"             // ii–V–I, IV–V–I...
  | "secondaryDominant"   // V/ii → ii, V/vi → vi...
  | "tritoneSub"          // ♭II7 → I
  | "backdoor"            // IVm7 → I, ♭VII → I
  | "modalInterchange"    // ♭III, ♭VI, ♭VII prestados
  | "other";

export interface BerkleeRule {
  /** Grado de origen (por ejemplo: "ii", "V/ii", "bVII", "bII7"). */
  from: string;

  /** Grado de destino de la progresión. */
  to: string;

  /** Cantidad que se suma al score total (rango orientativo 0..3). */
  boost: number;

  /** Etiqueta que clasifica el tipo de recurso armónico utilizado. */
  tag: BerkleeTag;

  /** Descripción breve en texto natural, pensada para la interfaz. */
  description: string;
}

// --------------------------------------------------
// Conjunto base de reglas Berklee (ampliable)
// --------------------------------------------------

const RULES: BerkleeRule[] = [
  // --- Cadencias funcionales en modo mayor ---
  {
    from: "ii",
    to: "V",
    boost: 2,
    tag: "cadence",
    description: "ii prepara V (predominante → dominante)",
  },
  {
    from: "V",
    to: "I",
    boost: 3,
    tag: "cadence",
    description: "V resuelve en I (cadencia auténtica)",
  },
  {
    from: "IV",
    to: "I",
    boost: 1.5,
    tag: "cadence",
    description: "IV resuelve en I (cadencia plagal)",
  },

  // --- Dominantes secundarios ---
  {
    from: "V/ii",
    to: "ii",
    boost: 2,
    tag: "secondaryDominant",
    description: "V/ii crea tensión secundaria hacia ii",
  },
  {
    from: "V/vi",
    to: "vi",
    boost: 2,
    tag: "secondaryDominant",
    description: "V/vi funciona como dominante secundario de vi",
  },
  {
    from: "V/V",
    to: "V",
    boost: 2,
    tag: "secondaryDominant",
    description: "V/V prepara a V (dominante del dominante)",
  },

  // --- Sustituto tritonal (♭II7 → I) ---
  {
    from: "bII7",
    to: "I",
    boost: 3,
    tag: "tritoneSub",
    description: "♭II7 sustituye a V7 (sustituto tritonal hacia I)",
  },

  // --- Resoluciones backdoor ---
  {
    from: "IVm",
    to: "I",
    boost: 2,
    tag: "backdoor",
    description: "IVm → I (backdoor: paralelo menor de IV)",
  },
  {
    from: "IVm7",
    to: "I",
    boost: 2,
    tag: "backdoor",
    description: "IVm7 → I (resolución backdoor típica)",
  },
  {
    from: "bVII",
    to: "I",
    boost: 1.5,
    tag: "backdoor",
    description: "♭VII → I (resolución backdoor / mixolidia)",
  },

  // --- Intercambio modal (acordes prestados de la paralela) ---
  {
    from: "bVI",
    to: "I",
    boost: 1.5,
    tag: "modalInterchange",
    description: "♭VI prestado de la paralela menor (intercambio modal)",
  },
  {
    from: "bIII",
    to: "I",
    boost: 1.2,
    tag: "modalInterchange",
    description: "♭III como acorde prestado (color mixolidio/dórico)",
  },
  {
    from: "bVII",
    to: "V",
    boost: 1.2,
    tag: "modalInterchange",
    description: "♭VII → V (movimiento modal típico de rock / pop)",
  },
];

// --------------------------------------------------
// API pública
// --------------------------------------------------

/**
 * Devuelve el valor numérico de boost recomendado para la transición
 * from → to según las reglas Berklee definidas.
 *
 * Si no existe ninguna regla para la combinación dada, devuelve 0.
 */
export function getBerkleeBoost(from: string, to: string): number {
  const matches = RULES.filter((r) => r.from === from && r.to === to);
  if (!matches.length) return 0;

  // En lugar de sumar todos los boosts, se utiliza el máximo
  // para evitar una ponderación excesiva de una misma transición.
  return Math.max(...matches.map((r) => r.boost));
}

/**
 * Devuelve todas las reglas que aplican a la transición from → to.
 * Resulta útil para construir explicaciones más detalladas en la UI.
 */
export function getBerkleeRules(from: string, to: string): BerkleeRule[] {
  return RULES.filter((r) => r.from === from && r.to === to);
}

/**
 * Devuelve una explicación breve prioritaria para la transición
 * from → to, en caso de existir alguna regla Berklee asociada.
 *
 * Si no se encuentra ninguna regla, devuelve null.
 */
export function getBerkleeExplanation(from: string, to: string): string | null {
  const rules = getBerkleeRules(from, to);
  if (!rules.length) return null;

  // Se prioriza la regla con mayor boost como explicación principal.
  const best = rules.reduce(
    (acc, r) => (r.boost > acc.boost ? r : acc),
    rules[0]
  );
  return best.description;
}
