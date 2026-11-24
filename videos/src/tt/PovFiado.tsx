import React from "react";
import { Html5Audio, OffthreadVideo, Sequence, getStaticFiles, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { guionSchema } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Celular, Marco, camaraBeats, temblor, type Cam2D } from "../v6/comun";
import { entra, latido, sp } from "../v8/comun";
import { C } from "../v8/iconos";

// TT-03 "POV: te piden fiado" (videos/guiones/TT-03-POV-FIADO.md). Formato POV de humor (el más fuerte del nicho kiosco),
// todo 2D, con DOS voces de Gemini en frases cortas (cliente: Puck, kiosquero: Orus; guiones/dialogos/tt-03.json). Paciencia tipo videojuego que baja con cada excusa,
// crítico en el remate, giro al cuaderno de fiados y la app 2 s. Todo sale de t (render repartido).

export const DUR_TT03 = 24;
const g = guionSchema.parse({ id: "tt-03-pov-fiado", titulo: "POV: te piden fiado", duracionSeg: DUR_TT03, voz: null, ganchos: [{ lineas: ["", "", ""], voz: "" }], lineas: [], sonidos: [] });

const K = { e1: 1.6, e2: 4.8, e3: 8.0, rem: 11.2, rehook: 14.6, cuad: 16.2, app: 20.4, cierre: 22.4, LOOP: DUR_TT03 - 0.27 };
/** Voces: [frase, segundo]. c = cliente, k = kiosquero (vos). */
const VOCES: [string, number][] = [["c1", K.e1 + 0.1], ["k1", K.e1 + 1.45], ["c2", K.e2 + 0.1], ["k2", K.e2 + 1.45], ["c3", K.e3 + 0.1], ["k3", K.e3 + 1.45], ["c4", K.rem + 0.1], ["k4", K.rem + 1.5], ["c5", K.cierre + 0.15]];
const ROJO = "#ff3b30";
const AMARILLO = "#ffcc00";
const VERDE = "#34c759";

/** Golpes de paciencia: [segundo, valor que queda, daño, crítico]. */
const GOLPES: [number, number, string, boolean][] = [
  [K.e1 + 2.3, 80, "-20", false],
  [K.e2 + 2.3, 60, "-20", false],
  [K.e3 + 2.3, 40, "-20", false],
  [K.rem + 2.4, 5, "-35 CRÍTICO", true],
];
function paciencia(t: number) {
  let v = 100, fant = 100;
  for (const [a, queda] of GOLPES) {
    const antes = v;
    if (t >= a) { v = antes + (queda - antes) * entra((t - a) / 0.18); fant = antes + (queda - antes) * entra((t - a - 0.45) / 0.35); }
  }
  return { v, fant: Math.max(v, fant) };
}

// ---------- fondo: el kiosco visto desde atrás del mostrador ----------
const Kiosco: React.FC<{ t: number; puerta: number; rojo?: number }> = ({ t, puerta, rojo = 0 }) => {
  const prods = ["#ff6b6b", "#ffd93d", "#6bcB77", "#4d96ff", "#ff922b", "#cc5de8", "#20c997", "#f06595"];
  return (
    <div style={{ inset: 0 }}>
      <div style={{ inset: 0, background: "linear-gradient(#fff1d6, #ffd9a0)" }} />
      {/* estantes con golosinas a los costados */}
      {[0, 1].map((lado) => (
        <div key={lado} style={{ left: lado ? 262 : -2, top: 120, width: 100, height: 340, transform: `translateX(${Math.sin(t * 0.7) * 2}px)` }}>
          {[0, 1, 2, 3, 4].map((f) => (
            <div key={f} style={{ left: 0, right: 0, top: f * 68, height: 68 }}>
              <div style={{ left: 0, right: 0, bottom: 0, height: 6, background: "#8a5a32" }} />
              {[0, 1, 2, 3].map((i) => {
                const c = prods[(f * 3 + i + lado * 2) % prods.length];
                return <div key={i} style={{ left: 6 + i * 23, bottom: 6, width: 19, height: 30 + ((f + i) % 3) * 8, borderRadius: 4, background: c, border: "2px solid #0002" }} />;
              })}
            </div>
          ))}
        </div>
      ))}
      {/* puerta de vidrio con el cartel ABIERTO */}
      <div style={{ left: 110, top: 110, width: 140, height: 330, background: "#2b3a46", borderRadius: 6 }}>
        <div style={{ left: 8, top: 8, right: 8, bottom: 8, background: "linear-gradient(160deg, #cfe9ff, #8fc3ec)" }} />
        <div style={{ left: 8, top: 8, width: 124, height: 314, transformOrigin: "0 50%", transform: `perspective(400px) rotateY(${-70 * puerta}deg)`, background: "linear-gradient(160deg, #e6f4ffdd, #a8d4f5cc)", border: "4px solid #2b3a46", boxSizing: "border-box" }}>
          <div style={{ left: 22, top: 40, width: 72, height: 22, borderRadius: 4, background: "#ff3b30", font: `900 12px/22px ${BODY}`, color: "#fff", textAlign: "center" }}>ABIERTO</div>
        </div>
      </div>
      {/* campanita */}
      <div style={{ left: 170, top: 92, transform: `rotate(${Math.sin(t * 30) * 25 * Math.exp(-3 * t) * (t < 1.5 ? 1 : 0)}deg)`, transformOrigin: "50% 0" }}>
        <svg width="20" height="22" viewBox="0 0 20 22"><path d="M10 2 Q2 4 3 16 L17 16 Q18 4 10 2Z" fill="#f5c542" stroke="#7a5a00" strokeWidth="1.5" /><circle cx="10" cy="18" r="2.5" fill="#7a5a00" /></svg>
      </div>
      {rojo > 0 ? <div style={{ inset: 0, background: ROJO, opacity: rojo * 0.35, mixBlendMode: "multiply" }} /> : null}
    </div>
  );
};

/** El mostrador en primer plano (sos vos, del otro lado). `grieta` 0..1 lo raja. */
const Mostrador: React.FC<{ t: number; grieta: number }> = ({ t, grieta }) => (
  <div style={{ left: -10, top: 470, width: 380, height: 180 }}>
    <div style={{ inset: 0, background: "linear-gradient(#a0623a, #6e3f22)", borderTop: "8px solid #c98a5a" }} />
    {/* frascos de caramelos */}
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ left: 18 + i * 120, top: -46, width: 46, height: 54, borderRadius: "10px 10px 14px 14px", background: "#ffffff88", border: "3px solid #ffffffcc", transform: `translateY(${Math.sin(t * 2 + i) * 1}px)` }}>
        {[0, 1, 2, 3, 4].map((j) => <div key={j} style={{ left: 6 + (j % 3) * 11, top: 18 + Math.floor(j / 3) * 13, width: 10, height: 10, borderRadius: 5, background: ["#ff6b6b", "#ffd93d", "#4d96ff", "#6bcB77", "#cc5de8"][(i + j) % 5] }} />)}
      </div>
    ))}
    {/* tus manos (POV): se aprietan a medida que baja la paciencia */}
    {[0, 1].map((i) => {
      const enojo = (100 - paciencia(t).v) / 100;
      const tiembla = enojo > 0.5 ? Math.sin(t * 40 + i) * enojo * 2 : 0;
      return (
        <svg key={i} width="130" height="110" viewBox="0 0 130 110" style={{ left: i ? 222 : 38, top: 40 + tiembla, transform: `scaleX(${i ? -1 : 1})` }}>
          <path d="M0 110 L10 60 Q20 40 50 38 L100 34 Q118 34 118 46 Q118 56 102 58 L70 60" fill="#e0a67f" stroke="#5a3520" strokeWidth="5" strokeLinejoin="round" />
          {[0, 1, 2, 3].map((j) => <rect key={j} x={56 + j * 15} y={30 - enojo * 6 + j * 2} width="14" height={28 + enojo * 8} rx="7" fill="#e6b08c" stroke="#5a3520" strokeWidth="4" />)}
          {enojo > 0.5 ? <path d="M30 70 L36 64 M40 78 L46 72" stroke="#c0392b" strokeWidth="3" /> : null}
        </svg>
      );
    })}
    {grieta > 0 ? (
      <svg width="380" height="180" viewBox="0 0 380 180" style={{ left: 0, top: 0 }}>
        <path d={`M190 0 L176 ${30 * grieta} L198 ${60 * grieta} L170 ${100 * grieta} L190 ${140 * grieta}`} stroke="#1b0d05" strokeWidth="4" fill="none" />
        <path d={`M176 ${30 * grieta} L${176 - 60 * grieta} ${44 * grieta}`} stroke="#1b0d05" strokeWidth="3" fill="none" />
        <path d={`M198 ${60 * grieta} L${198 + 70 * grieta} ${70 * grieta}`} stroke="#1b0d05" strokeWidth="3" fill="none" />
      </svg>
    ) : null}
  </div>
);

type Cara = "canchero" | "sonrisa" | "puchero" | "nada";
/** El cliente (personaje genérico de dibujo). `celu` 0..1 levanta el celular nuevo. */
const Cliente: React.FC<{ t: number; cara: Cara; celu?: number; bolsa?: boolean }> = ({ t, cara, celu = 0, bolsa = false }) => {
  const parpadeo = Math.sin(t * 2.3) > 0.97 ? 0.2 : 1;
  const ojos = cara === "puchero" ? 1.25 : 1;
  const boca = cara === "sonrisa" ? "M78 108 Q100 128 122 108" : cara === "puchero" ? "M84 116 Q100 104 116 116" : cara === "canchero" ? "M80 112 Q104 122 124 106" : "M86 112 L114 112";
  return (
    <svg width="200" height="320" viewBox="0 0 200 320" style={{ overflow: "visible" }}>
      {/* cuerpo con buzo */}
      <path d="M30 320 Q34 190 100 176 Q166 190 170 320 Z" fill="#3b6fd8" stroke="#1d3a78" strokeWidth="5" />
      <path d="M80 182 Q100 214 120 182" fill="none" stroke="#1d3a78" strokeWidth="4" />
      {/* brazo con el celular */}
      <g transform={`rotate(${-150 * celu} 160 220)`}>
        <rect x="150" y="210" width="26" height="80" rx="13" fill="#3b6fd8" stroke="#1d3a78" strokeWidth="4" />
        {celu > 0.05 ? (
          <g transform="translate(146 284)">
            <rect x="0" y="0" width="38" height="64" rx="7" fill="#111" stroke="#e8e8e8" strokeWidth="2.5" />
            <rect x="4" y="5" width="30" height="54" rx="4" fill={`hsl(${(t * 240) % 360} 85% 60%)`} />
            <circle cx="11" cy="10" r="3.5" fill="#333" stroke="#999" />
          </g>
        ) : null}
      </g>
      {bolsa ? <g transform="translate(10 240)"><rect x="0" y="0" width="44" height="54" rx="6" fill="#fff" stroke="#999" strokeWidth="3" /><rect x="6" y="-12" width="14" height="20" rx="3" fill="#ff6b6b" /><rect x="22" y="-16" width="14" height="24" rx="3" fill="#ffd93d" /></g> : null}
      {/* cabeza */}
      <circle cx="100" cy="92" r="52" fill="#e6b08c" stroke="#5a3520" strokeWidth="5" />
      <path d="M48 80 Q52 34 100 34 Q150 34 152 78 L152 70 Q104 58 48 72 Z" fill="#222" />
      <path d="M44 74 Q100 54 168 70 L172 80 Q100 66 44 84 Z" fill="#222" />
      <ellipse cx="80" cy="92" rx={7 * ojos} ry={9 * ojos * parpadeo} fill="#1b1b1b" />
      <ellipse cx="120" cy="92" rx={7 * ojos} ry={9 * ojos * parpadeo} fill="#1b1b1b" />
      {cara === "puchero" ? <><circle cx="82" cy="89" r="2.5" fill="#fff" /><circle cx="122" cy="89" r="2.5" fill="#fff" /></> : null}
      {cara === "canchero" ? <path d="M70 78 L90 82 M110 82 L130 76" stroke="#1b1b1b" strokeWidth="4" strokeLinecap="round" /> : null}
      <path d={boca} stroke="#5a2410" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
};

/** Globo de diálogo que aparece con resorte y se escribe letra por letra. */
const Globo: React.FC<{ t: number; desde: number; hasta: number; texto: string; top?: number }> = ({ t, desde, hasta, texto, top = 128 }) => {
  if (t < desde || t > hasta) return null;
  const s = sp(t - desde, 1.12, 18, 0.45);
  const n = Math.min(texto.length, Math.floor((t - desde - 0.08) * 34));
  const sale = clamp((hasta - t) / 0.12, 0, 1);
  return (
    <div style={{ left: 22, right: 22, top, transform: `scale(${s * (0.9 + 0.1 * sale)}) rotate(${-2 + Math.sin(t * 3) * 0.8}deg)`, opacity: sale, transformOrigin: "50% 100%" }}>
      <div style={{ position: "relative", padding: "12px 14px", borderRadius: 22, background: "#fff", border: `4px solid ${C.tinta}`, boxShadow: `0 6px 0 ${C.tinta}`, textAlign: "center", font: `900 23px/1.15 ${DISP}`, color: C.tinta, minHeight: 60 }}>
        <span style={{ position: "static" }}>{texto.slice(0, Math.max(0, n))}</span>
        <span style={{ position: "static", opacity: 0 }}>{texto.slice(Math.max(0, n))}</span>
      </div>
      <svg width="40" height="26" viewBox="0 0 40 26" style={{ left: 150, top: "100%", marginTop: -4 }}><path d="M0 0 L40 0 L18 26 Z" fill="#fff" stroke={C.tinta} strokeWidth="4" /><rect x="3" y="-3" width="34" height="7" fill="#fff" /></svg>
    </div>
  );
};

/** Lo que contestás vos (el kiosquero): globo oscuro abajo, sobre el mostrador. */
const GloboVos: React.FC<{ t: number; desde: number; hasta: number; texto: string }> = ({ t, desde, hasta, texto }) => {
  if (t < desde || t > hasta) return null;
  const s = sp(t - desde, 1.14, 18, 0.45);
  const sale = clamp((hasta - t) / 0.12, 0, 1);
  return (
    <div style={{ left: 40, right: 40, top: 400, textAlign: "center", transform: `scale(${s * (0.9 + 0.1 * sale)}) rotate(${2 + Math.sin(t * 3) * 0.8}deg)`, opacity: sale }}>
      <span style={{ position: "static", display: "inline-block", padding: "9px 14px", borderRadius: 18, background: C.tinta, border: `3px solid ${AMARILLO}`, boxShadow: "0 5px 0 #000", font: `900 21px/1.15 ${DISP}`, color: "#fff" }}>
        <span style={{ position: "static", color: AMARILLO, font: `900 13px ${BODY}`, letterSpacing: ".1em", marginRight: 8 }}>VOS:</span>{texto}
      </span>
    </div>
  );
};

/** Barra de paciencia tipo videojuego (con la barra "fantasma" blanca que baja después). */
const Paciencia: React.FC<{ t: number }> = ({ t }) => {
  const { v, fant } = paciencia(t);
  const col = v > 55 ? VERDE : v > 25 ? AMARILLO : ROJO;
  const titila = v < 10 ? (Math.sin(t * 22) > 0 ? 1 : 0.45) : 1;
  const golpe = GOLPES.reduce((s, [a, , , crit]) => s + (t >= a ? Math.exp(-9 * (t - a)) * Math.sin((t - a) * 50) * (crit ? 10 : 5) : 0), 0);
  return (
    <div style={{ left: 18, right: 18, top: 50, height: 46, transform: `translateX(${golpe}px)` }}>
      <div style={{ left: 0, top: 0, font: `900 13px ${BODY}`, color: "#fff", letterSpacing: ".1em", textShadow: "0 2px 0 #000" }}>PACIENCIA DEL KIOSQUERO</div>
      <div style={{ right: 0, top: -2, font: `900 16px ${DISP}`, color: col, textShadow: "0 2px 0 #000" }}>{Math.round(v)}%</div>
      <div style={{ left: 0, right: 0, top: 20, height: 22, borderRadius: 11, background: "#1b1b1b", border: "3px solid #fff", overflow: "hidden", boxShadow: "0 4px 0 #000a" }}>
        <div style={{ left: 0, top: 0, bottom: 0, width: `${fant}%`, background: "#fff" }} />
        <div style={{ left: 0, top: 0, bottom: 0, width: `${v}%`, background: `linear-gradient(${col}, ${col}bb)`, opacity: titila }} />
        <div style={{ left: 0, right: 0, top: 2, height: 5, background: "#ffffff55" }} />
      </div>
    </div>
  );
};

/** Número de daño que salta y cae (como en un juego). */
const Danio: React.FC<{ t: number }> = ({ t }) => (
  <>
    {GOLPES.map(([a, , txt, crit], i) => {
      const d = t - a;
      if (d < 0 || d > 1.1) return null;
      const s = d < 0.1 ? 0.4 + d * 10 : 1 + Math.exp(-8 * (d - 0.1)) * 0.2;
      return (
        <div key={i} style={{ left: 0, right: 0, top: 104 + d * 40 - Math.sin(Math.min(1, d * 3) * Math.PI) * 26, textAlign: "center", opacity: Math.min(1, (1.1 - d) * 4), transform: `scale(${s}) rotate(${crit ? -6 : 4}deg)` }}>
          <span style={{ position: "static", font: `900 ${crit ? 44 : 36}px ${DISP}`, color: crit ? AMARILLO : ROJO, WebkitTextStroke: "3px #000", textShadow: "0 5px 0 #000" }}>{txt}</span>
        </div>
      );
    })}
  </>
);

/** Rayos de "impacto" detrás del cliente en cada golpe. */
const Impacto: React.FC<{ t: number }> = ({ t }) => {
  const g0 = GOLPES.find(([a]) => t >= a && t < a + 0.35);
  if (!g0) return null;
  const d = (t - g0[0]) / 0.35;
  return (
    <svg width="360" height="640" viewBox="0 0 360 640" style={{ left: 0, top: 0, opacity: 1 - d }}>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const r0 = 60 + d * 80, r1 = 200 + d * 160;
        return <line key={i} x1={180 + Math.cos(a) * r0} y1={330 + Math.sin(a) * r0} x2={180 + Math.cos(a) * r1} y2={330 + Math.sin(a) * r1} stroke={g0[3] ? AMARILLO : "#fff"} strokeWidth={g0[3] ? 7 : 4} strokeLinecap="round" />;
      })}
    </svg>
  );
};

// ---------- utilería de cada excusa ----------
const Calendario: React.FC<{ t: number }> = ({ t }) => {
  const d = t - (K.e1 + 0.5);
  if (d < 0 || t > K.e2) return null;
  const vuelta = Math.min(3, Math.floor(d / 0.35));
  const fase = (d % 0.35) / 0.35;
  const dias = ["VIE 7", "VIE 14", "VIE 21", "VIE 28"];
  return (
    <div style={{ left: 236, top: 300, width: 96, height: 104, transform: `rotate(8deg) scale(${sp(d, 1.1)})` }}>
      <div style={{ inset: 0, borderRadius: 10, background: "#fff", border: `4px solid ${C.tinta}`, boxShadow: "0 5px 0 #0006" }} />
      <div style={{ left: 0, right: 0, top: 0, height: 26, borderRadius: "8px 8px 0 0", background: ROJO, font: `900 13px/26px ${BODY}`, color: "#fff", textAlign: "center" }}>VIERNES</div>
      <div style={{ left: 0, right: 0, top: 34, textAlign: "center", font: `900 26px ${DISP}`, color: C.tinta, transform: `scaleY(${vuelta < 3 ? Math.abs(Math.cos(fase * Math.PI)) : 1})` }}>{dias[vuelta]}</div>
      {vuelta >= 3 ? <div style={{ left: 8, top: 20, font: `900 64px/1 ${DISP}`, color: ROJO, transform: `scale(${sp(d - 1.05, 1.2)})` }}>✗</div> : null}
    </div>
  );
};

const LaVieja: React.FC<{ t: number }> = ({ t }) => {
  const d = t - (K.e2 + 0.45);
  if (d < 0 || t > K.e3) return null;
  return (
    <div style={{ left: 232, top: 296, width: 100, height: 120, transform: `rotate(-6deg) scale(${sp(d, 1.1)})` }}>
      <div style={{ inset: 0, background: "#c9a227", borderRadius: 8, boxShadow: "0 5px 0 #0006" }} />
      <div style={{ left: 8, top: 8, right: 8, bottom: 8, background: "#f3e6c8", overflow: "hidden" }}>
        <svg width="84" height="104" viewBox="0 0 84 104"><circle cx="42" cy="40" r="22" fill="#e6b08c" /><circle cx="42" cy="22" r="20" fill="#ddd" /><circle cx="32" cy="40" r="5" fill="none" stroke="#333" strokeWidth="2" /><circle cx="52" cy="40" r="5" fill="none" stroke="#333" strokeWidth="2" /><path d="M10 104 Q14 66 42 64 Q70 66 74 104Z" fill="#9b59b6" /></svg>
      </div>
      {[0, 1, 2].map((i) => {
        const k = ((d * 0.9 + i * 0.33) % 1);
        return <div key={i} style={{ left: 20 + i * 26, top: -10 - k * 60, opacity: 1 - k, font: `900 20px ${BODY}`, color: "#ff4d6d" }}>♥</div>;
      })}
    </div>
  );
};

const SinCambio: React.FC<{ t: number }> = ({ t }) => {
  const d = t - (K.e3 + 0.45);
  if (d < 0 || t > K.rem) return null;
  return (
    <div style={{ left: 218, top: 312, width: 120, height: 60, transform: `rotate(${-8 + Math.sin(t * 9) * 6}deg) scale(${sp(d, 1.12)})` }}>
      <div style={{ inset: 0, borderRadius: 6, background: "#a8d5a2", border: `3px solid ${C.tinta}`, boxShadow: "0 5px 0 #0006" }} />
      <div style={{ left: 0, right: 0, top: 14, textAlign: "center", font: `900 24px ${DISP}`, color: "#1e5631" }}>$20.000</div>
      {d > 0.9 ? <div style={{ left: -20, top: 64, width: 160, textAlign: "center", font: `900 15px ${BODY}`, color: "#fff", background: ROJO, borderRadius: 6, padding: "3px 0", transform: `scale(${sp(d - 0.9, 1.15)})` }}>¿Y LA GASEOSA DE $1.500?</div> : null}
    </div>
  );
};

/** Destellos alrededor del celular nuevo. */
const Brillos: React.FC<{ t: number; x: number; y: number }> = ({ t, x, y }) => (
  <>
    {Array.from({ length: 7 }, (_, i) => {
      const a = i * 0.9 + t * 1.5;
      const r = 40 + (i % 3) * 18;
      const s = 0.5 + 0.5 * Math.abs(Math.sin(t * 5 + i));
      return <div key={i} style={{ left: x + Math.cos(a) * r - 9, top: y + Math.sin(a) * r - 9, transform: `scale(${s}) rotate(${t * 90}deg)`, font: `900 18px ${BODY}`, color: "#fff7b0", textShadow: "0 0 8px #ffe066" }}>✦</div>;
    })}
  </>
);

// ---------- cuaderno de fiados ----------
const DEUDAS: [string, number][] = [
  ["Juan (el del 3°)", 48000], ["la vecina", 35500], ["Carlos", 62000], ["el de la moto", 27000],
  ["Marta", 41500], ["el sobrino de Marta", 18000], ["'el viernes cobro'", 56000], ["la profe", 23000], ["Rubén", 69000],
];
const TOTAL = DEUDAS.reduce((s, [, m]) => s + m, 0); // 380.000
const fmt = (v: number) => "$" + Math.round(v).toLocaleString("es-AR");

const Cuaderno: React.FC<{ t: number }> = ({ t }) => {
  const d = t - K.cuad;
  const caida = d < 0.22 ? 1.7 - (d / 0.22) * 0.7 : 1 + Math.exp(-10 * (d - 0.22)) * Math.sin((d - 0.22) * 40) * 0.04;
  const visibles = Math.min(DEUDAS.length, Math.floor((d - 0.35) / 0.2) + 1);
  const suma = DEUDAS.slice(0, Math.max(0, visibles)).reduce((s, [, m]) => s + m, 0);
  return (
    <>
      <div style={{ inset: 0, background: "radial-gradient(circle at 50% 50%, #5a3a22, #1c120a 80%)" }} />
      <div style={{ left: 24, top: 150, width: 312, height: 340, transform: `scale(${caida}) rotate(${-2 + Math.sin(t * 1.2) * 0.8}deg)` }}>
        <div style={{ inset: 0, borderRadius: 10, background: "#fdfbf3", boxShadow: "0 18px 30px #000c", backgroundImage: "repeating-linear-gradient(#fdfbf3 0 30px, #9cc3e6 30px 31px)" }} />
        <div style={{ left: 34, top: 0, bottom: 0, width: 2, background: "#ff8a8a" }} />
        <div style={{ left: 44, top: 6, font: `700 18px "Caveat", ${BODY}`, color: "#1a3d8f" }}>FIADOS</div>
        {DEUDAS.map(([n, m], i) => {
          if (i >= visibles) return null;
          const k = entra((d - 0.35 - i * 0.2) / 0.15);
          return (
            <div key={i} style={{ left: 44, right: 14, top: 33 + i * 31, height: 28, opacity: k, transform: `translateX(${(1 - k) * 30}px)`, font: `700 19px/28px "Caveat", ${BODY}`, color: "#1a3d8f" }}>
              <span style={{ position: "static" }}>{n}</span>
              <span style={{ position: "absolute", right: 0, color: "#c0392b" }}>{fmt(m)}</span>
            </div>
          );
        })}
      </div>
      <div style={{ left: 0, right: 0, top: 54, textAlign: "center" }}>
        <span style={{ position: "static", display: "inline-block", padding: "3px 14px", borderRadius: 8, background: C.tinta, color: AMARILLO, font: `900 15px ${BODY}`, letterSpacing: ".08em" }}>TOTAL FIADO</span>
      </div>
      <div style={{ left: 0, right: 0, top: 80, textAlign: "center", transform: `scale(${latido(t, 0.4, 0.04) * (visibles >= DEUDAS.length ? sp(d - 2.2, 1.15) : 1)})` }}>
        <span style={{ position: "static", font: `900 56px ${DISP}`, color: ROJO, WebkitTextStroke: "2px #000", textShadow: "0 5px 0 #000", fontVariantNumeric: "tabular-nums" }}>{fmt(suma)}</span>
      </div>
      {d > 2.6 ? (
        <div style={{ left: 0, right: 0, top: 504, textAlign: "center", transform: `scale(${sp(d - 2.6, 1.15)}) rotate(-3deg)` }}>
          <span style={{ position: "static", display: "inline-block", padding: "6px 14px", borderRadius: 10, background: AMARILLO, color: C.tinta, font: `900 21px/1.1 ${DISP}`, boxShadow: "0 5px 0 #000" }}>CASI UN MES DE ALQUILER…<br />ANOTADO EN BIROME</span>
        </div>
      ) : null}
    </>
  );
};

const App: React.FC<{ t: number }> = ({ t }) => {
  const { fps } = useVideoConfig();
  const s = sp(t - K.app + 0.1, 1.04, 13, 0.55);
  return (
    <>
      <div style={{ inset: 0, background: `radial-gradient(circle at 50% 45%, #1e6b46, ${C.verde} 70%)` }} />
      <Celular t={t} sp={s} left={85} top={150}>
        <Sequence from={Math.round(K.app * fps)} layout="none">
          <OffthreadVideo src={staticFile("tomas/v8-02/app.mp4")} playbackRate={1.6} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} />
        </Sequence>
      </Celular>
      <div style={{ left: 0, right: 0, top: 50, textAlign: "center", transform: `scale(${sp(t - K.app, 1.1)}) rotate(-2deg)` }}>
        <span style={{ position: "static", display: "inline-block", padding: "6px 14px", borderRadius: 10, background: AMARILLO, color: C.tinta, font: `900 22px/1.1 ${DISP}`, boxShadow: "0 5px 0 #000" }}>LA APP TE DICE<br />A QUIÉN COBRARLE</span>
      </div>
      {t > K.app + 0.9 ? <div style={{ left: 0, right: 0, top: 568, textAlign: "center", font: `900 16px ${BODY}`, color: "#fff", transform: `scale(${sp(t - K.app - 0.9, 1.1)})` }}>…y le manda el WhatsApp por vos</div> : null}
    </>
  );
};

// ---------- composición ----------
export const PovFiado: React.FC<VideoProps> = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const loop = t >= K.LOOP;
  const tw = loop ? 0 : t;
  const crit = GOLPES[3][0];
  const enKiosco = tw < K.rehook || tw >= K.cierre;
  const freeze = tw >= K.rehook && tw < K.cuad;

  // el cliente entra desde la puerta (cuadro 0 ya con la puerta abriéndose)
  const camina = entra(tw / 1.1);
  const cara: Cara = tw < K.e1 ? "sonrisa" : tw < K.e2 ? "canchero" : tw < K.e3 ? "puchero" : tw < K.rem ? "sonrisa" : "canchero";
  const celu = entra((tw - K.rem - 0.9) / 0.35);
  const saliendo = tw >= K.cierre ? entra((tw - K.cierre - 0.6) / 0.8) : 0;

  const beats = [0.02, 0.6, 1.1, K.e1, K.e1 + 0.6, ...GOLPES.map(([a]) => a), K.e2, K.e2 + 0.7, K.e3, K.e3 + 0.7, K.rem, K.rem + 0.6, K.rehook, K.cuad, K.cuad + 0.9, K.cuad + 1.6, K.cuad + 2.2, K.cuad + 2.6, K.cuad + 3.4, K.app, K.app + 0.9, K.cierre, K.cierre + 0.8, K.cierre + 1.2];
  const cam: Cam2D = freeze ? { z: 1.08, rot: -1.5, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : beats, loop ? [] : [K.cuad, K.app, K.cierre], 0.9);
  const hs = loop ? 0 : temblor(t, [[0.02, 8], ...GOLPES.map(([a, , , c]) => [a, c ? 22 : 10] as [number, number]), [K.rehook, 10], [K.cuad + 0.22, 14], [K.cuad + 2.2, 8]]);
  let wf = 0;
  if (!loop) [[0.02, 0.3], [crit, 0.5], [K.cuad + 0.22, 0.3], [K.app, 0.2]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });
  const red = !loop && t >= crit && t < crit + 0.5 ? 1 - (t - crit) / 0.5 : 0;

  // ---------- sonido ----------
  const tecleo = (desde: number, n: number) => Array.from({ length: Math.ceil(n / 3) }, (_, i) => ({ en: desde + 0.08 + i * (3 / 34), sfx: "tic", vol: 0.12 }));
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "ding", vol: 0.7 }, { en: 0.02, sfx: "whoosh", vol: 0.5 }, { en: 0.05, sfx: "thump", vol: 0.5 },
    ...tecleo(K.e1, 30), { en: K.e1 + 0.5, sfx: "papel", vol: 0.4 }, ...[0, 1, 2].map((i) => ({ en: K.e1 + 0.5 + i * 0.35, sfx: "hoja", vol: 0.35 })), { en: K.e1 + 2.3, sfx: "marcador", vol: 0.4 },
    ...tecleo(K.e2, 33), { en: K.e2 + 0.45, sfx: "ukelele", vol: 0.35 },
    ...tecleo(K.e3, 32), { en: K.e3 + 0.45, sfx: "papel", vol: 0.4 }, { en: K.e3 + 1.35, sfx: "caja", vol: 0.4 },
    ...tecleo(K.rem, 16), { en: K.rem + 0.9, sfx: "riser", vol: 0.45 }, { en: K.rem + 1.25, sfx: "ding", vol: 0.5 },
    ...GOLPES.map(([a, , , c]) => ({ en: a, sfx: c ? "vidrio" : "slam", vol: c ? 0.7 : 0.55 })), ...GOLPES.map(([a]) => ({ en: a + 0.02, sfx: "thump", vol: 0.6 })),
    { en: crit + 0.05, sfx: "glitch", vol: 0.5 }, ...[0.5, 0.9, 1.3].map((d) => ({ en: crit + d, sfx: "heart", vol: 0.45 })),
    { en: K.rehook, sfx: "rebobinado", vol: 0.55 }, { en: K.rehook + 0.3, sfx: "piano_grave", vol: 0.5 },
    { en: K.cuad + 0.2, sfx: "thump", vol: 0.8 }, { en: K.cuad + 0.22, sfx: "hoja", vol: 0.5 },
    ...DEUDAS.map((_, i) => ({ en: K.cuad + 0.35 + i * 0.2, sfx: i % 2 ? "birome" : "caja", vol: 0.35 })),
    { en: K.cuad + 2.2, sfx: "sello", vol: 0.6 }, { en: K.cuad + 2.6, sfx: "slam", vol: 0.45 },
    { en: K.app - 0.1, sfx: "whoosh", vol: 0.45 }, { en: K.app + 0.3, sfx: "click", vol: 0.45 }, { en: K.app + 1.1, sfx: "ding", vol: 0.5 },
    { en: K.cierre, sfx: "whoosh", vol: 0.4 }, ...tecleo(K.cierre + 0.2, 22), { en: K.cierre + 1.2, sfx: "ding", vol: 0.5 },
  ];
  const archivos = getStaticFiles().map((f) => f.name);
  const musica = (
    <>
      {VOCES.filter(([id]) => archivos.includes(`voces/tt-03/${id}.mp3`)).map(([id, en]) => (
        <Sequence key={id} from={Math.round(en * fps)} durationInFrames={Math.round(3 * fps)} layout="none">
          <Html5Audio src={staticFile(`voces/tt-03/${id}.mp3`)} volume={1} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={Math.round(K.rehook * fps)} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} loop volume={(f) => 0.11 * Math.min(1, Math.max(0, K.rehook * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(K.cuad * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(K.cuad * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} loop volume={(f) => 0.11 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // ---------- escena ----------
  let escena: React.ReactNode;
  if (enKiosco || freeze) {
    const tc = freeze ? K.rehook : tw; // congelado: queda el cuadro del golpe
    const x = 80 + (1 - camina) * 10 + saliendo * 260;
    const y = 160 + (1 - camina) * -20;
    const esc = 0.5 + 0.5 * camina - saliendo * 0.1;
    escena = (
      <>
        <Kiosco t={tc} puerta={tc < 1.3 ? Math.sin(Math.min(1, tc / 0.3) * Math.PI / 2) * (1 - entra((tc - 0.8) / 0.5)) : tw >= K.cierre ? entra((tw - K.cierre - 0.4) / 0.3) : 0} rojo={red} />
        <Impacto t={tc} />
        <div style={{ left: x, top: y, transformOrigin: "50% 100%", transform: `scale(${esc}) translateY(${Math.abs(Math.sin(tc * 7)) * -4 * (camina < 1 || saliendo > 0 ? 1 : 0.3)}px) rotate(${(tc > crit && tc < crit + 0.3 ? Math.sin(tc * 60) * 4 : 0)}deg)` }}>
          <Cliente t={tc} cara={tw >= K.cierre ? "sonrisa" : cara} celu={tw >= K.cierre ? 0 : celu} bolsa={tw >= K.cierre} />
        </div>
        {celu > 0.3 && tw < K.cierre ? <Brillos t={tc} x={265} y={300} /> : null}
        <Calendario t={tc} />
        <LaVieja t={tc} />
        <SinCambio t={tc} />
        <Mostrador t={tc} grieta={entra((tc - crit) / 0.12)} />
      </>
    );
  } else if (tw < K.app) escena = <Cuaderno t={tw} />;
  else escena = <App t={tw} />;

  // ---------- textos (máximo 2 a la vez) ----------
  const frente = (
    <>
      {enKiosco && tw < K.cierre ? <div style={{ left: 0, right: 0, top: 0, height: 110, background: "linear-gradient(#000c, #0000)" }} /> : null}
      {tw < K.e1 - 0.05 ? (
        <div style={{ left: 0, right: 0, top: 120, textAlign: "center", transform: `scale(${Math.min(1.1, sp(tw + 0.15, 1.12)) * latido(tw, 0.45, 0.04)}) rotate(-3deg)` }}>
          <span style={{ position: "static", display: "inline-block", padding: "8px 16px", borderRadius: 12, background: "#fff", color: C.tinta, font: `900 30px/1.05 ${DISP}`, boxShadow: `0 6px 0 ${C.tinta}` }}>POV: SOS KIOSQUERO<br /><span style={{ position: "static", color: ROJO }}>Y ENTRA ÉL</span></span>
        </div>
      ) : null}
      {enKiosco && tw < K.cierre && tw >= 0.35 ? <Paciencia t={tw} /> : null}
      {enKiosco && tw < K.cierre ? <Danio t={tw} /> : null}
      <Globo t={tw} desde={K.e1} hasta={K.e2 - 0.08} texto="Anotámelo, el viernes cobro" />
      <Globo t={tw} desde={K.e2} hasta={K.e3 - 0.08} texto="¡Si mi vieja te compraba!" />
      <Globo t={tw} desde={K.e3} hasta={K.rem - 0.08} texto="No tengo cambio, anotámelo" />
      <Globo t={tw} desde={K.rem} hasta={K.rehook - 0.05} texto="No tengo un peso…" />
      <GloboVos t={tw} desde={K.e1 + 1.45} hasta={K.e2 - 0.08} texto="¿Qué viernes?" />
      <GloboVos t={tw} desde={K.e2 + 1.45} hasta={K.e3 - 0.08} texto="Tu vieja también me debe." />
      <GloboVos t={tw} desde={K.e3 + 1.45} hasta={K.rem - 0.08} texto="Es una gaseosa, flaco." />
      <GloboVos t={tw} desde={K.rem + 1.5} hasta={K.rehook - 0.05} texto="¿Y ese celular?" />
      {freeze ? (
        <>
          <div style={{ inset: 0, background: "#000", opacity: 0.55 }} />
          <div style={{ left: 0, right: 0, top: 0, height: 70 * entra((tw - K.rehook) / 0.2), background: "#000" }} />
          <div style={{ left: 0, right: 0, bottom: 0, height: 70 * entra((tw - K.rehook) / 0.2), background: "#000" }} />
          <div style={{ left: 0, right: 0, top: 270, textAlign: "center", transform: `scale(${sp(tw - K.rehook - 0.1, 1.15)})` }}>
            <span style={{ position: "static", font: `900 36px/1.1 ${DISP}`, color: "#fff", textShadow: "0 4px 0 #000" }}>Y LO PEOR<br /><span style={{ position: "static", color: AMARILLO }}>NO ES ÉL…</span></span>
          </div>
          <div style={{ left: 16, top: 84, font: `900 16px ${BODY}`, color: "#fff", opacity: Math.sin(t * 10) > 0 ? 1 : 0.3 }}>❚❚ PAUSA</div>
        </>
      ) : null}
      {tw >= K.cierre ? (
        <>
          <Globo t={tw} desde={K.cierre + 0.15} hasta={K.cierre + 1.4} texto="¡El viernes te paso!" top={150} />
          {tw > K.cierre + 0.5 ? (
            <div style={{ left: 0, right: 0, top: 52, textAlign: "center", transform: `scale(${sp(tw - K.cierre - 0.5, 1.12) * latido(tw, 0.45, 0.04)}) rotate(-2deg)` }}>
              <span style={{ position: "static", display: "inline-block", padding: "6px 14px", borderRadius: 10, background: ROJO, color: "#fff", font: `900 22px/1.1 ${DISP}`, boxShadow: "0 5px 0 #000" }}>ETIQUETÁ AL KIOSQUERO<br />QUE TIENE UNO ASÍ ↓</span>
            </div>
          ) : null}
          <div style={{ left: 0, right: 0, top: 596, textAlign: "center", font: `800 13px ${BODY}`, color: "#fff", opacity: entra((tw - K.cierre - 0.8) / 0.3) }}>En Claro · link en el perfil</div>
        </>
      ) : null}
    </>
  );

  return (
    <Marco
      g={g} voz={null} pal={[]} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={loop ? sonidos.filter((s) => s.en < K.LOOP) : sonidos} ocultos={[]}
      fondo={escena}
      frente={frente}
      sobre={musica}
      filtro={freeze ? "saturate(0.25) contrast(1.1)" : undefined}
    />
  );
};
