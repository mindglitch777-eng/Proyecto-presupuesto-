import React from "react";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { GUION_P4, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { LogoEnClaro, Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { AppGrabada, aPantalla, entra, ritmo, sp } from "../v8/comun";
import { Camara, Estudio, PantallaApp } from "../v8/estudio3d";
import { C } from "../v8/iconos";
import { CajaCarton, Celular3D, EstanteriaDeposito, ManoBrazo, Polvo, Registradora3D } from "../v8/modelos3d";
import { SUB_TOP } from "../piloto/comun";
import { Cine, Texto3D } from "./cine";
import { CajasProveedor, Factura3D, FRENTE_Z, Frente, Haz, Local, Mostrador, Notas, PUERTA_X, Sombra, Tubo, puntosDeTexto } from "./modelos";

// "Vendés, pero no cobrás" (30–31 s). Cámara subjetiva: sos el kiosquero, detrás del mostrador, de noche.
// Cuenta (EJEMPLO): fiados pendientes $96.000 = Marta $32.000 + Juan $24.000 + Rosa $18.000 + Carlos $14.000 + Beto $8.000 (los mismos de la pantalla real).

const g = GUION_P4;
type V3 = [number, number, number];
type Cam = { pos: V3; target: V3; fov: number };
const mez = (a: Cam, b: Cam, k: number): Cam => ({ pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, target: a.target.map((v, i) => v + (b.target[i] - v) * k) as V3, fov: a.fov + (b.fov - a.fov) * k });
const suave = (k: number) => { const x = clamp(k, 0, 1); return x * x * (3 - 2 * x); };
const latigo = (k: number) => { const x = clamp(k, 0, 1); return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2; }; // whip: arranca y frena seco
const rnd = (i: number, k = 0) => { const x = Math.sin((i + 1) * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

const REG: V3 = [-0.78, 0.993, 0.22];
const N_V = 80; // notas por variante (5 variantes = 400)
const N = N_V * 5;
const NUM_Z = 1.95;

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e, dur,
    cobras: w(0, "cobrás", e[0] - 0.5),
    uno: w(1, "uno", l[1]), otro: w(1, "otro", l[1] + 1.4), cinco: w(1, "cinco", e[1] - 0.6),
    proveedor: w(2, "proveedor", l[2] + 1.0), pagas: w(2, "pagás", e[2] - 0.9), vos: w(2, "vos", e[2] - 0.35),
    calle: w(3, "calle", e[3] - 0.45),
    reponer: w(4, "reponer", l[4] + 1.0),
    fiados: w(5, "fiados", l[5] + 0.9), whatsapp: w(5, "whatsapp", e[5] - 0.6),
    doce: w(6, "doce", l[6] + 1.8), siempre: w(6, "siempre", e[6] - 0.5),
    deben: w(7, "deben", l[7] + 0.6), mandaselo: w(7, "mandáselo", l[7] + 1.2),
  };
}
type T = ReturnType<typeof tiempos>;

// ---------- cámara (subjetiva) ----------
const OJO: V3 = [0.0, 1.62, -0.55];
const CAJA_CERCA: Cam = { pos: [-0.22, 1.66, -0.62], target: [-0.8, 1.02, 0.25], fov: 46 };

function camara(t: number, T: T): Cam {
  const { l, e } = T;
  const mostrador: Cam = { pos: [0.05, 1.42, -0.25], target: [0.12, 1.02, 0.65], fov: 50 };
  const puerta: Cam = { pos: OJO, target: [PUERTA_X, 1.25, FRENTE_Z], fov: 50 };
  if (t < l[1] - 0.05) {
    // la mano se lleva los productos → paneo con el que sale corriendo → latigazo de vuelta a la caja vacía
    const c1 = mez(mostrador, puerta, suave((t - 0.35) / 0.7));
    return mez(c1, CAJA_CERCA, latigo((t - 1.2) / 0.32));
  }
  if (t < l[2] - 0.05) {
    const arriba: Cam = { pos: [0, 1.72, -0.5], target: [0, 1.28, 1.2], fov: 54 };
    const encima: Cam = { pos: [0, 1.55, -0.05], target: [0, 0.99, 0.55], fov: 58 };
    return mez(mez(CAJA_CERCA, arriba, latigo((t - l[1] + 0.05) / 0.35)), encima, suave((t - T.cinco) / 1.4));
  }
  if (t < l[3] - 0.05) {
    // entra el proveedor; la factura; latigazo a la caja vacía
    const aPuerta = mez({ pos: [0, 1.55, -0.05], target: [0, 0.99, 0.55], fov: 58 }, { pos: OJO, target: [0.7, 1.35, FRENTE_Z], fov: 50 }, latigo((t - (T.proveedor - 0.45)) / 0.3));
    const factura: Cam = { pos: [0.05, 1.6, -0.3], target: [0.05, 1.0, 0.34], fov: 46 };
    const c2 = mez(aPuerta, factura, latigo((t - (T.proveedor + 0.85)) / 0.35));
    return mez(c2, CAJA_CERCA, latigo((t - (T.pagas + 0.2)) / 0.28));
  }
  if (t < l[4] - 0.05) {
    // las notas forman el número; la cámara lo atraviesa
    const lejos: Cam = { pos: [0, 1.62, -0.75], target: [0, 1.58, NUM_Z], fov: 52 };
    const c1 = mez(CAJA_CERCA, lejos, latigo((t - l[3] + 0.05) / 0.4));
    const k = suave((t - (T.calle - 0.35)) / Math.max(0.8, l[4] - T.calle + 0.2));
    return mez(c1, { pos: [0, 1.58, 2.75], target: [0, 1.58, FRENTE_Z], fov: 56 }, k);
  }
  if (t < l[5] - 0.05) {
    // el proveedor se lleva las cajas → latigazo hacia la estantería con huecos
    const frente: Cam = { pos: OJO, target: [0.5, 1.2, 2.0], fov: 52 };
    const estante: Cam = { pos: [0.0, 1.55, 0.35], target: [0.0, 1.25, -1.0], fov: 50 };
    const c1 = mez({ pos: [0, 1.58, 2.75], target: [0, 1.58, FRENTE_Z], fov: 56 }, frente, latigo((t - l[4] + 0.05) / 0.3));
    const c2 = mez(c1, estante, latigo((t - (T.reponer - 0.15)) / 0.4));
    return mez(c2, { pos: [0.0, 1.5, 0.0], target: [0.0, 1.2, -1.0], fov: 46 }, suave((t - T.reponer - 0.3) / 2));
  }
  if (t < l[7] - 0.05) {
    // el celular / la oferta: frente al neón, todo oscuro
    return { pos: [0.08 * Math.sin(t * 0.6), 1.6, 0.2], target: [0, 1.52, FRENTE_Z], fov: 50 };
  }
  // cierre: macro de las notas sobre el mostrador
  const k = suave((t - l[7]) / Math.max(1.5, T.dur - l[7]));
  return { pos: [0.15 - 0.2 * k, 1.13 - 0.03 * k, 0.02 + 0.08 * k], target: [0.25 - 0.1 * k, 0.995, 0.5], fov: 44 };
}

// ---------- notas: pila sobre el mostrador → enjambre que forma $96.000 → pared de pendientes ----------
function pila(i: number): V3 {
  return [-1.38 + rnd(i, 1) * 2.76, 0.996 + Math.floor(i / 60) * 0.0025 + rnd(i, 2) * 0.002, 0.1 + rnd(i, 3) * 0.6];
}
function aparece(i: number, T: T) {
  if (i === 0) return T.uno + 0.3;
  if (i === 1) return T.otro + 0.3;
  if (i === 2) return T.cinco - 0.05;
  return T.cinco + 0.1 + 1.5 * Math.pow((i - 3) / (N - 3), 0.55);
}

let PUNTOS: [number, number][] | null = null;
const puntos = () => (PUNTOS ??= puntosDeTexto("$96.000", N, 1.3));

function poseNota(gi: number, t: number, T: T, cam: Cam): [number, number, number, number, number, number, number] {
  const { l } = T;
  const p = pila(gi);
  const ry = (rnd(gi, 4) - 0.5) * 1.2;
  // cierre: la pila otra vez sobre el mostrador
  if (t >= l[7] - 0.1) return [p[0], p[1], p[2], -Math.PI / 2, 0, ry + Math.PI, 1];
  if (t >= l[4] + 0.2) return [0, 0, 0, 0, 0, 0, 0];
  const a = aparece(gi, T);
  if (t < a) return [0, 0, 0, 0, 0, 0, 0];
  const caida = clamp((t - a) / 0.35, 0, 1);
  const enMostrador: V3 = [p[0] + (1 - caida) * (rnd(gi, 5) - 0.5) * 0.3, p[1] + (1 - caida * caida) * 0.45, p[2] + (1 - caida) * 0.35];
  const giro = (1 - caida) * 6;
  const s0 = suave((t - (l[3] - 0.15 + (gi % 60) * 0.006)) / 1.0);
  if (s0 <= 0) return [enMostrador[0], enMostrador[1], enMostrador[2], -Math.PI / 2 + giro, giro * 0.5, ry + Math.PI, 1];
  const [tx, ty] = puntos()[gi];
  const destino: V3 = [tx, 1.58 + ty, NUM_Z + (rnd(gi, 6) - 0.5) * 0.06];
  const turb = Math.sin(s0 * Math.PI) * 0.5;
  let x = enMostrador[0] + (destino[0] - enMostrador[0]) * s0 + Math.sin(t * 3 + gi) * turb;
  let y = enMostrador[1] + (destino[1] - enMostrador[1]) * s0 + Math.cos(t * 2.3 + gi) * turb * 0.6 + Math.sin(s0 * Math.PI) * 0.4;
  const z = enMostrador[2] + (destino[2] - enMostrador[2]) * s0;
  // la cámara atraviesa el número: las notas se abren hacia los costados
  const abre = suave((cam.pos[2] - 0.6) / 1.3);
  x += Math.sign(x || 1) * abre * (0.8 + rnd(gi, 7));
  y += (y - 1.58) * abre * 1.4;
  return [x, y, z, (-Math.PI / 2) * (1 - s0) + giro * (1 - s0), Math.sin(t * 2 + gi) * 0.3 * (1 - s0), (ry + Math.PI) * (1 - s0) + Math.sin(t * 1.7 + gi) * 0.08, 1 - 0.45 * s0];
}

function posePendiente(gi: number, t: number, T: T): [number, number, number, number, number, number, number] {
  const a = T.calle - 0.4 + (gi % 40) * 0.012;
  if (t < a || t > T.l[4] + 0.25) return [0, 0, 0, 0, 0, 0, 0];
  const k = entra((t - a) / 0.25);
  const c = gi % 25, f = Math.floor(gi / 25);
  return [-2.05 + c * 0.171 + (rnd(gi, 8) - 0.5) * 0.04, 0.25 + f * 0.13 + (rnd(gi, 9) - 0.5) * 0.03, FRENTE_Z - 0.09, 0, Math.PI, (rnd(gi, 10) - 0.5) * 0.4, k * 1.05];
}

const Escena3D: React.FC<{ t: number; T: T; post: { zoom: number; flash: number; rojo: number } }> = ({ t, T, post }) => {
  const { l, e } = T;
  const cam = camara(t, T);
  const foco = Math.hypot(cam.target[0] - cam.pos[0], cam.target[1] - cam.pos[1], cam.target[2] - cam.pos[2]);

  // tubo fluorescente: titila; en la acumulación hace estroboscopio (pasa el tiempo)
  const estrobo = t >= T.uno - 0.1 && t < T.cinco + 1.6;
  const tubo = estrobo ? (Math.floor(t * 14) % 2 ? 1.5 : 0.35) : rnd(Math.floor(t * 12), 3) > 0.92 ? 0.25 : 1;
  // la puerta: se abre cuando se va el cliente; revienta cuando entra el proveedor
  const abre1 = t > 0.55 && t < 1.7 ? Math.sin(clamp((t - 0.55) / 1.15, 0, 1) * Math.PI) : 0;
  const abre2 = t >= T.proveedor - 0.45 && t < l[4] + 1.2 ? Math.min(1, entra((t - (T.proveedor - 0.45)) / 0.15)) : 0;
  const abre = Math.max(abre1 * 0.9, abre2);
  const golpePuerta = abre2 > 0 ? Math.max(0, 1 - (t - (T.proveedor - 0.45)) / 0.8) : 0;

  // 0: el cliente se lleva todo y sale corriendo
  const corre = clamp((t - 0.35) / 1.0, 0, 1);
  const posCliente = (k: number): V3 => [0.2 + (PUERTA_X - 0.2) * k, 0, 1.25 + (FRENTE_Z + 0.3 - 1.25) * k];
  const estelaCliente = [0.06, 0.12, 0.18, 0.24].map((d) => posCliente(clamp((t - d - 0.35) / 1.0, 0, 1)));
  const mano = clamp(t / 0.6, 0, 1);
  // 1: tres clientes que pasan (estroboscopio) y dejan su nota
  const pasan = [T.uno, T.otro, T.cinco - 0.35];
  // 2: el proveedor
  const prov = clamp((t - (T.proveedor - 0.3)) / 0.9, 0, 1);
  const posProv: V3 = [PUERTA_X - 0.3 * prov, 0, FRENTE_Z + 0.25 - 1.7 * prov];
  const cajas = t >= T.proveedor + 0.5 ? clamp((t - (T.proveedor + 0.5)) / 0.3, 0, 1) : 0;
  const seLleva = clamp((t - (l[4] + 0.15)) / 0.7, 0, 1);
  const factura = clamp((t - (T.proveedor + 0.75)) / 0.3, 0, 1);
  const dedo = t >= T.proveedor + 1.1 && t < T.pagas + 0.25 ? 1 : 0;
  const cajon = t < 1.35 ? 0 : t < l[1] ? entra((t - 1.35) / 0.25) * 0.95 : t >= T.pagas + 0.2 && t < l[4] ? 0.95 : 0.0;
  // "ÉL NO TE ESPERA."
  // 3/4: estantería con huecos (lo que hay que reponer)
  const verEstante = t >= l[4] - 0.1 && t < l[5] + 0.3;
  // 5/6: el celular y la oferta
  const verOferta = t >= l[6] - 0.15 && t < l[7] - 0.05;
  const precio = entra((t - (T.doce - 0.25)) / 0.25);

  return (
    <>
      <Camara c={cam} t={t} mano={1.6} />
      <Estudio fondo="#040506" niebla={[4, 12]} luz={0.18} calida={0.9} exposicion={0.9} principal={[1, 4, -2]} />
      <ambientLight intensity={0.08} color="#7fa8d8" />
      <Tubo luz={tubo} x={0} z={0.6} />
      <Tubo luz={tubo * 0.85} x={0} z={2.3} />
      {/* luz de la calle que entra por la puerta (y la sombra larga del proveedor) */}
      <spotLight position={[PUERTA_X, 2.3, FRENTE_Z + 1.4]} angle={0.62} penumbra={0.5} intensity={(8 + 40 * golpePuerta) * Math.max(0.15, abre)} distance={9} decay={1.2} color="#cfe2ff" castShadow shadow-mapSize={[1024, 1024]} target-position={[0.2, 0, 0.6]} />
      <group position={[PUERTA_X, 2.0, FRENTE_Z + 0.05]} rotation-x={-0.35}><Haz fuerza={abre * (1 + 2 * golpePuerta)} largo={3.6} /></group>
      {t < 1.8 || (t >= T.uno - 0.3 && t < T.cinco + 0.3) ? <pointLight position={[0.4, 1.7, 2.7]} intensity={7} distance={4} decay={1.4} color="#bcd4ff" /> : null}
      <Local />
      <Mostrador />
      <Frente abre={abre} neon={(verOferta ? 0.2 : 1) * (0.75 + 0.25 * Math.sin(t * 9) * (rnd(Math.floor(t * 6), 4) > 0.8 ? 1 : 0.2))} calle={0.4 + golpePuerta * 3 + (t < 1.8 ? 1.0 : 0) + (t >= T.uno - 0.3 && t < T.cinco + 0.3 ? 1.2 : 0)} />
      <Polvo t={t} centro={[0.2, 1.7, 2.2]} radio={1.2} n={200} brillo={0.35 + abre * 0.8} />
      {/* la caja registradora (su cajón vacío mira hacia nosotros) */}
      <group position={REG} rotation-y={Math.PI} scale={[1.7, 1.7, 1.7]}><Registradora3D cajon={cajon} brillo={cajon > 0.3 ? 0.5 : 0} /></group>
      {/* productos que se lleva el primer cliente */}
      {t < 1.2 ? [0, 1, 2].map((k) => {
        const lleva = clamp((t - 0.25) / 0.4, 0, 1);
        return (
          <group key={k} position={[0.05 + k * 0.17 + lleva * 0.1, 0.995 + lleva * 0.15 + (k === 1 ? 0.0 : 0), 0.45 + lleva * 1.1]} rotation-y={k * 0.4 + lleva}>
            <CajaCarton w={0.14} h={0.1 + k * 0.03} d={0.09} rubro={k + 3} />
          </group>
        );
      }) : null}
      {t < 0.75 ? (
        <group position={[0.15, 1.1, 1.35 - Math.sin(mano * Math.PI) * 0.75]} rotation-y={-Math.PI / 2}><ManoBrazo cierra={mano > 0.4 ? 0.9 : 0.1} /></group>
      ) : null}
      {t > 0.2 && t < 1.55 ? <Sombra pos={posCliente(corre)} estela={estelaCliente} /> : null}
      {/* clientes que pasan y dejan la nota */}
      {pasan.map((a, k) => (t > a - 0.25 && t < a + 0.5 ? (
        <Sombra key={k} pos={[-0.7 + k * 0.7 + (t - a) * (k % 2 ? 2.2 : -2.2), 0, 1.2]} estela={[0.05, 0.1, 0.15].map((d) => [-0.7 + k * 0.7 + (t - a - d) * (k % 2 ? 2.2 : -2.2), 0, 1.2] as V3)} />
      ) : null))}
      {/* las notas de fiado */}
      {[0, 1, 2, 3, 4].map((v) => <Notas key={v} v={v} n={N_V} pose={(j) => poseNota(j * 5 + v, t, T, cam)} />)}
      {[0, 1, 2, 3, 4].map((v) => <Notas key={`p${v}`} v={v} n={40} pendiente pose={(j) => posePendiente(j * 5 + v, t, T)} />)}
      {/* el número macizo aparece cuando las notas terminan de juntarse */}
      {t >= T.calle - 0.6 && t < l[4] ? (
        <group position={[0, 1.58, NUM_Z - 0.12]} scale={[entra((t - (T.calle - 0.6)) / 0.3), entra((t - (T.calle - 0.6)) / 0.3), entra((t - (T.calle - 0.6)) / 0.3)]}>
          <group rotation-y={Math.PI}><Texto3D texto="$96.000" size={0.16} fondo={0.08} color="#ff3b30" brillo={0.5} /></group>
          <pointLight position={[0, 0, -0.6]} intensity={3} distance={2.5} color="#ff6b5e" />
        </group>
      ) : null}
      {/* el proveedor */}
      {t > T.proveedor - 0.4 && t < l[4] + 1.0 ? (
        <Sombra pos={[posProv[0] + seLleva * 0.3, 0, posProv[2] + seLleva * 1.8]} alto={1.95} estela={prov < 1 ? [0.08, 0.16].map((d) => { const k = clamp((t - d - (T.proveedor - 0.3)) / 0.9, 0, 1); return [PUERTA_X - 0.3 * k, 0, FRENTE_Z + 0.25 - 1.7 * k] as V3; }) : []} />
      ) : null}
      {t > T.proveedor - 0.3 && t < l[4] + 1.0 ? (
        <group position={cajas < 1 && t < T.proveedor + 0.8 ? [posProv[0], 1.0 + (cajas > 0 ? (1 - cajas) * 0.3 : 0.15), posProv[2] - 0.35] : [1.0 + seLleva * 0.2, 0.995 + seLleva * 1.2, 0.62 + seLleva * 3.0]} rotation-z={seLleva * 1.5}>
          <CajasProveedor />
        </group>
      ) : null}
      {t > T.proveedor + 0.75 && t < T.proveedor + 1.6 ? <Polvo t={t} centro={[1.0, 1.1, 0.62]} radio={0.3 + (t - T.proveedor - 0.75)} n={120} brillo={1.6} /> : null}
      {factura > 0 && t < l[4] ? (
        <group position={[0.05, 1.035 + (1 - factura) * 0.5, 0.32 - (1 - factura) * 0.4]} scale={[1.25, 1.25, 1.25]} rotation={[-Math.PI / 2 + (1 - factura) * 1.2, 0, Math.PI + 0.08 + (1 - factura) * 0.6]}><Factura3D /></group>
      ) : null}
      {dedo ? <group position={[0.18, 1.02, 0.36 + 0.03 * Math.abs(Math.sin(t * 14))]} rotation-y={-Math.PI / 2} rotation-z={-0.25}><ManoBrazo cierra={0.6} /></group> : null}
      {verEstante ? (
        <group position={[0, 0, -1.0]}>
          <EstanteriaDeposito cols={3} pisos={4} ancho={2.4} alto={2.4} fondo={0.4} semilla={7} quita={(c, p) => ([[0, 1], [1, 2], [2, 0], [1, 0], [0, 3], [2, 2], [1, 3], [2, 1]].some(([a, b]) => a === c && b === p) ? 1 : 0)} />
          <Polvo t={t} centro={[0, 1.2, 0.3]} radio={1.0} n={160} brillo={1.2} />
        </group>
      ) : null}
      {/* oferta: precio en 3D dorado y el celular con En Claro */}
      {verOferta ? (
        <>
          <group position={[0, 1.7 + (1 - precio) * 0.5, 1.35]} rotation-y={Math.PI - 0.06 + Math.sin(t * 0.8) * 0.04} scale={[precio, precio, precio]}>
            <Texto3D texto="$12.900" size={0.07} fondo={0.035} color="#f5c542" metal={0.95} brillo={0.1} />
          </group>
          <group position={[-0.05, 1.32, 1.0]} rotation={[0.05, -0.35 + Math.sin(t * 0.7) * 0.05, 0.04]} scale={[2.0, 2.0, 2.0]}>
            <Celular3D><PantallaApp t={4.8} carpeta="tomas/p3" app0={0} rate={1} durGrab={4.858} /></Celular3D>
          </group>
          <pointLight position={[0, 1.9, 1.9]} intensity={3} distance={3} color="#ffd27a" />
          {t < T.doce + 1.2 ? <Polvo t={t} centro={[-0.17, 1.72, 1.35]} radio={0.15 + (t - T.doce) * 0.6} n={140} brillo={2.2} /> : null}
        </>
      ) : null}
      <Cine t={t} foco={verOferta ? 1.15 : foco} apertura={t >= l[7] ? 0.03 : 0.014} bloom={0.6 + golpePuerta * 0.8} ca={0.0025 + post.zoom * 0.01} zoom={post.zoom} flash={post.flash} rojo={post.rojo} />
    </>
  );
};

/** "ÉL NO TE ESPERA.": letras gigantes con volumen que caen sobre la pantalla. */
const Golpe: React.FC<{ t: number; desde: number }> = ({ t, desde }) => {
  const k = clamp((t - desde) / 0.14, 0, 1);
  const s = 2.6 - 1.6 * k + (k >= 1 ? Math.sin((t - desde - 0.14) * 38) * Math.exp(-(t - desde - 0.14) * 9) * 0.05 : 0);
  const volumen = Array.from({ length: 10 }, (_, i) => `${i + 1}px ${i + 1}px 0 #5c0000`).join(",") + ", 0 0 30px #ff000099, 14px 18px 26px #000";
  return (
    <div style={{ left: 0, right: 0, top: 150, textAlign: "center", transform: `scale(${s}) rotate(-4deg)`, opacity: Math.min(1, k * 2.5) }}>
      <div style={{ position: "static", font: `800 66px/0.95 ${DISP}`, color: "#ff2d2d", letterSpacing: "-.02em", textShadow: volumen }}>ÉL NO TE<br />ESPERA.</div>
    </div>
  );
};

/** Sello rojo "FIADO" que cae sobre la pantalla. */
const Sello: React.FC<{ t: number; desde: number }> = ({ t, desde }) => {
  if (t < desde - 0.02) return null;
  const k = clamp((t - desde) / 0.12, 0, 1);
  const s = 3.2 - 2.2 * k + (k >= 1 ? Math.sin((t - desde - 0.12) * 40) * Math.exp(-(t - desde - 0.12) * 10) * 0.06 : 0);
  return (
    <>
      <div style={{ left: 0, right: 0, top: 205, textAlign: "center", transform: `scale(${s}) rotate(-13deg)`, opacity: Math.min(1, k * 3) }}>
        <span style={{ position: "static", display: "inline-block", padding: "2px 22px", border: "8px solid #e10600", borderRadius: 14, color: "#e10600", font: `800 92px/1 ${DISP}`, letterSpacing: ".04em", mixBlendMode: "screen", textShadow: "0 0 22px #ff0000aa", maskImage: "repeating-radial-gradient(circle at 30% 40%, #000 0 3px, #0009 4px 6px)", WebkitMaskImage: "repeating-radial-gradient(circle at 30% 40%, #000 0 3px, #000a 4px 6px)" }}>FIADO</span>
      </div>
      {k >= 1 ? Array.from({ length: 14 }, (_, i) => {
        const d = (t - desde - 0.12) * 260, a = (i / 14) * Math.PI * 2 + i;
        return <div key={i} style={{ left: 180 + Math.cos(a) * (70 + d * (0.5 + (i % 3) * 0.3)), top: 250 + Math.sin(a) * (50 + d * (0.4 + (i % 2) * 0.3)), width: 6 + (i % 3) * 4, height: 6 + (i % 3) * 4, borderRadius: 99, background: "#e10600", opacity: Math.max(0, 1 - (t - desde) * 1.5) }} />;
      }) : null}
    </>
  );
};

export const VendesNoCobras: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, durationInFrames / fps);
  const { l, e } = T;

  // desenfoque de movimiento en los latigazos (lo rápido que gira la cámara)
  const c0 = camara(t - 1 / 60, T), c1 = camara(t + 1 / 60, T);
  const ang = (c: Cam) => [Math.atan2(c.target[0] - c.pos[0], c.target[2] - c.pos[2]), Math.atan2(c.target[1] - c.pos[1], Math.hypot(c.target[0] - c.pos[0], c.target[2] - c.pos[2]))];
  const [a0, b0] = ang(c0), [a1, b1] = ang(c1);
  const mbx = Math.min(26, Math.abs(a1 - a0) * 260), mby = Math.min(20, Math.abs(b1 - b0) * 260);
  const impactos = [0, T.cobras, T.proveedor - 0.45, T.vos, T.calle, T.doce];
  const zoom = impactos.reduce((s, a) => s + (t >= a && t < a + 0.25 ? 0.12 * (1 - (t - a) / 0.25) : 0), 0);
  const flash = impactos.reduce((s, a) => s + (t >= a && t < a + 0.1 ? 0.25 * (1 - (t - a) / 0.1) : 0), 0);
  const rojo = t >= T.vos - 0.1 && t < l[3] ? 0.35 * Math.max(0, 1 - (t - T.vos) / 0.9) : t >= T.cobras && t < T.cobras + 0.5 ? 0.3 * (1 - (t - T.cobras) / 0.5) : 0;

  const manual = [0.02, 0.6, 1.2, T.cobras, T.uno, T.otro, T.cinco, T.proveedor, T.pagas, T.vos, l[3], T.calle, l[4], T.reponer, l[5], T.fiados, T.whatsapp, T.doce, T.siempre, T.deben, T.mandaselo];
  const cam: Cam2D = camaraBeats(t, ritmo(pal, manual, [], 0.5), [], 0.55);
  const hs = temblor(t, [[0.0, 14], [T.cobras, 16], [T.proveedor - 0.45, 18], [T.proveedor + 0.75, 8], [T.vos, 20], [T.calle, 8], [T.doce, 10]]);

  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "slam", vol: 0.8 }, { en: 0, sfx: "buzz", vol: 0.18 }, { en: 0.2, sfx: "whoosh", vol: 0.5 }, { en: 0.55, sfx: "metal", vol: 0.35 },
    { en: 1.2, sfx: "whoosh", vol: 0.7 }, { en: 1.38, sfx: "cajon", vol: 0.7 }, { en: T.cobras, sfx: "sello", vol: 0.9 }, { en: T.cobras, sfx: "thump", vol: 0.8 },
    ...[T.uno, T.otro, T.cinco - 0.35].flatMap((a) => [{ en: a - 0.2, sfx: "whoosh", vol: 0.4 }, { en: a + 0.3, sfx: "papel", vol: 0.5 }]),
    ...Array.from({ length: 16 }, (_, i) => ({ en: T.cinco + 0.1 + 1.5 * Math.pow(i / 16, 0.55), sfx: "papel", vol: 0.25 })),
    { en: T.proveedor - 0.45, sfx: "slam", vol: 0.9 }, { en: T.proveedor - 0.4, sfx: "vidrio", vol: 0.35 }, { en: T.proveedor + 0.8, sfx: "thump", vol: 0.8 },
    { en: T.pagas - 0.2, sfx: "papel", vol: 0.6 }, { en: T.pagas + 0.05, sfx: "click", vol: 0.5 }, { en: T.vos - 0.45, sfx: "whoosh", vol: 0.6 },
    { en: T.vos, sfx: "slam", vol: 0.9 }, { en: T.vos, sfx: "piano_grave", vol: 0.6 },
    { en: l[3], sfx: "viento", vol: 0.4 }, { en: l[3] + 0.2, sfx: "riser", vol: 0.35 }, { en: T.calle, sfx: "thump", vol: 0.75 }, { en: T.calle + 0.2, sfx: "whoosh", vol: 0.6 },
    { en: l[4] + 0.15, sfx: "whoosh", vol: 0.5 }, { en: T.reponer - 0.15, sfx: "whoosh", vol: 0.6 }, { en: T.reponer + 0.3, sfx: "heart", vol: 0.55 },
    { en: l[5] - 0.2, sfx: "glitch", vol: 0.4 }, { en: l[5], sfx: "ding", vol: 0.5 }, { en: T.whatsapp, sfx: "click", vol: 0.6 },
    { en: T.doce - 0.25, sfx: "whoosh", vol: 0.5 }, { en: T.doce, sfx: "coins", vol: 0.6 }, { en: T.doce, sfx: "thump", vol: 0.6 }, { en: T.siempre, sfx: "ding", vol: 0.5 },
    { en: l[7], sfx: "papel", vol: 0.4 }, { en: T.mandaselo, sfx: "whoosh", vol: 0.45 },
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

  // ---------- capa 2D (máximo 2 textos + subtítulo) ----------
  const pill = (txt: string, top: number, bg: string, color: string, size = 13) => (
    <div style={{ left: 0, right: 0, top, textAlign: "center" }}><span style={{ position: "static", display: "inline-block", padding: "3px 10px", borderRadius: 7, background: bg, color, font: `800 ${size}px ${BODY}`, letterSpacing: ".1em" }}>{txt}</span></div>
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
      {t < l[1] - 0.05 ? (
        <>
          {grande(["¡VENDÉS,", "PERO NO COBRÁS!"], 64, "#fff", 30, -0.3, "#d61f1f")}
          <Sello t={t} desde={T.cobras} />
        </>
      ) : null}
      {t >= l[1] - 0.05 && t < l[2] - 0.05 ? grande([t < T.otro ? "1 FIADO" : t < T.cinco ? "2 FIADOS" : "5 FIADOS… Y SIGUE"], 64, "#fff", 26, T.uno) : null}
      {t >= Math.max(T.vos - 0.1, T.pagas + 0.5) && t < l[3] - 0.02 ? <Golpe t={t} desde={Math.max(T.vos - 0.1, T.pagas + 0.5)} /> : null}
      {t >= l[3] - 0.05 && t < l[4] - 0.05 ? (
        <>
          {t > l[3] + 0.6 ? pill("EJEMPLO", 405, C.ambar, C.tinta, 15) : null}
          {t > T.calle - 0.2 ? grande(["SIGUEN PENDIENTES"], 64, "#fff", 26, T.calle - 0.2, "#b42318") : grande(["¿CUÁNTA PLATA", "TENÉS EN LA CALLE?"], 64, "#fff", 24, l[3])}
        </>
      ) : null}
      {t >= l[4] - 0.05 && t < l[5] - 0.05 ? grande(["Y MAÑANA", "TENÉS QUE REPONER"], 64, "#fff", 24, l[4] + 0.1, "#000c") : null}
      {t >= l[5] - 0.05 && t < l[6] - 0.05 ? (
        <>
          <div style={{ inset: 0, background: "#000a" }} />
          <AppGrabada t={t} carpeta="tomas/p3" app0={l[5] + 0.15} rate={0.62} durGrab={4.858} entrada={l[5] - 0.05} zoom={1.4} zoomY="20%" left={85} top={48}
            aros={[{ desde: T.fiados, hasta: T.whatsapp - 0.3, ...aPantalla(18, 84, 324, 140) }, { desde: T.whatsapp - 0.2, ...aPantalla(36, 664, 288, 56), color: "#25d366" }]} />
        </>
      ) : null}
      {t >= l[6] - 0.05 && t < l[7] - 0.05 ? (
        <>
          {pill("PRIMEROS 100 KIOSCOS", 70, C.ambar, C.tinta, 17)}
          {t > T.doce + 0.2 ? grande(["POR MES · PARA SIEMPRE"], 282, C.ambar, 20, T.doce + 0.2, "#000c") : null}
          {t > T.siempre - 0.2 ? pill("14 DÍAS GRATIS · LINK EN EL PERFIL", 322, "#16a34a", "#fff", 14) : null}
        </>
      ) : null}
      {t >= l[7] - 0.05 ? (
        <>
          {t < T.mandaselo - 0.05 ? grande(["¿CUÁNTO TE DEBEN?"], 70, "#fff", 30, l[7], "#d61f1f") : grande(["MANDÁSELO AL QUE", "SIEMPRE FÍA."], 70, "#fff", 26, T.mandaselo, "#000c")}
          {t > T.mandaselo + 0.4 ? <div style={{ left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", opacity: Math.min(1, (t - T.mandaselo - 0.4) * 3) }}><LogoEnClaro /></div> : null}
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
