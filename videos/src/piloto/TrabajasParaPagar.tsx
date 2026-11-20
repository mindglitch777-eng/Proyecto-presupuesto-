import React from "react";
import * as THREE from "three";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { GUION_P2, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { entra, ritmo } from "../v8/comun";
import { Camara, Estudio, PantallaApp, Profundidad } from "../v8/estudio3d";
import { C } from "../v8/iconos";
import { Celular3D, PilaBilletes, Silueta } from "../v8/modelos3d";
import { Frase, Monto, Oferta, SUB_TOP } from "./comun";
import { Balanza3D, Billete3D, Bloque3D, HojaCalendario, KioscoInterior, Maquina3D, RelojGigante } from "./modelos";

// Prueba piloto · Video 2 "Trabajás para pagar". Cuenta (EJEMPLO): $900.000 ÷ 30 = $30.000 por día; quedan $25.000 para cubrirlos → faltan $5.000.
// Los $25.000 NO son ganancia: es lo disponible para cubrir los fijos en el ejemplo. Pantalla real: Tu día (demo p2), ganancia de hoy −$5.000.

const g = GUION_P2;
const RELOJ: [number, number, number] = [0, 1.95, -0.35];
const MAQ: [number, number, number] = [1.75, 1.03, 0.25];
const PILA: [number, number, number] = [-1.0, 1.03, 0.45];
const BAL: [number, number, number] = [0, 0, 1.35];

type V3 = [number, number, number];
type Cam = { pos: V3; target: V3; fov: number };
const mez = (a: Cam, b: Cam, k: number): Cam => ({ pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, target: a.target.map((v, i) => v + (b.target[i] - v) * k) as V3, fov: a.fov + (b.fov - a.fov) * k });
const suave = (k: number) => { const x = clamp(k, 0, 1); return x * x * (3 - 2 * x); };
const colorDia = (k: number) => {
  // mañana → mediodía → atardecer → noche
  const p = ["#bfe0ff", "#fff3d6", "#ff9a4a", "#22355f"].map((c) => new THREE.Color(c));
  const x = clamp(k, 0, 1) * 3, i = Math.min(2, Math.floor(x));
  return "#" + p[i].clone().lerp(p[i + 1], x - i).getHexString();
};

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e, dur,
    cobran: w(0, "cobran", 1.4),
    novecientos: w(1, "novecientos", l[1]), treinta: w(1, "treinta", l[1] + 1.3), dia: w(1, "día", e[1] - 0.4),
    veinticinco: w(2, "veinticinco", l[2] + 0.4), faltan: w(2, "faltan", e[2] - 0.6),
    doce: w(3, "doce", l[3] + 0.3), todavia: w(3, "todavía", l[3] + 1.5),
    tudia: w(4, "día", l[4] + 0.9),
    primeros: w(5, "primeros", l[5] + 0.1),
  };
}
type T = ReturnType<typeof tiempos>;

/** Cada cuánto el minutero pasa por las 12 en el gancho (el reloj corre rapidísimo). */
const VUELTA = 0.62;

function camara(t: number, T: T): Cam {
  const { l, e } = T;
  const reloj: Cam = { pos: [0.15, RELOJ[1] + 0.05, RELOJ[2] + 2.1], target: [0.1, RELOJ[1] - 0.05, RELOJ[2]], fov: 50 };
  const conMaquina: Cam = { pos: [0.7, 1.95, 4.1], target: [0.55, 1.65, 0], fov: 50 };
  if (t < l[1] - 0.05) return mez(reloj, conMaquina, suave((t - 0.3) / 1.1));
  if (t < l[2] - 0.05) {
    const frente: Cam = { pos: [0, RELOJ[1], RELOJ[2] + 3.0], target: [0, RELOJ[1], RELOJ[2]], fov: 46 };
    const pieza: Cam = { pos: [0.33, RELOJ[1] + 0.22, RELOJ[2] + 0.62], target: [0.33, RELOJ[1] + 0.22, RELOJ[2] + 0.1], fov: 40 };
    return mez(mez(conMaquina, frente, suave((t - l[1]) / 0.5)), pieza, suave((t - (T.treinta + 0.5)) / Math.max(0.8, e[1] - T.treinta)));
  }
  if (t < l[3] - 0.05) {
    const bal: Cam = { pos: [0.05, 1.4, BAL[2] + 4.3], target: [0, 1.15, BAL[2]], fov: 46 };
    return mez({ pos: [0.33, RELOJ[1] + 0.22, RELOJ[2] + 0.62], target: [0.33, RELOJ[1] + 0.22, RELOJ[2] + 0.1], fov: 40 }, bal, suave((t - l[2] + 0.05) / 0.55));
  }
  if (t < l[4] - 0.05) {
    // se aleja: el kiosquero detrás del mostrador y el reloj detrás de él
    const k = suave((t - l[3]) / Math.max(1.5, l[4] - l[3]));
    return mez({ pos: [0.1, 1.5, BAL[2] + 2.6], target: [0.2, 1.4, 0], fov: 46 }, { pos: [-0.4, 1.75, 5.2], target: [0.1, 1.55, -0.2], fov: 46 }, k);
  }
  if (t < l[5] - 0.05) {
    const k = suave((t - l[4] + 0.3) / 1.2);
    return mez({ pos: [0, RELOJ[1] + 0.1, 2.4], target: [0, RELOJ[1], RELOJ[2]], fov: 44 }, { pos: [0, RELOJ[1], RELOJ[2] + 1.25], target: [0, RELOJ[1], RELOJ[2]], fov: 40 }, k);
  }
  const k = suave((t - l[5]) / 1.2);
  return mez({ pos: [0, RELOJ[1], RELOJ[2] + 1.25], target: [0, RELOJ[1], RELOJ[2]], fov: 40 }, { pos: [0.4, RELOJ[1] + 0.25, RELOJ[2] + 2.0], target: [0.08, RELOJ[1] + 0.18, RELOJ[2]], fov: 44 }, k);
}

const Escena3D: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const { l, e } = T;
  const cam = camara(t, T);
  const foco = Math.hypot(cam.target[0] - cam.pos[0], cam.target[1] - cam.pos[1], cam.target[2] - cam.pos[2]);

  // 1. reloj → 2. calendario → bloque que se parte en 30 → 3. balanza → 4. reloj otra vez (el día pasa) → 5. celular
  const aCal = suave((t - (l[1] - 0.15)) / 0.4); // el reloj gira y se va
  const vuelveReloj = suave((t - (l[3] - 0.1)) / 0.5);
  const aCel = suave((t - (l[4] - 0.35)) / 0.6);
  const relojVis = t < l[1] + 0.3 ? 1 - aCal : t >= l[3] - 0.1 ? vuelveReloj * (1 - aCel) : 0;
  const diaK = clamp((t - l[3]) / Math.max(1.5, e[3] - l[3] + 0.6), 0, 1);
  const hora = t < l[1] ? 7 + t / VUELTA : t < l[4] - 0.35 ? 7 + diaK * 12 : 19;
  const leyenda = t >= l[3] - 0.1 ? "12 HORAS" : "GASTOS FIJOS";

  // calendario: hojas que pasan, después el bloque de $900.000 que se parte en 30 piezas
  const hojas = t >= l[1] - 0.1 && t < T.novecientos + 0.4;
  const bloque = entra((t - (T.novecientos - 0.1)) / 0.4);
  const parte = suave((t - (T.treinta - 0.1)) / 0.6);
  const verCal = t >= l[1] - 0.1 && t < l[2] + 0.2;

  // balanza: $30.000 a cubrir vs $25.000 disponibles; se inclina hacia lo que hay que cubrir
  const verBal = t >= l[2] - 0.2 && t < l[3] + 0.4;
  const inclina = -0.24 * entra((t - (T.veinticinco + 0.1)) / 0.5) + Math.sin(Math.max(0, t - T.veinticinco - 0.7) * 9) * Math.exp(-Math.max(0, t - T.veinticinco - 0.7) * 4) * 0.04;
  const balSale = suave((t - l[3]) / 0.4);

  // billetes que la máquina se traga cada vez que el minutero pasa por las 12
  const vuelos: React.ReactNode[] = [];
  if (t < l[1] + 0.2) {
    for (let v = 0; v < 6; v++) {
      for (let j = 0; j < 3; j++) {
        const a = v * VUELTA - 0.2 + j * 0.07, k = (t - a) / 0.5;
        if (k < 0 || k > 1) continue;
        vuelos.push(
          <group key={`${v}${j}`} position={[PILA[0] + (MAQ[0] - PILA[0]) * k, PILA[1] + 0.2 + (1.55 - 0.2) * k + Math.sin(k * Math.PI) * 0.5, PILA[2] + (MAQ[2] + 0.05 - PILA[2]) * k]} rotation={[k * 6 + j, k * 3, k * 5]}>
            <Billete3D escala={1.3} />
          </group>,
        );
      }
    }
  }
  const pilaAlto = Math.max(0.03, 0.12 - Math.floor(Math.max(0, t) / VUELTA) * 0.015);
  const luzDia = t >= l[3] - 0.1 && t < l[4] ? colorDia(diaK) : t >= l[4] ? "#22355f" : "#ffcf8a";

  return (
    <>
      <Camara c={cam} t={t} mano={t < 0.6 ? 2.2 : 1} />
      <Estudio fondo="#130f0b" niebla={[7, 24]} luz={0.5} calida={1.05} exposicion={1.0} principal={[2.5, 5, 4]} />
      <pointLight position={[0.4, 2.9, 2.2]} intensity={5.5} distance={7} decay={1.5} color="#ffd59a" castShadow shadow-mapSize={[1024, 1024]} />
      {t >= l[3] - 0.1 && t < l[4] ? <directionalLight position={[4 - diaK * 8, 4 + Math.sin(diaK * Math.PI) * 3, 3]} intensity={2.2 * (1 - diaK * 0.8)} color={luzDia} /> : null}
      <KioscoInterior luz={luzDia} intensidad={t >= l[3] ? 1.6 : 1} />
      {/* el reloj gigante (gira y se va en el calendario; vuelve con las 12 horas; se vuelve celular) */}
      {relojVis > 0.01 ? (
        <group position={RELOJ} rotation-y={t < l[2] ? aCal * Math.PI * 0.5 : 0} scale={[relojVis, relojVis, relojVis]}>
          <RelojGigante hora={hora} radio={1.05} leyenda={leyenda} color={leyenda === "12 HORAS" ? "#1d4ed8" : "#c0261b"} />
        </group>
      ) : null}
      {/* la máquina de gastos fijos y la plata que se traga */}
      {t < l[1] + 0.3 ? (
        <>
          <group position={MAQ} scale={[0.75, 0.75, 0.75]}><Maquina3D t={t} gira={3} luz={0.5 + 0.5 * Math.abs(Math.sin((t / VUELTA) * Math.PI))} /></group>
          <group position={PILA}>{[-0.1, 0.1].map((x) => <group key={x} position={[x, 0, 0]}><PilaBilletes alto={pilaAlto} /></group>)}</group>
          {vuelos}
        </>
      ) : null}
      {/* calendario de 30 días: hojas que pasan y el bloque del mes que se parte en 30 */}
      {verCal ? (
        <group position={RELOJ}>
          {hojas ? Array.from({ length: 5 }, (_, i) => {
            const k = clamp((t - (l[1] - 0.1) - i * 0.12) / 0.35, 0, 1);
            return (
              <group key={i} position={[0, 0.36 - (1 - aCal) * 0.5, 0.1 + i * 0.01]} rotation-x={-k * 2.6} scale={[aCal, aCal, aCal]}>
                <group position={[0, -0.36, 0]}><HojaCalendario arriba="MES" numero={String(30 - i * 6)} abajo="días" w={0.9} h={0.72} /></group>
              </group>
            );
          }) : null}
          {bloque > 0 ? (
            parte < 0.02 ? (
              <group scale={[bloque, bloque, bloque]} position={[0, 0, 0.25]}><Bloque3D texto="$900.000 / MES" w={1.6} h={0.8} d={0.25} color="#f5c542" /></group>
            ) : (
              Array.from({ length: 30 }, (_, i) => {
                const c = i % 6, f = Math.floor(i / 6);
                const x0 = -0.8 + (c + 0.5) * (1.6 / 6), y0 = 0.4 - (f + 0.5) * 0.16;
                const x1 = -1.1 + (c + 0.5) * (2.2 / 6), y1 = 0.7 - (f + 0.5) * 0.28;
                return (
                  <group key={i} position={[x0 + (x1 - x0) * parte, y0 + (y1 - y0) * parte, 0.25 + parte * (0.1 + (i % 3) * 0.03)]} rotation-y={(1 - parte) * 0 + Math.sin(i + t) * 0.05 * parte}>
                    <Bloque3D texto="$30.000 / DÍA" w={0.26 + 0.06 * parte} h={0.16 + 0.04 * parte} d={0.1} color={i === 21 ? "#ffd166" : "#f5c542"} brillo={i === 21 ? 0.25 * parte : 0} />
                  </group>
                );
              })
            )
          ) : null}
        </group>
      ) : null}
      {/* la balanza */}
      {verBal ? (
        <group position={[BAL[0], BAL[1] - balSale * 2.2, BAL[2]]} scale={[entra((t - l[2] + 0.2) / 0.4), entra((t - l[2] + 0.2) / 0.4), entra((t - l[2] + 0.2) / 0.4)]}>
          <Balanza3D
            brazo={0.62}
            inclina={inclina}
            izq={<group position={[0, 0.18, 0]}><Bloque3D texto="$30.000" sub="A CUBRIR · EJEMPLO" w={0.56} h={0.36} d={0.3} color="#f08a7a" /></group>}
            der={
              <group>
                <group position={[0, 0.15, 0]}><Bloque3D texto="$25.000" sub="DISPONIBLE · EJEMPLO" w={0.5} h={0.3} d={0.3} color="#7cd6a0" /></group>
                {t > T.faltan - 0.2 ? (
                  <group position={[0, 0.36, 0]}>
                    <mesh><boxGeometry args={[0.5, 0.12, 0.3]} /><meshStandardMaterial color="#ff3b30" transparent opacity={0.35 + 0.25 * Math.sin(t * 10)} emissive="#ff3b30" emissiveIntensity={1.2} depthWrite={false} /></mesh>
                    <pointLight intensity={2} distance={1.5} color="#ff3b30" />
                  </group>
                ) : null}
              </group>
            }
          />
        </group>
      ) : null}
      {/* el kiosquero detrás del mostrador (silueta a contraluz) */}
      {t >= l[3] - 0.2 && t < l[4] + 0.3 ? (
        <group position={[0.75 + Math.sin(t * 1.3) * 0.35, 0, -0.05]} rotation-y={Math.sin(t * 2.1) * 0.35}>
          <group position={[0, 0, -0.015]}><Silueta alto={1.72} color="#1c1a18" /></group>
        </group>
      ) : null}
      {/* el reloj se vuelve celular con Tu día */}
      {aCel > 0.01 ? (
        <group position={RELOJ} scale={[5 * entra(aCel), 5 * entra(aCel), 5 * entra(aCel)]}>
          <Celular3D><PantallaApp t={clamp(t - l[4], 0, 3.3)} carpeta="tomas/p2" app0={0} rate={1} durGrab={5.522} /></Celular3D>
          {t > T.tudia ? (
            <group position={[0, 0.0484, 0.0052]}>
              {[[0, 0.0072, 0.066, 0.0007], [0, -0.0072, 0.066, 0.0007], [-0.033, 0, 0.0007, 0.0144], [0.033, 0, 0.0007, 0.0144]].map(([x, y, w, h], i) => (
                <mesh key={i} position={[x, y, 0]}><planeGeometry args={[w, h]} /><meshBasicMaterial color="#f5a524" toneMapped={false} transparent opacity={Math.min(1, (t - T.tudia) * 3)} /></mesh>
              ))}
            </group>
          ) : null}
        </group>
      ) : null}
      <Profundidad foco={foco} apertura={0.013} max={0.01} />
    </>
  );
};

export const TrabajasParaPagar: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, durationInFrames / fps);
  const { l, e } = T;

  const manual = [0.03, T.cobran, T.novecientos, T.treinta, T.dia, T.veinticinco, T.faltan, T.doce, T.todavia, T.tudia, T.primeros, l[6], l[7]];
  const cortes = [l[1], l[2], l[3], l[4] - 0.3, l[5]];
  const cam: Cam2D = camaraBeats(t, ritmo(pal, manual, [], 0.5), cortes, 0.4);
  const hs = temblor(t, [[0.0, 10], [T.cobran, 6], [T.treinta, 5], [T.faltan, 8], [T.doce, 4]]);
  let wf = 0;
  [[0.0, 0.3], [T.treinta, 0.15], [T.faltan, 0.2], [l[4] - 0.3, 0.3]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });

  const tics = (desde: number, hasta: number, cada: number, vol: number) => Array.from({ length: Math.max(0, Math.floor((hasta - desde) / cada)) }, (_, i) => ({ en: desde + i * cada, sfx: "tic", vol }));
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump", vol: 0.8 }, ...tics(0, l[1], 0.31, 0.5), ...Array.from({ length: 5 }, (_, v) => ({ en: v * VUELTA - 0.1, sfx: "aspiradora", vol: 0.2 })),
    { en: T.cobran, sfx: "thump", vol: 0.6 },
    { en: l[1] - 0.1, sfx: "whoosh", vol: 0.45 }, ...Array.from({ length: 5 }, (_, i) => ({ en: l[1] + i * 0.12, sfx: "hoja", vol: 0.4 })),
    { en: T.novecientos, sfx: "thump", vol: 0.6 }, { en: T.treinta, sfx: "vidrio", vol: 0.3 }, { en: T.treinta + 0.05, sfx: "metal", vol: 0.4 },
    { en: l[2], sfx: "whoosh", vol: 0.4 }, { en: T.veinticinco + 0.1, sfx: "metal", vol: 0.5 }, { en: T.faltan, sfx: "buzz", vol: 0.35 }, { en: T.faltan + 0.05, sfx: "heart", vol: 0.55 },
    { en: l[3], sfx: "whoosh", vol: 0.4 }, ...tics(l[3], l[4] - 0.4, 0.12, 0.3), { en: T.todavia, sfx: "heart", vol: 0.55 },
    { en: l[4] - 0.35, sfx: "glitch", vol: 0.4 }, { en: l[4] - 0.3, sfx: "whoosh", vol: 0.55 }, { en: T.tudia, sfx: "ding", vol: 0.5 },
    { en: l[5], sfx: "riser", vol: 0.3 }, { en: l[6], sfx: "click", vol: 0.45 }, { en: l[7], sfx: "whoosh", vol: 0.45 },
  ];
  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(l[3] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.11 * Math.min(1, Math.max(0, l[3] * fps - f) / 3)} />
      </Sequence>
      <Sequence from={Math.round(l[4] * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(l[4] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.11 * Math.min(1, f / 8)} />
      </Sequence>
    </>
  );

  const frente = (
    <>
      <div style={{ left: 0, right: 0, top: 0, height: 170, background: "linear-gradient(#000b, #0000)" }} />
      {t < l[1] - 0.05 ? <Frase t={t} desde={-0.4} lineas={["Tus gastos cobran primero."]} top={74} size={25} /> : null}
      {t >= l[1] - 0.05 && t < l[2] - 0.05 ? (
        t < T.treinta - 0.05 ? <Monto t={t} desde={T.novecientos} texto="$900.000 / mes" top={74} size={40} color="#ffd27a" /> : <Monto t={t} desde={T.treinta} texto="$30.000 / día" top={74} size={44} color="#ffd27a" sub="$900.000 ÷ 30" />
      ) : null}
      {t >= l[2] - 0.05 && t < l[3] - 0.05 ? (
        t < T.faltan - 0.05 ? <Frase t={t} desde={T.veinticinco} lineas={["$30.000 a cubrir", "$25.000 disponibles"]} top={74} size={20} fondo={C.verde} color="#fff" />
          : <Monto t={t} desde={T.faltan} texto="FALTAN $5.000" top={74} size={40} color="#ff8a7a" />
      ) : null}
      {t >= l[3] - 0.05 && t < l[4] - 0.35 ? <Frase t={t} desde={T.todavia} lineas={["Y todavía no alcanza."]} top={74} size={24} /> : null}
      {t >= l[4] - 0.05 && t < l[5] - 0.05 ? <Frase t={t} desde={l[4] + 0.3} lineas={["Dejá de mirar", "solo cuánto entra."]} top={70} size={21} fondo={C.ambar} color={C.tinta} /> : null}
      {t >= l[5] - 0.05 ? <Oferta t={t} desde={l[5]} top={70} /> : null}
      {t >= l[6] - 0.05 && t < l[7] - 0.05 ? <Frase t={t} desde={l[6]} lineas={["¿Cuánto tenés que cubrir?"]} top={262} size={21} fondo={C.ambar} color={C.tinta} /> : null}
      {t >= l[7] - 0.05 ? <Frase t={t} desde={l[7]} lineas={["Mandáselo al que", "abre todos los días."]} top={262} size={21} /> : null}
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[l[6] - 0.05, 999]]} subTop={SUB_TOP}
      fondo={<div style={{ inset: 0, background: "#130f0b" }} />}
      tres={<Escena3D t={t} T={T} />}
      frente={frente}
      sobre={musica}
    />
  );
};
