import React from "react";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { ars } from "../lib/formato";
import { GUION_V8_13, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { Billetes, Cartel, CupoFundadores, Etiqueta, Rotulo, entra, latido, ritmo, sp } from "./comun";
import { Estudio, PantallaApp } from "./estudio3d";
import { C } from "./iconos";
import { Candado3D, Celular3D, Cuaderno3D, GondolaPrecios, Kiosco3D, Lupa3D, Mensaje3D, Taximetro3D, Vereda } from "./modelos3d";
import { Partida } from "./MismoKiosco";

// V8-13 "El taxímetro" (videos/guiones/V8-13-TAXIMETRO.md + referencia/SISTEMA-VIRAL.md). Mismos números que el V8-11:
// $23.500/día ÷ 13 h = $1.808/h · precios al día +$631/h · fiado cobrado +$615/h → $39.700 ÷ 13 = $3.054/h (+69%). Todo (ejemplo).
// Arriba (A, x = 0) el kiosco que no hace nada; abajo (B, x = XB) el de enfrente. Cada uno con su taxímetro de ganancia en el techo.

const g = GUION_V8_13;
const HORAS = 13;
const LENTO = Math.round(23500 / HORAS); // 1.808
const RAPIDO = Math.round(39700 / HORAS); // 3.054
const XB = 10;
const APP = { precio: 3.002, fiados: 4.937, fin: 6.939 };

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e, dur,
    ocho: w(0, "ochocientos", 2.0), doble: w(0, "doble", e[0] - 0.4),
    barrio: w(1, "barrio", l[1] + 0.3), trece: w(1, "trece", l[1] + 1.1), ventas: w(1, "ventas", e[1] - 0.5),
    distinto: w(2, "distinto", l[2] + 0.4), delante: w(2, "delante", e[2] - 0.5),
    precios: w(3, "precios", l[3] + 0.5), noche: w(3, "noche", e[3] - 0.4),
    nadie: w(4, "nadie", l[4] + 0.8),
    cobra: w(5, "cobra", l[5]), mensaje: w(5, "mensaje", e[5] - 0.5),
    sesenta: l[6], caramelo: w(6, "caramelo", e[6] - 0.6),
    cuenta: w(7, "cuenta", l[7] + 1.0), precio: w(7, "precio", l[7] + 2.4), cobrarle: w(7, "cobrarle", e[7] - 0.6),
    comentalo: w(8, "comentalo", l[8] + 1.4), mandaselo: w(8, "mandáselo", l[8] + 2.2),
    LOOP: dur - 0.27,
  };
}
type T = ReturnType<typeof tiempos>;

/** Hora del día que "corre" en los taxímetros (de las 13 de mañana a la noche, vuelve a empezar). */
const horaCorre = (t: number) => (6 + t * 2.2) % HORAS;

/** Qué muestra cada taxímetro: corriendo (plata de hoy) o la plata por hora. */
function lectura(t: number, T: T, lado: "A" | "B") {
  const { l } = T;
  const rate = lado === "A" ? LENTO : RAPIDO;
  const corre = t < (lado === "A" ? T.ocho : T.doble) || t >= l[8] - 0.05;
  if (corre) return { texto: ars(Math.round((rate * horaCorre(t)) / 10) * 10), sub: "GANANCIA DE HOY · ejemplo" };
  // de A: al final del truco (la app) sube hasta igualar al de enfrente
  const sube = lado === "A" ? entra((t - (T.cobrarle + 0.1)) / 1.0) : 0;
  const v = Math.round(rate + (RAPIDO - LENTO) * sube);
  const sil = T.e[5] + 0.05;
  const hh = Math.min(t, sil) - (lado === "A" ? T.ocho : T.doble);
  const hoy = Math.round((rate * (6 + hh * 0.4)) / 10) * 10;
  return { texto: `${ars(v)}/h`, sub: t > T.cobrarle ? "CON EN CLARO · ejemplo" : `HOY ${ars(hoy)} · ejemplo` };
}

function appTiempo(t: number, T: T) {
  const p: [number, number][] = [[T.l[7], 0], [T.cuenta + 0.5, 0.6], [T.precio - 0.4, APP.precio - 0.5], [T.precio + 0.5, APP.precio + 0.4], [T.cobrarle - 0.3, APP.fiados], [T.cobrarle + 1.2, APP.fin]];
  if (t <= p[0][0]) return 0;
  for (let i = 0; i < p.length - 1; i++) { const [a, s0] = p[i], [b, s1] = p[i + 1]; if (t < b) return s0 + (s1 - s0) * ((t - a) / (b - a)); }
  return APP.fin;
}

type Vista = { pos: number[]; target: number[]; fov: number };
const GOND: [number, number, number] = [-0.75, 0, 1.0];
const CAJON: [number, number, number] = [1.5, 0, 1.35];

/** Cámaras de A (arriba) y B (abajo), y cuánto ocupa A (`r`; 0 = solo B). */
function camaras(t: number, T: T): { a: Vista; b: Vista; r: number } {
  const { l } = T;
  const base = (x0: number, k: number): Vista => ({ pos: [x0 + 0.15 + Math.sin(t * 0.7) * 0.3 * k, 2.15 + 0.1 * k, 6.1 - 0.6 * k], target: [x0 + 0.1, 2.3, 0.4], fov: 44 });
  const kG = t < l[1] ? Math.sin((Math.PI / 2) * clamp(t / Math.max(0.5, l[1]), 0, 1)) : 1;
  let a = base(0, kG), b = base(XB, kG), r = 0.5;
  // ¿qué hace distinto?: la lupa recorre la góndola de B
  if (t >= l[2] - 0.05 && t < l[3] - 0.05) b = { pos: [XB + GOND[0] + 0.5 + Math.sin(t * 0.8) * 0.2, 1.2, 3.4], target: [XB + GOND[0], 0.75, GOND[2]], fov: 42 };
  // precios al día: las dos góndolas de cerca
  if (t >= l[3] - 0.05 && t < l[4] - 0.05) {
    const k = entra((t - l[3] + 0.05) / 0.5);
    const g0 = (x0: number): Vista => ({ pos: [x0 + GOND[0] + Math.sin(t * 0.9) * 0.08, 0.7 + 0.3 * (1 - k), 2.25 + 0.9 * (1 - k)], target: [x0 + GOND[0], 0.58, GOND[2]], fov: 40 });
    a = g0(0); b = g0(XB);
  }
  // el que nadie hace: solo B, el cuaderno con candado
  if (t >= l[4] - 0.05 && t < l[5] - 0.05) {
    const k = entra((t - l[4] + 0.05) / 0.5);
    b = { pos: [XB + CAJON[0] + 0.4 * (1 - k) + Math.sin(t) * 0.04, 1.2 + 0.4 * (1 - k), 3.2 + 1.2 * (1 - k)], target: [XB + CAJON[0], 0.8, CAJON[2]], fov: 40 };
    r = 0;
  }
  // cobra el fiado: B saca el candado; A sigue con el cuaderno cerrado
  if (t >= l[5] - 0.05 && t < T.e[5] + 0.05) {
    const c0 = (x0: number): Vista => ({ pos: [x0 + CAJON[0] + Math.sin(t * 0.8) * 0.1, 1.05, 2.75], target: [x0 + CAJON[0], 0.8, CAJON[2]], fov: 42 });
    a = c0(0); b = c0(XB);
  }
  // silencio: los dos kioscos quietos, solo el empuje lento
  if (t >= T.e[5] + 0.05 && t < l[6] - 0.05) {
    const k = clamp((t - T.e[5]) / Math.max(0.2, l[6] - T.e[5]), 0, 1);
    a = { pos: [0.1, 2.0, 5.3 - 0.3 * k], target: [0.1, 2.1, 0.4], fov: 44 }; b = { ...a, pos: [XB + 0.1, 2.0, 5.3 - 0.3 * k], target: [XB + 0.1, 2.1, 0.4] };
  }
  // comparación: los taxímetros a primer plano
  if (t >= l[6] - 0.05 && t < l[7] - 0.05) {
    const k = entra((t - l[6] + 0.05) / 0.6);
    const m0 = (x0: number): Vista => ({ pos: [x0 + Math.sin(t * 0.9) * 0.1, 3.0 + 0.45 * k, 5.0 - 2.4 * k], target: [x0, 2.6 + 0.9 * k, 0.2], fov: 42 });
    a = m0(0); b = m0(XB);
  }
  // el truco: el celular con la app (solo B); al final vuelve la pantalla partida y A se acelera
  if (t >= l[7] - 0.05 && t < l[8] - 0.05) {
    const k = entra((t - l[7]) / 0.6);
    b = { pos: [XB + 0.35 + Math.sin(t * 0.7) * 0.03, 1.14, 2.85 - 0.15 * k], target: [XB + 0.35, 1.1, 2.35], fov: 36 };
    r = 0;
    if (t >= T.cobrarle - 0.15) {
      const m0 = (x0: number): Vista => ({ pos: [x0, 3.3, 3.1], target: [x0, 3.35, 0.2], fov: 42 });
      a = m0(0); b = m0(XB); r = 0.5;
    }
  }
  // cierre: vuelve al encuadre del cuadro 0
  if (t >= l[8] - 0.05) {
    const k = clamp((t - l[8]) / Math.max(1, T.LOOP - l[8]), 0, 1);
    const m = entra(k * 1.6);
    const mix = (x0: number): Vista => {
      const f = base(x0, 0);
      return { pos: [f.pos[0] + Math.sin(k * 6) * 0.4 * (1 - k), f.pos[1] + 1.0 * (1 - m), f.pos[2] - 2.2 * (1 - m)], target: [f.target[0], f.target[1] + 1.2 * (1 - m), f.target[2]], fov: 44 };
    };
    a = mix(0); b = mix(XB);
  }
  if (t >= T.LOOP) { a = base(0, 0); b = base(XB, 0); r = 0.5; }
  return { a, b, r };
}

/** Un kiosco con su taxímetro en el techo, su góndola en la vereda y el cuaderno de fiados sobre un cajón. */
const Puesto: React.FC<{ t: number; T: T; lado: "A" | "B" }> = ({ t, T, lado }) => {
  const { l } = T;
  const lec = lectura(t, T, lado);
  const verde = lado === "B" || t > T.cobrarle + 0.1;
  // etiquetas de B: cambian solas (una cada ~1,9 s desde el seg. 1); en "esa noche" se dan vuelta todas
  const giro = (i: number) => {
    const sola = 1.0 + i * 1.9;
    const todas = T.noche - 0.2 + i * 0.07;
    return entra((t - Math.min(sola, todas)) / 0.35);
  };
  const brillo = (i: number) => (t > T.noche - 0.2 && t < l[4] ? Math.max(0, 1 - Math.abs(t - (T.noche + i * 0.07)) / 0.3) : 0);
  const candado = lado === "B" ? entra((t - T.cobra) / 0.3) : 0;
  const tiembla = t > l[4] && t < T.cobra ? Math.sin(t * 50) * 0.006 : lado === "A" && t > l[5] && t < T.e[5] ? Math.sin(t * 40) * 0.004 : 0;
  const msj = lado === "B" ? clamp((t - (T.mensaje - 0.3)) / 1.1, 0, 1) : 0;
  return (
    <group>
      <Kiosco3D t={t} />
      {/* taxímetro en el techo */}
      <group position={[0, 3.55, 0.25]} scale={[1.8, 1.8, 1.8]}>
        <mesh position={[-0.35, -0.3, -0.05]}><boxGeometry args={[0.04, 0.2, 0.04]} /><meshStandardMaterial color="#2b2f2d" metalness={0.8} roughness={0.3} /></mesh>
        <mesh position={[0.35, -0.3, -0.05]}><boxGeometry args={[0.04, 0.2, 0.04]} /><meshStandardMaterial color="#2b2f2d" metalness={0.8} roughness={0.3} /></mesh>
        <Taximetro3D texto={lec.texto} sub={lec.sub} color={verde ? "#4dff9a" : "#ff6b5e"} brillo={1 + 0.3 * Math.sin(t * 6)} />
      </group>
      {/* góndola de la vereda */}
      <group position={GOND} scale={[0.75, 0.75, 0.75]}>
        <GondolaPrecios vieja={lado === "A"} giro={lado === "B" ? giro : undefined} brillo={lado === "B" ? brillo : undefined} />
      </group>
      {/* cuaderno de fiados con candado */}
      <group position={CAJON}>
        <mesh position={[0, 0.27, 0]} castShadow receiveShadow><boxGeometry args={[0.6, 0.54, 0.45]} /><meshStandardMaterial color="#8a5a3c" roughness={0.8} /></mesh>
        <group position={[0, 0.56, 0.05]} rotation-x={0.95}>
          <group scale={[1.3, 1.3, 1.3]}><Cuaderno3D cierre={candado > 0.5 ? 0 : 1} /></group>
          {candado < 1 || t < T.cobra + 0.8 ? (
            <group position={[0.02 + tiembla, 0.06 + candado * 0.3, 0.02 + candado * 0.25]} rotation-x={-0.95} rotation-z={candado * 2.2} scale={[1.6, 1.6, 1.6]}>
              <Candado3D abierto={candado} />
            </group>
          ) : null}
        </group>
        {msj > 0 && msj < 1 ? (
          <group position={[0.1 + msj * 0.2, 0.85 + msj * 0.55, 0.4 + msj * 0.3]} rotation-z={0.1 - msj * 0.2} scale={[0.6 + msj * 0.5, 0.6 + msj * 0.5, 1]}>
            <Mensaje3D texto="Hola Marta, ¿pasás por lo del fiado? Te espero" />
          </group>
        ) : null}
      </group>
    </group>
  );
};

const Escena3D: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const { l } = T;
  const { a, b, r } = camaras(t, T);
  const lupa = t >= l[2] - 0.2 && t < l[3] ? clamp((t - l[2]) / Math.max(0.6, T.e[2] - l[2]), 0, 1) : -1;
  return (
    <>
      <Estudio fondo="#0b1116" niebla={[10, 34]} luz={0.45} calida={0.9} exposicion={1.0} principal={[4, 7, 6]} />
      <pointLight position={[0, 3.4, 3]} intensity={5} distance={9} decay={1.6} color="#ffd9a0" castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[XB, 3.4, 3]} intensity={5} distance={9} decay={1.6} color="#ffd9a0" />
      <Vereda largo={5} ancho={40} />
      <Puesto t={t} T={T} lado="A" />
      <group position={[XB, 0, 0]}><Puesto t={t} T={T} lado="B" /></group>
      {/* la lupa pasa por la góndola de B sin detenerse en las etiquetas */}
      {lupa >= 0 ? (
        <group position={[XB + GOND[0] - 0.7 + lupa * 1.4, 0.55 + Math.sin(lupa * Math.PI * 2) * 0.25, GOND[2] + 0.55]} rotation-z={-0.3}>
          <group scale={[0.7, 0.7, 0.7]}><Lupa3D /></group>
        </group>
      ) : null}
      {/* el celular con la app, al lado de B */}
      {t > l[7] - 0.3 && t < l[8] ? (
        <group position={[XB + 0.35, 1.1 - (1 - entra((t - l[7] + 0.3) / 0.5)) * 0.4, 2.35]} rotation-y={Math.sin(t * 0.8) * 0.05}>
          <Celular3D><PantallaApp t={appTiempo(t, T)} carpeta="tomas/v8-13" app0={0} rate={1} durGrab={APP.fin} /></Celular3D>
        </group>
      ) : null}
      <Partida a={a} b={b} r={r} />
    </>
  );
};

export const Taximetro: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, dur);
  const loop = t >= T.LOOP;
  const tw = loop ? 0 : t;
  const { l, e } = T;
  const sil0 = e[5] + 0.05;

  const manual = [0.03, T.ocho, T.doble, T.barrio, T.trece, T.ventas, T.distinto, T.precios, T.noche, l[4], T.nadie, T.cobra, T.mensaje, T.sesenta, T.caramelo, T.cuenta, T.precio, T.cobrarle, T.comentalo, T.mandaselo];
  const cortes = [l[2], l[3], l[4], l[5], l[6], l[7], T.cobrarle - 0.15, l[8]];
  const cam: Cam2D = t > sil0 && t < l[6] ? { z: 1.02, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : ritmo(pal, manual, [[sil0, l[6] - 0.02], [T.LOOP - 0.4, 999]], 0.45), loop ? [] : cortes, 0.45);
  const hs = loop ? 0 : temblor(t, [[0.03, 8], [T.ocho, 6], [T.doble, 8], [T.cobra, 6], [T.sesenta, 10]]);
  let wf = 0;
  if (!loop) [[T.doble, 0.2], [T.noche, 0.15], [T.sesenta, 0.25]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });

  // taxímetros: dos ritmos de clic mientras corren (A lento, B rápido)
  const clics = (desde: number, hasta: number, cada: number, vol: number) => Array.from({ length: Math.max(0, Math.floor((hasta - desde) / cada)) }, (_, i) => ({ en: desde + i * cada, sfx: "tic", vol }));
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, { en: 0, sfx: "calle", vol: 0.3 },
    ...clics(0, T.ocho, 0.5, 0.35), ...clics(0.12, T.doble, 0.25, 0.3),
    { en: T.ocho, sfx: "ding", vol: 0.45 }, { en: T.doble, sfx: "ding", vol: 0.5 }, { en: T.doble + 0.12, sfx: "ding", vol: 0.4 },
    ...cortes.map((a) => ({ en: a - 0.12, sfx: "whoosh", vol: 0.3 })),
    ...[T.barrio, T.trece, T.ventas].map((a) => ({ en: a, sfx: "sello", vol: 0.55 })),
    { en: l[2] + 0.1, sfx: "whoosh", vol: 0.45 },
    ...Array.from({ length: 6 }, (_, i) => ({ en: T.noche - 0.2 + i * 0.14, sfx: "click", vol: 0.4 })), { en: T.noche + 0.7, sfx: "ding", vol: 0.5 },
    { en: l[4], sfx: "heart", vol: 0.5 }, { en: l[4] + 0.55, sfx: "heart", vol: 0.55 },
    { en: T.cobra, sfx: "lock", vol: 0.55 }, { en: T.mensaje - 0.3, sfx: "click", vol: 0.5 }, { en: T.mensaje + 0.1, sfx: "coins", vol: 0.45 }, { en: e[5] - 0.1, sfx: "ding", vol: 0.45 },
    { en: T.sesenta, sfx: "thump", vol: 0.6 }, { en: T.sesenta + 0.1, sfx: "riser", vol: 0.25 },
    ...[T.cuenta, T.precio, T.cobrarle].map((a) => ({ en: a, sfx: "ding", vol: 0.45 })),
    ...clics(T.cobrarle + 0.1, T.cobrarle + 1.1, 0.12, 0.3),
    ...clics(l[8], T.LOOP, 0.5, 0.25), ...clics(l[8] + 0.12, T.LOOP, 0.25, 0.2),
  ].filter((x) => !(x.en > sil0 + 0.02 && x.en < l[6] - 0.05));

  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(sil0 * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.1 * Math.min(1, Math.max(0, sil0 * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(l[6] * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(l[6] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.1 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // ---------- capa gráfica (máximo 2 textos + subtítulo) ----------
  const tg = loop ? 0 : t;
  const { r } = camaras(tw, T);
  const banda = (texto: string, desde: number, fondo = C.rojo, color = "#fff", size = 22) => (
    <Cartel texto={texto} top={296} size={size} fondo={fondo} color={color} s={Math.min(1.06, sp(t - desde, 1.08, 18, 0.45)) * latido(t, 0.55, 0.03)} rot={-2 + Math.sin(t * 3) * 0.8} />
  );
  const frente = (
    <>
      {tg < l[1] - 0.05 || loop ? (
        <>
          <Etiqueta texto="CUÁNTO GANA… #1" top={18} size={14} fondo={C.verde} color={C.ambar} />
          <div style={{ left: 0, right: 0, top: 282, textAlign: "center", transform: `scale(${Math.min(1.06, 0.82 + sp(tg + 0.1) * 0.2) * latido(tg, 0.62, 0.035)}) rotate(${-2 + Math.sin(tg * 4) * 1.0}deg)` }}>
            <span style={{ position: "static", display: "inline-block", padding: "5px 16px", borderRadius: 12, background: C.rojo, color: "#fff", font: `800 22px/1.1 "Space Grotesk", sans-serif`, boxShadow: `0 5px 0 ${C.tinta}` }}>¿CUÁNTO GANA UN KIOSCO<br />POR HORA?</span>
          </div>
        </>
      ) : null}
      {!loop && t >= l[1] - 0.05 && t < l[2] - 0.05 ? (
        t < T.trece - 0.05 ? banda("= MISMO BARRIO", T.barrio) : t < T.ventas - 0.05 ? banda("= 13 HORAS", T.trece) : banda("= $150.000/DÍA (ejemplo)", T.ventas, C.rojo, "#fff", 19)
      ) : null}
      {!loop && t >= l[2] - 0.05 && t < l[3] - 0.05 ? banda("¿QUÉ HACE DISTINTO?", l[2], C.ambar, C.tinta) : null}
      {!loop && t >= l[3] - 0.05 && t < l[4] - 0.05 ? (
        <>
          {banda("PRECIOS AL DÍA", T.precios, C.verde, C.ambar)}
          {t > T.noche + 0.5 ? <Rotulo t={t} desde={T.noche + 0.5} texto="+$631/h · precios al día (ejemplo)" top={350} color={C.hoja} size={15} /> : null}
        </>
      ) : null}
      {!loop && t >= l[4] - 0.05 && t < l[5] - 0.05 ? <Cartel texto="EL QUE NADIE HACE" top={90} size={26} s={sp(t - T.nadie, 1.06) * latido(t, 0.5, 0.05)} rot={Math.sin(t * 5) * 1.5} /> : null}
      {!loop && t >= l[5] - 0.05 && t < l[6] - 0.05 ? (
        <>
          {t > T.mensaje ? <Billetes t={t} desde={T.mensaje} hasta={e[5] + 0.3} x0={250} y0={470} x1={180} y1={340} cada={0.1} alto={50} /> : null}
          {t > e[5] - 0.15 ? <Rotulo t={t} desde={e[5] - 0.15} texto="+$615/h · fiado cobrado (ejemplo)" top={350} color={C.hoja} size={15} /> : null}
        </>
      ) : null}
      {!loop && t >= l[6] - 0.05 && t < l[7] - 0.05 ? banda("+69% · MISMAS VENTAS", T.sesenta, C.verde, C.ambar, 22) : null}
      {!loop && t >= l[7] - 0.05 && t < l[8] - 0.05 && r === 0 ? (
        <div style={{ left: 0, right: 0, top: 80, textAlign: "center", transform: `scale(${sp(t - l[7], 1.06)})` }}>
          <span style={{ position: "static", font: `800 18px/1.15 "Space Grotesk", sans-serif`, color: "#fff", textShadow: "0 3px 12px #000a" }}>En Claro <span style={{ position: "static", color: C.ambar }}>hace esa cuenta cada noche</span></span>
        </div>
      ) : null}
      {!loop && t >= T.cobrarle - 0.15 && t < l[8] - 0.05 ? banda("LOS DOS A $3.054/h (ejemplo)", T.cobrarle, C.verde, C.ambar, 18) : null}
      {!loop && t >= l[8] - 0.05 ? (
        <>
          {t < T.mandaselo - 0.05 ? <div style={{ left: 0, right: 0, top: 282, textAlign: "center", transform: `scale(${sp(t - l[8], 1.06) * latido(t, 0.55, 0.03)}) rotate(-2deg)` }}>
            <span style={{ position: "static", display: "inline-block", padding: "5px 16px", borderRadius: 12, background: C.ambar, color: C.tinta, font: `800 22px/1.1 "Space Grotesk", sans-serif`, boxShadow: `0 5px 0 ${C.tinta}` }}>¿CUÁNTO GANÁS VOS<br />POR HORA?</span>
          </div> : banda("MANDÁSELO A UN KIOSQUERO", T.mandaselo, C.rojo, "#fff", 20)}
          {t >= T.mandaselo - 0.05 ? <CupoFundadores t={t} desde={T.mandaselo} top={40} mensual /> : null}
        </>
      ) : null}
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[sil0, l[6] + 0.05], [T.mandaselo - 0.05, 999]]}
      fondo={<div style={{ inset: 0, background: "#0b1116" }} />}
      tres={<Escena3D t={tw} T={T} />}
      frente={frente}
      sobre={musica}
    />
  );
};
