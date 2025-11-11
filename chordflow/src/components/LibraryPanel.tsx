// --------------------------------------------------
// 📚 ChordFlow — Panel de Biblioteca Local
// --------------------------------------------------
// Este componente muestra los presets guardados en
// localStorage y permite abrir, duplicar o eliminar.
// Es un modal flotante con diseño simple.
// --------------------------------------------------

// --------------------------------------------------
// 📚 ChordFlow — Panel de Biblioteca Local (con theme global)
// --------------------------------------------------

import { useEffect, useState } from "react";
import type { Preset } from "../modules/storage/library";
import {
  listPresets,
  getPreset,
  deletePreset,
  duplicatePreset,
} from "../modules/storage/library";

export default function LibraryPanel({
  open,
  onClose,
  onLoadPreset,
}: {
  open: boolean;
  onClose: () => void;
  onLoadPreset: (p: Preset) => void;
}) {
  const [items, setItems] = useState<Preset[]>([]);

  function refresh() {
    setItems(listPresets());
  }

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="panel modal-panel">
        {/* Encabezado */}
        <div className="library-header">
          <h3 style={{ margin: 0 }}>Biblioteca local</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {/* Lista de presets */}
        {items.length === 0 ? (
          <p className="library-empty">No hay progresiones guardadas aún.</p>
        ) : (
          <ul className="library-list">
            {items.map((p) => (
              <li key={p.id} className="card library-item">
                {/* Detalle del preset */}
                <div>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div className="text-soft" style={{ fontSize: 12 }}>
                    Key {p.key} · {p.bpm} BPM · {p.style} ·{" "}
                    {p.progression.length} bloques
                  </div>
                </div>

                {/* Botones de acción */}
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    const full = getPreset(p.id);
                    if (full) onLoadPreset(full);
                    onClose();
                  }}
                >
                  Abrir
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    duplicatePreset(p.id);
                    refresh();
                  }}
                >
                  Duplicar
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    deletePreset(p.id);
                    refresh();
                  }}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
