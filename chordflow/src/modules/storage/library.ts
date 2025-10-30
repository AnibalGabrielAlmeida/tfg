// Persistencia mínima en localStorage para progresiones
import type { ChordBlock } from "../progression/types";

const LS_KEY = "chordflow.presets.v1";

export type Preset = {
  id: string;            // uid
  title: string;         // nombre visible
  createdAt: number;     // epoch ms
  updatedAt: number;     // epoch ms
  bpm: number;
  key: string;           // tonalidad (C, G, D, F…)
  style: string;         // Pop/Neo (string simple)
  progression: ChordBlock[];
};

type Store = Record<string, Preset>;

function readStore(): Store {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
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

export function listPresets(): Preset[] {
  const store = readStore();
  return Object.values(store).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getPreset(id: string): Preset | null {
  const store = readStore();
  return store[id] ?? null;
}

export function saveNewPreset(data: Omit<Preset, "id" | "createdAt" | "updatedAt">): Preset {
  const store = readStore();
  const now = Date.now();
  const preset: Preset = { id: uid(), createdAt: now, updatedAt: now, ...data };
  store[preset.id] = preset;
  writeStore(store);
  return preset;
}

export function updatePreset(id: string, patch: Partial<Preset>): Preset | null {
  const store = readStore();
  if (!store[id]) return null;
  const now = Date.now();
  const merged = { ...store[id], ...patch, id, updatedAt: now };
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
  });
}
