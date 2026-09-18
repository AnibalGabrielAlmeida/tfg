// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Tests: berklee — Reglas de armonía funcional
// --------------------------------------------------
// La tabla de reglas es la que aporta el "por qué" de cada sugerencia:
// su boost entra en el score y su descripción se muestra en la UI. Estos
// tests fijan los valores concretos de las reglas que más pesan y las
// invariantes que deben cumplirse aunque la tabla crezca.
// --------------------------------------------------

import { describe, it, expect } from "vitest";
import { getBerkleeBoost, getBerkleeRules, getBerkleeExplanation } from "./berklee";

describe("getBerkleeBoost — cadencias", () => {
  it("premia la cadencia auténtica por encima de la plagal", () => {
    expect(getBerkleeBoost("V", "I")).toBe(3);
    expect(getBerkleeBoost("IV", "I")).toBe(1.5);
    expect(getBerkleeBoost("V", "I")).toBeGreaterThan(getBerkleeBoost("IV", "I"));
  });

  it("premia la preparación ii → V", () => {
    expect(getBerkleeBoost("ii", "V")).toBe(2);
  });
});

describe("getBerkleeBoost — dominantes secundarios y color modal", () => {
  it("premia cada dominante secundario hacia su resolución", () => {
    expect(getBerkleeBoost("V/ii", "ii")).toBe(2);
    expect(getBerkleeBoost("V/vi", "vi")).toBe(2);
    expect(getBerkleeBoost("V/V", "V")).toBe(2);
  });

  it("premia la resolución backdoor y el intercambio modal", () => {
    expect(getBerkleeBoost("bVII", "I")).toBe(1.5);
    expect(getBerkleeBoost("bVI", "I")).toBe(1.5);
    expect(getBerkleeBoost("bIII", "I")).toBe(1.2);
    expect(getBerkleeBoost("bVII", "V")).toBe(1.2);
  });
});

describe("getBerkleeBoost — invariantes", () => {
  it("devuelve 0 cuando la transición no tiene regla", () => {
    expect(getBerkleeBoost("I", "V")).toBe(0);
    expect(getBerkleeBoost("vi", "iii")).toBe(0);
    expect(getBerkleeBoost("nada", "tampoco")).toBe(0);
  });

  it("es direccional: V → I no implica I → V", () => {
    expect(getBerkleeBoost("V", "I")).toBe(3);
    expect(getBerkleeBoost("I", "V")).toBe(0);
  });

  it("toma el máximo de las reglas aplicables, no la suma", () => {
    // Invariante que debe seguir valiendo aunque se agreguen reglas
    // duplicadas para una misma transición.
    const transiciones: Array<[string, string]> = [
      ["V", "I"],
      ["ii", "V"],
      ["bVII", "I"],
      ["bVII", "V"],
      ["V/ii", "ii"],
      ["I", "IV"],
    ];

    for (const [desde, hacia] of transiciones) {
      const reglas = getBerkleeRules(desde, hacia);
      const esperado = reglas.length ? Math.max(...reglas.map((r) => r.boost)) : 0;

      expect(getBerkleeBoost(desde, hacia)).toBe(esperado);
    }
  });
});

describe("getBerkleeExplanation", () => {
  it("devuelve la descripción de la regla aplicable", () => {
    expect(getBerkleeExplanation("V", "I")).toBe("V resuelve en I (cadencia auténtica)");
    expect(getBerkleeExplanation("ii", "V")).toBe("ii prepara V (predominante → dominante)");
  });

  it("devuelve null cuando no hay regla, en vez de una cadena vacía", () => {
    expect(getBerkleeExplanation("I", "V")).toBeNull();
  });

  it("cada regla trae una descripción no vacía para la UI", () => {
    for (const regla of getBerkleeRules("V", "I")) {
      expect(regla.description.length).toBeGreaterThan(0);
      expect(regla.tag).toBeTruthy();
    }
  });
});
