// --------------------------------------------------
// 🎚️ ChordFlow — Toolbar (Panel de control global)
// --------------------------------------------------
// Contiene los controles principales del proyecto:
// tonalidad (Key), tempo (BPM), compás (Meter),
// estilo (Style) y botones de acción (Play, Stop,
// Agregar bloque, Sugerir siguiente).
// --------------------------------------------------

// --------------------------------------------------
// 🎚️ ChordFlow — Toolbar (Panel de control global)
// --------------------------------------------------

type Props = {
  keyValue: string;
  keys: readonly string[];
  onChangeKey: (k: string) => void;

  bpm: number;
  onChangeBpm: (v: number) => void;

  styleValue: string;
  styles: readonly string[];
  onChangeStyle: (s: string) => void;

  onPlay: () => void;
  onStop: () => void;
  onAdd: () => void;
  onSuggest: () => void;
};

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
    <div className="panel toolbar">
      {/* Selector de tonalidad */}
      <label>
        Key
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
        BPM
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
        Meter
        <input
          value="4/4"
          readOnly
          style={{ width: 60, textAlign: "center" }}
        />
      </label>

      {/* Selector de estilo */}
      <label>
        Style
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
      <div className="toolbar-controls">
        <button className="btn btn-primary" onClick={onPlay}>
          Play
        </button>
        <button className="btn btn-ghost" onClick={onStop}>
          Stop
        </button>
        <button className="btn" onClick={onAdd}>
          + Bloque
        </button>
        <button className="btn" onClick={onSuggest}>
          Sugerir siguiente ({styleValue})
        </button>
      </div>
    </div>
  );
}
