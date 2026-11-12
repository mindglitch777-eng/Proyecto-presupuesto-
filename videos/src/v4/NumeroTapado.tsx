import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { I, clamp, eIO, eIn, eOut, lin, spring, win } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V4_01, palabrasDeRespaldo, tPalabra, type Palabra } from "../lib/guion";
import { Fondo, Grano, Vineta } from "../components/Capas";
import { Subtitulos } from "../components/Subtitulos";
import { TextoCinetico } from "../escenas/Dolor";
import { Kiosco3D, Piso } from "../v3/Modelos3D";
import { ControlCamara, Pildora, mixV, useFuentesListas, type Cam } from "../v3/ElDueno";
import { Boleta, Cinta, NumeroAerosol, TrozoCinta } from "./ModelosNumero";
import type { VideoProps } from "../Video";

// Video v4-01: "El número tapado" (33 s, 3D). Loop abierto: el número está tapado con cinta en la persiana
// durante todo el video, se destapa de a pedazos y la revelación llega a los ~20 s. Todos los momentos leen las
// palabras de Tomás desde `palabras`; sin voz usan tiempos de respaldo.
//
// Cuentas de ejemplo: alquiler $450.000 + luz $140.000 + sueldo $500.000 = $1.090.000 · ÷ 30 = $36.333 por día.

const g = GUION_V4_01;
type V3 = [number, number, number];
const GOLPES = [0, 0.35];
const SELLO = 1.75;
const MONTOS = [450000, 140000, 500000];
const NUMERO_DIA = 36333;
const HOY = 41200;

function tiempos(pal: Palabra[]) {
  const l1 = tPalabra(pal, 1, "lo", 3.7);
  const dif = {
    l1,
    al: tPalabra(pal, 1, "al", l1 + 0.9),
    destapo: tPalabra(pal, 1, "destapo", 5.3),
    vas: tPalabra(pal, 1, "vas", 6.2),
    vendes: tPalabra(pal, 2, "vendés", 9.0),
    tenes: tPalabra(pal, 2, "tenés", 10.0),
    caja: tPalabra(pal, 2, "caja", 10.9),
    reg: tPalabra(pal, 3, "es", 12.0),
    antes: tPalabra(pal, 3, "antes", 13.4),
    persiana: tPalabra(pal, 3, "persiana", 14.4),
    alq: tPalabra(pal, 4, "alquiler", 15.9),
    luz: tPalabra(pal, 4, "luz", 16.6),
    sueldo: tPalabra(pal, 4, "sueldo", 17.2),
    div: tPalabra(pal, 4, "divididos", 18.0),
    si: tPalabra(pal, 5, "si", 21.0),
    l6: tPalabra(pal, 6, "en", 25.0),
    pasaste: tPalabra(pal, 6, "pasaste", 28.0),
    final: tPalabra(pal, 7, "comentá", 30.0),
  };
  return { ...dif, p0: dif.destapo + 0.15, p1: dif.persiana + 0.1, rev: Math.max(dif.si - 0.8, dif.div + 1.1) };
}
type T = ReturnType<typeof tiempos>;
const hb = (T_: T) => [T_.alq, T_.luz, T_.sueldo, T_.div];

function camara(t: number, T_: T): Cam {
  let pos: V3 = [I(t, 0, T_.reg, 0, 0.5, lin), I(t, 0, T_.reg, 3.0, 3.1, lin), I(t, 0, T_.reg, 8.2, 7.6, lin)];
  let tar: V3 = [0, 3.3, 0];
  const z1 = I(t, T_.antes - 0.3, T_.antes + 0.6, 0, 1, eIO);
  pos = mixV(pos, [0, 2.6, 6.6], z1);
  tar = mixV(tar, [0, 2.3, 1.2], z1);
  const z2 = I(t, T_.rev, T_.rev + 0.9, 0, 1, eOut);
  pos = mixV(pos, [0, 2.8, 7.2], z2);
  tar = mixV(tar, [0, 2.9, 1.0], z2);
  const z3 = I(t, T_.l6 - 0.2, T_.l6 + 0.8, 0, 1, eIO);
  pos = mixV(pos, [0, 3.0, 9.6], z3);
  tar = mixV(tar, [0, 2.9, 0], z3);
  const z4 = I(t, T_.final - 0.4, T_.final + 0.8, 0, 1, eIO);
  pos = mixV(pos, [0, 3.0, 8.2], z4);
  tar = mixV(tar, [0, 3.3, 0], z4);
  return { pos, target: tar, fov: 56 };
}

// parches de cinta: [desde x, hasta x, giro]. Los dos primeros se despegan solos; los otros tres son una sola lámina.
const PARCHES: [number, number, number][] = [[-1.55, -0.52, 0.05], [-0.6, -0.05, -0.04], [-0.1, 0.5, 0.03], [0.4, 1.0, -0.05], [0.9, 1.55, 0.04]];

const Escena3D: React.FC<{ t: number; T_: T; listo: boolean }> = ({ t, T_, listo }) => {
  const c = camara(t, T_);
  const H = hb(T_);
  const hits = H.filter((h) => t >= h).length;
  const pulso = Math.pow(Math.max(0, Math.sin(t * 6.5)), 3);
  const numero = t >= T_.final - 0.3 ? "$??.???" : "$36.333";
  const tiembla = t > T_.l1 ? 0.012 * Math.sin(t * 25) : 0;

  const cintas = PARCHES.map(([x0, x1, rz], i) => {
    const cx = (x0 + x1) / 2, ancho = x1 - x0 + 0.12;
    let p = 0, alpha = 1, escala = 1, lift = 0;
    if (t >= T_.final) {
      const a = clamp((t - (T_.final + 0.1 + i * 0.08)) / 0.1, 0, 1);
      alpha = a;
      escala = 1 + 0.5 * (1 - a);
    } else if (i === 0) p = clamp((t - T_.p0) / 0.6, 0, 1);
    else if (i === 1) p = clamp((t - T_.p1) / 0.6, 0, 1);
    else p = clamp((t - (T_.rev + (i - 2) * 0.04)) / 0.45, 0, 1);
    if (i >= 2) lift = hits * 0.16 + (hits > 0 ? 0.05 * Math.sin(t * 9 + i) : 0);
    return <Cinta key={i} cx={cx} ancho={ancho} rotZ={rz + tiembla * (i % 2 ? 1 : -1)} p={p} tiron={i >= 2} lift={lift} alpha={alpha} escala={escala} />;
  });

  // trocitos de cinta que salen volando con cada boleta
  const trozos: React.ReactNode[] = [];
  for (let k = 0; k < 3; k++) {
    const age = t - H[k];
    if (age < 0 || age > 0.9) continue;
    trozos.push(<TrozoCinta key={k} opacidad={1 - age / 0.9} position={[1.1 + age * 1.8 + k * 0.1, NUM_Y_BIT + k * 0.2 + age * 1.5 - 4.5 * age * age, 1.5 + age * 1.2]} rot={[age * 6, age * 4, age * 8 + k]} />);
  }

  // boletas que caen sobre la persiana
  const boletas: React.ReactNode[] = [];
  const XK = [-0.9, 0.1, 0.95, 0];
  for (let k = 0; k < 4; k++) {
    const h = H[k];
    if (t < h - 0.5 || t > h + 1.3) continue;
    const target: V3 = [XK[k], 2.3, 1.5];
    let pos: V3, rot: V3, op = 1;
    if (t < h) {
      const p = (t - (h - 0.5)) / 0.5, e = eIn(p);
      pos = [target[0] + 0.4 * (1 - e), 7.2 + (target[1] - 7.2) * e, 2.4 + (target[2] - 2.4) * e];
      rot = [-0.35, 0, (k - 1) * 0.12 + (1 - p) * 0.8];
    } else {
      const age = t - h, caida = Math.max(0, age - 0.45);
      pos = [target[0] + 0.03 * Math.sin(age * 40) * Math.exp(-6 * age), target[1] - 7 * caida * caida, target[2]];
      rot = [-0.35 - caida, 0, (k - 1) * 0.12 + caida * 1.2];
      op = 1 - clamp((age - 0.7) / 0.6, 0, 1);
    }
    boletas.push(<Boleta key={k} k={k} position={pos} rot={rot} opacidad={op} listo={listo} />);
  }

  return (
    <>
      <ControlCamara c={c} />
      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#bcd0ff", "#3a2a1a", 0.6]} />
      <directionalLight position={[4, 9, 8]} intensity={2.4} color="#fff1dc" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-bias={-0.0004} />
      <directionalLight position={[-5, 4, -6]} intensity={0.8} color="#5FD39A" />
      <Piso />
      <Kiosco3D persiana={0.7} luz={1} fuentesListas={listo} />
      <NumeroAerosol texto={numero} pulso={pulso} listo={listo} />
      {cintas}
      {trozos}
      {boletas}
    </>
  );
};
const NUM_Y_BIT = 2.4;

// ---------- capas 2D ----------
const Gancho: React.FC<{ t: number; hs: number }> = ({ t, hs }) => {
  if (t > 3.6) return null;
  const L = g.ganchos[0].lineas;
  return (
    <div style={{ inset: 0, opacity: win(t, -1, 3.55, 0.01, 0.25) }}>
      <div style={{ left: 0, right: 0, top: 0, height: 240, background: "linear-gradient(#000e,#000b 65%,transparent)" }} />
      <Pildora texto="KIOSQUERO:" style={{ left: 18, top: 62, transform: `scale(${0.6 + 0.4 * Math.min(1, spring(t + 0.2, 16, 0.4))}) rotate(-3deg)` }} />
      {L.map((l, i) => {
        const a = i < 2 ? GOLPES[i] : SELLO;
        const q = I(t, a, a + 0.13, 0, 1, eOut);
        const gl = i === 2 && t > a && t < a + 0.35;
        const size = Math.min(i === 2 ? 44 : 46, Math.floor(326 / (l.length * 0.66)));
        return (
          <div
            key={i}
            style={{
              left: 18, right: 10, top: i === 2 ? 188 : 92 + i * 42, whiteSpace: "nowrap", transformOrigin: "0 50%",
              font: `700 ${size}px/1 ${DISP}`, letterSpacing: "-.02em", color: i === 2 ? "#FF2D3B" : "#fff",
              opacity: t >= a ? 1 : 0,
              transform: `translate(${hs * 0.5}px,0) scale(${2.6 - 1.6 * q}) rotate(${i === 2 ? -4 : 0}deg) skewX(${gl ? Math.sin(t * 90) * 12 : 0}deg)`,
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

const Promesa: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, 3.6, T_.vendes - 0.35, 0.05, 0.25);
  if (o <= 0) return null;
  const s = Math.min(1.1, spring(t - T_.vas, 15, 0.4));
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 215, background: "linear-gradient(#000d,#0009 65%,transparent)" }} />
      <TextoCinetico t={t} desde={T_.l1} paso={0.1} texto="Lo tapé." amarillas={[]} style={{ left: 20, right: 20, top: 62, font: `700 38px/1.05 ${DISP}`, color: "#fff" }} />
      <TextoCinetico t={t} desde={T_.al} paso={0.1} texto="Al final, lo destapo." amarillas={[3]} style={{ left: 20, right: 20, top: 108, font: `700 29px/1.05 ${DISP}`, color: "#fff" }} />
      {t >= T_.vas ? <Pildora texto="VAS A QUERER SABER EL TUYO" style={{ left: 20, top: 150, transform: `scale(${s}) rotate(-2deg)`, transformOrigin: "0 50%" }} /> : null}
    </div>
  );
};

const Descartes: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.vendes - 0.3, T_.reg - 0.3, 0.05, 0.2);
  if (o <= 0) return null;
  const filas: [number, string, string, number][] = [[T_.vendes - 0.1, "$100.000", "vendidos", T_.vendes + 0.55], [T_.tenes - 0.05, "$40.000", "en la caja", T_.caja + 0.2]];
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 200, background: "linear-gradient(#000d,#0009 65%,transparent)" }} />
      <div style={{ right: 16, top: 66, font: `600 10px ${BODY}`, letterSpacing: ".1em", color: "#ffffff88", border: "1px solid #ffffff44", borderRadius: 5, padding: "2px 6px", textTransform: "uppercase" }}>ejemplo</div>
      {filas.map(([a, num, lbl, tach], i) => {
        const s = Math.min(1.05, spring(t - a, 15, 0.45));
        const x = I(t, tach, tach + 0.18, 0, 1, eOut);
        return (
          <div key={i} style={{ left: 20, top: 66 + i * 56, opacity: Math.min(1, s * 2), transform: `translateX(${(1 - s) * -60}px)`, whiteSpace: "nowrap" }}>
            <span style={{ position: "static", font: `700 44px/1 ${DISP}`, color: x > 0.5 ? "#ffffff88" : "#fff", fontVariantNumeric: "tabular-nums", textShadow: "0 3px 0 #000" }}>{num}</span>
            <span style={{ position: "static", font: `800 15px ${BODY}`, color: "#ffffffbb", marginLeft: 8 }}>{lbl}</span>
            <i style={{ left: -6, top: 24, width: 250 * x, height: 6, background: "#FF2D3B", borderRadius: 3, transform: "rotate(-3deg)", boxShadow: "0 0 12px #FF2D3B" }} />
          </div>
        );
      })}
    </div>
  );
};

const Fijos: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.alq - 0.6, T_.rev - 0.15, 0.2, 0.2);
  if (o <= 0) return null;
  let fijos = 0;
  [T_.alq, T_.luz, T_.sueldo].forEach((h, i) => (fijos += I(t, h, h + 0.3, 0, MONTOS[i], eOut)));
  const dividido = t >= T_.div;
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 200, background: "linear-gradient(#000d,#0009 65%,transparent)" }} />
      <div style={{ left: 20, top: 62, font: `800 11px ${BODY}`, letterSpacing: ".12em", color: "#ffffffcc" }}>GASTOS FIJOS DEL MES <span style={{ position: "static", color: "#ffffff88", fontSize: 9 }}>· EJEMPLO</span></div>
      <div style={{ left: 20, top: 78, font: `700 48px/1 ${DISP}`, fontVariantNumeric: "tabular-nums", color: "#FF4D5A", textShadow: "0 4px 0 #000" }}>{ars(fijos)}</div>
      {dividido ? (
        <div style={{ left: 20, top: 138, font: `700 30px/1 ${DISP}`, color: "#FFB703", transform: `scale(${Math.min(1.1, spring(t - T_.div, 15, 0.4))})`, transformOrigin: "0 50%", textShadow: "0 3px 0 #000" }}>÷ 30 días = <span style={{ position: "static", color: "#fff" }}>¿?</span></div>
      ) : null}
    </div>
  );
};

const Revelacion: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.rev, T_.l6 + 0.2, 0.01, 0.35);
  if (o <= 0) return null;
  const q = I(t, T_.rev, T_.rev + 0.16, 0, 1, eOut);
  const gl = t > T_.rev && t < T_.rev + 0.3;
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 215, background: "linear-gradient(#000e,#000b 65%,transparent)" }} />
      <div style={{ left: 20, top: 60, font: `800 12px ${BODY}`, letterSpacing: ".14em", color: "#FFB703" }}>TU NÚMERO <span style={{ position: "static", color: "#ffffff88", fontSize: 9 }}>· EJEMPLO</span></div>
      <div style={{ left: 18, top: 74, font: `700 76px/1 ${DISP}`, color: "#FFB703", fontVariantNumeric: "tabular-nums", transformOrigin: "0 50%", transform: `scale(${2.4 - 1.4 * q}) skewX(${gl ? Math.sin(t * 90) * 8 : 0}deg)`, filter: `blur(${(1 - q) * 6}px)`, textShadow: gl ? `${Math.sin(t * 70) * 6}px 0 #00E5FF,0 5px 0 #000` : "0 5px 0 #000, 0 0 36px #FFB70099" }}>{ars(NUMERO_DIA)}</div>
      <div style={{ left: 20, top: 156, font: `700 34px/1 ${DISP}`, color: "#fff", opacity: I(t, T_.rev + 0.2, T_.rev + 0.35, 0, 1), textShadow: "0 4px 0 #000" }}>POR DÍA</div>
    </div>
  );
};

const Truco: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const ini = T_.l6, fin = T_.final - 0.5;
  if (t < ini - 0.1 || t > fin + 0.7) return null;
  const sp = spring(t - ini, 11, 0.55);
  const sale = I(t, fin, fin + 0.6, 0, 1, eIn);
  const fill = I(t, T_.pasaste - 1.0, T_.pasaste + 0.5, 0, HOY / NUMERO_DIA, eOut);
  const pasado = fill >= 1;
  return (
    <>
      <div style={{ left: 0, right: 0, top: 0, height: 205, background: "linear-gradient(#000d,#0009 65%,transparent)", opacity: win(t, ini, fin + 0.5, 0.1, 0.2) }} />
      <div style={{ left: 20, top: 62, font: `800 12px ${BODY}`, letterSpacing: ".12em", color: "#FFB703", opacity: win(t, ini, fin + 0.5, 0.2, 0.2) }}>EN CLARO</div>
      <TextoCinetico t={t} desde={ini + 0.1} paso={0.08} texto="Tu número, todos los días." amarillas={[1]} style={{ left: 20, right: 14, top: 80, font: `700 27px/1.05 ${DISP}`, color: "#fff", opacity: win(t, ini, fin + 0.5, 0.01, 0.2) }} />
      <div style={{ left: 85, top: 150, width: 190, height: 400, perspective: 900, opacity: 1 - sale, transform: `translateY(${(1 - sp) * 560 + sale * 520}px) scale(${0.8 + 0.2 * sp})`, transformOrigin: "0 0" }}>
        <div style={{ inset: 0, borderRadius: 30, background: "#0b0b0b", boxShadow: "0 30px 60px #000c, 0 0 80px #FFB70333, inset 0 0 0 2px #2a2a2a", transform: `rotateY(${(1 - sp) * 50 - 10 + Math.sin(t) * 5}deg) rotateX(6deg)` }}>
          <div style={{ left: 8, top: 8, right: 8, bottom: 8, borderRadius: 23, overflow: "hidden", background: "#0E2A1C" }}>
            <div style={{ left: 60, right: 60, top: 6, height: 16, borderRadius: 9, background: "#000" }} />
            <div style={{ left: 14, top: 32, font: `700 13px ${DISP}`, color: "#fff" }}>Tu número de hoy</div>
            <div style={{ left: 14, top: 54, font: `700 38px/1 ${DISP}`, color: "#FFB703", fontVariantNumeric: "tabular-nums" }}>{ars(NUMERO_DIA)}</div>
            <div style={{ left: 14, top: 98, font: `600 9px ${BODY}`, color: "#9DB8A8", letterSpacing: ".08em" }}>EJEMPLO</div>
            <div style={{ left: 14, right: 14, top: 128, height: 22, borderRadius: 11, background: "#143723", border: "1px solid #2f6a4b", overflow: "hidden" }}>
              <div style={{ left: 0, top: 0, bottom: 0, width: `${Math.min(fill, 1.2) / 1.2 * 100}%`, background: pasado ? "linear-gradient(90deg,#2f9f6e,#5FD39A)" : "linear-gradient(90deg,#c4701a,#FFB703)" }} />
            </div>
            <div style={{ left: `calc(14px + (100% - 28px) * ${1 / 1.2})`, top: 120, width: 2, height: 38, background: "#fff" }} />
            <div style={{ left: 14, top: 166, font: `700 15px ${DISP}`, color: "#fff", fontVariantNumeric: "tabular-nums" }}>Hoy: {ars(Math.min(fill, HOY / NUMERO_DIA) * NUMERO_DIA)}</div>
            {pasado ? (
              <div style={{ left: 10, right: 10, top: 200, padding: 10, borderRadius: 12, background: "#143723", border: "1px solid #5FD39A", transform: `scale(${Math.min(1.05, spring(t - (T_.pasaste + 0.35), 15, 0.4))})` }}>
                <div style={{ position: "static", font: `800 11px ${BODY}`, color: "#5FD39A" }}>✓ SUPERASTE TU NÚMERO</div>
                <div style={{ position: "static", font: `700 22px/1.1 ${DISP}`, color: "#5FD39A", fontVariantNumeric: "tabular-nums" }}>+{ars(HOY - NUMERO_DIA)}</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

const Final: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  if (t < T_.final - 0.4) return null;
  const f = T_.final;
  const sl = spring(t - (f - 0.1), 12, 0.45);
  const sb = spring(t - (f + 1.2), 16, 0.4);
  const sc = spring(t - (f + 1.5));
  return (
    <>
      <div style={{ left: 0, right: 0, top: 0, height: 240, background: "linear-gradient(#000b,#0006 65%,transparent)" }} />
      <div style={{ left: 18, top: 62, display: "flex", alignItems: "center", gap: 10, transform: `scale(${0.5 + 0.5 * sl})`, transformOrigin: "0 50%", opacity: Math.min(1, sl) }}>
        <div style={{ position: "relative", width: 40, height: 40, borderRadius: 11, background: "#FFB703", boxShadow: "0 0 30px #FFB70366" }}>
          <div style={{ left: 9, right: 9, top: 14, height: 4, borderRadius: 3, background: "#06140D" }} />
          <div style={{ left: 9, right: 15, top: 22, height: 4, borderRadius: 3, background: "#06140D" }} />
        </div>
        <div style={{ position: "static", font: `700 34px/1 ${DISP}`, letterSpacing: "-.02em", color: "#fff" }}>En Claro</div>
      </div>
      <TextoCinetico t={t} desde={f + 0.05} paso={0.11} texto="Comentá tu alquiler" amarillas={[2]} style={{ left: 18, right: 10, top: 108, font: `700 30px/1 ${DISP}`, color: "#fff" }} />
      <TextoCinetico t={t} desde={f + 0.6} paso={0.1} texto="y te digo tu número." amarillas={[]} style={{ left: 18, right: 10, top: 146, font: `700 25px/1 ${DISP}`, color: "#ffffffdd" }} />
      <Pildora texto="Probalo gratis · 14 días sin tarjeta" style={{ left: 18, top: 186, transform: `scale(${sb})`, transformOrigin: "0 50%" }} />
      <div style={{ left: 40, right: 40, top: 496, padding: 12, borderRadius: 999, background: "#FFB703", textAlign: "center", font: `900 15px ${BODY}`, color: "#1A1200", overflow: "hidden", boxShadow: "0 10px 30px #FFB70355", opacity: Math.min(1, sc), transform: `scale(${0.8 + 0.2 * sc})` }}>
        <span style={{ position: "static" }}>Link en el perfil</span>
        <i style={{ top: 0, bottom: 0, width: 40, background: "linear-gradient(90deg,transparent,#ffffffaa,transparent)", left: I(t, f + 2.0, f + 2.7, -50, 300, eIO) }} />
      </div>
    </>
  );
};

/** Corte a negro con latido: "Es lo que perdés…" y el texto que sigue arriba al volver. */
const ReGancho: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const a = T_.reg - 0.25, b = T_.antes - 0.1;
  const negro = win(t, a, b, 0.06, 0.08);
  const latido = Math.exp(-9 * Math.max(0, t - T_.reg)) + Math.exp(-9 * Math.max(0, t - (T_.reg + 0.9))) * (t > T_.reg + 0.9 ? 1 : 0);
  return (
    <>
      {negro > 0 ? (
        <div style={{ inset: 0, background: "#000", opacity: negro }}>
          <div style={{ left: 30, top: 250, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,#ff2a3a55,transparent 65%)", transform: `scale(${0.7 + 0.5 * latido})`, opacity: 0.8 }} />
          <TextoCinetico t={t} desde={T_.reg} paso={0.12} texto="Es lo que" amarillas={[]} style={{ left: 22, right: 22, top: 232, font: `700 42px/1.05 ${DISP}`, color: "#fff" }} />
          <TextoCinetico t={t} desde={T_.reg + 0.4} paso={0.1} texto="perdés" amarillas={[]} style={{ left: 22, right: 22, top: 280, font: `700 78px/1 ${DISP}`, color: "#FF2D3B" }} />
        </div>
      ) : null}
      {t >= T_.antes - 0.1 && t < T_.alq - 0.3 ? (
        <div style={{ inset: 0, opacity: win(t, T_.antes - 0.1, T_.alq - 0.3, 0.05, 0.25) }}>
          <div style={{ left: 0, right: 0, top: 0, height: 200, background: "linear-gradient(#000d,#0009 65%,transparent)" }} />
          <TextoCinetico t={t} desde={T_.antes} paso={0.08} texto="Antes de abrir" amarillas={[]} style={{ left: 20, right: 20, top: 66, font: `700 36px/1.05 ${DISP}`, color: "#fff" }} />
          <TextoCinetico t={t} desde={T_.persiana - 0.2} paso={0.1} texto="la persiana." amarillas={[]} style={{ left: 20, right: 20, top: 110, font: `700 42px/1.05 ${DISP}`, color: "#FF4D5A" }} />
        </div>
      ) : null}
    </>
  );
};

export const NumeroTapado: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const listo = useFuentesListas();
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T_ = tiempos(pal);
  const H = hb(T_);

  // golpes: temblor y destellos
  let hs = 0, wf = 0, red = 0;
  [...GOLPES, SELLO].forEach((a, i) => {
    const d = t - a;
    if (d >= 0) { hs += (i === 2 ? 12 : 18) * Math.exp(-14 * d) * Math.sin(70 * d + 1.2); wf += Math.max(0, 1 - d / 0.15) * (i === 2 ? 0.25 : i === 0 ? 0.28 : 0.5); }
  });
  [...H, T_.p0, T_.p1, T_.final + 0.6].forEach((a) => { const d = t - a; if (d > 0) hs += 6 * Math.exp(-12 * d) * Math.sin(60 * d); });
  { const d = t - T_.rev; if (d > 0) { hs += 16 * Math.exp(-9 * d) * Math.sin(66 * d); wf += Math.max(0, 1 - d / 0.2) * 0.55; } }
  if (t >= SELLO) red += Math.max(0, 1 - (t - SELLO) / 0.35);
  [T_.vendes + 0.55, T_.caja + 0.2].forEach((a) => { const d = t - a; if (d > 0) red += Math.max(0, 1 - d / 0.3) * 0.5; });
  const lk = Math.max(win(t, T_.rev - 0.05, T_.rev + 0.9, 0.05, 0.7), win(t, T_.pasaste + 0.3, T_.pasaste + 1.2, 0.2, 0.6) * 0.6);
  const grado = win(t, T_.antes + 0.2, T_.rev, 0.5, 0.15) * 0.8;

  const sonidos = [
    ...g.sonidos,
    { en: T_.l1 + 0.05, sfx: "whoosh" }, { en: T_.p0, sfx: "cinta" }, { en: T_.p1, sfx: "cinta" },
    { en: T_.vendes - 0.1, sfx: "whoosh" }, { en: T_.vendes + 0.55, sfx: "thump" }, { en: T_.tenes - 0.05, sfx: "whoosh" }, { en: T_.caja + 0.2, sfx: "thump" },
    { en: T_.reg, sfx: "heart" }, { en: T_.reg + 0.9, sfx: "heart" }, { en: T_.antes - 0.1, sfx: "whoosh" },
    ...H.flatMap((h, k) => [{ en: h - 0.45, sfx: "whoosh" }, { en: h, sfx: "thump" }, { en: h + 0.02, sfx: "papel" }, ...(k < 3 ? [{ en: h + 0.05, sfx: "cinta" }, { en: h + 0.12, sfx: "tic" }] : [{ en: h + 0.12, sfx: "tic" }])]),
    { en: T_.rev - 1.4, sfx: "riser" }, { en: T_.rev, sfx: "cinta_larga" },
    { en: T_.l6, sfx: "whoosh" }, { en: T_.pasaste + 0.4, sfx: "caja" }, { en: T_.pasaste + 0.4, sfx: "coins" },
    { en: T_.final - 0.2, sfx: "whoosh" }, ...[0, 1, 2, 3, 4].map((i) => ({ en: T_.final + 0.1 + i * 0.08, sfx: "cinta" })), { en: T_.final + 0.6, sfx: "thump" },
  ];

  return (
    <AbsoluteFill style={{ background: "#050f0a" }}>
      <style>{`.stage *{position:absolute;box-sizing:border-box} .stage{font-family:${BODY};color:#fff}`}</style>
      <div className="stage" style={{ position: "absolute", left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" }}>
        <Fondo t={t} />
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${hs * 3}px,${hs * 1.6}px)` }}>
        <ThreeCanvas width={1080} height={1920} shadows gl={{ alpha: true, antialias: true }} camera={{ fov: 56, near: 0.1, far: 200 }}>
          <Escena3D t={t} T_={T_} listo={listo} />
        </ThreeCanvas>
      </div>
      <div className="stage" style={{ position: "absolute", left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" }}>
        {grado > 0 ? <div style={{ inset: 0, opacity: grado, background: "radial-gradient(circle at 50% 50%, #ff2a3a1f 25%, #6a0010dd 100%)" }} /> : null}
        <Gancho t={t} hs={hs} />
        <Promesa t={t} T_={T_} />
        <Descartes t={t} T_={T_} />
        <Fijos t={t} T_={T_} />
        <Revelacion t={t} T_={T_} />
        <Truco t={t} T_={T_} />
        <Final t={t} T_={T_} />
        <ReGancho t={t} T_={T_} />
        <Grano frame={frame} />
        <Vineta />
        {lk > 0 ? <div style={{ inset: -40, mixBlendMode: "screen", opacity: lk, background: `radial-gradient(circle at ${45 + Math.sin(t) * 10}% 40%, #FFB703ee, #FF7A00aa 30%, transparent 65%)` }} /> : null}
        <div style={{ inset: 0, background: "#FF4D5A", opacity: Math.min(0.28, red * 0.25) }} />
        <div style={{ inset: 0, background: "#fff", opacity: clamp(wf, 0, 0.6) }} />
        <Subtitulos t={t} tv={t} g={g} palabras={pal} ocultos={[[-1, 3.6], [T_.reg - 0.3, T_.antes + 0.2], [T_.rev - 0.3, T_.rev + 0.9], [T_.final - 0.4, 60]]} />
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
