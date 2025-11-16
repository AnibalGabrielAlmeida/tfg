// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Componente: Panel de Biblioteca Local
// --------------------------------------------------
// Componente encargado de mostrar y gestionar los presets guardados
// en localStorage. Funciona como un panel modal y permite:
//
// - Listar progresiones almacenadas por el usuario.
// - Abrir un preset completo.
// - Duplicar una progresión guardada.
// - Eliminar elementos de la biblioteca.
//
// Se actualiza automáticamente cada vez que se abre el panel.
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
  /** Controla si el modal está visible */
  open: boolean;

  /** Handler para cerrar el panel */
  onClose: () => void;

  /** Devuelve al componente padre el preset seleccionado */
  onLoadPreset: (p: Preset) => void;
}) {
  const [items, setItems] = useState<Preset[]>([]);

  /** Recarga la lista desde localStorage */
  function refresh() {
    setItems(listPresets());
  }

  // Refresca la lista cada vez que se abre el panel
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
                {/* Información del preset */}
                <div>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div className="text-soft" style={{ fontSize: 12 }}>
                    Key {p.key} · {p.bpm} BPM · {p.style} ·{" "}
                    {p.progression.length} bloques
                  </div>
                </div>

                {/* Acciones */}
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
