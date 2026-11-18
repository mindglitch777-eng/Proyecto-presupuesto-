import React, { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { GUION_V8_09, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { Cartel, CupoFundadores, Rotulo, entra, latido, mezcla, ritmo, sp } from "./comun";
import { Estudio, PantallaApp, cajaR, useLienzo } from "./estudio3d";
import { C } from "./iconos";
import { Auto3D, Celular3D, HojaMes, Kiosco3D, Lupa3D, PersianaFrente, PilaBilletes, Vereda } from "./modelos3d";

// V8-09 "Mismo kiosco, distinto final" (videos/guiones/V8-09-MISMO-KIOSCO.md). Pantalla partida de verdad: dos cámaras en la misma escena.
// Arriba el kiosco que cierra (x = −10), abajo el que se compra el auto (x = +10). Son idénticos: la misma escena instanciada dos veces.
// Cuenta (ejemplo): los dos venden $150.000/día; el de abajo termina el año con $39.700/día × 360 = $14.292.000 (1,43 m de billetes de $1.000).

const g = GUION_V8_09;
const XA = -10, XB = 10, ANCHO = 3.6;
const MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
const ANIO = 14_292_000;
// grabación real de la app (app/scripts/grabar-v8.cjs v8-09)
const APP = { fiados: 2.16, precio: 5.339, fin: 7.54 };
const PUERTA = ANCHO / 2 - 0.62;

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e, dur,
    auto: w(0, "auto", 2.6), cerro: w(0, "cerró", e[0] - 0.5),
    marzo: w(2, "marzo", l[2] + 2.1), mayo: w(2, "mayo", l[2] + 3.4),
    viste: w(3, "viste", l[3] + 2.0),
    agosto: w(4, "agosto", l[4]), octubre: w(4, "octubre", l[4] + 1.3),
    estaciona: w(6, "estaciona", l[6] + 0.2), persiana: w(6, "persiana", l[6] + 2.4),
    lucecita: w(7, "lucecita", l[7] + 1.5), cinco: w(7, "cinco", l[7] + 2.6),
    cuanto: w(8, "cuánto", l[8] + 1.5), quien: w(8, "quién", l[8] + 3.3), precio: w(8, "precio", l[8] + 5.0),
    cual: w(9, "¿cuál", e[9] - 1.0),
    LOOP: dur - 0.27,
  };
}
type T = ReturnType<typeof tiempos>;

/** Mes del año (1 = enero … 11 = noviembre) en cada momento; se congela en el re-gancho. La parte decimal es la hora: 0,55–0,95 = noche. */
function mes(t: number, T: T) {
  const { l } = T;
  const tramos: [number, number][] = [[l[2], 1.15], [T.marzo, 3.15], [T.mayo, 5.15], [l[3] + 0.1, 5.7], [l[4] - 0.05, 5.7], [T.agosto, 8.15], [T.octubre, 10.15], [l[5], 10.75], [l[5] + 0.4, 11.75]];
  if (t <= tramos[0][0]) return 1.15;
  for (let i = 0; i < tramos.length - 1; i++) {
    const [a, m0] = tramos[i], [b, m1] = tramos[i + 1];
    if (t < b) return m0 + (m1 - m0) * ((t - a) / (b - a));
  }
  return 11.75;
}
/** 0 = día, 1 = noche. */
function noche(t: number, T: T) {
  if (t < T.l[2] - 0.05 || t >= T.l[9] - 0.05) return 0;
  if (t >= T.l[5]) return 1;
  const f = mes(t, T) % 1;
  return clamp(Math.min((f - 0.5) / 0.08, (0.98 - f) / 0.08), 0, 1);
}

/** Render de pantalla partida: arriba la cámara A, abajo la B; `r` = parte de arriba (0 → solo la de abajo). */
const Partida: React.FC<{ a: { pos: number[]; target: number[]; fov: number }; b: { pos: number[]; target: number[]; fov: number }; r: number }> = ({ a, b, r }) => {
  const camA = useMemo(() => new THREE.PerspectiveCamera(40, 1, 0.05, 200), []);
  const camB = useMemo(() => new THREE.PerspectiveCamera(40, 1, 0.05, 200), []);
  useFrame(({ gl, scene, size }) => {
    const Wd = size.width, H = size.height;
    const hA = Math.round(H * clamp(r, 0, 1)), hB = H - hA;
    const poner = (c: THREE.PerspectiveCamera, v: typeof a, alto: number) => {
      c.fov = v.fov; c.aspect = Wd / Math.max(1, alto);
      c.position.set(v.pos[0], v.pos[1], v.pos[2]); c.lookAt(v.target[0], v.target[1], v.target[2]); c.updateProjectionMatrix();
    };
    gl.setScissorTest(true);
    if (hA > 1) { poner(camA, a, hA); gl.setViewport(0, hB, Wd, hA); gl.setScissor(0, hB, Wd, hA); gl.render(scene, camA); }
    if (hB > 1) { poner(camB, b, hB); gl.setViewport(0, 0, Wd, hB); gl.setScissor(0, 0, Wd, hB); gl.render(scene, camB); }
    gl.setScissorTest(false);
  }, 1);
  return null;
};

/** Cartel de papel pegado (FIADO / SE ALQUILA). */
const CartelPapel: React.FC<{ texto: string; w: number; h: number; color?: string }> = ({ texto, w, h, color = "#c0261b" }) => {
  const tex = useLienzo(`papel-${texto}`, 512, Math.round((512 * h) / w), (x, cw, ch) => {
    x.fillStyle = "#f7f3e8"; x.fillRect(0, 0, cw, ch);
    x.strokeStyle = color; x.lineWidth = 8; x.strokeRect(8, 8, cw - 16, ch - 16);
    x.fillStyle = color; x.font = `800 ${Math.min(ch * 0.5, (cw / texto.length) * 1.5)}px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(texto, cw / 2, ch / 2 + 4);
  });
  return <mesh><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex} roughness={0.8} /></mesh>;
};

/** Caja con telarañas (el depósito del kiosco que se apaga). */
const CajaVieja: React.FC = () => (
  <group>
    <mesh position={[0, 0.2, 0]} geometry={cajaR(0.5, 0.4, 0.4, 0.015)} castShadow receiveShadow><meshStandardMaterial color="#b88f5c" roughness={0.95} /></mesh>
    <mesh position={[-0.22, 0.38, 0.21]} rotation-z={0.8}><planeGeometry args={[0.18, 0.18]} /><meshBasicMaterial color="#e8eef2" transparent opacity={0.35} side={THREE.DoubleSide} /></mesh>
  </group>
);

/** Un kiosco del par. `lado` "A" (arriba, el que cierra) o "B" (abajo, el que se compra el auto). */
const Kiosco: React.FC<{ t: number; T: T; lado: "A" | "B" }> = ({ t, T, lado }) => {
  const m = mes(t, T);
  const n = noche(t, T);
  const x0 = lado === "A" ? XA : XB;
  const final = t >= T.l[9] - 0.05;
  const avanza = final ? 0 : clamp((m - 1.15) / (11.75 - 1.15), 0, 1);
  const crece = lado === "B" && !final ? [T.cuanto, T.quien, T.precio].filter((x) => t > x).length * 0.025 : 0;
  const alto = lado === "B" ? 0.15 + (ANIO / 10_000_000 - 0.15) * avanza + crece : 0.15 * (1 - clamp(avanza * 1.6, 0, 1));
  // lucecita: la pantalla del celular en la puerta del kiosco de abajo, cada noche (y siempre desde la revelación)
  const luz = lado === "B" && !final && (n > 0.5 || t > T.l[7] - 0.1) ? 1 : 0;
  const decae = lado === "A" && !final ? clamp((m - 6.2) / 4, 0, 1) : 0;
  const cierra = lado === "A" && !final ? entra((t - (T.persiana - 0.1)) / 0.7) : 0;
  const calX = Math.floor(m) - 1;
  const hoja = m % 1;
  const lupa = t > T.l[1] - 0.1 && t < T.l[2] + 0.1 ? clamp((t - T.l[1]) / Math.max(0.5, T.l[2] - T.l[1]), 0, 1) : -1;
  return (
    <group position={[x0, 0, 0]}>
      <Kiosco3D t={t} ancho={ANCHO} noche={0.25 + 0.75 * n} persiana={decae * 0.7} />
      {cierra > 0 ? (
        <group position={[0, 0, 0.02]}>
          <PersianaFrente ancho={ANCHO + 0.2} alto={2.2} abierta={1 - cierra} />
          {cierra > 0.95 ? <group position={[0.4, 1.25, 0.06]} rotation-z={-0.05}><CartelPapel texto="SE ALQUILA" w={1.1} h={0.42} /></group> : null}
        </group>
      ) : null}
      {decae > 0.1 ? <group position={[PUERTA, 1.55, -0.24]} rotation-z={0.04}><CartelPapel texto="FIADO" w={0.42 * decae + 0.1} h={0.2 * decae + 0.05} /></group> : null}
      {decae > 0.2 ? <group position={[-1.0, 0, 0.55]} scale={[decae, decae, decae]}><CajaVieja /><group position={[0.55, 0, 0.1]}><CajaVieja /></group></group> : null}
      {/* pila de billetes al lado de la puerta */}
      {alto > 0.01 ? <group position={[ANCHO / 2 + 0.05, 0, 0.55]}><PilaBilletes alto={alto} /></group> : null}
      {/* la lucecita: el celular con En Claro en la puerta (de noche se ve como un brillo azul) */}
      {lado === "B" ? (
        <group position={[PUERTA, 1.33, -0.17]}>
          <Celular3D>{t > T.l[7] - 0.3 ? <PantallaApp t={appTiempo(t, T)} carpeta="tomas/v8-09" app0={0} rate={1} durGrab={APP.fin} /> : null}</Celular3D>
          {luz ? <pointLight position={[0, 0, 0.12]} intensity={1.6} distance={1.4} decay={2} color="#6fb6ff" /> : null}
          {luz && t < T.l[7] - 0.1 ? <mesh position={[0, 0, 0.0052]}><planeGeometry args={[0.072, 0.156]} /><meshBasicMaterial color="#8cc8ff" toneMapped={false} /></mesh> : null}
        </group>
      ) : null}
      {/* calendario de pared que pasa de mes en mes */}
      {!final && t >= T.l[2] - 0.05 && t < T.l[6] ? (
        <group position={[-1.1, 2.0, 0.35]} scale={[1.7, 1.7, 1.7]} rotation-x={hoja < 0.08 ? -1.4 * (1 - hoja / 0.08) : 0}>
          <HojaMes mes={MESES[clamp(calX, 0, 11)]} />
        </group>
      ) : null}
      {lupa >= 0 ? <group position={[-1.8 + lupa * 3.6, 1.3 + Math.sin(lupa * 6) * 0.15, 0.9]} rotation-z={-0.3}><Lupa3D /></group> : null}
    </group>
  );
};

/** Tiempo de la grabación de la app: Tu día en "cuánto le quedaba", Fiados en "a quién cobrarle", el precio sugerido en "qué precio subir". */
function appTiempo(t: number, T: T) {
  const p: [number, number][] = [[T.l[7], 0], [T.cuanto - 0.1, 0.3], [T.quien - 0.2, APP.fiados], [T.precio - 0.6, APP.precio - 0.6], [T.precio + 0.3, APP.precio + 0.3], [T.precio + 2.5, APP.fin]];
  if (t <= p[0][0]) return 0;
  for (let i = 0; i < p.length - 1; i++) {
    const [a, s0] = p[i], [b, s1] = p[i + 1];
    if (t < b) return s0 + (s1 - s0) * ((t - a) / (b - a));
  }
  return APP.fin;
}

/** Cámara de cada lado (idénticas, con su x). La B hace zoom a la puerta en la revelación. */
function camaras(t: number, T: T) {
  const { l } = T;
  // cuadro 0 = último cuadro: base(x0, 0). En el gancho la cámara se acerca con balanceo; en el cierre vuelve a ese mismo encuadre.
  const base = (x0: number, k: number, sw: number) => ({ pos: [x0 + Math.sin(sw) * 0.45 * k, 1.45 + 0.25 * k, 6.1 - 1.1 * k], target: [x0 + Math.sin(sw * 0.7) * 0.2 * k, 1.3, 0], fov: 40 });
  const kG = t < l[2] ? Math.sin(Math.PI * clamp(t / l[2], 0, 1) * 0.5) : 0;
  let a = base(XA, kG, t * 1.3), b = base(XB, kG, t * 1.3);
  if (t >= T.LOOP) return { a: base(XA, 0, 0), b: base(XB, 0, 0) };
  if (t >= l[2] && t < l[9] - 0.05) {
    const d = { pos: [Math.sin(t * 0.6) * 0.35, 1.45 + Math.sin(t * 0.9) * 0.1, 5.2 + Math.cos(t * 0.5) * 0.3], target: [0, 1.3, 0], fov: 40 };
    a = { ...d, pos: [XA + d.pos[0], d.pos[1], d.pos[2]], target: [XA, 1.3, 0] };
    b = { ...d, pos: [XB + d.pos[0], d.pos[1], d.pos[2]], target: [XB, 1.3, 0] };
  }
  if (t >= l[9] - 0.05) {
    const k = 1 - clamp((t - l[9]) / Math.max(1, T.LOOP - l[9]), 0, 1);
    const kk = k * k * (3 - 2 * k);
    return { a: base(XA, kk, t * 0.9), b: base(XB, kk, t * 0.9) };
  }
  // en "estaciona" la B se abre para que entre el auto
  if (t > T.estaciona - 0.3 && t < l[7]) {
    const k = entra((t - T.estaciona + 0.3) / 0.6);
    b = { pos: [XB + 2.4 * k + Math.sin(t * 0.6) * 0.35, 1.6 + 1.0 * k, 6.1 + 3.4 * k], target: [XB + 1.0 * k, 1.0, 0.8 * k], fov: 40 + 8 * k };
  }
  // revelación: zoom a la lucecita (el celular de la puerta)
  if (t >= l[7] - 0.1) {
    const k = entra((t - T.lucecita + 0.6) / 0.9);
    const z = { pos: [XB + PUERTA + 0.02 + Math.sin(t * 0.8) * 0.04, 1.36 + Math.cos(t * 0.6) * 0.02, 0.34 - Math.min(0.08, Math.max(0, t - T.lucecita) * 0.008)], target: [XB + PUERTA, 1.33, -0.17], fov: 36 + Math.sin(t * 0.5) * 1.5 };
    const v = { pos: [XB + 2.4, 2.6, 9.5], target: [XB + 1.0, 1.0, 0.8], fov: 48 };
    b = { pos: v.pos.map((x, i) => x + (z.pos[i] - x) * k), target: v.target.map((x, i) => x + (z.target[i] - x) * k), fov: v.fov + (z.fov - v.fov) * k };
  }
  return { a, b };
}

const Escena3D: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const n = noche(t, T);
  const { a, b } = camaras(t, T);
  const r = t >= T.l[9] - 0.05 ? 0.5 : 0.5 * (1 - entra((t - (T.lucecita - 0.7)) / 0.6));
  const cielo = mezcla("#9cc9ea", "#0b1420", n);
  const autoK = clamp((t - (T.estaciona - 0.2)) / 1.4, 0, 1);
  const autoX = XB + 8.5 - 8.0 * (1 - Math.pow(1 - autoK, 2.4));
  return (
    <>
      <Estudio fondo={cielo.startsWith("#") ? cielo : `#${new THREE.Color(cielo).getHexString()}`} niebla={[14, 40]} luz={1.05 - 0.88 * n} calida={0.4 + 0.5 * n} exposicion={1.0 - 0.3 * n} principal={[6, 9, 8]} />
      <Vereda largo={5} ancho={44} />
      <Kiosco t={t} T={T} lado="A" />
      <Kiosco t={t} T={T} lado="B" />
      {t > T.estaciona - 0.25 && t < T.l[9] - 0.05 ? (
        <group position={[autoX, 0, 2.55]} rotation-y={Math.PI}>
          <Auto3D color="#6b1f24" luces={n} rueda={-(1 - Math.pow(1 - autoK, 2.4)) * 24} />
        </group>
      ) : null}
      <Partida a={a} b={b} r={r} />
    </>
  );
};

export const MismoKiosco: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, dur);
  const loop = t >= T.LOOP;
  const tw = loop ? 0 : t;
  const { l, e } = T;
  const sil0 = e[4] + 0.05;
  const congelado = t > l[3] && t < l[4];

  const manual = [0.03, T.auto, T.cerro, l[1], l[2], T.marzo, T.mayo, l[3], T.viste, T.agosto, T.octubre, l[5], T.estaciona, T.persiana, T.lucecita, T.cuanto, T.quien, T.precio, T.cual];
  const cortes = [l[2], l[4], l[6], l[9]];
  const cam: Cam2D = (t > sil0 && t < l[5]) || congelado ? { z: 1.02 + (congelado ? (t - l[3]) * 0.01 : 0), rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : ritmo(pal, manual, [[sil0, l[5] - 0.02], [l[3], l[4]], [T.LOOP - 0.4, 999]]), loop ? [] : cortes, 0.4);
  const hs = loop ? 0 : temblor(t, [[0.03, 7], [l[5], 8], [T.estaciona + 1.1, 5], [T.persiana + 0.6, 9], [T.lucecita, 7]]);
  let wf = 0;
  if (!loop) [[l[5], 0.25], [T.lucecita, 0.2]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });

  // ---------- sonido ----------
  const calendario: number[] = [];
  let mPrev = Math.floor(mes(l[2], T));
  for (let s = l[2]; s < l[5] + 0.5; s += 1 / 30) { const m = Math.floor(mes(s, T)); if (m !== mPrev) { calendario.push(s); mPrev = m; } }
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, { en: 0.05, sfx: "ding", vol: 0.4 }, { en: 0.12, sfx: "ding", vol: 0.4 }, { en: 0, sfx: "calle", vol: 0.3 },
    ...cortes.map((a) => ({ en: a - 0.12, sfx: "whoosh", vol: 0.3 })),
    { en: l[1], sfx: "whoosh", vol: 0.45 },
    ...calendario.map((a) => ({ en: a, sfx: "hoja", vol: 0.45 })), ...calendario.map((a) => ({ en: a + 0.05, sfx: "coins", vol: 0.25 })),
    { en: l[3], sfx: "rayon", vol: 0.5 }, { en: l[3] + 0.5, sfx: "heart", vol: 0.5 }, { en: l[3] + 1.1, sfx: "heart", vol: 0.5 }, { en: l[3] + 1.7, sfx: "heart", vol: 0.5 },
    { en: l[5], sfx: "thump", vol: 0.55 },
    { en: T.estaciona - 0.2, sfx: "riser", vol: 0.3 }, { en: T.estaciona + 1.1, sfx: "thump", vol: 0.5 }, { en: T.persiana - 0.1, sfx: "metal", vol: 0.6 }, { en: T.persiana + 0.6, sfx: "slam", vol: 0.55 },
    { en: T.lucecita, sfx: "ding", vol: 0.5 }, { en: T.lucecita + 0.05, sfx: "thump", vol: 0.45 },
    ...[T.cuanto, T.quien, T.precio].map((a) => ({ en: a, sfx: "ding", vol: 0.45 })),
    { en: l[9] + 0.2, sfx: "click", vol: 0.5 }, { en: T.LOOP - 0.1, sfx: "ding", vol: 0.35 }, { en: T.LOOP - 0.03, sfx: "ding", vol: 0.35 },
  ].filter((x) => !(x.en > sil0 + 0.02 && x.en < l[5] - 0.05));

  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(sil0 * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.1 * Math.min(1, Math.max(0, sil0 * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(l[5] * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(l[5] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.1 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // ---------- capa gráfica ----------
  const tg = loop ? 0 : t;
  const r = tg >= l[9] - 0.05 || loop ? 0.5 : 0.5 * (1 - entra((tg - (T.lucecita - 0.7)) / 0.6));
  const linea = 640 * r;
  // círculo de marcador del re-gancho: da vueltas sin decir dónde; en "lucecita" se cierra sobre el celular (centro)
  const circulo = (t > l[3] && t < l[4] + 0.6) || (t > T.lucecita - 0.1 && t < T.cinco + 0.8);
  const ang = t * 3.2;
  const cx = t > T.lucecita - 0.1 ? 180 : 180 + Math.cos(ang) * 95, cy = t > T.lucecita - 0.1 ? 300 : 300 + Math.sin(ang * 1.3) * 160;
  const rad = t > T.lucecita - 0.1 ? 80 - 30 * entra((t - T.lucecita) / 0.4) : 46;
  const frente = (
    <>
      {r > 0.02 ? (
        <div style={{ left: 0, right: 0, top: linea - 13, height: 26, background: "#0f1f17", borderTop: `2px solid ${C.ambar}`, borderBottom: `2px solid ${C.ambar}`, textAlign: "center", font: `800 14px/22px ${BODY}`, color: "#fff", letterSpacing: ".04em" }}>
          <span style={{ position: "static" }}>LOS DOS VENDEN $150.000 POR DÍA (ejemplo)</span>
        </div>
      ) : null}
      {tg < l[1] - 0.05 || loop ? <Cartel texto="UNO SE COMPRÓ UN AUTO · EL OTRO CERRÓ" top={70} size={15} s={Math.min(1.08, 0.8 + sp(tg + 0.1) * 0.2) * latido(tg, 0.62, 0.03)} rot={-1.5 + Math.sin(tg * 4) * 1} /> : null}
      {!loop && t >= l[1] - 0.05 && t < l[2] + 0.3 ? <Cartel texto="ENCONTRÁ LA DIFERENCIA" top={70} fondo={C.verde} color={C.ambar} size={20} s={sp(t - l[1], 1.06) * latido(t, 0.5, 0.05)} rot={-2} /> : null}
      {!loop && t >= l[3] && t < l[4] ? <Cartel texto="UNA SOLA DIFERENCIA" top={70} size={22} s={sp(t - l[3], 1.06) * latido(t, 0.5, 0.05)} rot={Math.sin(t * 5) * 1.5} /> : null}
      {!loop && t >= T.estaciona && t < l[7] - 0.05 ? <Rotulo t={t} desde={T.estaciona + 0.6} texto="$14.292.000 en el año (ejemplo)" top={linea + 26} color={C.hoja} size={16} /> : null}
      {!loop && t >= l[7] - 0.05 && t < l[9] - 0.05 ? <Cartel texto={t < l[8] ? "ESA LUCECITA" : "5 MINUTOS POR NOCHE"} top={70} fondo={C.verde} color={C.ambar} size={22} s={sp(t - l[7], 1.06) * latido(t, 0.6, 0.03)} rot={-2} /> : null}
      {circulo ? <div style={{ left: cx - rad, top: cy - rad, width: rad * 2, height: rad * 2, borderRadius: "50%", border: "4px solid #ff3b30", boxShadow: "0 0 10px #ff3b3088", transform: `rotate(${t * 200}deg)`, borderRightColor: "transparent" }} /> : null}
      {!loop && t >= l[9] - 0.05 ? <CupoFundadores t={t} desde={l[9]} top={150} /> : null}
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, e[0] + 0.1], [sil0, l[5] + 0.05], [l[9] - 0.05, 999]]}
      fondo={<div style={{ inset: 0, background: "#0b1420" }} />}
      tres={<Escena3D t={congelado ? l[3] + 0.05 : tw} T={T} />}
      frente={frente}
      sobre={musica}
    />
  );
};
