// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Persistencia mínima de biblioteca (localStorage)
// --------------------------------------------------
// Este módulo implementa una capa simple de persistencia basada en
// localStorage para almacenar presets de progresiones armónicas.
//
// Funcionalidades principales:
// - CRUD básico de presets (crear, leer, actualizar, eliminar).
// - Generación de identificadores únicos para cada preset.
// - Integración con un mecanismo de migración de versión (migrator).
// - Adaptación de la forma interna de datos al formato utilizado
//   en el TFG (propiedad "blocks" en lugar de "progression").
//
// Se utiliza como base para la biblioteca local de progresiones
// que el usuario puede guardar, cargar, duplicar y exportar.
// --------------------------------------------------

import type { ChordBlock } from "../progression/types";
import { migrateStore, CURRENT_VERSION } from "./migrator";

const LS_KEY = "chordflow.presets.v1";

/**
 * Estructura interna de un preset almacenado en localStorage.
 * Utiliza la propiedad `progression` para la lista de acordes.
 * La propiedad `version` se mantiene opcional para compatibilidad
 * con registros previos a la introducción del sistema de versiones.
 */
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

// --------------------------------------------------
// Operaciones de entrada/salida sobre localStorage
// --------------------------------------------------

/**
 * Lee el store completo desde localStorage y aplica migraciones
 * de formato si es necesario.
 */
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

/**
 * Escribe el store completo en localStorage.
 */
function writeStore(store: Store) {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
}

/**
 * Genera un identificador único para cada preset.
 */
function uid() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// --------------------------------------------------
// CRUD interno sobre presets
// --------------------------------------------------

/**
 * Devuelve todos los presets almacenados, ordenados por fecha
 * de actualización descendente (más recientes primero).
 */
export function listPresets(): Preset[] {
  const store = readStore();
  return Object.values(store).sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Recupera un preset por su identificador, o null si no existe.
 */
export function getPreset(id: string): Preset | null {
  const store = readStore();
  return store[id] ?? null;
}

/**
 * Crea y guarda un nuevo preset en el store.
 * Completa id, createdAt, updatedAt y version.
 */
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

/**
 * Actualiza un preset existente a partir de un patch parcial.
 * Si el id no existe, devuelve null.
 */
export function updatePreset(id: string, patch: Partial<Preset>): Preset | null {
  const store = readStore();
  if (!store[id]) return null;
  const now = Date.now();
  const merged: Preset = { ...store[id], ...patch, id, updatedAt: now };
  store[id] = merged;
  writeStore(store);
  return merged;
}

/**
 * Elimina un preset por id. Si no existe, no realiza cambios.
 */
export function deletePreset(id: string) {
  const store = readStore();
  if (store[id]) {
    delete store[id];
    writeStore(store);
  }
}

/**
 * Duplica un preset existente, generando un nuevo id y título
 * con el sufijo "(copia)". Conserva bpm, tonalidad, estilo y
 * la progresión original.
 */
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

// --------------------------------------------------
// Mapeo de forma interna ↔ forma TFG (blocks / version)
// --------------------------------------------------

/**
 * Adapta un preset interno al formato solicitado en el TFG:
 * - Asegura que siempre exista la propiedad `version`.
 * - Renombra `progression` como `blocks`.
 */
function toTFGShape(p: Preset) {
  return {
    ...p,
    version: p.version ?? CURRENT_VERSION,
    blocks: p.progression, // El documento del TFG utiliza la propiedad "blocks"
  };
}

/**
 * Adapta un objeto externo (formato TFG o similar) al formato interno
 * de persistencia, utilizando `progression` como lista de acordes.
 *
 * Permite, opcionalmente, conservar un id existente para operaciones
 * de actualización.
 */
function fromTFGShape(
  p: any
): Omit<Preset, "id" | "createdAt" | "updatedAt"> & { id?: string } {
  return {
    title: p.title,
    bpm: p.bpm,
    key: p.key,
    style: p.style,
    progression: p.blocks ?? p.progression,
    version: p.version ?? CURRENT_VERSION,
    ...(p.id ? { id: p.id } : {}),
  } as any;
}

// --------------------------------------------------
// API pública alineada con el TFG
// --------------------------------------------------

/**
 * Guarda una progresión en la biblioteca a partir de una estructura
 * simplificada orientada al TFG:
 * - Si incluye id, se actualiza el preset correspondiente.
 * - Si no incluye id, se crea un nuevo preset.
 */
export function saveProgression(presetLike: {
  id?: string;
  title: string;
  key: string;
  bpm: number;
  style: string;
  blocks: ChordBlock[];
  version?: string;
}) {
  const base = fromTFGShape(presetLike);
  if (base.id) {
    return updatePreset(base.id, { ...base });
  }
  return saveNewPreset(base);
}

/**
 * Devuelve toda la biblioteca en formato TFG (con propiedad `blocks`).
 */
export function loadAll() {
  return listPresets().map(toTFGShape);
}

/**
 * Elimina un preset a partir de su identificador.
 */
export function deleteById(id: string) {
  return deletePreset(id);
}
