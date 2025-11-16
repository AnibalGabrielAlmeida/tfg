// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: App principal (capa de orquestación UI + lógica de control)
// --------------------------------------------------
// Este componente actúa como punto de entrada del prototipo interactivo:
//
// - Mantiene el estado global de la sesión (tonalidad, BPM, estilo, título).
// - Orquesta la progresión armónica mediante useProgressionManager.
// - Controla la reproducción de audio mediante usePlayback (Tone.js).
// - Expone acciones de guardado/carga a la biblioteca local.
// - Coordina la interacción entre:
//
//   • Toolbar (controles globales)
//   • ProgressionList (edición y orden de bloques)
//   • ChordPool (banco de acordes por sistema teórico)
//   • SuggestionPanel (recomendaciones explicadas)
//   • LibraryPanel (gestión de presets en localStorage)
//
// La lógica de dominio (recomendaciones, teoría, audio) se mantiene en
// módulos separados; App se limita a componerlos y gestionar el flujo.
// --------------------------------------------------

import React, { useState, useRef, useEffect } from "react";
import { exportLibraryToJSON, importLibraryFromJSON } from "./modules/storage/exporter";
import type { ChordBlock } from "./modules/progression/types";
import ProgressionList from "./components/ProgressionList";
import { getPopPreset, getNeoPreset } from "./modules/presets";
import Toolbar from "./components/Toolbar";
import InfoTooltip from "./components/InfoTooltip";
import LibraryPanel from "./components/LibraryPanel";
import { saveNewPreset } from "./modules/storage/library";
import { useProgressionManager } from "./modules/progression/useProgressionManager";
import { usePlayback } from "./modules/audio/usePlayback";
import type { Style } from "./modules/recommendation/markov";
import SuggestionPanel from "./components/SuggestionPanel";
import ChordPool from "./components/ChordPool";

// Tonalidades y estilos disponibles en el prototipo
const KEYS = ["C", "G", "D", "F"] as const;
const STYLES = ["Pop", "Neo"] as const;

// -----------------------------
// Componente de aplicación principal
// -----------------------------
function App() {
  // Controles globales de la sesión
  const [key, setKey] = useState<(typeof KEYS)[number]>("C");
  const [bpm, setBpm] = useState(100);
  const [style, setStyle] = useState<(typeof STYLES)[number]>("Pop");
  const [title, setTitle] = useState("Mi progresión");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  // Estado y operaciones sobre la progresión armónica
  const {
    progression,
    barWarnings,
    lastBlock,
    suggestionBaseDegree,
    addBlock,
    updateBlockDuration,
    duplicateBlock,
    deleteBlock,
    handleReorder,
    appendBlockWithDegree,
    setFromPreset,
  } = useProgressionManager();

  // Control de reproducción de audio y bloque activo
  const { 
    isPlaying, 
    playFromState, 
    stopPlayback, 
    rescheduleOnChange,
    activeBlockId, 
  } = usePlayback();

  /**
   * Inserta una sugerencia concreta al final de la progresión.
   * Se utiliza desde el panel de recomendaciones.
   */
  function applySuggestion(degree: string) {
    appendBlockWithDegree(degree as ChordBlock["degree"], 4);
  }

  /**
   * Inserta acordes seleccionados desde el banco teórico (ChordPool).
   */
  function handleInsertFromPool(degree: string) {
    appendBlockWithDegree(degree as ChordBlock["degree"], 4);
  }

  /**
   * Guarda el estado actual como preset en la biblioteca local.
   */
  function handleSavePreset() {
    saveNewPreset({
      title: title.trim() || "Sin título",
      bpm,
      key,
      style,
      progression,
    });
    console.log("[library] guardado");
  }

  /**
   * Carga un preset desde la biblioteca sin iniciar la reproducción.
   */
  function handleLoadPreset(preset: {
    title: string;
    bpm: number;
    key: string;
    style: string;
    progression: ChordBlock[];
  }) {
    setTitle(preset.title);
    setBpm(preset.bpm);
    setKey(preset.key as typeof key);
    setStyle(preset.style as typeof style);
    setFromPreset(preset.progression);
  }

  /**
   * Carga un preset de ejemplo (Pop/Neo) y, si corresponde,
   * actualiza inmediatamente la reproducción.
   */
  function loadPresetAndMaybePlay(p: ReturnType<typeof getPopPreset>) {
    setBpm(p.bpm);
    setKey(p.key as typeof key);
    setStyle(p.style as typeof style);
    setFromPreset(p.progression);

    if (isPlaying) {
      stopPlayback();
      playFromState(p.progression, p.bpm, p.key);
    } else {
      playFromState(p.progression, p.bpm, p.key);
    }
  }

  // Play/Stop disparados desde la Toolbar
  const handlePlay = async () => {
    await playFromState(progression, bpm, key);
  };
  const handleStop = () => {
    stopPlayback();
  };

  /**
   * Cuando cambia la progresión, el BPM o la tonalidad durante la reproducción,
   * se reprograma el loop para que el cambio entre en el siguiente compás.
   */
  useEffect(() => {
    rescheduleOnChange(progression, bpm, key);
  }, [progression, bpm, key, rescheduleOnChange]);

  /**
   * Atajo de teclado: barra espaciadora para alternar Play/Pause
   * con el estado actual de la progresión.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (isPlaying) {
          stopPlayback();
        } else {
          playFromState(progression, bpm, key);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying, progression, bpm, key, playFromState, stopPlayback]);

  /**
   * Exporta la biblioteca completa de presets a un archivo JSON descargable.
   */
  function handleExportJSON() {
    const json = exportLibraryToJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chordflow-library.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Dispara el input de archivo oculto para importar una biblioteca JSON.
   */
  function handleImportClick() {
    fileInputRef.current?.click();
  }

  /**
   * Lee el archivo seleccionado y delega el parseo/importación
   * al módulo de almacenamiento.
   */
  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || "");
      const result = importLibraryFromJSON(text, "merge");
      console.log(`[import] presets importados: ${result.imported}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // -----------------
  // Render principal
  // -----------------
  return (
    <main className="app-root">
      {/* Encabezado: barra superior con controles globales */}
      <header className="app-header">
        <Toolbar
          keyValue={key}
          keys={KEYS}
          onChangeKey={(k) => setKey(k as (typeof KEYS)[number])}

          bpm={bpm}
          onChangeBpm={setBpm}

          styleValue={style}
          styles={STYLES}
          onChangeStyle={(s) => setStyle(s as (typeof STYLES)[number])}

          onPlay={handlePlay}
          onStop={handleStop}

          title={title}
          onChangeTitle={setTitle}
          onSave={handleSavePreset}
          onOpenLibrary={() => setLibraryOpen(true)}

          onLoadPop={() => loadPresetAndMaybePlay(getPopPreset())}
          onLoadNeo={() => loadPresetAndMaybePlay(getNeoPreset())}
          onExportJSON={handleExportJSON}
          onImportClick={handleImportClick}
        />
      </header>

      {/* Layout principal: editor (izquierda) + sugerencias teóricas (derecha) */}
      <div className="app-main-layout">
        {/* Columna izquierda: pista, banco de acordes y leyenda funcional */}
        <div className="app-main-left">
          {/* Pista principal de progresión con drag & drop */}
          <div className="progression-track">
            <ProgressionList
              progression={progression}
              activeBlockId={activeBlockId}
              onReorder={handleReorder}
              onChangeDuration={updateBlockDuration}
              onDuplicate={duplicateBlock}
              onDelete={deleteBlock}
            />
          </div>

          {/* Banco de acordes organizado por sistemas teóricos */}
          <ChordPool keyName={key} onInsert={handleInsertFromPool} />

          {/* 
          Avisos métricos:
          Bloque opcional que muestra compases que superan los 4 beats.
          Se mantiene comentado en esta versión del prototipo.
          
          {barWarnings.length > 0 && (
            <div
              role="status"
              aria-live="polite"
              className="alert alert-warning mt-sm mb-sm"
            >
              <strong>Atención métrica:</strong>
              {barWarnings.map((w) => (
                <div key={w.bar}>
                  Compás {w.bar} tiene {w.beats} beats (deberían ser 4).
                </div>
              ))}
            </div>
          )}
          */}

          {/* Leyenda funcional con tooltips T / S / D */}
          <section className="app-legend">
            <strong>Leyenda:&nbsp;</strong>
            <InfoTooltip text="Centro de reposo; estabilidad y cierre.">
              <span className="legend-tag legend-t">T</span>
            </InfoTooltip>
            &nbsp;= Tónica,&nbsp;
            <InfoTooltip text="Prepara el movimiento; puente hacia D o regreso a T.">
              <span className="legend-tag legend-s">S</span>
            </InfoTooltip>
            &nbsp;= Subdominante,&nbsp;
            <InfoTooltip text="Tensión; impulsa la resolución hacia T.">
              <span className="legend-tag legend-d">D</span>
            </InfoTooltip>
            &nbsp;= Dominante.
          </section>
        </div>

        {/* Columna derecha: panel de recomendaciones explicadas */}
        <div className="app-main-right">
          <SuggestionPanel
            style={style as Style}
            keyName={key}
            currentDegree={suggestionBaseDegree}
            onApplySuggestion={applySuggestion}
          />
        </div>
      </div>

      {/* Panel de biblioteca (overlay modal) */}
      <LibraryPanel
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onLoadPreset={handleLoadPreset}
      />

      {/* Input de archivo oculto para importar biblioteca JSON */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={handleImportFileChange}
      />
    </main>
  );
}

export default App;
