// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Tests: roman2 — Motor teórico de grados romanos
// --------------------------------------------------
// Fija el comportamiento del conversor Roman → triada MIDI, que es la
// base tanto del cálculo de voice leading como del etiquetado de la UI.
//
// Las triadas esperadas están escritas nota por nota (con su lectura
// musical al lado) para que un error en la tabla de offsets se vea como
// un acorde equivocado y no sólo como un número distinto.
// --------------------------------------------------

import { describe, it, expect } from "vitest";
import {
  romanToMidiTriad,
  midiToNoteName,
  degreeToChordName,
  MAJOR_KEYS,
  type TonalKey,
  type RomanDegree,
} from "./roman2";

describe("romanToMidiTriad — grados diatónicos en C mayor", () => {
  it("construye las triadas de la escala con su calidad correcta", () => {
    expect(romanToMidiTriad("C", "I")).toEqual([60, 64, 67]); // C  E  G
    expect(romanToMidiTriad("C", "ii")).toEqual([62, 65, 69]); // D  F  A
    expect(romanToMidiTriad("C", "iii")).toEqual([64, 67, 71]); // E  G  B
    expect(romanToMidiTriad("C", "IV")).toEqual([65, 69, 72]); // F  A  C
    expect(romanToMidiTriad("C", "V")).toEqual([67, 71, 74]); // G  B  D
    expect(romanToMidiTriad("C", "vi")).toEqual([69, 72, 76]); // A  C  E
    expect(romanToMidiTriad("C", "vii°")).toEqual([71, 74, 77]); // B  D  F
  });

  it("usa triada disminuida sólo en vii°", () => {
    const [root, third, fifth] = romanToMidiTriad("C", "vii°");
    expect(third - root).toBe(3); // tercera menor
    expect(fifth - root).toBe(6); // quinta disminuida
  });
});

describe("romanToMidiTriad — acordes prestados de la paralela menor", () => {
  it("baja un semitono los grados alterados", () => {
    expect(romanToMidiTriad("C", "bIII")).toEqual([63, 67, 70]); // Eb G  Bb
    expect(romanToMidiTriad("C", "bVI")).toEqual([68, 72, 75]); // Ab C  Eb
    expect(romanToMidiTriad("C", "bVII")).toEqual([70, 74, 77]); // Bb D  F
  });

  it("iv comparte fundamental con IV pero es menor", () => {
    const mayor = romanToMidiTriad("C", "IV");
    const menor = romanToMidiTriad("C", "iv");

    expect(menor[0]).toBe(mayor[0]); // misma fundamental (F)
    expect(menor[1] - menor[0]).toBe(3); // tercera menor
    expect(mayor[1] - mayor[0]).toBe(4); // tercera mayor
  });
});

describe("romanToMidiTriad — dominantes secundarios", () => {
  it("sitúa la fundamental una quinta justa sobre el grado de destino", () => {
    expect(romanToMidiTriad("C", "V/ii")).toEqual([69, 73, 76]); // A   C# E
    expect(romanToMidiTriad("C", "V/iii")).toEqual([71, 75, 78]); // B   D# F#
    expect(romanToMidiTriad("C", "V/IV")).toEqual([60, 64, 67]); // C   E  G
    expect(romanToMidiTriad("C", "V/V")).toEqual([62, 66, 69]); // D   F# A
    expect(romanToMidiTriad("C", "V/vi")).toEqual([64, 68, 71]); // E   G# B
  });

  it("todos los dominantes secundarios son triadas mayores", () => {
    const secundarios: RomanDegree[] = ["V/ii", "V/iii", "V/IV", "V/V", "V/vi"];

    for (const grado of secundarios) {
      const [root, third, fifth] = romanToMidiTriad("C", grado);
      expect(third - root).toBe(4);
      expect(fifth - root).toBe(7);
    }
  });
});

describe("romanToMidiTriad — transposición entre tonalidades", () => {
  it("resuelve correctamente las cuatro tonalidades que ofrece la app", () => {
    expect(romanToMidiTriad("C", "I")).toEqual([60, 64, 67]); // C  E  G
    expect(romanToMidiTriad("G", "I")).toEqual([67, 71, 74]); // G  B  D
    expect(romanToMidiTriad("D", "I")).toEqual([62, 66, 69]); // D  F# A
    expect(romanToMidiTriad("F", "I")).toEqual([65, 69, 72]); // F  A  C
  });

  it("cambiar de tonalidad transporta el acorde sin deformarlo", () => {
    // G está 7 semitonos por encima de C: todo grado debe desplazarse igual.
    const grados: RomanDegree[] = ["I", "ii", "IV", "V", "vi", "bVII", "V/V"];

    for (const grado of grados) {
      const enC = romanToMidiTriad("C", grado);
      const enG = romanToMidiTriad("G", grado);

      expect(enG).toEqual(enC.map((n) => n + 7));
    }
  });

  it("cae en C si la tonalidad no está en el mapa", () => {
    const desconocida = "X" as TonalKey;
    expect(romanToMidiTriad(desconocida, "I")).toEqual(romanToMidiTriad("C", "I"));
  });
});

describe("midiToNoteName", () => {
  it("usa la convención C4 = 60", () => {
    expect(midiToNoteName(60)).toBe("C4");
    expect(midiToNoteName(61)).toBe("C#4");
    expect(midiToNoteName(72)).toBe("C5");
    expect(midiToNoteName(59)).toBe("B3");
  });

  it("nombra las alteraciones siempre con sostenidos", () => {
    expect(midiToNoteName(70)).toBe("A#4"); // nunca "Bb4"
    expect(midiToNoteName(63)).toBe("D#4"); // nunca "Eb4"
  });
});

describe("degreeToChordName", () => {
  it("añade el sufijo de calidad y quita la octava", () => {
    expect(degreeToChordName("C", "I")).toBe("C");
    expect(degreeToChordName("C", "ii")).toBe("Dm");
    expect(degreeToChordName("C", "vii°")).toBe("B°");
    expect(degreeToChordName("G", "V")).toBe("D");
    expect(degreeToChordName("F", "IV")).toBe("Bb");
  });

  it("marca como menores sólo ii, iii, vi y iv", () => {
    expect(degreeToChordName("C", "iii")).toBe("Em");
    expect(degreeToChordName("C", "vi")).toBe("Am");
    expect(degreeToChordName("C", "iv")).toBe("Fm");
    expect(degreeToChordName("C", "bIII")).toBe("Eb"); // prestado mayor, sin "m"
  });

  it("escribe la fundamental según la tonalidad, no siempre con sostenidos", () => {
    expect(degreeToChordName("C", "bVII")).toBe("Bb");
    expect(degreeToChordName("C", "bVI")).toBe("Ab");
    expect(degreeToChordName("D", "vii°")).toBe("C#°");
    expect(degreeToChordName("Eb", "IV")).toBe("Ab");
    expect(degreeToChordName("F#", "vii°")).toBe("E#°"); // séptimo grado de F#
    expect(degreeToChordName("Bb", "V/V")).toBe("C"); // dominante de F
  });

  it("nombra los dominantes secundarios por la letra de su destino", () => {
    expect(degreeToChordName("C", "V/ii")).toBe("A");
    expect(degreeToChordName("C", "V/iii")).toBe("B");
    expect(degreeToChordName("Ab", "V/vi")).toBe("C"); // vi de Ab es Fm
    expect(degreeToChordName("E", "V/V")).toBe("F#");
  });

  it("acepta la grafía enarmónica de una tonalidad guardada con sostenidos", () => {
    expect(romanToMidiTriad("A#", "I")).toEqual(romanToMidiTriad("Bb", "I"));
    expect(degreeToChordName("A#", "IV")).toBe("D#"); // IV de A# se escribe D#
  });
});

describe("MAJOR_KEYS — las 12 tonalidades que ofrece la interfaz", () => {
  it("cubre las 12 alturas sin repetir ninguna", () => {
    const tonicas = MAJOR_KEYS.map((k) => romanToMidiTriad(k, "I")[0] % 12);
    expect(MAJOR_KEYS).toHaveLength(12);
    expect(new Set(tonicas).size).toBe(12);
  });

  it("escribe la escala de cada tonalidad con las siete letras, sin repetir", () => {
    const diatonicos: RomanDegree[] = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];

    for (const tonalidad of MAJOR_KEYS) {
      const letras = diatonicos.map((g) => degreeToChordName(tonalidad, g)[0]);
      expect(new Set(letras).size).toBe(7);
    }
  });
});
