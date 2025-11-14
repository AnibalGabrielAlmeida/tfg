import ToolbarMenu from "./ToolbarMenu";

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

  title: string;
  onChangeTitle: (s: string) => void;
  onSave: () => void;
  onOpenLibrary: () => void;

  onLoadPop: () => void;
  onLoadNeo: () => void;
  onExportJSON: () => void;
  onImportClick: () => void;
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

  title,
  onChangeTitle,
  onSave,
  onOpenLibrary,

  onLoadPop,
  onLoadNeo,
  onExportJSON,
  onImportClick,
}: Props) {
  return (
    <div className="toolbar-container">

      {/* Título de la app */}
      <h1 className="toolbar-title">ChordFlow — Editor de progresiones</h1>

      {/* Controles centrales */}
      <div className="toolbar-middle">
        <label>
          Key
          <select value={keyValue} onChange={(e) => onChangeKey(e.target.value)}>
            {keys.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>

        <label>
          BPM
          <input
            type="number"
            min={60}
            max={180}
            value={bpm}
            onChange={(e) => onChangeBpm(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>

        <label>
          Style
          <select
            value={styleValue}
            onChange={(e) => onChangeStyle(e.target.value)}
          >
            {styles.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        {/* Separador visual entre selección y botones */}
        <span style={{ width: 32, display: "inline-block" }} />

        <button className="btn btn-primary" onClick={onPlay}>Play</button>
        <button className="btn btn-ghost" onClick={onStop}>Stop</button>
      </div>

      {/* A la derecha: nombre, guardar y biblioteca */}
      <div className="toolbar-save toolbar-controls-right">
        <input
          className="toolbar-title-input"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Mi progresión…"
        />

        <button className="btn btn-primary" onClick={onSave}>
          Guardar
        </button>

        <button className="btn btn-ghost" onClick={onOpenLibrary}>
          Biblioteca
        </button>

        {/* Menú de opciones ⋯ */}
        <ToolbarMenu
          onLoadPop={onLoadPop}
          onLoadNeo={onLoadNeo}
          onExportJSON={onExportJSON}
          onImportClick={onImportClick}
        />
      </div>

    </div>
  );
}
