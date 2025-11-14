export function functionalRoleMajor(degree: string): "T" | "S" | "D" {
  const base = degree.trim();

  // 1) Dominantes claros: V, V7, V/ii, V/V, V/vi, etc.
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

  // 2) Subdominantes típicos + modales afines
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

  // 3) Tonales (I, vi, iii y variantes con tensiones)
  if (
    base === "I" ||
    base === "Imaj7" ||
    base === "I6" ||
    base === "vi" ||
    base === "iii"
  ) {
    return "T";
  }

  // 4) Heurísticas suaves para lo raro:
  if (base.includes("V/")) return "D";          // cualquier V/
  if (base.startsWith("b")) return "S";        // bII, bIII, bVI, bVII → subdom / color
  if (base.includes("ii")) return "S";         // ii con adornos

  // Fallback: mejor S que todo tónica
  return "S";
}
