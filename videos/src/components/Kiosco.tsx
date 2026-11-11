import React from "react";
import { DISP, BODY, MARKER } from "../lib/fuentes";

// Ilustración vectorial del kiosco, en el lienzo lógico de 360 × 440 del animatic.
// Todas las props salen del tiempo: el que lo usa decide cuánto baja la persiana, cuánta luz hay, etc.

export type KioscoProps = {
  /** 0 = persiana arriba, 1 = cerrada del todo */
  persiana: number;
  /** 0 = apagado, 1 = luz cálida plena */
  luz: number;
  /** cuántos productos de la góndola faltan (0 a 21) */
  productosQueFaltan: number;
  /** opacidad y giro (grados) del cartel de CERRADO */
  cartelCerrado?: { opacidad: number; giro: number };
  /** opacidad del tubo fluorescente (parpadeo) y si brilla */
  tubo?: { opacidad: number; brilla: boolean };
  /** "$833/hora" en aerosol sobre la persiana */
  aerosol?: { opacidad: number; escala: number; glitch: number; texto: string; sufijo: string };
  /** tiempo para las motas de polvo en la luz */
  t: number;
  /** el cartel de arriba prendido con neón */
  neon?: number;
  /** cartel de neón "ABIERTO" dentro de la vidriera (final) */
  abierto?: number;
};

const COLS = ["#E63946", "#FFB703", "#2A9D8F", "#F4A261", "#8E44AD", "#3A86FF", "#FB5607", "#06D6A0", "#C1121F", "#FFD166"];
const ORDER = [20, 6, 13, 2, 17, 9, 15, 0, 11, 4, 19, 7, 14, 1, 18, 10, 5, 12, 3, 16, 8];

const Gondola: React.FC<{ faltan: number }> = ({ faltan }) => {
  const els: React.ReactNode[] = [];
  for (let s = 0; s < 3; s++) {
    const y = 70 + s * 76;
    els.push(
      <div key={"e" + s} style={{ left: 0, right: 0, top: y, height: 6, background: "linear-gradient(#8a5a33,#5a3519)", boxShadow: "0 3px 4px #0008" }} />,
    );
    for (let i = 0; i < 7; i++) {
      const idx = s * 7 + i;
      const h = 26 + ((i * 7 + s * 3) % 4) * 8;
      const c = COLS[(i + s * 3) % COLS.length];
      const k = ORDER.indexOf(idx);
      if (k < faltan) continue;
      const frasco = (i + s) % 3 === 0;
      els.push(
        <div
          key={idx}
          style={{
            left: 4 + i * 28,
            top: y - h,
            width: 22,
            height: h,
            background: `linear-gradient(90deg, ${c} 0 70%, color-mix(in srgb, ${c} 70%, #000) 70%)`,
            borderRadius: frasco ? "8px 8px 2px 2px" : "3px 3px 1px 1px",
          }}
        >
          <div style={{ left: 3, right: 3, top: h * 0.38, height: Math.max(6, h * 0.22), background: "#fff8", borderRadius: 1 }} />
          <div style={{ left: 3, top: 2, width: 3, height: h - 6, background: "#ffffff33", borderRadius: 2 }} />
        </div>,
      );
    }
  }
  return <>{els}</>;
};

const Heladera: React.FC<{ luz: number }> = ({ luz }) => {
  const b: React.ReactNode[] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      b.push(
        <div
          key={r * 4 + c}
          style={{
            left: 4 + c * 18,
            top: 6 + r * 46,
            width: 12,
            height: 38,
            borderRadius: "5px 5px 2px 2px",
            background: (r + c) % 2 ? "linear-gradient(90deg,#2a2a2a,#0d0d0d)" : "linear-gradient(90deg,#a01818,#5e0909)",
          }}
        >
          <div style={{ left: 2, right: 2, top: 14, height: 7, background: (r + c) % 2 ? "#c8102e" : "#fff", opacity: 0.85 }} />
        </div>,
      );
  return (
    <div style={{ left: 216, top: 10, width: 86, height: 226, borderRadius: 6, background: "#B5121B", boxShadow: "0 0 0 3px #7d0b12", filter: `brightness(${0.5 + 0.5 * luz})` }}>
      <div style={{ left: 6, right: 6, top: 6, height: 22, display: "grid", placeItems: "center", font: `700 13px ${DISP}`, color: "#fff", fontStyle: "italic" }}>Bebidas</div>
      <div style={{ left: 6, right: 6, top: 32, bottom: 8, borderRadius: 4, background: `linear-gradient(#d6f2ff,#9fd8f5)`, overflow: "hidden", boxShadow: `0 0 ${18 * luz}px #bfe9ff inset` }}>
        {b}
        <div style={{ left: -20, top: 0, width: 30, height: 300, background: "#ffffff55", transform: "rotate(18deg)" }} />
      </div>
    </div>
  );
};

export const Kiosco: React.FC<KioscoProps> = ({ persiana, luz, productosQueFaltan, cartelCerrado, tubo, aerosol, t, neon, abierto = 0 }) => {
  const signOn = neon ?? (luz > 0.6 ? 1 : 0);
  const tb = tubo ?? { opacidad: 1, brilla: true };
  const pH = persiana * 250;
  return (
    <>
      {/* cartel */}
      <div
        style={{
          left: 40, right: 40, top: 0, height: 34, background: "linear-gradient(#222,#111)", borderRadius: "6px 6px 0 0",
          display: "grid", placeItems: "center", font: `700 17px ${DISP}`, letterSpacing: ".14em",
          color: signOn > 0.5 ? "#FFB703" : "#5a4a20",
          textShadow: signOn > 0.5 ? `0 0 ${12 * signOn}px #FFB703, 0 0 ${24 * signOn}px #FFB70399` : "none",
        }}
      >
        <span style={{ position: "static" }}>KIOSCO · ALMACÉN</span>
      </div>
      {/* toldo rayado */}
      <div style={{ left: 0, right: 0, top: 34, height: 40, background: "repeating-linear-gradient(90deg,#1B7A43 0 26px,#F2F2EA 26px 52px)", boxShadow: "0 6px 10px #0006" }}>
        <div style={{ inset: 0, background: "linear-gradient(#ffffff22,transparent 40%,#00000033)" }} />
      </div>
      <div style={{ left: 0, right: 0, top: 72, height: 12, background: "radial-gradient(circle at 13px 0,#1B7A43 12px,transparent 13px) 0 0/52px 12px,radial-gradient(circle at 39px 0,#F2F2EA 12px,transparent 13px) 0 0/52px 12px" }} />
      {/* pared */}
      <div style={{ left: 0, right: 0, top: 84, height: 356, background: "#B9A586", backgroundImage: "repeating-linear-gradient(#B9A586 0 18px,#A8937A 18px 19px)" }}>
        <div style={{ inset: 0, background: "linear-gradient(90deg,#0003,transparent 20%,transparent 80%,#0003)" }} />
      </div>
      {/* tubo fluorescente */}
      <div style={{ left: 70, right: 70, top: 86, height: 5, borderRadius: 3, background: "#fff", opacity: tb.opacidad, boxShadow: tb.brilla ? "0 0 16px #fff,0 0 4px #fff" : "none" }} />
      {/* vidriera */}
      <div style={{ left: 22, top: 96, width: 316, height: 250, background: "#120f0c", border: "5px solid #3b3b3b", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ inset: 0, background: "radial-gradient(circle at 40% 20%,#ffcf7a66,transparent 70%)", opacity: luz }} />
        {/* motas de polvo en la luz */}
        {Array.from({ length: 14 }, (_, i) => {
          const x = (i * 47) % 300, y = 240 - ((t * 12 + i * 31) % 240);
          return <i key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#ffe8b0", opacity: luz * 0.7, transform: `translate(${x + Math.sin(t + i) * 8}px,${y}px)` }} />;
        })}
        <div style={{ left: 8, top: 0, width: 200, height: 240, filter: `brightness(${0.55 + 0.45 * luz})` }}>
          <Gondola faltan={productosQueFaltan} />
        </div>
        <Heladera luz={luz} />
        {abierto > 0 ? (
          <div style={{ left: 64, top: 8, width: 92, height: 30, borderRadius: 8, border: "2px solid #5FD39A", display: "grid", placeItems: "center", font: `700 16px ${DISP}`, letterSpacing: ".12em", color: "#d9ffe9", opacity: abierto, boxShadow: "0 0 14px #5FD39A, inset 0 0 10px #5FD39A", textShadow: "0 0 8px #5FD39A, 0 0 16px #5FD39A" }}>
            <span style={{ position: "static" }}>ABIERTO</span>
          </div>
        ) : null}
        {/* reflejo del vidrio */}
        <div style={{ left: -60, top: -40, width: 70, height: 360, background: "linear-gradient(90deg,transparent,#ffffff14,transparent)", transform: "rotate(22deg)" }} />
        {/* persiana */}
        <div
          style={{
            left: 0, right: 0, top: 0, height: pH,
            background: "repeating-linear-gradient(#a3aaaf 0 3px,#9aa1a6 3px 9px,#6c7378 9px 12px)",
            boxShadow: "0 6px 12px #000a",
          }}
        >
          <div style={{ inset: 0, background: "linear-gradient(90deg,#0004,transparent 15%,#fff1 50%,transparent 85%,#0004)" }} />
          <div style={{ left: 0, right: 0, bottom: 0, height: 10, background: "linear-gradient(#666,#3d3d3d)" }}>
            <div style={{ left: 146, top: 2, width: 14, height: 6, borderRadius: 2, background: "#222" }} />
          </div>
          {aerosol && aerosol.opacidad > 0 ? (
            <div
              style={{
                left: 0, right: 0, top: "38%", textAlign: "center", font: `400 62px/1 ${MARKER}`, color: "#FF2D3B",
                opacity: aerosol.opacidad, transform: `rotate(-6deg) scale(${aerosol.escala})`,
                textShadow: aerosol.glitch ? `${aerosol.glitch}px 0 #00E5FF, 0 2px 0 #7a0010` : "0 2px 0 #7a0010",
              }}
            >
              <span style={{ position: "static" }}>{aerosol.texto}</span>
              <span style={{ position: "static", fontSize: 28, color: "#fff" }}>{aerosol.sufijo}</span>
            </div>
          ) : null}
          {cartelCerrado && cartelCerrado.opacidad > 0 ? (
            <div
              style={{
                left: 108, bottom: 6, width: 90, height: 44, background: "#fff", color: "#C1121F", border: "3px solid #C1121F", borderRadius: 4,
                display: "grid", placeItems: "center", font: `700 15px ${DISP}`, transformOrigin: "50% -12px",
                opacity: cartelCerrado.opacidad, transform: `rotate(${cartelCerrado.giro}deg)`, boxShadow: "0 6px 10px #0008",
              }}
            >
              <span style={{ position: "static", letterSpacing: ".04em" }}>CERRADO</span>
              <i style={{ left: 20, top: -16, width: 2, height: 18, background: "#333", transform: "rotate(-30deg)" }} />
              <i style={{ left: 64, top: -16, width: 2, height: 18, background: "#333", transform: "rotate(30deg)" }} />
            </div>
          ) : null}
        </div>
      </div>
      {/* mostrador */}
      <div style={{ left: 8, right: 8, top: 346, height: 52, background: "linear-gradient(#8a5a33,#6b4325)", borderRadius: 4, boxShadow: "0 -3px 0 #a87347 inset" }} />
      <div style={{ left: 60, top: 334, width: 62, height: 22, background: "#2C4A8C", borderRadius: 3, transform: "rotate(-6deg)", boxShadow: "0 3px 4px #0007" }}>
        <span style={{ position: "static", display: "block", font: `700 7px/22px ${BODY}`, textAlign: "center", color: "#fff" }}>FIADOS</span>
      </div>
      <div style={{ left: 240, top: 316, width: 76, height: 40, background: "#3a3a3a", borderRadius: "6px 6px 2px 2px" }}>
        <div style={{ left: 8, right: 8, top: 6, height: 12, background: "#8fd18f", borderRadius: 2, boxShadow: `0 0 ${6 * luz}px #8fd18f` }} />
      </div>
      {/* vereda */}
      <div style={{ left: 0, right: 0, top: 398, height: 42, background: "repeating-linear-gradient(90deg,#8d8d8d 0 40px,#777 40px 41px)" }}>
        <div style={{ inset: 0, background: `linear-gradient(#ffcf7a${Math.round(40 * luz).toString(16).padStart(2, "0")},transparent)` }} />
      </div>
    </>
  );
};
