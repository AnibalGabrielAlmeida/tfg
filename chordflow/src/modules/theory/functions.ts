// Devuelve la función armónica de un grado en modo mayor.
// Esto es teoría tonal clásica básica.
export function functionalRoleMajor(degree: string): "T" | "S" | "D" {
  // Mapeo típico en tonalidad mayor:
  // Tónica (T): I, iii, vi
  // Subdominante (S): ii, IV
  // Dominante (D): V, vii°
  switch (degree) {
    case "I":
    case "iii":
    case "vi":
      return "T"; // función tónica / reposo

    case "ii":
    case "IV":
      return "S"; // subdominante / preparación / movimiento

    case "V":
    case "vii°":
      return "D"; // dominante / tensión / resolución

    default:
      return "T";
  }
}
