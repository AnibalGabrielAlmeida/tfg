// --------------------------------------------------
// 🎵 ChordFlow — Motor de recomendación armónica (Markov)
// --------------------------------------------------
// Este módulo define dos matrices de transición
// (POP y NEO) y las funciones que sugieren el
// siguiente acorde según el estilo y el contexto.
//
// POP → modelo determinista (elige el más probable)
// NEO → modelo probabilístico (elige al azar, ponderado)
// --------------------------------------------------

// ---------- 🎸 POP: clásico (transiciones más cadenciales) ----------
const MARKOV_POP: Record<string, Record<string, number>> = {
  I:    { vi: 3, IV: 2, V: 2, ii: 1 },     // tónica → funciones sub o dom
  ii:   { V: 4, "vii°": 1, IV: 1 },        // pre-dominante → dominante
  iii:  { vi: 3, IV: 2, ii: 1 },           // transición suave hacia vi o IV
  IV:   { V: 3, ii: 2, I: 1 },             // subdominante → dominante o tónica
  V:    { I: 4, vi: 2, IV: 1 },            // dominante → resuelve en tónica
  vi:   { IV: 3, ii: 2, V: 1 },            // submediante → variación común
  "vii°": { I: 4, V: 2 },                  // sensible → resolución fuerte
};

// ---------- 🎹 NEO: más permisivo, circular y suave ----------
const MARKOV_NEO: Record<string, Record<string, number>> = {
  // reduce la tensión cadencial y aumenta movimientos modales
  ii:   { I: 3, IV: 3, V: 2, "vii°": 1, iii: 1 },
  I:    { vi: 3, IV: 3, ii: 2, V: 1, iii: 1 },
  iii:  { vi: 3, IV: 3, ii: 2, I: 1 },
  IV:   { I: 3, ii: 3, V: 2, vi: 2, iii: 1 },
  V:    { I: 2, vi: 3, IV: 3, ii: 2 },        // menos cadencial
  vi:   { IV: 3, ii: 3, I: 2, V: 1, iii: 2 }, // progresiones más circulares
  "vii°": { I: 2, V: 2, iii: 2, IV: 1 },      // no necesariamente resuelve
};

// 🎚️ Estilos disponibles
export type Style = "Pop" | "Neo";

// --------------------------------------------------
// 🎯 Funciones auxiliares
// --------------------------------------------------

// 🔹 top1(row): devuelve el acorde más probable (usado por POP)
function top1(row?: Record<string, number>) {
  if (!row) return "V"; // fallback
  let best = "I", w = -Infinity;
  for (const [deg, ww] of Object.entries(row)) {
    if (ww > w) { w = ww; best = deg; }
  }
  return best;
}

// 🔸 weightedPick(row): elección aleatoria ponderada (usado por NEO)
function weightedPick(row?: Record<string, number>) {
  if (!row) return "V";
  const entries = Object.entries(row);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [deg, w] of entries) {
    if ((r -= w) <= 0) return deg; // cae dentro del peso acumulado
  }
  return entries[0][0]; // fallback (debería ser inalcanzable)
}

// --------------------------------------------------
// 🧠 Función principal: sugerir siguiente acorde
// --------------------------------------------------
export function suggestNextDegree(style: Style, current: string): string {
  // Si el estilo es Neo → elige aleatoriamente según pesos
  // Si es Pop → elige el acorde con mayor probabilidad
  if (style === "Neo") return weightedPick(MARKOV_NEO[current]);
  return top1(MARKOV_POP[current]);
}

// --------------------------------------------------
// ⚙️ Compatibilidad con versiones anteriores
// --------------------------------------------------
export function suggestNextDegreePop(current: string): string {
  return top1(MARKOV_POP[current]);
}
