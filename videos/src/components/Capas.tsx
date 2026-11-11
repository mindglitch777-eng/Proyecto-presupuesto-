import React from "react";
import { win } from "../lib/anim";

// Las tres capas de siempre: fondo que se mueve → contenido → grano, viñeta y destellos.

export const Fondo: React.FC<{ t: number }> = ({ t }) => {
  const bx = 50 + Math.sin(t * 0.5) * 20, by = 30 + Math.cos(t * 0.4) * 15;
  return <div style={{ inset: 0, background: `radial-gradient(circle at ${bx}% ${by}%, #1c4a31, #050f0a 72%)` }} />;
};

/** Grano animado: ruido distinto en cada cuadro (determinista por semilla). */
export const Grano: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={360} height={640} style={{ left: 0, top: 0, opacity: 0.09, mixBlendMode: "overlay", pointerEvents: "none" }}>
    <filter id="grano">
      <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves={2} seed={frame % 24} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grano)" />
  </svg>
);

export const Vineta: React.FC = () => (
  <div style={{ inset: 0, background: "radial-gradient(circle at 50% 45%,transparent 50%,#0009 100%)", pointerEvents: "none" }} />
);

/** Destello de luz cálida (transiciones), destello rojo (pérdida) y blanco (golpe). */
export const LuzDestello: React.FC<{ t: number; red: number; wf: number }> = ({ t, red, wf }) => {
  const lk = Math.max(win(t, 13.85, 14.6, 0.3, 0.45), win(t, 26.9, 27.6, 0.3, 0.4) * 0.8, win(t, 29.4, 30.3, 0.3, 0.5));
  return (
    <>
      {lk > 0 ? (
        <div style={{ inset: -40, pointerEvents: "none", mixBlendMode: "screen", opacity: lk, background: `radial-gradient(circle at ${40 + ((t * 3) % 30)}% 40%, #FFB703ee, #FF7A00aa 30%, transparent 65%)` }} />
      ) : null}
      <div style={{ inset: 0, background: "#FF4D5A", pointerEvents: "none", opacity: Math.min(0.28, red * 0.25) }} />
      <div style={{ inset: 0, background: "#fff", pointerEvents: "none", opacity: Math.min(0.6, wf) }} />
    </>
  );
};
