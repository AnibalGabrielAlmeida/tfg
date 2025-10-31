import { useCallback, useEffect, useState } from "react";
import { loadAll, saveProgression, deleteById } from "./library";
import { getPreset, updatePreset, duplicatePreset } from "./library";

export function useLibrary() {
  const [items, setItems] = useState(() => loadAll());

  const refresh = useCallback(() => setItems(loadAll()), []);

  const save = useCallback((data: any) => {
    const p = saveProgression(data);
    refresh();
    return p;
  }, [refresh]);

  const update = useCallback((id: string, patch: any) => {
    const p = updatePreset(id, patch);
    refresh();
    return p;
  }, [refresh]);

  const remove = useCallback((id: string) => {
    deleteById(id);
    refresh();
  }, [refresh]);

  const loadById = useCallback((id: string) => getPreset(id), []);
  const duplicate = useCallback((id: string) => {
    const p = duplicatePreset(id);
    refresh();
    return p;
  }, [refresh]);

  // Sync entre pestañas (usa tu clave actual)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "chordflow.presets.v1") refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  return { items, refresh, loadAll, loadById, save, update, remove, duplicate };
}
