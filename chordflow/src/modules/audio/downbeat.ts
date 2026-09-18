// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Cálculo del próximo downbeat dentro del loop
// --------------------------------------------------
// Cálculo puro (sin Tone.js) de en qué tick del Transport se aplica un
// cambio de progresión mientras suena, para poder testearlo aislado.
//
// Dos detalles del Transport de Tone.js lo condicionan:
//
// - Al llegar a loopEnd el Transport salta a loopStart ANTES de disparar
//   los eventos de ese tick, así que un evento agendado exactamente en
//   loopEnd no se dispara nunca. El downbeat que cae en loopEnd es, en
//   la práctica, el tick 0 de la siguiente vuelta.
//
// - Los eventos del downbeat deben estar agendados antes de que el
//   Transport procese ese tick. Por eso el cambio se aplica un tick
//   antes del downbeat, no en el downbeat mismo.
// --------------------------------------------------

export interface DownbeatSwap {
  /** Tick del compás en el que empieza a sonar la nueva progresión. */
  downbeat: number;

  /** Tick en el que se reemplazan los eventos (un tick antes del downbeat). */
  swapTick: number;
}

/**
 * Devuelve el próximo downbeat dentro del loop y el tick en el que hay
 * que reprogramar para que ese downbeat ya suene con la progresión nueva.
 *
 * @param nowTicks        Posición actual del Transport, en ticks.
 * @param ticksPerMeasure Largo del compás en ticks (PPQ · 4 en 4/4).
 * @param loopEndTicks    Fin del loop actual, en ticks.
 */
export function getNextDownbeatSwap(
  nowTicks: number,
  ticksPerMeasure: number,
  loopEndTicks: number
): DownbeatSwap {
  // Margen de dos ticks: el swap (downbeat − 1) tiene que quedar
  // estrictamente por delante de la posición actual.
  const next = Math.ceil((nowTicks + 2) / ticksPerMeasure) * ticksPerMeasure;

  // Un downbeat en loopEnd o más allá es el inicio de la próxima vuelta
  if (next >= loopEndTicks) {
    return { downbeat: 0, swapTick: loopEndTicks - 1 };
  }

  return { downbeat: next, swapTick: next - 1 };
}
