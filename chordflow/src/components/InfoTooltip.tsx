// --------------------------------------------------
// 💬 ChordFlow — InfoTooltip
// --------------------------------------------------
// Componente simple de tooltip (ayuda emergente) para mostrar
// explicaciones breves al pasar el mouse sobre un elemento.
// Usado en la leyenda T/S/D para fines educativos.
// --------------------------------------------------

import { useState } from "react";

// 📘 Props esperadas: texto del tooltip y contenido hijo (trigger visual)
type Props = {
  text: string;              // Texto explicativo que aparece en el tooltip
  children: React.ReactNode; // Elemento sobre el que se muestra (trigger)
};

export default function InfoTooltip({ text, children }: Props) {
  // Estado interno: controla si el tooltip está visible
  const [open, setOpen] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setOpen(true)}  // al pasar el mouse, mostrar
      onMouseLeave={() => setOpen(false)} // al salir, ocultar
    >
      {children}

      {/* Tooltip flotante */}
      {open && (
        <span
          role="tooltip" // accesibilidad: indica que es una ayuda emergente
          style={{
            position: "absolute",
            top: "120%",             // aparece debajo del trigger
            left: "50%",
            transform: "translateX(-50%)",
            background: "#111",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: 6,
            padding: "6px 8px",
            fontSize: 12,
            whiteSpace: "nowrap",    // evita saltos de línea
            zIndex: 20,
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
