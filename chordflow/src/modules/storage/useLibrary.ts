// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: useLibrary — Gestión de biblioteca local de progresiones
// --------------------------------------------------
// Este hook encapsula el acceso a la biblioteca persistida en
// localStorage y ofrece una API de alto nivel para la interfaz:
//
// - items: listado de presets en formato TFG (con "blocks").
// - refresh: recarga manual desde el almacenamiento.
// - loadById: obtiene un preset por identificador.
// - save: crea o actualiza una progresión según reciba id o no.
// - update: aplica un patch parcial sobre un preset existente.
// - remove: elimina un preset por su identificador.
// - duplicate: genera una copia de un preset existente.
//
// Además, escucha eventos de `storage` para mantener sincronizadas
// múltiples pestañas del navegador que utilicen la aplicación.
// --------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { loadAll, saveProgression, deleteById } from "./library";
import { getPreset, updatePreset, duplicatePreset } from "./library";

/**
 * Hook de gestión de biblioteca local.
 * Centraliza operaciones de lectura/escritura sobre los presets
 * y expone un estado reactivo para ser utilizado por la UI.
 */
export function useLibrary() {
  const [items, setItems] = useState(() => loadAll());

  /**
   * Recarga el estado local a partir del contenido persistido.
   */
  const refresh = useCallback(() => setItems(loadAll()), []);

  /**
   * Guarda una progresión utilizando la API orientada al TFG.
   * Si el objeto incluye id, actualiza el preset; de lo contrario,
   * crea un nuevo registro.
   */
  const save = useCallback(
    (data: any) => {
      const p = saveProgression(data);
      refresh();
      return p;
    },
    [refresh]
  );

  /**
   * Actualiza parcialmente un preset existente identificado por id.
   */
  const update = useCallback(
    (id: string, patch: any) => {
      const p = updatePreset(id, patch);
      refresh();
      return p;
    },
    [refresh]
  );

  /**
   * Elimina un preset a partir de su identificador.
   */
  const remove = useCallback(
    (id: string) => {
      deleteById(id);
      refresh();
    },
    [refresh]
  );

  /**
   * Carga un preset individual directamente desde la capa de persistencia.
   */
  const loadById = useCallback((id: string) => getPreset(id), []);

  /**
   * Crea una copia de un preset existente y actualiza la lista local.
   */
  const duplicate = useCallback(
    (id: string) => {
      const p = duplicatePreset(id);
      refresh();
      return p;
    },
    [refresh]
  );

  /**
   * Sincroniza el estado de la biblioteca entre distintas pestañas
   * del navegador escuchando cambios en localStorage para la clave
   * utilizada por la aplicación.
   */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "chordflow.presets.v1") refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  return { items, refresh, loadAll, loadById, save, update, remove, duplicate };
}
