// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Componente: InfoTooltip
// --------------------------------------------------
// Componente de utilidad para mostrar información breve en forma
// de tooltip al interactuar con un elemento (hover o foco).
// El contenido del tooltip se muestra únicamente cuando el usuario
// pasa el cursor o enfoca el elemento asociado.
//
// Este componente se utiliza principalmente en elementos educativos,
// como la indicación de funciones tonales (T/S/D).
// --------------------------------------------------

import React, { useState } from "react";

type Props = {
  /** Texto que se mostrará dentro del tooltip */
  text: string;

  /** Elemento que actuará como disparador del tooltip */
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
        <span role="tooltip" className="tooltip">
          {text}
        </span>
      )}
    </span>
  );
}
