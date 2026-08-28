// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Tests: heuristics — Costo de voice leading
// --------------------------------------------------
// El costo de voice leading es el único término del score que resta, así
// que sus tres escalones (0 / 1 / 2) y el descuento por nota común son
// los que deciden empates entre candidatos con peso Markov parecido.
// --------------------------------------------------

import { describe, it, expect } from "vitest";
import {
  noteToMidi,
  getPitchClass,
  getAverageDistance,
  countCommonPitchClasses,
  getVoiceLeadingCost,
} from "./heuristics";

describe("noteToMidi", () => {
  it("usa la convención C4 = 60", () => {
    expect(noteToMidi("C4")).toBe(60);
    expect(noteToMidi("C5")).toBe(72);
    expect(noteToMidi("C3")).toBe(48);
  });

  it("acepta sostenidos y bemoles como enarmónicos equivalentes", () => {
    expect(noteToMidi("F#3")).toBe(54);
    expect(noteToMidi("Gb3")).toBe(54);
    expect(noteToMidi("Bb5")).toBe(82);
    expect(noteToMidi("A#5")).toBe(82);
  });

  it("deja pasar los números MIDI sin tocarlos", () => {
    expect(noteToMidi(67)).toBe(67);
    expect(noteToMidi(0)).toBe(0);
  });

  it("cae en C4 ante un formato irreconocible", () => {
    expect(noteToMidi("H4")).toBe(60);
    expect(noteToMidi("nota")).toBe(60);
  });
});

describe("getPitchClass", () => {
  it("descarta la octava", () => {
    expect(getPitchClass("C4")).toBe("C");
    expect(getPitchClass("F#3")).toBe("F#");
    expect(getPitchClass(60)).toBe("C");
    expect(getPitchClass(72)).toBe("C");
  });

  it("normaliza los números MIDI negativos", () => {
    expect(getPitchClass(-1)).toBe("B");
  });
});

describe("getAverageDistance", () => {
  it("compara los centros de altura de los dos acordes", () => {
    // C mayor (media 63.67) contra G mayor (media 70.67)
    expect(getAverageDistance([60, 64, 67], [67, 71, 74])).toBeCloseTo(7, 5);
  });

  it("es simétrica", () => {
    const a = [60, 64, 67];
    const b = [69, 72, 76];

    expect(getAverageDistance(a, b)).toBeCloseTo(getAverageDistance(b, a), 5);
  });

  it("devuelve 0 si alguno de los acordes viene vacío", () => {
    expect(getAverageDistance([], [60, 64, 67])).toBe(0);
    expect(getAverageDistance([60], [])).toBe(0);
  });
});

describe("countCommonPitchClasses", () => {
  it("cuenta notas compartidas ignorando la octava", () => {
    expect(countCommonPitchClasses(["C4", "E4", "G4"], ["C3", "G3"])).toBe(2);
  });

  it("no cuenta dos veces la misma pitch class duplicada", () => {
    expect(countCommonPitchClasses(["C4", "C5"], ["C3"])).toBe(1);
  });

  it("devuelve 0 entre acordes sin notas en común", () => {
    // C-E-G contra D-F-A
    expect(countCommonPitchClasses([60, 64, 67], [62, 65, 69])).toBe(0);
  });
});

describe("getVoiceLeadingCost", () => {
  it("no cobra nada por un movimiento cercano", () => {
    // C → Dm: los centros distan menos de 4 semitonos
    expect(getVoiceLeadingCost([60, 64, 67], [62, 65, 69])).toBe(0);
  });

  it("cobra 1 en el tramo medio y descuenta 0.5 por nota común", () => {
    // C → G: 7 semitonos de distancia y comparten la nota G
    expect(getVoiceLeadingCost([60, 64, 67], [67, 71, 74])).toBe(0.5);
  });

  it("cobra 2 por un salto grande, menos el descuento", () => {
    // C4 → C5: misma tríada una octava arriba, 12 semitonos
    expect(getVoiceLeadingCost([60, 64, 67], [72, 76, 79])).toBe(1.5);
  });

  it("nunca devuelve un costo negativo", () => {
    // Movimiento cercano (costo 0) con notas en común: el descuento de 0.5
    // no puede empujar el resultado por debajo de 0.
    expect(getVoiceLeadingCost([60, 64, 67], [60, 64, 67])).toBe(0);
    expect(getVoiceLeadingCost([60, 64, 67], [57, 60, 64])).toBe(0); // C → Am
  });

  it("premia el movimiento suave frente al salto", () => {
    const suave = getVoiceLeadingCost([60, 64, 67], [62, 65, 69]);
    const salto = getVoiceLeadingCost([60, 64, 67], [84, 88, 91]);

    expect(suave).toBeLessThan(salto);
  });

  it("es invariante ante la transposición de ambos acordes", () => {
    const enC = getVoiceLeadingCost([60, 64, 67], [67, 71, 74]);
    const enG = getVoiceLeadingCost([67, 71, 74], [74, 78, 81]);

    expect(enG).toBe(enC);
  });
});
