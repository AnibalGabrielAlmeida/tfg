import { useState, useRef, useEffect } from "react";

type Props = {
  onLoadPop: () => void;
  onLoadNeo: () => void;
  onExportJSON: () => void;
  onImportClick: () => void;
};

export default function ToolbarMenu({
  onLoadPop,
  onLoadNeo,
  onExportJSON,
  onImportClick,
}: Props) {
  const [open, setOpen] = useState(false);
  const [openPresets, setOpenPresets] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar al click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setOpenPresets(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="toolbar-menu-wrapper" ref={menuRef}>
      <button className="btn btn-ghost" onClick={() => setOpen(!open)}>
        ⋯
      </button>

      {open && (
        <div className="toolbar-menu-panel">

          {/* Submenú: Cargar estilos */}
          <div
            className="menu-item submenu-parent"
            onMouseEnter={() => setOpenPresets(true)}
            onMouseLeave={() => setOpenPresets(false)}
          >
            Cargar estilos de ejemplo ▸

            {openPresets && (
              <div className="submenu-panel">
                <button className="menu-item" onClick={onLoadPop}>
                  Pop
                </button>
                <button className="menu-item" onClick={onLoadNeo}>
                  Neo-Soul
                </button>
              </div>
            )}
          </div>

          <button className="menu-item" onClick={onExportJSON}>
            Exportar biblioteca (JSON)
          </button>

          <button className="menu-item" onClick={onImportClick}>
            Importar biblioteca (JSON)
          </button>
        </div>
      )}
    </div>
  );
}
