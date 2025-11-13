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
//    (totalmente soportados por romanPro/Markov)
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
//    🔒 FUTURO: por ahora el motor no los reproduce bien
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
//    (recortado a lo que romanPro soporta: bIII, bVI, bVII, iv)
// --------------------------------------------
const MODAL: TheorySet = {
  id: "modal",
  label: "Intercambio modal (modo menor/dórico)",
  groups: [
    {
      name: "Acordes prestados",
      description: "Prestados de paralela menor y modos cercanos.",
      degrees: [
        { degree: "bIII" },
        { degree: "bVI" },
        { degree: "bVII" },
        { degree: "iv" },
        // i, ii°, bII quedan para futuro (todavía no soportados)
        // { degree: "i" },
        // { degree: "ii°" },
        // { degree: "bII" },
      ],
    },
  ],
};

// --------------------------------------------
// 5) MENOR ARMÓNICA
//    🔒 FUTURO: V+, iii+, bVI+ no están aún en romanPro
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

// Exportamos solo lo que está bien soportado por el motor actual
export const THEORY_SETS: TheorySet[] = [
  DIATONIC,
  SECONDARY_DOMS,
  MODAL,
  // TRITONE,
  // HARMONIC_MINOR,
];
