// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Tests: markov — Filas de transición por estilo
// --------------------------------------------------
// getBlendedMarkovRow es la única puerta de entrada a las matrices que
// usa la interfaz (SuggestionPanel → getScoredSuggestions → aquí). Estos
// tests fijan la mezcla por alpha, el fallback por función tonal y la
// forma de las matrices, que son pesos escritos a mano y por lo tanto
// fáciles de romper con una edición distraída.
//
// applyPenalties se testea aparte: es pura, así que basta con pasarle un
// historial y comprobar los factores resultantes.
// --------------------------------------------------

import { describe, it, expect } from "vitest";
import { getBlendedMarkovRow, applyPenalties } from "./markov";

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

  it("deriva el alpha por defecto del estilo pedido", () => {
    expect(getBlendedMarkovRow("Pop", "I")).toEqual(getBlendedMarkovRow("Pop", "I", 1));
    expect(getBlendedMarkovRow("Neo", "I")).toEqual(getBlendedMarkovRow("Neo", "I", 0));

    // Pedir Neo no puede devolver la fila de Pop
    expect(getBlendedMarkovRow("Neo", "I")).not.toEqual(getBlendedMarkovRow("Pop", "I"));
  });

  it("en los extremos no cuela grados con peso 0 de la otra matriz", () => {
    for (const fila of [
      getBlendedMarkovRow("Pop", "I", 1),
      getBlendedMarkovRow("Neo", "I", 0),
    ]) {
      for (const peso of Object.values(fila)) {
        expect(peso).toBeGreaterThan(0);
      }
    }
  });

  it("devuelve una copia: mutar la fila no contamina la matriz", () => {
    const fila = getBlendedMarkovRow("Pop", "I", 1);
    fila.vi = 999;

    expect(getBlendedMarkovRow("Pop", "I", 1).vi).toBe(3);
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

describe("applyPenalties — bucles y repeticiones", () => {
  const fila = { I: 4, IV: 2, V: 2, vi: 2, ii: 1 };

  it("no penaliza nada con un historial vacío", () => {
    expect(applyPenalties(fila, [])).toEqual(fila);
  });

  it("castiga con 0.4 el rebote hacia el grado anterior", () => {
    // Progresión I → V: volver a I cerraría el bucle I → V → I → V
    const penalizada = applyPenalties(fila, ["I", "V"]);

    expect(penalizada.I).toBeCloseTo(4 * 0.4, 5);
  });

  it("castiga con 0.6 un grado que sonó hace poco", () => {
    // vi está en la ventana reciente, pero no es el grado anterior
    const penalizada = applyPenalties(fila, ["vi", "IV", "V"]);

    expect(penalizada.vi).toBeCloseTo(2 * 0.6, 5);
  });

  it("castiga con 0.6 · 0.3 quedarse en el grado actual", () => {
    const penalizada = applyPenalties(fila, ["IV", "V"]);

    expect(penalizada.V).toBeCloseTo(2 * 0.6 * 0.3, 5);
  });

  it("deja intactos los grados que no aparecen en el historial", () => {
    const penalizada = applyPenalties(fila, ["I", "V"]);

    expect(penalizada.IV).toBe(2);
    expect(penalizada.ii).toBe(1);
  });

  it("olvida lo que quedó fuera de la ventana reciente", () => {
    // ii quedó a cinco grados de distancia: ya no penaliza
    const penalizada = applyPenalties(fila, ["ii", "I", "IV", "vi", "V"]);

    expect(penalizada.ii).toBe(1);
  });

  it("nunca anula un candidato del todo", () => {
    const penalizada = applyPenalties({ V: 0 }, ["I", "V"]);

    expect(penalizada.V).toBeGreaterThan(0);
  });

  it("es pura: no muta la fila y repite el mismo resultado", () => {
    const entrada = { I: 4, vi: 2 };
    const historial = ["IV", "V"];

    const primera = applyPenalties(entrada, historial);
    const segunda = applyPenalties(entrada, historial);

    expect(primera).toEqual(segunda);
    expect(entrada).toEqual({ I: 4, vi: 2 });
  });
});
