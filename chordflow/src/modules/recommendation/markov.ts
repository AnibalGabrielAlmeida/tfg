// --------------------------------------------------
// 🎵 ChordFlow — Motor de recomendación armónica (Markov)
// --------------------------------------------------
// POP: determinista (top-1)
// NEO: probabilístico (weighted random)
// Con penalización simple de repeticiones/loops triviales
// y función auxiliar para top-3 sugerencias.
// --------------------------------------------------

// ---------- 🎸 POP: clásico (transiciones más cadenciales) ----------
const MARKOV_POP: Record<string, Record<string, number>> = {
  I:      { vi: 3, IV: 2, V: 2, ii: 1 },
  ii:     { V: 4, "vii°": 1, IV: 1 },
  iii:    { vi: 3, IV: 2, ii: 1 },
  IV:     { V: 3, ii: 2, I: 1 },
  V:      { I: 4, vi: 2, IV: 1 },
  vi:     { IV: 3, ii: 2, V: 1 },
  "vii°": { I: 4, V: 2 },
};

// ---------- 🎹 NEO: más permisivo, circular y suave ----------
const MARKOV_NEO: Record<string, Record<string, number>> = {
  ii:     { I: 3, IV: 3, V: 2, "vii°": 1, iii: 1 },
  I:      { vi: 3, IV: 3, ii: 2, V: 1, iii: 1 },
  iii:    { vi: 3, IV: 3, ii: 2, I: 1 },
  IV:     { I: 3, ii: 3, V: 2, vi: 2, iii: 1 },
  V:      { I: 2, vi: 3, IV: 3, ii: 2 },
  vi:     { IV: 3, ii: 3, I: 2, V: 1, iii: 2 },
  "vii°": { I: 2, V: 2, iii: 2, IV: 1 },
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

// 🔹 top1(row): devuelve el acorde más probable (usado por POP)
function top1(row?: Record<string, number>) {
  if (!row) return "V"; // fallback
  let best = "I", w = -Infinity;
  for (const [deg, ww] of Object.entries(row)) {
    if (ww > w) { w = ww; best = deg; }
  }
  return best;
}

// 🔸 weightedPick(row): elección aleatoria ponderada (usado por NEO)
function weightedPick(row?: Record<string, number>) {
  if (!row) return "V";
  const entries = Object.entries(row);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [deg, w] of entries) {
    if ((r -= w) <= 0) return deg;
  }
  return entries[0][0];
}

// 🔻 Penalización simple de repetición / loops triviales
function applyPenalties(
  row: Record<string, number> | undefined,
  current: string
): Record<string, number> | undefined {
  if (!row) return row;
  const penalized: Record<string, number> = {};

  for (const [deg, w] of Object.entries(row)) {
    let weight = w;

    // 1) Evitar "rebote" inmediato tipo I → V → I → V
    // Si el último sugerido fue igual al grado actual
    // y el penúltimo fue 'deg', penalizamos volver a ese penúltimo.
    if (lastSuggested === current && prevSuggested && deg === prevSuggested) {
      weight *= 0.4; // baja la probabilidad del loop de 2 pasos
    }

    // 2) Evitar insistir demasiado en el último sugerido (colgarse)
    if (deg === lastSuggested) {
      weight *= 0.6;
    }

    // 3) (Opcional) evitar quedarse en el mismo grado actual
    if (deg === current) {
      weight *= 0.3;
    }

    // Evitar pesos cero
    if (weight <= 0) weight = 0.0001;

    penalized[deg] = weight;
  }

  return penalized;
}

// Rankeo para top-N (top-1 / top-3)
type RankedSuggestion = { degree: string; weight: number };

function rankRow(row?: Record<string, number>): RankedSuggestion[] {
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

  // Aplica penalización de repetición / loops triviales
  const row = applyPenalties(baseRow, current) ?? baseRow;

  let next: string;
  if (style === "Neo") {
    next = weightedPick(row);
  } else {
    next = top1(row);
  }

  // Actualizar memoria mínima de sugerencias
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
// ⚙️ Compatibilidad con versiones anteriores (opcional)
// --------------------------------------------------
export function suggestNextDegreePop(current: string): string {
  const row = applyPenalties(MARKOV_POP[current], current) ?? MARKOV_POP[current];
  const next = top1(row);
  prevSuggested = lastSuggested;
  lastSuggested = next;
  return next;
}

// --------------------------------------------------
// 🔀 PRO: mezcla de estilos (α·Pop + (1–α)·Neo)
// --------------------------------------------------

/**
 * Devuelve una fila Markov mezclada entre Pop y Neo.
 * alpha = 1   → solo Pop
 * alpha = 0   → solo Neo
 * alpha = 0.5 → mezcla 50/50
 */
export function getBlendedMarkovRow(
  style: Style,
  current: string,
  alpha: number = 1
): Record<string, number> {
  // Si el usuario elige Pop o Neo "puro", usamos solo esa matriz
  if (style === "Pop" && alpha >= 0.999) {
    return MARKOV_POP[current] ?? {};
  }
  if (style === "Neo" && alpha <= 0.001) {
    return MARKOV_NEO[current] ?? {};
  }

  // Mezcla Pop/Neo (por si más adelante queremos "híbridos")
  const popRow = MARKOV_POP[current] ?? {};
  const neoRow = MARKOV_NEO[current] ?? {};

  const result: Record<string, number> = {};
  const degrees = new Set([...Object.keys(popRow), ...Object.keys(neoRow)]);

  degrees.forEach((deg) => {
    const pPop = popRow[deg] ?? 0;
    const pNeo = neoRow[deg] ?? 0;
    result[deg] = pPop * alpha + pNeo * (1 - alpha);
  });

  return result;
}
