import React from "react";
import { I, bounce, eIO, eOut, win } from "../lib/anim";
import { SLAM, persAt } from "../lib/estado";
import { DISP } from "../lib/fuentes";
import type { Guion } from "../lib/guion";
import { Kiosco } from "../components/Kiosco";

// Escena 1 (0 – 2,6 s): dominó de persianas. Tres kioscos cierran de golpe y la mira apunta al tuyo.

/** El primer golpe arranca un poquito antes del cuadro 0: el primer cuadro ya muestra la persiana cayendo. */
const golpe = (i: number) => (i === 0 ? -0.06 : SLAM[i]);

export const Calle: React.FC<{ t: number; g: Guion; hs: number }> = ({ t, g, hs }) => {
  if (t >= 2.08) return null;
  const zk = I(t, 1.55, 2.05, 0, 1, eIO);
  return (
    <div
      style={{
        left: 0, top: 200, width: 720, height: 880, transformOrigin: "0 0",
        transform: `translate(${-360 * zk + hs}px,${-440 * zk + hs * 0.6}px) scale(${0.5 + 0.5 * zk})`,
        filter: `blur(${Math.sin(Math.PI * zk) * 5}px)`,
      }}
    >
      {[0, 1, 2, 3].map((i) => {
        let pers: number, luz: number, tubo = 1, cartel = { opacidad: 0, giro: 0 };
        if (i < 3) {
          const a = golpe(i);
          pers = I(t, a, a + 0.22, 0, 1, bounce);
          const off = t > a + 0.1;
          luz = off ? 0.15 : 1;
          tubo = off ? 0.1 : 1;
          if (t > a + 0.15) cartel = { opacidad: 1, giro: Math.exp(-2 * (t - a)) * Math.sin((t - a) * 8) * 25 };
        } else {
          pers = persAt(t, g) + (Math.max(0, Math.sin(t * 40)) * (t > 1.15 ? 3 : 0)) / 250;
          luz = 1;
        }
        return (
          <div key={i} style={{ left: (i % 2) * 360, top: i > 1 ? 440 : 0, width: 360, height: 440 }}>
            <Kiosco t={t + i} persiana={pers} luz={luz} productosQueFaltan={0} cartelCerrado={cartel} tubo={{ opacidad: tubo, brilla: tubo > 0.5 }} neon={luz > 0.6 ? 1 : 0} />
          </div>
        );
      })}
    </div>
  );
};

export const TextoGancho: React.FC<{ t: number; g: Guion; gancho: number; hs: number }> = ({ t, g, gancho, hs }) => {
  if (t > 2.6) return null;
  const L = g.ganchos[gancho].lineas;
  return (
    <div style={{ left: 16, right: 16, top: 64, height: 150 }}>
      {L.map((l, i) => {
        const a = i === 2 ? SLAM[2] + 0.4 : golpe(i);
        const q = I(t, a, a + 0.13, 0, 1, eOut);
        const gl = i === 2 && t > a && t < a + 0.35;
        const size = Math.min(i === 2 ? 50 : 36, Math.floor(328 / (l.length * 0.62)));
        return (
          <div
            key={i}
            style={{
              left: 0, right: 0, top: i === 2 ? 82 : i * 40, font: `700 ${size}px/1 ${DISP}`, letterSpacing: "-.02em",
              color: i === 2 ? "#FF2D3B" : "#fff", transformOrigin: "0 50%", whiteSpace: "nowrap",
              opacity: (t > a ? 1 : 0) * win(t, -1, 2.55, 0.01, 0.25),
              transform: `translate(${hs * 0.5}px,0) scale(${2.8 - 1.8 * q}) skewX(${gl ? Math.sin(t * 90) * 12 : 0}deg)`,
              filter: `blur(${(1 - q) * 6}px)`,
              textShadow: gl ? `${Math.sin(t * 70) * 6}px 0 #00E5FF,0 4px 0 #000` : "0 4px 0 #000,0 0 30px #000",
            }}
          >
            {l}
          </div>
        );
      })}
    </div>
  );
};

export const Mira: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, 1.15, 1.6, 0.02, 0.12);
  if (o <= 0) return null;
  const s = I(t, 1.15, 1.35, 0, 1, eOut);
  const R = "#FF2D3B";
  return (
    <div style={{ left: 200, top: 460, width: 140, height: 140, opacity: o, transform: `scale(${2.4 - 1.4 * s}) rotate(${(1 - s) * -90}deg)` }}>
      <div style={{ inset: 0, borderRadius: "50%", border: `3px dashed ${R}`, transform: `rotate(${t * 200}deg)` }} />
      <div style={{ inset: 18, borderRadius: "50%", border: `3px solid ${R}`, boxShadow: `0 0 18px ${R}` }} />
      <div style={{ left: 68, top: -14, width: 4, height: 40, background: R }} />
      <div style={{ left: 68, bottom: -14, width: 4, height: 40, background: R }} />
      <div style={{ top: 68, left: -14, height: 4, width: 40, background: R }} />
      <div style={{ top: 68, right: -14, height: 4, width: 40, background: R }} />
      <div style={{ left: 64, top: 64, width: 12, height: 12, borderRadius: "50%", background: R }} />
      <div style={{ left: 34, top: 146, padding: "3px 10px", borderRadius: 6, background: R, font: `700 13px ${DISP}`, letterSpacing: ".1em", color: "#fff" }}>EL TUYO</div>
    </div>
  );
};

export const Polvo: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ inset: 0, pointerEvents: "none" }}>
    {Array.from({ length: 26 }, (_, i) => {
      const a = golpe(i % 3), d = t - a;
      if (!(d > 0 && d < 0.7)) return null;
      const col = i % 3, x = (col % 2) * 180 + 20 + ((i * 53) % 150);
      return (
        <i
          key={i}
          style={{
            width: 6, height: 6, borderRadius: "50%", background: "#cfc4b0", opacity: (1 - d / 0.7) * 0.8,
            transform: `translate(${x + Math.cos(i) * d * 120}px,${(col > 1 ? 420 : 200) + 190 - d * (60 + (i % 5) * 20) + d * d * 160}px) scale(${1 + d * 2})`,
          }}
        />
      );
    })}
  </div>
);
