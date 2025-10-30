/**
 * Mapea los acordes diatónicos mayores a sus notas (triadas),
 * para las tonalidades C, G, D y F mayor.
 * Sin librerías, 100% manual.
 */
export function chordNotesFromDegree(key: string, degree: string): string[] {
  // Cada tonalidad tiene su escala mayor (7 notas)
  const scales: Record<string, string[]> = {
    C: ["C", "D", "E", "F", "G", "A", "B"],
    G: ["G", "A", "B", "C", "D", "E", "F#"],
    D: ["D", "E", "F#", "G", "A", "B", "C#"],
    F: ["F", "G", "A", "Bb", "C", "D", "E"],
  };

  const scale = scales[key] || scales["C"];

  // función auxiliar: convierte índice base en acorde triada (1–3–5 de la escala)
  const triad = (rootIndex: number): string[] => {
    const note = (i: number) => scale[(rootIndex + i) % 7];
    return [
      `${note(0)}4`,
      `${note(2)}4`,
      `${note(4)}4`,
    ];
  };

  switch (degree) {
    case "I":   return triad(0);
    case "ii":  return triad(1);
    case "iii": return triad(2);
    case "IV":  return triad(3);
    case "V":   return triad(4);
    case "vi":  return triad(5);
    case "vii°":return triad(6);
    default:    return triad(0);
  }
}
