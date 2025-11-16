// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: metrics — Utilidades para análisis de compases
// --------------------------------------------------
// Este módulo calcula advertencias relacionadas con la distribución
// rítmica de una progresión. En particular:
//
// - Detecta compases donde la suma total de beats excede los 4 tiempos
//   propios del compás estándar en 4/4.
// - Devuelve una lista de advertencias indicando el número de compás
//   y cuántos beats acumulados posee.
//
// Se utiliza para validar progresiones y emitir alertas visuales en la UI.
// --------------------------------------------------

import type { ChordBlock } from "./types";

/**
 * Analiza la progresión y detecta compases cuya cantidad total de beats
 * supera los 4 tiempos estándar del compás 4/4.
 *
 * @param blocks Lista de bloques de acordes con sus duraciones.
 * @returns Una lista de advertencias con el número de compás (1-based)
 *          y la cantidad total de beats utilizados en ese compás.
 */
export function getBarWarnings(blocks: ChordBlock[]) {
  let beatCursor = 0;
  const barUsage: Record<number, number> = {};

  // Acumula beats por compás según los bloques
  for (const b of blocks) {
    const bar = Math.floor(beatCursor / 4);
    barUsage[bar] = (barUsage[bar] || 0) + b.durationBeats;
    beatCursor += b.durationBeats;
  }

  // Filtra compases que exceden 4 beats y devuelve advertencias
  return Object.entries(barUsage)
    .filter(([_, beats]) => beats > 4)
    .map(([bar, beats]) => ({
      bar: Number(bar) + 1, // se convierte a 1-based para lectura humana
      beats,
    }));
}
