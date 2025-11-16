// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Conjuntos de acordes por sistema teórico
// --------------------------------------------------
// Este módulo agrupa grados armónicos (en notación romana)
// en distintos conjuntos teóricos. Cada conjunto representa
// un “sistema” o enfoque (diatónico, dominantes secundarios,
// intercambio modal, etc.) que se utiliza en la interfaz para:
//
// - Organizar el “banco de acordes” por función o sistema.
// - Facilitar la exploración guiada de acordes afines.
// - Mantener alineación con el motor teórico roman2/Markov.
//
// Solo se exportan aquellos conjuntos totalmente soportados
// por el motor actual (roman2 y Markov).
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
// 1) DIATÓNICOS (modo mayor)
// --------------------------------------------
const DIATONIC: TheorySet = {
  id: "diatonic",
  label: "Diatónicos (mayor)",
  groups: [
    {
      name: "Tónica (T)",
      description: "Acordes de reposo y estabilidad.",
      degrees: [{ degree: "I" }, { degree: "iii" }, { degree: "vi" }],
    },
    {
      name: "Subdominante (S)",
      description: "Prepara o desvía hacia D o para regresar a T.",
      degrees: [{ degree: "ii" }, { degree: "IV" }],
    },
    {
      name: "Dominante (D)",
      description: "Acordes de tensión que empujan a resolver en T.",
      degrees: [{ degree: "V" }, { degree: "vii°" }],
    },
  ],
};

// --------------------------------------------
// 2) DOMINANTES SECUNDARIOS
//    (totalmente soportados por roman2 / Markov)
// --------------------------------------------
const SECONDARY_DOMS: TheorySet = {
  id: "secondary",
  label: "Dominantes secundarios",
  groups: [
    {
      name: "Dominantes secundarios",
      description: "Dominantes que resuelven hacia grados diatónicos.",
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
//    FUTURO: por ahora el motor no los reproduce bien
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
//    (recortado a lo que roman2 soporta: bIII, bVI, bVII, iv)
// --------------------------------------------
const MODAL: TheorySet = {
  id: "modal",
  label: "Intercambio modal (modo menor/dórico)",
  groups: [
    {
      name: "Acordes prestados",
      description: "Acordes prestados de la paralela menor y modos cercanos.",
      degrees: [
        { degree: "bIII" },
        { degree: "bVI" },
        { degree: "bVII" },
        { degree: "iv" },
        // i, ii°, bII quedan para futuras extensiones del motor
        // { degree: "i" },
        // { degree: "ii°" },
        // { degree: "bII" },
      ],
    },
  ],
};

// --------------------------------------------
// 5) MENOR ARMÓNICA
//    FUTURO: V+, iii+, bVI+ no están aún en roman2
// --------------------------------------------
const HARMONIC_MINOR: TheorySet = {
  id: "harmonicMinor",
  label: "Prestados de menor armónica",
  groups: [
    {
      name: "Acordes de menor armónica",
      description: "Acordes con tensión fuerte, leading tone y V mayor.",
      degrees: [
        { degree: "V+" },
        { degree: "vii°" },
        { degree: "iii+" },
        { degree: "bVI+" },
      ],
    },
  ],
};

// Solo se exportan los conjuntos plenamente soportados por el motor actual.
export const THEORY_SETS: TheorySet[] = [
  DIATONIC,
  SECONDARY_DOMS,
  MODAL,
  // TRITONE,
  // HARMONIC_MINOR,
];
