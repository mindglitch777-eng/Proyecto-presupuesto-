import React from "react";
import { BODY, DISP } from "../lib/fuentes";
import { C } from "../v8/iconos";
import { latido, sp } from "../v8/comun";

// Piezas 2D comunes de la prueba piloto. Lienzo lógico 360 × 640. Zona segura: x 24–300 (a la derecha van los botones), y 70–470.

export const SUB_TOP = 418; // subtítulos más arriba que la franja de botones y descripción de TikTok / Reels

/** Etiqueta "EJEMPLO" (todos los montos de ejemplo la llevan). */
export const Ejemplo: React.FC<{ top: number; left?: number; right?: number; size?: number }> = ({ top, left = 0, right = 0, size = 12 }) => (
  <div style={{ left, right, top, textAlign: "center" }}>
    <span style={{ position: "static", display: "inline-block", padding: "2px 8px", borderRadius: 6, background: C.ambar, color: C.tinta, font: `800 ${size}px ${BODY}`, letterSpacing: ".1em" }}>EJEMPLO</span>
  </div>
);

/** Número grande con su etiqueta EJEMPLO debajo. */
export const Monto: React.FC<{ t: number; desde: number; texto: string; top: number; color?: string; size?: number; sub?: string }> = ({ t, desde, texto, top, color = "#fff", size = 54, sub }) => {
  if (t < desde - 0.05) return null;
  const s = sp(t - desde, 1.1, 18, 0.45);
  return (
    <>
      <div style={{ left: 0, right: 0, top, textAlign: "center", transform: `scale(${s * latido(t, 0.6, 0.03)})`, opacity: Math.min(1, s * 1.5) }}>
        <span style={{ position: "static", font: `800 ${size}px/1 ${DISP}`, color, letterSpacing: "-.03em", textShadow: "0 4px 18px #000c", whiteSpace: "nowrap" }}>{texto}</span>
      </div>
      <Ejemplo top={top + size * 1.02} />
      {sub ? <div style={{ left: 24, right: 24, top: top + size * 1.02 + 22, textAlign: "center", font: `700 16px ${BODY}`, color: "#fff", textShadow: "0 2px 8px #000" }}>{sub}</div> : null}
    </>
  );
};

/** Frase en pantalla (pastilla), en una o dos líneas. */
export const Frase: React.FC<{ t: number; desde: number; lineas: string[]; top: number; fondo?: string; color?: string; size?: number }> = ({ t, desde, lineas, top, fondo = C.rojo, color = "#fff", size = 24 }) => {
  if (t < desde - 0.05) return null;
  const s = Math.min(1.05, sp(t - desde, 1.08, 18, 0.45));
  return (
    <div style={{ left: 20, right: 20, top, textAlign: "center", transform: `scale(${s}) rotate(-1.5deg)`, opacity: Math.min(1, s * 1.5) }}>
      <span style={{ position: "static", display: "inline-block", padding: "6px 14px", borderRadius: 12, background: fondo, color, font: `800 ${size}px/1.12 ${DISP}`, boxShadow: `0 5px 0 ${C.tinta}` }}>
        {lineas.map((l, i) => <React.Fragment key={i}>{i ? <br /> : null}{l}</React.Fragment>)}
      </span>
    </div>
  );
};

/** Oferta fija del cierre (sin contador de cupos ni fecha límite). */
export const Oferta: React.FC<{ t: number; desde: number; top?: number }> = ({ t, desde, top = 74 }) => {
  if (t < desde - 0.05) return null;
  const s = sp(t - desde, 1.05, 15, 0.5);
  return (
    <div style={{ left: 24, right: 24, top, padding: "12px 12px 14px", borderRadius: 18, background: "#0e3b2af2", border: `2px solid ${C.ambar}`, boxShadow: "0 10px 30px #000a", textAlign: "center", opacity: Math.min(1, s * 1.4), transform: `scale(${0.9 + 0.1 * s})` }}>
      <div style={{ position: "static", font: `800 15px ${BODY}`, color: C.ambar, letterSpacing: ".08em" }}>PRIMEROS 100 KIOSCOS</div>
      <div style={{ position: "static", font: `800 34px/1.05 ${DISP}`, color: "#fff", marginTop: 4 }}>$12.900 por mes</div>
      <div style={{ position: "static", font: `800 19px ${DISP}`, color: "#fff" }}>para siempre</div>
      <div style={{ position: "static", font: `600 13px ${BODY}`, color: "#ffffffcc", marginTop: 6 }}>Después, $19.900 por mes · 14 días gratis · link en el perfil</div>
    </div>
  );
};
