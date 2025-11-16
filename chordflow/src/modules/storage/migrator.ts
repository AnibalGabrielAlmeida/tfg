// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Migrador de esquema de presets
// --------------------------------------------------
// Este módulo se encarga de normalizar cualquier estructura antigua
// de datos almacenada en localStorage hacia un formato unificado:
//
// - Asegura que el resultado sea Store: Record<string, Preset>.
// - Soporta distintos esquemas históricos:
//   • Arreglo simple de presets.
//   • Objeto con claves id → preset.
//   • Campos alternativos: blocks / progression.
//   • Registros sin versión explícita.
//
// Se utiliza desde el módulo de persistencia para mantener
// compatibilidad hacia atrás cuando cambian el esquema o la versión.
// --------------------------------------------------

import type { Preset } from "./library";

export type Store = Record<string, Preset>;

// Versión actual del esquema de presets persistidos
export const CURRENT_VERSION = "1.0.0";

/**
 * Genera un identificador único para presets migrados
 * que no posean id en su estructura original.
 */
function makeId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Normaliza un objeto de entrada hacia la estructura Preset.
 *
 * - Asegura presencia de id, title, key, bpm, style.
 * - Unifica createdAt y updatedAt con valores por defecto coherentes.
 * - Adapta la lista de acordes desde "blocks" o "progression".
 * - Completa el campo de versión en caso de estar ausente.
 */
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

/**
 * Recibe cualquier representación cruda leída desde localStorage
 * y la migra al formato Store (Record<string, Preset>).
 *
 * Soporta:
 * - Arreglos de presets.
 * - Objetos con id como clave y preset como valor.
 * - Cualquier otra estructura se descarta y devuelve un store vacío.
 */
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

  // Cualquier otro tipo de dato → store vacío
  return store;
}
