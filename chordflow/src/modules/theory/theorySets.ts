// --------------------------------------------------
// 🎼 Teoría Armonica — Conjuntos de acordes por sistema
// --------------------------------------------------

export type TheoryGroup = {
  name: string;
  description: string;
  degrees: { degree: string; label?: string }[];
};

export type TheorySet = {
  id: string;
  label: string;
  groups: TheoryGroup[];
};

// --------------------------------------------
// 1) DIATÓNICOS (Mayor)
// --------------------------------------------
const DIATONIC: TheorySet = {
  id: "diatonic",
  label: "Diatónicos (mayor)",
  groups: [
    {
      name: "Tónica (T)",
      description: "Reposo y estabilidad.",
      degrees: [{ degree: "I" }, { degree: "iii" }, { degree: "vi" }],
    },
    {
      name: "Subdominante (S)",
      description: "Prepara o desvía hacia D o regreso a T.",
      degrees: [{ degree: "ii" }, { degree: "IV" }],
    },
    {
      name: "Dominante (D)",
      description: "Tensión que empuja a resolver en T.",
      degrees: [{ degree: "V" }, { degree: "vii°" }],
    },
  ],
};

// --------------------------------------------
// 2) DOMINANTES SECUNDARIOS
// --------------------------------------------
const SECONDARY_DOMS: TheorySet = {
  id: "secondary",
  label: "Dominantes secundarios",
  groups: [
    {
      name: "Dominantes secundarios",
      description: "Dominantes que resuelven a grados diatónicos.",
      degrees: [
        { degree: "V/ii" },
        { degree: "V/iii" },
        { degree: "V/IV" },
        { degree: "V/V" },
        { degree: "V/vi" },
      ],
    },
  ],
};

// --------------------------------------------
// 3) SUSTITUCIÓN TRITONAL
// --------------------------------------------
const TRITONE: TheorySet = {
  id: "tritone",
  label: "Sustitución tritonal",
  groups: [
    {
      name: "SubV (tritonales)",
      description: "Dominantes sustitutos a distancia de tritono.",
      degrees: [
        { degree: "SubV/ii" },
        { degree: "SubV/iii" },
        { degree: "SubV/IV" },
        { degree: "SubV/V" },
        { degree: "SubV/vi" },
      ],
    },
  ],
};

// --------------------------------------------
// 4) INTERCAMBIO MODAL
// --------------------------------------------
const MODAL: TheorySet = {
  id: "modal",
  label: "Intercambio modal (modo menor/dórico/frigio)",
  groups: [
    {
      name: "Acordes prestados",
      description: "Prestados de paralela menor y modos cercanos.",
      degrees: [
        { degree: "bIII" },
        { degree: "bVI" },
        { degree: "bVII" },
        { degree: "iv" },
        { degree: "i" },
        { degree: "ii°" },
        { degree: "bII" }, // frigio
      ],
    },
  ],
};

// --------------------------------------------
// 5) MENOR ARMÓNICA
// --------------------------------------------
const HARMONIC_MINOR: TheorySet = {
  id: "harmonicMinor",
  label: "Prestados de menor armónica",
  groups: [
    {
      name: "Acordes de C menor armónica",
      description: "Tensión fuerte, leading tone y V mayor.",
      degrees: [
        { degree: "V+" },
        { degree: "vii°" },
        { degree: "iii+" },
        { degree: "bVI+" },
      ],
    },
  ],
};

// Exportamos todas las teorías disponibles
export const THEORY_SETS: TheorySet[] = [
  DIATONIC,
  SECONDARY_DOMS,
  TRITONE,
  MODAL,
  HARMONIC_MINOR,
];
