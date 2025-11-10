// --------------------------------------------------
// 💾 ChordFlow — Persistencia mínima (localStorage)
// --------------------------------------------------
import type { ChordBlock } from "../progression/types";
import { migrateStore, CURRENT_VERSION } from "./migrator";

const LS_KEY = "chordflow.presets.v1";

// 🧱 Tipo base interno (usa 'progression'); 'version' opcional por compat.
export type Preset = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  bpm: number;
  key: string;
  style: string;
  progression: ChordBlock[];
  version?: string;
};

type Store = Record<string, Preset>;

// -------------------- IO localStorage --------------------
function readStore(): Store {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return migrateStore(parsed);
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
}
function uid() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// -------------------- CRUD interno --------------------
export function listPresets(): Preset[] {
  const store = readStore();
  return Object.values(store).sort((a, b) => b.updatedAt - a.updatedAt);
}
export function getPreset(id: string): Preset | null {
  const store = readStore();
  return store[id] ?? null;
}
export function saveNewPreset(
  data: Omit<Preset, "id" | "createdAt" | "updatedAt"> & { version?: string }
): Preset {
  const store = readStore();
  const now = Date.now();
  const preset: Preset = {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    version: data.version ?? CURRENT_VERSION,
    ...data,
  };
  store[preset.id] = preset;
  writeStore(store);
  return preset;
}
export function updatePreset(id: string, patch: Partial<Preset>): Preset | null {
  const store = readStore();
  if (!store[id]) return null;
  const now = Date.now();
  const merged: Preset = { ...store[id], ...patch, id, updatedAt: now };
  store[id] = merged;
  writeStore(store);
  return merged;
}
export function deletePreset(id: string) {
  const store = readStore();
  if (store[id]) {
    delete store[id];
    writeStore(store);
  }
}
export function duplicatePreset(id: string): Preset | null {
  const base = getPreset(id);
  if (!base) return null;
  return saveNewPreset({
    title: `${base.title} (copia)`,
    bpm: base.bpm,
    key: base.key,
    style: base.style,
    progression: JSON.parse(JSON.stringify(base.progression)),
    version: base.version ?? CURRENT_VERSION,
  });
}

// -------------------- Mapeo TFG (blocks/version) --------------------
function toTFGShape(p: Preset) {
  return {
    ...p,
    version: p.version ?? CURRENT_VERSION,
    blocks: p.progression, // TFG pide 'blocks'
  };
}
function fromTFGShape(p: any): Omit<Preset, "id" | "createdAt" | "updatedAt"> & { id?: string } {
  return {
    title: p.title,
    bpm: p.bpm,
    key: p.key,
    style: p.style,
    progression: p.blocks ?? p.progression,
    version: p.version ?? CURRENT_VERSION,
    // id opcional para update
    ...(p.id ? { id: p.id } : {}),
  } as any;
}

// -------------------- API TFG pedida --------------------
export function saveProgression(presetLike: {
  id?: string; title: string; key: string; bpm: number;
  style: string; blocks: ChordBlock[]; version?: string;
}) {
  const base = fromTFGShape(presetLike);
  if (base.id) {
    return updatePreset(base.id, { ...base });
  }
  return saveNewPreset(base);
}
export function loadAll() {
  return listPresets().map(toTFGShape);
}
export function deleteById(id: string) {
  return deletePreset(id);
}
