import React from "react";
import { I, eIO, spring, win } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { TextoCinetico } from "./Dolor";

// Escenas 10 y 11: el precio al lado de la pérdida, y el cierre con la persiana arriba.

export const TarjetaPrecio: React.FC<{ t: number }> = ({ t }) => {
  if (t < 26.2 || t > 29.7) return null;
  const sl = spring(t - 26.35, 15, 0.35);
  const spc = spring(t - 27.2, 12, 0.5);
  const sa = spring(t - 28);
  const sb = spring(t - 28.5, 16, 0.4);
  const gl = t > 26.35 && t < 26.65;
  return (
    <>
      <div style={{ left: 20, right: 20, top: 70, opacity: win(t, 26.3, 29.6, 0.05, 0.25), transform: `scale(${0.5 + 0.5 * sl})`, transformOrigin: "0 0" }}>
        <div style={{ position: "static", font: `800 12px ${BODY}`, color: "#ffffffaa", letterSpacing: ".1em" }}>LO QUE PERDÉS POR MES SIN SABERLO</div>
        <div style={{ position: "static", font: `700 58px/1.05 ${DISP}`, color: "#FF4D5A", fontVariantNumeric: "tabular-nums", textShadow: gl ? `${Math.sin(t * 70) * 6}px 0 #00E5FF, 0 4px 0 #000` : "0 4px 0 #000" }}>
          −{ars(I(t, 26.4, 27.1, 0, 45000))}
        </div>
      </div>
      <div
        style={{
          left: 30, right: 30, top: 250, padding: "20px 16px", borderRadius: 22, color: "#fff",
          background: "linear-gradient(160deg,#ffffff2a,#ffffff0a)", border: "1px solid #ffffff44",
          boxShadow: "0 20px 50px #000a,inset 0 1px 0 #ffffff55", backdropFilter: "blur(12px)",
          opacity: win(t, 27.15, 29.6, 0.05, 0.25), transform: `translateY(${(1 - spc) * 120}px) scale(${0.85 + 0.15 * spc}) rotateX(${(1 - spc) * 30}deg)`,
        }}
      >
        <div style={{ position: "static", font: `800 12px ${BODY}`, color: "#ffffffbb", letterSpacing: ".1em" }}>EN CLARO CUESTA</div>
        <div style={{ position: "static", display: "flex", alignItems: "flex-end", gap: 8 }}>
          <span style={{ position: "static", font: `700 76px/1 ${DISP}`, color: "#FFB703", fontVariantNumeric: "tabular-nums" }}>{ars(I(t, 27.3, 27.9, 0, 430))}</span>
          <span style={{ position: "static", font: `800 18px ${BODY}`, paddingBottom: 10 }}>por día</span>
        </div>
        <div style={{ position: "static", display: "flex", alignItems: "center", gap: 12, marginTop: 10, font: `800 16px ${BODY}`, opacity: Math.min(1, sa), transform: `translateX(${(1 - sa) * -30}px)` }}>
          <Alfajor s={sa} />
          Menos que un alfajor
        </div>
      </div>
      <div style={{ left: 60, right: 60, top: 462, padding: 11, borderRadius: 999, background: "#FFB703", color: "#1A1200", textAlign: "center", font: `900 15px ${BODY}`, opacity: win(t, 28.5, 29.6, 0.01, 0.25), transform: `scale(${sb})` }}>
        14 días gratis · sin tarjeta
      </div>
    </>
  );
};

/** Alfajor dibujado: dos tapas de chocolate con dulce de leche al medio. */
const Alfajor: React.FC<{ s: number }> = ({ s }) => (
  <span style={{ position: "relative", width: 60, height: 36, display: "inline-block", transform: `rotate(${(1 - s) * -30 - 6}deg)` }}>
    <i style={{ left: 0, right: 0, top: 18, height: 16, borderRadius: "50%", background: "#3d200c" }} />
    <i style={{ left: 3, right: 3, top: 14, height: 8, borderRadius: 4, background: "#f4e3c3" }} />
    <i style={{ left: 0, right: 0, top: 2, height: 16, borderRadius: "50%", background: "linear-gradient(#7a4520,#5a3216)", boxShadow: "inset 0 2px 0 #9a6034" }} />
    <i style={{ left: 14, top: 7, width: 22, height: 3, borderRadius: 2, background: "#ffffff30" }} />
  </span>
);

export const Cierre: React.FC<{ t: number }> = ({ t }) => {
  if (t < 29.5) return null;
  const sgl = spring(t - 29.6, 12, 0.45);
  const sct2 = spring(t - 30.6);
  return (
    <>
      <div style={{ left: 20, top: 64, display: "flex", alignItems: "center", gap: 10, opacity: win(t, 29.55, 33, 0.05, 0.01), transform: `scale(${0.5 + 0.5 * sgl})`, transformOrigin: "0 50%" }}>
        <div style={{ position: "relative", width: 44, height: 44, borderRadius: 12, background: "#FFB703", boxShadow: "0 0 30px #FFB70366" }}>
          <div style={{ left: 10, right: 10, top: 15, height: 4, borderRadius: 3, background: "#06140D" }} />
          <div style={{ left: 10, right: 17, top: 24, height: 4, borderRadius: 3, background: "#06140D" }} />
        </div>
        <div style={{ position: "static", font: `700 38px/1 ${DISP}`, letterSpacing: "-.02em", color: "#fff" }}>En Claro</div>
      </div>
      <TextoCinetico t={t} desde={30.1} paso={0.14} texto="Dejá de adivinar." amarillas={[2]} style={{ left: 20, right: 20, top: 114, font: `700 30px ${DISP}`, color: "#fff" }} />
      <div style={{ left: 40, right: 40, top: 496, padding: 12, borderRadius: 999, background: "#FFB703", textAlign: "center", font: `900 15px ${BODY}`, color: "#1A1200", overflow: "hidden", boxShadow: "0 10px 30px #FFB70355", opacity: win(t, 30.5, 33, 0.05, 0.01), transform: `scale(${0.8 + 0.2 * sct2})` }}>
        <span style={{ position: "static" }}>Probalo gratis · link en el perfil</span>
        <i style={{ top: 0, bottom: 0, width: 40, background: "linear-gradient(90deg,transparent,#ffffffaa,transparent)", left: I(t, 31, 31.8, -50, 300, eIO) }} />
      </div>
    </>
  );
};
