// --------------------------------------------------
// 🎵 ChordFlow — Motor de recomendación armónica (Markov)
// --------------------------------------------------
// POP: determinista (top-1)
// NEO: probabilístico (weighted random)
// Con penalización simple de repeticiones/loops triviales
// y función auxiliar para top-3 sugerencias.
//
// EXTENSIÓN:
// - Se agregan grados modales: bIII, bVI, bVII, iv
// - Se agregan algunos dominantes secundarios: V/ii, V/V, V/vi
// --------------------------------------------------

type MarkovRow = Record<string, number>;
type MarkovMatrix = Record<string, MarkovRow>;

// ---------- 🎸 POP: clásico (transiciones más cadenciales) ----------
const MARKOV_POP: MarkovMatrix = {
  // Igual que antes, con un toque de bVII y bVI/bIII en lugares suaves
  I:      { vi: 3, IV: 2, V: 2, ii: 1, bVII: 1 },
  ii:     { V: 4, "vii°": 1, IV: 1 },
  iii:    { vi: 3, IV: 2, ii: 1, bIII: 1 },
  IV:     { V: 3, ii: 2, I: 1, bVII: 1 },
  V:      { I: 4, vi: 2, IV: 1, bVII: 1 },
  vi:     { IV: 3, ii: 2, V: 1, I: 1, bVI: 1 },
  "vii°": { I: 4, V: 2 },

  // Grados modales POP (menos usados, pero posibles)
  bVII:   { I: 4, IV: 2, V: 1 },
  bIII:   { IV: 2, vi: 2, bVI: 1, I: 1 },
  bVI:    { IV: 3, V: 2, bIII: 1 },
  iv:     { I: 3, bVII: 2, ii: 1 },
};

// ---------- 🎹 NEO: más permisivo, circular y suave ----------
const MARKOV_NEO: MarkovMatrix = {
  // Diatónicos enriquecidos
  ii: {
    I: 3,
    IV: 3,
    V: 2,
    "vii°": 1,
    iii: 1,
    "V/V": 1,
  },

  I: {
    vi: 3,
    IV: 3,
    ii: 2,
    V: 1,
    iii: 1,
    bVII: 2,
    bIII: 1,
  },

  iii: {
    vi: 3,
    IV: 3,
    ii: 2,
    I: 1,
    bVI: 2,
  },

  IV: {
    I: 3,
    ii: 3,
    V: 2,
    vi: 2,
    iii: 1,
    iv: 2,
    bVII: 1,
  },

  V: {
    I: 2,
    vi: 3,
    IV: 3,
    ii: 2,
    bVII: 2,
  },

  vi: {
    IV: 3,
    ii: 3,
    I: 2,
    V: 1,
    iii: 2,
    bVI: 2,
  },

  "vii°": {
    I: 2,
    V: 2,
    iii: 2,
    IV: 1,
  },

  // Modales / intercambio
  bVII: {
    I: 3,
    IV: 3,
    V: 2,
    bIII: 2,
  },

  bIII: {
    IV: 3,
    vi: 2,
    bVI: 2,
    I: 1,
  },

  bVI: {
    IV: 3,
    V: 2,
    bIII: 2,
    ii: 1,
  },

  iv: {
    I: 3,
    bVII: 3,
    ii: 2,
    V: 1,
  },

  // Dominantes secundarios (muy dirigidos)
  "V/ii": {
    ii: 4,
    V: 1,
    I: 1,
  },

  "V/iii": {
    iii: 4,
    vi: 1,
    I: 1,
  },

  "V/IV": {
    IV: 4,
    ii: 1,
    I: 1,
  },

  "V/V": {
    V: 4,
    I: 1,
    vi: 1,
  },

  "V/vi": {
    vi: 4,
    IV: 1,
    I: 1,
  },
};

// 🎚️ Estilos disponibles
export type Style = "Pop" | "Neo";

// --------------------------------------------------
// 🧠 Estado mínimo para penalizar loops triviales
// --------------------------------------------------
let lastSuggested: string | null = null;
let prevSuggested: string | null = null;

// --------------------------------------------------
// 🎯 Funciones auxiliares
// --------------------------------------------------

function top1(row?: MarkovRow): string {
  if (!row) return "V"; // fallback
  let best = "I";
  let w = -Infinity;
  for (const [deg, ww] of Object.entries(row)) {
    if (ww > w) {
      w = ww;
      best = deg;
    }
  }
  return best;
}

function weightedPick(row?: MarkovRow): string {
  if (!row) return "V";
  const entries = Object.entries(row);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [deg, w] of entries) {
    if ((r -= w) <= 0) return deg;
  }
  return entries[0][0];
}

function applyPenalties(
  row: MarkovRow | undefined,
  current: string
): MarkovRow | undefined {
  if (!row) return row;
  const penalized: MarkovRow = {};

  for (const [deg, w] of Object.entries(row)) {
    let weight = w;

    // 1) Evitar rebote inmediato tipo I → V → I → V
    if (lastSuggested === current && prevSuggested && deg === prevSuggested) {
      weight *= 0.4;
    }

    // 2) Evitar insistir demasiado en el último sugerido
    if (deg === lastSuggested) {
      weight *= 0.6;
    }

    // 3) Evitar quedarse en el mismo grado actual
    if (deg === current) {
      weight *= 0.3;
    }

    if (weight <= 0) weight = 0.0001;
    penalized[deg] = weight;
  }

  return penalized;
}

type RankedSuggestion = { degree: string; weight: number };

function rankRow(row?: MarkovRow): RankedSuggestion[] {
  if (!row) return [];
  return Object.entries(row)
    .map(([degree, weight]) => ({ degree, weight }))
    .sort((a, b) => b.weight - a.weight);
}

// --------------------------------------------------
// 🧠 Función principal: sugerir siguiente acorde
// --------------------------------------------------
export function suggestNextDegree(style: Style, current: string): string {
  const baseRow =
    style === "Neo" ? MARKOV_NEO[current] : MARKOV_POP[current];

  const row = applyPenalties(baseRow, current) ?? baseRow;

  let next: string;
  if (style === "Neo") {
    next = weightedPick(row);
  } else {
    next = top1(row);
  }

  prevSuggested = lastSuggested;
  lastSuggested = next;

  return next;
}

// --------------------------------------------------
// 🧪 Top-N sugerencias (para top-1 / top-3 coherente)
// --------------------------------------------------
export function suggestNextTopN(
  style: Style,
  current: string,
  n: number = 3
): string[] {
  const baseRow =
    style === "Neo" ? MARKOV_NEO[current] : MARKOV_POP[current];
  const row = applyPenalties(baseRow, current) ?? baseRow;
  const ranked = rankRow(row);
  return ranked.slice(0, n).map((r) => r.degree);
}

// --------------------------------------------------
// ⚙️ Compatibilidad POP directa
// --------------------------------------------------
export function suggestNextDegreePop(current: string): string {
  const row =
    applyPenalties(MARKOV_POP[current], current) ?? MARKOV_POP[current];
  const next = top1(row);
  prevSuggested = lastSuggested;
  lastSuggested = next;
  return next;
}

// --------------------------------------------------
// 🔀 PRO: mezcla de estilos (α·Pop + (1–α)·Neo)
// --------------------------------------------------

export function getBlendedMarkovRow(
  style: Style,
  current: string,
  alpha: number = 1
): MarkovRow {
  // Pop o Neo "puros"
  if (style === "Pop" && alpha >= 0.999) {
    return MARKOV_POP[current] ?? {};
  }
  if (style === "Neo" && alpha <= 0.001) {
    return MARKOV_NEO[current] ?? {};
  }

  const popRow = MARKOV_POP[current] ?? {};
  const neoRow = MARKOV_NEO[current] ?? {};

  const result: MarkovRow = {};
  const degrees = new Set([...Object.keys(popRow), ...Object.keys(neoRow)]);

  degrees.forEach((deg) => {
    const pPop = popRow[deg] ?? 0;
    const pNeo = neoRow[deg] ?? 0;
    result[deg] = pPop * alpha + pNeo * (1 - alpha);
  });

  return result;
}
