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

import { useEffect, useMemo, useState } from "react";
import type { Preset } from "../modules/storage/library";
import {
  listPresets,
  getPreset,
  deletePreset,
  duplicatePreset,
} from "../modules/storage/library";
import { api } from "../api/client";
import type { ChordBlock } from "../modules/progression/types";

type CloudRow = { id: string; title: string; created_at?: string };

export default function LibraryPanel({
  open,
  onClose,
  onLoadPreset,
  currentState,
  onLoadCloud,
}: {
  open: boolean;
  onClose: () => void;
  onLoadPreset: (p: Preset) => void;

  // estado actual (para guardar en nube desde el panel)
  currentState: {
    title: string;
    bpm: number;
    key: string;
    style: string;
    progression: ChordBlock[];
  };

  // callback para cargar una progresión nube en el App
  onLoadCloud: (full: any) => void;
}) {
  // ----- Local -----
  const [items, setItems] = useState<Preset[]>([]);
  function refreshLocal() {
    setItems(listPresets());
  }

  // ----- Nube -----
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("123456");
  const [cloudItems, setCloudItems] = useState<CloudRow[]>([]);
  const [selectedCloudId, setSelectedCloudId] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<string>("");

  const hasToken = useMemo(() => Boolean(api.getToken()), [open, statusMsg]);

  useEffect(() => {
    if (!open) return;
    refreshLocal();
  }, [open]);

  if (!open) return null;

  async function handleLoginCloud() {
    try {
      const { token } = await api.login(email, password);
      api.setToken(token);
      setStatusMsg("✅ Sesión iniciada");
    } catch (e: any) {
      setStatusMsg(`❌ Login: ${e.message}`);
    }
  }

  async function handleCloudList() {
    try {
      const list = await api.listProgressions();
      // Mostramos tal cual vienen del backend (title/id)
      setCloudItems(list as any);
      const firstId = (list as any)[0]?.id ?? "";
      setSelectedCloudId(firstId);
      setStatusMsg(`✅ Nube: ${list.length} progresiones`);
    } catch (e: any) {
      setStatusMsg(`❌ Nube list: ${e.message}`);
    }
  }

  async function handleCloudSave() {
    try {
      const payload = {
        title: currentState.title.trim() || "Sin título",
        style: currentState.style,
        bpm: currentState.bpm,
        time_signature: "4/4",
        key_id: null,
        data: currentState.progression,
      };

      const created = await api.saveProgression(payload);
      setStatusMsg(`✅ Guardado en la nube (${created.id})`);
      // refrescar lista para que aparezca
      await handleCloudList();
    } catch (e: any) {
      setStatusMsg(`❌ Nube save: ${e.message} (podés guardar local)`);
    }
  }

  function isCompatible(data: any): boolean {
    // chequeo mínimo para evitar crasheos: array + campos típicos
    if (!Array.isArray(data)) return false;
    // si está vacío lo consideramos ok
    if (data.length === 0) return true;
    const b = data[0];
    // ajustá esto si tu ChordBlock usa otros campos obligatorios
    return typeof b === "object" && b !== null && "degree" in b;
  }

  async function handleCloudLoad() {
    try {
      if (!selectedCloudId) return;
      const full = await api.getProgression(selectedCloudId);

      if (!isCompatible(full.data)) {
        setStatusMsg("⚠️ Esta progresión no es compatible con esta versión del prototipo.");
        return;
      }

      onLoadCloud(full);
      setStatusMsg("✅ Cargada desde la nube");
      onClose();
    } catch (e: any) {
      setStatusMsg(`❌ Nube load: ${e.message}`);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="panel modal-panel">
        {/* Encabezado */}
        <div className="library-header">
          <h3 style={{ margin: 0 }}>Biblioteca</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {/* ------------------ NUBE (principal) ------------------ */}
        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 600 }}>Nube (recomendado)</div>
            <div className="text-soft" style={{ fontSize: 12 }}>
              Login → guardar → cargar
            </div>
          </div>

          {!hasToken ? (
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
              <button className="btn btn-sm btn-primary" onClick={handleLoginCloud}>
                Iniciar sesión
              </button>
              <span className="text-soft" style={{ fontSize: 12 }}>
                (si no iniciás sesión, podés usar Local)
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button className="btn btn-sm btn-primary" onClick={handleCloudSave}>
                Guardar en la nube
              </button>

              <button className="btn btn-sm" onClick={handleCloudList}>
                Refrescar lista
              </button>

              <select value={selectedCloudId} onChange={(e) => setSelectedCloudId(e.target.value)}>
                <option value="">(seleccionar)</option>
                {cloudItems.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>

              <button className="btn btn-sm" onClick={handleCloudLoad} disabled={!selectedCloudId}>
                Cargar
              </button>
            </div>
          )}

          {statusMsg && (
            <div className="text-soft" style={{ fontSize: 12, marginTop: 8 }}>
              {statusMsg}
            </div>
          )}
        </div>

        {/* ------------------ LOCAL (fallback) ------------------ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontWeight: 600 }}>Local (fallback)</div>
          <div className="text-soft" style={{ fontSize: 12 }}>
            disponible sin internet
          </div>
        </div>

        {items.length === 0 ? (
          <p className="library-empty">No hay progresiones guardadas aún.</p>
        ) : (
          <ul className="library-list">
            {items.map((p) => (
              <li key={p.id} className="card library-item">
                <div>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div className="text-soft" style={{ fontSize: 12 }}>
                    Key {p.key} · {p.bpm} BPM · {p.style} · {p.progression.length} bloques
                  </div>
                </div>

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
                    refreshLocal();
                  }}
                >
                  Duplicar
                </button>

                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    deletePreset(p.id);
                    refreshLocal();
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
