// components/ChordPool.tsx
import { useMemo, useState } from "react";

type TheoryFilter =
  | "all"
  | "diatonic"
  | "secondary-dominants"
  | "backdoor"
  | "tritone-sub"
  | "modal-interchange";

export type ChordPoolProps = {
  keyName: string;                    // "C", "G", etc. (por ahora lo usamos informativo)
  onInsert: (degree: string) => void; // inserta un bloque con ese grado al final (o en cursor)
};

const FILTERS: { value: TheoryFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "diatonic", label: "Diatónicos" },
  { value: "secondary-dominants", label: "2dos dominantes" },
  { value: "backdoor", label: "Backdoor" },
  { value: "tritone-sub", label: "Sust. tritonal" },
  { value: "modal-interchange", label: "Intercambio modal" },
];

// Mapeo simple de grados por tip teórico (en cifrado romano mayor)
function degreesFor(filter: TheoryFilter): string[] {
  switch (filter) {
    case "diatonic":
      return ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
    case "secondary-dominants":
      // V de cada diatónico (excepto I) – versión simple
      return ["V/ii", "V/iii", "V/IV", "V/V", "V/vi"];
    case "backdoor":
      // Típico: IV7 → I y bVII → I (según estilo)
      return ["IV7", "bVII"];
    case "tritone-sub":
      // Sustituto tritonal de V: ♭II7 (a veces escrito bII7)
      return ["bII7"];
    case "modal-interchange":
      // Prestados del paralelo menor (set frecuente)
      return ["bIII", "iv", "bVI", "bVII"];
    case "all":
    default:
      return [
        // Diatónicos
        "I", "ii", "iii", "IV", "V", "vi", "vii°",
        // Extras comunes
        "V/ii", "V/iii", "V/IV", "V/V", "V/vi",
        "IV7", "bVII", "bII7", "bIII", "iv", "bVI",
      ];
  }
}

// Pequeño helper de rol funcional estimado (Mayor)
function roleOf(degree: string): "T" | "S" | "D" {
  const t = new Set(["I", "iii", "vi", "bIII", "bVI", "bVII"]);
  const s = new Set(["ii", "IV", "iv"]);
  // todo lo que sea dominante/alterado lo agrupamos en D
  return t.has(degree) ? "T" : s.has(degree) ? "S" : "D";
}

export default function ChordPool({ keyName, onInsert }: ChordPoolProps) {
  const [filter, setFilter] = useState<TheoryFilter>("diatonic");

  const items = useMemo(() => {
    const list = degreesFor(filter);
    return {
      T: list.filter((d) => roleOf(d) === "T"),
      S: list.filter((d) => roleOf(d) === "S"),
      D: list.filter((d) => roleOf(d) === "D"),
    };
  }, [filter]);

  return (
    <section className="panel mt-sm">
      <div className="panel-header">Banco de acordes — {keyName} mayor</div>

      <div className="app-row gap-sm" style={{ justifyContent: "space-between" }}>
        <label className="text-soft" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Tip de teoría:
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as TheoryFilter)}
            className="focus-ring"
            style={{
              padding: "4px 8px",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              background: "var(--color-panel-soft)",
              color: "var(--color-text)",
              fontSize: 13,
            }}
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="app-row gap-sm mt-xs" style={{ justifyContent: "space-between" }}>
        {/* Columna T */}
        <div style={{ flex: 1 }}>
          <div className="text-soft" style={{ fontSize: 12, marginBottom: 6 }}>
            <span className="badge-role badge-role--T">T</span> Tónica
          </div>
          <div className="pool-group">
            {items.T.map((d) => (
              <button key={d} className="chip" onClick={() => onInsert(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Columna S */}
        <div style={{ flex: 1 }}>
          <div className="text-soft" style={{ fontSize: 12, marginBottom: 6 }}>
            <span className="badge-role badge-role--S">S</span> Subdominante
          </div>
          <div className="pool-group">
            {items.S.map((d) => (
              <button key={d} className="chip" onClick={() => onInsert(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Columna D */}
        <div style={{ flex: 1 }}>
          <div className="text-soft" style={{ fontSize: 12, marginBottom: 6 }}>
            <span className="badge-role badge-role--D">D</span> Dominante / Tensión
          </div>
          <div className="pool-group">
            {items.D.map((d) => (
              <button key={d} className="chip" onClick={() => onInsert(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="note-bar">Tip: podés combinar este banco con las sugerencias Markov/Berklee para explorar y luego refinar.</div>
    </section>
  );
}
