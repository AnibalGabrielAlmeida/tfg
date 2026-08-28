// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Tests: markov — Filas de transición por estilo
// --------------------------------------------------
// getBlendedMarkovRow es la única puerta de entrada a las matrices que
// usa la interfaz (useSuggestions → getScoredSuggestions → aquí). Estos
// tests fijan la mezcla por alpha, el fallback por función tonal y la
// forma de las matrices, que son pesos escritos a mano y por lo tanto
// fáciles de romper con una edición distraída.
// --------------------------------------------------

import { describe, it, expect } from "vitest";
import { getBlendedMarkovRow } from "./markov";

describe("getBlendedMarkovRow — estilos puros", () => {
  it("con alpha = 1 devuelve la fila Pop tal cual", () => {
    expect(getBlendedMarkovRow("Pop", "I", 1)).toEqual({
      vi: 3,
      IV: 2,
      V: 2,
      ii: 1,
      bVII: 1,
    });
  });

  it("con alpha = 0 devuelve la fila Neo tal cual", () => {
    expect(getBlendedMarkovRow("Neo", "I", 0)).toEqual({
      vi: 3,
      IV: 3,
      ii: 2,
      V: 1,
      iii: 1,
      bVII: 2,
      bIII: 1,
    });
  });

  it("Pop apunta a la cadencia y Neo abre el abanico modal", () => {
    const pop = getBlendedMarkovRow("Pop", "V", 1);
    const neo = getBlendedMarkovRow("Neo", "V", 0);

    // En Pop, V tira a I por encima de todo
    expect(pop.I).toBeGreaterThan(pop.vi);

    // En Neo, V se desvía hacia vi / IV (cadencia rota, color neo-soul)
    expect(neo.vi).toBeGreaterThan(neo.I);
    expect(neo.bVII).toBeGreaterThan(0);
  });
});

describe("getBlendedMarkovRow — mezcla lineal", () => {
  it("con alpha = 0.5 promedia ambas matrices sobre la unión de grados", () => {
    const fila = getBlendedMarkovRow("Pop", "I", 0.5);

    expect(fila.vi).toBeCloseTo(3, 5); // 3 en ambas
    expect(fila.IV).toBeCloseTo(2.5, 5); // 2 en Pop, 3 en Neo
    expect(fila.V).toBeCloseTo(1.5, 5); // 2 en Pop, 1 en Neo
    expect(fila.ii).toBeCloseTo(1.5, 5); // 1 en Pop, 2 en Neo
    expect(fila.bVII).toBeCloseTo(1.5, 5); // 1 en Pop, 2 en Neo

    // Grados que sólo existen en Neo entran con la mitad de su peso
    expect(fila.iii).toBeCloseTo(0.5, 5);
    expect(fila.bIII).toBeCloseTo(0.5, 5);
  });

  it("alpha = 1 y alpha = 0 son los extremos de la misma mezcla", () => {
    const soloPop = getBlendedMarkovRow("Pop", "IV", 1);
    const soloNeo = getBlendedMarkovRow("Neo", "IV", 0);
    const mitad = getBlendedMarkovRow("Pop", "IV", 0.5);

    for (const grado of Object.keys(mitad)) {
      const esperado = ((soloPop[grado] ?? 0) + (soloNeo[grado] ?? 0)) / 2;
      expect(mitad[grado]).toBeCloseTo(esperado, 5);
    }
  });

  // Cableado real de la app: useSuggestions pasa alpha = 1 para Pop y
  // alpha = 0 para Neo, nunca deja el valor por defecto.
  it("el alpha por defecto es 1, así que 'Neo' sin alpha devuelve pesos Pop", () => {
    const neoPorDefecto = getBlendedMarkovRow("Neo", "I");
    const pop = getBlendedMarkovRow("Pop", "I", 1);

    for (const grado of Object.keys(pop)) {
      expect(neoPorDefecto[grado]).toBeCloseTo(pop[grado], 5);
    }

    // Los grados exclusivos de Neo aparecen, pero con peso 0
    expect(neoPorDefecto.bIII).toBe(0);
  });
});

describe("getBlendedMarkovRow — fallback por función tonal", () => {
  it("construye una fila descendente para un grado sin entrada en la matriz", () => {
    // "bII" no está en ninguna matriz; su función tonal es S
    expect(getBlendedMarkovRow("Pop", "bII", 1)).toEqual({ V: 3, ii: 2, I: 1 });
  });

  it("el fallback de Neo incluye color modal que el de Pop no tiene", () => {
    expect(getBlendedMarkovRow("Neo", "bII", 0)).toEqual({
      V: 4,
      ii: 3,
      I: 2,
      bVII: 1,
    });
  });

  it("ningún grado queda sin candidatos", () => {
    const grados = ["I", "ii", "iii", "IV", "V", "vi", "vii°", "bVII", "V/V", "inventado"];

    for (const grado of grados) {
      const fila = getBlendedMarkovRow("Pop", grado, 1);
      expect(Object.keys(fila).length).toBeGreaterThan(0);
    }
  });
});

describe("getBlendedMarkovRow — dominantes secundarios", () => {
  it("da el peso máximo a la resolución esperada", () => {
    const casos: Array<[string, string]> = [
      ["V/ii", "ii"],
      ["V/iii", "iii"],
      ["V/IV", "IV"],
      ["V/V", "V"],
      ["V/vi", "vi"],
    ];

    for (const [dominante, resolucion] of casos) {
      const fila = getBlendedMarkovRow("Pop", dominante, 1);
      const maximo = Math.max(...Object.values(fila));

      expect(fila[resolucion]).toBe(maximo);
    }
  });
});

describe("matrices — consistencia general", () => {
  it("todos los pesos son positivos", () => {
    const grados = ["I", "ii", "iii", "IV", "V", "vi", "vii°", "bIII", "bVI", "bVII", "iv"];

    for (const estilo of ["Pop", "Neo"] as const) {
      const alpha = estilo === "Pop" ? 1 : 0;

      for (const grado of grados) {
        for (const peso of Object.values(getBlendedMarkovRow(estilo, grado, alpha))) {
          expect(peso).toBeGreaterThan(0);
        }
      }
    }
  });

  it("ningún grado se sugiere a sí mismo", () => {
    const grados = ["I", "ii", "iii", "IV", "V", "vi", "vii°", "bVII"];

    for (const grado of grados) {
      expect(getBlendedMarkovRow("Pop", grado, 1)[grado]).toBeUndefined();
      expect(getBlendedMarkovRow("Neo", grado, 0)[grado]).toBeUndefined();
    }
  });
});
