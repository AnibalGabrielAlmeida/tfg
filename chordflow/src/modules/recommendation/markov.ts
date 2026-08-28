// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Motor de recomendación armónica (Markov)
// --------------------------------------------------
// Este módulo implementa un modelo de cadenas de Markov que pondera el
// siguiente grado armónico a partir del grado actual, con una matriz de
// transiciones escrita a mano por estilo:
//
// - Pop: cadencias funcionales y movimiento diatónico.
// - Neo: color modal, grados prestados y cadencias rotas.
//
// El módulo sólo entrega pesos. La selección final la decide el motor de
// score (scoring.ts), que les suma las reglas Berklee y les resta el
// costo de voice leading.
//
// Extensiones incluidas:
// - Grados modales: bIII, bVI, bVII, iv.
// - Dominantes secundarios: V/ii, V/iii, V/IV, V/V, V/vi.
// - Fallback por función tonal (T / S / D) cuando falta una fila explícita.
// - Refuerzo explícito de la resolución de dominantes secundarios.
// - Penalización de bucles triviales y repeticiones excesivas.
// --------------------------------------------------

import { functionalRoleMajor } from "../theory/functions";

export type MarkovRow = Record<string, number>;
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
export function getSecondaryResolution(current: string): string | null {
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
  const explicit = matrix[current];

  // Sin fila explícita: utilizar fallback por rol
  if (!explicit || Object.keys(explicit).length === 0) {
    return buildFallbackRow(style, current);
  }

  // Se devuelve siempre una copia: la matriz es estado compartido del
  // módulo y no debe poder mutarse desde fuera.
  const row: MarkovRow = { ...explicit };

  // Si el grado es dominante secundario, se refuerza su resolución
  const res = getSecondaryResolution(current);
  if (res) {
    const maxW = Math.max(...Object.values(row));
    if (!row[res] || row[res] <= maxW) {
      row[res] = maxW + 1;
    }
  }

  return row;
}

// --------------------------------------------------
// Penalización de bucles y repeticiones
// --------------------------------------------------
// Estas penalizaciones se calculan a partir del historial de la propia
// progresión, no de un estado interno del módulo: así la función es pura
// y su resultado depende únicamente de los argumentos recibidos.

/** Cuántos grados recientes se consideran "todavía sonando" en el oído. */
const RECENT_WINDOW = 4;

/** Piso de peso, para que una penalización nunca anule un candidato. */
const MIN_WEIGHT = 0.0001;

/**
 * Aplica penalizaciones a la fila Markov para evitar:
 * - Rebotar entre dos grados de forma trivial (I → V → I → V...).
 * - Insistir en un grado que acaba de sonar.
 * - Quedarse en el mismo grado actual.
 *
 * @param row     Fila de pesos candidata.
 * @param history Grados de la progresión en orden, del más antiguo al
 *                más reciente. El último es el grado actual.
 */
export function applyPenalties(row: MarkovRow, history: string[]): MarkovRow {
  const current = history.at(-1) ?? null;
  const previous = history.at(-2) ?? null;
  const recent = history.slice(-RECENT_WINDOW);

  const penalized: MarkovRow = {};

  for (const [deg, w] of Object.entries(row)) {
    let weight = w;

    // 1) Evitar el rebote inmediato tipo I → V → I → V
    if (previous && deg === previous) {
      weight *= 0.4;
    }

    // 2) Evitar insistir en un grado que sonó hace muy poco
    if (deg !== previous && recent.includes(deg)) {
      weight *= 0.6;
    }

    // 3) Evitar quedarse en el mismo grado actual
    if (current && deg === current) {
      weight *= 0.3;
    }

    penalized[deg] = Math.max(weight, MIN_WEIGHT);
  }

  return penalized;
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
 * El valor por defecto de alpha se deriva del estilo, de modo que pedir
 * la fila de un estilo sin especificar la mezcla devuelva ese estilo.
 *
 * Ambas filas se obtienen mediante getBaseRow, así que incluyen el
 * fallback por función tonal y el refuerzo de los dominantes secundarios.
 */
export function getBlendedMarkovRow(
  style: Style,
  current: string,
  alpha: number = style === "Pop" ? 1 : 0
): MarkovRow {
  // Extremos: se evita la mezcla para no arrastrar grados con peso 0
  // procedentes de la matriz que no interviene.
  if (alpha >= 0.999) return getBaseRow("Pop", current);
  if (alpha <= 0.001) return getBaseRow("Neo", current);

  const popRow = getBaseRow("Pop", current);
  const neoRow = getBaseRow("Neo", current);

  const result: MarkovRow = {};
  const degrees = new Set([...Object.keys(popRow), ...Object.keys(neoRow)]);

  degrees.forEach((deg) => {
    const pPop = popRow[deg] ?? 0;
    const pNeo = neoRow[deg] ?? 0;
    result[deg] = pPop * alpha + pNeo * (1 - alpha);
  });

  return result;
}
