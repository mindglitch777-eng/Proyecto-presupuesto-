import React from "react";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V8_11, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { Billetes, Cartel, CupoFundadores, Etiqueta, Numero, Rotulo, entra, latido, ritmo, sp, valorPasos } from "./comun";
import { Estudio, PantallaApp } from "./estudio3d";
import { C } from "./iconos";
import { Barra3D, Candado3D, Celular3D, Cuaderno3D, Kiosco3D, Reloj3D, Vereda } from "./modelos3d";
import { Partida } from "./MismoKiosco";

// V8-11 "¿Cuánto gana por hora un kiosquero?" (videos/guiones/V8-11-POR-HORA.md). Estrategia de plata, seria: números y comparación.
// Le quedan $23.500/día ÷ 13 h = $1.808/h. Precios al día (+$8.200/día) → $2.438/h. Fiado cobrado (+$8.000/día) → $3.054/h (+69%). Todo (ejemplo).

const g = GUION_V8_11;
const HORAS = 13;
const POR_HORA = [Math.round(23500 / HORAS), Math.round(31700 / HORAS), Math.round(39700 / HORAS)]; // 1.808 · 2.438 · 3.054
const CREIA = Math.round(150000 / HORAS); // 11.538
const XB = 10;
// grabación real de la app (app/scripts/grabar-v8.cjs v8-11)
const APP = { precio: 2.988, fiados: 4.906, fin: 6.908 };

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e, dur,
    hora: w(0, "¿cuánto", 1.2),
    quedan: w(1, "quedan", l[1] + 1.6), dividido: w(1, "dividido", l[1] + 3.0),
    enfrente: w(3, "enfrente", l[3] + 0.6), tres: w(3, "tres", e[3] - 0.7),
    uno: w(4, "uno", l[4] + 0.6), ocho: w(4, "ocho", l[4] + 2.4),
    dos: w(5, "dos", l[5] + 0.6),
    cobrar: w(6, "cobrar", l[6]), mas: w(6, "más", l[6] + 1.1),
    sesenta: l[7], caramelo: w(7, "caramelo", e[7] - 0.6),
    cuenta: w(8, "cuenta", l[8] + 1.0), precio: w(8, "precio", l[8] + 3.0), cobrarle: w(8, "cobrarle", e[8] - 0.6),
    comentalo: w(9, "comentalo", e[9] - 0.6),
    LOOP: dur - 0.27,
  };
}
type T = ReturnType<typeof tiempos>;

/** Plata por hora del kiosco de arriba (el que hace los dos movimientos). */
const pasosHora = (T: T) => [{ en: T.ocho, a: POR_HORA[1] }, { en: T.mas + 0.2, a: POR_HORA[2] }];

function appTiempo(t: number, T: T) {
  const p: [number, number][] = [[T.l[8], 0], [T.cuenta + 0.6, 0.6], [T.precio - 0.4, APP.precio - 0.5], [T.precio + 0.6, APP.precio + 0.4], [T.cobrarle - 0.3, APP.fiados], [T.cobrarle + 1.6, APP.fin]];
  if (t <= p[0][0]) return 0;
  for (let i = 0; i < p.length - 1; i++) { const [a, s0] = p[i], [b, s1] = p[i + 1]; if (t < b) return s0 + (s1 - s0) * ((t - a) / (b - a)); }
  return APP.fin;
}

/** Cámaras: la B es la toma principal (kiosco de arriba en x = 0); en la pantalla partida la A mira el kiosco de enfrente. */
function camaras(t: number, T: T) {
  const { l } = T;
  const base = (k: number) => ({ pos: [-0.9 + 0.6 * Math.sin(t * 0.7) * k, 1.45 + 0.2 * k, 5.4 - 1.4 * k], target: [-1.0, 1.55, 0], fov: 46 });
  const kG = t < l[1] ? Math.sin((Math.PI / 2) * clamp(t / Math.max(0.5, l[1]), 0, 1)) : 1;
  let b = base(kG);
  const a = { pos: [XB + Math.sin(t * 0.6) * 0.3, 1.5, 5.0], target: [XB, 1.5, 0], fov: 44 };
  if (t >= l[3] - 0.05 && t < l[5] - 0.05) b = { pos: [Math.sin(t * 0.6) * 0.3, 1.5, 5.0], target: [0, 1.5, 0], fov: 44 };
  if (t >= l[5] - 0.05 && t < l[7] - 0.05) {
    const k = entra((t - l[5] + 0.05) / 0.5);
    b = { pos: [0.75 + 0.9 * (1 - k) + Math.sin(t) * 0.04, 1.05 + 0.4 * (1 - k), 1.9 + 2.0 * (1 - k)], target: [0.8, 0.62, 1.2], fov: 40 };
  }
  if (t >= l[7] - 0.05 && t < l[8] - 0.05) b = { pos: [1.2 + Math.sin(t * 0.8) * 0.5, 1.3, 4.2], target: [0.2, 0.85, 1.4], fov: 46 };
  if (t >= l[8] - 0.05 && t < l[9] - 0.05) {
    const k = entra((t - l[8]) / 0.6);
    b = { pos: [0.9 + Math.sin(t * 0.7) * 0.03, 1.14, 2.05 - 0.15 * k], target: [0.9, 1.1, 1.55], fov: 36 };
  }
  if (t >= l[9] - 0.05) {
    const k = 1 - clamp((t - l[9]) / Math.max(1, T.LOOP - l[9]), 0, 1);
    b = { pos: [1.6 * Math.sin(k * 2) * k, 1.4 + 0.4 * k, 6.0 + 1.2 * k], target: [0, 1.6, 0], fov: 46 };
  }
  if (t >= T.LOOP) b = base(0);
  return { a, b };
}

const Escena3D: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const { l } = T;
  const { a, b } = camaras(t, T);
  const partida = t >= l[3] - 0.05 && t < l[5] - 0.05 ? 0.5 * entra((t - l[3] + 0.05) / 0.4) : 0;
  // reloj: de 7 a 20 a toda velocidad en el gancho; después marca la hora "de noche" y sigue andando
  const hora = t < l[1] ? 7 + 13 * clamp(t / Math.max(0.5, l[1]), 0, 1) : 20 + ((t - l[1]) * 0.08) % 1;
  const candado = entra((t - T.cobrar) / 0.3);
  const barra = entra((t - (T.sesenta + 0.1)) / 0.7);
  return (
    <>
      <Estudio fondo="#0b1116" niebla={[10, 34]} luz={0.45} calida={0.9} exposicion={1.0} principal={[4, 7, 6]} />
      <pointLight position={[0, 3.4, 3]} intensity={5} distance={9} decay={1.6} color="#ffd9a0" castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[XB, 3.4, 3]} intensity={5} distance={9} decay={1.6} color="#ffd9a0" />
      <Vereda largo={5} ancho={40} />
      {/* kiosco de arriba (x = 0) y el de enfrente (x = +10), idénticos */}
      {[0, XB].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Kiosco3D t={t} />
          <group position={[-1.75, 1.72, -0.12]}><Reloj3D hora={hora} radio={0.34} /></group>
        </group>
      ))}
      {/* el cuaderno de fiados con candado, sobre un cajón en la vereda */}
      <group position={[0.8, 0, 1.2]}>
        <mesh position={[0, 0.27, 0]} castShadow receiveShadow><boxGeometry args={[0.6, 0.54, 0.45]} /><meshStandardMaterial color="#8a5a3c" roughness={0.8} /></mesh>
        <group position={[0, 0.54, 0]} scale={[1.2, 1.2, 1.2]}><Cuaderno3D cierre={t > T.cobrar ? 0 : 1} /></group>
        {t < T.cobrar + 0.8 ? (
          <group position={[0.02 + (t > l[5] && t < T.cobrar ? Math.sin(t * 50) * 0.006 : 0), 0.6 + candado * 0.25, 0.12 + candado * 0.2]} rotation-z={candado * 2}>
            <Candado3D abierto={candado} />
          </group>
        ) : null}
      </group>
      {/* comparación final: dos barras de plata por hora */}
      {barra > 0 ? (
        <group position={[0.2, 0, 1.6]}>
          <group position={[-0.35, 0, 0]}><Barra3D alto={(POR_HORA[0] / 2000) * barra} color="#d92d20" /></group>
          <group position={[0.35, 0, 0]}><Barra3D alto={(POR_HORA[2] / 2000) * barra} color="#16794a" /></group>
        </group>
      ) : null}
      {/* el celular con la app */}
      {t > l[8] - 0.3 && t < l[9] + 0.3 ? (
        <group position={[0.9, 1.1 - (1 - entra((t - l[8] + 0.3) / 0.5)) * 0.4, 1.55]} rotation-y={Math.sin(t * 0.8) * 0.05}>
          <Celular3D><PantallaApp t={appTiempo(t, T)} carpeta="tomas/v8-11" app0={0} rate={1} durGrab={APP.fin} /></Celular3D>
        </group>
      ) : null}
      <Partida a={a} b={b} r={partida} />
    </>
  );
};

export const PorHora: React.FC<VideoProps> = ({ voz, palabras }) => {
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

  const manual = [0.03, T.hora, T.quedan, T.dividido, l[2], T.enfrente, T.tres, T.uno, T.ocho, T.dos, T.cobrar, T.mas, T.sesenta, T.caramelo, T.cuenta, T.precio, T.cobrarle, T.comentalo];
  const cortes = [l[3], l[5], l[7], l[8], l[9]];
  const cam: Cam2D = t > sil0 && t < l[7] ? { z: 1.02, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : ritmo(pal, manual, [[sil0, l[7] - 0.02], [T.LOOP - 0.4, 999]], 0.45), loop ? [] : cortes, 0.45);
  const hs = loop ? 0 : temblor(t, [[0.03, 8], [T.dividido, 9], [l[2], 10], [T.cobrar, 6], [T.sesenta, 10]]);
  let wf = 0;
  if (!loop) [[l[2], 0.25], [T.sesenta, 0.25]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });

  const tics = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.max(0.5, l[1] - 0.1));
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, ...tics.map((a) => ({ en: a, sfx: "tic", vol: 0.5 })), { en: 0, sfx: "calle", vol: 0.3 },
    ...cortes.map((a) => ({ en: a - 0.12, sfx: "whoosh", vol: 0.3 })),
    { en: T.quedan, sfx: "caja", vol: 0.45 }, { en: T.quedan + 0.45, sfx: "click", vol: 0.45 }, { en: T.dividido, sfx: "sello", vol: 0.6 },
    { en: l[2], sfx: "thump", vol: 0.6 }, { en: l[2] + 0.4, sfx: "buzz", vol: 0.3 },
    { en: T.enfrente, sfx: "heart", vol: 0.45 }, { en: T.tres, sfx: "heart", vol: 0.5 },
    { en: T.ocho, sfx: "click", vol: 0.5 }, { en: T.ocho + 0.42, sfx: "ding", vol: 0.5 },
    { en: l[5], sfx: "heart", vol: 0.5 }, { en: l[5] + 0.55, sfx: "heart", vol: 0.55 },
    { en: T.cobrar, sfx: "lock", vol: 0.55 }, { en: T.cobrar + 0.15, sfx: "coins", vol: 0.45 }, { en: T.mas + 0.62, sfx: "ding", vol: 0.5 },
    { en: T.sesenta, sfx: "thump", vol: 0.6 }, { en: T.sesenta + 0.1, sfx: "riser", vol: 0.25 },
    ...[T.cuenta, T.precio, T.cobrarle].map((a) => ({ en: a, sfx: "ding", vol: 0.45 })),
    { en: l[9] + 0.3, sfx: "click", vol: 0.45 }, ...[0, 0.25, 0.5].map((d) => ({ en: T.LOOP - 0.6 + d, sfx: "tic", vol: 0.4 })),
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

  // ---------- capa gráfica: el número por hora es el protagonista ----------
  const tg = loop ? 0 : t;
  const partida = t >= l[3] - 0.05 && t < l[5] - 0.05;
  const hora = valorPasos(t, POR_HORA[0], pasosHora(T));
  const creia = CREIA - (CREIA - POR_HORA[0]) * entra((t - (l[2] + 0.4)) / 0.9);
  const frente = (
    <>
      {!partida ? <div style={{ left: 0, right: 0, top: 0, height: 230, background: "linear-gradient(#000c, #0009 60%, #0000)" }} /> : null}
      {tg < l[1] - 0.05 || loop ? <Cartel texto="13 HORAS · ¿CUÁNTO POR HORA?" top={80} size={20} s={Math.min(1.08, 0.8 + sp(tg + 0.1) * 0.2) * latido(tg, 0.62, 0.04)} rot={-2 + Math.sin(tg * 4) * 1.2} /> : null}
      {!loop && t >= l[1] - 0.05 && t < l[2] - 0.05 ? (
        <>
          <Numero t={t} v={valorPasos(t, 150000, [{ en: T.quedan, a: 23500 }], 0.5)} pasos={[{ en: T.quedan, a: 23500 }]} dur={0.5} top={84} size={60} color={t > T.quedan + 0.5 ? "#ff6b5e" : "#fff"} />
          <Billetes t={t} desde={T.quedan} hasta={T.quedan + 0.8} x0={180} y0={150} x1={420} y1={60} cada={0.06} alto={40} />
          {t > T.dividido - 0.05 ? <Cartel texto="÷ 13 HORAS" top={168} size={34} s={sp(t - T.dividido, 1.15, 18, 0.4)} rot={-4} /> : null}
        </>
      ) : null}
      {!loop && t >= l[2] - 0.05 && t < l[3] - 0.05 ? (
        <>
          <Etiqueta texto="POR HORA" top={76} fondo={C.rojo} />
          <Numero t={t} v={POR_HORA[0]} top={104} size={72} color="#ff6b5e" redondeo={1} />
          {/* lo que creía ganar por hora (150.000 ÷ 13) se desinfla hasta lo real */}
          <div style={{ left: 60, width: 90, bottom: 190, height: (creia / CREIA) * 230, borderRadius: 10, background: "#ffffff22", border: "2px dashed #ffffffaa" }} />
          <div style={{ left: 40, width: 130, bottom: 160, textAlign: "center", font: `700 13px ${BODY}`, color: "#fff" }}>creía: {ars(Math.round(creia))}/h</div>
          <div style={{ left: 210, width: 90, bottom: 190, height: (POR_HORA[0] / CREIA) * 230, borderRadius: 10, background: "#d92d20" }} />
          <div style={{ left: 190, width: 130, bottom: 160, textAlign: "center", font: `700 13px ${BODY}`, color: "#ff8a80" }}>real (ejemplo)</div>
        </>
      ) : null}
      {!loop && partida ? (
        <>
          <div style={{ left: 0, right: 0, top: 307, height: 26, background: "#0f1f17", borderTop: `2px solid ${C.ambar}`, borderBottom: `2px solid ${C.ambar}`, textAlign: "center", font: `800 14px/22px ${BODY}`, color: C.ambar }}>
            <span style={{ position: "static" }}>{t < l[4] - 0.05 ? "¿QUÉ HACE DISTINTO?" : "MISMO HORARIO · MISMAS VENTAS (ejemplo)"}</span>
          </div>
          {/* arriba: el kiosco de enfrente (gana más); abajo: este */}
          <div style={{ left: 0, right: 0, top: 30, textAlign: "center", transform: `translateX(${t < T.tres ? Math.sin(t * 40) * 2 : 0}px) scale(${latido(t, 0.5, 0.05)})` }}>
            <span style={{ position: "static", display: "inline-block", padding: "2px 12px", borderRadius: 10, background: "#0b0f0dcc", font: `800 40px ${DISP}`, color: t > T.tres ? "#7cf2a8" : "#fff" }}>{t > T.tres ? `${ars(POR_HORA[2])}/h` : "$?.???/h"}</span>
          </div>
          <div style={{ left: 0, right: 0, top: 350, textAlign: "center" }}>
            <span style={{ position: "static", display: "inline-block", padding: "2px 12px", borderRadius: 10, background: "#0b0f0dcc", font: `800 40px ${DISP}`, color: hora > POR_HORA[0] + 5 ? "#ffd27a" : "#ff6b5e" }}>{ars(Math.round(hora))}/h</span>
          </div>
          {t > T.ocho + 0.4 ? <Rotulo t={t} desde={T.ocho + 0.4} texto="+$631/h · precios al día (ejemplo)" top={410} color={C.hoja} size={15} /> : null}
        </>
      ) : null}
      {!loop && t >= l[5] - 0.05 && t < l[7] - 0.05 ? (
        <>
          <Etiqueta texto="POR HORA" top={76} fondo={hora > POR_HORA[1] + 5 ? C.hoja : C.verde} color={C.ambar} />
          <Numero t={t} v={hora} pasos={pasosHora(T)} top={104} size={64} color={hora > POR_HORA[1] + 5 ? "#7cf2a8" : "#ffd27a"} redondeo={1} />
          {t < T.cobrar ? <Cartel texto="EL QUE NADIE HACE" top={180} size={22} s={sp(t - T.dos, 1.06) * latido(t, 0.5, 0.05)} rot={Math.sin(t * 5) * 1.5} /> : <Rotulo t={t} desde={T.cobrar} texto="+$616/h · fiado cobrado (ejemplo)" top={182} color={C.hoja} size={15} />}
          {t > T.cobrar ? <Billetes t={t} desde={T.cobrar + 0.1} hasta={T.mas + 0.8} x0={200} y0={430} x1={170} y1={150} cada={0.1} alto={60} /> : null}
        </>
      ) : null}
      {!loop && t >= l[7] - 0.05 && t < l[8] - 0.05 ? (
        <>
          <Cartel texto="+69% · MISMAS VENTAS" top={80} fondo={C.verde} color={C.ambar} size={24} s={sp(t - T.sesenta, 1.08) * latido(t, 0.55, 0.04)} rot={-2} />
          <Rotulo t={t} desde={T.sesenta + 0.6} texto={`${ars(POR_HORA[0])}/h → ${ars(POR_HORA[2])}/h (ejemplo)`} top={134} color={C.hoja} size={17} />
        </>
      ) : null}
      {!loop && t >= l[8] - 0.05 && t < l[9] - 0.05 ? (
        <div style={{ left: 0, right: 0, top: 80, textAlign: "center", transform: `scale(${sp(t - l[8], 1.06)})` }}>
          <span style={{ position: "static", font: `800 18px/1.15 ${DISP}`, color: "#fff", textShadow: "0 3px 12px #000a" }}>En Claro <span style={{ position: "static", color: C.ambar }}>hace la cuenta cada noche</span></span>
        </div>
      ) : null}
      {!loop && t >= l[9] - 0.05 ? <CupoFundadores t={t} desde={l[9]} top={140} /> : null}
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, e[0] + 0.1], [sil0, l[7] + 0.05], [l[9] - 0.05, 999]]}
      fondo={<div style={{ inset: 0, background: "#0b1116" }} />}
      tres={<Escena3D t={tw} T={T} />}
      frente={frente}
      sobre={musica}
    />
  );
};
