import React from "react";
import { AbsoluteFill, Html5Audio, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { clamp } from "../lib/anim";
import { BODY, DISP, MARKER } from "../lib/fuentes";
import { C, CajaRegistradora, Kiosco, Kiosquero } from "../v8/iconos";
import { Camara, Estudio } from "../v8/estudio3d";
import { CajaGigante, KioscoInterior } from "../piloto/modelos";
import { Cine } from "../vnc/cine";

// Muestrario de estilos (prueba, no se publica): el mismo tema en 12 estilos de 6 s cada uno.
// Tema (EJEMPLO): entraron $120.000 a la caja − mercadería $66.000 − alquiler y luz $36.333 − comisiones $8.000 = te quedaron $9.667.

export const FPS_M = 30;
export const SEG = 6;
const NOMBRES = ["video-shotcraft", "painted-animation", "kinetic-reel", "isometric-animation", "whiteboard-animation", "diagram-animation", "explainer-video", "wrapped-video", "hyperframes", "countdown-video", "motion-background", "nuestro 3D (src/v8)"];
export const DURACION_M = NOMBRES.length * SEG;

const ease = (k: number) => { const x = clamp(k, 0, 1); return 1 - Math.pow(1 - x, 3); };
const back = (k: number) => { const x = clamp(k, 0, 1); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const rnd = (i: number, k = 0) => { const x = Math.sin((i + 1) * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const abs: React.CSSProperties = { position: "absolute" };

/** Lienzo lógico 360 × 640 escalado ×3. */
const Lienzo: React.FC<{ children: React.ReactNode; fondo?: string }> = ({ children, fondo = "#000" }) => (
  <AbsoluteFill style={{ background: fondo }}>
    <div style={{ ...abs, left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" }}>{children}</div>
  </AbsoluteFill>
);

/** Cartel numerado: grande al principio, después chico arriba. */
const Rotulo: React.FC<{ n: number; u: number }> = ({ n, u }) => {
  const k = ease((u - 0.85) / 0.35);
  const s = u < 0.85 ? back(u / 0.3) : 1;
  return (
    <div style={{ ...abs, left: 12 + (1 - k) * 0, right: 12, top: 300 - 286 * k, textAlign: k > 0.5 ? "left" : "center", zIndex: 50 }}>
      <span style={{ display: "inline-block", padding: `${8 - 4 * k}px ${14 - 6 * k}px`, borderRadius: 10, background: "#0b0f0dee", border: `2px solid ${C.ambar}`, color: "#fff", font: `800 ${30 - 18 * k}px ${DISP}`, transform: `scale(${s})`, boxShadow: "0 6px 20px #0008" }}>
        <span style={{ color: C.ambar }}>{n + 1} · </span>{NOMBRES[n]}
      </span>
    </div>
  );
};

const Ejemplo: React.FC<{ top: number; color?: string }> = ({ top, color = C.ambar }) => (
  <div style={{ ...abs, left: 0, right: 0, top, textAlign: "center" }}><span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, background: color, color: C.tinta, font: `800 11px ${BODY}`, letterSpacing: ".1em" }}>EJEMPLO</span></div>
);

// ---------- 1 · video-shotcraft: plano de producto con captura real, golpe de tinta, inclinación 3D y barrido de luz ----------
const Shotcraft: React.FC<{ u: number }> = ({ u }) => {
  const tinta = ease((u - 0.9) / 0.5);
  const giro = 38 - 46 * ease((u - 1.1) / 1.4);
  const zoom = 1 + 0.9 * ease((u - 3.4) / 1.2);
  const barrido = ((u - 1.4) / 1.2) % 2;
  return (
    <Lienzo fondo="#efe9dc">
      <div style={{ ...abs, left: 180 - 520 * tinta, top: 330 - 520 * tinta, width: 1040 * tinta, height: 1040 * tinta, borderRadius: "50%", background: "#0d0d0d" }} />
      <div style={{ ...abs, left: 0, right: 0, top: 70, textAlign: "center", overflow: "hidden", height: 44 }}>
        <div style={{ font: `800 30px ${DISP}`, color: "#efe9dc", transform: `translateY(${(1 - ease((u - 1.5) / 0.5)) * 44}px)` }}>Entraron $120.000</div>
      </div>
      <div style={{ ...abs, left: 0, right: 0, top: 112, textAlign: "center", overflow: "hidden", height: 40 }}>
        <div style={{ font: `800 26px ${DISP}`, color: "#ffd166", transform: `translateY(${(1 - ease((u - 3.0) / 0.5)) * 40}px)` }}>Te quedaron $9.667</div>
      </div>
      <div style={{ ...abs, left: 85, top: 170, width: 190, height: 412, perspective: 700 }}>
        <div style={{ ...abs, inset: 0, transform: `rotateY(${giro}deg) rotateX(${8 * (1 - tinta)}deg) scale(${zoom})`, transformOrigin: "50% 18%", borderRadius: 26, background: "#111", padding: 7, boxShadow: "0 30px 60px #000c" }}>
          <div style={{ ...abs, inset: 7, borderRadius: 20, overflow: "hidden" }}>
            <Img src={staticFile("tomas/v9-04/app-inicio.jpg")} style={{ width: "100%" }} />
            <div style={{ ...abs, inset: 0, background: `linear-gradient(115deg, transparent ${barrido * 100 - 20}%, #ffffff66 ${barrido * 100}%, transparent ${barrido * 100 + 20}%)` }} />
            {u > 3.4 ? <div style={{ ...abs, left: 8, top: 30, width: 160, height: 46, border: `3px solid ${C.ambar}`, borderRadius: 10, opacity: ease((u - 3.4) / 0.3) }} /> : null}
          </div>
        </div>
      </div>
      <Ejemplo top={600} />
    </Lienzo>
  );
};

// ---------- 2 · painted-animation: acuarela y tinta que "hierve" ----------
const Painted: React.FC<{ u: number; f: number }> = ({ u, f }) => {
  const seed = Math.floor(f / 3);
  const caen = ease((u - 3.0) / 0.6);
  return (
    <Lienzo fondo="#f4ecd8">
      <svg width={360} height={640} style={abs}>
        <defs>
          <filter id="hervor"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={seed} /><feDisplacementMap in="SourceGraphic" scale={3.5} /></filter>
          <filter id="acuarela"><feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves={3} seed={seed % 4} /><feDisplacementMap in="SourceGraphic" scale={14} /><feGaussianBlur stdDeviation={2.2} /></filter>
          <filter id="papel"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} /><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 0.12 0" /></filter>
        </defs>
        <rect width={360} height={640} filter="url(#papel)" />
        {/* manchas de acuarela */}
        <g filter="url(#acuarela)" opacity={0.75}>
          <rect x={70} y={250} width={220} height={190} fill="#e8c9a0" />
          <path d="M60 250 h240 l-12 -40 h-216 z" fill="#4f9d74" />
          <rect x={95} y={300} width={90} height={80} fill="#9cc7e0" />
          <rect x={205} y={300} width={60} height={140} fill="#2f6f4f" />
          <circle cx={180} cy={520} r={46 + 6 * Math.sin(u * 3)} fill={u > 3 ? "#e8908a" : "#b9e0c4"} />
        </g>
        {/* tinta que hierve */}
        <g filter="url(#hervor)" fill="none" stroke="#1d1a17" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <rect x={70} y={250} width={220} height={190} />
          <path d="M60 250 h240 l-12 -40 h-216 z" />
          {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${72 + i * 36} 250 q18 22 36 0`} />)}
          <rect x={95} y={300} width={90} height={80} />
          <rect x={205} y={300} width={60} height={140} />
          <circle cx={255} cy={372} r={3} fill="#1d1a17" />
        </g>
        {/* monedas pintadas que se van */}
        {Array.from({ length: 8 }, (_, i) => {
          const x = 110 + i * 20, y = 470 + caen * (120 + i * 10);
          return <g key={i} filter="url(#hervor)"><circle cx={x} cy={y} r={9} fill="#e7c15a" stroke="#1d1a17" strokeWidth={2} opacity={1 - caen * 0.8} /></g>;
        })}
      </svg>
      <div style={{ ...abs, left: 0, right: 0, top: 80, textAlign: "center", font: `400 40px ${MARKER}`, color: "#2f6f4f", transform: `rotate(-3deg) scale(${back((u - 0.9) / 0.4)})` }}>$120.000</div>
      <div style={{ ...abs, left: 0, right: 0, top: 126, textAlign: "center", font: `400 18px ${MARKER}`, color: "#5a4a3a", opacity: ease((u - 1.4) / 0.4) }}>entraron a la caja…</div>
      {u > 3.0 ? <div style={{ ...abs, left: 0, right: 0, top: 500, textAlign: "center", font: `400 46px ${MARKER}`, color: "#b3261e", transform: `rotate(2deg) scale(${back((u - 3.1) / 0.4)})` }}>$9.667</div> : null}
      {u > 3.4 ? <div style={{ ...abs, left: 0, right: 0, top: 560, textAlign: "center", font: `400 16px ${MARKER}`, color: "#5a4a3a" }}>te quedaron (ejemplo)</div> : null}
    </Lienzo>
  );
};

// ---------- 3 · kinetic-reel: tipografía gigante, micro-tipos de interfaz, paleta negro/crema/lima, terreno de partículas ----------
const Kinetic: React.FC<{ u: number }> = ({ u }) => {
  const lima = "#c6ff3d", crema = "#f2ecdc";
  const wipe = ease((u - 3.1) / 0.35);
  const letras = "$120.000".split("");
  return (
    <Lienzo fondo="#070707">
      <svg width={360} height={640} style={abs}>
        {Array.from({ length: 22 }, (_, r) => Array.from({ length: 18 }, (_, c) => {
          const z = r / 22, x = 180 + (c - 8.5) * (6 + z * 22), y = 380 + z * z * 260 + Math.sin(c * 0.6 + u * 2 + r * 0.4) * 10 * z;
          return <circle key={`${r}-${c}`} cx={x} cy={y} r={0.5 + z * 1.6} fill={r % 5 === 0 ? lima : crema} opacity={0.25 + z * 0.6} />;
        }))}
      </svg>
      {/* HUD */}
      <div style={{ ...abs, left: 14, top: 64, font: `600 8px ${BODY}`, color: crema, letterSpacing: ".18em", opacity: 0.8 }}>● REC  CAJA_01 / KIOSCO_ARG</div>
      <div style={{ ...abs, right: 14, top: 64, font: `600 8px ${BODY}`, color: lima, letterSpacing: ".18em" }}>T+00:{String(Math.floor(u * 10)).padStart(2, "0")}:{String(Math.floor((u * 30) % 30)).padStart(2, "0")}</div>
      {[[10, 80], [338, 80], [10, 600], [338, 600]].map(([x, y], i) => <div key={i} style={{ ...abs, left: x, top: y, width: 12, height: 12, borderLeft: i % 2 ? undefined : `2px solid ${crema}`, borderRight: i % 2 ? `2px solid ${crema}` : undefined, borderTop: i < 2 ? `2px solid ${crema}` : undefined, borderBottom: i >= 2 ? `2px solid ${crema}` : undefined }} />)}
      <div style={{ ...abs, left: 0, right: 0, top: 150, textAlign: "center", whiteSpace: "nowrap" }}>
        {letras.map((ch, i) => (
          <span key={i} style={{ display: "inline-block", font: `800 82px/1 ${DISP}`, color: crema, transform: `scaleX(0.72) translateY(${(1 - ease((u - 0.95 - i * 0.05) / 0.3)) * 90}px)`, opacity: u < 3.1 ? 1 : 1 - wipe, margin: "0 -9px" }}>{ch}</span>
        ))}
      </div>
      <div style={{ ...abs, left: 0, right: 0, top: 240, textAlign: "center", font: `700 13px ${BODY}`, color: lima, letterSpacing: ".32em", opacity: ease((u - 1.6) / 0.3) * (1 - wipe) }}>ENTRARON A LA CAJA</div>
      <div style={{ ...abs, left: 0, top: 140, width: 360 * wipe, height: 120, background: lima, opacity: u < 3.6 ? 1 : 0 }} />
      {u > 3.35 ? (
        <>
          <div style={{ ...abs, left: 0, right: 0, top: 150, textAlign: "center", font: `800 92px/1 ${DISP}`, color: lima, transform: `scaleX(0.72) scale(${back((u - 3.35) / 0.3)})` }}>$9.667</div>
          <div style={{ ...abs, left: 0, right: 0, top: 250, textAlign: "center", font: `700 13px ${BODY}`, color: crema, letterSpacing: ".32em" }}>TE QUEDARON · EJEMPLO</div>
        </>
      ) : null}
    </Lienzo>
  );
};

// ---------- 4 · isometric-animation: el kiosco y la pila de plata en 2.5D, que se desarma por capas ----------
const Isometric: React.FC<{ u: number }> = ({ u }) => {
  const partes = [{ v: 66000, c: "#a0723c", t: "Mercadería" }, { v: 36333, c: "#2f6fb5", t: "Alquiler y luz" }, { v: 8000, c: "#8a4fbf", t: "Comisiones" }, { v: 9667, c: "#16a34a", t: "Te quedan" }];
  const escala = 160 / 120000;
  let base = 0;
  const caja = (x: number, y: number, z: number, w: number, d: number, h: number, color: string, key: string, op = 1) => (
    <div key={key} style={{ ...abs, left: x, top: y, width: w, height: d, transformStyle: "preserve-3d", transform: `translateZ(${z}px)`, opacity: op }}>
      <div style={{ ...abs, inset: 0, background: color, transform: `translateZ(${h}px)`, filter: "brightness(1.15)" }} />
      <div style={{ ...abs, left: 0, top: d, width: w, height: h, background: color, transformOrigin: "top", transform: "rotateX(-90deg)", filter: "brightness(0.85)" }} />
      <div style={{ ...abs, left: w, top: 0, width: h, height: d, background: color, transformOrigin: "left", transform: "rotateY(90deg)", filter: "brightness(0.65)" }} />
    </div>
  );
  return (
    <Lienzo fondo="#f1ede4">
      <div style={{ ...abs, left: 180, top: 360, width: 0, height: 0, transformStyle: "preserve-3d", transform: `rotateX(60deg) rotateZ(${45 + Math.sin(u * 0.8) * 4}deg)` }}>
        {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ ...abs, left: -200 + i * 50, top: -200, width: 1, height: 400, background: "#d6cfc0" }} />)}
        {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ ...abs, left: -200, top: -200 + i * 50, width: 400, height: 1, background: "#d6cfc0" }} />)}
        {caja(-150, -60, 0, 90, 90, 70, "#e3d6bd", "kiosco")}
        {caja(-150, -60, 70, 90, 90, 6, "#1e7a4c", "toldo")}
        {partes.map((p, i) => {
          const h = p.v * escala * ease((u - 0.9) / 0.6);
          const sale = i < 3 ? ease((u - (2.2 + i * 0.6)) / 0.5) : 0;
          const el = caja(10 + sale * 140, -40 - sale * 140, base + sale * 60, 70, 70, h, p.c, p.t, 1 - sale);
          base += h;
          return el;
        })}
      </div>
      <div style={{ ...abs, left: 0, right: 0, top: 80, textAlign: "center", font: `800 26px ${DISP}`, color: C.tinta }}>{u < 3.9 ? "Entraron $120.000" : "Te quedaron $9.667"}</div>
      {[0, 1, 2].map((i) => (u > 2.2 + i * 0.6 && u < 4.4 ? <div key={i} style={{ ...abs, left: 200, top: 150 + i * 26, font: `700 13px ${BODY}`, color: partes[i].c, opacity: ease((u - 2.2 - i * 0.6) / 0.3) }}>− {pesos(partes[i].v)} {partes[i].t.toLowerCase()}</div> : null))}
      <Ejemplo top={600} />
    </Lienzo>
  );
};

// ---------- 5 · whiteboard-animation: trazos que se dibujan solos con la mano del marcador ----------
const Whiteboard: React.FC<{ u: number }> = ({ u }) => {
  const kiosco = [[60, 330], [60, 230], [200, 230], [200, 330], [60, 330], [60, 230], [50, 210], [210, 210], [200, 230]];
  const dib = ease((u - 0.9) / 1.2);
  const n = kiosco.length - 1, k = dib * n, i0 = Math.min(n - 1, Math.floor(k)), f = k - i0;
  const tip = [kiosco[i0][0] + (kiosco[i0 + 1][0] - kiosco[i0][0]) * f, kiosco[i0][1] + (kiosco[i0 + 1][1] - kiosco[i0][1]) * f];
  const pts = kiosco.slice(0, i0 + 1).map((p) => p.join(",")).join(" ") + ` ${tip[0]},${tip[1]}`;
  const lineas = [["$120.000", 2.1, "#111"], ["− $66.000", 2.6, "#444"], ["− $36.333", 3.0, "#444"], ["− $8.000", 3.4, "#444"], ["= $9.667", 4.0, "#c0261b"]] as const;
  let mano: [number, number] = [tip[0], tip[1]];
  lineas.forEach(([, a], j) => { const r = clamp((u - a) / 0.4, 0, 1); if (r > 0 && r < 1) mano = [215 + r * 110, 248 + j * 30]; });
  const circ = clamp((u - 4.5) / 0.6, 0, 1);
  if (circ > 0 && circ < 1) mano = [272 + Math.cos(circ * Math.PI * 2 - 1.6) * 58, 375 + Math.sin(circ * Math.PI * 2 - 1.6) * 20];
  return (
    <Lienzo fondo="#fbfbf8">
      <svg width={360} height={640} style={abs}>
        <polyline points={pts} fill="none" stroke="#111" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {dib >= 1 ? <path d="M80 250 h50 v40 h-50 z M150 260 v70" fill="none" stroke="#111" strokeWidth={2.5} strokeDasharray="1" pathLength={1} strokeDashoffset={1 - ease((u - 2.1) / 0.5)} /> : null}
        {circ > 0 ? <ellipse cx={272} cy={375} rx={58} ry={20} fill="none" stroke="#c0261b" strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - circ} /> : null}
      </svg>
      {lineas.map(([txt, a, col], j) => (
        <div key={j} style={{ ...abs, left: 215, top: 236 + j * 30, width: 130 * clamp((u - a) / 0.4, 0, 1), overflow: "hidden", whiteSpace: "nowrap", font: `400 22px ${MARKER}`, color: col }}>{txt}</div>
      ))}
      <div style={{ ...abs, left: 0, right: 0, top: 440, textAlign: "center", font: `400 20px ${MARKER}`, color: "#111", opacity: ease((u - 4.9) / 0.4) }}>Lo que te queda de verdad (ejemplo)</div>
      <svg width={80} height={90} style={{ ...abs, left: mano[0] - 6, top: mano[1] - 4 }} viewBox="0 0 80 90">
        <rect x={2} y={0} width={9} height={40} rx={3} fill="#1d4ed8" transform="rotate(-25 6 0)" />
        <path d="M14 30 q30 -10 46 10 q14 16 8 40 q-22 14 -44 4 q-12 -18 -10 -54 z" fill="#e7b89a" stroke="#b98468" strokeWidth={2} />
      </svg>
    </Lienzo>
  );
};

// ---------- 6 · diagram-animation: nodos, conexiones con datos que corren, cascada y número que cuenta ----------
const Diagram: React.FC<{ u: number }> = ({ u }) => {
  const nodos = [{ x: 180, y: 140, t: "CAJA", v: "$120.000", c: "#22c55e" }, { x: 70, y: 260, t: "MERCADERÍA", v: "−$66.000", c: "#f59e0b" }, { x: 180, y: 260, t: "ALQUILER Y LUZ", v: "−$36.333", c: "#3b82f6" }, { x: 290, y: 260, t: "COMISIONES", v: "−$8.000", c: "#a855f7" }];
  const ap = (i: number) => back((u - 0.9 - i * 0.25) / 0.35);
  const barras = [{ v: 120000, c: "#22c55e" }, { v: -66000, c: "#f59e0b" }, { v: -36333, c: "#3b82f6" }, { v: -8000, c: "#a855f7" }];
  let acc = 0;
  const cuenta = 9667 * ease((u - 4.2) / 1.0);
  return (
    <Lienzo fondo="#0b1220">
      <svg width={360} height={640} style={abs}>
        {[1, 2, 3].map((i) => {
          const k = ease((u - 1.7 - i * 0.15) / 0.5);
          return (
            <g key={i}>
              <line x1={180} y1={162} x2={nodos[i].x} y2={238} stroke="#334155" strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - k} />
              {k >= 1 ? <line x1={180} y1={162} x2={nodos[i].x} y2={238} stroke={nodos[i].c} strokeWidth={3} strokeDasharray="6 10" strokeDashoffset={-u * 40} /> : null}
            </g>
          );
        })}
        {barras.map((b, i) => {
          const k = ease((u - 2.6 - i * 0.25) / 0.5);
          const w = (Math.abs(b.v) / 120000) * 300 * k;
          const x = b.v > 0 ? 30 : 30 + ((acc + b.v) / 120000) * 300;
          const el = <rect key={i} x={b.v > 0 ? 30 : x + (Math.abs(b.v) / 120000) * 300 * (1 - k)} y={360 + i * 30} width={w} height={22} rx={4} fill={b.c} />;
          acc += b.v;
          return el;
        })}
        {u > 4.0 ? <rect x={30} y={480} width={(9667 / 120000) * 300 * ease((u - 4.0) / 0.4)} height={22} rx={4} fill="#ef4444" /> : null}
      </svg>
      {nodos.map((n, i) => (
        <div key={i} style={{ ...abs, left: n.x - 52, top: n.y - 22, width: 104, textAlign: "center", padding: "4px 2px", borderRadius: 10, background: "#111827", border: `2px solid ${n.c}`, transform: `scale(${ap(i)})`, opacity: Math.min(1, ap(i)) }}>
          <div style={{ font: `700 8px ${BODY}`, color: "#94a3b8", letterSpacing: ".08em" }}>{n.t}</div>
          <div style={{ font: `800 15px ${DISP}`, color: n.c }}>{n.v}</div>
        </div>
      ))}
      {u > 4.2 ? <div style={{ ...abs, left: 0, right: 0, top: 520, textAlign: "center", font: `800 40px ${DISP}`, color: "#fff" }}>{pesos(cuenta)}</div> : null}
      {u > 4.2 ? <div style={{ ...abs, left: 0, right: 0, top: 570, textAlign: "center", font: `700 12px ${BODY}`, color: "#94a3b8" }}>te quedaron · EJEMPLO</div> : null}
    </Lienzo>
  );
};

// ---------- 7 · explainer-video: problema → costo → idea, plano y amable, con rótulos tipo subtítulo ----------
const Explainer: React.FC<{ u: number }> = ({ u }) => {
  const paso = u < 2.6 ? 0 : u < 4.2 ? 1 : 2;
  const textos = ["La caja dice $120.000…", "pero se van $110.333 en gastos.", "Lo tuyo: $9.667. Eso es lo que importa."];
  const desliza = (a: number) => ease((u - a) / 0.5);
  return (
    <Lienzo fondo="#dff1e7">
      <div style={{ ...abs, left: -40 + 40 * desliza(0.9), top: 150, opacity: desliza(0.9) }}><Kiosco w={230} t={u} /></div>
      <div style={{ ...abs, left: 210, top: 330, transform: `scale(${back((u - 1.2) / 0.4)})` }}><Kiosquero w={110} t={u} ceno={paso === 1 ? 1 : 0} /></div>
      <div style={{ ...abs, left: 30, top: 380, transform: `scale(${back((u - 1.5) / 0.4)}) translateY(${paso === 1 ? Math.sin(u * 20) * 2 : 0}px)` }}><CajaRegistradora w={140} t={u} abierta={paso === 1 ? 1 : 0.3} /></div>
      {paso >= 1 ? ["−$66.000", "−$36.333", "−$8.000"].map((x, i) => (
        <div key={i} style={{ ...abs, left: 40 + i * 70, top: 360 - ease((u - 2.6 - i * 0.2) / 0.8) * 160, font: `800 15px ${DISP}`, color: "#b3261e", opacity: 1 - ease((u - 3.6 - i * 0.2) / 0.5) }}>{x}</div>
      )) : null}
      {paso === 2 ? <div style={{ ...abs, left: 0, right: 0, top: 90, textAlign: "center", font: `800 44px ${DISP}`, color: "#0e3b2a", transform: `scale(${back((u - 4.2) / 0.4)})` }}>$9.667</div> : null}
      <div style={{ ...abs, left: 20, right: 20, top: 560, textAlign: "center" }}>
        <span style={{ display: "inline-block", padding: "8px 12px", borderRadius: 12, background: "#0e3b2a", color: "#fff", font: `700 15px ${BODY}` }}>{textos[paso]}</span>
      </div>
      <Ejemplo top={600} color="#b9e0c4" />
    </Lienzo>
  );
};

// ---------- 8 · wrapped-video: resumen "tipo Wrapped": número gigante, top 3 y tarjeta para compartir ----------
const Wrapped: React.FC<{ u: number }> = ({ u }) => {
  const fondo = `linear-gradient(${160 + u * 8}deg, #ff2e88, #7b2ff7 55%, #1db954)`;
  const top = [["Mercadería", "$66.000"], ["Alquiler y luz", "$36.333"], ["Comisiones", "$8.000"]];
  return (
    <Lienzo fondo="#000">
      <div style={{ ...abs, inset: 0, background: fondo }} />
      {u < 2.3 ? (
        <>
          <div style={{ ...abs, left: 24, top: 140, font: `800 34px/1 ${DISP}`, color: "#fff", transform: `translateX(${(1 - ease((u - 0.9) / 0.4)) * -300}px)` }}>TU DÍA,<br />WRAPPED</div>
          <div style={{ ...abs, left: 24, top: 250, font: `800 72px/1 ${DISP}`, color: "#fff", letterSpacing: "-.04em" }}>{pesos(120000 * ease((u - 1.1) / 1.0))}</div>
          <div style={{ ...abs, left: 26, top: 330, font: `700 16px ${BODY}`, color: "#fff" }}>entraron a tu caja</div>
        </>
      ) : u < 4.1 ? (
        <>
          <div style={{ ...abs, left: 24, top: 120, font: `800 26px ${DISP}`, color: "#fff" }}>Adónde se fue</div>
          {top.map(([a, b], i) => (
            <div key={i} style={{ ...abs, left: 24, right: 24, top: 180 + i * 80, display: "flex", alignItems: "center", gap: 12, transform: `translateX(${(1 - ease((u - 2.4 - i * 0.25) / 0.35)) * 400}px)` }}>
              <div style={{ font: `800 46px ${DISP}`, color: "#1db954" }}>{i + 1}</div>
              <div><div style={{ font: `800 20px ${DISP}`, color: "#fff" }}>{a}</div><div style={{ font: `700 15px ${BODY}`, color: "#ffffffcc" }}>{b}</div></div>
            </div>
          ))}
        </>
      ) : (
        <div style={{ ...abs, left: 36, right: 36, top: 140, height: 360, borderRadius: 24, background: "#121212", padding: 20, transform: `rotate(-3deg) scale(${back((u - 4.1) / 0.4)})`, boxShadow: "0 20px 40px #0008" }}>
          <div style={{ font: `700 13px ${BODY}`, color: "#1db954", letterSpacing: ".1em" }}>TE QUEDARON</div>
          <div style={{ font: `800 64px/1.1 ${DISP}`, color: "#fff" }}>$9.667</div>
          <div style={{ font: `700 14px ${BODY}`, color: "#ffffffaa", marginTop: 10 }}>de $120.000 que entraron</div>
          <div style={{ font: `700 12px ${BODY}`, color: "#ffffff77", marginTop: 120 }}>En Claro · ejemplo</div>
        </div>
      )}
    </Lienzo>
  );
};

// ---------- 9 · hyperframes: bloque `rgb-glitch-text` del registro de HyperFrames (copias roja y cian que se corren de a pasos) ----------
const Glitch: React.FC<{ texto: string; u: number; a: number; size: number; tono: string }> = ({ texto, u, a, size, tono }) => {
  // receta del bloque: rojo −8px / cian +8px, 0,06 s, 5 repeticiones ida y vuelta, ease steps(1)
  const d = u - a;
  const on = d > 0 && d < 0.66 ? (Math.floor(d / 0.06) % 2 === 0 ? 1 : 0) : 0;
  const s: React.CSSProperties = { ...abs, inset: 0, font: `900 ${size}px/1 ${BODY}`, letterSpacing: "-0.04em", textAlign: "center" };
  return (
    <div style={{ position: "relative", height: size * 1.1 }}>
      <span style={{ ...s, color: "#ef4444", transform: `translateX(${-8 * on}px)` }}>{texto}</span>
      <span style={{ ...s, color: "#22d3ee", transform: `translateX(${8 * on}px)` }}>{texto}</span>
      <strong style={{ ...s, color: tono }}>{texto}</strong>
    </div>
  );
};
const Hyper: React.FC<{ u: number; f: number }> = ({ u, f }) => (
  <Lienzo fondo="#0a0a0f">
    <div style={{ ...abs, inset: 0, background: "repeating-linear-gradient(0deg, #ffffff07 0 2px, transparent 2px 4px)" }} />
    <div style={{ ...abs, left: 0, right: 0, top: 190 }}><Glitch texto={u < 3 ? "$120.000" : "$9.667"} u={u} a={u < 3 ? 1.0 : 3.0} size={62} tono="#fafafa" /></div>
    <div style={{ ...abs, left: 0, right: 0, top: 270, textAlign: "center", font: `700 14px ${BODY}`, color: "#a1a1aa", letterSpacing: ".2em" }}>{u < 3 ? "ENTRARON A LA CAJA" : "TE QUEDARON · EJEMPLO"}</div>
    <div style={{ ...abs, left: 0, right: 0, top: 360, textAlign: "center" }}>
      <span style={{ display: "inline-block", padding: "4px 10px", border: "1px solid #3f3f46", borderRadius: 6, font: `600 10px ${BODY}`, color: "#a1a1aa" }}>bloque del registro: rgb-glitch-text</span>
    </div>
    <div style={{ ...abs, inset: 0, opacity: 0.08, background: `radial-gradient(circle at ${(f * 37) % 360}px ${(f * 53) % 640}px, #fff 0 1px, transparent 2px)` }} />
  </Lienzo>
);

// ---------- 10 · countdown-video: dígitos que ruedan y un anillo que se vacía ----------
const Countdown: React.FC<{ u: number }> = ({ u }) => {
  const k = ease((u - 1.0) / 3.6);
  const valor = Math.round(120000 - (120000 - 9667) * k);
  const txt = pesos(valor);
  const r = 120, circ = 2 * Math.PI * r;
  return (
    <Lienzo fondo="#111">
      <svg width={360} height={640} style={abs}>
        <circle cx={180} cy={300} r={r} fill="none" stroke="#222" strokeWidth={14} />
        <circle cx={180} cy={300} r={r} fill="none" stroke={k < 0.9 ? "#22c55e" : "#ef4444"} strokeWidth={14} strokeDasharray={circ} strokeDashoffset={circ * (1 - valor / 120000)} transform="rotate(-90 180 300)" strokeLinecap="round" />
        {Array.from({ length: 60 }, (_, i) => <line key={i} x1={180 + Math.cos((i / 60) * Math.PI * 2) * 140} y1={300 + Math.sin((i / 60) * Math.PI * 2) * 140} x2={180 + Math.cos((i / 60) * Math.PI * 2) * (i % 5 ? 146 : 152)} y2={300 + Math.sin((i / 60) * Math.PI * 2) * (i % 5 ? 146 : 152)} stroke="#444" strokeWidth={2} />)}
      </svg>
      <div style={{ ...abs, left: 0, right: 0, top: 272, textAlign: "center", whiteSpace: "nowrap" }}>
        {txt.split("").map((ch, i) => {
          const rueda = /\d/.test(ch) && k > 0 && k < 1;
          return <span key={i} style={{ display: "inline-block", font: `800 46px ${DISP}`, color: "#fff", fontVariantNumeric: "tabular-nums", transform: rueda ? `translateY(${Math.sin(u * 40 + i) * 3}px)` : undefined, filter: rueda ? "blur(0.6px)" : undefined }}>{ch}</span>;
        })}
      </div>
      <div style={{ ...abs, left: 0, right: 0, top: 470, textAlign: "center", font: `700 14px ${BODY}`, color: "#aaa" }}>{k < 1 ? "se va yendo…" : "te quedaron (ejemplo)"}</div>
    </Lienzo>
  );
};

// ---------- 11 · motion-background: aurora en movimiento + constelación, con una tarjeta de vidrio ----------
const MotionBg: React.FC<{ u: number }> = ({ u }) => {
  const p = (a: number, s: number) => 50 + 30 * Math.sin(u * s + a);
  const fondo = `radial-gradient(circle at ${p(0, 0.7)}% ${p(1, 0.5)}%, #16a34a 0, transparent 45%), radial-gradient(circle at ${p(2, 0.6)}% ${p(3, 0.8)}%, #2563eb 0, transparent 50%), radial-gradient(circle at ${p(4, 0.5)}% ${p(5, 0.6)}%, #f5a524 0, transparent 45%), #06120c`;
  const pts = Array.from({ length: 34 }, (_, i) => [180 + Math.sin(u * 0.3 + i * 1.7) * 160 * rnd(i), 320 + Math.cos(u * 0.25 + i * 2.3) * 300 * rnd(i, 1)]);
  return (
    <Lienzo fondo="#06120c">
      <div style={{ ...abs, inset: 0, background: fondo, filter: "blur(18px)" }} />
      <svg width={360} height={640} style={abs}>
        {pts.map(([x, y], i) => pts.slice(i + 1).map(([x2, y2], j) => (Math.hypot(x - x2, y - y2) < 70 ? <line key={`${i}-${j}`} x1={x} y1={y} x2={x2} y2={y2} stroke="#ffffff" strokeOpacity={0.18} /> : null)))}
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.8} fill="#fff" opacity={0.7} />)}
      </svg>
      <div style={{ ...abs, left: 40, right: 40, top: 220, padding: 20, borderRadius: 20, background: "#ffffff1f", border: "1px solid #ffffff44", backdropFilter: "blur(6px)", textAlign: "center", transform: `translateY(${(1 - ease((u - 0.9) / 0.6)) * 30}px)`, opacity: ease((u - 0.9) / 0.6) }}>
        <div style={{ font: `700 13px ${BODY}`, color: "#ffffffcc" }}>De $120.000 que entraron</div>
        <div style={{ font: `800 56px ${DISP}`, color: "#fff" }}>$9.667</div>
        <div style={{ font: `700 13px ${BODY}`, color: "#ffffffcc" }}>son tuyos · ejemplo</div>
      </div>
    </Lienzo>
  );
};

// ---------- 12 · nuestro 3D actual (src/v8 + cine): caja registradora gigante con la plata adentro ----------
const Nuestro3D: React.FC<{ u: number }> = ({ u }) => {
  const queda = 1 - (1 - 9667 / 120000) * ease((u - 2.2) / 1.8);
  const ang = 0.6 - u * 0.12;
  return (
    <AbsoluteFill style={{ background: "#050505" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true }}>
        <Camara c={{ pos: [Math.sin(ang) * 3.0, 2.2 - u * 0.05, Math.cos(ang) * 3.0 + 0.3], target: [0, 1.25, 0.3], fov: 46 }} t={u} />
        <Estudio fondo="#08090b" niebla={[5, 14]} luz={0.35} calida={1.0} exposicion={0.9} />
        <KioscoInterior luz="#ffcf8a" />
        <group position={[0, 1.03, 0.25]}><CajaGigante cajon={0.55} lleno={queda} display={u < 3.9 ? "$120.000" : "$9.667"} color={u < 3.9 ? "#4dff9a" : "#ff6b5e"} /></group>
        <Cine t={u} foco={2.6} bloom={0.5} />
      </ThreeCanvas>
      <Lienzo fondo="transparent"><div style={{ ...abs, left: 0, right: 0, top: 540, textAlign: "center", font: `800 24px ${DISP}`, color: "#fff", textShadow: "0 3px 12px #000" }}>{u < 3.9 ? "Entraron $120.000" : "Te quedaron $9.667"}</div><Ejemplo top={580} /></Lienzo>
    </AbsoluteFill>
  );
};

const SONIDOS: [number, string, number][][] = [
  [[1.5, "click", 0.5], [3.0, "ding", 0.5], [3.4, "whoosh", 0.4]],
  [[0.9, "papel", 0.5], [3.0, "coins", 0.5], [3.1, "birome", 0.4]],
  [[0.95, "thump", 0.6], [3.1, "glitch", 0.5], [3.35, "thump", 0.7]],
  [[0.9, "metal", 0.4], [2.2, "whoosh", 0.4], [2.8, "whoosh", 0.4], [3.4, "whoosh", 0.4], [3.9, "ding", 0.5]],
  [[0.9, "marcador", 0.5], [2.1, "marcador", 0.4], [3.0, "marcador", 0.4], [4.0, "marcador", 0.5]],
  [[0.9, "click", 0.4], [1.8, "click", 0.4], [2.6, "click", 0.3], [4.2, "ding", 0.5]],
  [[0.9, "whoosh", 0.4], [2.6, "coins", 0.4], [4.2, "ding", 0.5]],
  [[0.9, "riser", 0.3], [2.4, "click", 0.4], [4.1, "thump", 0.6]],
  [[1.0, "glitch", 0.6], [3.0, "glitch", 0.6]],
  ...[[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => [1.0 + i * 0.26, "tic", 0.35] as [number, string, number])],
  [[0.9, "viento", 0.4]],
  [[0.9, "caja", 0.6], [3.9, "thump", 0.6]],
];

export const Muestrario: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.min(NOMBRES.length - 1, Math.floor(frame / (SEG * FPS_M)));
  const f = frame - n * SEG * FPS_M;
  const u = f / FPS_M;
  const tramos = [<Shotcraft u={u} />, <Painted u={u} f={f} />, <Kinetic u={u} />, <Isometric u={u} />, <Whiteboard u={u} />, <Diagram u={u} />, <Explainer u={u} />, <Wrapped u={u} />, <Hyper u={u} f={f} />, <Countdown u={u} />, <MotionBg u={u} />, <Nuestro3D u={u} />];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {tramos[n]}
      <Lienzo fondo="transparent"><Rotulo n={n} u={u} /></Lienzo>
      {/* música propia (pulso sintetizado) y efectos propios */}
      <Sequence from={0} durationInFrames={48 * FPS_M} layout="none"><Html5Audio src={staticFile("sfx/pulso.wav")} volume={0.09} /></Sequence>
      <Sequence from={48 * FPS_M} layout="none"><Html5Audio src={staticFile("sfx/pulso.wav")} volume={0.09} /></Sequence>
      {NOMBRES.map((_, i) => (
        <React.Fragment key={i}>
          <Sequence from={i * SEG * FPS_M} durationInFrames={2 * FPS_M} layout="none"><Html5Audio src={staticFile("sfx/whoosh.wav")} volume={0.5} /></Sequence>
          {(SONIDOS[i] ?? []).map(([a, s, v], j) => (
            <Sequence key={j} from={Math.round((i * SEG + a) * FPS_M)} durationInFrames={3 * FPS_M} layout="none"><Html5Audio src={staticFile(`sfx/${s}.wav`)} volume={v} /></Sequence>
          ))}
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};
