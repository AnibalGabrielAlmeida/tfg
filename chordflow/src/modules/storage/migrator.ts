// --------------------------------------------------
// 💾 ChordFlow — Migrador de esquema de presets
// --------------------------------------------------
// Toma cualquier JSON viejo de localStorage y lo
// normaliza a Store: Record<string, Preset>.
//
// Soporta:
// - Array de presets
// - Objeto id -> preset
// - Campos antiguos: blocks / progression, sin version, etc.
// --------------------------------------------------

import type { Preset } from "./library";

export type Store = Record<string, Preset>;

export const CURRENT_VERSION = "1.0.0";

function makeId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePreset(input: any, forcedId?: string): Preset {
  const now = Date.now();

  const id = String(forcedId ?? input.id ?? makeId());
  const title = String(input.title ?? "Sin título");
  const key = String(input.key ?? "C");
  const bpm =
    typeof input.bpm === "number" && !Number.isNaN(input.bpm)
      ? input.bpm
      : 100;
  const style = String(input.style ?? "Pop");

  const createdAt =
    typeof input.createdAt === "number" ? input.createdAt : now;
  const updatedAt =
    typeof input.updatedAt === "number" ? input.updatedAt : createdAt;

  // Compatibilidad: algunos esquemas usan "blocks" en vez de "progression"
  const blocks = Array.isArray(input.blocks)
    ? input.blocks
    : Array.isArray(input.progression)
    ? input.progression
    : [];

  const version = String(input.version ?? CURRENT_VERSION);

  return {
    id,
    title,
    createdAt,
    updatedAt,
    bpm,
    key,
    style,
    progression: blocks,
    version,
  };
}

export function migrateStore(raw: any): Store {
  const store: Store = {};

  if (!raw) return store;

  // Caso 1: array de presets
  if (Array.isArray(raw)) {
    raw.forEach((p: any) => {
      const norm = normalizePreset(p);
      store[norm.id] = norm;
    });
    return store;
  }

  // Caso 2: objeto id -> preset
  if (typeof raw === "object") {
    Object.entries(raw).forEach(([id, value]) => {
      const norm = normalizePreset(value, id);
      store[norm.id] = norm;
    });
    return store;
  }

  // Cualquier otra cosa → store vacío
  return store;
}
