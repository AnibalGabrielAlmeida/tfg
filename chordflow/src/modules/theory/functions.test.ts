// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Tests: functions — Clasificación funcional T/S/D
// --------------------------------------------------
// functionalRoleMajor alimenta tres cosas a la vez: la etiqueta T/S/D
// que se ve en cada bloque de la progresión, las explicaciones del panel
// de sugerencias y el fallback por rol del motor Markov. Un error acá se
// propaga a los tres lugares, así que conviene fijarlo con detalle.
// --------------------------------------------------

import { describe, it, expect } from "vitest";
import { functionalRoleMajor } from "./functions";

describe("functionalRoleMajor — función de dominante", () => {
  it("clasifica V, vii° y sus variantes como D", () => {
    expect(functionalRoleMajor("V")).toBe("D");
    expect(functionalRoleMajor("V7")).toBe("D");
    expect(functionalRoleMajor("vii°")).toBe("D");
  });

  it("clasifica todos los dominantes secundarios como D", () => {
    expect(functionalRoleMajor("V/ii")).toBe("D");
    expect(functionalRoleMajor("V/iii")).toBe("D");
    expect(functionalRoleMajor("V/IV")).toBe("D");
    expect(functionalRoleMajor("V/V")).toBe("D");
    expect(functionalRoleMajor("V/vi")).toBe("D");
    expect(functionalRoleMajor("V7/V")).toBe("D");
  });
});

describe("functionalRoleMajor — función de subdominante", () => {
  it("clasifica los predominantes diatónicos como S", () => {
    expect(functionalRoleMajor("ii")).toBe("S");
    expect(functionalRoleMajor("IV")).toBe("S");
  });

  it("clasifica los prestados de la paralela menor como S", () => {
    expect(functionalRoleMajor("iv")).toBe("S");
    expect(functionalRoleMajor("bVI")).toBe("S");
    expect(functionalRoleMajor("bVII")).toBe("S");
    expect(functionalRoleMajor("bIII")).toBe("S");
  });
});

describe("functionalRoleMajor — función de tónica", () => {
  it("clasifica I y sus variantes como T", () => {
    expect(functionalRoleMajor("I")).toBe("T");
    expect(functionalRoleMajor("Imaj7")).toBe("T");
    expect(functionalRoleMajor("I6")).toBe("T");
  });

  it("clasifica vi como T", () => {
    expect(functionalRoleMajor("vi")).toBe("T");
  });

  // El mediante comparte dos notas con I (E-G-B contra C-E-G), así que su
  // función es de tónica. Empieza por "ii", de modo que es el caso donde
  // más fácil se cuela en la rama de subdominante.
  it("clasifica iii como T y no como S", () => {
    expect(functionalRoleMajor("iii")).toBe("T");
    expect(functionalRoleMajor("iii7")).toBe("T");
  });
});

describe("functionalRoleMajor — casos no estándar", () => {
  it("mantiene ii y sus variantes en S pese al prefijo compartido con iii", () => {
    expect(functionalRoleMajor("ii7")).toBe("S");
    expect(functionalRoleMajor("iiø")).toBe("S");
  });

  it("ignora los espacios sobrantes", () => {
    expect(functionalRoleMajor("  V  ")).toBe("D");
    expect(functionalRoleMajor(" iii ")).toBe("T");
  });

  it("cae en S ante un grado desconocido, no en T", () => {
    // Fallback deliberado: clasificar como subdominante mantiene un
    // comportamiento armónico más estable que forzar tónica.
    expect(functionalRoleMajor("XYZ")).toBe("S");
    expect(functionalRoleMajor("")).toBe("S");
  });

  it("devuelve siempre una de las tres funciones", () => {
    const entradas = ["I", "ii", "iii", "IV", "V", "vi", "vii°", "bVII", "??"];

    for (const entrada of entradas) {
      expect(["T", "S", "D"]).toContain(functionalRoleMajor(entrada));
    }
  });
});
