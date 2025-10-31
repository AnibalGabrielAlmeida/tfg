// --------------------------------------------------
// 🎵 ChordFlow — Conversión de grados a notas (triadas)
// --------------------------------------------------
// Este módulo traduce los grados romanos (I, ii, V...)
// a sus notas correspondientes en distintas tonalidades
// mayores (C, G, D, F). Es totalmente manual, sin
// dependencias externas (como tonal.js).
// --------------------------------------------------

/**
 * Mapea los acordes diatónicos mayores a sus notas (triadas)
 * para las tonalidades C, G, D y F mayor.
 * Devuelve un array de strings con notas en la octava 4 (ej: ["C4","E4","G4"]).
 */
export function chordNotesFromDegree(key: string, degree: string): string[] {
  // 🎼 Escalas mayores básicas disponibles
  // Cada una tiene 7 notas (sin alteraciones armónicas menores)
  const scales: Record<string, string[]> = {
    C: ["C", "D", "E", "F", "G", "A", "B"],
    G: ["G", "A", "B", "C", "D", "E", "F#"],
    D: ["D", "E", "F#", "G", "A", "B", "C#"],
    F: ["F", "G", "A", "Bb", "C", "D", "E"],
  };

  // Usa la escala correspondiente o C por defecto
  const scale = scales[key] || scales["C"];

  /**
   * 🧩 Función auxiliar: genera una triada (1–3–5) a partir
   * del índice raíz dentro de la escala.
   * Usa la octava 4 por simplicidad.
   */
  const triad = (rootIndex: number): string[] => {
    const note = (i: number) => scale[(rootIndex + i) % 7];
    return [
      `${note(0)}4`, // fundamental
      `${note(2)}4`, // tercera
      `${note(4)}4`, // quinta
    ];
  };

  // 🎯 Selección del grado y generación de la triada correspondiente
  switch (degree) {
    case "I":    return triad(0);
    case "ii":   return triad(1);
    case "iii":  return triad(2);
    case "IV":   return triad(3);
    case "V":    return triad(4);
    case "vi":   return triad(5);
    case "vii°": return triad(6);
    default:     return triad(0); // fallback a I si el grado no se reconoce
  }
}
