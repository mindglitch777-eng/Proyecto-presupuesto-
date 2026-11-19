import React from "react";
import * as THREE from "three";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V8_12, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { Cartel, CupoFundadores, Rotulo, entra, latido, ritmo, sp } from "./comun";
import { Estudio, PantallaApp, cajaR, useLienzo } from "./estudio3d";
import { C } from "./iconos";
import { Barra3D, Camion3D, Celular3D, Kiosco3D, PilaBilletes, Vereda } from "./modelos3d";
import { Partida } from "./MismoKiosco";

// V8-12 "¿Vender más o ganar más?" (videos/guiones/V8-12-VENDER-MAS.md). Volumen vs. margen, con números (ejemplo):
// A vende $200.000 al 22% → $44.000 − $30.000 fijos = $14.000/día ($420.000/mes). B vende $120.000 al 38% → $45.600 − $30.000 = $15.600/día ($468.000/mes).
// Pantalla partida: arriba A (x = −10), abajo B (x = +10). Las pilas son proporcionales a lo que venden (no a escala de billetes).

const g = GUION_V8_12;
const XA = -10, XB = 10;
const PILA_A = 1.0, PILA_B = 0.6; // proporción 200.000 : 120.000
const MARGEN_A = 0.22, MARGEN_B = 0.38;
// grabación real de la app (app/scripts/grabar-v8.cjs v8-12)
const APP = { bajos: 2.43, precio: 5.051, fin: 7.252 };
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e, dur,
    otro: w(0, "otro", 1.6), cual: w(0, "¿cuál", e[0] - 0.8),
    ya: w(1, "ya", l[1] + 0.5),
    perdiste: w(2, "perdiste", e[2] - 0.5),
    poco: w(3, "poco", l[3] + 2.0), veintidos: w(3, "veintidós", e[3] - 1.2),
    menos: w(4, "menos", l[4] + 0.6), treinta: w(4, "treinta", e[4] - 0.9),
    nadie: w(5, "nadie", l[5] + 1.8),
    reponer: w(6, "reponer", l[6] + 0.6), justo: w(6, "justo", e[6] - 1.2),
    cuatrocientos: l[7], sesenta: w(7, "sesenta", e[7] - 1.1),
    ranking: w(8, "ranking", l[8] + 1.2), que_no: w(8, "no.", l[8] + 2.6), noche: w(8, "noche", e[8] - 0.4),
    comentalo: w(9, "comentalo", e[9] - 0.6),
    LOOP: dur - 0.27,
  };
}
type T = ReturnType<typeof tiempos>;

function appTiempo(t: number, T: T) {
  const p: [number, number][] = [[T.l[8], 0], [T.ranking + 0.4, 0.8], [T.que_no, APP.bajos], [T.noche - 0.4, APP.precio - 0.6], [T.noche + 0.6, APP.precio + 0.3], [T.noche + 2.2, APP.fin]];
  if (t <= p[0][0]) return 0;
  for (let i = 0; i < p.length - 1; i++) { const [a, s0] = p[i], [b, s1] = p[i + 1]; if (t < b) return s0 + (s1 - s0) * ((t - a) / (b - a)); }
  return APP.fin;
}

/** Pila de plata: 3 × 2 columnas de fajos (todas del mismo alto). */
const PilaGrande: React.FC<{ alto: number }> = ({ alto }) => (
  <group>
    {[0, 1, 2].flatMap((i) => [0, 1].map((j) => (
      <group key={`${i}${j}`} position={[-0.17 + i * 0.17, 0, -0.04 + j * 0.08]} rotation-y={((i + j) % 2 ? 0.04 : -0.03)}>
        <PilaBilletes alto={alto} />
      </group>
    )))}
  </group>
);

/** Góndola con etiquetas: verdes (le dejan plata) y rojas (no). Las rojas se van al depósito cuando "deja de reponer". */
const GondolaEtiquetas: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const verde = useLienzo("etq-verde", 64, 32, (x, w, h) => { x.fillStyle = "#16794a"; x.fillRect(0, 0, w, h); x.fillStyle = "#fff"; x.font = "800 20px sans-serif"; x.fillText("$✓", 14, 24); });
  const roja = useLienzo("etq-roja", 64, 32, (x, w, h) => { x.fillStyle = "#d92d20"; x.fillRect(0, 0, w, h); x.fillStyle = "#fff"; x.font = "800 20px sans-serif"; x.fillText("$✗", 14, 24); });
  const colores = ["#e94b3c", "#f2b134", "#2f8f5b", "#3d6fb5", "#f07aa8", "#8a4fbf"];
  return (
    <group>
      <mesh position={[0, 0.85, -0.18]} castShadow receiveShadow><boxGeometry args={[1.5, 1.7, 0.04]} /><meshStandardMaterial color="#d8d4ca" roughness={0.8} /></mesh>
      {[0.25, 0.75, 1.25].map((y, f) => (
        <group key={y}>
          <mesh position={[0, y, 0]} castShadow receiveShadow><boxGeometry args={[1.46, 0.03, 0.36]} /><meshStandardMaterial color="#9ea29c" metalness={0.5} roughness={0.45} /></mesh>
          {Array.from({ length: 5 }, (_, k) => {
            const i = f * 5 + k;
            const malo = rnd(i + 3) > 0.62;
            const sale = malo ? entra((t - (T.reponer + i * 0.06)) / 0.5) : 0;
            const crece = !malo ? 1 + 0.18 * entra((t - T.justo) / 0.4) : 1;
            if (sale >= 1) return null;
            return (
              <group key={k} position={[-0.56 + k * 0.28 + sale * 2.5, y + 0.1 + sale * 1.2, sale * 1.5]} rotation-z={sale * 3} scale={[crece, crece, crece]}>
                <mesh geometry={cajaR(0.16, 0.18, 0.12, 0.012, 2)} castShadow><meshPhysicalMaterial color={colores[i % 6]} roughness={0.35} clearcoat={0.5} /></mesh>
                <mesh position={[0, -0.075, 0.062]}><planeGeometry args={[0.1, 0.045]} /><meshBasicMaterial map={malo ? roja : verde} toneMapped={false} /></mesh>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
};

/** Cámaras de la pantalla partida (A arriba, B abajo); en el re-gancho y el truco solo B. */
function camaras(t: number, T: T) {
  const { l } = T;
  const base = (x0: number, k: number) => ({ pos: [x0 - 0.2 + Math.sin(t * 1.2) * 0.4 * k, 1.35 + 0.2 * k, 5.4 - 0.9 * k], target: [x0 - 0.2, 0.95, 0.6], fov: 42 });
  const kG = t < l[1] ? Math.sin((Math.PI / 2) * clamp(t / Math.max(0.5, l[1]), 0, 1)) : 1;
  let a = base(XA, kG), b = base(XB, kG);
  if (t >= l[3] - 0.05 && t < l[5] - 0.05) {
    // A y B con su camión: la cámara se abre para que entre
    a = { pos: [XA + 1.3 + Math.sin(t * 0.7) * 0.3, 1.9, 7.4], target: [XA + 1.4, 0.9, 1.5], fov: 48 };
    b = { pos: [XB + 1.3 + Math.sin(t * 0.7) * 0.3, 1.9, 7.4], target: [XB + 1.4, 0.9, 1.5], fov: 48 };
  }
  if (t >= l[5] - 0.05 && t < l[7] - 0.05) b = { pos: [XB - 0.4 + Math.sin(t * 0.6) * 0.25, 1.15, 4.0], target: [XB - 0.4, 0.8, 1.6], fov: 44 };
  if (t >= l[7] - 0.05 && t < l[8] - 0.05) {
    a = { pos: [XA + 0.3 + Math.sin(t * 0.7) * 0.3, 1.2, 4.2], target: [XA + 0.3, 0.7, 1.4], fov: 44 };
    b = { pos: [XB + 0.3 + Math.sin(t * 0.7) * 0.3, 1.2, 4.2], target: [XB + 0.3, 0.7, 1.4], fov: 44 };
  }
  if (t >= l[8] - 0.05 && t < l[9] - 0.05) {
    const k = entra((t - l[8]) / 0.6);
    b = { pos: [XB + 0.9 + Math.sin(t * 0.7) * 0.03, 1.14, 2.05 - 0.15 * k], target: [XB + 0.9, 1.1, 1.55], fov: 36 };
  }
  if (t >= l[9] - 0.05) {
    const k = 1 - clamp((t - l[9]) / Math.max(1, T.LOOP - l[9]), 0, 1);
    const kk = k * k * (3 - 2 * k);
    a = { pos: [XA - 0.2 - 1.4 * kk, 1.35 + 0.5 * kk, 5.4 + 1.0 * kk], target: [XA - 0.2, 0.95, 0.6], fov: 42 };
    b = { pos: [XB - 0.2 + 1.4 * kk, 1.35 + 0.5 * kk, 5.4 + 1.0 * kk], target: [XB - 0.2, 0.95, 0.6], fov: 42 };
  }
  if (t >= T.LOOP) { a = base(XA, 0); b = base(XB, 0); }
  return { a, b };
}

const Escena3D: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const { l } = T;
  const { a, b } = camaras(t, T);
  const soloB = (t >= l[5] - 0.05 && t < l[7] - 0.05) || (t >= l[8] - 0.05 && t < l[9] - 0.05);
  const r = soloB ? 0.5 * (1 - entra((t - (t >= l[8] - 0.05 ? l[8] : l[5]) + 0.05) / 0.4)) : 0.5;
  const final = t >= l[9] - 0.05;
  const vaA = final ? 0 : entra((t - (T.poco - 0.2)) / 1.2), vaB = final ? 0 : entra((t - (T.menos - 0.1)) / 1.2);
  const quedaA = PILA_A * (1 - (1 - MARGEN_A) * vaA), quedaB = PILA_B * (1 - (1 - MARGEN_B) * vaB);
  const barras = final ? 0 : entra((t - (T.cuatrocientos + 0.1)) / 0.7) * (t < l[8] ? 1 : 0);
  const gira = Math.PI * (1 - entra((t - l[5]) / 0.8));
  return (
    <>
      <Estudio fondo="#9cc9ea" niebla={[16, 44]} luz={1.0} calida={0.4} exposicion={1.0} principal={[6, 9, 8]} />
      <Vereda largo={5} ancho={44} />
      {[{ x0: XA, alto: quedaA, va: vaA, de: PILA_A, k: "A" }, { x0: XB, alto: quedaB, va: vaB, de: PILA_B, k: "B" }].map((p) => (
        <group key={p.k} position={[p.x0, 0, 0]}>
          <Kiosco3D t={t} noche={0.2} />
          <group position={[-0.35, 0, 1.25]}><PilaGrande alto={p.alto} /></group>
          {/* la parte que se lleva el proveedor vuela al camión */}
          {p.va > 0 && p.va < 1 ? (
            <group position={[-0.35 + p.va * 3.3, p.alto + Math.sin(p.va * Math.PI) * 0.8, 1.25 + p.va * 1.3]} rotation-z={-p.va * 1.2}>
              <PilaGrande alto={(p.de - p.alto) * (1 - p.va * 0.2)} />
            </group>
          ) : null}
          {!final && t > (p.k === "A" ? T.poco - 0.6 : T.menos - 0.5) && t < l[5] ? (
            <group position={[3.9 + Math.max(0, t - (p.k === "A" ? T.poco + 1.4 : T.menos + 1.4)) * 5, 0, 2.6]}><Camion3D t={t} /></group>
          ) : null}
          {barras > 0 ? <group position={[0.9, 0, 1.6]}><Barra3D alto={(p.k === "A" ? 0.84 : 0.936) * barras} color={p.k === "A" ? "#d92d20" : "#16794a"} ancho={0.45} /></group> : null}
        </group>
      ))}
      {!final && t >= l[5] - 0.3 && t < l[7] ? <group position={[XB - 0.4, 0, 1.6]} rotation-y={gira}><GondolaEtiquetas t={t} T={T} /></group> : null}
      {t > l[8] - 0.3 && t < l[9] + 0.3 ? (
        <group position={[XB + 0.9, 1.1 - (1 - entra((t - l[8] + 0.3) / 0.5)) * 0.4, 1.55]} rotation-y={Math.sin(t * 0.8) * 0.05}>
          <Celular3D><PantallaApp t={appTiempo(t, T)} carpeta="tomas/v8-12" app0={0} rate={1} durGrab={APP.fin} /></Celular3D>
        </group>
      ) : null}
      <Partida a={a} b={b} r={r} />
    </>
  );
};

export const VenderMas: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, dur);
  const loop = t >= T.LOOP;
  const tw = loop ? 0 : t;
  const { l, e } = T;
  const sil0 = e[6] + 0.05;
  const cuenta = [l[1] + 0.05, l[1] + (T.ya - l[1]) * 0.5, T.ya];

  const manual = [0.03, T.otro, T.cual, ...cuenta, T.perdiste, T.poco, T.veintidos, T.menos, T.treinta, T.nadie, T.reponer, T.justo, T.cuatrocientos, T.sesenta, T.ranking, T.que_no, T.noche, T.comentalo];
  const cortes = [l[3], l[5], l[7], l[8], l[9]];
  const cam: Cam2D = t > sil0 && t < l[7] ? { z: 1.02, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : ritmo(pal, manual, [[sil0, l[7] - 0.02], [T.LOOP - 0.4, 999]], 0.45), loop ? [] : cortes, 0.45);
  const hs = loop ? 0 : temblor(t, [[0.03, 8], [T.perdiste, 10], [T.poco + 1.0, 5], [T.cuatrocientos, 9]]);
  let wf = 0;
  if (!loop) [[T.perdiste, 0.25], [T.cuatrocientos, 0.2]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });

  const malos = Array.from({ length: 15 }, (_, i) => i).filter((i) => rnd(i + 3) > 0.62);
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, { en: 0.05, sfx: "click", vol: 0.5 }, { en: 0.2, sfx: "click", vol: 0.5 }, { en: 0, sfx: "calle", vol: 0.3 },
    ...cortes.map((a) => ({ en: a - 0.12, sfx: "whoosh", vol: 0.3 })),
    ...cuenta.map((a) => ({ en: a, sfx: "tic", vol: 0.7 })),
    { en: T.perdiste, sfx: "buzz", vol: 0.55 }, { en: T.perdiste + 0.03, sfx: "thump", vol: 0.55 }, { en: T.perdiste + 0.2, sfx: "sello", vol: 0.45 },
    { en: T.poco - 0.6, sfx: "whoosh", vol: 0.4 }, { en: T.poco + 1.0, sfx: "thump", vol: 0.5 },
    { en: T.menos - 0.5, sfx: "whoosh", vol: 0.4 }, { en: T.menos + 1.0, sfx: "thump", vol: 0.45 }, { en: T.treinta, sfx: "coins", vol: 0.4 },
    { en: l[5], sfx: "heart", vol: 0.5 }, { en: l[5] + 0.55, sfx: "heart", vol: 0.55 }, { en: l[5] + 1.1, sfx: "heart", vol: 0.55 },
    ...malos.map((i) => ({ en: T.reponer + i * 0.06, sfx: "whoosh", vol: 0.25 })), { en: T.justo, sfx: "click", vol: 0.5 },
    { en: T.cuatrocientos, sfx: "thump", vol: 0.6 }, { en: T.sesenta, sfx: "slam", vol: 0.45 },
    ...[T.ranking, T.que_no, T.noche].map((a) => ({ en: a, sfx: "ding", vol: 0.45 })),
    { en: l[9] + 0.3, sfx: "click", vol: 0.45 }, { en: T.LOOP - 0.1, sfx: "click", vol: 0.45 },
  ].filter((x) => !(x.en > sil0 + 0.02 && x.en < l[7] - 0.05));

  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(sil0 * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.1 * Math.min(1, Math.max(0, sil0 * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(l[7] * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(l[7] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.1 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // ---------- capa gráfica ----------
  const tg = loop ? 0 : t;
  const soloB = !loop && ((t >= l[5] - 0.05 && t < l[7] - 0.05) || (t >= l[8] - 0.05 && t < l[9] - 0.05));
  const r = soloB ? 0.5 * (1 - entra((t - (t >= l[8] - 0.05 ? l[8] : l[5]) + 0.05) / 0.4)) : 0.5;
  const linea = 640 * r;
  const margen = 22 + 16 * entra((t - T.reponer) / Math.max(0.6, T.justo + 0.6 - T.reponer));
  const insignia = (txt: string, top: number, color: string, s = 1) => (
    <div style={{ left: 14, top, transform: `scale(${s})`, transformOrigin: "0 0" }}>
      <span style={{ position: "static", display: "inline-block", padding: "3px 10px", borderRadius: 10, background: "#0b0f0dcc", border: `2px solid ${color}`, font: `800 20px ${DISP}`, color }}>{txt}</span>
    </div>
  );
  const frente = (
    <>
      {r > 0.02 ? <div style={{ left: 0, right: 0, top: linea - 2, height: 4, background: C.ambar }} /> : null}
      {/* A y B con lo que venden */}
      {r > 0.3 && !(t >= l[7] - 0.05 && t < l[8] - 0.05 && !loop) && !(t >= l[9] - 0.05 && !loop) ? (
        <>
          {insignia(`A · ${ars(200000)}`, 14, "#ffffff", 1)}
          {insignia(`B · ${ars(120000)}`, linea + 12, "#ffffff", 1)}
        </>
      ) : null}
      {tg < l[1] - 0.05 || loop ? <Cartel texto="¿CUÁL GANA MÁS?" top={linea - 26} size={28} s={Math.min(1.08, 0.8 + sp(tg + 0.1) * 0.2) * latido(tg, 0.62, 0.04)} rot={-2 + Math.sin(tg * 4) * 1.2} /> : null}
      {!loop && t >= l[1] - 0.05 && t < l[2] - 0.05 ? (() => {
        const n = t < cuenta[1] ? 3 : t < cuenta[2] ? 2 : 1;
        const desde = cuenta[3 - n];
        return <div style={{ left: 130, top: linea - 50, width: 100, height: 100, borderRadius: 50, background: C.rojo, border: `5px solid ${C.tinta}`, textAlign: "center", font: `800 64px/90px ${DISP}`, color: "#fff", transform: `scale(${sp(t - desde, 1.2, 18, 0.4)})` }}>{n}</div>;
      })() : null}
      {!loop && t >= T.perdiste - 0.05 && t < l[3] - 0.05 ? (
        <>
          <div style={{ left: 0, right: 0, top: 0, height: linea, background: "#d92d2033" }} />
          <div style={{ left: 0, right: 0, top: linea * 0.35, textAlign: "center", font: `800 110px/1 ${DISP}`, color: "#d92d20", transform: `rotate(-12deg) scale(${2 - Math.min(1, sp(t - T.perdiste, 1.1, 18, 0.4))})`, opacity: Math.min(1, sp(t - T.perdiste) * 2), textShadow: "0 4px 0 #0008" }}>✗</div>
          <div style={{ left: 0, right: 0, top: linea, bottom: 0, background: "#16794a22", boxShadow: "inset 0 0 40px #3ddc84" }} />
        </>
      ) : null}
      {!loop && t >= l[3] - 0.05 && t < l[5] - 0.05 ? (
        <>
          {t > T.veintidos - 0.1 ? insignia("MARGEN 22% (ejemplo)", 50, "#ff8a80", sp(t - T.veintidos, 1.05)) : null}
          {t > T.treinta - 0.1 ? insignia("MARGEN 38% (ejemplo)", linea + 48, "#7cf2a8", sp(t - T.treinta, 1.05)) : null}
        </>
      ) : null}
      {!loop && t >= l[5] - 0.05 && t < l[7] - 0.05 ? (
        <>
          <Cartel texto={t < l[6] ? "LO QUE NADIE TE CUENTA" : `MARGEN ${Math.round(margen)}%`} top={80} fondo={t < l[6] ? C.rojo : C.verde} color={t < l[6] ? "#fff" : C.ambar} size={24} s={sp(t - l[5], 1.06) * latido(t, 0.5, 0.04)} rot={-2} />
          {t > l[6] ? <Rotulo t={t} desde={l[6]} texto="rojo = no le deja plata · verde = sí" top={134} size={15} /> : null}
        </>
      ) : null}
      {!loop && t >= l[7] - 0.05 && t < l[8] - 0.05 ? (
        <>
          {insignia(`A · ${ars(420000)}/mes`, 14, "#ff8a80")}
          {insignia(`B · ${ars(468000)}/mes`, linea + 12, "#7cf2a8")}
          <Cartel texto="VENDIENDO 40% MENOS" top={linea - 22} fondo={C.verde} color={C.ambar} size={22} s={sp(t - T.sesenta, 1.08)} rot={-2} />
        </>
      ) : null}
      {!loop && t >= l[8] - 0.05 && t < l[9] - 0.05 ? (
        <div style={{ left: 0, right: 0, top: 66, textAlign: "center", transform: `scale(${sp(t - l[8], 1.06)})` }}>
          <span style={{ position: "static", font: `800 18px/1.15 ${DISP}`, color: "#fff", textShadow: "0 3px 12px #000a" }}>En Claro: <span style={{ position: "static", color: C.ambar }}>qué te deja plata y qué no</span></span>
        </div>
      ) : null}
      {!loop && t >= l[9] - 0.05 ? <CupoFundadores t={t} desde={l[9]} top={150} /> : null}
      <div style={{ right: 12, bottom: 12, font: `600 11px ${BODY}`, color: "#ffffffaa" }}>(ejemplo)</div>
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, e[0] + 0.1], [sil0, l[7] + 0.05], [l[9] - 0.05, 999]]}
      fondo={<div style={{ inset: 0, background: "#9cc9ea" }} />}
      tres={<Escena3D t={tw} T={T} />}
      frente={frente}
      sobre={musica}
    />
  );
};
void THREE;
