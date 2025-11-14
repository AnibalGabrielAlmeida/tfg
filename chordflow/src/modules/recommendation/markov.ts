// --------------------------------------------------
// 🎵 ChordFlow — Motor de recomendación armónica (Markov)
// --------------------------------------------------
// POP: determinista (top-1)
// NEO: probabilístico (weighted random)
//
// EXTENSIÓN:
// - Grados modales: bIII, bVI, bVII, iv
// - Dominantes secundarios: V/ii, V/iii, V/IV, V/V, V/vi
// - Fallback por función tonal (T / S / D)
// - Resolución prioritaria para dominantes secundarios
// --------------------------------------------------

import { functionalRoleMajor } from "../theory/functions";

type MarkovRow = Record<string, number>;
type MarkovMatrix = Record<string, MarkovRow>;

// ---------- 🎸 POP ----------
const MARKOV_POP: MarkovMatrix = {
  I:      { vi: 3, IV: 2, V: 2, ii: 1, bVII: 1 },
  ii:     { V: 4, "vii°": 1, IV: 1 },
  iii:    { vi: 3, IV: 2, ii: 1, bIII: 1 },
  IV:     { V: 3, ii: 2, I: 1, bVII: 1 },
  V:      { I: 4, vi: 2, IV: 1, bVII: 1 },
  vi:     { IV: 3, ii: 2, V: 1, I: 1, bVI: 1 },
  "vii°": { I: 4, V: 2 },

  // Modales
  bVII:   { I: 4, IV: 2, V: 1 },
  bIII:   { IV: 2, vi: 2, bVI: 1, I: 1 },
  bVI:    { IV: 3, V: 2, bIII: 1 },
  iv:     { I: 3, bVII: 2, ii: 1 },

  // 🔥 Dominantes secundarios también en Pop
  "V/ii":  { ii: 4, V: 1, I: 1 },
  "V/iii": { iii: 4, vi: 1, I: 1 },
  "V/IV":  { IV: 4, ii: 1, I: 1 },
  "V/V":   { V: 4, I: 1, vi: 1 },
  "V/vi":  { vi: 4, IV: 1, I: 1 },
};

// ---------- 🎹 NEO ----------
const MARKOV_NEO: MarkovMatrix = {
  // diatónicos enriquecidos
  ii:     { I: 3, IV: 3, V: 2, "vii°": 1, iii: 1, "V/V": 1 },
  I:      { vi: 3, IV: 3, ii: 2, V: 1, iii: 1, bVII: 2, bIII: 1 },
  iii:    { vi: 3, IV: 3, ii: 2, I: 1, bVI: 2 },
  IV:     { I: 3, ii: 3, V: 2, vi: 2, iii: 1, iv: 2, bVII: 1 },
  V:      { I: 2, vi: 3, IV: 3, ii: 2, bVII: 2 },
  vi:     { IV: 3, ii: 3, I: 2, V: 1, iii: 2, bVI: 2 },
  "vii°": { I: 2, V: 2, iii: 2, IV: 1 },

  // modales / intercambio
  bVII:   { I: 3, IV: 3, V: 2, bIII: 2 },
  bIII:   { IV: 3, vi: 2, bVI: 2, I: 1 },
  bVI:    { IV: 3, V: 2, bIII: 2, ii: 1 },
  iv:     { I: 3, bVII: 3, ii: 2, V: 1 },

  // dominantes secundarios
  "V/ii":  { ii: 4, V: 1, I: 1 },
  "V/iii": { iii: 4, vi: 1, I: 1 },
  "V/IV":  { IV: 4, ii: 1, I: 1 },
  "V/V":   { V: 4, I: 1, vi: 1 },
  "V/vi":  { vi: 4, IV: 1, I: 1 },
};

// 🎚️ Estilos disponibles
export type Style = "Pop" | "Neo";

// --------------------------------------------------
// 🔥 Fallback por función tonal (T / S / D)
// --------------------------------------------------

const FALLBACK_BY_ROLE: Record<Style, Record<"T" | "S" | "D", string[]>> = {
  Pop: {
    T: ["I", "vi", "IV", "ii"],
    S: ["V", "ii", "I"],
    D: ["I", "vi", "IV"],
  },
  Neo: {
    T: ["I", "vi", "IV", "ii", "bVII"],
    S: ["V", "ii", "I", "bVII"],
    D: ["I", "vi", "IV", "bIII"],
  },
};

function getRoleSafe(degree: string): "T" | "S" | "D" {
  try {
    return functionalRoleMajor(degree);
  } catch {
    return "T";
  }
}

function buildFallbackRow(style: Style, current: string): MarkovRow {
  const role = getRoleSafe(current);
  const list = FALLBACK_BY_ROLE[style][role];
  const row: MarkovRow = {};
  const baseWeight = list.length;
  list.forEach((deg, idx) => {
    row[deg] = baseWeight - idx; // 4,3,2,1...
  });
  return row;
}

// Dominante secundario → resolución (V/ii → ii, V/vi → vi, etc.)
function getSecondaryResolution(current: string): string | null {
  const m = current.match(/^V\/(.+)$/);
  if (!m) return null;
  return m[1];
}

/** Devuelve la fila base (matriz o fallback) y se asegura de que,
 *  si es un dominante secundario, la resolución esté presente
 *  con el peso más alto.
 */
function getBaseRow(style: Style, current: string): MarkovRow {
  const matrix = style === "Neo" ? MARKOV_NEO : MARKOV_POP;
  let row = matrix[current];

  if (!row || Object.keys(row).length === 0) {
    // Sin fila explícita → fallback por rol
    row = buildFallbackRow(style, current);
  } else {
    // Tiene fila, pero si es V/ii, V/V, etc., reforzamos la resolución
    const res = getSecondaryResolution(current);
    if (res) {
      const maxW = Math.max(...Object.values(row));
      if (!row[res] || row[res] <= maxW) {
        row = { ...row, [res]: maxW + 1 };
      }
    }
  }

  return row;
}

// --------------------------------------------------
// 🧠 Estado mínimo para penalizar loops triviales
// --------------------------------------------------
let lastSuggested: string | null = null;
let prevSuggested: string | null = null;

// --------------------------------------------------
// 🎯 Funciones auxiliares
// --------------------------------------------------

function top1(row?: MarkovRow): string {
  if (!row) return "V";
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

    penalized[deg] = Math.max(weight, 0.0001);
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
  const baseRow = getBaseRow(style, current);
  const row = applyPenalties(baseRow, current) ?? baseRow;

  const next =
    style === "Neo"
      ? weightedPick(row)
      : top1(row);

  prevSuggested = lastSuggested;
  lastSuggested = next;

  return next;
}

// --------------------------------------------------
// 🧪 Top-N sugerencias (panel PRO)
// --------------------------------------------------
export function suggestNextTopN(
  style: Style,
  current: string,
  n: number = 3
): string[] {
  const baseRow = getBaseRow(style, current);
  const row = applyPenalties(baseRow, current) ?? baseRow;
  const ranked = rankRow(row);

  // Plus: por seguridad, si es dominante secundario,
  // volvemos a poner la resolución en primer lugar.
  const resolution = getSecondaryResolution(current);
  if (resolution) {
    const idx = ranked.findIndex((r) => r.degree === resolution);
    if (idx > 0) {
      const [item] = ranked.splice(idx, 1);
      ranked.unshift(item);
    }
  }

  return ranked.slice(0, n).map((r) => r.degree);
}

// --------------------------------------------------
// ⚙️ Compatibilidad POP directa
// --------------------------------------------------
export function suggestNextDegreePop(current: string): string {
  const baseRow = MARKOV_POP[current] ?? buildFallbackRow("Pop", current);
  const row = applyPenalties(baseRow, current) ?? baseRow;
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
  if (style === "Pop" && alpha >= 0.999) {
    return MARKOV_POP[current] ?? buildFallbackRow("Pop", current);
  }
  if (style === "Neo" && alpha <= 0.001) {
    return MARKOV_NEO[current] ?? buildFallbackRow("Neo", current);
  }

  const popRowRaw = MARKOV_POP[current];
  const neoRowRaw = MARKOV_NEO[current];

  if (!popRowRaw && !neoRowRaw) {
    return buildFallbackRow(style, current);
  }

  const popRow = popRowRaw ?? {};
  const neoRow = neoRowRaw ?? {};

  const result: MarkovRow = {};
  const degrees = new Set([...Object.keys(popRow), ...Object.keys(neoRow)]);

  degrees.forEach((deg) => {
    const pPop = popRow[deg] ?? 0;
    const pNeo = neoRow[deg] ?? 0;
    result[deg] = pPop * alpha + pNeo * (1 - alpha);
  });

  return result;
}
