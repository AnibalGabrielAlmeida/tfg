// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Tests: downbeat — Punto de reprogramación durante la reproducción
// --------------------------------------------------
// Con PPQ = 192 (valor por defecto de Tone.js) un compás de 4/4 dura
// 768 ticks, y la progresión inicial de cuatro compases, 3072.
// --------------------------------------------------

import { describe, it, expect } from "vitest";
import { getNextDownbeatSwap } from "./downbeat";

const MEASURE = 192 * 4;
const LOOP_END = MEASURE * 4;

describe("getNextDownbeatSwap — dentro del loop", () => {
  it("aplica el cambio en el comienzo del compás siguiente", () => {
    expect(getNextDownbeatSwap(100, MEASURE, LOOP_END)).toEqual({
      downbeat: 768,
      swapTick: 767,
    });

    expect(getNextDownbeatSwap(1600, MEASURE, LOOP_END)).toEqual({
      downbeat: 2304,
      swapTick: 2303,
    });
  });

  it("parado justo en un downbeat, espera al siguiente compás", () => {
    // El downbeat actual ya se procesó: reagendar ahí no sonaría
    expect(getNextDownbeatSwap(768, MEASURE, LOOP_END).downbeat).toBe(1536);
  });

  it("deja siempre el swap por delante de la posición actual", () => {
    for (let now = 0; now < LOOP_END; now += 7) {
      const { swapTick } = getNextDownbeatSwap(now, MEASURE, LOOP_END);
      if (swapTick !== LOOP_END - 1) {
        expect(swapTick).toBeGreaterThan(now);
      }
    }
  });

  it("a un tick del downbeat pasa al compás siguiente en lugar de llegar tarde", () => {
    expect(getNextDownbeatSwap(767, MEASURE, LOOP_END).downbeat).toBe(1536);
  });
});

describe("getNextDownbeatSwap — último compás del loop", () => {
  it("nunca agenda en loopEnd, donde Tone.js no dispara eventos", () => {
    for (let now = MEASURE * 3; now < LOOP_END; now += 13) {
      const swap = getNextDownbeatSwap(now, MEASURE, LOOP_END);
      expect(swap.downbeat).not.toBe(LOOP_END);
      expect(swap.swapTick).toBeLessThan(LOOP_END);
    }
  });

  it("aplica el cambio al volver al inicio del loop", () => {
    expect(getNextDownbeatSwap(2500, MEASURE, LOOP_END)).toEqual({
      downbeat: 0,
      swapTick: LOOP_END - 1,
    });
  });

  it("funciona con loops que no terminan en un compás completo", () => {
    // 14 beats: el último compás tiene sólo 2
    const loopEnd = 14 * 192;
    expect(getNextDownbeatSwap(2400, MEASURE, loopEnd)).toEqual({
      downbeat: 0,
      swapTick: loopEnd - 1,
    });
  });

  it("funciona con loops más cortos que un compás", () => {
    const loopEnd = 2 * 192;
    expect(getNextDownbeatSwap(50, MEASURE, loopEnd)).toEqual({
      downbeat: 0,
      swapTick: loopEnd - 1,
    });
  });
});
