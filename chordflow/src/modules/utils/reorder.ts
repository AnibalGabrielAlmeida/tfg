// --------------------------------------------------
// 🔀 ChordFlow — Utilidad para reordenar arrays
// --------------------------------------------------
// Esta función mueve un elemento dentro de un array
// sin mutar el original (inmutable).
// Se usa para implementar drag & drop en la lista
// de bloques de la progresión.
// --------------------------------------------------

/**
 * Mueve un elemento de una posición a otra dentro de un array,
 * devolviendo un nuevo array (no modifica el original).
 *
 * @param arr - El array original.
 * @param from - Índice de origen (posición actual del elemento).
 * @param to - Índice de destino (posición a la que se moverá).
 * @returns Nuevo array con el elemento movido.
 *
 * Ejemplo:
 * ```ts
 * arrayMoveImmutable(["I","IV","V"], 0, 2)
 * // → ["IV", "V", "I"]
 * ```
 */
export function arrayMoveImmutable<T>(arr: T[], from: number, to: number): T[] {
  // Crea una copia superficial del array
  const copy = arr.slice();

  // Extrae el elemento desde la posición "from"
  const item = copy.splice(from, 1)[0];

  // Inserta el elemento en la nueva posición "to"
  copy.splice(to, 0, item);

  // Devuelve un nuevo array con el cambio aplicado
  return copy;
}
