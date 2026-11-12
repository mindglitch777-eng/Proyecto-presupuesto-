import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { I, clamp, eIO, eIn, eOut, lin, spring, win } from "../lib/anim";
import { BODY, DISP, MARKER } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V5_01, palabrasDeRespaldo, tPalabra, type Palabra } from "../lib/guion";
import { Fondo, Grano, Vineta } from "../components/Capas";
import { Kiosco } from "../components/Kiosco";
import { Subtitulos } from "../components/Subtitulos";
import { Icono } from "../components/Iconos";
import { TextoCinetico } from "../escenas/Dolor";
import { ControlCamara, Pildora, useFuentesListas, type Cam } from "../v3/ElDueno";
import { AbanicoFuiYo, Pasillo } from "./ModelosPapel";
import type { VideoProps } from "../Video";

// V5-01 "Confesiones de un cuaderno de fiados": el cuaderno es el narrador (molde "Objeto que habla").
// Voz grave y lenta de Tomás; el video dura lo que dure la voz (modo "encadenar" de voz.py).
// Todos los momentos leen las palabras de la voz con tPalabra.

const g = GUION_V5_01;
const AZUL = "#1f3fbf";
const ROJO = "#FF2D3B";
const norm = (s: string) => s.toLowerCase().replace(/[¡!¿?.,…:;"]/g, "");

function tiempos(pal: Palabra[]) {
  const W = (n: number, pre: string, def: number) => tPalabra(pal, n, pre, def);
  const linea = (n: number) => pal.filter((p) => p.linea === n);
  const ini = (n: number) => (linea(n).length ? Math.min(...linea(n).map((p) => p.desde)) : g.lineas[n].desde);
  const fin = (n: number) => (linea(n).length ? Math.max(...linea(n).map((p) => p.hasta)) : g.lineas[n].hasta);
  const l = g.lineas.map((_, n) => ini(n));
  const e = g.lineas.map((_, n) => fin(n));
  return {
    l, e,
    fund: W(0, "fundiendo", e[0] - 0.6),
    anios: W(1, "años", l[1] + 1.8), once: W(1, "once", l[1] + 0.9), quien: W(1, "quién", l[1] + 4.5),
    marta: W(2, "marta", l[2]), dieciocho: W(2, "dieciocho", l[2] + 0.7), juan: W(2, "juan", l[2] + 1.6), siete: W(2, "siete", l[2] + 2.2),
    moto: W(2, "moto", l[2] + 3.4), nombre: W(2, "nombre", l[2] + 5.0),
    ciento: W(3, "ciento", l[3]), pesos: W(3, "pesos", l[3] + 1.4), cree: W(3, "cree", l[3] + 2.6),
    peor: W(4, "peor", l[4] + 1.5),
    aumento: W(5, "aumentó", l[5] + 4.0), vence: W(5, "vence", l[5] + 7.0), queda: W(5, "queda", l[5] + 9.0),
    anotos: pal.filter((p) => p.linea === 5 && norm(p.texto).startsWith("anoto")).map((p) => p.desde),
    fundio: W(6, "fundió", l[6] + 1.5), fui: W(7, "fui", l[7]),
    celular: W(8, "celular", l[8] + 1.4), cinco: W(8, "cinco", l[8] + 3.0), escondi: W(8, "escondí", l[8] + 5.0),
    jubilo: W(9, "jubiló", l[9]), merecia: W(9, "merecía", l[9] + 2.6), cuantos: W(9, "cuántos", l[9] + 3.4), comentalo: W(9, "comentalo", l[9] + 5.2),
  };
}
type T = ReturnType<typeof tiempos>;

// ---------- utilidades de "escritura a mano" ----------
const Tinta: React.FC<{ p: number; style: React.CSSProperties; children: React.ReactNode }> = ({ p, style, children }) => {
  const q = clamp(p, 0, 1);
  const m = `linear-gradient(90deg,#000 ${q * 100 - 7}%,transparent ${q * 100}%)`;
  return (
    <div style={{ whiteSpace: "nowrap", ...(q < 1 ? { WebkitMaskImage: m, maskImage: m } : {}), ...style }}>{children}</div>
  );
};

const HOJA: React.CSSProperties = { background: "#F4EBD3", backgroundImage: "repeating-linear-gradient(#F4EBD3 0 31px,#9FB6D6 31px 32px)" };

// ---------- escena 0: el cuaderno de frente sobre el mostrador ----------
const Frente: React.FC<{ t: number; T_: T; fijo?: boolean }> = ({ t, T_, fijo }) => {
  const p1 = fijo ? 0.55 : clamp(0.55 + 0.45 * (t / Math.max(0.6, T_.fund * 0.5)), 0, 1);
  const p2 = fijo ? 0 : clamp((t - T_.fund * 0.4) / Math.max(0.4, T_.fund + 0.15 - T_.fund * 0.4), 0, 1);
  const rojo = fijo ? 0 : clamp((t - T_.fund) / 0.18, 0, 1);
  const col = `rgb(${Math.round(31 + 224 * rojo)},${Math.round(63 - 18 * rojo)},${Math.round(191 - 132 * rojo)})`;
  return (
    <div style={{ inset: 0 }}>
      <div style={{ inset: 0, background: "radial-gradient(circle at 50% 30%,#3a2a1a,#120a05)" }} />
      <div style={{ left: 0, top: 150, width: 360, height: 440, filter: "blur(5px) brightness(.75)" }}>
        <Kiosco t={t} persiana={0} luz={1} productosQueFaltan={0} />
      </div>
      <div style={{ left: 0, right: 0, top: 560, height: 90, background: "linear-gradient(#8a5a33,#5b3a1d)", boxShadow: "0 -4px 0 #a87347 inset" }} />
      <div style={{ left: 12, top: 214, width: 336, height: 380, transform: "rotate(-2deg)", filter: "drop-shadow(0 24px 24px #000a)" }}>
        <div style={{ inset: 0, background: "#2C4A8C", borderRadius: "8px 14px 14px 8px" }} />
        <div style={{ left: 14, right: 8, top: 10, bottom: 14, borderRadius: 5, ...HOJA }}>
          <div style={{ left: 44, top: 0, bottom: 0, width: 2, background: "#e29a9a" }} />
          {Array.from({ length: 9 }, (_, i) => <i key={i} style={{ left: 10, top: 20 + i * 40, width: 16, height: 16, borderRadius: "50%", background: "#1a1208" }} />)}
          <div style={{ left: 50, top: 18, font: `400 15px ${MARKER}`, color: "#9a8a6a" }}>FIADOS</div>
          <Tinta p={p1} style={{ left: 54, top: 40, font: `400 50px/1 ${MARKER}`, color: col }}>TE ESTOY</Tinta>
          <Tinta p={p2} style={{ left: 54, top: 104, font: `400 50px/1 ${MARKER}`, color: col }}>FUNDIENDO</Tinta>
          {rojo > 0
            ? [70, 108, 156, 204, 236, 262].map((x, k) => (
                <i key={k} style={{ left: x, top: 164, width: 5, height: I(t, T_.fund + 0.08 + k * 0.06, T_.fund + 0.9 + k * 0.06, 0, 30 + (k % 3) * 16, eOut), background: ROJO, borderRadius: 3 }} />
              ))
            : null}
          <div style={{ right: 0, bottom: 0, width: 0, height: 0, borderLeft: "46px solid transparent", borderBottom: "46px solid #cdbb90" }} />
        </div>
      </div>
    </div>
  );
};

const Interrogante: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const a = T_.l[1] + 0.3, b = T_.fui + 0.7;
  const o = win(t, a, b, 0.25, 0.3);
  if (o <= 0) return null;
  const tachado = I(t, T_.fui, T_.fui + 0.25, 0, 1, eOut);
  return (
    <div style={{ right: 20, top: 66, opacity: o, transform: `rotate(${10 + Math.sin(t * 2) * 4}deg) translateY(${Math.sin(t * 2.6) * 3}px)` }}>
      <div style={{ position: "static", font: `400 96px/1 ${MARKER}`, color: ROJO, textShadow: "0 3px 0 #0006" }}>?</div>
      <i style={{ left: -8, top: 30, width: 70 * tachado, height: 7, background: "#111", borderRadius: 4, transform: "rotate(-24deg)" }} />
      <i style={{ left: -8, top: 56, width: 70 * tachado, height: 7, background: "#111", borderRadius: 4, transform: "rotate(18deg)" }} />
    </div>
  );
};

// ---------- fondo de papel y fichero de nombres ----------
const Papel: React.FC<{ gris?: number }> = ({ gris = 0 }) => (
  <div style={{ inset: 0, ...HOJA, filter: `grayscale(${gris}) brightness(${1 - 0.28 * gris})` }}>
    <div style={{ left: 40, top: 0, bottom: 0, width: 2, background: "#e29a9a" }} />
    <div style={{ left: 200, top: 420, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle,#7a4a1a00 58%,#7a4a1a55 74%,#5a341088 82%,#5a341000 100%)" }} />
    <div style={{ inset: 0, background: "radial-gradient(circle at 50% 45%,transparent 45%,#5a3a1a55 100%)" }} />
  </div>
);

const Fichero: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.l[2] - 0.15, T_.ciento + 0.3, 0.12, 0.2);
  if (o <= 0) return null;
  const cards = [
    { t0: T_.marta, tm: T_.dieciocho, nombre: "Doña Marta", monto: 18000 },
    { t0: T_.juan, tm: T_.siete, nombre: "Juan", monto: 7500 },
    { t0: T_.moto, tm: T_.nombre, nombre: "", monto: 0 },
  ];
  return (
    <div style={{ inset: 0, opacity: o }}>
      {cards.map((c, i) => {
        if (t < c.t0 - 0.3) return null;
        const sig = i < 2 ? cards[i + 1].t0 - 0.15 : 1e9;
        const flip = I(t, sig, sig + 0.4, 0, 1, eIn);
        if (flip >= 1) return null;
        const s = Math.min(1, spring(t - (c.t0 - 0.3), 12, 0.6));
        const monto = i < 2 ? I(t, c.tm, c.tm + 0.55, 0, c.monto, eOut) : 0;
        return (
          <div key={i} style={{ left: 22, right: 22, top: 150, height: 262, perspective: 900, zIndex: 10 - i, transform: `translateY(${(1 - s) * 80}px)`, opacity: s }}>
            <div style={{ inset: 0, borderRadius: 6, ...HOJA, boxShadow: "0 18px 30px #0007", transformOrigin: "50% 0", transform: `rotate(${(i - 1) * 1.6}deg) rotateX(${-flip * 105}deg)`, opacity: 1 - flip * 0.6 }}>
              <div style={{ left: 34, top: 0, bottom: 0, width: 2, background: "#e29a9a" }} />
              {i < 2 ? (
                <Tinta p={I(t, c.t0, c.t0 + 0.55, 0, 1, lin)} style={{ left: 48, top: 22, font: `400 46px/1 ${MARKER}`, color: AZUL }}>{c.nombre}</Tinta>
              ) : (
                <>
                  <svg width="260" height="70" style={{ left: 48, top: 18 }}>
                    <path d="M4 42 q16 -40 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0" fill="none" stroke={AZUL} strokeWidth="6" strokeLinecap="round" strokeDasharray="620" strokeDashoffset={620 * (1 - I(t, c.t0, c.t0 + 0.7, 0, 1, lin))} />
                  </svg>
                  <Tinta p={I(t, c.t0 + 0.4, c.t0 + 0.9, 0, 1, lin)} style={{ left: 50, top: 92, font: `400 22px/1 ${MARKER}`, color: "#6a5a3a" }}>(el de la moto)</Tinta>
                </>
              )}
              <Tinta p={I(t, c.tm, c.tm + 0.4, 0, 1, lin)} style={{ left: 48, top: 150, font: `400 70px/1 ${MARKER}`, color: AZUL, fontVariantNumeric: "tabular-nums" }}>
                {i < 2 ? ars(monto) : "¿?"}
              </Tinta>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Juntar: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.ciento - 0.1, T_.peor - 0.05, 0.05, 0.12);
  if (o <= 0) return null;
  const chips: [string, number, number][] = [["$18.000", 40, 230], ["$7.500", 190, 270], ["¿?", 110, 320]];
  const q = I(t, T_.ciento + 0.05, T_.ciento + 0.9, 0, 1, eIn);
  const grande = I(t, T_.ciento + 0.85, T_.pesos + 0.7, 0, 180000, eOut);
  const sg = Math.min(1.1, spring(t - (T_.ciento + 0.85), 13, 0.5));
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ inset: 0, background: "radial-gradient(circle at 50% 42%,#000000cc,#000000ee)", opacity: I(t, T_.ciento + 0.6, T_.ciento + 1.2, 0, 1) }} />
      {chips.map(([txt, x, y], i) => (
        <div key={i} style={{ left: x + (130 - x) * q, top: y + (250 - y) * q, font: `400 48px/1 ${MARKER}`, color: AZUL, opacity: 1 - I(t, T_.ciento + 0.7, T_.ciento + 0.95, 0, 1), transform: `scale(${1 - 0.4 * q}) rotate(${(i - 1) * 4 * (1 - q)}deg)` }}>{txt}</div>
      ))}
      {t >= T_.ciento + 0.8 ? (
        <>
          <div style={{ left: 0, right: 0, top: 205, textAlign: "center", font: `700 72px/1 ${DISP}`, color: "#FFB703", fontVariantNumeric: "tabular-nums", transform: `scale(${sg})`, textShadow: "0 5px 0 #000, 0 0 40px #FFB70088" }}>{ars(grande)}</div>
          <div style={{ left: 0, right: 0, top: 288, textAlign: "center", font: `400 26px/1 ${MARKER}`, color: "#F4EBD3", opacity: I(t, T_.pesos + 0.4, T_.pesos + 0.7, 0, 1) }}>ejemplo</div>
          <div style={{ left: 20, right: 20, top: 150, textAlign: "center", font: `800 12px ${BODY}`, letterSpacing: ".12em", color: "#ffffffcc", opacity: I(t, T_.cree, T_.cree + 0.2, 0, 1) }}>LO QUE ÉL CREE QUE VA A COBRAR</div>
        </>
      ) : null}
    </div>
  );
};

const Arrancada: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const a = T_.peor + 0.05, b = T_.l[5] + 0.2;
  const o = win(t, a, b, 0.04, 0.35);
  if (o <= 0) return null;
  const jx = Math.sin(t * 61) * 3, jy = Math.cos(t * 47) * 2, r = Math.sin(t * 38) * 1.6;
  const dentado = "polygon(0 6%,5% 0,10% 5%,16% 1%,22% 6%,29% 0,35% 5%,42% 1%,48% 6%,55% 0,62% 5%,69% 1%,76% 6%,83% 0,90% 5%,96% 1%,100% 5%,100% 100%,0 100%)";
  return (
    <div style={{ inset: 0, background: "#fff", opacity: o }}>
      <div style={{ left: 50, top: 210, width: 260, height: 330, clipPath: dentado, ...HOJA, transform: `translate(${jx}px,${jy}px) rotate(${-4 + r}deg)`, filter: "drop-shadow(0 14px 18px #0005)" }}>
        <div style={{ left: 30, top: 0, bottom: 0, width: 2, background: "#e29a9a" }} />
        <div style={{ left: 44, top: 70, font: `400 30px/1 ${MARKER}`, color: AZUL, opacity: 0.8 }}>Marta  18.000</div>
        <div style={{ left: 44, top: 112, font: `400 30px/1 ${MARKER}`, color: AZUL, opacity: 0.8 }}>Juan    7.500</div>
      </div>
    </div>
  );
};

const NoAnoto: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.l[5] - 0.2, T_.l[6] - 0.05, 0.25, 0.25);
  if (o <= 0) return null;
  const gris = I(t, T_.l[5], T_.e[5], 0, 1, lin);
  const n = T_.anotos.filter((a) => t >= a).length;
  const ultimo = n ? T_.anotos[n - 1] : 0;
  const etiquetas: [string, number][] = [["AUMENTO PROVEEDOR", T_.aumento], ["VENCIDOS", T_.vence], ["GANANCIA DEL DÍA", T_.queda]];
  return (
    <div style={{ inset: 0, opacity: o }}>
      <Papel gris={gris} />
      <div style={{ left: 54, top: 62, font: `400 40px/1 ${MARKER}`, color: ROJO, transform: `scale(${1 + 0.18 * Math.exp(-8 * (t - ultimo))})`, transformOrigin: "0 50%" }}>
        NO ANOTO <span style={{ position: "static", fontSize: 34, color: "#7a0010" }}>{"×".repeat(n)}</span>
      </div>
      {etiquetas.map(([txt, t0], i) => {
        if (t < t0 - 0.3) return null;
        const y = 150 + i * 130;
        const c = (((t - t0) % 1.5) + 1.5) % 1.5 / 1.5;
        const der = c < 0.5 ? c / 0.5 : 1, izq = c < 0.5 ? 0 : (c - 0.5) / 0.5;
        const m = `linear-gradient(90deg,transparent ${izq * 100}%,#000 ${izq * 100 + 4}%,#000 ${der * 100 - 4}%,transparent ${der * 100}%)`;
        return (
          <div key={i}>
            <Tinta p={I(t, t0 - 0.2, t0 + 0.45, 0, 1, lin)} style={{ left: 54, top: y, font: `400 25px/1 ${MARKER}`, color: AZUL }}>{txt}</Tinta>
            <i style={{ left: 50, top: y + 14, width: 270 * I(t, t0 + 0.5, t0 + 0.75, 0, 1, eOut), height: 5, background: ROJO, borderRadius: 3, transform: "rotate(-1deg)" }} />
            <i style={{ left: 54, top: y + 62, width: 250, height: 5, borderRadius: 3, background: AZUL, WebkitMaskImage: m, maskImage: m }} />
          </div>
        );
      })}
    </div>
  );
};

// ---------- 3D: pasillo de páginas y abanico "FUI YO" ----------
function cam3d(t: number, T_: T): Cam {
  if (t < T_.l[6] - 0.3) {
    const z = 7 - (t - T_.l[1]) * 2.3;
    return { pos: [Math.sin(t * 0.6) * 0.25, 2.1 + Math.sin(t * 0.9) * 0.08, z], target: [0, 2.0, z - 6], fov: 62 };
  }
  return { pos: [Math.sin(t * 0.5) * 0.15, 2.15, 8.4], target: [0, 2.05, 0], fov: 56 };
}

const Escena3D: React.FC<{ t: number; T_: T; listo: boolean }> = ({ t, T_, listo }) => {
  const c = cam3d(t, T_);
  const pasillo = t >= T_.l[1] - 0.25 && t < T_.l[2] + 0.2;
  const abanico = t >= T_.l[6] - 0.3 && t < T_.l[8];
  const p = I(t, T_.fundio + 0.05, T_.fui, 0, 1, lin);
  return (
    <>
      <ControlCamara c={c} />
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#ffe9c4", "#3a2412", 0.7]} />
      <directionalLight position={[3, 8, 9]} intensity={2.2} color="#fff0d0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
      <pointLight position={[0, 3, 4]} intensity={18} distance={14} color="#ffcf7a" />
      {pasillo ? <Pasillo listo={listo} /> : null}
      {abanico ? (
        <>
          <mesh position={[0, 2.1, -4]}>
            <planeGeometry args={[30, 20]} />
            <meshStandardMaterial color="#2a1a0e" roughness={1} />
          </mesh>
          <AbanicoFuiYo p={p} listo={listo} />
        </>
      ) : null}
    </>
  );
};

// ---------- el truco: celular, tinta que vuela y pantallas de En Claro ----------
const HILOS = ["M70 560 C 40 440, 120 420, 150 360", "M80 575 C 130 470, 200 480, 190 340", "M95 585 C 170 520, 250 470, 215 330", "M60 570 C 20 500, 90 380, 160 330", "M100 590 C 220 560, 280 400, 205 350"];

const Truco: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const ini = T_.l[8] - 0.3, fin = T_.l[9] - 0.15;
  const o = win(t, ini, fin, 0.1, 0.25);
  if (o <= 0) return null;
  const sp = spring(t - (T_.celular - 0.3), 11, 0.55);
  const A = win(t, T_.celular - 0.1, T_.cinco - 0.1, 0.12, 0.15);
  const B = win(t, T_.cinco - 0.1, T_.escondi - 0.1, 0.12, 0.15);
  const C = Math.min(1, I(t, T_.escondi - 0.1, T_.escondi + 0.2, 0, 1));
  const quedaron = I(t, T_.escondi, T_.escondi + 0.9, 0, 41200, eOut);
  return (
    <div style={{ inset: 0, opacity: o, background: "linear-gradient(#0b0b0b,#1a1208)" }}>
      <div style={{ inset: 0, background: "radial-gradient(circle at 50% 108%,#FFB703cc,#FF7A0055 38%,transparent 70%)", opacity: I(t, T_.l[8], T_.l[8] + 0.8, 0, 1) }} />
      <TextoCinetico t={t} desde={T_.celular - 0.1} paso={0.08} texto="Hablás y listo." amarillas={[2]} style={{ left: 20, right: 20, top: 66, font: `700 30px/1.05 ${DISP}`, color: "#fff" }} />
      {/* el cuaderno chiquito abajo, de donde sale la tinta */}
      <div style={{ left: 18, top: 520, width: 96, height: 112, background: "#2C4A8C", borderRadius: "5px 9px 9px 5px", transform: "rotate(-5deg)", boxShadow: "0 10px 20px #000a" }}>
        <div style={{ left: 8, right: 5, top: 6, bottom: 8, ...HOJA, borderRadius: 3 }} />
      </div>
      <svg width="360" height="640" style={{ left: 0, top: 0 }}>
        {HILOS.map((d, i) => {
          const a = I(t, T_.celular + 0.1 + i * 0.12, T_.celular + 0.9 + i * 0.12, 0, 1, eIO);
          return <path key={i} d={d} fill="none" stroke={AZUL} strokeWidth={4 - (i % 2)} strokeLinecap="round" strokeDasharray="420" strokeDashoffset={420 * (1 - a)} opacity={1 - I(t, T_.cinco, T_.cinco + 0.6, 0, 1)} />;
        })}
      </svg>
      <div style={{ left: 85, top: 124, width: 190, height: 400, perspective: 900, transform: `translateY(${(1 - sp) * 560}px) scale(${0.85 + 0.15 * sp})`, transformOrigin: "0 0" }}>
        <div style={{ inset: 0, borderRadius: 30, background: "#0b0b0b", boxShadow: "0 30px 60px #000c, 0 0 90px #FFB70055, inset 0 0 0 2px #2a2a2a", transform: `rotateY(${(1 - sp) * 50 - 8 + Math.sin(t) * 4}deg) rotateX(5deg)` }}>
          <div style={{ left: 8, top: 8, right: 8, bottom: 8, borderRadius: 23, overflow: "hidden", background: "#0E2A1C" }}>
            <div style={{ left: 60, right: 60, top: 6, height: 16, borderRadius: 9, background: "#000" }} />
            <div style={{ inset: 0, opacity: A }}>
              <div style={{ left: 14, top: 32, font: `700 13px ${DISP}`, color: "#fff" }}>Quién te debe</div>
              {[["Doña Marta · $18.000", "41 días", "#FF4D5A"], ["Juan · $7.500", "22 días", "#FFB703"], ["El de la moto · ¿?", "sin nombre", "#FF4D5A"]].map(([n, d, col], i) => (
                <div key={i} style={{ left: 10, right: 10, top: 58 + i * 58, height: 50, borderRadius: 12, background: "#143723", border: "1px solid #2f6a4b", padding: "7px 10px", opacity: Math.min(1, spring(t - T_.celular - 0.6 - i * 0.15)) }}>
                  <div style={{ position: "static", font: `700 11px ${DISP}`, color: "#fff" }}><Icono nombre="punto" size={10} color={col} />{n}</div>
                  <div style={{ position: "static", font: `600 9px ${BODY}`, color: "#9DB8A8", marginTop: 2 }}>Debe hace {d}</div>
                </div>
              ))}
              <div style={{ left: 10, right: 10, top: 240, padding: 10, borderRadius: 12, background: "#143723", border: "1px solid #2f6a4b" }}>
                <div style={{ position: "static", font: `600 9px ${BODY}`, color: "#9DB8A8", letterSpacing: ".08em" }}>TE DEBEN · EJEMPLO</div>
                <div style={{ position: "static", font: `700 22px/1.1 ${DISP}`, color: "#FFB703" }}>$180.000</div>
              </div>
            </div>
            <div style={{ inset: 0, opacity: B, background: "#0E2A1C" }}>
              <div style={{ left: 14, top: 32, font: `700 13px ${DISP}`, color: "#fff" }}>Precio sugerido</div>
              <div style={{ left: 10, right: 10, top: 62, padding: 12, borderRadius: 14, background: "#143723", border: "1px solid #2f6a4b" }}>
                <div style={{ position: "static", font: `700 10px ${BODY}`, color: "#ffffffaa" }}><Icono nombre="punto" size={10} color="#FFB703" />SUBIÓ 8%</div>
                <div style={{ position: "static", font: `700 15px ${DISP}`, color: "#fff" }}>Gaseosa 500</div>
                <div style={{ position: "static", font: `700 24px ${DISP}`, color: "#FFB703" }}>Vendela a $2.160</div>
              </div>
              <div style={{ left: 10, right: 10, top: 168, height: 90, borderRadius: 12, background: "#143723", border: "1px solid #2f6a4b", display: "flex", alignItems: "flex-end", gap: 5, padding: 10 }}>
                {[40, 55, 35, 70, 60, 80, 65].map((h, i) => <i key={i} style={{ position: "relative", flex: 1, height: `${h * Math.min(1, spring(t - T_.cinco - 0.1 - i * 0.04))}%`, borderRadius: 3, background: i === 5 ? "#FFB703" : "#2f6a4b" }} />)}
              </div>
            </div>
            <div style={{ inset: 0, opacity: C, background: "#0E2A1C" }}>
              <div style={{ left: 14, top: 32, font: `700 13px ${DISP}`, color: "#fff" }}>Cierre de hoy</div>
              <div style={{ left: 10, right: 10, top: 62, padding: 14, borderRadius: 14, background: "#143723", border: "1px solid #2f6a4b" }}>
                <div style={{ position: "static", font: `600 10px ${BODY}`, color: "#9DB8A8", textTransform: "uppercase", letterSpacing: ".08em" }}>Hoy te quedaron</div>
                <div style={{ position: "static", font: `700 34px/1.1 ${DISP}`, color: "#FFB703", fontVariantNumeric: "tabular-nums" }}>{ars(quedaron)}</div>
                <div style={{ position: "static", font: `600 10px ${BODY}`, color: "#5FD39A" }}>▲ ejemplo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- cierre: el cuaderno se jubila ----------
const Cierre: React.FC<{ t: number; T_: T; dur: number }> = ({ t, T_, dur }) => {
  const ini = T_.l[9] - 0.2;
  const o = win(t, ini, dur + 1, 0.2, 0.01);
  if (o <= 0) return null;
  const sc = Math.min(1.05, spring(t - ini, 12, 0.5));
  const cajon = I(t, T_.merecia - 0.2, T_.merecia + 0.45, 0, 1, eOut) * (1 - I(t, T_.cuantos + 0.9, T_.cuantos + 1.3, 0, 1, eIn));
  const entra = I(t, T_.cuantos - 0.2, T_.cuantos + 0.9, 0, 1, eIO);
  const etiqueta = I(t, T_.merecia, T_.merecia + 0.5, 0, 1, lin);
  const sb = spring(t - (T_.comentalo - 0.1), 16, 0.4);
  const sl = spring(t - (T_.cuantos - 0.1), 12, 0.45);
  return (
    <div style={{ inset: 0, opacity: o, background: "radial-gradient(circle at 50% 40%,#3a2a1a,#120a05)" }}>
      <div style={{ left: 18, top: 62, display: "flex", alignItems: "center", gap: 10, opacity: Math.min(1, sl), transform: `scale(${0.6 + 0.4 * sl})`, transformOrigin: "0 50%" }}>
        <div style={{ position: "relative", width: 38, height: 38, borderRadius: 10, background: "#FFB703", boxShadow: "0 0 28px #FFB70066" }}>
          <div style={{ left: 9, right: 9, top: 13, height: 4, borderRadius: 3, background: "#06140D" }} />
          <div style={{ left: 9, right: 14, top: 21, height: 4, borderRadius: 3, background: "#06140D" }} />
        </div>
        <div style={{ position: "static", font: `700 32px/1 ${DISP}`, letterSpacing: "-.02em", color: "#fff" }}>En Claro</div>
      </div>
      <TextoCinetico t={t} desde={T_.cuantos} paso={0.09} texto="¿Cuántos años tiene" amarillas={[]} style={{ left: 18, right: 10, top: 108, font: `700 29px/1.05 ${DISP}`, color: "#fff" }} />
      <TextoCinetico t={t} desde={T_.cuantos + 0.7} paso={0.09} texto="tu cuaderno?" amarillas={[1]} style={{ left: 18, right: 10, top: 144, font: `700 36px/1.05 ${DISP}`, color: "#fff" }} />
      {/* cuaderno cerrado con su etiqueta */}
      <div style={{ left: 110, top: 250 + entra * 190, width: 140, height: 190, opacity: 1 - I(t, T_.cuantos + 0.85, T_.cuantos + 1.15, 0, 1, lin), transform: `scale(${sc * (1 - 0.32 * entra)}) rotate(${-4 + entra * 4}deg)`, transformOrigin: "50% 0" }}>
        <div style={{ inset: 0, background: "#2C4A8C", borderRadius: "6px 12px 12px 6px", boxShadow: "0 22px 34px #000a" }} />
        <div style={{ left: 14, right: 12, top: 26, height: 42, background: "#F4EBD3", borderRadius: 3, display: "grid", placeItems: "center", font: `700 14px ${DISP}`, color: "#2C4A8C", letterSpacing: ".08em" }}>FIADOS</div>
        <div style={{ left: 12, right: 10, top: 92, padding: "8px 6px", background: "#F4EBD3", borderRadius: 3, transform: `rotate(-3deg) scale(${etiqueta})`, opacity: etiqueta, boxShadow: "0 3px 6px #0006" }}>
          <div style={{ position: "static", font: `400 17px/1.15 ${MARKER}`, color: "#1f3fbf", textAlign: "center" }}>2015 – 2026.<br />Descansa en paz.</div>
        </div>
      </div>
      {/* cajón */}
      <div style={{ left: 40, top: 640 - 200 * cajon, width: 280, height: 150, borderRadius: 8, background: "linear-gradient(#8a5a33,#6b4325)", boxShadow: "0 -8px 20px #000a, inset 0 3px 0 #a87347" }}>
        <div style={{ left: 100, top: 44, width: 80, height: 14, borderRadius: 7, background: "#d9c9a0" }} />
      </div>
      <Pildora texto="COMENTALO" style={{ left: 18, top: 196, transform: `scale(${sb})`, transformOrigin: "0 50%" }} />
      <div style={{ left: 40, right: 40, top: 500, padding: 12, borderRadius: 999, background: "#FFB703", textAlign: "center", font: `900 15px ${BODY}`, color: "#1A1200", boxShadow: "0 10px 30px #FFB70055", opacity: Math.min(1, sb), transform: `scale(${0.85 + 0.15 * sb})` }}>
        <span style={{ position: "static" }}>Probalo gratis · link en el perfil</span>
      </div>
    </div>
  );
};

export const Confesiones: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const listo = useFuentesListas();
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T_ = tiempos(pal);

  // el cuaderno de frente: entra al principio y vuelve en el último segundo (loop con el cuadro 0)
  const zoom = I(t, T_.l[1] - 0.15, T_.l[1] + 0.55, 0, 1, eIn);
  const frente = 1 - zoom;
  const loop = I(t, dur - 1.1, dur - 0.35, 0, 1, eIO);

  // golpes
  let hs = 0, wf = 0, red = 0;
  { const d = t - T_.fund; if (d >= 0) { hs += 18 * Math.exp(-14 * d) * Math.sin(70 * d); wf += Math.max(0, 1 - d / 0.15) * 0.45; red += Math.max(0, 1 - d / 0.35); } }
  if (t < 0.1) wf += 0.25;
  { const d = t - T_.peor; if (d >= 0) hs += 8 * Math.exp(-12 * d) * Math.sin(60 * d); }
  { const d = t - T_.fui; if (d >= 0) { hs += 20 * Math.exp(-9 * d) * Math.sin(66 * d); wf += Math.max(0, 1 - d / 0.25) * 0.5; } }
  [T_.cuantos + 0.9].forEach((a) => { const d = t - a; if (d > 0) hs += 7 * Math.exp(-12 * d) * Math.sin(60 * d); });
  const lk = Math.max(win(t, T_.escondi + 0.3, T_.escondi + 1.2, 0.2, 0.6) * 0.6, win(t, T_.l[8], T_.l[8] + 1.2, 0.3, 0.8) * 0.35);

  const sonidos = [
    ...g.sonidos,
    { en: 0.0, sfx: "birome" }, { en: 0.8, sfx: "birome" }, { en: 1.55, sfx: "birome" }, { en: T_.fund, sfx: "slam" }, { en: T_.fund + 0.05, sfx: "thump" },
    { en: T_.l[1] + 0.1, sfx: "hoja" }, { en: T_.once, sfx: "reloj" },
    ...[T_.marta, T_.juan, T_.moto].map((a) => ({ en: a - 0.15, sfx: "hoja" })),
    ...[T_.dieciocho, T_.siete].flatMap((a) => [0, 1, 2, 3].map((k) => ({ en: a + 0.12 * k, sfx: "tic" }))),
    { en: T_.ciento - 0.4, sfx: "riser" }, { en: T_.ciento + 0.85, sfx: "thump" }, { en: T_.pesos + 0.7, sfx: "caja" },
    { en: T_.peor - 0.05, sfx: "papel_arrancado" },
    ...T_.anotos.slice(0, 4).map((a) => ({ en: a, sfx: "birome" })), { en: T_.aumento, sfx: "heart" }, { en: T_.queda, sfx: "heart" },
    { en: T_.fundio + 0.1, sfx: "hoja" }, { en: T_.fundio + 0.3, sfx: "hoja" },
    { en: T_.fui, sfx: "boveda" },
    { en: T_.celular - 0.35, sfx: "whoosh" }, { en: T_.celular + 0.1, sfx: "tinta" }, { en: T_.cinco, sfx: "whoosh" }, { en: T_.escondi + 0.1, sfx: "caja" }, { en: T_.escondi + 0.1, sfx: "coins" },
    { en: T_.merecia - 0.2, sfx: "cajon" }, { en: T_.cuantos + 0.9, sfx: "cajon" }, { en: T_.comentalo, sfx: "ding" },
  ];

  const dos = <Fondo t={t} />;
  void dos;
  return (
    <AbsoluteFill style={{ background: "#120a05" }}>
      <style>{`.stage *{position:absolute;box-sizing:border-box} .stage{font-family:${BODY};color:#fff}`}</style>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${hs * 3}px,${hs * 1.6}px)` }}>
        <div className="stage" style={{ position: "absolute", left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" }}>
          <div style={{ inset: 0, background: "radial-gradient(circle at 50% 35%,#5a3b22,#1b1008 75%)" }} />
          {/* papel de fondo para el fichero, la suma y los renglones */}
          {t >= T_.l[2] - 0.2 && t < T_.l[5] + 0.3 ? <div style={{ inset: 0, opacity: win(t, T_.l[2] - 0.2, T_.l[5] + 0.3, 0.2, 0.3) }}><Papel /></div> : null}
        </div>
        <div style={{ position: "absolute", inset: 0, opacity: win(t, T_.l[1] - 0.3, T_.l[2] + 0.25, 0.3, 0.3) + win(t, T_.l[6] - 0.3, T_.l[8] - 0.05, 0.2, 0.25) }}>
          <ThreeCanvas width={1080} height={1920} shadows gl={{ alpha: true, antialias: true }} camera={{ fov: 60, near: 0.1, far: 200 }}>
            <Escena3D t={t} T_={T_} listo={listo} />
          </ThreeCanvas>
        </div>
        <div className="stage" style={{ position: "absolute", left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" }}>
          {frente > 0.01 ? (
            <div style={{ inset: 0, opacity: frente, transform: `scale(${1 + zoom * 5})`, transformOrigin: "50% 62%" }}>
              <Frente t={t} T_={T_} />
            </div>
          ) : null}
          {t < T_.l[1] + 0.8 ? <Pildora texto="KIOSQUERO:" style={{ left: 18, top: 62, transform: "rotate(-3deg)", opacity: win(t, -1, T_.l[1] + 0.2, 0.01, 0.4) }} /> : null}
          <Interrogante t={t} T_={T_} />
          {t >= T_.l[1] && t < T_.l[2] + 0.2 ? (
            <div style={{ inset: 0, opacity: win(t, T_.l[1], T_.l[2] + 0.2, 0.2, 0.2) }}>
              <div style={{ left: 0, right: 0, top: 0, height: 150, background: "linear-gradient(#000c,transparent)" }} />
              <Tinta p={I(t, T_.once - 0.1, T_.once + 0.7, 0, 1, lin)} style={{ left: 20, top: 70, font: `400 44px/1 ${MARKER}`, color: "#F4EBD3", textShadow: "0 3px 0 #000" }}>11 años</Tinta>
            </div>
          ) : null}
          <Fichero t={t} T_={T_} />
          <Juntar t={t} T_={T_} />
          <Arrancada t={t} T_={T_} />
          <NoAnoto t={t} T_={T_} />
          <Truco t={t} T_={T_} />
          <Cierre t={t} T_={T_} dur={dur} />
          {loop > 0.01 ? (
            <div style={{ inset: 0, opacity: loop }}>
              <Frente t={t} T_={T_} fijo />
            </div>
          ) : null}
          <Grano frame={frame} />
          <Vineta />
          {lk > 0 ? <div style={{ inset: -40, mixBlendMode: "screen", opacity: lk, background: "radial-gradient(circle at 50% 100%, #FFB703ee, #FF7A00aa 30%, transparent 65%)" }} /> : null}
          <div style={{ inset: 0, background: "#FF4D5A", opacity: Math.min(0.28, red * 0.25) }} />
          <div style={{ inset: 0, background: "#fff", opacity: clamp(wf, 0, 0.6) }} />
          <Subtitulos t={t} tv={t} g={g} palabras={pal} ocultos={[[-1, T_.fund + 0.9], [T_.peor - 0.1, T_.l[5] - 0.1], [T_.fui - 0.4, T_.fui + 1.4], [T_.comentalo - 0.1, 999]]} />
        </div>
      </div>

      {voz ? <Html5Audio src={staticFile(voz)} /> : null}
      {sonidos.map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.en * fps))} durationInFrames={Math.round(5 * fps)} layout="none">
          <Html5Audio src={staticFile(`sfx/${s.sfx}.wav`)} volume={0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
