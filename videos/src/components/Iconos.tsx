import React from "react";

// Íconos dibujados (sin emojis: el render no depende de fuentes de emoji).
const S: React.FC<{ size?: number; children: React.ReactNode }> = ({ size = 16, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "static", display: "inline-block", verticalAlign: "-3px", marginRight: 5 }}>
    {children}
  </svg>
);

export const Icono: React.FC<{ nombre: string; size?: number; color?: string }> = ({ nombre, size, color = "#FF4D5A" }) => {
  switch (nombre) {
    case "caja":
      return (
        <S size={size}>
          <path d="M3 7l9-4 9 4v10l-9 4-9-4z" fill="#C8955A" stroke="#6b4325" strokeWidth="1.5" />
          <path d="M3 7l9 4 9-4M12 11v10" stroke="#6b4325" strokeWidth="1.5" fill="none" />
        </S>
      );
    case "llave":
      return (
        <S size={size}>
          <circle cx="7" cy="12" r="4.5" fill="none" stroke="#FFD166" strokeWidth="2.5" />
          <path d="M11 12h10M17 12v4M20 12v3" stroke="#FFD166" strokeWidth="2.5" />
        </S>
      );
    case "foco":
      return (
        <S size={size}>
          <path d="M12 2a7 7 0 0 0-4 12.7V18h8v-3.3A7 7 0 0 0 12 2z" fill="#FFE27A" stroke="#c9a227" strokeWidth="1.2" />
          <rect x="8.5" y="19" width="7" height="3" rx="1" fill="#999" />
        </S>
      );
    case "ticket":
      return (
        <S size={size}>
          <path d="M5 2h14v20l-2.3-1.5L14.3 22 12 20.5 9.7 22l-2.4-1.5L5 22z" fill="#fff" stroke="#bbb" />
          <path d="M8 7h8M8 11h8M8 15h5" stroke="#888" strokeWidth="1.5" />
        </S>
      );
    case "mic":
      return (
        <S size={size}>
          <rect x="8" y="2" width="8" height="13" rx="4" fill="#1A1200" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" stroke="#1A1200" strokeWidth="2" fill="none" />
        </S>
      );
    case "punto":
      return (
        <S size={size}>
          <circle cx="12" cy="12" r="7" fill={color} />
        </S>
      );
    default:
      return null;
  }
};
