// --------------------------------------------------
// 🎵 ChordFlow — Tipos y utilidades métricas
// --------------------------------------------------
// Este módulo define las estructuras de datos básicas
// para representar acordes (bloques) dentro de una
// progresión armónica y funciones auxiliares para
// validar la métrica (4/4).
// --------------------------------------------------

// 🎶 Representa los grados tonales clásicos (escala mayor)
export type RomanDegree = "I" | "ii" | "iii" | "IV" | "V" | "vi" | "vii°";
// Solo se aceptan estos valores — evita errores al escribir grados.
// Ejemplo: "I" (tónica), "ii" (supertonal), "V" (dominante), etc.

// 🧱 Estructura de un bloque dentro de la progresión
export type ChordBlock = {
  id: string;              // Identificador único (para React y drag & drop)
  degree: RomanDegree;     // Grado armónico (I, ii, V, etc.)
  durationBeats: number;   // Duración en beats (4 = compás completo en 4/4)
};

// 🧮 Calcula cuántos beats ocupa cada compás en la progresión
export function barsUsage(blocks: ChordBlock[]) {
  const usage: number[] = []; // usage[n] = total de beats en el compás n
  let cursor = 0;             // contador de beats recorridos

  for (const b of blocks) {
    const bar = Math.floor(cursor / 4); // cada 4 beats = nuevo compás
    usage[bar] = (usage[bar] ?? 0) + b.durationBeats;
    cursor += b.durationBeats;          // avanzar el cursor según la duración
  }

  return usage; // Ejemplo: [4, 4, 3] → 2 compases completos y uno incompleto
}

// 🚨 Verifica si algún compás supera el límite de 4 beats
export function exceedsAnyBar(blocks: ChordBlock[]) {
  // Usa barsUsage() y devuelve true si algún compás > 4 beats
  return barsUsage(blocks).some(u => (u ?? 0) > 4);
}
