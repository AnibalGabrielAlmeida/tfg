// --------------------------------------------------
// 📚 ChordFlow — Panel de Biblioteca Local
// --------------------------------------------------
// Este componente muestra los presets guardados en
// localStorage y permite abrir, duplicar o eliminar.
// Es un modal flotante con diseño simple.
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
  open: boolean;               // controla si el panel está visible
  onClose: () => void;         // callback para cerrar el panel
  onLoadPreset: (p: Preset) => void; // carga el preset seleccionado en la app
}) {
  // 📦 Estado interno con la lista de presets
  const [items, setItems] = useState<Preset[]>([]);

  // 🔄 Actualiza la lista desde localStorage
  function refresh() {
    setItems(listPresets());
  }

  // Cuando se abre el panel, recarga la lista
  useEffect(() => {
    if (open) refresh();
  }, [open]);

  // Si no está abierto, no renderiza nada
  if (!open) return null;

  // --------------------------------------------------
  // 🧱 Render del modal principal
  // --------------------------------------------------
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 30,
      }}
    >
      <div
        style={{
          width: "min(720px, 95vw)",
          maxHeight: "80vh",
          overflow: "auto",
          background: "#121212",
          border: "1px solid #2a2a2a",
          borderRadius: 10,
          padding: 16,
          color: "#fff",
        }}
      >
        {/* Encabezado */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>Biblioteca local</h3>
          <button
            onClick={onClose}
            style={{
              border: "1px solid #444",
              background: "#000",
              color: "#fff",
              borderRadius: 6,
              padding: "6px 10px",
            }}
          >
            Cerrar
          </button>
        </div>

        {/* Lista de presets */}
        {items.length === 0 ? (
          <p style={{ opacity: 0.7 }}>
            No hay progresiones guardadas aún.
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: 8,
            }}
          >
            {items.map((p) => (
              <li
                key={p.id}
                style={{
                  border: "1px solid #333",
                  borderRadius: 8,
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                {/* Detalle del preset */}
                <div>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Key {p.key} · {p.bpm} BPM · {p.style} ·{" "}
                    {p.progression.length} bloques
                  </div>
                </div>

                {/* Botones de acción */}
                <button
                  onClick={() => {
                    const full = getPreset(p.id);
                    if (full) onLoadPreset(full);
                    onClose();
                  }}
                  style={{
                    border: "1px solid #4d6",
                    background: "#0a2",
                    color: "#fff",
                    borderRadius: 6,
                    padding: "6px 10px",
                  }}
                >
                  Abrir
                </button>
                <button
                  onClick={() => {
                    duplicatePreset(p.id);
                    refresh();
                  }}
                  style={{
                    border: "1px solid #556",
                    background: "#223",
                    color: "#fff",
                    borderRadius: 6,
                    padding: "6px 10px",
                  }}
                >
                  Duplicar
                </button>
                <button
                  onClick={() => {
                    deletePreset(p.id);
                    refresh();
                  }}
                  style={{
                    border: "1px solid #a44",
                    background: "transparent",
                    color: "#fff",
                    borderRadius: 6,
                    padding: "6px 10px",
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
