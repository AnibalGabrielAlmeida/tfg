// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Tests: scoring — Integración de los tres motores
// --------------------------------------------------
// Este es el test de integración del motor de recomendación: comprueba
// que la fórmula score = markov + berklee − voiceLeading se aplica tal
// cual, que el desglose que llega a la UI es coherente con el total, y
// que el resultado es independiente de la tonalidad.
// --------------------------------------------------

import { describe, it, expect } from "vitest";
import { getScoredSuggestions } from "./scoring";
import { MAJOR_KEYS } from "../theory/roman2";

describe("getScoredSuggestions — fórmula del score", () => {
  it("suma Markov y Berklee y resta el costo de voice leading", () => {
    const sugerencias = getScoredSuggestions({
      style: "Pop",
      key: "C",
      currentDegree: "V",
      alpha: 1,
    });

    for (const s of sugerencias) {
      expect(s.score).toBeCloseTo(s.markovWeight + s.berkleeBoost - s.voiceLeadingCost, 5);
    }
  });

  it("desglosa V → I con los valores exactos de cada motor", () => {
    const [mejor] = getScoredSuggestions({
      style: "Pop",
      key: "C",
      currentDegree: "V",
      alpha: 1,
    });

    expect(mejor.degree).toBe("I");
    expect(mejor.markovWeight).toBe(4); // peso Pop de V → I
    expect(mejor.berkleeBoost).toBe(3); // cadencia auténtica
    expect(mejor.voiceLeadingCost).toBe(0.5); // 7 semitonos, con G en común
    expect(mejor.score).toBeCloseTo(6.5, 5);
  });

  it("pone la cadencia auténtica por delante del resto tras V", () => {
    const sugerencias = getScoredSuggestions({
      style: "Pop",
      key: "C",
      currentDegree: "V",
      alpha: 1,
      limit: 4,
    });

    expect(sugerencias[0].degree).toBe("I");
    expect(sugerencias[0].score).toBeGreaterThan(sugerencias[1].score);
  });
});

describe("getScoredSuggestions — orden y límite", () => {
  it("devuelve los candidatos ordenados por score descendente", () => {
    const sugerencias = getScoredSuggestions({
      style: "Neo",
      key: "C",
      currentDegree: "I",
      alpha: 0,
      limit: 5,
    });

    for (let i = 1; i < sugerencias.length; i++) {
      expect(sugerencias[i - 1].score).toBeGreaterThanOrEqual(sugerencias[i].score);
    }
  });

  it("devuelve 3 sugerencias por defecto, como espera el panel", () => {
    const sugerencias = getScoredSuggestions({
      style: "Pop",
      key: "C",
      currentDegree: "I",
    });

    expect(sugerencias).toHaveLength(3);
  });

  it("respeta el límite pedido", () => {
    expect(
      getScoredSuggestions({ style: "Pop", key: "C", currentDegree: "I", limit: 1 })
    ).toHaveLength(1);

    expect(
      getScoredSuggestions({ style: "Pop", key: "C", currentDegree: "I", limit: 2 })
    ).toHaveLength(2);
  });

  it("nunca sugiere el grado actual", () => {
    for (const grado of ["I", "ii", "IV", "V", "vi"]) {
      const sugerencias = getScoredSuggestions({
        style: "Pop",
        key: "C",
        currentDegree: grado,
        alpha: 1,
        limit: 5,
      });

      expect(sugerencias.map((s) => s.degree)).not.toContain(grado);
    }
  });
});

describe("getScoredSuggestions — independencia de la tonalidad", () => {
  it("da el mismo resultado en las doce tonalidades de la app", () => {
    const enC = getScoredSuggestions({
      style: "Pop",
      key: "C",
      currentDegree: "V",
      alpha: 1,
      limit: 4,
    });

    for (const tonalidad of MAJOR_KEYS) {
      const otra = getScoredSuggestions({
        style: "Pop",
        key: tonalidad,
        currentDegree: "V",
        alpha: 1,
        limit: 4,
      });

      expect(otra.map((s) => s.degree)).toEqual(enC.map((s) => s.degree));

      otra.forEach((s, i) => {
        expect(s.score).toBeCloseTo(enC[i].score, 5);
      });
    }
  });
});

describe("getScoredSuggestions — dominantes secundarios", () => {
  it("coloca primero la resolución del dominante secundario", () => {
    const casos: Array<[string, string]> = [
      ["V/ii", "ii"],
      ["V/V", "V"],
      ["V/vi", "vi"],
    ];

    for (const [dominante, resolucion] of casos) {
      const sugerencias = getScoredSuggestions({
        style: "Pop",
        key: "C",
        currentDegree: dominante,
        alpha: 1,
      });

      expect(sugerencias[0].degree).toBe(resolucion);
    }
  });

  it("mantiene la resolución primera aunque el historial la penalice", () => {
    const sugerencias = getScoredSuggestions({
      style: "Pop",
      key: "C",
      currentDegree: "V/ii",
      history: ["ii", "V", "ii", "V/ii"],
    });

    expect(sugerencias[0].degree).toBe("ii");
  });
});

describe("getScoredSuggestions — historial de la progresión", () => {
  it("saca del top al grado que produciría un rebote trivial", () => {
    // Sin historial, vi es la mejor sugerencia tras I
    const sinHistorial = getScoredSuggestions({
      style: "Pop",
      key: "C",
      currentDegree: "I",
    });

    expect(sinHistorial[0].degree).toBe("vi");

    // Con la progresión vi → I, volver a vi cerraría el bucle vi → I → vi
    const conHistorial = getScoredSuggestions({
      style: "Pop",
      key: "C",
      currentDegree: "I",
      history: ["vi", "I"],
    });

    expect(conHistorial.map((s) => s.degree)).not.toContain("vi");
  });

  it("refleja la penalización en el markovWeight que ve la UI", () => {
    const sugerencias = getScoredSuggestions({
      style: "Pop",
      key: "C",
      currentDegree: "V",
      history: ["I", "V"],
      limit: 5,
    });

    const haciaI = sugerencias.find((s) => s.degree === "I");

    expect(haciaI?.markovWeight).toBeCloseTo(4 * 0.4, 5);
  });

  it("la cadencia auténtica sobrevive a la penalización de rebote", () => {
    // El boost Berklee de V → I (+3) pesa más que el castigo de 0.4 al
    // peso Markov: la cadencia sigue encabezando la lista.
    const sugerencias = getScoredSuggestions({
      style: "Pop",
      key: "C",
      currentDegree: "V",
      history: ["I", "V"],
    });

    expect(sugerencias[0].degree).toBe("I");
  });

  it("un historial vacío equivale a no pasar historial", () => {
    const sinHistorial = getScoredSuggestions({
      style: "Pop",
      key: "C",
      currentDegree: "I",
    });

    const historialVacio = getScoredSuggestions({
      style: "Pop",
      key: "C",
      currentDegree: "I",
      history: [],
    });

    expect(historialVacio).toEqual(sinHistorial);
  });
});

describe("getScoredSuggestions — el estilo cambia las sugerencias", () => {
  it("Pop y Neo proponen grados distintos para el mismo contexto", () => {
    const pop = getScoredSuggestions({
      style: "Pop",
      key: "C",
      currentDegree: "I",
    }).map((s) => s.degree);

    const neo = getScoredSuggestions({
      style: "Neo",
      key: "C",
      currentDegree: "I",
    }).map((s) => s.degree);

    expect(neo).not.toEqual(pop);

    // Neo prefiere el predominante ii, que Pop no llega a proponer tras I
    expect(neo).toContain("ii");
    expect(pop).not.toContain("ii");
  });

  it("Neo abre el abanico modal que Pop no ofrece", () => {
    const neo = getScoredSuggestions({
      style: "Neo",
      key: "C",
      currentDegree: "I",
      limit: 7,
    }).map((s) => s.degree);

    expect(neo).toContain("bIII");
  });
});
