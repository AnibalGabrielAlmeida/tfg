// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Utilidad para reordenar arrays (inmutable)
// --------------------------------------------------
// Esta utilidad permite mover un elemento de un índice a otro
// dentro de un array sin modificar el arreglo original.
// Es utilizada en el sistema de drag & drop que organiza
// los bloques de acordes dentro de la progresión.
//
// Se devuelve siempre un nuevo array para preservar la
// inmutabilidad, lo cual facilita el funcionamiento correcto
// de React y evita efectos secundarios indeseados.
// --------------------------------------------------

/**
 * Mueve un elemento de una posición a otra dentro de un array
 * y devuelve un nuevo array sin afectar el original.
 *
 * @param arr  - Array original.
 * @param from - Índice actual del elemento a mover.
 * @param to   - Índice destino al que se insertará.
 *
 * @returns Un nuevo array con el elemento reubicado.
 *
 * Ejemplo:
 * ```ts
 * arrayMoveImmutable(["I", "IV", "V"], 0, 2)
 * // → ["IV", "V", "I"]
 * ```
 */
export function arrayMoveImmutable<T>(arr: T[], from: number, to: number): T[] {
  // Copia superficial del array para mantener inmutabilidad
  const copy = arr.slice();

  // Extrae el elemento desde su posición original
  const item = copy.splice(from, 1)[0];

  // Inserta el elemento en la posición de destino
  copy.splice(to, 0, item);

  return copy;
}
