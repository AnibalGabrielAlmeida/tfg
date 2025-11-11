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

  // Progresión (hook nuevo)
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

  // Playback (hook nuevo)
  const { isPlaying, playFromState, stopPlayback, rescheduleOnChange } = usePlayback();

  // --- Focus ring accesible ---
  const onFocusRing = (
    e: React.FocusEvent<HTMLButtonElement | HTMLInputElement>
  ) => {
    e.currentTarget.style.boxShadow = "0 0 0 2px #6cf";
  };
  const onBlurRing = (
    e: React.FocusEvent<HTMLButtonElement | HTMLInputElement>
  ) => {
    e.currentTarget.style.boxShadow = "none";
  };

  // Aplicar una sugerencia concreta (desde SuggestionStrip)
  function applySuggestion(degree: string) {
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
      // reinicia con la nueva progresión
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

  // --- Transporte: Play/Stop desde Toolbar ---
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
    <main
      style={{
        padding: 16,
        fontFamily: "system-ui, sans-serif",
        background: "#1a1a1a",
        color: "#fff",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>ChordFlow — Prototipo</h1>

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

      {/* Guardar / Biblioteca */}
      <SaveBar
        title={title}
        onChangeTitle={setTitle}
        onSave={handleSavePreset}
        onOpenLibrary={() => setLibraryOpen(true)}
      />

      {/* Export / Import JSON */}
      <div
        style={{
          marginTop: 8,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={handleExportJSON}
          style={{
            border: "1px solid #4b5563",
            background: "#111827",
            color: "#e5e7eb",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Exportar biblioteca (JSON)
        </button>
        <button
          onClick={handleImportClick}
          style={{
            border: "1px solid #4b5563",
            background: "#111827",
            color: "#e5e7eb",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
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

      {/* Presets rápidos Pop / Neo */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 8,
        }}
      >
        <button
          onClick={handleLoadPop}
          aria-label="Cargar preset Pop"
          onFocus={onFocusRing}
          onBlur={onBlurRing}
          style={{
            border: "1px solid #4d6",
            background: "#0a2",
            color: "#fff",
            borderRadius: 6,
            padding: "8px 12px",
          }}
        >
          Cargar preset Pop
        </button>
        <button
          onClick={handleLoadNeo}
          aria-label="Cargar preset Neo"
          onFocus={onFocusRing}
          onBlur={onBlurRing}
          style={{
            border: "1px solid #556",
            background: "#223",
            color: "#fff",
            borderRadius: 6,
            padding: "8px 12px",
          }}
        >
          Cargar preset Neo
        </button>
      </div>

      {/* Warning métrico (si algún compás supera 4 beats) */}
      {barWarnings.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: "#7f1d1d",
            border: "1px solid #ff4d4d",
            borderRadius: 6,
            padding: 8,
            fontSize: 13,
            marginTop: 12,
            marginBottom: 12,
          }}
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

      {/* Leyenda con tooltips T/S/D */}
      <section style={{ marginTop: 16, fontSize: 12, color: "#ccc" }}>
        <strong>Leyenda:&nbsp;</strong>
        <InfoTooltip text="Centro de reposo; estabilidad y cierre.">
          <span style={{ color: "#1e3a8a", cursor: "help" }}>T</span>
        </InfoTooltip>
        &nbsp;= Tónica,&nbsp;
        <InfoTooltip text="Prepara el movimiento; puente hacia D o regreso a T.">
          <span style={{ color: "#166534", cursor: "help" }}>S</span>
        </InfoTooltip>
        &nbsp;= Subdominante,&nbsp;
        <InfoTooltip text="Tensión; empuja a resolver hacia T.">
          <span style={{ color: "#7f1d1d", cursor: "help" }}>D</span>
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
