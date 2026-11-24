import React from "react";
import { Html5Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { GUION_TT_02, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { BotonProbalo, Celular, Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { Billetes, Cartel, Etiqueta, Numero, Rotulo, entra, latido, ritmo, sp } from "../v8/comun";
import { C } from "../v8/iconos";

// TT-02 "¿Dónde está la plata?" (videos/guiones/TT-02-DONDE-ESTA-LA-PLATA.md). Todo 2D: tablero de detective de corcho,
// polaroids, hilos rojos, sellos, lupa y espejo. Historia recreada, montos de ejemplo. Todo sale de t (render repartido).

const g = GUION_TT_02;
const ROJO = "#ff3b30";
const VERDE = "#22c55e";
/** Segundo del golpe del gancho: el cajón se abre de un portazo y está VACÍO. */
const SLAM = 1.25;

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e, dur,
    alquiler: w(0, "alquiler", e[0] - 0.6),
    tres: w(1, "tres", l[1] + 1.4),
    tercero: w(2, "tercero", l[2] + 0.4),
    cuaderno: w(3, "cuaderno", l[3] + 0.5), pago: w(3, "pago", l[3] + 1.6), ochenta: w(3, "ochenta", e[3] - 0.6),
    proveedor: w(4, "proveedor", l[4] + 0.5), siete: w(4, "siete", l[4] + 1.6), viejo: w(4, "viejo", e[4] - 0.4),
    peor: w(5, "peor", l[5] + 0.5),
    mano: w(6, "mano", l[6] + 0.2), casa: w(6, "casa", l[6] + 3.5), pongo: w(6, "pongo", e[6] - 0.4),
    ella: w(7, "ella", e[7] - 0.3),
    vos: w(8, "vos", l[8] + 0.3), semana: w(8, "semana", e[8] - 0.4),
    contarle: w(9, "contarle", l[9] + 2.0), celular: w(9, "celular", e[9] - 0.5),
    LOOP: dur - 0.27,
  };
}
type T = ReturnType<typeof tiempos>;

// ---------- piezas dibujadas ----------

/** Caja registradora vista de frente con el cajón abierto `o` (0..1) y `billetes` billetes adentro. */
const Cajon: React.FC<{ w: number; o: number; billetes: number; t: number; pantalla?: string; colorPantalla?: string }> = ({ w, o, billetes, t, pantalla, colorPantalla = "#7cf2a8" }) => (
  <svg width={w} height={w * 0.8} viewBox="0 0 300 240" style={{ overflow: "visible" }}>
    <rect x="40" y="10" width="220" height="110" rx="14" fill="#2b2f2c" stroke="#0b0d0c" strokeWidth="5" />
    <rect x="70" y="26" width="160" height="40" rx="6" fill="#103d26" stroke="#0b0d0c" strokeWidth="4" />
    <text x="150" y="56" textAnchor="middle" fill={colorPantalla} style={{ font: `800 26px ${DISP}` }}>{pantalla ?? (billetes > 0 ? "$ ---" : "$ 0")}</text>
    {[0, 1, 2, 3].map((i) => <rect key={i} x={78 + i * 38} y="78" width="28" height="22" rx="5" fill="#cfd5d1" stroke="#0b0d0c" strokeWidth="3" />)}
    {/* cajón */}
    <g transform={`translate(0 ${o * 62})`}>
      <rect x="22" y="112" width="256" height="78" rx="8" fill="#3a3f3b" stroke="#0b0d0c" strokeWidth="5" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={34 + i * 48} y="120" width="40" height="52" rx="4" fill="#161a18" />
          {i < billetes ? <rect x={37 + i * 48} y={124 + Math.sin(t * 3 + i) * 0.6} width="34" height="44" rx="3" fill="#7cc79a" stroke="#0b0d0c" strokeWidth="2" /> : null}
        </g>
      ))}
    </g>
  </svg>
);

/** Brazo con la mano (con anillo dorado) que entra desde la derecha. p: 0 afuera → 0,45 adentro → 1 afuera con billete. */
const Mano: React.FC<{ w: number; p: number; billete: boolean; anillo?: number }> = ({ w, p, billete, anillo = 1 }) => {
  const adentro = p < 0.45 ? entra(p / 0.45) : 1 - entra((p - 0.45) / 0.55);
  const x = 260 - adentro * 190;
  const y = 150 - adentro * 10;
  return (
    <svg width={w} height={w * 0.8} viewBox="0 0 300 240" style={{ overflow: "visible" }}>
      <g transform={`translate(${x} ${y}) rotate(${-8 + adentro * 6})`}>
        <rect x="40" y="-14" width="240" height="40" rx="18" fill="#c98f6b" stroke="#2a1a10" strokeWidth="4" />
        <rect x="190" y="-18" width="90" height="48" rx="12" fill="#3c5a8a" stroke="#2a1a10" strokeWidth="4" />
        <ellipse cx="34" cy="6" rx="34" ry="24" fill="#d9a07c" stroke="#2a1a10" strokeWidth="4" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={-26} y={-16 + i * 11} width="38" height="10" rx="5" fill="#d9a07c" stroke="#2a1a10" strokeWidth="3" />)}
        {/* anillo: el detalle para volver a ver */}
        <rect x={-4} y={-17} width="6" height="12" rx="2" fill="#f5c542" stroke="#7a5a00" strokeWidth="1.5" opacity={anillo} />
        {billete && p > 0.45 ? <rect x={-44} y={-6} width="50" height="26" rx="3" fill="#7cc79a" stroke="#0b0d0c" strokeWidth="2.5" transform="rotate(-12)" /> : null}
      </g>
    </svg>
  );
};

/** Polilla que sale volando del cajón vacío. */
const Polilla: React.FC<{ t: number }> = ({ t }) => {
  const k = clamp(t / 2.2, 0, 1);
  const x = 175 + k * 120 + Math.sin(t * 9) * 10;
  const y = 330 - k * 230 + Math.cos(t * 7) * 8;
  const a = Math.abs(Math.sin(t * 40));
  return (
    <div style={{ left: x, top: y, opacity: 1 - k * 0.6 }}>
      <svg width="34" height="24" viewBox="0 0 34 24">
        <ellipse cx="17" cy="12" rx="3" ry="8" fill="#5a4a3a" />
        <ellipse cx={9} cy="10" rx={8} ry={4 + a * 4} fill="#a89880" opacity=".9" />
        <ellipse cx={25} cy="10" rx={8} ry={4 + a * 4} fill="#a89880" opacity=".9" />
      </svg>
    </div>
  );
};

/** Factura de proveedor genérica con la flecha +7%. */
const Factura: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const k = entra((t - T.siete) / 0.5);
  return (
    <div style={{ inset: 0, background: "#fffdf5" }}>
      <div style={{ left: 10, top: 8, right: 10, font: `800 13px ${BODY}`, color: C.tinta }}>FACTURA · PROVEEDOR</div>
      {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ left: 10, right: 40, top: 32 + i * 16, height: 6, borderRadius: 3, background: "#d7d2c4" }} />)}
      <div style={{ right: 8, top: 110 - k * 40, opacity: k, font: `900 30px ${DISP}`, color: ROJO, transform: `scale(${0.6 + 0.4 * k})` }}>↑ +7%</div>
    </div>
  );
};

/** Etiqueta de precio que queda congelada (escarcha) con el precio viejo. */
const PrecioViejo: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const hielo = entra((t - T.viejo) / 0.6);
  if (t < T.siete) return null;
  return (
    <div style={{ left: 6, bottom: 6, width: 82, height: 40, borderRadius: 6, background: "#fff", border: `3px solid ${C.tinta}`, transform: `rotate(-6deg) scale(${sp(t - T.siete, 1.1)})` }}>
      <div style={{ left: 0, right: 0, top: 6, textAlign: "center", font: `900 20px ${DISP}`, color: C.tinta }}>$1.000</div>
      <div style={{ inset: 0, borderRadius: 4, opacity: hielo * 0.85, background: "linear-gradient(135deg, #e0f4ffee, #9fd8ffaa 40%, #ffffffdd 60%, #b8e4ffaa)", boxShadow: "inset 0 0 12px #fff" }} />
      {hielo > 0.3 ? <div style={{ left: 0, right: 0, top: 44, textAlign: "center", font: `800 10px ${BODY}`, color: "#bfe6ff" }}>PRECIO VIEJO</div> : null}
    </div>
  );
};

/** Sello de goma que cae con golpe. */
const Sello: React.FC<{ t: number; desde: number; texto: string; top: number; size?: number; color?: string; rot?: number; left?: number; right?: number }> = ({ t, desde, texto, top, size = 22, color = ROJO, rot = -10, left = 0, right = 0 }) => {
  if (t < desde) return null;
  const d = t - desde;
  const s = d < 0.12 ? 2.2 - (d / 0.12) * 1.2 : 1 + Math.exp(-14 * (d - 0.12)) * Math.sin((d - 0.12) * 40) * 0.06;
  return (
    <div style={{ left, right, top, textAlign: "center", transform: `scale(${s}) rotate(${rot}deg)`, opacity: Math.min(1, d * 12) }}>
      <span style={{ position: "static", display: "inline-block", padding: "4px 12px", border: `4px solid ${color}`, borderRadius: 8, color, background: "#ffffffd9", font: `900 ${size}px ${DISP}`, letterSpacing: ".02em", whiteSpace: "nowrap", mixBlendMode: "multiply" }}>{texto}</span>
    </div>
  );
};

type Pol = { x: number; y: number; w: number; h: number; rot: number };
const P: Pol[] = [
  { x: 18, y: 150, w: 150, h: 170, rot: -5 },
  { x: 192, y: 158, w: 150, h: 170, rot: 4 },
  { x: 92, y: 300, w: 176, h: 176, rot: -2 },
];
const pin = (p: Pol) => ({ x: p.x + p.w / 2, y: p.y + 8 });

/** Polaroid con chinche. `revela` 0..1 da vuelta la foto (tapada con "?" → contenido). */
const Polaroid: React.FC<{ p: Pol; t: number; clavo: number; revela: number; tiembla?: number; brillo?: number; children?: React.ReactNode; n: number }> = ({ p, t, clavo, revela, tiembla = 0, brillo = 0, children, n }) => {
  if (t < clavo - 0.05) return null;
  const s = sp(t - clavo, 1.08, 16, 0.5);
  const giro = Math.cos(Math.PI * clamp(revela, 0, 1));
  const frente = revela > 0.5;
  return (
    <div style={{ left: p.x, top: p.y, width: p.w, height: p.h, transform: `rotate(${p.rot + Math.sin(t * 30) * tiembla + Math.sin(t * 1.6 + n) * 0.9}deg) scale(${s * (0.92 + 0.08 * Math.abs(giro)) }) scaleX(${Math.max(0.04, Math.abs(giro))})`, opacity: Math.min(1, s * 1.5) }}>
      <div style={{ inset: 0, background: "#fbfaf6", boxShadow: `0 10px 22px #0008${brillo > 0 ? `, 0 0 ${30 * brillo}px ${ROJO}` : ""}` }} />
      <div style={{ left: 8, top: 8, right: 8, bottom: 30, overflow: "hidden", background: frente ? "#222" : "#1b1b1b" }}>
        {frente ? children : (
          <div style={{ inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ position: "static", font: `900 ${p.w * 0.5}px ${DISP}`, color: "#ffffff22", transform: `scale(${latido(t + n * 0.2, 0.7, 0.08)})` }}>?</span>
          </div>
        )}
      </div>
      <div style={{ left: 0, right: 0, bottom: 6, textAlign: "center", font: `700 14px "Caveat", ${BODY}`, color: "#333" }}>sospechoso {n}</div>
      <div style={{ left: p.w / 2 - 7, top: -2, width: 14, height: 14, borderRadius: 7, background: "radial-gradient(circle at 35% 35%, #ff8a80, #c62828)", boxShadow: "0 3px 4px #0007" }} />
    </div>
  );
};

/** Hilo rojo entre dos chinches, dibujado de a poco (k) y cortado (corte 0..1 lo hace caer). */
const Hilo: React.FC<{ a: { x: number; y: number }; b: { x: number; y: number }; k: number; corte?: number }> = ({ a, b, k, corte = 0 }) => {
  if (k <= 0) return null;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + 18 + corte * 120;
  const ex = a.x + (b.x - a.x) * k, ey = a.y + (b.y - a.y) * k;
  return (
    <svg width="360" height="640" viewBox="0 0 360 640" style={{ left: 0, top: 0, overflow: "visible", opacity: 1 - corte * 0.8 }}>
      <path d={corte > 0 ? `M ${a.x} ${a.y} Q ${a.x + 10} ${a.y + 60 * corte} ${mx - 20} ${my}` : `M ${a.x} ${a.y} Q ${mx} ${my} ${ex} ${ey}`} stroke="#d32f2f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {corte > 0 ? <path d={`M ${b.x} ${b.y} Q ${b.x - 10} ${b.y + 60 * corte} ${mx + 20} ${my}`} stroke="#d32f2f" strokeWidth="2.6" fill="none" strokeLinecap="round" /> : null}
    </svg>
  );
};

/** Burbuja de "Después te pago" que aparece y se va. */
const Burbuja: React.FC<{ t: number; desde: number; left: number; top: number; texto: string; rot: number }> = ({ t, desde, left, top, texto, rot }) => {
  if (t < desde || t > desde + 1.6) return null;
  const s = sp(t - desde, 1.1, 16, 0.45);
  return (
    <div style={{ left, top: top - (t - desde) * 10, transform: `scale(${s}) rotate(${rot}deg)`, opacity: Math.min(1, (desde + 1.6 - t) * 3) }}>
      <span style={{ position: "static", display: "inline-block", padding: "6px 10px", borderRadius: 14, background: "#fff", color: C.tinta, font: `800 14px ${BODY}`, boxShadow: "0 4px 0 #0005", whiteSpace: "nowrap" }}>{texto}</span>
    </div>
  );
};

/** Vistas de cámara sobre el tablero (centro y zoom), con transición expo de 0,45 s. */
function vista(t: number, T: T) {
  const { l } = T;
  const todo = { x: 180, y: 310, z: 1 };
  const claves: [number, { x: number; y: number; z: number }][] = [
    [l[1], todo],
    [T.tercero - 0.1, { x: 180, y: 390, z: 1.35 }],
    [l[3], { x: 93, y: 238, z: 1.55 }],
    [l[4], { x: 267, y: 246, z: 1.55 }],
    [l[5], { x: 180, y: 330, z: 1.05 }],
    [l[6], { x: 180, y: 380, z: 1.9 }],
    [T.pongo, { x: 180, y: 380, z: 1.7 }],
    [l[7] - 0.05, { x: 240, y: 415, z: 2.6 }],
  ];
  let prev = todo, cur = todo, t0 = 0;
  for (const [a, v] of claves) if (t >= a) { prev = cur; cur = v; t0 = a; }
  const k = entra((t - t0) / 0.45);
  const punch = 1 + 0.07 * Math.exp(-7 * Math.max(0, t - t0)) * (t >= t0 ? 1 : 0);
  return { x: prev.x + (cur.x - prev.x) * k + Math.sin(t * 0.9) * 5, y: prev.y + (cur.y - prev.y) * k + Math.cos(t * 0.7) * 4, z: (prev.z + (cur.z - prev.z) * k) * punch };
}

/** Momentos en que la mano saca un billete (cada vez más rápido). */
function manotazos(T: T) {
  const out: number[] = [];
  let a = T.mano + 0.15, d = 0.95;
  while (a < T.l[7] - 0.6) { out.push(a); a += d; d = Math.max(0.32, d * 0.82); }
  return out;
}

// ---------- escenas ----------

const Gancho: React.FC<{ t: number; T: T }> = ({ t }) => {
  // 0 → SLAM: entran billetes a la caja y el visor cuenta hasta $300.000. SLAM: el cajón se abre de golpe… VACÍO.
  const cuenta = Math.round((300000 * entra(t / (SLAM - 0.1))) / 1000) * 1000;
  const abierto = t >= SLAM;
  const o = abierto ? Math.min(1, entra((t - SLAM) / 0.12) + Math.exp(-9 * (t - SLAM)) * Math.sin((t - SLAM) * 40) * 0.08) : Math.sin(t * 50) * 0.03;
  const tachado = entra((t - SLAM) / 0.25);
  const zoom = abierto ? 1.12 - 0.08 * entra((t - SLAM) / 0.6) : 1 + t * 0.06;
  return (
    <>
      <div style={{ inset: 0, background: "#0d0b09" }} />
      <Img src={staticFile("tomas/v8-01/recorte-almacen.jpg")} style={{ position: "absolute", inset: -20, width: 400, height: 680, objectFit: "cover", filter: `blur(4px) brightness(${abierto ? 0.3 : 0.45}) saturate(.7)`, transform: `scale(${1.08 + t * 0.03}) translateX(${Math.sin(t * 0.8) * 6}px)` }} />
      <div style={{ inset: 0, background: abierto ? "radial-gradient(circle at 50% 55%, #ff3b3022 10%, #000d 70%)" : "radial-gradient(circle at 50% 55%, #ffb70022 10%, #000c 72%)" }} />
      <div style={{ left: 0, top: 0, width: 360, height: 640, transformOrigin: "50% 60%", transform: `scale(${zoom})` }}>
        {!abierto ? <Billetes t={t} desde={-0.35} hasta={SLAM - 0.3} x0={-40} y0={200} x1={170} y1={300} cada={0.09} vuelo={0.45} alto={70} /> : null}
        {!abierto ? <Billetes t={t} desde={-0.3} hasta={SLAM - 0.3} x0={380} y0={230} x1={180} y1={300} cada={0.11} vuelo={0.45} alto={60} /> : null}
        <div style={{ left: 30, top: 250, transform: `scale(${latido(t, 0.45, 0.03)})` }}>
          <Cajon w={300} o={o} billetes={0} t={t} pantalla={abierto ? "$ 0" : `$ ${cuenta.toLocaleString("es-AR")}`} colorPantalla={abierto ? (Math.sin(t * 18) > 0 ? ROJO : "#5a1a16") : "#7cf2a8"} />
        </div>
        {/* la mano descansa sobre el mostrador con el anillo a la vista (se entiende recién al final) */}
        <div style={{ left: 70, top: 380 }}><Mano w={280} p={0.3} billete={false} /></div>
        {abierto && t < SLAM + 2.4 ? <Polilla t={t - SLAM} /> : null}
      </div>
      <div style={{ left: 0, right: 0, top: 34, textAlign: "center" }}>
        <span style={{ position: "static", display: "inline-block", padding: "3px 12px", borderRadius: 999, background: C.ambar, color: C.tinta, font: `900 14px ${BODY}`, letterSpacing: ".08em" }}>EL CASO DEL KIOSCO</span>
      </div>
      <div style={{ left: 0, right: 0, top: 70, textAlign: "center", transform: `scale(${(abierto ? 0.9 : 1) * latido(t, 0.5, 0.04)}) rotate(${-3 + Math.sin(t * 5) * 0.8}deg)` }}>
        <span style={{ position: "static", display: "inline-block", padding: "6px 16px", borderRadius: 12, background: "#fff", color: C.tinta, font: `900 32px/1.05 ${DISP}`, boxShadow: `0 6px 0 ${C.tinta}` }}>
          VENDE $300.000<br />POR DÍA
          {tachado > 0 ? <span style={{ position: "absolute", left: 8, top: "50%", height: 6, width: `${tachado * 92}%`, background: ROJO, borderRadius: 3, transform: "rotate(-8deg)" }} /> : null}
        </span>
      </div>
      {abierto ? <Cartel texto="¿Y LA PLATA?" top={176} size={46} fondo={ROJO} s={sp(t - SLAM - 0.08, 1.15) * latido(t, 0.5, 0.05)} rot={3 + Math.sin(t * 6) * 1.5} /> : null}
    </>
  );
};

/** Polvo que flota delante de todo (siempre hay algo moviéndose). */
const Polvo: React.FC<{ t: number }> = ({ t }) => (
  <>
    {Array.from({ length: 22 }, (_, i) => {
      const x = ((i * 53.7 + t * (6 + (i % 5) * 3)) % 400) - 20;
      const y = ((i * 97.3 + t * (10 + (i % 4) * 4)) % 680) - 20;
      const r = 1 + (i % 3);
      return <div key={i} style={{ left: x + Math.sin(t * 1.3 + i) * 8, top: 640 - y, width: r * 2, height: r * 2, borderRadius: r, background: "#ffe9b8", opacity: 0.18 + 0.12 * Math.sin(t * 2 + i) }} />;
    })}
  </>
);

const Tablero: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const { l } = T;
  const v = vista(t, T);
  const peor = t >= l[5] - 0.05;
  const mz = manotazos(T);
  // fase de la mano: el manotazo más reciente
  let p = 0, n = 0;
  mz.forEach((a, i) => { const d = (t - a) / 0.55; if (d >= 0) { n = i + 1; if (d <= 1) p = d; } });
  const corte = peor ? entra((t - (l[5] + 0.1)) / 0.5) : 0;
  return (
    <>
      <div style={{ inset: 0, background: "#1a120b" }} />
      <div style={{ left: 0, top: 0, width: 360, height: 640, transformOrigin: "0 0", transform: `translate(${180 - v.x * v.z}px, ${320 - v.y * v.z}px) scale(${v.z}) rotate(${Math.sin(t * 0.6) * 0.8}deg)` }}>
        {/* corcho con marco de madera */}
        <div style={{ left: -60, top: 60, width: 480, height: 460, background: "#6b4423" }} />
        <div style={{ left: -48, top: 72, width: 456, height: 436, background: "radial-gradient(#a0703f 1.2px, #0000 1.6px) 0 0/7px 7px, radial-gradient(#7a4f27 1px, #0000 1.4px) 3px 4px/9px 9px, #b9844f" }} />
        <div style={{ left: 80, top: 100, width: 200, height: 34, background: "#fff7c2", transform: "rotate(-2deg)", boxShadow: "0 4px 8px #0006", textAlign: "center", font: `800 14px/34px ${BODY}`, color: C.tinta }}>¿DÓNDE ESTÁ LA PLATA?</div>
        <Hilo a={pin(P[0])} b={pin(P[2])} k={entra((t - T.ochenta) / 0.6)} corte={corte} />
        <Hilo a={pin(P[1])} b={pin(P[2])} k={entra((t - T.viejo - 0.3) / 0.6)} corte={corte} />
        <Polaroid p={P[0]} t={t} n={1} clavo={T.tres} revela={entra((t - T.cuaderno + 0.15) / 0.35)}>
          <Img src={staticFile("tomas/v8-01/recorte-cuaderno.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.1) saturate(1.1)" }} />
        </Polaroid>
        <Polaroid p={P[1]} t={t} n={2} clavo={T.tres + 0.22} revela={entra((t - T.proveedor + 0.15) / 0.35)}>
          <Factura t={t} T={T} />
          <PrecioViejo t={t} T={T} />
        </Polaroid>
        <Polaroid p={P[2]} t={t} n={3} clavo={T.tres + 0.44} revela={entra((t - T.mano + 0.2) / 0.3)} tiembla={t > T.tercero && t < l[3] ? 0.8 : 0} brillo={peor && t < l[6] ? 0.6 + 0.4 * Math.sin(t * 8) : 0}>
          <div style={{ inset: 0, background: "#2a2622" }} />
          <div style={{ left: -6, top: 6 }}><Cajon w={172} o={0.85} billetes={Math.max(0, 5 - Math.floor(n / 3))} t={t} /></div>
          <div style={{ left: -4, top: 30 }}><Mano w={172} p={p} billete /></div>
        </Polaroid>
        {mz.map((a, i) => {
          const d = (t - a - 0.3) / 0.6;
          if (d < 0 || d > 1) return null;
          return <div key={i} style={{ left: 250 + d * 170, top: 410 - Math.sin(d * Math.PI) * 90 - d * 60, transform: `rotate(${d * 300 + i * 40}deg) scale(${1 - d * 0.3})` }}><svg width={44} height={22} viewBox="0 0 80 40"><rect x="2" y="2" width="76" height="36" rx="5" fill="#7cc79a" stroke={C.tinta} strokeWidth="3" /><circle cx="40" cy="20" r="9" fill={C.hoja} stroke={C.tinta} strokeWidth="2.5" /></svg></div>;
        })}
        {/* lupa sobre el anillo */}
        {t >= l[7] - 0.05 && t < l[8] ? (
          <div style={{ left: 220, top: 394, width: 48, height: 48, borderRadius: 24, border: "4px solid #2b2b2b", boxShadow: "0 0 0 2px #888, 0 6px 14px #000a", background: "radial-gradient(circle, #fff2 30%, #fff1 70%)", transform: `scale(${sp(t - l[7] + 0.05, 1.1)})` }}>
            <div style={{ left: 18, top: 14, width: 10, height: 18, borderRadius: 3, background: "#f5c542", boxShadow: "0 0 12px #ffd54f" }} />
          </div>
        ) : null}
        {/* burbujas del fiado */}
        <Burbuja t={t} desde={T.pago - 0.25} left={10} top={128} texto="después te pago" rot={-6} />
        <Burbuja t={t} desde={T.pago} left={96} top={312} texto="anotámelo" rot={5} />
        <Burbuja t={t} desde={T.pago + 0.25} left={30} top={300} texto="el viernes cobro" rot={-3} />
      </div>
      {/* lo peor: todo se oscurece menos el sospechoso 3 */}
      {peor && t < l[6] ? <div style={{ inset: 0, background: "radial-gradient(circle at 50% 56%, #0000 18%, #000d 45%)", opacity: entra((t - l[5]) / 0.3) }} /> : null}
    </>
  );
};

const Espejo: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const s = sp(t - T.l[8], 1.04, 14, 0.55);
  const brillo = ((t - T.l[8]) * 160) % 700 - 200;
  return (
    <>
      <div style={{ inset: 0, background: "#1a120b" }} />
      <div style={{ left: 40, top: 110, width: 280, height: 360, borderRadius: 140, background: "linear-gradient(160deg, #d9dee2, #8e979e 45%, #c5ccd2 70%, #7b848b)", border: "10px solid #6b4423", boxShadow: "0 20px 40px #000c", overflow: "hidden", transform: `scale(${(0.9 + 0.1 * s) * (1 + 0.08 * Math.exp(-6 * Math.max(0, t - T.vos)) * (t >= T.vos ? 1 : 0)) * latido(t, 0.6, 0.02)}) rotateY(${(1 - s) * 80}deg) rotate(${Math.sin(t * 1.2) * 1.2}deg)` }}>
        <div style={{ left: brillo, top: -40, width: 60, height: 460, background: "linear-gradient(90deg, #fff0, #fff9, #fff0)", transform: "rotate(18deg)" }} />
        {/* silueta reflejada: sos vos */}
        <svg width="260" height="340" viewBox="0 0 260 340" style={{ left: 0, top: 30, opacity: 0.55 }}>
          <circle cx="130" cy="120" r="48" fill="#3b4248" />
          <path d="M40 330 Q50 200 130 190 Q210 200 220 330 Z" fill="#3b4248" />
        </svg>
      </div>
      <Cartel texto="¿Y VOS?" top={40} size={46} fondo={ROJO} s={sp(t - T.vos + 0.1, 1.12)} rot={-3} />
      <Rotulo t={t} desde={T.semana} texto="¿Cuánto sacaste esta semana? Comentá el número" top={420} color={C.ambar} size={14} />
    </>
  );
};

const Final: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const { fps } = useVideoConfig();
  const l9 = T.l[9];
  const persiana = entra((t - l9) / 1.2);
  const cel = sp(t - T.contarle + 0.3, 1.04, 12, 0.55);
  const desde = 11.0; // segundo de la grabación fb-01 donde la app ya entendió la frase (marca "listo")
  return (
    <>
      <div style={{ inset: 0, background: "linear-gradient(#0b1220, #151b26)" }} />
      {/* persiana que baja y la luz de la calle */}
      <div style={{ left: 0, top: 0, width: 360, height: 70 + persiana * 220, background: "repeating-linear-gradient(#7d858c 0 12px, #5f666d 12px 14px)", boxShadow: "0 6px 12px #0009" }} />
      <div style={{ left: 0, right: 0, bottom: 0, height: 200, background: "radial-gradient(ellipse at 50% 100%, #ffb70033, #0000 70%)" }} />
      {/* ella, en silueta, hablándole al celular */}
      <svg width="170" height="330" viewBox="0 0 170 330" style={{ left: 0, top: 300 }}>
        <circle cx="80" cy="70" r="40" fill="#05070a" />
        <path d="M60 40 Q80 10 112 44 Q120 70 110 96 Q118 60 80 50 Z" fill="#05070a" />
        <path d="M10 330 Q16 140 80 120 Q144 140 150 330 Z" fill="#05070a" />
        <rect x="118" y="92" width="14" height="26" rx="3" fill="#05070a" transform={`rotate(${-20 + Math.sin(t * 3) * 3} 125 105)`} />
      </svg>
      {t > T.contarle - 0.4 ? (
        <Celular t={t} sp={cel} left={160} top={190}>
          <Sequence from={Math.round((T.contarle - 0.3) * fps)} layout="none">
            <OffthreadVideo src={staticFile("tomas/fb-01/app.mp4")} startFrom={Math.round(desde * 30)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} />
          </Sequence>
        </Celular>
      ) : null}
      {t < T.contarle ? <Etiqueta texto="ELLA TAMPOCO SABÍA" top={40} size={20} fondo={ROJO} /> : <Etiqueta texto="LE CONTÓ EL DÍA AL CELULAR" top={40} size={17} fondo={C.verde} color={C.ambar} />}
      {t > T.celular ? <BotonProbalo s={sp(t - T.celular, 1.04)} top={560} /> : null}
    </>
  );
};

export const DondeEstaLaPlata: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, dur);
  const { l, e } = T;
  const loop = t >= T.LOOP;
  const tw = loop ? 0 : t;
  const sil0 = e[6] + 0.05;
  const mz = manotazos(T);

  const manual = [0.03, 0.45, 0.9, SLAM, SLAM + 0.5, T.alquiler, T.tres, T.tercero, T.cuaderno, T.pago, T.ochenta, T.proveedor, T.siete, T.viejo, T.peor, T.mano, T.casa, T.pongo, T.ella, T.vos, T.semana, T.contarle, T.celular];
  const cortes = [l[1], l[8], l[9]];
  const cam: Cam2D = t > sil0 && t < T.ella ? { z: 1.02, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : ritmo(pal, manual, [[sil0, T.ella - 0.02], [T.LOOP - 0.4, 999]], 0.4), loop ? [] : cortes, 0.8);
  const hs = loop ? 0 : temblor(t, [[0.03, 9], [SLAM, 14], [T.tres + 0.44, 4], [T.ochenta, 7], [T.viejo + 0.3, 7], [l[5] + 0.1, 6], [T.ella, 12], [T.vos, 6]]);
  let wf = 0;
  if (!loop) [[0.03, 0.25], [SLAM, 0.4], [T.ella, 0.3], [l[8], 0.15]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });

  const tics = (desde: number, hasta: number, cada: number, vol: number) => Array.from({ length: Math.max(0, Math.floor((hasta - desde) / cada)) }, (_, i) => ({ en: desde + i * cada, sfx: "tic", vol }));
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump", vol: 0.7 }, ...Array.from({ length: 8 }, (_, i) => ({ en: i * 0.12, sfx: i % 2 ? "coins" : "caja", vol: 0.28 })),
    { en: SLAM, sfx: "cajon", vol: 0.8 }, { en: SLAM, sfx: "slam", vol: 0.6 }, { en: SLAM + 0.05, sfx: "rayon", vol: 0.45 }, { en: SLAM + 0.3, sfx: "viento", vol: 0.25 },
    { en: l[1] - 0.12, sfx: "whoosh", vol: 0.4 },
    ...[0, 0.22, 0.44].map((d) => ({ en: T.tres + d, sfx: "click", vol: 0.6 })),
    { en: T.tercero, sfx: "heart", vol: 0.6 }, { en: T.tercero + 0.55, sfx: "heart", vol: 0.6 },
    { en: T.cuaderno - 0.15, sfx: "hoja", vol: 0.5 }, ...[-0.25, 0, 0.25].map((d) => ({ en: T.pago + d, sfx: "papel", vol: 0.35 })),
    { en: T.ochenta, sfx: "sello", vol: 0.65 }, { en: T.ochenta + 0.1, sfx: "marcador", vol: 0.3 },
    { en: T.proveedor - 0.15, sfx: "hoja", vol: 0.5 }, { en: T.siete, sfx: "riser", vol: 0.35 }, { en: T.viejo, sfx: "vidrio", vol: 0.25 },
    { en: T.viejo + 0.3, sfx: "sello", vol: 0.65 },
    { en: l[5] + 0.1, sfx: "tijera", vol: 0.6 }, { en: T.peor, sfx: "piano_grave", vol: 0.5 },
    ...mz.map((a) => ({ en: a, sfx: "cajon", vol: 0.35 })), ...mz.map((a) => ({ en: a + 0.3, sfx: "coins", vol: 0.25 })),
    { en: T.pongo, sfx: "caja", vol: 0.5 },
    { en: T.ella, sfx: "sello", vol: 0.8 }, { en: T.ella + 0.02, sfx: "thump", vol: 0.7 },
    { en: l[8] - 0.12, sfx: "whoosh", vol: 0.4 }, { en: T.vos, sfx: "slam", vol: 0.45 }, ...tics(T.vos + 0.4, e[8] + 0.3, 0.5, 0.35),
    { en: l[9] + 0.05, sfx: "metal", vol: 0.35 }, { en: T.contarle, sfx: "click", vol: 0.4 }, { en: T.celular, sfx: "ding", vol: 0.5 },
    ...tics(T.LOOP - 0.6, T.LOOP, 0.12, 0.3),
  ].filter((x) => !(x.en > sil0 + 0.02 && x.en < T.ella - 0.05));

  const musica = (
    <>
      <div className="stage" style={{ position: "absolute", inset: 0 }}><Polvo t={tw} /></div>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(sil0 * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.1 * Math.min(1, Math.max(0, sil0 * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(T.ella * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(T.ella * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.1 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // ---------- capa de textos (máximo 2 + subtítulo) ----------
  const tg = tw;
  const textos = (
    <>
      {tg >= l[1] - 0.05 && tg < l[8] - 0.05 ? <div style={{ left: 0, right: 0, top: 0, height: 150, background: "linear-gradient(#000d 55%, #0000)" }} /> : null}
      <div style={{ left: 0, right: 0, top: 8, textAlign: "center", font: `700 10px ${BODY}`, color: "#ffffffaa", letterSpacing: ".1em" }}>HISTORIA RECREADA · MONTOS DE EJEMPLO</div>
      {!loop && tg >= l[1] - 0.05 && tg < l[2] - 0.05 ? (tg < T.tres ? <Etiqueta texto="EXPEDIENTE ABIERTO" top={30} size={18} fondo={C.tinta} color={C.ambar} /> : <Cartel texto="3 SOSPECHOSOS" top={34} size={30} fondo={C.ambar} color={C.tinta} s={sp(tg - T.tres, 1.1)} />) : null}
      {!loop && tg >= l[2] - 0.05 && tg < l[3] - 0.05 ? <Cartel texto="EL 3° LO TENÉS VOS" top={34} size={28} fondo={ROJO} s={sp(tg - T.tercero, 1.12) * latido(tg, 0.5, 0.04)} /> : null}
      {!loop && tg >= l[3] - 0.05 && tg < l[4] - 0.05 ? (
        <>
          <Etiqueta texto="SOSPECHOSO 1 · EL CUADERNO" top={30} size={16} fondo={C.tinta} color="#fff" />
          <Sello t={tg} desde={T.ochenta} texto="−$380.000" top={70} size={34} />
        </>
      ) : null}
      {!loop && tg >= l[4] - 0.05 && tg < l[5] - 0.05 ? (
        <>
          <Etiqueta texto="SOSPECHOSO 2 · EL PRECIO VIEJO" top={30} size={16} fondo={C.tinta} color="#fff" />
          <Sello t={tg} desde={T.viejo + 0.3} texto="−$420.000 POR MES" top={70} size={26} />
        </>
      ) : null}
      {!loop && tg >= l[5] - 0.05 && tg < l[6] - 0.05 ? <Cartel texto="NO. EL PEOR ES OTRO." top={40} size={28} fondo={ROJO} s={sp(tg - T.peor + 0.2, 1.1)} rot={2} /> : null}
      {!loop && tg >= l[6] - 0.05 && tg < l[7] - 0.05 ? (
        <>
          <Etiqueta texto={tg < T.casa ? "SOSPECHOSO 3 · LA MANO" : "\"PARA LA CASA\""} top={30} size={16} fondo={C.tinta} color={C.ambar} />
          <Numero t={tg} v={tg < T.pongo ? Math.min(mz.filter((a) => tg >= a + 0.3).length, 29) * 10000 : 300000} pasos={[{ en: T.pongo, a: 300000 }]} dur={0.5} top={58} size={46} color={ROJO} redondeo={1000} />
          {tg >= T.pongo + 0.3 ? <div style={{ left: 0, right: 0, top: 112, textAlign: "center", font: `900 18px ${DISP}`, color: "#fff" }}>POR MES</div> : null}
        </>
      ) : null}
      {!loop && tg >= T.ella ? (tg < l[8] - 0.05 ? <Sello t={tg} desde={T.ella} texto="ERA ELLA" top={170} size={46} rot={-12} /> : null) : null}
    </>
  );

  let escena: React.ReactNode;
  if (loop || tw < l[1] - 0.05) escena = <Gancho t={tw} T={T} />;
  else if (tw < l[8] - 0.05) escena = <Tablero t={tw} T={T} />;
  else if (tw < l[9] - 0.05) escena = <Espejo t={tw} T={T} />;
  else escena = <Final t={tw} T={T} />;

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={!loop && t > T.ella && t < T.ella + 0.15 ? 0.5 : 0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[sil0, l[8] - 0.05], [T.celular, 999]]}
      fondo={escena}
      frente={textos}
      sobre={musica}
      subTop={500}
    />
  );
};
