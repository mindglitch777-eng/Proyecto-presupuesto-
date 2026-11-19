import React from "react";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { DISP } from "../lib/fuentes";
import { GUION_V9_03, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { LogoEnClaro, Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { Cartel, CupoFundadores, Etiqueta, entra, latido, ritmo, sp } from "../v8/comun";
import { Camara, Estudio, PantallaApp, Profundidad, dibujarBillete, useLienzo } from "../v8/estudio3d";
import { C } from "../v8/iconos";
import {
  Avioncito3D, Barrotes3D, BotonCompartir, Candado3D, Celular3D, Contador3D, Escarcha, EstanteriaDeposito, LlaveGigante, ManoBrazo,
  PilaBilletes, PisoEstudio, Polvo, Registradora3D, Telarana,
} from "../v8/modelos3d";

// V9-03 "Tenés plata encerrada en tu depósito" (videos/guiones/V9-03-PLATA-ENCERRADA.md). Voz exacta del guion (Orus).
// Cuenta (ejemplo): mercadería $1.200.000 · sin movimiento $360.000 (30%) = 3 alquileres de $120.000.
// El depósito es una cárcel: pasillo de estanterías, y al fondo la estantería principal; su columna derecha (un tercio) queda presa.

const g = GUION_V9_03;
const APP = { lista: 2.967, fin: 4.968 };
const FONDO_Z = -8.0; // estantería principal (3 columnas × 4 pisos)
const CELDA_X = 0.8; // columna presa
const REJA_Z = FONDO_Z + 0.33;
const CAJA_REG: [number, number, number] = [0.05, 0.45, -7.05];
const CEL: [number, number, number] = [0.6, 1.25, -6.55];
const CANDADO: [number, number, number] = [CELDA_X, 0.95, REJA_Z + 0.04];
const MOTA: [number, number, number] = [-0.8, 1.86, FONDO_Z];

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e, dur,
    millon: w(0, "millón", 0.4), mil: w(0, "doscientos", 0.7) + 0.22, mercaderia: w(0, "mercadería", e[0] - 0.6),
    sesenta: w(1, "sesenta", l[1] + 0.5), meses: w(1, "meses", l[1] + 1.4), moverse: w(1, "moverse", e[1] - 0.5),
    tres: w(2, "tres", l[2] + 0.2), alquileres: w(2, "alquileres", l[2] + 0.6), veinte: w(2, "veinte", e[2] - 0.5),
    pero: w(3, "pero", l[3] + 1.0), disponible: w(3, "disponible", e[3] - 0.6),
    deposito: w(4, "depósito", l[4] + 0.8), muestra: w(4, "muestra", l[4] + 1.4), dormido: w(4, "dormido", e[4] - 0.5),
    pagan: w(5, "pagan", l[5] + 1.0), siempre: w(5, "siempre", e[5] - 0.5),
    producto: w(6, "producto", l[6] + 0.3), mueve: w(6, "mueve", e[6] - 0.3),
    mandaselo: w(7, "mandáselo", l[7]), acumula: w(7, "acumula", l[7] + 1.2),
    LOOP: dur - 0.27,
  };
}
type T = ReturnType<typeof tiempos>;

type V3 = [number, number, number];
type Cam = { pos: V3; target: V3; fov: number };
const mezclaCam = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, target: a.target.map((v, i) => v + (b.target[i] - v) * k) as V3, fov: a.fov + (b.fov - a.fov) * k,
});

/** Cuadro 0: travelling a ras del piso por el pasillo. */
const inicio = (t: number): Cam => ({ pos: [0.12 * Math.sin(t * 2), 0.35, 1.6 - t * 1.6], target: [0, 0.55, -6], fov: 50 });

function camara(t: number, T: T): Cam {
  const { l, e } = T;
  let c: Cam;
  if (t < l[1] - 0.05) {
    // el travelling frena; sube un poco para ver caer el contador
    const k = entra(clamp(t / Math.max(0.6, T.mil + 0.2), 0, 1));
    const fin: Cam = { pos: [0.3, 0.75, -1.8], target: [0, 0.6, -5.4], fov: 46 };
    c = mezclaCam(inicio(t), fin, k);
  } else if (t < l[2] - 0.05) {
    const k = entra((t - l[1]) / 0.8);
    c = mezclaCam({ pos: [0.3, 0.75, -1.8], target: [0, 0.6, -5.4], fov: 46 }, { pos: [0.5 + Math.sin(t * 0.7) * 0.15, 1.7, -3.7], target: [0.45, 1.6, FONDO_Z], fov: 44 }, k);
  } else if (t < l[3] - 0.05) {
    const k = entra((t - l[2]) / 0.6);
    c = mezclaCam({ pos: [0.5, 1.7, -3.7], target: [0.45, 1.6, FONDO_Z], fov: 44 }, { pos: [CELDA_X + Math.sin(t * 0.8) * 0.1, 1.8, -5.2], target: [CELDA_X, 1.75, FONDO_Z], fov: 42 }, k);
  } else if (t < l[4] - 0.05) {
    // la mano que no llega: lento, de costado
    const k = clamp((t - l[3]) / Math.max(1, e[3] - l[3]), 0, 1);
    c = { pos: [1.08 - 0.05 * k, 0.8, -6.15 - 0.2 * k], target: [0.82, 0.58, -7.6], fov: 44 };
  } else if (t < T.dormido + 0.2) {
    const k = entra((t - l[4]) / 0.5);
    c = { pos: [CEL[0] + 0.1 * (1 - k), CEL[1] + 0.05, CEL[2] + 0.62 - 0.08 * k], target: [CEL[0], CEL[1], CEL[2]], fov: 40 };
  } else if (t < T.pagan - 0.05) {
    // se abre la reja: plano general; los billetes vuelan a la caja
    const k = entra((t - T.dormido - 0.2) / 0.8);
    c = { pos: [0.6 + Math.sin(t * 0.6) * 0.15, 1.3 + 0.1 * k, -4.6 + 0.3 * k], target: [0.45, 0.95, -7.5], fov: 46 };
  } else if (t < l[6] - 0.05) {
    // la app a pantalla completa
    const k = entra((t - T.pagan + 0.05) / 0.5);
    c = { pos: [CEL[0], CEL[1], CEL[2] + 0.62 - 0.32 * k], target: [CEL[0], CEL[1], CEL[2]], fov: 38 };
  } else if (t < l[7] - 0.05) {
    const k = entra((t - l[6]) / 1.2);
    c = { pos: [MOTA[0] + 0.05 * Math.sin(t), MOTA[1] + 0.08, MOTA[2] + 1.15 - 0.4 * k], target: [MOTA[0], MOTA[1], MOTA[2]], fov: 40 };
  } else {
    c = { pos: [0, 1.4, -5.25], target: [0, 1.4, -6.3], fov: 42 };
    // últimos cuadros: vuelve hacia atrás por el pasillo hasta el encuadre del cuadro 0
    const v = clamp((t - (T.LOOP - 0.55)) / 0.53, 0, 1);
    if (v > 0) c = mezclaCam(c, inicio(0), v * v * (3 - 2 * v));
  }
  if (t >= T.LOOP) c = inicio(0);
  return c;
}

/** Billete suelto (cara de billete genérico). */
const Billete3D: React.FC = () => {
  const tex = useLienzo("billete-v903", 256, 128, dibujarBillete);
  return <mesh castShadow><planeGeometry args={[0.16, 0.075]} /><meshStandardMaterial map={tex} side={2} roughness={0.7} /></mesh>;
};

const Escena3D: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const { l, e } = T;
  const cam = camara(t, T);
  const foco = Math.hypot(cam.target[0] - cam.pos[0], cam.target[1] - cam.pos[1], cam.target[2] - cam.pos[2]);

  // contador: cae en "millón", golpea el piso en "mil"; en "sesenta" se parte y lo preso ($360.000) va arriba de la celda
  const cae = clamp((t - T.millon) / Math.max(0.3, T.mil - T.millon), 0, 1);
  const parte = entra((t - T.sesenta) / 0.7);
  const preso = t >= T.sesenta;
  const yC = 0.26 + (1 - cae * cae) * 3.2 + (cae >= 1 ? Math.max(0, Math.sin((t - T.mil) * 18) * Math.exp(-(t - T.mil) * 9) * 0.08) : 0);
  const posC = preso ? [0 + (CELDA_X - 0) * parte, yC + (2.72 - yC) * parte, -5.0 + (REJA_Z + 0.06 + 5.0) * parte] : [0, yC, -5.0];
  const escC = preso ? 1 - 0.47 * parte : 1;
  const verContador = t >= T.millon - 0.05 && t < T.dormido + 0.3;

  // escarcha y reja
  const frio = clamp((t - l[1]) / Math.max(0.6, T.meses - l[1] + 0.4), 0, 1);
  const libre = entra((t - (T.dormido + 0.05)) / 0.9); // la reja sube
  const rejaY = t < T.moverse ? 3.2 * (1 - entra((t - (T.moverse - 0.25)) / 0.25)) : t < T.dormido ? 0 : 3.2 * libre;
  const rebote = t > T.moverse && t < T.moverse + 0.5 ? Math.abs(Math.sin((t - T.moverse) * 24)) * Math.exp(-(t - T.moverse) * 9) * 0.05 : 0;
  const hielo = frio * (1 - libre);

  // tres llaves (una por bloque de cajas presas)
  const tLlave = [T.tres, T.alquileres, T.veinte];
  const pisoLlave = [3, 2, 1];
  const posLlave: [number, number][] = [[0.58, 2.38], [1.0, 1.78], [0.58, 1.18]];
  const quita = (c: number, p: number) => {
    if (c !== 2) return 0;
    const i = pisoLlave.indexOf(p);
    if (i < 0) return 0;
    const sale = entra((t - (tLlave[i] - 0.25)) / 0.3);
    const vuelve = entra((t - (T.dormido + 0.3 + i * 0.12)) / 0.5);
    return t < T.dormido + 0.3 ? sale : 1 - vuelve;
  };

  // mano que no llega
  const mano = t >= l[3] - 0.1 && t < l[4] ? clamp((t - l[3]) / Math.max(1, e[3] - l[3] - 0.3), 0, 1) : -1;
  const estira = mano < 0 ? 0 : Math.min(1, mano * 1.3) * 0.55 + Math.sin(t * 7) * 0.012;

  // billetes que vuelan a la caja registradora al liberarse
  const vuelos: React.ReactNode[] = [];
  const t0b = T.dormido + 0.6;
  for (let i = 0; i < 16; i++) {
    const a = t0b + i * 0.12, d = (t - a) / 0.7;
    if (d < 0 || d > 1) continue;
    const k = d * d * (3 - 2 * d);
    const ini = [CELDA_X + (Math.sin(i * 2.1) * 0.25), 0.4 + (i % 4) * 0.5, FONDO_Z + 0.2];
    const fin = [CAJA_REG[0], CAJA_REG[1] + 0.2, CAJA_REG[2] + 0.25];
    vuelos.push(
      <group key={i} position={[ini[0] + (fin[0] - ini[0]) * k, ini[1] + (fin[1] - ini[1]) * k + Math.sin(k * Math.PI) * 0.5, ini[2] + (fin[2] - ini[2]) * k]} rotation={[k * 5 + i, k * 3, k * 7]}>
        <Billete3D />
      </group>,
    );
  }
  const llena = clamp((t - t0b - 0.5) / 2.2, 0, 1);

  // candado de la reja
  const candado = entra((t - (T.dormido - 0.05)) / 0.35);
  const caeCandado = Math.max(0, t - (T.dormido + 0.3));

  // botón de compartir
  const pulsa = t > T.mandaselo && t < T.mandaselo + 0.35 ? Math.sin(((t - T.mandaselo) / 0.35) * Math.PI) : 0;
  const vuela = clamp((t - (T.mandaselo + 0.2)) / 1.0, 0, 1);

  return (
    <>
      <Camara c={cam} t={t} mano={t < T.mil ? 0.3 : 1} />
      <Estudio fondo="#120f0b" niebla={[6, 22]} luz={0.42} calida={1.1} exposicion={1.0} principal={[2, 5, 2]} />
      <pointLight position={[0, 2.9, -2.5]} intensity={4} distance={7} decay={1.6} color="#ffd59a" castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0.3, 2.9, -6.6]} intensity={5} distance={6} decay={1.6} color="#ffd59a" castShadow shadow-mapSize={[1024, 1024]} />
      {hielo > 0 ? <pointLight position={[CELDA_X, 1.4, REJA_Z + 0.5]} intensity={2.2 * hielo} distance={2.5} color="#8fcaff" /> : null}
      <PisoEstudio color="#5b5750" />
      <mesh position={[0, 1.8, FONDO_Z - 0.45]} receiveShadow><planeGeometry args={[8, 3.6]} /><meshStandardMaterial color="#7a7266" roughness={0.95} /></mesh>
      {/* pasillo de estanterías */}
      {[-1, -3.4, -5.8].map((z, i) => (
        <group key={z}>
          <group position={[-1.45, 0, z]} rotation-y={Math.PI / 2}><EstanteriaDeposito cols={3} pisos={4} ancho={2.3} alto={2.5} fondo={0.5} semilla={i * 13} /></group>
          <group position={[1.45, 0, z]} rotation-y={-Math.PI / 2}><EstanteriaDeposito cols={3} pisos={4} ancho={2.3} alto={2.5} fondo={0.5} semilla={i * 13 + 6} /></group>
        </group>
      ))}
      {/* estantería principal: la columna derecha queda presa */}
      <group position={[0, 0, FONDO_Z]}>
        <EstanteriaDeposito cols={3} pisos={4} ancho={2.4} alto={2.4} fondo={0.55} semilla={41} frio={(c) => (c === 2 ? hielo : 0)} quita={quita} />
        {/* billetes que asoman de las cajas presas */}
        {libre < 0.5 ? [0, 1, 2].map((i) => (
          <group key={i} position={[CELDA_X - 0.2 + i * 0.2, 0.52 + (i % 2) * 0.03, 0.12]} rotation={[-0.4, 0.2 * i, 0.3 - i * 0.2]}><Billete3D /></group>
        )) : null}
        <group position={[CELDA_X, 0.05, 0.3]}><Escarcha w={0.8} h={2.4} k={hielo} /></group>
        {hielo > 0.3 ? (
          <>
            <group position={[CELDA_X + 0.25, 2.25, 0.29]} rotation-z={Math.PI}><Telarana s={0.3} /></group>
            <group position={[CELDA_X - 0.26, 0.75, 0.29]} rotation-z={Math.PI / 2}><Telarana s={0.24} /></group>
          </>
        ) : null}
        {/* la caja que nadie toca (columna izquierda, arriba) */}
        <group position={[-0.8 + 0.27, 1.86, 0.28]} rotation-z={Math.PI}><Telarana s={0.3} /></group>
      </group>
      {/* la reja */}
      <group position={[CELDA_X, rejaY + rebote, REJA_Z]}><Barrotes3D ancho={0.84} alto={3.0} n={7} /></group>
      {/* candado de la reja */}
      {t > T.moverse && caeCandado < 1.2 ? (
        <group position={[CANDADO[0] + caeCandado * 0.2, CANDADO[1] + rejaY - caeCandado * caeCandado * 4, CANDADO[2]]} rotation-z={caeCandado * 3} scale={[3.2, 3.2, 3.2]}>
          <Candado3D abierto={candado} />
        </group>
      ) : null}
      {/* tres llaves de alquiler colgadas de la reja */}
      {tLlave.map((a, i) => {
        if (t < a - 0.3 || t > T.dormido + 0.4) return null;
        const k = entra((t - (a - 0.3)) / 0.3);
        const swing = t > a ? Math.sin((t - a) * 9) * Math.exp(-(t - a) * 3) * 0.35 : 0;
        return (
          <group key={i} position={[posLlave[i][0], posLlave[i][1] + (1 - k) * 1.2 + rejaY, REJA_Z + 0.07]} rotation-z={swing}>
            <LlaveGigante etiqueta="$120.000" />
          </group>
        );
      })}
      {/* contador gigante */}
      {verContador ? (
        <group position={posC as [number, number, number]} scale={[escC, escC, escC]}>
          <Contador3D texto={preso ? "$360.000" : "$1.200.000"} sub={preso ? "SIN MOVERSE · ejemplo" : "MERCADERÍA · ejemplo"} color={preso ? "#ff3b30" : "#36e07a"} ancho={1.6} />
        </group>
      ) : null}
      {t > T.mil - 0.05 && t < T.mil + 1.6 ? <Polvo t={t} centro={[0, 0.25 + (t - T.mil) * 0.3, -5.0]} radio={0.4 + (t - T.mil) * 0.6} n={160} brillo={Math.max(0, 1 - (t - T.mil) / 1.6) * 1.8} /> : null}
      <Polvo t={t} centro={[0, 1.4, -4]} radio={2.2} n={220} brillo={0.7} />
      {/* caja registradora vacía (se llena al liberar) */}
      <group position={[CAJA_REG[0], 0, CAJA_REG[2]]}>
        <mesh position={[0, 0.21, 0]} castShadow receiveShadow><boxGeometry args={[0.55, 0.42, 0.45]} /><meshStandardMaterial color="#7a5638" roughness={0.85} /></mesh>
        <group position={[0, 0.42, -0.05]} scale={[0.8, 0.8, 0.8]}>
          <Registradora3D cajon={0.85} brillo={llena}>
            {llena > 0 ? [-0.12, 0, 0.12].map((x, i) => <group key={i} position={[x, 0, 0]}><PilaBilletes alto={0.012 + llena * (0.04 - i * 0.008)} /></group>) : null}
          </Registradora3D>
        </group>
      </group>
      {vuelos}
      {/* la mano del kiosquero entre los barrotes */}
      {mano >= 0 ? (
        <group position={[CELDA_X + 0.62 - estira, 0.55, REJA_Z + 0.13]} rotation-y={-0.25}>
          <ManoBrazo cierra={0.25 + Math.sin(t * 5) * 0.15} />
        </group>
      ) : null}
      {/* el celular con Depósito */}
      {t > l[4] - 0.35 && t < l[6] ? (
        <group position={[CEL[0], CEL[1] - (1 - entra((t - l[4] + 0.35) / 0.45)) * 0.35, CEL[2]]} rotation-y={Math.sin(t * 0.8) * 0.04}>
          <Celular3D><PantallaApp t={clamp((t - l[4]) / Math.max(1, T.pagan - l[4]) * APP.lista, 0, APP.lista) + clamp(t - T.pagan, 0, APP.fin - APP.lista)} carpeta="tomas/v9-03" app0={0} rate={1} durGrab={APP.fin} /></Celular3D>
        </group>
      ) : null}
      {/* la mota de polvo y el botón de compartir */}
      {t > l[6] - 0.1 && t < l[7] ? <Polvo t={t} centro={[MOTA[0], MOTA[1] + 0.1, MOTA[2] + 0.35]} radio={0.25} n={90} brillo={1.6} /> : null}
      {t > l[7] - 0.3 ? (
        <group position={[0, 1.4 - (1 - entra((t - l[7] + 0.3) / 0.4)) * 0.3, -6.3]}>
          <BotonCompartir pulsa={pulsa} />
          {vuela > 0 && vuela < 1 ? <group position={[vuela * 1.6, vuela * 1.0, vuela * 0.6]} rotation={[0.3, -0.9, 0.3 + vuela]}><Avioncito3D /></group> : null}
        </group>
      ) : null}
      <Profundidad foco={foco} apertura={t >= l[3] && t < l[4] ? 0.03 : 0.012} max={t >= l[3] && t < l[4] ? 0.02 : 0.01} />
    </>
  );
};

export const PlataEncerrada: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, dur);
  const loop = t >= T.LOOP;
  const tw = loop ? 0 : t;
  const { l, e } = T;

  const manual = [0.03, T.millon, T.mil, T.sesenta, T.meses, T.moverse, T.tres, T.alquileres, T.veinte, T.pero, T.deposito, T.dormido, T.pagan, T.siempre, T.producto, T.mandaselo, T.acumula];
  const cortes = [l[1], l[2], l[3], l[4], T.dormido + 0.2, T.pagan, l[6], l[7], T.LOOP - 0.55];
  const lento = t > l[3] && t < l[4]; // la mano: sin golpes de cámara
  const cam: Cam2D = camaraBeats(tw, loop ? [] : ritmo(pal, manual, [[l[3], l[4] - 0.02], [T.LOOP - 0.4, 999]], 0.45), loop ? [] : cortes.filter((c) => !(c > l[3] + 0.1 && c < l[4] - 0.1)), lento ? 0.25 : 0.45);
  const hs = loop ? 0 : temblor(t, [[0.03, 6], [T.mil, 10], [T.moverse, 12], [T.tres, 5], [T.alquileres, 5], [T.veinte, 5], [T.dormido, 7]]);
  let wf = 0;
  if (!loop) [[T.mil, 0.2], [T.sesenta, 0.25], [l[4] - 0.1, 0.3], [T.dormido, 0.2]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });

  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump", vol: 0.7 }, { en: 0, sfx: "whoosh", vol: 0.45 }, { en: 0, sfx: "viento", vol: 0.15 },
    { en: T.millon - 0.1, sfx: "whoosh", vol: 0.4 }, { en: T.mil, sfx: "thump", vol: 0.8 }, { en: T.mil + 0.05, sfx: "caja", vol: 0.55 },
    { en: l[1], sfx: "viento", vol: 0.4 }, { en: l[1] + 0.3, sfx: "vidrio", vol: 0.2 }, { en: T.sesenta, sfx: "glitch", vol: 0.35 }, { en: T.meses, sfx: "vidrio", vol: 0.25 },
    { en: T.moverse - 0.2, sfx: "whoosh", vol: 0.4 }, { en: T.moverse, sfx: "slam", vol: 0.75 }, { en: T.moverse + 0.02, sfx: "metal", vol: 0.6 },
    ...[T.tres, T.alquileres, T.veinte].map((a) => ({ en: a, sfx: "metal", vol: 0.55 })),
    { en: l[3] + 0.2, sfx: "heart", vol: 0.55 }, { en: l[3] + 0.85, sfx: "heart", vol: 0.6 }, { en: T.pero, sfx: "heart", vol: 0.6 }, { en: T.disponible, sfx: "heart", vol: 0.7 },
    { en: l[4] - 0.1, sfx: "ding", vol: 0.5 }, { en: T.dormido - 0.15, sfx: "click", vol: 0.6 }, { en: T.dormido, sfx: "lock", vol: 0.65 }, { en: T.dormido + 0.1, sfx: "rattle", vol: 0.5 },
    { en: T.dormido + 0.2, sfx: "whoosh", vol: 0.45 }, { en: T.dormido + 0.7, sfx: "coins", vol: 0.5 }, { en: T.dormido + 1.4, sfx: "caja", vol: 0.5 },
    { en: T.pagan, sfx: "ding", vol: 0.5 }, { en: T.pagan + 0.1, sfx: "riser", vol: 0.3 },
    { en: T.producto, sfx: "tic", vol: 0.35 },
    { en: T.mandaselo, sfx: "click", vol: 0.6 }, { en: T.mandaselo + 0.2, sfx: "whoosh", vol: 0.55 },
    { en: T.LOOP - 0.55, sfx: "whoosh", vol: 0.5 },
  ];

  // música: tensión hasta el final de la mano (corte), vuelve con la app; silencio breve en la pregunta
  const corte = e[3] + 0.05;
  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(corte * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.11 * Math.min(1, Math.max(0, corte * fps - f) / 3)} />
      </Sequence>
      <Sequence from={Math.round(l[4] * fps)} durationInFrames={Math.max(1, Math.round((l[6] - l[4]) * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.12 * Math.min(1, f / 8) * Math.min(1, Math.max(0, (l[6] - l[4]) * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round((l[6] + 0.6) * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round((l[6] + 0.6) * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.1 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // ---------- capa gráfica (máximo 2 textos + subtítulo) ----------
  const tg = loop ? 0 : t;
  const mota = t >= l[6] && t < l[7] ? clamp((t - l[6]) / Math.max(0.8, e[6] - l[6] + 0.4), 0, 1) : -1;
  const frente = (
    <>
      <div style={{ left: 0, right: 0, top: 0, height: 150, background: "linear-gradient(#000a, #0000)" }} />
      {tg < l[1] - 0.05 || loop ? (
        <div style={{ left: 0, right: 0, top: 46, textAlign: "center", transform: `scale(${Math.min(1.06, 0.82 + sp(tg + 0.1) * 0.2) * latido(tg, 0.62, 0.035)}) rotate(${-2 + Math.sin(tg * 4) * 1.0}deg)` }}>
          <span style={{ position: "static", display: "inline-block", padding: "5px 16px", borderRadius: 12, background: C.rojo, color: "#fff", font: `800 26px/1.1 ${DISP}`, boxShadow: `0 5px 0 ${C.tinta}` }}>PLATA ENCERRADA<br />EN TU DEPÓSITO</span>
        </div>
      ) : null}
      {!loop && t >= T.meses - 0.05 && t < l[2] - 0.05 ? <Etiqueta texto="SIN MOVIMIENTO · 3 MESES" top={430} size={18} fondo="#d61f1f" /> : null}
      {!loop && t >= T.alquileres - 0.05 && t < l[3] - 0.05 ? <Cartel texto="= 3 ALQUILERES (ejemplo)" top={52} size={24} fondo="#d61f1f" s={sp(t - T.alquileres, 1.08)} rot={-2} /> : null}
      {!loop && t >= l[4] - 0.05 && t < T.pagan - 0.05 ? (
        <div style={{ left: 0, right: 0, top: 60, textAlign: "center", transform: `scale(${sp(t - l[4], 1.06)})` }}>
          <span style={{ position: "static", font: `800 21px/1.15 ${DISP}`, color: "#fff", textShadow: "0 3px 12px #000a" }}>En Claro · <span style={{ position: "static", color: C.ambar }}>Depósito</span></span>
        </div>
      ) : null}
      {!loop && t >= T.pagan - 0.05 && t < l[6] - 0.05 ? (
        <>
          <CupoFundadores t={t} desde={T.pagan} top={60} mensual />
          <Etiqueta texto="14 DÍAS GRATIS" top={300} size={20} fondo={C.ambar} color={C.tinta} />
        </>
      ) : null}
      {!loop && t >= T.producto - 0.05 && t < l[7] - 0.05 ? <Cartel texto="COMENTÁ CUÁL" top={60} size={30} fondo={C.ambar} color={C.tinta} s={sp(t - T.producto, 1.08) * latido(t, 0.55, 0.04)} rot={-3} /> : null}
      {mota >= 0 ? <div style={{ left: 150 + Math.sin(mota * 9) * 20, top: -20 + mota * 560, width: 26, height: 26, borderRadius: 13, background: "radial-gradient(#fff6dccc, #fff6dc00 70%)", filter: "blur(2px)" }} /> : null}
      {!loop && t >= l[7] - 0.05 && t < T.LOOP - 0.5 ? (
        <>
          <Cartel texto="MANDÁSELO" top={52} size={28} fondo={C.verde} color={C.ambar} s={sp(t - l[7], 1.08)} rot={-2} />
          <div style={{ left: 0, right: 0, top: 400, display: "flex", justifyContent: "center", opacity: Math.min(1, sp(t - T.acumula, 1.0) * 1.3) }}><LogoEnClaro /></div>
        </>
      ) : null}
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[T.pagan - 0.05, l[6] - 0.05]]}
      fondo={<div style={{ inset: 0, background: "#120f0b" }} />}
      tres={<Escena3D t={tw} T={T} />}
      frente={frente}
      sobre={musica}
    />
  );
};
