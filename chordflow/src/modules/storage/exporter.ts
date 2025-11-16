// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Exportación e importación de biblioteca local
// --------------------------------------------------
// Este módulo permite:
//
// - Exportar la biblioteca completa de progresiones (presets)
//   a un archivo JSON legible y versionado.
// - Importar una biblioteca previamente guardada mediante dos modos:
//     • merge   → agrega los presets al contenido existente.
//     • replace → reemplaza por completo la biblioteca actual.
//
// Se integra con el módulo `library`, que administra el almacenamiento
// en localStorage, y con `migrator` para mantener versiones coherentes.
// --------------------------------------------------

import { loadAll, saveProgression, deleteById } from "./library";
import { CURRENT_VERSION } from "./migrator";

type ImportMode = "merge" | "replace";

/**
 * Exporta la biblioteca completa a un JSON formateado.
 * Incluye información de versión y marca temporal para
 * garantizar trazabilidad entre exportaciones.
 *
 * @returns string JSON formateado y listo para descarga.
 */
export function exportLibraryToJSON(): string {
  const presets = loadAll();
  const payload = {
    format: "chordflow.library", // identificador del formato
    version: CURRENT_VERSION,    // versión del formato de datos
    exportedAt: Date.now(),      // timestamp de exportación
    presets,                     // contenido de la biblioteca
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Importa una biblioteca desde un JSON válido.
 *
 * @param json  Contenido JSON recibido.
 * @param mode  Estrategia de importación:
 *               - "merge": agrega los nuevos presets a la biblioteca.
 *               - "replace": borra la biblioteca previa antes de importar.
 * @returns { imported: number } Cantidad de presets restaurados.
 */
export function importLibraryFromJSON(
  json: string,
  mode: ImportMode = "merge"
): { imported: number } {
  let parsed: any;

  // Intento de parseo seguro
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    console.warn("[import] JSON inválido:", e);
    return { imported: 0 };
  }

  // Soporte para dos estructuras:
  // - exportaciones antiguas: array directo
  // - formato nuevo: { presets: [...] }
  const presets = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.presets)
    ? parsed.presets
    : [];

  if (!presets.length) return { imported: 0 };

  // Modo replace: eliminar biblioteca actual antes de importar
  if (mode === "replace") {
    const current = loadAll();
    current.forEach((p: any) => {
      if (p.id) deleteById(p.id);
    });
  }

  // Guardar cada preset importado
  let imported = 0;
  for (const preset of presets) {
    saveProgression(preset);
    imported++;
  }

  return { imported };
}
