// --------------------------------------
// 🎵 ChordFlow — Prototipo Interactivo
// --------------------------------------
// - Panel global limpio (Key, BPM, Meter, Style, Play/Stop, Add, Sugerir)
// - Progresión editable (CRUD + Drag & Drop)
// - Sugerencias por estilo (Pop/Neo) con Markov
// - Leyenda T/S/D con tooltips breves
// - 🔁 Auto re-schedule del transporte al cambiar orden/BPM/Key si está sonando
// --------------------------------------

import { useState, useRef, useEffect } from "react";
import { play, stop, scheduleProgression, rescheduleAtNextDownbeat } from "./modules/audio/player";
import type { ChordBlock } from "./modules/progression/types";
import ProgressionList from "./components/ProgressionList";
import { suggestNextDegree } from "./modules/recommendation/markov";
import { getPopPreset, getNeoPreset } from "./modules/presets";
import Toolbar from "./components/Toolbar";
import InfoTooltip from "./components/InfoTooltip";
import LibraryPanel from "./components/LibraryPanel";
import { saveNewPreset } from "./modules/storage/library";
import { barsUsage, exceedsAnyBar } from "./modules/progression/types";
import { arrayMove } from "@dnd-kit/sortable";

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

  // Estado de reproducción (para auto re-schedule)
  const [isPlaying, setIsPlaying] = useState(false);

  // Progresión + generador de IDs
  const nextIdRef = useRef(5);
  const [progression, setProgression] = useState<ChordBlock[]>([
    { id: "b1", degree: "I", durationBeats: 4 },
    { id: "b2", degree: "vi", durationBeats: 4 },
    { id: "b3", degree: "IV", durationBeats: 4 },
    { id: "b4", degree: "V", durationBeats: 4 },
  ]);

  const onFocusRing = (e: React.FocusEvent<HTMLButtonElement | HTMLInputElement>) => {
  e.currentTarget.style.boxShadow = "0 0 0 2px #6cf";
};
const onBlurRing = (e: React.FocusEvent<HTMLButtonElement | HTMLInputElement>) => {
  e.currentTarget.style.boxShadow = "none";
};

  // --- CRUD ---
  // ✅ Validación 4/4: bloquea cambios de duración que rompen el compás
  function updateBlockDuration(id: string, newBeats: number) {
    setProgression((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, durationBeats: newBeats } : b));
      return exceedsAnyBar(next) ? prev : next;
    });
  }

  // ✅ Validación 4/4 al agregar: wrap inteligente (1 beat si hay espacio; si no, nuevo compás con 4)
  function addBlock() {
  setProgression((prev) => {
    const newBlock: ChordBlock = {
      id: `b${nextIdRef.current++}`,
      degree: "I" as ChordBlock["degree"],
      durationBeats: 4,
    };

    const candidate: ChordBlock[] = [...prev, newBlock];
    if (!exceedsAnyBar(candidate)) return candidate;

    const lastUsage = barsUsage(prev).at(-1) ?? 0;
    const dur = lastUsage <= 3 ? 1 : 4;

    const wrapped: ChordBlock = {
      id: `b${nextIdRef.current++}`,
      degree: "I" as ChordBlock["degree"],
      durationBeats: dur,
    };
    return [...prev, wrapped];
  });
}


  function duplicateBlock(id: string) {
    const original = progression.find((b) => b.id === id);
    if (!original) return;
    const newId = `b${nextIdRef.current++}`;
    const clone: ChordBlock = { ...original, id: newId };
    setProgression((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      const copy = prev.slice();
      copy.splice(idx + 1, 0, clone);
      // Duplicar no cambia beats totales por compás, pero por seguridad:
      return exceedsAnyBar(copy) ? prev : copy;
    });
  }

  function deleteBlock(id: string) {
    setProgression((prev) => prev.filter((b) => b.id !== id));
  }

 const handleReorder = (activeId: string, overId: string) => {
  setProgression((prev) => {
    const oldIndex = prev.findIndex((b) => b.id === activeId);
    const newIndex = prev.findIndex((b) => b.id === overId);
    const next = arrayMove(prev, oldIndex, newIndex);
    return exceedsAnyBar(next) ? prev : next; // validación 4/4
  });
};


  function loadPresetAndMaybePlay(p: ReturnType<typeof getPopPreset>) {
    // Setea estado visible
    setBpm(p.bpm);
    setKey(p.key as typeof key);
    setStyle(p.style as typeof style);
    // reindexa ids por si ya hay bloques
    let n = 1;
    const reId = p.progression.map(b => ({ ...b, id: `pb${n++}` as string }));
    setProgression(reId);

    // Si ya está sonando, reprograma al próximo compás; si no, hace Play directo
    if (isPlaying) {
      // fallback estable por ahora:
      stop();
      // programa y reproduce con lo actual
      scheduleProgression(reId, p.bpm, p.key);
      play().then(() => setIsPlaying(true));
    } else {
      scheduleProgression(reId, p.bpm, p.key);
      play().then(() => setIsPlaying(true));
    }
  }

  function handleLoadPop() {
    loadPresetAndMaybePlay(getPopPreset());
  }

  function handleLoadNeo() {
    loadPresetAndMaybePlay(getNeoPreset());
  }

  // --- Warning métrico (4/4) ---
  function getBarWarnings(blocks: ChordBlock[]) {
    let beatCursor = 0;
    const barUsage: Record<number, number> = {};
    for (const b of blocks) {
      const bar = Math.floor(beatCursor / 4);
      barUsage[bar] = (barUsage[bar] || 0) + b.durationBeats;
      beatCursor += b.durationBeats;
    }
    return Object.entries(barUsage)
      .filter(([_, beats]) => beats > 4)
      .map(([bar, beats]) => ({ bar: Number(bar) + 1, beats }));
  }
  const barWarnings = getBarWarnings(progression);

  // --- Sugerencia automática por estilo (Pop/Neo) ---
  function suggestAndInsertNext() {
    setProgression((prev) => {
      const last = prev[prev.length - 1];
      const base = last?.degree ?? "I";
      const suggested = suggestNextDegree(style, base);
      const newId = `b${nextIdRef.current++}`;
      const candidate = [
        ...prev,
        {
          id: newId,
          degree: suggested as ChordBlock["degree"],
          durationBeats: 4,
        },
      ];
      // Mantener 4/4 también al sugerir
      return exceedsAnyBar(candidate)
        ? prev
        : candidate;
    });
  }

  const [title, setTitle] = useState("Mi progresión");
  const [libraryOpen, setLibraryOpen] = useState(false);
  // handler guardar
  function handleSavePreset() {
    // guarda exactamente lo que ves ahora
    saveNewPreset({
      title: title.trim() || "Sin título",
      bpm,
      key,
      style,
      progression,
    });
    // feedback simple: podés agregar un toast si querés
    console.log("[library] guardado");
  }

  // handler al abrir preset desde el panel
  function handleLoadPreset(preset: { title: string; bpm: number; key: string; style: string; progression: ChordBlock[] }) {
    setTitle(preset.title);
    setBpm(preset.bpm);
    setKey(preset.key as typeof key);
    setStyle(preset.style as typeof style);
    setProgression(preset.progression);
  }

  // --- Transporte: Play/Stop ---
  const handlePlay = async () => {
    // Programa lo actual y arranca
    scheduleProgression(progression, bpm, key);
    await play();
    setIsPlaying(true);
  };
  const handleStop = () => {
    stop();
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!isPlaying) return;
    // Aplicar cambios al inicio del próximo loop (downbeat)
    rescheduleAtNextDownbeat(progression, bpm, key);
  }, [progression, bpm, key, isPlaying]);

  useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      isPlaying ? handleStop() : handlePlay();
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [isPlaying]); // deps mínimas

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
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título…"
        aria-label="Título de la progresión"
        onFocus={onFocusRing}
        onBlur={onBlurRing}
        style={{
          padding: "6px 8px",
          borderRadius: 6,
          border: "1px solid #444",
          background: "#0b0b0b",
          color: "#fff",
        }}
      />
      <button
        onClick={handleSavePreset}
        aria-label="Guardar preset"
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
        Guardar
      </button>
      <button
        onClick={() => setLibraryOpen(true)}
        aria-label="Abrir biblioteca"
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
        Biblioteca
      </button>
    </div>

    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
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

    <LibraryPanel
      open={libraryOpen}
      onClose={() => setLibraryOpen(false)}
      onLoadPreset={handleLoadPreset}
    />
  </main>
);

}

export default App;
