import React, { useState } from "react";
import { THEORY_SETS } from "../modules/theory/theorySets";
import {
  degreeToChordName,
  type TonalKey,
  type RomanDegree,
} from "../modules/theory/roman2";
import { getFullExplanation } from "../modules/recommendation/explanations";

type ChordPoolProps = {
  keyName: string;
  onInsert: (degree: string) => void;
};

// ---------------------------------------------
// Helpers para validar key y grado
// ---------------------------------------------
const TONAL_KEYS: TonalKey[] = [
  "C", "C#", "D", "D#", "E",
  "F", "F#", "G", "G#", "A", "A#", "B",
];

function isValidTonalKey(k: string): k is TonalKey {
  return TONAL_KEYS.includes(k as TonalKey);
}

// OJO: debe coincidir con RomanDegree de romanPro.ts
const ROMAN_DEGREES: RomanDegree[] = [
  "I", "ii", "iii", "IV", "V", "vi", "vii°",
  "bIII", "iv", "bVI", "bVII",
  "V/ii", "V/iii", "V/IV", "V/V", "V/vi",
];

function isValidRomanDegree(d: string): d is RomanDegree {
  return ROMAN_DEGREES.includes(d as RomanDegree);
}

// --------------------------------------------------
// Mapea grados como I, ii, V/ii, bVII → etiqueta real
// usando el motor teórico PRO (romanPro).
// --------------------------------------------------
function getChordLabel(keyName: string, degree: string): string {
  if (isValidTonalKey(keyName) && isValidRomanDegree(degree)) {
    // Usa el motor teórico: C + bVII → Bb, D + ii → Em, etc.
    return degreeToChordName(keyName as TonalKey, degree as RomanDegree);
  }

  // Fallback ultra simple si entra algo que no está en RomanDegree
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

      {/* Selector de teoría */}
      <select
        value={theory}
        onChange={(e) => setTheory(e.target.value)}
        style={{
          marginBottom: 12,
          padding: "6px 10px",
          borderRadius: 6,
          background: "#151821",
          color: "white",
        }}
      >
        {THEORY_SETS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>

      {/* Grupos */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {selectedSet.groups.map((group) => (
          <div key={group.name}>
            <div style={{ fontSize: 13, marginBottom: 4 }}>
              <strong>{group.name}</strong>{" "}
              <span style={{ opacity: 0.7 }}>{group.description}</span>
            </div>

            {/* Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {group.degrees.map((d) => {
                const label = getChordLabel(keyName, d.degree);
                const full = getFullExplanation(d.degree);
                 return (
                  <button
                    key={d.degree}
                    className="chip"
                    onClick={() => onInsert(d.degree)}
                    style={{ cursor: "pointer" }}
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
