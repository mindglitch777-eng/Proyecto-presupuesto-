import React from "react";
import { I, eIn, eIO, eOut, lin, spring, win } from "../lib/anim";
import { BODY, DISP, MARKER } from "../lib/fuentes";
import { ars } from "../lib/formato";
import type { Guion } from "../lib/guion";
import { Kiosco } from "../components/Kiosco";
import { Icono } from "../components/Iconos";

// Escenas 2 a 5: la amenaza, la cuenta, la herida y el cuaderno. También el kiosco principal,
// que sigue de fondo hasta el final.

const FL = [[6.95, 7.3], [8.95, 9.45], [11.1, 11.4], [12.55, 12.85], [27, 27.2]];

export const KioscoPrincipal: React.FC<{ t: number; g: Guion; p: number; shake: number; lights: number }> = ({ t, g, p, shake, lights }) => {
  const kVis = Math.max(win(t, 2.05, 2.9, 0.01, 0.25), win(t, 4.9, 33, 0.2, 0.01));
  if (kVis <= 0) return null;
  const zoom = I(t, 12, 12.6, 0, 1, eIO) * (1 - I(t, 13.7, 14.2, 0, 1, eIO));
  const push = 1 + I(t, 0, 2.2, 0, 0.05, lin) + I(t, 5, 9.5, 0, 0.04, lin);
  const blurAmt = I(t, 13.9, 14.4, 0, 1) * (1 - I(t, 29.4, 29.9, 0, 1));
  const bright = t < 29.5 ? 1 - 0.45 * blurAmt - 0.2 * I(t, 5, 9.5, 0, 1) : 1;
  const fl = FL.some((w) => t > w[0] && t < w[1]) ? (Math.sin(t * 90) > 0 ? 1 : 0.05) : 1;
  const tubo = (t < 5 || t > 29.7 ? 1 : 0.35 + 0.65 * lights) * fl;
  const pesos = [6, 4, 3, 3];
  const gone = Math.round(g.cuenta.gastos.reduce((a, h, i) => a + (t > h[0] ? pesos[i] ?? 3 : 0), 0) * (1 - I(t, 29.7, 30.4, 0, 1)));
  const sw = t > 9.6 ? Math.exp(-1.2 * (t - 9.6)) * Math.sin((t - 9.6) * 7) * 22 : 0;
  const sp9 = spring(t - 9.9, 15, 0.4);
  return (
    <div
      style={{
        left: 0, top: 200, width: 360, height: 440, transformOrigin: "90px 370px", opacity: kVis,
        transform: `translateX(${shake}px) scale(${push * (1 + 1.3 * zoom)})`,
        filter: `blur(${blurAmt * 7}px) brightness(${bright})`,
      }}
    >
      <Kiosco
        t={t}
        persiana={p}
        luz={lights}
        productosQueFaltan={gone}
        tubo={{ opacidad: tubo, brilla: fl > 0.5 }}
        cartelCerrado={{ opacidad: win(t, 9.6, 30, 0.05, 0.3), giro: sw }}
        aerosol={{
          opacidad: win(t, 9.9, 13.9, 0.02, 0.3), escala: sp9, glitch: t > 9.9 && t < 10.3 ? Math.sin(t * 80) * 5 : 0,
          texto: ars(g.cuenta.por_hora), sufijo: "/hora",
        }}
        neon={t > 29.7 ? Math.min(1, (t - 29.7) * 4) * (t < 30.1 ? (Math.sin(t * 70) > 0 ? 1 : 0.2) : 1) : lights > 0.6 ? 1 : 0}
        abierto={t > 30.15 ? (t < 30.5 ? (Math.sin(t * 60) > 0 ? 1 : 0.15) : 1) : 0}
      />
    </div>
  );
};

/** Oscurecido arriba para que el texto se lea siempre. */
export const FundidoSuperior: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ left: 0, right: 0, top: 0, height: 250, background: "linear-gradient(#000e,#000a 60%,transparent)", opacity: t < 29.5 ? 1 : 1 - 0.5 * I(t, 29.5, 30.2, 0, 1) }} />
);

// ---------- Escena 2: 70 kiosquitos que se apagan ----------
const kOff = Array.from({ length: 70 }, (_, i) => 3.0 + (((i * 37) % 70) / 70) * 1.6);

export const GrillaDeCierres: React.FC<{ t: number; g: Guion }> = ({ t, g }) => {
  const o = win(t, 2.6, 5.05, 0.12, 0.2);
  if (o <= 0) return null;
  const off = kOff.filter((k) => t > k).length;
  const sg = spring(t - 2.7);
  const sq = spring(t - 4.1, 15, 0.4);
  return (
    <>
      <div style={{ left: 0, top: 0, width: 360, height: 640, background: "#07110c", opacity: o, transform: `scale(${1.08 - 0.08 * I(t, 2.6, 5, 0, 1, lin)})` }}>
        {kOff.map((k, i) => {
          const r = Math.floor(i / 8), c = i % 8, apagado = t > k;
          const ago = t - k;
          return (
            <div key={i} style={{ left: 14 + c * 42, top: 150 + r * 36, width: 36, height: 30, transform: apagado && ago < 0.12 ? `scale(${1 - ago})` : undefined }}>
              <div style={{ left: 0, right: 0, top: 0, height: 9, background: "repeating-linear-gradient(90deg,#1B7A43 0 6px,#F2F2EA 6px 12px)", opacity: apagado ? 0.45 : 1 }} />
              <div style={{ left: 4, right: 4, top: 11, bottom: 0, borderRadius: 2, background: apagado ? "#2a2a2a" : "#ffcf7a", boxShadow: apagado ? "none" : "0 0 8px #ffcf7a88" }}>
                {apagado ? <div style={{ left: 0, right: 0, top: 0, height: `${Math.min(1, ago * 8) * 100}%`, background: "repeating-linear-gradient(#5d6469 0 2px,#3d4246 2px 3px)" }} /> : null}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ left: 20, right: 20, top: 66, font: `700 30px/1.05 ${DISP}`, color: "#fff", opacity: win(t, 2.6, 5.05, 0.05, 0.2), transform: `translateY(${(1 - sg) * 20}px)` }}>
        Cierran hasta <span style={{ position: "static", color: "#FF4D5A" }}>70</span> kioscos por día
      </div>
      <div style={{ left: 20, top: 134, font: `800 11px ${BODY}`, letterSpacing: ".1em", color: "#FF4D5A", opacity: win(t, 2.95, 5.05, 0.1, 0.2), fontVariantNumeric: "tabular-nums" }}>
        CERRADOS HOY: {off}
      </div>
      <div style={{ right: 20, top: 135, font: `600 9px ${BODY}`, color: "#ffffffaa", opacity: win(t, 2.8, 5.05, 0.2, 0.2) }}>{g.fuente}</div>
      <div style={{ left: 20, right: 20, top: 470, textAlign: "center", font: `700 34px ${DISP}`, color: "#FFB703", opacity: win(t, 4.1, 5.05, 0.01, 0.2), transform: `scale(${sq})`, textShadow: "0 4px 0 #000, 0 0 24px #000" }}>
        ¿El tuyo es el próximo?
      </div>
    </>
  );
};

// ---------- Escena 3: la cuenta ----------
export const RestaEnCascada: React.FC<{ t: number; g: Guion; p: number; shake: number }> = ({ t, g, p, shake }) => {
  if (t < 4.6 || t > 9.7) return null;
  const hits = g.cuenta.gastos;
  let v = I(t, 5, 5.8, 0, g.cuenta.vendes);
  hits.forEach((h) => (v -= I(t, h[0] + 0.25, h[0] + 0.55, 0, h[1])));
  const s3 = spring(t - 4.95);
  // el número tiembla y se pone rojo cada vez que muerde un gasto
  const bite = hits.some((h) => t > h[0] + 0.2 && t < h[0] + 0.6);
  return (
    <>
      <div style={{ left: 20, top: 66, font: `800 12px ${BODY}`, letterSpacing: ".1em", color: "#ffffffaa", opacity: win(t, 4.95, 8.6, 0.1, 0.2) }}>VENDÉS POR MES</div>
      <div
        style={{
          left: 16, top: 86, font: `700 54px/1 ${DISP}`, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums", transformOrigin: "0 50%",
          opacity: win(t, 4.95, 9.6, 0.05, 0.25), transform: `translateX(${shake * 0.6}px) scale(${0.5 + 0.5 * s3})`,
          color: t > 8.6 ? "#FFB703" : bite ? "#FF8A93" : "#fff", textShadow: "0 4px 0 #000",
        }}
      >
        {ars(v)}
      </div>
      <div style={{ left: 20, top: 150, font: `800 14px ${BODY}`, color: "#FFB703", opacity: win(t, 8.6, 9.6, 0.1, 0.2) }}>te quedan</div>
      {hits.map((h, i) => {
        const a = h[0];
        const fly = I(t, a, a + 0.45, 0, 1, eIn);
        const x = I(t, a - 0.35, a, -180, 24, eOut) + fly * 60;
        const y = I(t, a - 0.35, a, 200, 170 + i * 4, eOut) + fly * (260 + p * 80);
        const o = win(t, a - 0.35, a + 0.5, 0.1, 0.15);
        if (o <= 0) return null;
        return (
          <div
            key={i}
            style={{
              left: 0, top: 0, padding: "7px 11px", borderRadius: 12, background: "#1a0b0d", border: "1.5px solid #FF4D5A", font: `800 14px ${BODY}`,
              whiteSpace: "nowrap", boxShadow: "0 10px 20px #000a", color: "#fff", opacity: o,
              transform: `translate(${x}px,${y}px) rotate(${-6 + fly * 20}deg) scale(${1 - 0.4 * fly})`,
            }}
          >
            <Icono nombre={h[3]} />
            {h[2]} <span style={{ position: "static", color: "#FF4D5A" }}>−{ars(h[1])}</span>
          </div>
        );
      })}
    </>
  );
};

export const Ejemplo: React.FC<{ t: number }> = ({ t }) => {
  const o = Math.max(win(t, 4.95, 13.9), win(t, 26.3, 29.5));
  if (o <= 0) return null;
  return (
    <div style={{ right: t > 20 ? undefined : 16, left: t > 20 ? 20 : undefined, top: t > 20 ? 146 : 70, font: `600 10px ${BODY}`, letterSpacing: ".1em", textTransform: "uppercase", color: "#ffffff88", border: "1px solid #ffffff44", borderRadius: 5, padding: "2px 6px", opacity: o }}>
      ejemplo
    </div>
  );
};

// ---------- Escena 4: la herida ----------
export const Herida: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, 9.5, 12.05, 0.02, 0.25);
  if (o <= 0) return null;
  const sh = spring(t - 9.55, 15, 0.4);
  const sh2 = spring(t - 10.5, 15, 0.4);
  return (
    <div style={{ left: 20, right: 20, top: 70, font: `700 30px/1.05 ${DISP}`, color: "#fff", opacity: o, transform: `translateY(${(1 - sh) * 24}px)` }}>
      <span style={{ position: "static" }}>14 horas por día.</span>
      <br />
      <span style={{ position: "relative", display: "inline-block", color: "#FF4D5A", opacity: Math.min(1, sh2), transform: `scale(${0.6 + 0.4 * sh2})`, transformOrigin: "0 50%" }}>Para esto.</span>
    </div>
  );
};

// ---------- Escena 5: el cuaderno ----------
export const TextoCinetico: React.FC<{ t: number; desde: number; texto: string; amarillas: number[]; paso?: number; style: React.CSSProperties }> = ({ t, desde, texto, amarillas, paso = 0.1, style }) => (
  <div style={style}>
    {texto.split(" ").map((w, i) => {
      const s = spring(t - desde - i * paso);
      return (
        <span key={i} style={{ position: "relative", display: "inline-block", marginRight: 8, color: amarillas.includes(i) ? "#FFB703" : undefined, opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 28}px)` }}>
          {w}
        </span>
      );
    })}
  </div>
);

export const Cuaderno: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, 12, 14.1, 0.01, 0.25);
  if (o <= 0) return null;
  const sn = spring(t - 12.2);
  const close = I(t, 13.2, 13.55, 0, 1, eIn);
  const sx = 1 - 2 * close;
  return (
    <>
      <TextoCinetico t={t} desde={12.1} texto="Y tu cuaderno nunca te lo dijo." amarillas={[2]} style={{ left: 20, right: 20, top: 70, font: `700 32px/1.05 ${DISP}`, color: "#fff", opacity: o }} />
      <div style={{ left: 70, top: 250, width: 220, height: 170, opacity: win(t, 12.1, 14.1, 0.05, 0.25), transform: `scale(${(0.5 + 0.5 * sn) * I(t, 13.7, 14.1, 1, 0.6)}) rotate(${-5 + close * 5}deg)` }}>
        <div style={{ left: 0, top: 0, width: 110, height: 170, background: "#F4EBD3", borderRadius: "6px 0 0 6px", backgroundImage: "repeating-linear-gradient(#F4EBD3 0 17px,#9FB6D6 17px 18px)", boxShadow: "0 20px 40px #000a" }}>
          <div style={{ left: 8, top: 6, font: `400 13px/18px ${MARKER}`, color: "#2C3E70", whiteSpace: "pre" }}>
            {"FIADOS\nMarta   18.000\nJuan     7.500\nRosa    12.300\nGaseos  ¿?\nLuz     ..."}
          </div>
          <div style={{ left: 60, top: 82, width: 40, height: 3, background: "#C1121F", transform: "rotate(-8deg)", opacity: 0.8 }} />
        </div>
        <div
          style={{
            left: 110, top: 0, width: 110, height: 170, borderRadius: "0 6px 6px 0", transformOrigin: "0 50%", transform: `scaleX(${sx})`,
            background: sx > 0 ? "#F4EBD3" : "#2C4A8C",
            backgroundImage: sx > 0 ? "repeating-linear-gradient(#F4EBD3 0 17px,#9FB6D6 17px 18px)" : "none",
            boxShadow: "0 20px 40px #000a",
          }}
        >
          {sx > 0 ? <div style={{ left: 10, top: 6, font: `400 12px/18px ${MARKER}`, color: "#2C3E70", whiteSpace: "pre", transform: "rotate(2deg)" }}>{"¿Cuánto\ngané hoy?\n\n¿?¿?"}</div> : null}
        </div>
        <div style={{ left: 105, top: 6, width: 10, height: 158, background: "repeating-linear-gradient(#444 0 4px,transparent 4px 10px)" }} />
      </div>
    </>
  );
};
