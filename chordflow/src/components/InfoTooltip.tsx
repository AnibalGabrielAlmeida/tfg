// --------------------------------------------------
// 💬 ChordFlow — InfoTooltip
// --------------------------------------------------
// Componente simple de tooltip (ayuda emergente) para mostrar
// explicaciones breves al pasar el mouse sobre un elemento.
// Usado en la leyenda T/S/D para fines educativos.
// --------------------------------------------------

// --------------------------------------------------
// 💬 ChordFlow — InfoTooltip (con theme global)
// --------------------------------------------------

import React, { useState } from "react";

type Props = {
  text: string;
  children: React.ReactNode;
};

export default function InfoTooltip({ text, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="tooltip-trigger"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}

      {open && (
        <span
          role="tooltip"
          className="tooltip"
        >
          {text}
        </span>
      )}
    </span>
  );
}
