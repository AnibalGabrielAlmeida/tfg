// --------------------------------------
// 🎵 ChordFlow — Prototipo Interactivo
// --------------------------------------
import React, { useState, useRef, useEffect } from "react";
import { exportLibraryToJSON, importLibraryFromJSON } from "./modules/storage/exporter";
import type { ChordBlock } from "./modules/progression/types";
import ProgressionList from "./components/ProgressionList";
import { suggestNextDegree } from "./modules/recommendation/markov";
import { getPopPreset, getNeoPreset } from "./modules/presets";
import Toolbar from "./components/Toolbar";
import InfoTooltip from "./components/InfoTooltip";
import LibraryPanel from "./components/LibraryPanel";
import { saveNewPreset } from "./modules/storage/library";
import SaveBar from "./components/SaveBar";
import SuggestionStrip from "./components/SuggestionStrip";
import { useProgressionManager } from "./modules/progression/useProgressionManager";
import { usePlayback } from "./modules/audio/usePlayback";
import type { Style } from "./modules/recommendation/markov";
import SuggestionPanel from "./components/SuggestionPanel";
import ChordPool from "./components/ChordPool"; // 👈 ya lo tenías

// Tonalidades / estilos
const KEYS = ["C", "G", "D", "F"] as const;
const STYLES = ["Pop", "Neo"] as const;

// -----------------------------
// App principal
// -----------------------------
function App() {
  // Controles globales
  const [key, setKey] = useState<(typeof KEYS)[number]>("C");
  const [bpm, setBpm] = useState(100);
  const [style, setStyle] = useState<(typeof STYLES)[number]>("Pop");
  const [title, setTitle] = useState("Mi progresión");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  // Progresión
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

  // Playback
  const { isPlaying, playFromState, stopPlayback, rescheduleOnChange } = usePlayback();

  // Aplicar una sugerencia concreta (desde SuggestionStrip)
  function applySuggestion(degree: string) {
    appendBlockWithDegree(degree as ChordBlock["degree"], 4);
  }

  // 👇 NUEVO: insertar acordes desde el Pool
  function handleInsertFromPool(degree: string) {
    appendBlockWithDegree(degree as ChordBlock["degree"], 4);
  }

  // Sugerencia automática por estilo (botón "Sugerir")
  function suggestAndInsertNext() {
    const base = lastBlock?.degree ?? "I";
    const suggested = suggestNextDegree(style, base);
    appendBlockWithDegree(suggested as ChordBlock["degree"], 4);
  }

  // Guardar preset actual
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

  // Cargar preset desde la librería (NO auto-play)
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

  // Cargar preset + reproducir (usado por botones Pop/Neo)
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

  function handleLoadPop() {
    loadPresetAndMaybePlay(getPopPreset());
  }

  function handleLoadNeo() {
    loadPresetAndMaybePlay(getNeoPreset());
  }

  // Play/Stop desde Toolbar
  const handlePlay = async () => {
    await playFromState(progression, bpm, key);
  };
  const handleStop = () => {
    stopPlayback();
  };

  // Reschedule al cambiar progression/BPM/Key mientras está sonando
  useEffect(() => {
    rescheduleOnChange(progression, bpm, key);
  }, [progression, bpm, key, rescheduleOnChange]);

  // Barra espaciadora → Play/Pause
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

  // Export / Import JSON
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

  function handleImportClick() {
    fileInputRef.current?.click();
  }

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
      <h1 className="app-title">ChordFlow — Aprendé armonía creando</h1>

      {/* Panel global (UI separada) */}
      <Toolbar
        keyValue={key}
        keys={KEYS}
        onChangeKey={(k: string) => setKey(k as (typeof KEYS)[number])}
        bpm={bpm}
        onChangeBpm={setBpm}
        styleValue={style}
        styles={STYLES}
        onChangeStyle={(s: string) => setStyle(s as (typeof STYLES)[number])}
        onPlay={handlePlay}
        onStop={handleStop}
        onAdd={addBlock}
        onSuggest={suggestAndInsertNext}
      />

      {/* Presets rápidos como desplegable */}
      <div className="app-row gap-sm mt-xs">
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={() => setShowPresets((v) => !v)}
        >
          {showPresets ? "Ocultar estilos de ejemplo" : "Cargar estilos de ejemplo"}
        </button>

        {showPresets && (
          <div className="app-row gap-sm">
            <button
              onClick={handleLoadPop}
              aria-label="Cargar preset Pop"
              className="btn btn-primary"
            >
              Pop (I–V–vi–IV)
            </button>
            <button
              onClick={handleLoadNeo}
              aria-label="Cargar preset Neo"
              className="btn btn-secondary"
            >
              Neo-soul (ii–V–I…)
            </button>
          </div>
        )}
      </div>

      {/* Guardar / Biblioteca */}
      <SaveBar
        title={title}
        onChangeTitle={setTitle}
        onSave={handleSavePreset}
        onOpenLibrary={() => setLibraryOpen(true)}
      />

      {/* Export / Import JSON */}
      <div className="app-row gap-sm mt-xs">
        <button onClick={handleExportJSON} className="btn btn-ghost btn-xs">
          Exportar biblioteca (JSON)
        </button>
        <button onClick={handleImportClick} className="btn btn-ghost btn-xs">
          Importar biblioteca (JSON)
        </button>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImportFileChange}
        />
      </div>

      {/* 👇 NUEVO: Banco de acordes exploratorio */}
      <ChordPool keyName={key} onInsert={handleInsertFromPool} />


        

      {/* Warning métrico (si algún compás supera 4 beats) */}
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

      {/* Lista de bloques con DnD */}
      <ProgressionList
        progression={progression}
        onReorder={handleReorder}
        onChangeDuration={updateBlockDuration}
        onDuplicate={duplicateBlock}
        onDelete={deleteBlock}
      />

      {/* Tira de sugerencias PRO */}
      <SuggestionStrip
        style={style as Style}
        keyName={key}
        currentDegree={suggestionBaseDegree}
        onApplySuggestion={applySuggestion}
      />

      <SuggestionPanel
        style={style as Style}
        keyName={key}
        currentDegree={suggestionBaseDegree}
        onApplySuggestion={applySuggestion}
      />

      {/* Leyenda con tooltips T/S/D */}
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
        <InfoTooltip text="Tensión; empuja a resolver hacia T.">
          <span className="legend-tag legend-d">D</span>
        </InfoTooltip>
        &nbsp;= Dominante.
      </section>

      {/* Panel de biblioteca */}
      <LibraryPanel
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onLoadPreset={handleLoadPreset}
      />
    </main>
  );
}

export default App;
