// ---------- POP: clásico (top-1) ----------
const MARKOV_POP: Record<string, Record<string, number>> = {
  I:    { vi: 3, IV: 2, V: 2, ii: 1 },
  ii:   { V: 4, "vii°": 1, IV: 1 },
  iii:  { vi: 3, IV: 2, ii: 1 },
  IV:   { V: 3, ii: 2, I: 1 },
  V:    { I: 4, vi: 2, IV: 1 },
  vi:   { IV: 3, ii: 2, V: 1 },
  "vii°": { I: 4, V: 2 },
};

// ---------- NEO: más permisivo (menos resolución a V) ----------
const MARKOV_NEO: Record<string, Record<string, number>> = {
  // cambia el sesgo: desde ii no domina V
  ii:   { I: 3, IV: 3, V: 2, "vii°": 1, iii: 1 },
  I:    { vi: 3, IV: 3, ii: 2, V: 1, iii: 1 },
  iii:  { vi: 3, IV: 3, ii: 2, I: 1 },
  IV:   { I: 3, ii: 3, V: 2, vi: 2, iii: 1 },
  V:    { I: 2, vi: 3, IV: 3, ii: 2 },        // menos cadencial
  vi:   { IV: 3, ii: 3, I: 2, V: 1, iii: 2 }, // más circulaciones suaves
  "vii°": { I: 2, V: 2, iii: 2, IV: 1 },      // alternativas no cadenciales
};

export type Style = "Pop" | "Neo";

// top-1 determinista (para Pop)
function top1(row?: Record<string, number>) {
  if (!row) return "V";
  let best = "I", w = -Infinity;
  for (const [deg, ww] of Object.entries(row)) if (ww > w) { w = ww; best = deg; }
  return best;
}

// elección aleatoria ponderada (para Neo)
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

export function suggestNextDegree(style: Style, current: string): string {
  if (style === "Neo") return weightedPick(MARKOV_NEO[current]);
  return top1(MARKOV_POP[current]);
}

// compatibilidad con código viejo (si lo usás en algún lado)
export function suggestNextDegreePop(current: string): string {
  return top1(MARKOV_POP[current]);
}
