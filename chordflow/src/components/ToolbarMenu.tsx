// --------------------------------------------------
// ⚙️ Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Componente: ToolbarMenu
// --------------------------------------------------
// Menú contextual ubicado en la esquina derecha de la barra superior.
//
// Proporciona acceso a acciones avanzadas:
// - Cargar presets de ejemplo (Pop, Neo-Soul).
// - Exportar la biblioteca local a un archivo JSON.
// - Importar una biblioteca desde un archivo JSON.
//
// El menú incluye lógica para:
// - Abrirse/cerrarse al hacer click en el botón ⋯.
// - Cerrarse automáticamente al hacer click fuera del panel.
// - Manejar un submenú (presets) mediante hover.
// --------------------------------------------------

import { useState, useRef, useEffect } from "react";

type Props = {
  /** Carga un preset de estilo Pop */
  onLoadPop: () => void;

  /** Carga un preset de estilo Neo-Soul */
  onLoadNeo: () => void;

  /** Exporta la biblioteca local de progresiones en formato JSON */
  onExportJSON: () => void;

  /** Desencadena el flujo de importación de biblioteca desde JSON */
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

  // Cierra el menú si el usuario hace click fuera del panel
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setOpenPresets(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="toolbar-menu-wrapper" ref={menuRef}>
      {/* Botón principal (⋯) */}
      <button className="btn btn-ghost" onClick={() => setOpen(!open)}>
        ⋯
      </button>

      {/* Panel principal del menú */}
      {open && (
        <div className="toolbar-menu-panel">
          {/* Submenú: presets de ejemplo */}
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

          {/* Exportación e importación */}
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
