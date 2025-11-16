// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Motor de recomendación armónica (Markov)
// --------------------------------------------------
// Este módulo implementa un modelo de cadenas de Markov para sugerir
// el siguiente grado armónico a partir del grado actual, diferenciando
// entre dos estilos:
//
// - Pop: comportamiento determinista (selección del grado con mayor peso).
// - Neo: comportamiento probabilístico (selección ponderada por pesos).
//
// Extensiones incluidas:
// - Grados modales: bIII, bVI, bVII, iv.
// - Dominantes secundarios: V/ii, V/iii, V/IV, V/V, V/vi.
// - Fallback por función tonal (T / S / D) cuando falta una fila explícita.
// - Refuerzo explícito de la resolución de dominantes secundarios.
// - Penalización de bucles triviales y repeticiones excesivas.
// --------------------------------------------------

import { functionalRoleMajor } from "../theory/functions";

type MarkovRow = Record<string, number>;
type MarkovMatrix = Record<string, MarkovRow>;

// --------------------------------------------------
// Matriz Markov para estilo Pop
// --------------------------------------------------
const MARKOV_POP: MarkovMatrix = {
  I:      { vi: 3, IV: 2, V: 2, ii: 1, bVII: 1 },
  ii:     { V: 4, "vii°": 1, IV: 1 },
  iii:    { vi: 3, IV: 2, ii: 1, bIII: 1 },
  IV:     { V: 3, ii: 2, I: 1, bVII: 1 },
  V:      { I: 4, vi: 2, IV: 1, bVII: 1 },
  vi:     { IV: 3, ii: 2, V: 1, I: 1, bVI: 1 },
  "vii°": { I: 4, V: 2 },

  // Grados modales
  bVII:   { I: 4, IV: 2, V: 1 },
  bIII:   { IV: 2, vi: 2, bVI: 1, I: 1 },
  bVI:    { IV: 3, V: 2, bIII: 1 },
  iv:     { I: 3, bVII: 2, ii: 1 },

  // Dominantes secundarios en Pop
  "V/ii":  { ii: 4, V: 1, I: 1 },
  "V/iii": { iii: 4, vi: 1, I: 1 },
  "V/IV":  { IV: 4, ii: 1, I: 1 },
  "V/V":   { V: 4, I: 1, vi: 1 },
  "V/vi":  { vi: 4, IV: 1, I: 1 },
};

// --------------------------------------------------
// Matriz Markov para estilo Neo
// --------------------------------------------------
const MARKOV_NEO: MarkovMatrix = {
  // Grados diatónicos enriquecidos
  ii:     { I: 3, IV: 3, V: 2, "vii°": 1, iii: 1, "V/V": 1 },
  I:      { vi: 3, IV: 3, ii: 2, V: 1, iii: 1, bVII: 2, bIII: 1 },
  iii:    { vi: 3, IV: 3, ii: 2, I: 1, bVI: 2 },
  IV:     { I: 3, ii: 3, V: 2, vi: 2, iii: 1, iv: 2, bVII: 1 },
  V:      { I: 2, vi: 3, IV: 3, ii: 2, bVII: 2 },
  vi:     { IV: 3, ii: 3, I: 2, V: 1, iii: 2, bVI: 2 },
  "vii°": { I: 2, V: 2, iii: 2, IV: 1 },

  // Modales / intercambio
  bVII:   { I: 3, IV: 3, V: 2, bIII: 2 },
  bIII:   { IV: 3, vi: 2, bVI: 2, I: 1 },
  bVI:    { IV: 3, V: 2, bIII: 2, ii: 1 },
  iv:     { I: 3, bVII: 3, ii: 2, V: 1 },

  // Dominantes secundarios
  "V/ii":  { ii: 4, V: 1, I: 1 },
  "V/iii": { iii: 4, vi: 1, I: 1 },
  "V/IV":  { IV: 4, ii: 1, I: 1 },
  "V/V":   { V: 4, I: 1, vi: 1 },
  "V/vi":  { vi: 4, IV: 1, I: 1 },
};

// Estilos disponibles para el motor
export type Style = "Pop" | "Neo";

// --------------------------------------------------
// Fallback por función tonal (T / S / D)
// --------------------------------------------------
// Cuando un grado no posee fila explícita en la matriz, se recurre
// a una lista de grados propuesta según la función tonal resultante.
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

/**
 * Obtiene de manera segura la función tonal de un grado (T/S/D).
 * Si ocurre algún error, se asume Tónica por defecto.
 */
function getRoleSafe(degree: string): "T" | "S" | "D" {
  try {
    return functionalRoleMajor(degree);
  } catch {
    return "T";
  }
}

/**
 * Construye una fila de fallback en función del estilo y
 * de la función tonal del grado actual.
 */
function buildFallbackRow(style: Style, current: string): MarkovRow {
  const role = getRoleSafe(current);
  const list = FALLBACK_BY_ROLE[style][role];
  const row: MarkovRow = {};
  const baseWeight = list.length;
  list.forEach((deg, idx) => {
    row[deg] = baseWeight - idx; // Secuencia de pesos descendente (4, 3, 2, 1, ...)
  });
  return row;
}

/**
 * Para un dominante secundario (V/ii, V/vi, etc.) devuelve
 * su resolución esperada (ii, vi, etc.). Si no es dominante
 * secundario, devuelve null.
 */
function getSecondaryResolution(current: string): string | null {
  const m = current.match(/^V\/(.+)$/);
  if (!m) return null;
  return m[1];
}

/**
 * Devuelve la fila base para el grado actual:
 * - Usa la matriz Markov correspondiente al estilo si existe.
 * - Si no hay fila explícita, usa el fallback por función tonal.
 * - Si el grado es un dominante secundario, refuerza su resolución
 *   agregando o incrementando el peso de la resolución con el valor
 *   más alto de la fila.
 */
function getBaseRow(style: Style, current: string): MarkovRow {
  const matrix = style === "Neo" ? MARKOV_NEO : MARKOV_POP;
  let row = matrix[current];

  if (!row || Object.keys(row).length === 0) {
    // Sin fila explícita: utilizar fallback por rol
    row = buildFallbackRow(style, current);
  } else {
    // Fila existente: si es dominante secundario, reforzar resolución
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
// Estado mínimo para penalizar bucles triviales
// --------------------------------------------------
let lastSuggested: string | null = null;
let prevSuggested: string | null = null;

// --------------------------------------------------
// Funciones auxiliares de selección y ranking
// --------------------------------------------------

/**
 * Selecciona el grado con mayor peso dentro de la fila.
 * Si la fila es indefinida, devuelve "V" como valor por defecto.
 */
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

/**
 * Selección aleatoria ponderada según los pesos de la fila.
 * Si la fila es indefinida, devuelve "V" por defecto.
 */
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

/**
 * Aplica penalizaciones a la fila Markov para evitar:
 * - Rebotar entre dos grados de forma trivial (I → V → I → V...).
 * - Repetir constantemente la última sugerencia.
 * - Mantenerse en el mismo grado actual.
 */
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

/**
 * Convierte una fila Markov en una lista ordenada de sugerencias
 * con sus pesos correspondientes, de mayor a menor.
 */
function rankRow(row?: MarkovRow): RankedSuggestion[] {
  if (!row) return [];
  return Object.entries(row)
    .map(([degree, weight]) => ({ degree, weight }))
    .sort((a, b) => b.weight - a.weight);
}

// --------------------------------------------------
// Función principal: sugerir siguiente grado
// --------------------------------------------------

/**
 * Sugiere el siguiente grado armónico a partir del grado actual y
 * el estilo seleccionado. Aplica la matriz base correspondiente,
 * fallback por rol y penalizaciones de loops triviales.
 *
 * - En estilo Pop: se usa la selección determinista (top1).
 * - En estilo Neo: se utiliza selección ponderada (weightedPick).
 */
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
// Top-N sugerencias para el panel avanzado
// --------------------------------------------------

/**
 * Devuelve las N mejores sugerencias ordenadas por peso, pensadas
 * para alimentar interfaces avanzadas (por ejemplo, paneles de
 * recomendación donde se muestran múltiples opciones).
 *
 * Si el grado actual es un dominante secundario, se fuerza que
 * su resolución aparezca en primer lugar cuando esté presente.
 */
export function suggestNextTopN(
  style: Style,
  current: string,
  n: number = 3
): string[] {
  const baseRow = getBaseRow(style, current);
  const row = applyPenalties(baseRow, current) ?? baseRow;
  const ranked = rankRow(row);

  // Si es dominante secundario, se asegura que la resolución quede primera
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
// Compatibilidad directa con estilo Pop
// --------------------------------------------------

/**
 * Versión simplificada que sugiere el siguiente grado utilizando
 * únicamente la matriz de estilo Pop, manteniendo la lógica de
 * penalización de loops y fallback por rol.
 */
export function suggestNextDegreePop(current: string): string {
  const baseRow = MARKOV_POP[current] ?? buildFallbackRow("Pop", current);
  const row = applyPenalties(baseRow, current) ?? baseRow;
  const next = top1(row);
  prevSuggested = lastSuggested;
  lastSuggested = next;
  return next;
}

// --------------------------------------------------
// Mezcla de estilos: combinación Pop/Neo mediante alpha
// --------------------------------------------------

/**
 * Devuelve una fila Markov "mezclada" a partir de Pop y Neo según
 * un parámetro alpha:
 *
 * - alpha = 1   → se usa solamente Pop.
 * - alpha = 0   → se usa solamente Neo.
 * - valores intermedios → combinación lineal de ambas matrices.
 *
 * Si no existen filas explícitas para el grado en ninguno de los
 * estilos, se recurre al fallback por función tonal.
 */
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
