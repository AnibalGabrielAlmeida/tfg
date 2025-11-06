// --------------------------------------------------
// 🎓 ChordFlow — Reglas Berklee / armonía moderna
// --------------------------------------------------
// Este módulo NO reemplaza al Markov, sino que lo
// complementa con "boosts" teóricos para ciertas
// transiciones típicas de la armonía moderna:
//
// - Cadencias ii–V–I
// - Dominantes secundarios (V/ii, V/vi, etc.)
// - Sustituto tritonal (♭II7 → I)
// - Backdoor (IVm7 → I, ♭VII → I)
// - Intercambio modal (♭III, ♭VI, ♭VII → I/V)
//
// La idea es que el motor de recomendaciones pueda
// sumar estos boosts al score base de Markov y luego
// generar explicaciones cortas en la UI.
// --------------------------------------------------

export type BerkleeTag =
  | "cadence"             // ii–V–I, IV–V–I...
  | "secondaryDominant"   // V/ii → ii, V/vi → vi...
  | "tritoneSub"          // ♭II7 → I
  | "backdoor"            // IVm7 → I, ♭VII → I
  | "modalInterchange"    // ♭III, ♭VI, ♭VII prestados
  | "other";

export interface BerkleeRule {
  from: string;         // grado origen (ej. "ii", "V/ii", "bVII", "bII7")
  to: string;           // grado destino
  boost: number;        // cuánto suma al score (0..3 aprox)
  tag: BerkleeTag;      // tipo de recurso
  description: string;  // breve explicación (para UI)
}

// --------------------------------------------------
// 🧾 Reglas básicas (pueden ampliarse después)
// --------------------------------------------------

const RULES: BerkleeRule[] = [
  // --- Cadencias funcionales mayores ---
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

  // --- Backdoor resolutions ---
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

  // --- Intercambio modal (prestados de la paralela) ---
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
    description: "♭VII → V (movimiento modal típico rock / pop)",
  },
];

// --------------------------------------------------
// 🧮 API pública
// --------------------------------------------------

/**
 * Devuelve el boost numérico recomendado para la
 * transición from→to según las reglas Berklee.
 *
 * Si no hay regla, devuelve 0 (sin bonificación).
 */
export function getBerkleeBoost(from: string, to: string): number {
  const matches = RULES.filter((r) => r.from === from && r.to === to);
  if (!matches.length) return 0;

  // Podríamos sumar; por ahora usamos el máximo para evitar exagerar
  return Math.max(...matches.map((r) => r.boost));
}

/**
 * Devuelve la(s) regla(s) que aplican a la transición
 * from→to. Útil para UI y explicaciones.
 */
export function getBerkleeRules(from: string, to: string): BerkleeRule[] {
  return RULES.filter((r) => r.from === from && r.to === to);
}

/**
 * Atajo para obtener una explicación corta prioritaria,
 * si existe alguna regla Berklee para from→to.
 */
export function getBerkleeExplanation(from: string, to: string): string | null {
  const rules = getBerkleeRules(from, to);
  if (!rules.length) return null;

  // Podríamos priorizar por tag; por ahora tomamos la de mayor boost
  const best = rules.reduce((acc, r) => (r.boost > acc.boost ? r : acc), rules[0]);
  return best.description;
}
