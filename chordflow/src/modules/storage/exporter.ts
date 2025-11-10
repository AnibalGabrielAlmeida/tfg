// --------------------------------------------------
// 📤📥 ChordFlow — Export / Import de biblioteca
// --------------------------------------------------

import { loadAll, saveProgression, deleteById } from "./library";
import { CURRENT_VERSION } from "./migrator";

type ImportMode = "merge" | "replace";

export function exportLibraryToJSON(): string {
  const presets = loadAll();
  const payload = {
    format: "chordflow.library",
    version: CURRENT_VERSION,
    exportedAt: Date.now(),
    presets,
  };
  return JSON.stringify(payload, null, 2);
}

export function importLibraryFromJSON(
  json: string,
  mode: ImportMode = "merge"
): { imported: number } {
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    console.warn("[import] JSON inválido:", e);
    return { imported: 0 };
  }

  const presets = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.presets)
    ? parsed.presets
    : [];

  if (!presets.length) return { imported: 0 };

  if (mode === "replace") {
    // borrar biblioteca actual usando la API pública
    const current = loadAll();
    current.forEach((p: any) => {
      if (p.id) deleteById(p.id);
    });
  }

  let imported = 0;
  for (const preset of presets) {
    saveProgression(preset);
    imported++;
  }

  return { imported };
}
