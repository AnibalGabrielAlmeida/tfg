import { useState } from "react";

type Props = { text: string; children: React.ReactNode };

export default function InfoTooltip({ text, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            top: "120%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#111",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: 6,
            padding: "6px 8px",
            fontSize: 12,
            whiteSpace: "nowrap",
            zIndex: 20,
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
