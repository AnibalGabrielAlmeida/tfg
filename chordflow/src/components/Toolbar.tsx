type Props = {
  keyValue: string;
  keys: readonly string[];
  onChangeKey: (k: string) => void;   // 👈 le damos tipo al parámetro

  bpm: number;
  onChangeBpm: (v: number) => void;

  styleValue: string;
  styles: readonly string[];
  onChangeStyle: (s: string) => void; // 👈 también acá

  onPlay: () => void;
  onStop: () => void;
  onAdd: () => void;
  onSuggest: () => void;
};


export default function Toolbar({
  keyValue, keys, onChangeKey,
  bpm, onChangeBpm,
  styleValue, styles, onChangeStyle,
  onPlay, onStop, onAdd, onSuggest,
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
      <label>
        Key&nbsp;
        <select value={keyValue} onChange={(e) => onChangeKey(e.target.value)}>
          {keys.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>

      <label>
        BPM&nbsp;
        <input
          type="number"
          min={60}
          max={180}
          step={1}
          value={bpm}
          onChange={(e) => onChangeBpm(parseInt(e.target.value || "0", 10))}
          style={{ width: 80 }}
        />
      </label>

      <label>
        Meter&nbsp;
        <input value="4/4" readOnly style={{ width: 60, textAlign: "center" }} />
      </label>

      <label>
        Style&nbsp;
        <select value={styleValue} onChange={(e) => onChangeStyle(e.target.value)}>
          {styles.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={onPlay}>Play</button>
        <button onClick={onStop}>Stop</button>
        <button onClick={onAdd}>+ Bloque</button>
        <button onClick={onSuggest}>Sugerir siguiente ({styleValue})</button>
      </div>
    </div>
  );
}
