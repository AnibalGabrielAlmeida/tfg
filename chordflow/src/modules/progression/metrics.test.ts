// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Tests: metrics — Advertencias de compás
// --------------------------------------------------
// getBarWarnings es lo que alimenta la alerta visual de compás desbordado.
// Los tests fijan también su relación con barsUsage / exceedsAnyBar, que
// implementan el mismo reparto de beats en types.ts: si alguna de las dos
// copias cambia y la otra no, estos tests lo detectan.
// --------------------------------------------------

import { describe, it, expect } from "vitest";
import { getBarWarnings } from "./metrics";
import { barsUsage, exceedsAnyBar, type ChordBlock } from "./types";

/** Construye una progresión a partir de una lista de duraciones en beats. */
function progresion(...duraciones: number[]): ChordBlock[] {
  return duraciones.map((durationBeats, i) => ({
    id: `b${i}`,
    degree: "I" as const,
    durationBeats,
  }));
}

describe("getBarWarnings — progresiones válidas", () => {
  it("no advierte nada con una progresión vacía", () => {
    expect(getBarWarnings([])).toEqual([]);
  });

  it("no advierte nada cuando cada compás suma exactamente 4 beats", () => {
    expect(getBarWarnings(progresion(4, 4, 4))).toEqual([]);
    expect(getBarWarnings(progresion(2, 2, 2, 2))).toEqual([]);
    expect(getBarWarnings(progresion(1, 1, 1, 1, 4))).toEqual([]);
  });

  it("no advierte nada cuando un compás queda incompleto", () => {
    expect(getBarWarnings(progresion(2))).toEqual([]);
    expect(getBarWarnings(progresion(4, 3))).toEqual([]);
  });
});

describe("getBarWarnings — compases desbordados", () => {
  it("informa el compás en numeración 1-based y sus beats acumulados", () => {
    expect(getBarWarnings(progresion(2, 4))).toEqual([{ bar: 1, beats: 6 }]);
  });

  it("señala el compás correcto cuando el desborde no es el primero", () => {
    // Compás 1 completo (4), compás 2 con 3 + 4 = 7 beats
    expect(getBarWarnings(progresion(4, 3, 4))).toEqual([{ bar: 2, beats: 7 }]);
  });

  it("informa todos los compases desbordados, no sólo el primero", () => {
    // Seis bloques de 3 beats: desbordan el compás 1 y el 4
    expect(getBarWarnings(progresion(3, 3, 3, 3, 3, 3))).toEqual([
      { bar: 1, beats: 6 },
      { bar: 4, beats: 6 },
    ]);
  });

  // El bloque se contabiliza entero en el compás donde empieza: no se
  // reparte a caballo entre dos compases.
  it("asigna el bloque completo al compás donde arranca", () => {
    expect(getBarWarnings(progresion(3, 6))).toEqual([{ bar: 1, beats: 9 }]);
  });
});

describe("getBarWarnings — coherencia con barsUsage / exceedsAnyBar", () => {
  it("advierte exactamente cuando exceedsAnyBar da true", () => {
    const casos = [
      progresion(),
      progresion(4, 4),
      progresion(2, 4),
      progresion(4, 3, 4),
      progresion(1, 1, 1, 1),
      progresion(5),
    ];

    for (const blocks of casos) {
      expect(getBarWarnings(blocks).length > 0).toBe(exceedsAnyBar(blocks));
    }
  });

  it("reporta los mismos beats por compás que barsUsage", () => {
    const blocks = progresion(2, 4, 4, 3, 3);
    const usage = barsUsage(blocks);

    for (const { bar, beats } of getBarWarnings(blocks)) {
      expect(usage[bar - 1]).toBe(beats);
    }
  });
});
