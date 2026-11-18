import React, { useMemo } from "react";
import * as THREE from "three";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { GUION_V8_08, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, camaraClaves, lineasDeVoz, temblor, type Cam2D, type Clave } from "../v6/comun";
import { Cartel, CupoFundadores, Rotulo, entra, latido, ritmo, sp } from "./comun";
import { Camara, Estudio, PantallaApp, Profundidad, cajaR, useLienzo } from "./estudio3d";
import { C } from "./iconos";
import { Calculadora3D, CartelQR3D, Celular3D, Cuaderno3D, Kiosco3D, Moneda3D, PersianaFrente, Vereda } from "./modelos3d";

// V8-08 "La cuenta regresiva" (videos/guiones/V8-08-CUENTA-REGRESIVA.md). Un reloj de 0:30 y una persiana que baja con cada fuga.
// La persiana es el misterio a la vista: su altura sale de las fugas (función del tiempo). En Claro la frena a 4 cm del piso.

const g = GUION_V8_08;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ANCHO = 4.4, ALTO = 2.25;
// grabación real de la app (app/scripts/grabar-v8.cjs v8-08: cierre por voz que da $23.500)
const APP = { hablar: 0.766, entendio: 3.607, resultado: 4.914, fin: 7.519 };
const FUGAS = [
  { txt: "PRECIO VIEJO −$5.000/día", pos: [0.9, 0, 1.1] as [number, number, number] },
  { txt: "FIADO −$8.000/día", pos: [-1.35, 0, 1.45] as [number, number, number] },
  { txt: "QR −$3.000/día", pos: [1.75, 0, 1.35] as [number, number, number] },
  { txt: "DORMIDO −$95.000", pos: [-0.25, 0, 1.75] as [number, number, number] },
];

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  const T = {
    l, e, dur,
    kiosco: w(0, "kiosco", 1.8),
    viejo: w(1, "viejo", e[1] - 0.4), vuelve: w(2, "vuelve", e[2] - 0.4), qr: w(3, "qr", e[3] - 0.4), deposito: w(4, "depósito", e[4] - 0.5),
    mitad: w(5, "mitad", l[5] + 0.3), peor: w(5, "peor", e[5] - 0.4),
    numero: w(6, "número", l[6] + 0.9), perdiste: w(6, "perdiste", e[6] - 0.6),
    minuto: w(7, "minuto", e[7] - 0.5), frena: w(8, "frena", e[8] - 0.3),
    link: w(9, "link", e[9] - 0.9),
    LOOP: dur - 0.27,
    app0: 0, rate: 1,
  };
  const hablar = T.l[7] + 0.35;
  T.rate = clamp((APP.resultado - APP.hablar) / Math.max(0.8, T.minuto - hablar), 0.8, 2);
  T.app0 = hablar - APP.hablar / T.rate;
  return T;
}
type T = ReturnType<typeof tiempos>;
const golpes = (T: T) => [T.viejo, T.vuelve, T.qr, T.deposito];

/** Altura de la persiana: 1 = arriba, 0 = en el piso. Baja un salto con rebote en cada fuga; en "número" cae a 30 cm; se frena a 4 cm y sube. */
function abierta(t: number, T: T) {
  const pasos: [number, number][] = [[T.viejo, 0.9], [T.vuelve, 0.8], [T.qr, 0.7], [T.deposito, 0.46], [T.numero, 0.3 / ALTO]];
  let a = 1, prev = 1;
  for (const [en, h] of pasos) {
    if (t < en) break;
    const k = clamp((t - en) / 0.28, 0, 1);
    const reb = k >= 1 ? Math.exp(-8 * (t - en - 0.28)) * Math.sin((t - en - 0.28) * 30) * 0.012 : 0;
    a = prev + (h - prev) * (k * k) + reb;
    prev = h;
  }
  // tiembla en el re-gancho; después de "número" sigue bajando despacio hasta 4 cm y en "frena" sube de golpe
  if (t > T.l[5] && t < T.numero) a += Math.sin(t * 40) * 0.004;
  if (t > T.numero + 0.3) a = Math.max(0.04 / ALTO, 0.3 / ALTO - ((0.26 / ALTO) * clamp((t - T.numero - 0.3) / Math.max(0.5, T.frena - T.numero - 0.3), 0, 1)));
  if (t > T.frena) a = 0.04 / ALTO + (1 - 0.04 / ALTO) * entra((t - T.frena - 0.25) / 0.45);
  return clamp(a, 0, 1.01);
}
/** Reloj: 0:30 al empezar; corre hasta 0:03 justo cuando la persiana se frena y ahí se congela (en verde). */
const reloj = (t: number, T: T) => (t >= T.frena ? 3 : Math.max(3, Math.ceil(30 - (27 * t) / T.frena)));

function claves(T: T): Clave[] {
  const { l } = T;
  const c0: Clave = { t: 0, pos: [0.15, 1.3, 6.3], target: [0, 1.25, 0], fov: 50 };
  return [
    c0,
    { t: l[1] - 0.05, pos: [0.1, 1.32, 5.7], target: [0, 1.25, 0], fov: 50 },
    { t: l[1] + 0.3, pos: [1.9, 1.0, 3.9], target: [0.6, 0.7, 0.6], fov: 48 },
    { t: l[2] + 0.3, pos: [-2.3, 1.05, 3.9], target: [-1.0, 0.6, 0.9], fov: 48 },
    { t: l[3] + 0.3, pos: [2.9, 1.05, 3.9], target: [1.4, 0.6, 0.9], fov: 48 },
    { t: l[4] + 0.3, pos: [0.4, 1.15, 4.4], target: [-0.2, 0.7, 1.0], fov: 48 },
    { t: l[5] + 0.25, pos: [0.7, 1.25, 2.9], target: [0, 1.2, 0], fov: 46 },
    { t: l[6] - 0.1, pos: [0.55, 1.2, 2.5], target: [0, 1.1, 0], fov: 45 },
    { t: l[6] + 0.3, pos: [-29.72, 1.55, -0.72], target: [-29.7, 1.05, 0.05], fov: 46 },
    { t: T.perdiste, pos: [-29.8, 1.6, -1.2], target: [-29.9, 1.0, 0.8], fov: 50 },
    { t: l[7] - 0.1, pos: [-29.85, 1.55, -1.25], target: [-29.95, 1.0, 0.9], fov: 50 },
    { t: l[7] + 0.4, pos: [-29.9, 1.25, -0.62], target: [-30.05, 1.13, 0.0], fov: 40 },
    { t: T.frena - 0.1, pos: [-29.92, 1.27, -0.75], target: [-30.05, 1.13, 0.0], fov: 41 },
    { t: T.frena + 0.35, pos: [-29.9, 1.45, -1.4], target: [-30, 1.1, 1.6], fov: 54 },
    { t: l[9] - 0.05, pos: [-29.88, 1.5, -1.5], target: [-30, 1.15, 1.6], fov: 54 },
    { t: l[9] + 0.4, pos: [0.13, 1.31, 6.15], target: [0, 1.25, 0], fov: 50 },
    { ...c0, t: T.LOOP },
  ];
}

/** Grieta de luz roja en el piso (crece con `k`; `cerrada` 0 → 1 la apaga). */
const Grieta: React.FC<{ semilla: number; k: number; cerrada: number; largo?: number }> = ({ semilla, k, cerrada, largo = 1.6 }) => {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    let x = 0, z = 0;
    for (let i = 0; i <= 14; i++) {
      pts.push(new THREE.Vector3(x, 0.004, z));
      x += (rnd(semilla * 31 + i) - 0.5) * 0.18;
      z += largo / 14;
    }
    return pts;
  }, [semilla, largo]);
  const n = Math.max(2, Math.round(geo.length * clamp(k, 0, 1)));
  const curva = new THREE.CatmullRomCurve3(geo.slice(0, n));
  const tubo = new THREE.TubeGeometry(curva, n * 4, 0.012, 6, false);
  const brillo = (1 - cerrada) * clamp(k * 3, 0, 1);
  if (brillo <= 0.01) return null;
  return (
    <mesh geometry={tubo}>
      <meshBasicMaterial color="#ff3b30" toneMapped={false} transparent opacity={brillo} />
    </mesh>
  );
};

/** Interior del kiosco (mostrador, estantes, la persiana del frente vista desde adentro y la calle iluminada atrás). */
const Interior: React.FC<{ t: number; T: T; a: number }> = ({ t, T, a }) => {
  const madera = useLienzo("madera-int", 256, 256, (x, w, h) => {
    x.fillStyle = "#8a5a3c"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(60,35,20,${0.15 + rnd(i) * 0.2})`; x.lineWidth = 1 + rnd(i + 1) * 2; x.beginPath(); x.moveTo(0, rnd(i + 2) * h); x.bezierCurveTo(w * 0.3, rnd(i + 3) * h, w * 0.6, rnd(i + 4) * h, w, rnd(i + 5) * h); x.stroke(); }
  });
  const datos = [T.app0 + APP.hablar / T.rate, T.app0 + APP.entendio / T.rate, T.app0 + APP.resultado / T.rate];
  return (
    <group position={[-30, 0, 0]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0.5]} receiveShadow><planeGeometry args={[6, 6]} /><meshStandardMaterial color="#b8b2a6" roughness={0.8} /></mesh>
      <mesh position={[0, 1.6, -1.9]} receiveShadow><planeGeometry args={[6, 3.2]} /><meshStandardMaterial color="#e6dccb" roughness={0.9} /></mesh>
      {/* mostrador */}
      <mesh position={[0, 0.5, 0]} geometry={cajaR(1.9, 1.0, 0.65, 0.03)} castShadow receiveShadow><meshStandardMaterial map={madera} roughness={0.6} /></mesh>
      <mesh position={[0, 1.02, 0]} castShadow receiveShadow><boxGeometry args={[2.0, 0.04, 0.72]} /><meshPhysicalMaterial color="#e9e4da" roughness={0.3} clearcoat={0.6} /></mesh>
      {/* calculadora con "?????" (la peor fuga) y, en el truco, el celular con la app */}
      <group position={[0.32, 1.04, -0.05]} rotation-y={Math.PI} scale={[2.2, 2.2, 2.2]}>
        <Calculadora3D pantalla={t > T.l[8] ? "23.500" : "?????"} />
      </group>
      {t > T.l[7] - 0.3 ? (
        <group position={[-0.05, 1.13 + (1 - entra((t - T.l[7] + 0.3) / 0.5)) * -0.15, 0.0]} rotation-y={Math.PI}>
          <group rotation-x={-0.25}>
            <Celular3D><PantallaApp t={t} carpeta="tomas/v8-08" app0={T.app0} rate={T.rate} durGrab={APP.fin} /></Celular3D>
          </group>
        </group>
      ) : null}
      {/* grietas rojas en el piso que la app va cerrando */}
      {[0, 1, 2].map((i) => (
        <group key={i} position={[-1.1 + i * 1.1, 0, 0.5]} rotation-y={0.4 - i * 0.4}>
          <Grieta semilla={i + 7} k={entra((t - (T.numero + i * 0.2)) / 0.5)} cerrada={entra((t - datos[i]) / 0.3)} largo={1.4} />
        </group>
      ))}
      {/* frente del local visto desde adentro: la persiana y la calle iluminada del otro lado */}
      <group position={[0, 0, 2.1]} rotation-y={Math.PI}>
        <PersianaFrente ancho={3.0} alto={ALTO} abierta={a} chispas={0} t={t} />
      </group>
      <mesh position={[0, 1.2, 2.6]} rotation-y={Math.PI}><planeGeometry args={[4, 2.6]} /><meshBasicMaterial color="#ffd9a0" toneMapped={false} /></mesh>
      <pointLight position={[0, 2.5, 0.3]} intensity={4} distance={6} decay={1.6} color="#ffe0b0" castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, 0.4, 2.3]} intensity={3 * a} distance={4} decay={1.5} color="#ffd9a0" />
    </group>
  );
};

const Escena3D: React.FC<{ t: number; T: T; cam: ReturnType<typeof camaraClaves> }> = ({ t, T, cam }) => {
  const a = abierta(t, T);
  const G = golpes(T);
  const cayendo = [...G, T.numero].some((x) => t > x - 0.05 && t < x + 0.45) ? 1 : 0;
  const enfoque = Math.hypot(cam.pos[0] - cam.target[0], cam.pos[1] - cam.target[1], cam.pos[2] - cam.target[2]);
  const dentro = cam.pos[0] < -10;
  return (
    <>
      <Estudio fondo="#0b1116" niebla={[9, 30]} luz={0.42} calida={0.9} exposicion={0.95} principal={[4, 7, 6]} />
      <Camara c={cam} t={t} />
      {!dentro ? (
        <>
          <pointLight position={[0, 3.4, 3.2]} intensity={5} distance={9} decay={1.6} color="#ffd9a0" castShadow shadow-mapSize={[1024, 1024]} />
          <Vereda largo={5} ancho={24} />
          <Kiosco3D t={t} noche={0.3 + 0.7 * a} />
          <PersianaFrente ancho={ANCHO} alto={ALTO} abierta={a} chispas={cayendo} t={t} />
          {/* las fugas: grieta roja + su objeto */}
          {FUGAS.map((f, i) => (
            <group key={i} position={[f.pos[0], 0, 0.15]} rotation-y={(f.pos[0] > 0 ? -1 : 1) * 0.25}>
              <Grieta semilla={i + 1} k={entra((t - (G[i] - 0.5)) / 0.5)} cerrada={entra((t - T.l[9]) / 0.3)} largo={f.pos[2] + 0.3} />
            </group>
          ))}
          {t > T.l[2] - 0.2 && t < T.l[9] ? (
            <group position={FUGAS[1].pos} rotation-y={0.3} scale={[1.8, 1.8, 1.8]}>
              <Cuaderno3D cierre={0} />
              {Array.from({ length: 8 }, (_, i) => {
                const d = t - (T.l[2] + 0.1 + i * 0.12);
                if (d < 0 || d > 1.2) return null;
                return <mesh key={i} position={[(rnd(i) - 0.5) * 0.3 + d * 0.3, 0.05 + d * 0.7, d * 0.2]} rotation={[d * 4, d * 3, i]}><planeGeometry args={[0.12, 0.09]} /><meshStandardMaterial color="#fffdf4" side={THREE.DoubleSide} /></mesh>;
              })}
            </group>
          ) : null}
          {t > T.l[3] - 0.3 && t < T.l[9] ? (
            <group position={FUGAS[2].pos} rotation-y={-0.4} scale={[1.6, 1.6, 1.6]}>
              <CartelQR3D />
              <pointLight position={[0, 0.2, 0.2]} intensity={1.5 * entra((t - T.l[3]) / 0.3)} distance={1} color="#7cf2a8" />
              {Array.from({ length: 10 }, (_, i) => {
                const d = t - (T.l[3] + 0.1 + i * 0.08);
                if (d < 0 || d > 0.6) return null;
                const k = d / 0.6;
                return <group key={i} position={[(rnd(i) - 0.5) * 0.6 * (1 - k), 0.05 + (1 - k) * 0.3 + k * 0.15, (1 - k) * 0.5]} rotation-y={d * 20}><Moneda3D /></group>;
              })}
            </group>
          ) : null}
          {t > T.l[4] - 0.3 && t < T.l[9] ? (
            <group position={FUGAS[3].pos}>
              {[[0, 0.2, 0], [0.45, 0.2, 0.05], [0.2, 0.6, 0.02]].map(([x, y, z], i) => (
                <group key={i} position={[x, y, z]}>
                  <mesh><boxGeometry args={[0.42, 0.4, 0.38]} /><meshStandardMaterial color="#5fc8ff" emissive="#5fc8ff" emissiveIntensity={0.35} transparent opacity={0.22} depthWrite={false} /></mesh>
                  <lineSegments geometry={new THREE.EdgesGeometry(new THREE.BoxGeometry(0.42, 0.4, 0.38))}><lineBasicMaterial color="#bfe8ff" /></lineSegments>
                  <mesh position={[0, 0.21, 0]} rotation-x={-Math.PI / 2}><planeGeometry args={[0.4, 0.36]} /><meshStandardMaterial color="#eaf7ff" transparent opacity={0.6} roughness={0.2} /></mesh>
                </group>
              ))}
            </group>
          ) : null}
        </>
      ) : (
        <Interior t={t} T={T} a={a} />
      )}
      <Profundidad foco={enfoque} apertura={0.012} max={0.011} />
    </>
  );
};

export const CuentaRegresiva: React.FC<VideoProps> = ({ voz, palabras }) => {
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
  const cam3 = camaraClaves(tw, claves(T));
  const G = golpes(T);
  const datos = [T.app0 + APP.hablar / T.rate, T.app0 + APP.entendio / T.rate, T.app0 + APP.resultado / T.rate];

  const manual = [0.03, T.kiosco, ...G, T.mitad, T.peor, T.numero, T.perdiste, ...datos, T.frena, T.frena + 0.5, T.link];
  const cortes = [l[1], l[2], l[3], l[4], l[6], l[9]];
  const cam: Cam2D = t > sil0 && t < l[6] ? { z: 1.02, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : ritmo(pal, manual, [[sil0, l[6] - 0.02], [T.LOOP - 0.4, 999]]), loop ? [] : cortes, 0.45);
  const hs = loop ? 0 : temblor(t, [[0.03, 8], ...G.map((x) => [x + 0.28, 6] as [number, number]), [T.numero + 0.28, 12], [T.frena, 8], [T.frena + 0.7, 10]]);
  let wf = 0, red = 0;
  if (!loop) {
    [[T.frena + 0.7, 0.3]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });
    if (t > l[5] && t < T.frena) red = 0.04 + 0.04 * Math.abs(Math.sin(t * 6));
  }

  // ---------- sonido: el tic del reloj no para (salvo en el silencio y cuando se congela) ----------
  const tics: number[] = [];
  for (let s = 29; s >= 3; s--) { const en = ((30 - s) * T.frena) / 27; if (en < T.frena && !(en > sil0 && en < l[6])) tics.push(en); }
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, { en: 0, sfx: "tic", vol: 0.6 }, { en: 0, sfx: "calle", vol: 0.3 },
    ...tics.map((a) => ({ en: a, sfx: "tic", vol: t > l[5] ? 0.55 : 0.4 })),
    ...cortes.map((a) => ({ en: a - 0.12, sfx: "whoosh", vol: 0.3 })),
    ...G.map((a) => ({ en: a, sfx: "metal", vol: 0.55 })), ...G.map((a) => ({ en: a + 0.28, sfx: "thump", vol: 0.5 })), ...G.map((a) => ({ en: a + 0.3, sfx: "click", vol: 0.45 })),
    { en: l[2] + 0.1, sfx: "hoja", vol: 0.55 }, { en: l[3] + 0.1, sfx: "coins", vol: 0.5 }, { en: l[4] + 0.1, sfx: "vidrio", vol: 0.35 },
    { en: l[5], sfx: "heart", vol: 0.5 }, { en: l[5] + 0.55, sfx: "heart", vol: 0.55 }, { en: l[5] + 1.05, sfx: "heart", vol: 0.6 },
    { en: sil0 + 0.05, sfx: "rattle", vol: 0.3 },
    { en: T.numero, sfx: "metal", vol: 0.6 }, { en: T.numero + 0.28, sfx: "slam", vol: 0.55 },
    ...datos.map((a) => ({ en: a, sfx: "ding", vol: 0.45 })),
    { en: T.frena, sfx: "metal", vol: 0.6 }, { en: T.frena + 0.25, sfx: "riser", vol: 0.35 }, { en: T.frena + 0.7, sfx: "thump", vol: 0.6 },
    { en: l[9] + 0.3, sfx: "click", vol: 0.5 }, { en: T.LOOP - 0.12, sfx: "whoosh", vol: 0.3 }, { en: T.LOOP, sfx: "tic", vol: 0.6 },
  ].filter((x) => !(x.en > sil0 + 0.02 && x.en < l[6] - 0.05 && x.sfx !== "rattle"));

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

  // ---------- capa gráfica: el reloj (siempre) + un texto ----------
  const tg = loop ? 0 : t;
  const seg = reloj(tg, T);
  const verde = tg >= T.frena;
  const parpadea = tg > l[5] && tg < T.frena && Math.floor(tg * 4) % 2 === 0;
  const fuga = G.map((a, i) => ({ a, i })).reverse().find((x) => t >= x.a - 0.05);
  const frente = (
    <>
      <div style={{ left: 0, right: 0, top: 54, textAlign: "center" }}>
        <span style={{ position: "static", display: "inline-block", padding: "2px 18px 4px", borderRadius: 14, background: "#0b0f0dcc", border: `2px solid ${verde ? "#3ddc84" : "#ff3b30"}`, font: `800 56px/1 ${DISP}`, letterSpacing: ".04em", color: verde ? "#3ddc84" : parpadea ? "#ff8a80" : "#ff3b30", textShadow: `0 0 18px ${verde ? "#3ddc84" : "#ff3b30"}`, fontVariantNumeric: "tabular-nums", transform: `scale(${latido(tg, 1, 0.03)})` }}>0:{String(seg).padStart(2, "0")}</span>
      </div>
      {tg < l[1] - 0.05 || loop ? <Cartel texto="30 SEGUNDOS PARA SALVARLO" top={132} size={21} s={Math.min(1.08, 0.8 + sp(tg + 0.1) * 0.2) * latido(tg, 0.62, 0.04)} rot={-2 + Math.sin(tg * 4) * 1.2} /> : null}
      {!loop && fuga && t < l[5] - 0.05 ? <Rotulo t={t} desde={fuga.a - 0.05} texto={`${FUGAS[fuga.i].txt} (ejemplo)`} top={136} size={17} /> : null}
      {!loop && t >= l[5] - 0.05 && t < sil0 ? <Cartel texto="VA POR LA MITAD…" top={134} size={24} s={sp(t - l[5], 1.06) * latido(t, 0.5, 0.05)} rot={Math.sin(t * 6) * 2} /> : null}
      {!loop && t >= l[6] - 0.02 && t < l[7] - 0.05 ? <Cartel texto="SIN TU NÚMERO" top={134} size={26} s={sp(t - T.numero, 1.08) * latido(t, 0.5, 0.05)} rot={-2} /> : null}
      {!loop && t >= l[7] - 0.05 && t < l[9] - 0.05 ? (
        t > datos[2] - 0.05 ? <Rotulo t={t} desde={datos[2]} texto="HOY TE QUEDARON $23.500 (ejemplo)" top={136} color={C.hoja} size={18} /> : (
          <div style={{ left: 0, right: 0, top: 138, textAlign: "center", transform: `scale(${sp(t - l[7], 1.06)})` }}>
            <span style={{ position: "static", font: `800 21px/1.15 ${DISP}`, color: "#fff", textShadow: "0 3px 12px #000a" }}>En Claro <span style={{ position: "static", color: C.ambar }}>te lo dice en un minuto</span></span>
          </div>
        )
      ) : null}
      {!loop && t >= l[9] - 0.05 ? <CupoFundadores t={t} desde={l[9]} top={132} /> : null}
      <div style={{ right: 14, bottom: 14, font: `600 11px ${BODY}`, color: "#ffffff88" }}>(ejemplo)</div>
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={red} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, e[0] + 0.1], [sil0, l[6] + 0.05], [l[9] - 0.05, 999]]}
      fondo={<div style={{ inset: 0, background: "#0b1116" }} />}
      tres={<Escena3D t={tw} T={T} cam={cam3} />}
      frente={frente}
      sobre={musica}
    />
  );
};
