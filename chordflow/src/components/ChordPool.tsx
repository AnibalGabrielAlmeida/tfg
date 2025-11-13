import React, { useState } from "react";
import { THEORY_SETS } from "../modules/theory/theorySets";

// Las escalas existentes (diatónicas mayores)
const SCALES: Record<string, string[]> = {
  C: ["C", "D", "E", "F", "G", "A", "B"],
  G: ["G", "A", "B", "C", "D", "E", "F#"],
  D: ["D", "E", "F#", "G", "A", "B", "C#"],
  F: ["F", "G", "A", "Bb", "C", "D", "E"],
};

type ChordPoolProps = {
  keyName: string;
  onInsert: (degree: string) => void;
};

// --------------------------------------------------
// Mapea grados complejos como V/V o bIII → etiqueta real
// --------------------------------------------------

function getChordLabel(keyName: string, degree: string): string {
  const scale = SCALES[keyName] ?? SCALES["C"];

  // casos simples (diatónicos)
  const DEGREE_INDEX: Record<string, number> = {
    I: 0, ii: 1, iii: 2, IV: 3, V: 4, vi: 5, "vii°": 6,
  };

  if (DEGREE_INDEX[degree] !== undefined) {
    const root = scale[DEGREE_INDEX[degree]];
    if (degree === "ii" || degree === "iii" || degree === "vi") return root + "m";
    if (degree === "vii°") return root + "dim";
    return root;
  }

  // MODAL interchange
  const modalRoots: Record<string, string> = {
    bIII: "Eb",
    bVI: "Ab",
    bVII: "Bb",
    iv: "Fm",
    i: "Cm",
    "ii°": "Ddim",
    bII: "Db",
  };

  if (modalRoots[degree]) return modalRoots[degree];

  // Dominantes secundarios
  const secondary: Record<string, string> = {
    "V/ii": "A7",
    "V/iii": "B7",
    "V/IV": "C7",
    "V/V": "D7",
    "V/vi": "E7",
  };

  if (secondary[degree]) return secondary[degree];

  // Sustitución tritonal
  const tritone: Record<string, string> =  {
    "SubV/ii": "Eb7",
    "SubV/iii": "F7",
    "SubV/IV": "Gb7",
    "SubV/V": "Ab7",
    "SubV/vi": "Bb7",
  };

  if (tritone[degree]) return tritone[degree];

  // Menor armónica
  const harmonicMinor: Record<string, string> = {
    "V+": "G+",
    "vii°": "Bdim",
    "iii+": "E+",
    "bVI+": "Ab+",
  };

  if (harmonicMinor[degree]) return harmonicMinor[degree];

  return degree;
}

// --------------------------------------------------
// UI principal
// --------------------------------------------------

const ChordPool: React.FC<ChordPoolProps> = ({ keyName, onInsert }) => {
  const [theory, setTheory] = useState("diatonic");

  const selectedSet = THEORY_SETS.find((s) => s.id === theory)!;

  return (
    <section className="panel" style={{ marginTop: 16 }}>
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

                return (
                  <button
                    key={d.degree}
                    className="chip"
                    onClick={() => onInsert(d.degree)}
                    style={{ cursor: "pointer" }}
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
