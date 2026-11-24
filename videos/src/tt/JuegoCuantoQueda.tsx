import React from "react";
import { Html5Audio, OffthreadVideo, Sequence, getStaticFiles, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { guionSchema } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Celular, Marco, camaraBeats, temblor, type Cam2D } from "../v6/comun";
import { entra, latido, sp } from "../v8/comun";
import { C } from "../v8/iconos";
import dialogo from "../../public/voces/tt-04/dialogo.json";

// TT-04 "¿Cuánto le queda?" (videos/guiones/TT-04-CUANTO-LE-QUEDA.md). Programa de juegos 2D: el concursante elige la A, los gastos
// se comen la pila de un millón, "¡casi la B!", la C gana con confeti… final falso: "Pará, falta la D" ($64.000).
// Voces: conductor Fenrir + concursante Orus (guiones/dialogos/tt-04.json). TODOS los tiempos salen de lo que dura cada voz.

const g = guionSchema.parse({ id: "tt-04", titulo: "¿Cuánto le queda?", duracionSeg: 30, voz: null, ganchos: [{ lineas: ["", "", ""], voz: "" }], lineas: [], sonidos: [] });
const FR = dialogo.frases as Record<string, { dur: number; texto: string }>;
const d = (id: string) => FR[id]?.dur ?? 1.5;
const TEXTO: Record<string, string> = {
  h1: "¡Este kiosco vende un palo por día!", h2: "¿Cuánto le queda? Elegí antes que él.", h3: "¿Seguro?", h4: "¡Uh, casi la B!",
  h5: "Y falta la que nadie cuenta…", h6: "¡La C! ¡Ganaste!", h7: "Pará… falta la D.", h8: "$64.000. Menos de 7 de cada 100.",
  h9: "Hablándole al celular, 20 segundos.", c1: "¡La A! Trescientas lucas.", c2: "¿Y cómo iba a saber?",
};

/** Línea de tiempo atada a las voces: cada frase arranca cuando termina la anterior (o en su momento mínimo). */
function armar() {
  const T: Record<string, number> = {};
  let c = 0.1;
  const at = (id: string, min = 0) => { const s = Math.max(min, c); T[id] = s; c = s + d(id) + 0.12; return s; };
  at("h1", 0.1);
  T.pregunta = Math.max(2.2, T.h1 + d("h1") - 0.2);
  at("h2", T.pregunta + 0.15);
  T.opciones = T.pregunta + 0.25;
  T.buzzer = T.h2 + d("h2") + 0.1;
  at("c1", T.buzzer + 0.15);
  at("h3");
  T.b1 = c + 0.05; T.b2 = T.b1 + 1.15; T.b3 = T.b2 + 1.15;
  at("h4", T.b3 + 0.45);
  at("h5");
  T.b4 = c + 0.05; T.b5 = T.b4 + 1.0; T.b6 = T.b5 + 0.9;
  T.confeti = T.b6 + 0.35;
  at("h6", T.b6 + 0.3);
  T.scratch = c + 0.15;
  at("h7", T.scratch + 0.1);
  T.despega = T.h7 + d("h7") * 0.55;
  T.b7 = T.h7 + d("h7") + 0.15;
  at("h8", T.b7 + 0.55);
  T.monedas = T.h8 + 0.6;
  at("c2");
  T.app = T.c2 + 0.2;
  at("h9");
  T.cierre = c + 0.2;
  T.fin = T.cierre + 2.8;
  return T;
}
const T = armar();
export const DUR_TT04 = T.fin;
const LOOP = T.fin - 0.27;
const VOCES = ["h1", "h2", "c1", "h3", "h4", "h5", "h6", "h7", "h8", "c2", "h9"];

const ROJO = "#ff3b30", AMARILLO = "#ffcc00", VERDE = "#34c759", AZUL = "#1a237e";
const GASTOS: [number, number, string][] = [
  [T.b1, 700000, "MERCADERÍA"], [T.b2, 24000, "COMISIONES QR Y TARJETA"], [T.b3, 93000, "ALQUILER, LUZ Y EMPLEADO"],
  [T.b4, 49000, "REPONER 7% MÁS CARO"], [T.b5, 20000, "FIADO"], [T.b6, 15000, "VENCIDOS"], [T.b7, 35000, "LO QUE SACÁS PARA LA CASA"],
];
const valor = (t: number) => 1000000 - GASTOS.reduce((s, [a, m]) => s + m * entra((t - a) / 0.35), 0);
const fmt = (v: number) => "$" + (Math.round(v / 1000) * 1000).toLocaleString("es-AR");

// ---------- escenario ----------
const Escenario: React.FC<{ t: number; oscuro: number; fiesta: number }> = ({ t, oscuro, fiesta }) => (
  <div style={{ inset: 0 }}>
    <div style={{ inset: 0, background: `radial-gradient(circle at 50% 30%, #3949ab, ${AZUL} 55%, #0a0f3d)` }} />
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ left: 180 - 300, top: -120, width: 600, height: 900, transformOrigin: "50% 0", transform: `rotate(${Math.sin(t * (0.9 + i * 0.3) + i * 2) * 28}deg)`, background: `conic-gradient(from 170deg at 50% 0, #0000 0deg, ${i === 1 ? "#fff6" : "#90caf955"} 8deg, #0000 16deg)`, opacity: 1 - oscuro }} />
    ))}
    {/* foquitos alrededor */}
    {Array.from({ length: 28 }, (_, i) => {
      const lado = i < 14 ? 0 : 1, k = i % 14;
      const on = Math.sin(t * (fiesta > 0 ? 14 : 5) + i * 0.9) > 0;
      return <div key={i} style={{ left: lado ? 344 : 8, top: 30 + k * 44, width: 9, height: 9, borderRadius: 5, background: on ? "#ffe082" : "#5d4037", boxShadow: on ? "0 0 10px #ffd54f" : "none", opacity: 1 - oscuro * 0.7 }} />;
    })}
    {oscuro > 0 ? <div style={{ inset: 0, background: `radial-gradient(circle at 50% 38%, #0000 14%, #000e 42%)`, opacity: oscuro }} /> : null}
  </div>
);

/** Pila de billetes proporcional a lo que queda. */
const Pila: React.FC<{ t: number; v: number }> = ({ t, v }) => {
  const n = Math.max(1, Math.round((v / 1000000) * 26));
  return (
    <div style={{ left: 100, top: 180, width: 160, height: 170 }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} style={{ left: 10 + Math.sin(i * 1.7) * 6, bottom: i * 6, width: 140, height: 22, borderRadius: 4, background: i % 2 ? "#7cc79a" : "#6bb88b", border: "2px solid #1e5631", transform: `rotate(${Math.sin(i * 2.3) * 3}deg)` }}>
          <div style={{ left: 60, top: 3, width: 14, height: 14, borderRadius: 7, background: "#1e5631aa" }} />
        </div>
      ))}
      <div style={{ left: 0, right: 0, bottom: -12, height: 12, borderRadius: 6, background: "#0006", transform: `scaleX(${0.8 + 0.2 * Math.sin(t * 3)})` }} />
    </div>
  );
};

/** Monstruo que entra, muerde la pila y se va con el cartel del gasto. */
const Mordida: React.FC<{ t: number; a: number; monto: number; nombre: string; i: number }> = ({ t, a, monto, nombre, i }) => {
  const dd = t - a + 0.35;
  if (dd < 0 || dd > 1.25) return null;
  const lado = i % 2 ? 1 : -1;
  const entra2 = entra(dd / 0.3);
  const sale = clamp((dd - 0.85) / 0.4, 0, 1);
  const x = 180 + lado * (230 - 140 * entra2 + 260 * sale) - 45;
  const boca = Math.abs(Math.sin(dd * 26)) * (dd > 0.3 && dd < 0.8 ? 1 : 0.2);
  const color = ["#e53935", "#8e24aa", "#fb8c00", "#d81b60", "#6d4c41", "#43a047", "#c62828"][i];
  return (
    <>
      <div style={{ left: x, top: 230, transform: `scaleX(${-lado}) rotate(${Math.sin(dd * 20) * 6}deg)` }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="40" fill={color} stroke="#000" strokeWidth="4" />
          <circle cx="32" cy="30" r="9" fill="#fff" /><circle cx="34" cy="31" r="4" fill="#000" />
          <path d={`M30 ${52 - boca * 6} L84 ${48 - boca * 14} L84 ${56 + boca * 14} L30 ${58 + boca * 6} Z`} fill="#300" stroke="#000" strokeWidth="3" />
          {[0, 1, 2, 3].map((k) => <path key={k} d={`M${40 + k * 11} ${50 - boca * 7} l5 7 l5 -7`} fill="#fff" />)}
        </svg>
      </div>
      <div style={{ left: 0, right: 0, top: 150 - dd * 12, textAlign: "center", opacity: Math.min(1, dd * 6) * (1 - sale), transform: `scale(${sp(dd - 0.25, 1.15)})` }}>
        <span style={{ position: "static", display: "inline-block", padding: "4px 10px", borderRadius: 8, background: "#fff", border: `3px solid ${ROJO}`, font: `900 14px ${BODY}`, color: C.tinta }}>{nombre} <span style={{ position: "static", color: ROJO }}>−{fmt(monto)}</span></span>
      </div>
    </>
  );
};

type Estado = "nada" | "elegida" | "casi" | "mal" | "bien" | "tapada";
const Opcion: React.FC<{ t: number; letra: string; texto: string; estado: Estado; x: number; y: number; entra0: number; despega?: number }> = ({ t, letra, texto, estado, x, y, entra0, despega = 0 }) => {
  if (t < entra0) return null;
  const s = sp(t - entra0, 1.1, 16, 0.5);
  const fondo = estado === "bien" ? VERDE : estado === "mal" ? "#4a1414" : estado === "elegida" ? AMARILLO : estado === "casi" ? "#ff9800" : "#283593";
  const color = estado === "elegida" || estado === "casi" ? C.tinta : "#fff";
  const pulso = estado === "bien" || estado === "casi" ? latido(t, 0.3, 0.07) : 1;
  return (
    <div style={{ left: x, top: y, width: 158, height: 46, transform: `scale(${s * pulso}) skewX(-6deg)` }}>
      <div style={{ inset: 0, borderRadius: 12, background: fondo, border: "3px solid #ffd54f", boxShadow: estado === "bien" ? `0 0 24px ${VERDE}` : "0 4px 0 #000a" }} />
      <div style={{ left: 10, top: 9, font: `900 22px ${DISP}`, color: estado === "elegida" || estado === "casi" ? C.tinta : AMARILLO }}>{letra}</div>
      <div style={{ left: 36, top: 10, font: `900 21px ${DISP}`, color, fontVariantNumeric: "tabular-nums" }}>{texto}</div>
      {estado === "mal" ? <svg width="158" height="46" viewBox="0 0 158 46" style={{ left: 0, top: 0 }}><path d="M10 6 L148 40 M148 6 L10 40" stroke={ROJO} strokeWidth="6" strokeLinecap="round" /></svg> : null}
      {estado === "tapada" || despega > 0 ? (
        <div style={{ inset: 0, borderRadius: 12, background: "repeating-linear-gradient(45deg, #ffcc00 0 12px, #222 12px 24px)", transformOrigin: "100% 0", transform: `rotate(${despega * 70}deg) translate(${despega * 60}px, ${-despega * 30}px)`, opacity: 1 - despega, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ position: "static", background: "#000", color: AMARILLO, padding: "2px 6px", font: `900 11px ${BODY}` }}>D · SE REVELA AL FINAL</span>
        </div>
      ) : null}
    </div>
  );
};

/** El concursante (kiosquero con delantal) en su atril con el pulsador. */
const Concursante: React.FC<{ t: number; cara: "canchero" | "preocupado" | "feliz" | "shock" }> = ({ t, cara }) => {
  const sudor = cara === "preocupado" || cara === "shock";
  const boca = cara === "canchero" ? "M38 64 Q52 72 66 60" : cara === "preocupado" ? "M40 68 Q52 62 64 68" : cara === "feliz" ? "M36 60 Q52 80 68 60" : "M44 62 Q52 80 60 62 Q52 58 44 62";
  return (
    <svg width="130" height="170" viewBox="0 0 104 136" style={{ overflow: "visible" }}>
      <path d="M8 136 Q12 88 52 82 Q92 88 96 136 Z" fill="#fff" stroke="#333" strokeWidth="3" />
      <path d="M30 96 L74 96 L72 136 L32 136 Z" fill={ROJO} />
      <circle cx="52" cy="50" r="32" fill="#e6b08c" stroke="#5a3520" strokeWidth="3" />
      <path d="M22 42 Q24 14 52 16 Q80 14 82 42 Q66 30 22 42Z" fill="#555" />
      <ellipse cx="40" cy="50" rx={cara === "shock" ? 6 : 4} ry={cara === "shock" ? 7 : 5} fill="#111" />
      <ellipse cx="64" cy="50" rx={cara === "shock" ? 6 : 4} ry={cara === "shock" ? 7 : 5} fill="#111" />
      {cara === "canchero" ? <path d="M32 40 L46 43 M58 43 L72 38" stroke="#111" strokeWidth="3" /> : null}
      <path d={boca} stroke="#5a2410" strokeWidth="3.5" fill={cara === "shock" ? "#300" : "none"} strokeLinecap="round" />
      {sudor ? <path d={`M80 ${34 + ((t * 30) % 20)} q4 6 0 9 q-4 -3 0 -9z`} fill="#4fc3f7" /> : null}
    </svg>
  );
};

const Confeti: React.FC<{ t: number; desde: number }> = ({ t, desde }) => {
  const dd = t - desde;
  if (dd < 0) return null;
  return (
    <>
      {Array.from({ length: 46 }, (_, i) => {
        const x = (i * 37) % 360, vy = 120 + (i % 7) * 30;
        const y = -20 + dd * vy + Math.sin(dd * 3 + i) * 10;
        return <div key={i} style={{ left: x + Math.sin(dd * 4 + i) * 14, top: y, width: 7, height: 12, background: ["#ffcc00", "#ff3b30", "#34c759", "#4fc3f7", "#e040fb"][i % 5], transform: `rotate(${dd * 400 + i * 30}deg)` }} />;
      })}
    </>
  );
};

/** 100 monedas: se van volando 93, quedan 7. */
const Monedas: React.FC<{ t: number }> = ({ t }) => {
  const dd = t - T.monedas;
  if (dd < 0) return null;
  return (
    <div style={{ left: 60, top: 175, width: 240, height: 180 }}>
      {Array.from({ length: 100 }, (_, i) => {
        const fila = Math.floor(i / 10), col = i % 10;
        const queda = i >= 93;
        const k = queda ? 0 : clamp((dd - 0.25 - (i % 23) * 0.025) / 0.6, 0, 1);
        return <div key={i} style={{ left: col * 24 + (k * (col - 4.5) * 40), top: fila * 17 - k * 260, width: 18, height: 14, borderRadius: 7, background: queda ? AMARILLO : "#c9a227", border: "2px solid #7a5a00", opacity: 1 - k, transform: `scale(${queda ? 1 + 0.15 * Math.sin(t * 8) : 1})` }} />;
      })}
    </div>
  );
};

export const JuegoCuantoQueda: React.FC<VideoProps> = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const loop = t >= LOOP;
  const tw = loop ? 0 : t;
  const v = valor(tw);
  const freeze = tw >= T.scratch && tw < T.h7 + 0.4;
  const oscuro = tw >= T.h5 && tw < T.b4 + 0.2 ? entra((tw - T.h5) / 0.3) * (1 - clamp((tw - T.b4) / 0.2, 0, 1)) : 0;
  const fiesta = tw >= T.confeti && tw < T.scratch ? 1 : 0;
  const enApp = tw >= T.app && tw < T.cierre;

  const est = (l: string): Estado => {
    if (l === "A") return tw >= T.b2 + 0.2 ? "mal" : tw >= T.buzzer ? "elegida" : "nada";
    if (l === "B") return tw >= T.b4 + 0.2 ? "mal" : tw >= T.b3 + 0.3 ? "casi" : "nada";
    if (l === "C") return tw >= T.b7 + 0.2 ? "mal" : tw >= T.b6 + 0.25 ? "bien" : "nada";
    return tw >= T.b7 + 0.35 ? "bien" : "tapada";
  };
  const cara = tw < T.b2 ? "canchero" : tw < T.b6 + 0.25 ? "preocupado" : tw < T.scratch ? "feliz" : "shock";

  const beats = [0.02, T.pregunta, T.opciones, T.opciones + 0.3, T.opciones + 0.6, T.buzzer, T.h3, ...GASTOS.map(([a]) => a), T.h4, T.h5, T.confeti, T.scratch, T.despega, T.h8, T.monedas, T.c2, T.app, T.h9, T.cierre];
  const cam: Cam2D = freeze ? { z: 1.06, rot: -2, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : beats, loop ? [] : [T.app, T.cierre], 0.9);
  const hs = loop ? 0 : temblor(t, [[0.02, 9], [T.buzzer, 8], ...GASTOS.map(([a], i) => [a, i === 0 ? 14 : i === 6 ? 16 : 8] as [number, number]), [T.scratch, 12]]);
  let wf = 0;
  if (!loop) [[0.02, 0.35], [T.confeti, 0.3], [T.b7, 0.35]].forEach(([a, f]) => { const dd = t - a; if (dd >= 0 && dd < 0.15) wf += f * (1 - dd / 0.15); });

  // ---------- sonido ----------
  const archivos = getStaticFiles().map((f) => f.name);
  const tic = (a: number, b: number, c: number, vol: number) => Array.from({ length: Math.max(0, Math.floor((b - a) / c)) }, (_, i) => ({ en: a + i * c, sfx: "tic", vol }));
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "slam", vol: 0.6 }, { en: 0.02, sfx: "coins", vol: 0.5 },
    { en: T.pregunta, sfx: "riser", vol: 0.4 }, ...[0, 0.3, 0.6, 0.9].map((dd) => ({ en: T.opciones + dd, sfx: "whoosh", vol: 0.35 })),
    ...tic(T.opciones + 0.9, T.buzzer, 0.5, 0.35), { en: T.buzzer, sfx: "buzz", vol: 0.5 }, { en: T.buzzer + 0.05, sfx: "ding", vol: 0.5 },
    ...tic(T.h3, T.b1, 0.12, 0.3),
    ...GASTOS.flatMap(([a], i) => [{ en: a - 0.2, sfx: "whoosh", vol: 0.3 }, { en: a, sfx: i === 6 ? "slam" : "cajon", vol: 0.55 }, { en: a + 0.05, sfx: "thump", vol: 0.5 }, { en: a + 0.15, sfx: "coins", vol: 0.35 }]),
    { en: T.b2 + 0.2, sfx: "glitch", vol: 0.45 }, { en: T.b3 + 0.3, sfx: "heart", vol: 0.5 }, { en: T.b4 + 0.2, sfx: "glitch", vol: 0.45 },
    { en: T.h5, sfx: "piano_grave", vol: 0.5 }, { en: T.b4 - 0.3, sfx: "riser", vol: 0.3 },
    { en: T.confeti, sfx: "ding", vol: 0.6 }, { en: T.confeti + 0.05, sfx: "ukelele", vol: 0.45 },
    { en: T.scratch, sfx: "rebobinado", vol: 0.7 }, { en: T.despega, sfx: "cinta_larga", vol: 0.5 },
    { en: T.b7 + 0.2, sfx: "glitch", vol: 0.5 }, { en: T.b7 + 0.35, sfx: "sello", vol: 0.6 },
    { en: T.monedas + 0.25, sfx: "coins", vol: 0.5 }, { en: T.monedas + 0.5, sfx: "whoosh", vol: 0.4 },
    { en: T.app, sfx: "click", vol: 0.45 }, { en: T.app + 0.8, sfx: "ding", vol: 0.45 }, { en: T.cierre, sfx: "slam", vol: 0.45 },
  ];
  const musica = (
    <>
      {VOCES.filter((id) => archivos.includes(`voces/tt-04/${id}.mp3`)).map((id) => (
        <Sequence key={id} from={Math.round(T[id] * fps)} durationInFrames={Math.round(4 * fps)} layout="none">
          <Html5Audio src={staticFile(`voces/tt-04/${id}.mp3`)} volume={1} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={Math.round(T.scratch * fps)} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} loop volume={(f) => 0.1 * Math.min(1, Math.max(0, T.scratch * fps - f) / 3)} />
      </Sequence>
      <Sequence from={Math.round((T.b7 + 0.2) * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round((T.b7 + 0.2) * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} loop volume={(f) => 0.1 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // ---------- escena ----------
  const hablando = VOCES.find((id) => tw >= T[id] && tw < T[id] + d(id) + 0.1);
  const escena = enApp ? (
    <>
      <div style={{ inset: 0, background: `radial-gradient(circle at 50% 45%, #1e6b46, ${C.verde} 70%)` }} />
      <Celular t={tw} sp={sp(tw - T.app, 1.04, 13, 0.55)} left={85} top={130}>
        <Sequence from={Math.round(T.app * fps)} layout="none">
          <OffthreadVideo src={staticFile("tomas/fb-01/app.mp4")} startFrom={Math.round(11.2 * 30)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} />
        </Sequence>
      </Celular>
    </>
  ) : (
    <>
      <Escenario t={tw} oscuro={oscuro} fiesta={fiesta} />
      {tw < T.monedas ? <Pila t={tw} v={v} /> : <Monedas t={tw} />}
      {GASTOS.map(([a, m, n], i) => <Mordida key={i} t={tw} a={a} monto={m} nombre={n} i={i} />)}
      {[["A", "$300.000"], ["B", "$180.000"], ["C", "$99.000"], ["D", "$64.000"]].map(([l, tx], i) => (
        <Opcion key={l} t={tw} letra={l} texto={tx} estado={est(l)} x={i % 2 ? 186 : 16} y={372 + Math.floor(i / 2) * 56} entra0={T.opciones + i * 0.3} despega={l === "D" ? entra((tw - T.despega) / 0.5) : 0} />
      ))}
      <div style={{ left: -6, top: 486, transform: `translateY(${Math.sin(tw * 2) * 2}px)` }}><Concursante t={tw} cara={cara} /></div>
      {/* atril con el pulsador */}
      <div style={{ left: 8, top: 600, width: 120, height: 40, background: "#283593", border: "3px solid #ffd54f", borderRadius: 8 }}>
        <div style={{ left: 42, top: -14, width: 34, height: 18, borderRadius: "18px 18px 4px 4px", background: tw >= T.buzzer && tw < T.buzzer + 0.3 ? "#ff8a80" : ROJO, border: "2px solid #000" }} />
      </div>
      <Confeti t={tw} desde={T.confeti} />
      {freeze ? <div style={{ inset: 0, background: "#000", opacity: 0.45 }} /> : null}
    </>
  );

  // ---------- textos ----------
  const contador = !enApp && tw < T.monedas + 0.2;
  const frente = (
    <>
      <div style={{ left: 0, right: 0, top: 8, textAlign: "center", font: `900 11px ${BODY}`, color: AMARILLO, letterSpacing: ".14em", opacity: enApp ? 0 : 1 }}>CUÁNTO GANA UN KIOSCO</div>
      {contador ? (
        <div style={{ left: 0, right: 0, top: 28, textAlign: "center", transform: `scale(${(tw < 0.25 ? 1.2 - tw * 0.8 : 1) * latido(tw, 0.5, 0.03)})` }}>
          <span style={{ position: "static", display: "inline-block", padding: "2px 14px", borderRadius: 12, background: "#000c", border: `3px solid ${v < 300000 ? ROJO : AMARILLO}`, font: `900 46px ${DISP}`, color: v < 300000 ? "#ff6b6b" : "#7cf2a8", fontVariantNumeric: "tabular-nums", textShadow: "0 3px 0 #000" }}>{fmt(v)}</span>
        </div>
      ) : null}
      {!enApp && tw >= T.pregunta && tw < T.b1 ? (
        <div style={{ left: 0, right: 0, top: 90, textAlign: "center", transform: `scale(${sp(tw - T.pregunta, 1.15)}) rotate(-2deg)` }}>
          <span style={{ position: "static", display: "inline-block", padding: "5px 14px", borderRadius: 10, background: AMARILLO, color: C.tinta, font: `900 28px ${DISP}`, boxShadow: "0 5px 0 #000" }}>¿CUÁNTO LE QUEDA?</span>
        </div>
      ) : null}
      {!enApp && tw >= T.opciones + 1.2 && tw < T.buzzer ? (
        <div style={{ left: 0, right: 0, top: 152, textAlign: "center", font: `900 15px ${BODY}`, color: "#fff", textShadow: "0 2px 0 #000", opacity: Math.sin(tw * 8) > -0.3 ? 1 : 0.4 }}>⏸ PAUSÁ Y ELEGÍ ANTES QUE ÉL · {Math.max(1, Math.ceil(T.buzzer - tw))}</div>
      ) : null}
      {tw >= T.buzzer && tw < T.b1 ? (
        <div style={{ left: 0, right: 0, top: 148, textAlign: "center", transform: `scale(${sp(tw - T.buzzer, 1.15)})` }}>
          <span style={{ position: "static", display: "inline-block", padding: "3px 10px", borderRadius: 8, background: AMARILLO, color: C.tinta, font: `900 15px ${BODY}` }}>RESPUESTA FINAL: A</span>
        </div>
      ) : null}
      {fiesta ? (
        <div style={{ left: 0, right: 0, top: 112, textAlign: "center", transform: `scale(${sp(tw - T.confeti, 1.2) * latido(tw, 0.3, 0.05)}) rotate(-4deg)` }}>
          <span style={{ position: "static", display: "inline-block", padding: "6px 16px", borderRadius: 12, background: VERDE, color: "#fff", font: `900 32px ${DISP}`, boxShadow: "0 5px 0 #000" }}>¡GANASTE!</span>
        </div>
      ) : null}
      {freeze ? (
        <>
          <div style={{ left: 16, top: 112, font: `900 16px ${BODY}`, color: "#fff", opacity: Math.sin(t * 10) > 0 ? 1 : 0.3 }}>❚❚ PARÁ</div>
          <div style={{ left: 0, right: 0, top: 140, textAlign: "center", transform: `scale(${sp(tw - T.scratch - 0.1, 1.15)})` }}>
            <span style={{ position: "static", font: `900 38px ${DISP}`, color: AMARILLO, textShadow: "0 4px 0 #000" }}>FALTA LA D…</span>
          </div>
        </>
      ) : null}
      {tw >= T.monedas && tw < T.app ? (
        <div style={{ left: 0, right: 0, top: 112, textAlign: "center", transform: `scale(${sp(tw - T.monedas - 0.6, 1.15)})` }}>
          <span style={{ position: "static", display: "inline-block", padding: "5px 12px", borderRadius: 10, background: ROJO, color: "#fff", font: `900 22px/1.1 ${DISP}`, boxShadow: "0 5px 0 #000" }}>TE QUEDAN 7 DE CADA 100</span>
        </div>
      ) : null}
      {enApp ? (
        <div style={{ left: 0, right: 0, top: 46, textAlign: "center", transform: `scale(${sp(tw - T.app, 1.1)}) rotate(-2deg)` }}>
          <span style={{ position: "static", display: "inline-block", padding: "6px 14px", borderRadius: 10, background: AMARILLO, color: C.tinta, font: `900 21px/1.1 ${DISP}`, boxShadow: "0 5px 0 #000" }}>LE CONTÁS EL DÍA HABLANDO<br />Y TE DICE CUÁNTO TE QUEDÓ</span>
        </div>
      ) : null}
      {tw >= T.cierre ? (
        <>
          <div style={{ left: 0, right: 0, top: 130, textAlign: "center", transform: `scale(${sp(tw - T.cierre, 1.15) * latido(tw, 0.45, 0.04)}) rotate(-2deg)` }}>
            <span style={{ position: "static", display: "inline-block", padding: "8px 14px", borderRadius: 12, background: ROJO, color: "#fff", font: `900 26px/1.1 ${DISP}`, boxShadow: "0 5px 0 #000" }}>¿QUÉ LETRA ELEGISTE?<br />COMENTALA ↓</span>
          </div>
          <div style={{ left: 20, right: 20, top: 240, textAlign: "center", transform: `scale(${sp(tw - T.cierre - 0.7, 1.12)})` }}>
            <span style={{ position: "static", display: "inline-block", padding: "6px 12px", borderRadius: 10, background: "#fff", color: C.tinta, font: `900 17px/1.15 ${BODY}`, boxShadow: "0 4px 0 #000" }}>Mandáselo al que eligió la C</span>
          </div>
          <div style={{ left: 0, right: 0, top: 604, textAlign: "center", font: `800 13px ${BODY}`, color: "#fff" }}>En Claro · link en el perfil</div>
        </>
      ) : null}
      {/* lo que se dice (para los que miran sin sonido) */}
      {hablando && !loop ? (
        <div style={{ left: 16, right: 16, top: enApp ? 552 : 318, textAlign: "center", transform: `scale(${sp(tw - T[hablando], 1.08, 18, 0.5)})` }}>
          <span style={{ position: "static", display: "inline-block", padding: "6px 12px", borderRadius: 12, background: hablando.startsWith("c") ? "#fff" : "#000d", border: `2px solid ${hablando.startsWith("c") ? ROJO : AMARILLO}`, font: `900 18px/1.15 ${DISP}`, color: hablando.startsWith("c") ? C.tinta : "#fff" }}>
            <span style={{ position: "static", font: `900 11px ${BODY}`, color: hablando.startsWith("c") ? ROJO : AMARILLO, marginRight: 6, letterSpacing: ".08em" }}>{hablando.startsWith("c") ? "ÉL:" : "CONDUCTOR:"}</span>{TEXTO[hablando]}
          </span>
        </div>
      ) : null}
    </>
  );

  return (
    <Marco
      g={g} voz={null} pal={[]} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={loop ? [] : sonidos} ocultos={[]}
      fondo={escena}
      frente={frente}
      sobre={musica}
      filtro={freeze ? "saturate(0.2) contrast(1.1)" : undefined}
    />
  );
};
