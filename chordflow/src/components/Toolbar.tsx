// --------------------------------------------------
// 🎚️ ChordFlow — Toolbar (Panel de control global)
// --------------------------------------------------
// Contiene los controles principales del proyecto:
// tonalidad (Key), tempo (BPM), compás (Meter),
// estilo (Style) y botones de acción (Play, Stop,
// Agregar bloque, Sugerir siguiente).
// --------------------------------------------------

type Props = {
  // 🎵 Tonalidad actual (C, G, D, F…)
  keyValue: string;
  keys: readonly string[];
  onChangeKey: (k: string) => void; // callback cuando cambia la tonalidad

  // 🎶 Tempo actual (en BPM)
  bpm: number;
  onChangeBpm: (v: number) => void; // callback cuando cambia el BPM

  // 🎼 Estilo actual (Pop, Neo…)
  styleValue: string;
  styles: readonly string[];
  onChangeStyle: (s: string) => void; // callback cuando cambia el estilo

  // ▶️ Controles globales
  onPlay: () => void;
  onStop: () => void;
  onAdd: () => void;
  onSuggest: () => void;
};

// --------------------------------------------------
// 🧩 Componente principal
// --------------------------------------------------
export default function Toolbar({
  keyValue,
  keys,
  onChangeKey,
  bpm,
  onChangeBpm,
  styleValue,
  styles,
  onChangeStyle,
  onPlay,
  onStop,
  onAdd,
  onSuggest,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        alignItems: "center",
        background: "#121212",
        border: "1px solid #2a2a2a",
        borderRadius: 10,
        padding: 12,
      }}
    >
      {/* Selector de tonalidad */}
      <label>
        Key&nbsp;
        <select
          value={keyValue}
          onChange={(e) => onChangeKey(e.target.value)}
        >
          {keys.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>

      {/* Control de tempo */}
      <label>
        BPM&nbsp;
        <input
          type="number"
          min={60}
          max={180}
          step={1}
          value={bpm}
          onChange={(e) =>
            onChangeBpm(parseInt(e.target.value || "0", 10))
          }
          style={{ width: 80 }}
        />
      </label>

      {/* Compás (por ahora fijo en 4/4) */}
      <label>
        Meter&nbsp;
        <input
          value="4/4"
          readOnly
          style={{ width: 60, textAlign: "center" }}
        />
      </label>

      {/* Selector de estilo */}
      <label>
        Style&nbsp;
        <select
          value={styleValue}
          onChange={(e) => onChangeStyle(e.target.value)}
        >
          {styles.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {/* Botones de control */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={onPlay}>Play</button>
        <button onClick={onStop}>Stop</button>
        <button onClick={onAdd}>+ Bloque</button>
        <button onClick={onSuggest}>
          Sugerir siguiente ({styleValue})
        </button>
      </div>
    </div>
  );
}
