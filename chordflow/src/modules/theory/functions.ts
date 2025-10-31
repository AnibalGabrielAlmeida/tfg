// --------------------------------------------------
// 🎵 ChordFlow — Funciones armónicas (modo mayor)
// --------------------------------------------------
// Este módulo asigna a cada grado su función tonal:
// Tónica (T), Subdominante (S) o Dominante (D).
// Basado en la teoría tonal clásica (Piston, Schoenberg).
// --------------------------------------------------

/**
 * Devuelve la función armónica de un grado en modo mayor.
 * Ejemplo:
 *  - "I"  → "T" (tónica)
 *  - "ii" → "S" (subdominante)
 *  - "V"  → "D" (dominante)
 */
export function functionalRoleMajor(degree: string): "T" | "S" | "D" {
  // 🎼 Mapeo estándar en tonalidad mayor:
  // Tónica (T): I, iii, vi  → reposo / estabilidad
  // Subdominante (S): ii, IV → preparación / transición
  // Dominante (D): V, vii° → tensión / resolución

  switch (degree) {
    case "I":
    case "iii":
    case "vi":
      return "T"; // Función tónica — centro de reposo

    case "ii":
    case "IV":
      return "S"; // Función subdominante — prepara el movimiento

    case "V":
    case "vii°":
      return "D"; // Función dominante — genera tensión

    default:
      return "T"; // Fallback (por si aparece algo no reconocido)
  }
}
