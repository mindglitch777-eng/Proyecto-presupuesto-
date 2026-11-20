import React from "react";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { GUION_P5, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { LogoEnClaro, Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { AppGrabada, aPantalla, entra, ritmo, sp } from "../v8/comun";
import { Camara, Estudio } from "../v8/estudio3d";
import { C } from "../v8/iconos";
import { ManoBrazo, Polvo } from "../v8/modelos3d";
import { Cinta } from "../piloto/modelos";
import { SUB_TOP } from "../piloto/comun";
import { Cine, Texto3D } from "../vnc/cine";
import { Local, Mostrador, Tubo } from "../vnc/modelos";
import { Alfajor, CajaVidrio, EtiquetaGrande, FacturaNueva, GondolaVieja, Grieta, Kiosquero, Monedas, TuboVidrio } from "./modelos";

// "¡Estás regalando tu ganancia!" (30 s). Precios desactualizados. Cuenta (EJEMPLO): comprabas a $800 y vendías a $1.000 (te quedaban $200);
// el costo pasa a $950 y seguís a $1.000 → $50. Diferencia $150 por unidad × 100 = $15.000 menos de margen (comparación, no pérdida neta).
// Pantalla real: Precios (demo p5): alfajor $1.000 que te deja $200; con costo $950 la app dice "Te deja $50 por unidad (5%)".

const g = GUION_P5;
type V3 = [number, number, number];
type Cam = { pos: V3; target: V3; fov: number };
const mez = (a: Cam, b: Cam, k: number): Cam => ({ pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, target: a.target.map((v, i) => v + (b.target[i] - v) * k) as V3, fov: a.fov + (b.fov - a.fov) * k });
const suave = (k: number) => { const x = clamp(k, 0, 1); return x * x * (3 - 2 * x); };
const latigo = (k: number) => { const x = clamp(k, 0, 1); return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2; };
const rnd = (i: number, k = 0) => { const x = Math.sin((i + 1) * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

const KQ: V3 = [0, 0, -0.28]; // el kiosquero
const GRIETA: V3 = [0.02, 0.996, 0.42];
const TAG: V3 = [0.95, 0.86, -0.79];
const TUBOS: V3 = [0, 0.993, 0.44];
const CAJA_V: V3 = [0.62, 0.993, 0.42];

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e, dur,
    ganancia: w(0, "ganancia", 1.1), cuenta: w(0, "cuenta", e[0] - 0.4),
    aumenta: w(1, "aumenta", l[1] + 0.7), cobrando: w(1, "cobrando", l[1] + 2.0),
    antes: l[2], doscientos: w(2, "doscientos", l[2] + 0.5), ahora: w(2, "ahora", l[2] + 1.8), cincuenta: w(2, "cincuenta", e[2] - 0.6),
    cien: w(3, "cien", l[3] + 0.15), quince: w(3, "quince", l[3] + 0.5), menos: w(3, "menos", e[3] - 0.4),
    gondola: w(4, "góndola", l[4] + 1.0), viejos: w(4, "viejos", e[4] - 0.5),
    precios: w(5, "precios", l[5] + 1.4),
    doce: w(6, "doce", l[6] + 1.4), siempre: w(6, "siempre", e[6] - 0.5),
  };
}
type T = ReturnType<typeof tiempos>;

function camara(t: number, T: T): Cam {
  const { l, e } = T;
  const mostrador: Cam = { pos: [0.5, 1.18, 1.35], target: [0.05, 1.02, 0.35], fov: 48 };
  const cara: Cam = { pos: [GRIETA[0] + 0.04, GRIETA[1] + 0.32, GRIETA[2] + 0.2], target: [GRIETA[0], GRIETA[1] - 0.05, GRIETA[2]], fov: 40 };
  if (t < l[1] - 0.05) return mez(mostrador, cara, latigo((t - 1.25) / 0.28));
  if (t < l[2] - 0.05) {
    const factura: Cam = { pos: [0.12, 1.5, 0.98], target: [0.12, 1.0, 0.48], fov: 44 };
    const etiqueta: Cam = { pos: [TAG[0] + 0.03, TAG[1] + 0.08, TAG[2] + 0.72], target: TAG, fov: 40 };
    const vende: Cam = { pos: [0.45, 1.45, 1.9], target: [0, 1.25, -0.1], fov: 46 };
    const c1 = mez(cara, factura, latigo((t - l[1] + 0.05) / 0.3));
    const c2 = mez(c1, etiqueta, latigo((t - (T.aumenta + 0.25)) / 0.28));
    return mez(c2, vende, latigo((t - (T.cobrando + 0.35)) / 0.28));
  }
  if (t < l[3] - 0.05) {
    const tubos: Cam = { pos: [0.02, 1.2, 1.0], target: [0, 1.09, TUBOS[2]], fov: 40 };
    return mez({ pos: [0.45, 1.45, 1.9], target: [0, 1.25, -0.1], fov: 46 }, tubos, latigo((t - l[2] + 0.05) / 0.32));
  }
  if (t < l[4] - 0.05) {
    const cinta: Cam = { pos: [0.75, 1.42, 1.6], target: [0.05, 1.05, 0.4], fov: 46 };
    const c1 = mez({ pos: [0.02, 1.2, 1.0], target: [0, 1.09, TUBOS[2]], fov: 40 }, cinta, latigo((t - l[3] + 0.05) / 0.32));
    return mez(c1, { pos: [0.9, 1.3, 1.15], target: [CAJA_V[0], 1.05, CAJA_V[2]], fov: 42 }, suave((t - (T.menos - 0.9)) / 0.8));
  }
  if (t < l[5] - 0.05) {
    // recorrido por la góndola de atrás
    const k = suave((t - l[4]) / Math.max(1.5, e[4] - l[4] + 0.6));
    const a: Cam = { pos: [-1.35 + 2.7 * k, 1.32, -0.15], target: [-1.15 + 2.7 * k, 0.95, -1.0], fov: 46 };
    return mez({ pos: [0.9, 1.3, 1.15], target: [CAJA_V[0], 1.05, CAJA_V[2]], fov: 42 }, a, latigo((t - l[4] + 0.05) / 0.3));
  }
  if (t < l[7] - 0.05) return { pos: [0.25 + Math.sin(t * 0.5) * 0.08, 1.48, 1.85], target: [0, 1.45, -0.3], fov: 46 };
  const k = suave((t - l[7]) / 1.4);
  return mez({ pos: [0.25, 1.48, 1.85], target: [0, 1.45, -0.3], fov: 46 }, { pos: [TAG[0] - 0.08, TAG[1] + 0.1, TAG[2] + 0.75], target: TAG, fov: 42 }, k);
}

/** Monedas del cobro: 12 caen sobre el mostrador y 6 se van por la grieta. */
function poseCobro(i: number, t: number): [number, number, number, number, number, number] {
  const a = 0.0 + i * 0.03, k = clamp((t + 0.25 - a) / 0.45, 0, 1);
  const x0 = 0.12 + (rnd(i) - 0.5) * 0.12, z0 = 0.62 + (rnd(i, 1) - 0.5) * 0.08;
  const xs = 0.1 + (rnd(i, 2) - 0.5) * 0.28, zs = 0.5 + (rnd(i, 3) - 0.5) * 0.16;
  let x = x0 + (xs - x0) * k, z = z0 + (zs - z0) * k, y = 1.25 - 0.25 * k * k + (k >= 1 ? 0 : Math.sin(k * Math.PI) * 0.05);
  if (k >= 1) y = 1.0;
  const seVa = i % 2 === 0;
  if (seVa) {
    const d = clamp((t - (0.55 + i * 0.05)) / 0.5, 0, 1);
    x += (GRIETA[0] + (rnd(i, 4) - 0.5) * 0.25 - x) * d; z += (GRIETA[2] - z) * d;
    const cae = clamp((t - (0.95 + i * 0.12)) / 0.9, 0, 1);
    y -= cae * cae * 0.9;
    if (cae >= 0.6) return [0, 0, 0, 0, 0, 0];
    return [x, Math.max(0.99, y), z, cae * 2, i, 1 - cae / 0.6];
  }
  return [x, y, z, 0, i, 1];
}

const Escena3D: React.FC<{ t: number; T: T; post: { zoom: number; flash: number; rojo: number } }> = ({ t, T, post }) => {
  const { l, e } = T;
  const cam = camara(t, T);
  const foco = Math.hypot(cam.target[0] - cam.pos[0], cam.target[1] - cam.pos[1], cam.target[2] - cam.pos[2]);
  const tubo = (t >= T.l[6] - 0.1 && t < T.l[7] - 0.05 ? 0.45 : 1) * (rnd(Math.floor(t * 12), 3) > 0.94 ? 0.3 : 1);

  // pose del kiosquero (el mismo en todo el video)
  const entrega = t < 1.0 ? Math.sin(clamp(t / 0.9, 0, 1) * Math.PI) : t >= T.cobrando + 0.1 && t < l[2] ? Math.sin(clamp((t - T.cobrando - 0.1) / 0.9, 0, 1) * Math.PI) : 0;
  const susto = t >= 1.45 && t < l[1] ? entra((t - 1.45) / 0.15) : 0;
  const giro = t >= l[4] && t < l[5] ? -1 + 2 * suave((t - l[4]) / Math.max(1.5, e[4] - l[4] + 0.6)) : 0;

  // máquina de vidrio: antes 4 monedas ($200), ahora 1 ($50); el resto se va como costo
  const verTubos = t >= l[2] - 0.2 && t < l[3] + 0.2;
  const poseTubo = (i: number): [number, number, number, number, number, number] => {
    const antes = i < 20;
    const j = antes ? i : i - 20;
    const a = (antes ? T.antes + 0.1 : T.ahora + 0.05) + j * 0.035;
    const k = clamp((t - a) / 0.4, 0, 1);
    if (k <= 0) return [0, 0, 0, 0, 0, 0];
    const queda = antes ? j < 4 : j < 1;
    const tx = antes ? TUBOS[0] - 0.13 : TUBOS[0] + 0.13;
    if (queda) {
      const y = TUBOS[1] + 0.024 + j * 0.022;
      return [tx, y + (1 - k * k) * 0.45, TUBOS[2], 0, 0, 1];
    }
    // costo: cae hacia atrás del mostrador (se lo lleva el proveedor)
    const y = 1.25 - k * 0.9;
    return [tx + (j % 2 ? 0.05 : -0.05) - k * 0.1, y, TUBOS[2] - k * 0.6, k * 3, j, y < 0.3 ? 0 : 1];
  };

  // la cinta: 100 ventas pasan; cada una deja $150 en la caja de vidrio, que se llena y cae
  const verCinta = t >= l[3] - 0.2 && t < l[4] + 0.1;
  const llena = clamp((t - (T.cien - 0.1)) / Math.max(1.0, T.menos - T.cien - 0.4), 0, 1);
  const cae = t >= T.menos - 0.15 ? entra((t - (T.menos - 0.15)) / 0.22) : 0;
  const poseCaja = (i: number): [number, number, number, number, number, number] => {
    if (i / 150 > llena) return [0, 0, 0, 0, 0, 0];
    const c = i % 6, f = Math.floor(i / 6) % 4, n = Math.floor(i / 24);
    return [CAJA_V[0] - 0.13 + c * 0.052 + (rnd(i) - 0.5) * 0.01, CAJA_V[1] + 0.01 + n * 0.022 + (1 - cae) * 0.35, CAJA_V[2] - 0.09 + f * 0.06, (rnd(i, 1) - 0.5) * 0.3, rnd(i, 2), 1];
  };

  // góndola: las etiquetas viejas se marcan en rojo una por una
  const rojo = (g0: number) => (i: number) => t >= l[4] ? entra((t - (l[4] + 0.25 + (g0 * 12 + ((i * 7) % 12)) * 0.07)) / 0.2) * (t < l[5] ? 1 : t >= l[7] ? 1 : 0) : 0;
  const tagRojo = t >= l[4] ? 1 : 0;
  const verOferta = t >= l[6] - 0.1 && t < l[7] - 0.05;
  const precio = entra((t - (T.doce - 0.25)) / 0.25);

  return (
    <>
      <Camara c={cam} t={t} mano={1.4} />
      <Estudio fondo="#040506" niebla={[4, 12]} luz={0.16} calida={0.9} exposicion={0.75} principal={[1, 4, 2]} />
      <ambientLight intensity={0.07} color="#7fa8d8" />
      <Tubo luz={tubo} x={0} z={0.3} />
      <Tubo luz={tubo * 0.8} x={0} z={1.8} />
      {/* contraluz detrás del kiosquero y neón rojo del fondo */}
      <pointLight position={[0, 2.1, -0.95]} intensity={5} distance={3} color="#ffb070" />
      <mesh position={[-0.9, 1.75, -0.28]} rotation-y={Math.PI / 2}><planeGeometry args={[0.9, 0.35]} /><meshBasicMaterial color="#ff2a2a" toneMapped={false} /></mesh>
      <pointLight position={[-0.7, 1.75, -0.28]} intensity={3} distance={2.5} color="#ff2a2a" />
      <Local />
      <Mostrador />
      <group position={[-0.95, 0, -0.98]} scale={[0.95, 0.95, 0.95]}><GondolaVieja rojo={rojo(0)} /></group>
      <group position={[0.95, 0, -0.98]} scale={[0.95, 0.95, 0.95]}><GondolaVieja rojo={rojo(1)} /></group>
      <group position={TAG}><EtiquetaGrande producto="Alfajor triple" precio="$1.000" fecha="precio del 12/08" rojo={tagRojo} /></group>
      <Polvo t={t} centro={[0, 1.8, 0.2]} radio={1.0} n={120} brillo={0.25} />
      {/* el kiosquero */}
      <group position={KQ}>
        <Kiosquero pose={{ brazo: entrega, susto, giro, mira: t >= l[1] && t < l[2] ? 0.5 : 0, respira: Math.sin(t * 2) }} />
        {entrega > 0.05 ? <group position={[0.22, 1.05 + entrega * 0.05, 0.25 + entrega * 0.35]}><Alfajor /></group> : null}
      </group>
      {/* la grieta y las monedas que se escapan */}
      {t < l[1] + 0.3 ? (
        <>
          <group position={GRIETA}><Grieta abre={entra((t - 0.35) / 0.35)} /></group>
          <Monedas n={12} radio={0.022} grosor={0.004} pose={(i) => poseCobro(i, t)} />
        </>
      ) : null}
      {t < 0.5 ? <group position={[0.18, 1.25, 0.95 - Math.sin(clamp(t / 0.5, 0, 1) * Math.PI) * 0.25]} rotation-y={-Math.PI / 2}><ManoBrazo cierra={0.3} /></group> : null}
      {/* la factura del proveedor */}
      {t >= l[1] - 0.1 && t < l[2] ? (
        <group position={[0.12, 1.03 + (1 - entra((t - l[1] + 0.1) / 0.25)) * 0.4, 0.5]} rotation={[-Math.PI / 2, 0, 0.06]}><FacturaNueva /></group>
      ) : null}
      {/* máquina de vidrio: ANTES $200 / AHORA $50 */}
      {verTubos ? (
        <>
          <group position={[TUBOS[0] - 0.13, TUBOS[1], TUBOS[2]]}><TuboVidrio rotulo="ANTES $200" color="#16a34a" /></group>
          <group position={[TUBOS[0] + 0.13, TUBOS[1], TUBOS[2]]}><TuboVidrio rotulo="AHORA $50" color="#d61f1f" /></group>
          <Monedas n={40} radio={0.038} grosor={0.02} pose={poseTubo} />
          <pointLight position={[0, 1.35, 0.75]} intensity={2} distance={1.5} color="#ffe2a0" />
        </>
      ) : null}
      {/* la cinta de 100 ventas y la caja de vidrio que se llena */}
      {verCinta ? (
        <>
          <group position={[-0.35, 0.535, 0.42]} scale={[0.5, 1, 0.5]}><Cinta t={t * 3} largo={2.0} vel={1.6} /></group>
          <group position={[0.05, 1.0, 0.42]}>
            <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.04, 0.4, 0.34]} /><meshStandardMaterial color="#2b2f2d" metalness={0.8} /></mesh>
            <mesh position={[0, 0.38, 0]}><boxGeometry args={[0.2, 0.04, 0.34]} /><meshBasicMaterial color={Math.floor(t * 10) % 2 ? "#ff2a2a" : "#7a0000"} toneMapped={false} /></mesh>
            <pointLight position={[0, 0.3, 0.2]} intensity={1.5} distance={1} color="#ff2a2a" />
          </group>
          <group position={[CAJA_V[0], CAJA_V[1] + (1 - cae) * 0.35, CAJA_V[2]]}><CajaVidrio /></group>
          <Monedas n={150} radio={0.024} grosor={0.016} pose={poseCaja} />
          {t > T.menos - 0.1 && t < T.menos + 1.0 ? <Polvo t={t} centro={[CAJA_V[0], 1.05, CAJA_V[2]]} radio={0.15 + (t - T.menos) * 0.5} n={120} brillo={1.5} /> : null}
        </>
      ) : null}
      {/* oferta: $12.900 en 3D dorado */}
      {verOferta ? (
        <group position={[0.2, 1.58 + (1 - precio) * 0.5, 0.95]} scale={[precio, precio, precio]} rotation-y={0.12 + Math.sin(t * 0.8) * 0.04}>
          <Texto3D texto="$12.900" size={0.078} fondo={0.045} color="#f5c542" metal={0.95} brillo={0.18} />
        </group>
      ) : null}
      {verOferta && t < T.doce + 1.2 ? <Polvo t={t} centro={[0.06, 1.48, 0.95]} radio={0.15 + Math.max(0, t - T.doce) * 0.5} n={90} brillo={0.9} /> : null}
      <Cine t={t} foco={verOferta ? 0.92 : foco} apertura={0.014} bloom={0.42} umbral={0.97} ca={0.0025 + post.zoom * 0.01} zoom={post.zoom} flash={post.flash} rojo={post.rojo} />
    </>
  );
};

/** Texto gigante con volumen que cae sobre la pantalla. */
const Golpe: React.FC<{ t: number; desde: number; lineas: string[]; size?: number; color?: string; top?: number; sombra?: string }> = ({ t, desde, lineas, size = 52, color = "#ff2d2d", top = 70, sombra = "#5c0000" }) => {
  if (t < desde - 0.02) return null;
  const k = clamp((t - desde) / 0.14, 0, 1);
  const s = 2.4 - 1.4 * k + (k >= 1 ? Math.sin((t - desde - 0.14) * 38) * Math.exp(-(t - desde - 0.14) * 9) * 0.05 : 0);
  const volumen = Array.from({ length: 8 }, (_, i) => `${i + 1}px ${i + 1}px 0 ${sombra}`).join(",") + ", 0 0 26px #000c, 10px 14px 22px #000";
  return (
    <div style={{ left: 0, right: 0, top, textAlign: "center", transform: `scale(${s}) rotate(-3deg)`, opacity: Math.min(1, k * 2.5) }}>
      <div style={{ position: "static", font: `800 ${size}px/0.98 ${DISP}`, color, letterSpacing: "-.02em", textShadow: volumen }}>{lineas.map((x, i) => <React.Fragment key={i}>{i ? <br /> : null}{x}</React.Fragment>)}</div>
    </div>
  );
};

export const Regalando: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, durationInFrames / fps);
  const { l, e } = T;

  const c0 = camara(t - 1 / 60, T), c1 = camara(t + 1 / 60, T);
  const ang = (c: Cam) => [Math.atan2(c.target[0] - c.pos[0], c.target[2] - c.pos[2]), Math.atan2(c.target[1] - c.pos[1], Math.hypot(c.target[0] - c.pos[0], c.target[2] - c.pos[2]))];
  const [a0, b0] = ang(c0), [a1, b1] = ang(c1);
  const mbx = Math.min(26, Math.abs(a1 - a0) * 260), mby = Math.min(20, Math.abs(b1 - b0) * 260);
  const impactos = [0, 1.45, l[1], T.ahora, T.menos - 0.15 + 0.22, T.doce];
  const zoom = impactos.reduce((s, a) => s + (t >= a && t < a + 0.25 ? 0.12 * (1 - (t - a) / 0.25) : 0), 0);
  const flash = impactos.reduce((s, a) => s + (t >= a && t < a + 0.1 ? 0.22 * (1 - (t - a) / 0.1) : 0), 0);
  const rojo = t < 1.3 ? 0.2 * Math.max(0, 1 - t) : t >= T.ahora && t < T.ahora + 0.8 ? 0.3 * (1 - (t - T.ahora) / 0.8) : 0;

  const manual = [0.02, 0.5, 1.0, 1.45, T.cuenta, l[1], T.aumenta, T.cobrando, T.antes, T.doscientos, T.ahora, T.cincuenta, T.cien, T.quince, T.menos, l[4], T.gondola, T.viejos, l[5], T.precios, l[6], T.doce, T.siempre, l[7]];
  const cam: Cam2D = camaraBeats(t, ritmo(pal, manual, [], 0.5), [], 0.5);
  const hs = temblor(t, [[0.0, 12], [1.45, 10], [l[1], 8], [T.ahora, 8], [T.menos + 0.07, 18], [T.doce, 10]]);

  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump", vol: 0.8 }, { en: 0, sfx: "buzz", vol: 0.15 }, { en: 0.05, sfx: "coins", vol: 0.7 }, { en: 0.35, sfx: "vidrio", vol: 0.45 },
    { en: 0.7, sfx: "coins", vol: 0.4 }, { en: 1.0, sfx: "riser", vol: 0.25 }, { en: 1.25, sfx: "whoosh", vol: 0.6 }, { en: 1.45, sfx: "heart", vol: 0.7 }, { en: 1.45, sfx: "slam", vol: 0.5 },
    { en: l[1] - 0.05, sfx: "whoosh", vol: 0.45 }, { en: l[1] + 0.12, sfx: "papel", vol: 0.6 }, { en: T.aumenta + 0.55, sfx: "whoosh", vol: 0.5 }, { en: T.aumenta + 0.85, sfx: "sello", vol: 0.5 },
    { en: T.cobrando + 0.1, sfx: "whoosh", vol: 0.45 }, { en: T.cobrando + 0.6, sfx: "caja", vol: 0.5 },
    { en: l[2], sfx: "whoosh", vol: 0.45 }, { en: T.antes + 0.1, sfx: "coins", vol: 0.6 }, { en: T.ahora, sfx: "coins", vol: 0.6 }, { en: T.cincuenta, sfx: "thump", vol: 0.6 },
    { en: l[3], sfx: "whoosh", vol: 0.45 }, ...Array.from({ length: 10 }, (_, i) => ({ en: T.cien + i * 0.25, sfx: "click", vol: 0.25 })), { en: T.cien, sfx: "aspiradora", vol: 0.2 },
    { en: T.menos + 0.07, sfx: "slam", vol: 0.9 }, { en: T.menos + 0.1, sfx: "coins", vol: 0.7 },
    { en: l[4], sfx: "whoosh", vol: 0.45 }, ...Array.from({ length: 6 }, (_, i) => ({ en: l[4] + 0.3 + i * 0.4, sfx: "buzz", vol: 0.2 })),
    { en: l[5] - 0.2, sfx: "glitch", vol: 0.35 }, { en: l[5], sfx: "ding", vol: 0.5 }, { en: T.precios + 0.6, sfx: "click", vol: 0.5 },
    { en: T.doce - 0.25, sfx: "whoosh", vol: 0.5 }, { en: T.doce, sfx: "coins", vol: 0.6 }, { en: T.doce, sfx: "thump", vol: 0.6 }, { en: T.siempre, sfx: "ding", vol: 0.5 },
    { en: l[7], sfx: "whoosh", vol: 0.45 },
  ];
  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(l[5] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.13 * Math.min(1, Math.max(0, l[5] * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(l[5] * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(l[5] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.1 * Math.min(1, f / 8)} />
      </Sequence>
    </>
  );

  const pill = (txt: string, top: number, bg: string, color: string, size = 13) => (
    <div style={{ left: 0, right: 0, top, textAlign: "center" }}><span style={{ position: "static", display: "inline-block", padding: "3px 10px", borderRadius: 7, background: bg, color, font: `800 ${size}px ${BODY}`, letterSpacing: ".08em" }}>{txt}</span></div>
  );
  const grande = (lineas: string[], top: number, color: string, size: number, desde: number, fondo = "#000c") => {
    if (t < desde - 0.05) return null;
    const s = Math.min(1.04, sp(t - desde, 1.1, 20, 0.45));
    return (
      <div style={{ left: 18, right: 18, top, textAlign: "center", transform: `scale(${s})`, opacity: Math.min(1, s * 1.6) }}>
        <span style={{ position: "static", display: "inline-block", padding: "6px 14px", borderRadius: 12, background: fondo, color, font: `800 ${size}px/1.08 ${DISP}`, textShadow: "0 3px 14px #000" }}>{lineas.map((x, i) => <React.Fragment key={i}>{i ? <br /> : null}{x}</React.Fragment>)}</span>
      </div>
    );
  };
  const frente = (
    <>
      {t < l[1] - 0.05 ? <Golpe t={t} desde={-0.2} lineas={["¡ESTÁS REGALANDO", "TU GANANCIA!"]} size={31} /> : null}
      {t >= l[1] - 0.05 && t < l[2] - 0.05 ? (
        <>
          {grande(["TE AUMENTARON."], 64, "#fff", 26, l[1] + 0.1, "#d61f1f")}
          {t > T.cobrando - 0.2 ? grande(["VOS NO CAMBIASTE", "EL PRECIO."], 108, "#fff", 22, T.cobrando - 0.2) : null}
        </>
      ) : null}
      {t >= l[2] - 0.05 && t < l[3] - 0.05 ? (
        <>
          {grande([t < T.ahora - 0.05 ? "ANTES: $200" : "AHORA: $50"], 64, t < T.ahora - 0.05 ? "#7cf2a8" : "#ff6b5e", 40, t < T.ahora - 0.05 ? T.antes : T.ahora)}
          {pill("EJEMPLO", 122, C.ambar, C.tinta)}
        </>
      ) : null}
      {t >= l[3] - 0.05 && t < l[4] - 0.05 ? (
        <>
          {t < T.menos - 0.1 ? grande([`VENTA ${Math.min(100, Math.max(1, Math.round(1 + 99 * clamp((t - T.cien + 0.1) / Math.max(1.0, T.menos - T.cien - 0.4), 0, 1))))} / 100`], 64, "#fff", 26, l[3]) : <Golpe t={t} desde={T.menos + 0.05} lineas={["$15.000 MENOS"]} size={34} />}
          {t >= T.menos - 0.1 ? pill("EJEMPLO · $150 × 100 VENTAS", 128, C.ambar, C.tinta) : null}
        </>
      ) : null}
      {t >= l[4] - 0.05 && t < l[5] - 0.05 ? grande(["¿CUÁNTOS PRECIOS TENÉS", "DESACTUALIZADOS?"], 64, "#fff", 22, l[4] + 0.1, "#b42318") : null}
      {t >= l[5] - 0.05 && t < l[6] - 0.05 ? (
        <>
          <div style={{ inset: 0, background: "#000b" }} />
          <AppGrabada t={t} carpeta="tomas/p5" app0={l[5] - 0.3} rate={1} durGrab={5.627} entrada={l[5] - 0.05} zoom={1.4} zoomY="20%" left={85} top={48}
            aros={[{ desde: l[5] + 2.7, ...aPantalla(18, 244, 324, 30), color: "#ff3b30" }]} />
        </>
      ) : null}
      {t >= l[6] - 0.05 && t < l[7] - 0.05 ? (
        <>
          {pill("14 DÍAS GRATIS", 66, "#16a34a", "#fff", 18)}
          {pill("PRIMEROS 100 KIOSCOS", 100, C.ambar, C.tinta, 16)}
          {t > T.doce + 0.2 ? grande(["POR MES · PARA SIEMPRE"], 300, C.ambar, 20, T.doce + 0.2) : null}
        </>
      ) : null}
      {t >= l[7] - 0.05 ? (
        <>
          {grande(["¿YA REVISASTE LOS TUYOS?"], 70, "#fff", 24, l[7], "#d61f1f")}
          {t > l[7] + 0.6 ? <div style={{ left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", opacity: Math.min(1, (t - l[7] - 0.6) * 3) }}><LogoEnClaro /></div> : null}
        </>
      ) : null}
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={0} red={0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[l[5] - 0.05, l[6] - 0.05]]} subTop={SUB_TOP}
      filtro={mbx + mby > 0.8 ? "url(#mb)" : undefined}
      fondo={<div style={{ inset: 0, background: "#040506" }} />}
      tres={<Escena3D t={t} T={T} post={{ zoom, flash, rojo }} />}
      frente={frente}
      sobre={
        <>
          {musica}
          <svg width="0" height="0" style={{ position: "absolute" }}><defs><filter id="mb" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={`${mbx.toFixed(1)} ${mby.toFixed(1)}`} /></filter></defs></svg>
        </>
      }
    />
  );
};
