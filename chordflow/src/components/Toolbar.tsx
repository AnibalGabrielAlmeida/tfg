// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Componente: Toolbar
// --------------------------------------------------
// Barra superior de control de la aplicación. Desde este componente
// el usuario puede:
//
// - Seleccionar tonalidad (Key) y tempo (BPM).
// - Cambiar el estilo armónico utilizado por el motor de recomendación.
// - Iniciar y detener la reproducción de la progresión actual.
// - Asignar un título a la progresión y guardarla en la biblioteca local.
// - Abrir la biblioteca de progresiones guardadas.
// - Acceder a acciones avanzadas (cargar presets, exportar/importar JSON)
//   a través del menú contextual ToolbarMenu.
//
// La lógica de reproducción, almacenamiento y presets se delega en el
// componente padre mediante callbacks.
// --------------------------------------------------

import ToolbarMenu from "./ToolbarMenu";

type Props = {
  /** Tonalidad seleccionada (ej.: "C", "G", "F#") */
  keyValue: string;

  /** Lista de tonalidades disponibles en la interfaz */
  keys: readonly string[];

  /** Handler para actualizar la tonalidad seleccionada */
  onChangeKey: (k: string) => void;

  /** Tempo actual en BPM */
  bpm: number;

  /** Handler para actualizar el tempo */
  onChangeBpm: (v: number) => void;

  /** Estilo de sugerencia armónica actualmente seleccionado */
  styleValue: string;

  /** Lista de estilos disponibles (pop, neo-soul, etc.) */
  styles: readonly string[];

  /** Handler para cambiar el estilo activo */
  onChangeStyle: (s: string) => void;

  /** Inicia la reproducción de la progresión actual */
  onPlay: () => void;

  /** Detiene la reproducción en curso */
  onStop: () => void;

  /** Título de la progresión actual */
  title: string;

  /** Handler para actualizar el título de la progresión */
  onChangeTitle: (s: string) => void;

  /** Guarda la progresión en la biblioteca local */
  onSave: () => void;

  /** Abre el panel de biblioteca de progresiones guardadas */
  onOpenLibrary: () => void;

  /** Carga un preset de ejemplo de estilo pop */
  onLoadPop: () => void;

  /** Carga un preset de ejemplo de estilo neo-soul */
  onLoadNeo: () => void;

  /** Exporta la biblioteca de progresiones a un archivo JSON */
  onExportJSON: () => void;

  /** Dispara el flujo de importación desde un archivo JSON */
  onImportClick: () => void;

  connected: boolean;
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

  connected,
}: Props) {
  return (
    <div className="toolbar-container">
      {/* Título de la app */}
      <h1 className="toolbar-title">Editor de progresiones</h1>

      {/* Controles centrales: tonalidad, tempo y estilo */}
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

        {/* Separador visual entre selección y botones de reproducción */}
        <span style={{ width: 32, display: "inline-block" }} />

        <button className="btn btn-primary" onClick={onPlay}>Play</button>
        <button className="btn btn-ghost" onClick={onStop}>Stop</button>
      </div>

      {/* Lado derecho: nombre de la progresión, guardado y biblioteca */}
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

        <button
          className={`btn btn-sm ${connected ? "btn-success" : "btn-ghost"}`}
          onClick={onOpenLibrary}
        >
          ☁️ {connected ? "Conectado" : "Desconectado"}
        </button>

        {/* Menú de opciones avanzadas (presets, exportación, importación) */}
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
