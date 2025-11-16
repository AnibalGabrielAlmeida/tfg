// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Clasificación funcional en modo mayor (T/S/D)
// --------------------------------------------------
// Esta función asigna una función tonal básica (Tónica / Subdominante /
// Dominante) a un grado recibido en formato de notación romana.
//
// Está pensada como una heurística práctica para análisis funcional en
// modo mayor. No busca cubrir exhaustivamente todos los casos del jazz
// moderno, sino ofrecer una clasificación estable y coherente para el
// motor de recomendaciones y las explicaciones educativas.
//
// Criterios generales:
// - Dominantes fuertes: V, V7, V/ii, V/V, vii°, etc.
// - Subdominantes: ii, IV, iv, acordes modales cercanos (♭VI, ♭VII),
//   y grados que cumplan función de predominante.
// - Tonales: I, vi, iii y sus variantes más comunes.
// - Casos no estándar: reglas suaves y fallback orientado a evitar
//   clasificar todo como tónica.
// --------------------------------------------------

export function functionalRoleMajor(degree: string): "T" | "S" | "D" {
  const base = degree.trim();

  // Dominante claro (incluye dominantes secundarios y vii°)
  if (
    base === "V" ||
    base.startsWith("V/") ||
    base.startsWith("V7/") ||
    base.startsWith("V7") ||
    base.startsWith("vii°") ||
    base.startsWith("vii°/")
  ) {
    return "D";
  }

  // Subdominante típico y colores relacionados
  if (
    base === "ii" ||
    base.startsWith("ii") ||
    base === "IV" ||
    base === "iv" ||
    base === "bVII" ||
    base === "bVI"
  ) {
    return "S";
  }

  // Función de tónica (I, vi, iii y variantes frecuentes)
  if (
    base === "I" ||
    base === "Imaj7" ||
    base === "I6" ||
    base === "vi" ||
    base === "iii"
  ) {
    return "T";
  }

  // Heurísticas suaves para casos no estándar
  if (base.includes("V/")) return "D";      // cualquier dominante secundario
  if (base.startsWith("b")) return "S";     // acordes prestados comunes
  if (base.includes("ii")) return "S";      // variaciones de ii

  // Fallback seguro: clasificar como subdominante mantiene un
  // comportamiento armónico más estable que forzar tónica.
  return "S";
}
