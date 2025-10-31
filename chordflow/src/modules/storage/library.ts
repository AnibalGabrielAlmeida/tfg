// --------------------------------------------------
// 💾 ChordFlow — Persistencia mínima (localStorage)
// --------------------------------------------------
// Este módulo guarda, carga y administra presets
// (progresiones armónicas) usando el almacenamiento
// local del navegador (sin backend aún).
// --------------------------------------------------

import type { ChordBlock } from "../progression/types";

// 🔑 Clave única usada en localStorage
const LS_KEY = "chordflow.presets.v1";

// 🧱 Estructura de un preset guardado
export type Preset = {
  id: string;            // Identificador único (uid)
  title: string;         // Nombre visible
  createdAt: number;     // Fecha de creación (epoch ms)
  updatedAt: number;     // Fecha de última modificación (epoch ms)
  bpm: number;           // Velocidad
  key: string;           // Tonalidad (C, G, D, F…)
  style: string;         // Estilo ("Pop", "Neo", etc.)
  progression: ChordBlock[]; // Secuencia de acordes
};

// El "Store" interno es un objeto indexado por ID
type Store = Record<string, Preset>;

// --------------------------------------------------
// 📖 Funciones internas de lectura/escritura
// --------------------------------------------------

// Lee la base de datos local (JSON) desde localStorage
function readStore(): Store {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    // fallback si hay error o datos corruptos
    return {};
  }
}

// Escribe el store actualizado en localStorage
function writeStore(store: Store) {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
}

// Genera un ID único para cada preset
function uid() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// --------------------------------------------------
// 🗂️ API pública — CRUD completo de presets
// --------------------------------------------------

// 📋 Lista todos los presets guardados, ordenados por fecha
export function listPresets(): Preset[] {
  const store = readStore();
  return Object.values(store).sort((a, b) => b.updatedAt - a.updatedAt);
}

// 🔍 Obtiene un preset por su ID
export function getPreset(id: string): Preset | null {
  const store = readStore();
  return store[id] ?? null;
}

// 💾 Guarda un nuevo preset (crear)
export function saveNewPreset(data: Omit<Preset, "id" | "createdAt" | "updatedAt">): Preset {
  const store = readStore();
  const now = Date.now();
  const preset: Preset = { id: uid(), createdAt: now, updatedAt: now, ...data };
  store[preset.id] = preset;
  writeStore(store);
  return preset;
}

// ✏️ Actualiza un preset existente (modificar)
export function updatePreset(id: string, patch: Partial<Preset>): Preset | null {
  const store = readStore();
  if (!store[id]) return null;
  const now = Date.now();
  const merged = { ...store[id], ...patch, id, updatedAt: now };
  store[id] = merged;
  writeStore(store);
  return merged;
}

// 🗑️ Elimina un preset por ID
export function deletePreset(id: string) {
  const store = readStore();
  if (store[id]) {
    delete store[id];
    writeStore(store);
  }
}

// 📄 Duplica un preset existente (crear copia independiente)
export function duplicatePreset(id: string): Preset | null {
  const base = getPreset(id);
  if (!base) return null;

  // Se clona la progresión para evitar referencias compartidas
  return saveNewPreset({
    title: `${base.title} (copia)`,
    bpm: base.bpm,
    key: base.key,
    style: base.style,
    progression: JSON.parse(JSON.stringify(base.progression)),
  });
}
