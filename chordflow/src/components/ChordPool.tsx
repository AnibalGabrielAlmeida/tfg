// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Componente: ChordPool
// --------------------------------------------------
// Panel que presenta un "banco" de acordes organizados por conjuntos
// teóricos (diatónicos, intercambio modal, dominantes secundarios, etc.).
// Desde aquí el usuario puede:
//
// - Explorar acordes disponibles según la tonalidad seleccionada.
// - Consultar, vía tooltip/título, una explicación resumida de cada grado.
// - Insertar grados (en notación romana) en la progresión en construcción.
//
// El componente se apoya en THEORY_SETS para definir los grupos de grados
// disponibles, y utiliza el motor teórico para traducir grados romanos
// a nombres de acordes concretos (ej.: C + bVII → Bb).
// --------------------------------------------------

import React, { useState } from "react";
import { THEORY_SETS } from "../modules/theory/theorySets";
import {
  degreeToChordName,
  type TonalKey,
  type RomanDegree,
} from "../modules/theory/roman2";
import { getFullExplanation } from "../modules/recommendation/explanations";
import { functionalRoleMajor } from "../modules/theory/functions";

type ChordPoolProps = {
  /** Tonalidad actual (ej.: "C", "G", "F#") */
  keyName: string;

  /** Callback para insertar un nuevo grado en la progresión activa */
  onInsert: (degree: string) => void;
};

// ---------------------------------------------
// Helpers para validar tonalidades y grados
// ---------------------------------------------
const TONAL_KEYS: TonalKey[] = [
  "C", "C#", "D", "D#", "E",
  "F", "F#", "G", "G#", "A", "A#", "B",
];

function isValidTonalKey(k: string): k is TonalKey {
  return TONAL_KEYS.includes(k as TonalKey);
}

// Debe mantenerse consistente con el tipo RomanDegree
const ROMAN_DEGREES: RomanDegree[] = [
  "I", "ii", "iii", "IV", "V", "vi", "vii°",
  "bIII", "iv", "bVI", "bVII",
  "V/ii", "V/iii", "V/IV", "V/V", "V/vi",
];

function isValidRomanDegree(d: string): d is RomanDegree {
  return ROMAN_DEGREES.includes(d as RomanDegree);
}

// --------------------------------------------------
// Mapea grados romanos (I, ii, V/ii, bVII, etc.) a nombres de acorde
// concretos usando el motor teórico (degreeToChordName).
// Si el grado o la tonalidad no son válidos, se devuelve el grado tal cual.
// --------------------------------------------------
function getChordLabel(keyName: string, degree: string): string {
  if (isValidTonalKey(keyName) && isValidRomanDegree(degree)) {
    // Ejemplos: C + bVII → Bb, D + ii → Em, etc.
    return degreeToChordName(keyName as TonalKey, degree as RomanDegree);
  }

  // Devolución directa cuando el grado no está contemplado en RomanDegree
  return degree;
}

// --------------------------------------------------
// UI principal
// --------------------------------------------------
const ChordPool: React.FC<ChordPoolProps> = ({ keyName, onInsert }) => {
  const [theory, setTheory] = useState("diatonic");

  const selectedSet = THEORY_SETS.find((s) => s.id === theory)!;

  return (
    <section className="panel chord-pool">
      <div className="panel-header">
        Banco de acordes — {selectedSet.label}
      </div>

      {/* Selector del conjunto teórico actual */}
      <select
        value={theory}
        onChange={(e) => setTheory(e.target.value)}
        className="chord-pool-select"
      >
        {THEORY_SETS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>

      {/* Grupos de acordes según el conjunto teórico elegido */}
      <div className="chord-pool-groups">
        {selectedSet.groups.map((group) => (
          <div key={group.name} className="chord-pool-group">
            <div className="chord-pool-group-title">
              <strong>{group.name}</strong>{" "}
              <span className="text-soft">{group.description}</span>
            </div>

            {/* Chips individuales de acordes */}
            <div className="chord-pool-chips">
              {group.degrees.map((d) => {
                const label = getChordLabel(keyName, d.degree);
                const full = getFullExplanation(d.degree);

                const rawRole = functionalRoleMajor(d.degree);
                const role =
                  rawRole === "T" || rawRole === "S" || rawRole === "D"
                    ? rawRole
                    : null;

                return (
                  <button
                    key={d.degree}
                    className={`chip chord-pool-chip ${
                      role ? `role-${role}` : ""
                    }`}
                    onClick={() => onInsert(d.degree)}
                    title={
                      `${full.origin}\n` +
                      `${full.func}\n` +
                      `${full.movement}\n` +
                      `${full.color}\n` +
                      `${full.styleUsage}`
                    }
                  >
                    <strong>{label}</strong>{" "}
                    <span style={{ fontSize: 11, opacity: 0.7 }}>
                      ({d.degree})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ChordPool;
