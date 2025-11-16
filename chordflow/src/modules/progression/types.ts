// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: types — Tipos y utilidades métricas de progresión
// --------------------------------------------------
// Este módulo define:
// - La estructura base para almacenar progresiones en la biblioteca.
// - La representación de un bloque de acorde dentro de una progresión.
// - El conjunto de grados romanos válidos para la escala mayor.
// - Funciones auxiliares para analizar el uso métrico en compás 4/4.
//
// Estos tipos son utilizados por los módulos de almacenamiento, teoría,
// reproducción y edición visual de progresiones.
// --------------------------------------------------

// Estructura de un ítem guardado en la biblioteca local
export type LibraryItem = {
  id: string;
  title: string;
  key: string;            // Puede reemplazarse por una unión estricta ("C" | "G" | ...)
  bpm: number;
  style: string;          // Estilo activo ("Pop", "Neo", etc.)
  blocks: ChordBlock[];   // Lista de bloques de acorde (nota: aquí se llama "blocks")
  createdAt: number;      // Timestamp (Date.now)
  updatedAt: number;
  version: string;        // Permite versionado interno (ej.: "1.0.0")
};

// Grados romanos tradicionales de la escala mayor
export type RomanDegree =
  | "I"
  | "ii"
  | "iii"
  | "IV"
  | "V"
  | "vi"
  | "vii°";
// Solo se aceptan estos valores para evitar errores tipográficos en la notación.

// Representa un bloque individual dentro de la progresión
export type ChordBlock = {
  id: string;               // Identificador único para React y drag & drop
  degree: RomanDegree;      // Grado armónico (I, ii, V, etc.)
  durationBeats: number;    // Duración en beats (4 equivale a un compás completo en 4/4)
};

/**
 * Calcula cuántos beats acumula cada compás basándose en duraciones consecutivas.
 * Por ejemplo:
 *   Input: [{4 beats}, {4 beats}, {3 beats}]
 *   Output: [4, 4, 3]
 *
 * @param blocks Lista de bloques de acorde.
 * @returns Un arreglo donde cada índice representa un compás y su valor total de beats.
 */
export function barsUsage(blocks: ChordBlock[]) {
  const usage: number[] = [];
  let cursor = 0;

  for (const b of blocks) {
    const bar = Math.floor(cursor / 4);      // Cada 4 beats comienza un nuevo compás
    usage[bar] = (usage[bar] ?? 0) + b.durationBeats;
    cursor += b.durationBeats;
  }

  return usage;
}

/**
 * Verifica si algún compás supera el límite estándar de 4 beats.
 *
 * @param blocks Lista de bloques de acorde.
 * @returns True si existe algún compás con más de 4 beats.
 */
export function exceedsAnyBar(blocks: ChordBlock[]) {
  return barsUsage(blocks).some((u) => (u ?? 0) > 4);
}
