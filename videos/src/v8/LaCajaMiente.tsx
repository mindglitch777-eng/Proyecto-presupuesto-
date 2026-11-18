import React from "react";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, eIO, rnd } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V8_03, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { AppGrabada, Billetes, Cartel, Etiqueta, Fondo, Numero, Probalo, Rotulo, aPantalla, conSigno, entra, latido, mezcla, ritmo, sp } from "./comun";
import { C, CajaDeposito, CajaRegistradora, Camion, Kiosco, PersianaLuz, Reloj } from "./iconos";

// V8-03 "La caja llena miente" (videos/guiones/V8-03-LA-CAJA-MIENTE.md). Un día del kiosco con el reloj corriendo:
// ENTRÓ sube sin parar y ES TUYO (lo que entró menos lo que no es tuyo) termina en −$64.900. Máximo 2 textos + subtítulo.

const g = GUION_V8_03;
const ENTRO = 210000, PROVEEDOR = 140000, QR = 3600, FIJOS = 36300, DORMIDO = 95000;
const TUYO = ENTRO - PROVEEDOR - QR - FIJOS; // 30.100
const FINAL = TUYO - DORMIDO; // −64.900
// grabación real de la app (app/scripts/grabar-v8.cjs v8-03 → public/tomas/v8-03/app.json)
const APP = { tarjeta: 3.578, deposito: 4.365, fin: 7.674 };
// Silencio medido en la toma de voz (silencedetect): "La caja llena…" arranca en 22,975 s (whisper la marca antes).
const REVELA_MEDIDO: [number, number] = [40.559, 22.975];

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  const T = {
    l, e, dur,
    perdi: w(0, "perdí", 3.1),
    siete: w(2, "siete", l[2]), abro: w(2, "abro", l[2] + 0.3), ocho: w(2, "ocho", l[2] + 1.5), proveedor: w(2, "proveedor", l[2] + 2.5), cuarenta: w(2, "cuarenta", l[2] + 3.5),
    noche: w(3, "noche", l[3] + 1), todos: w(3, "todos", l[3] + 2),
    qr: w(4, "qr", l[4] + 0.6), gastos: w(4, "gastos", l[4] + 1.4),
    repuse: w(5, "repuse", l[5] + 0.6), noventa: w(5, "noventa", l[5] + 1.1), meses: w(5, "meses", l[5] + 3.3),
    revela: Math.abs(dur - REVELA_MEDIDO[0]) < 0.05 ? REVELA_MEDIDO[1] : l[6],
    mitad: w(6, "mitad", l[6] + 2.5), dormido: w(6, "dormido", l[6] + 5.1),
    tuyo: w(7, "tuyo", l[7] + 2.5), dormida: w(7, "dormida", e[7] - 0.6),
    probalo: w(8, "probalo", l[8] + 2),
    LOOP: dur - 0.27,
    app0: 0,
  };
  T.app0 = T.dormida - APP.deposito;
  return T;
}
type T = ReturnType<typeof tiempos>;

type Esc = "gancho" | "dia" | "regancho" | "gastos" | "deposito" | "silencio" | "partida" | "truco" | "cierre";
function escena(t: number, T: T): Esc {
  if (t >= T.LOOP) return "gancho";
  const { l, e } = T;
  if (t < l[1] - 0.05) return "gancho";
  if (t < l[3] - 0.05) return "dia";
  if (t < l[4] - 0.05) return "regancho";
  if (t < l[5] - 0.05) return "gastos";
  if (t < Math.min(e[5] + 0.12, T.revela - 0.35)) return "deposito";
  if (t < T.revela - 0.03) return "silencio";
  if (t < l[7] - 0.05) return "partida";
  if (t < l[8] - 0.05) return "truco";
  return "cierre";
}

/** Hora del reloj: 7:00 al empezar el día, 8:15 cuando llega el proveedor, gira hasta las 20:00 y ahí se frena. */
function hora(t: number, T: T) {
  if (t < T.siete) return 7;
  if (t < T.proveedor) return 7 + 1.25 * eIO(clamp((t - T.siete) / Math.max(0.3, T.proveedor - T.siete), 0, 1));
  return 8.25 + 11.75 * eIO(clamp((t - T.cuarenta - 0.4) / Math.max(0.4, T.l[3] - T.cuarenta - 0.5), 0, 1));
}
/** Lo que entró a la caja: sube con la hora. */
const entro = (t: number, T: T) => (t < T.abro ? 0 : ENTRO * clamp((hora(t, T) - 7) / 13, 0, 1));
const restas = (T: T) => [
  { en: T.cuarenta, m: PROVEEDOR }, { en: T.qr, m: QR }, { en: T.gastos, m: FIJOS }, { en: T.noventa, m: DORMIDO },
];
const tuyo = (t: number, T: T) => entro(t, T) - restas(T).reduce((s, r) => s + r.m * entra((t - r.en) / 0.45), 0);
const colorTuyo = (v: number) => (v >= 0 ? C.hoja : C.rojo);

/** Los dos contadores de arriba: ENTRÓ (verde) y ES TUYO (verde o rojo). */
const Contadores: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const vT = tuyo(t, T);
  const pasos = restas(T).map((r) => ({ en: r.en, a: 0 }));
  return (
    <>
      <div style={{ left: 8, width: 168, top: 64, height: 86, borderRadius: 16, background: "#ffffffd9", border: `3px solid ${C.hoja}` }} />
      <div style={{ left: 184, width: 168, top: 64, height: 86, borderRadius: 16, background: "#ffffffd9", border: `3px solid ${colorTuyo(vT)}` }} />
      <Etiqueta texto="ENTRÓ" top={72} left={8} right={184} fondo={C.hoja} size={15} />
      <Etiqueta texto="ES TUYO" top={72} left={184} right={8} fondo={colorTuyo(vT)} size={15} />
      <Numero t={t} v={entro(t, T)} top={104} size={30} color={C.verde} left={8} right={184} />
      <Numero t={t} v={vT} pasos={pasos} top={104} size={30} color={colorTuyo(vT)} left={184} right={8} />
    </>
  );
};

/** Cartel de QR dibujado (sin marcas). */
const CartelQR: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={w * 1.2} viewBox="0 0 100 120">
    <rect x="4" y="4" width="92" height="112" rx="8" fill="#fff" stroke={C.tinta} strokeWidth="5" />
    <rect x="4" y="4" width="92" height="24" rx="8" fill={C.hoja} stroke={C.tinta} strokeWidth="5" />
    <text x="50" y="22" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize="15" fill="#fff">PAGÁ CON QR</text>
    {Array.from({ length: 49 }, (_, i) => (rnd(i * 3 + 1) > 0.5 || [0, 6, 42].includes(i) ? <rect key={i} x={18 + (i % 7) * 9.4} y={38 + Math.floor(i / 7) * 9.4} width="8.6" height="8.6" fill={C.tinta} /> : null))}
  </svg>
);

/** Silueta plana de un cliente que entra al kiosco. */
const Silueta: React.FC<{ k: number; i: number }> = ({ k, i }) => {
  const x = -40 + k * 260, alto = 64 + (i % 3) * 8;
  return (
    <div style={{ left: x, top: 470 - alto, opacity: k > 0.9 ? (1 - k) * 10 : 1 }}>
      <svg width={34} height={alto} viewBox={`0 0 34 ${alto}`}>
        <circle cx="17" cy="11" r="10" fill="#2c3e35" />
        <path d={`M3 ${alto} q0 -${alto - 22} 14 -${alto - 22} q14 0 14 ${alto - 22} z`} fill={["#2c3e35", "#41584c", "#364a40"][i % 3]} />
      </svg>
    </div>
  );
};

const Gancho: React.FC<{ tg: number; hasta: number }> = ({ tg, hasta }) => {
  const golpe = (1 + 0.14 * Math.exp(-7 * tg) * Math.cos(tg * 22)) * latido(tg, 0.62, 0.04);
  return (
    <div style={{ inset: 0 }}>
      <div style={{ left: 30, top: 226, filter: "brightness(0.85)", transform: `scale(${1 + tg * 0.02})`, transformOrigin: "50% 100%" }}><Kiosco w={300} t={tg} persiana={0.5} /></div>
      <div style={{ left: 64, top: 336, transform: `scale(${golpe}) rotate(${-2 + Math.sin(tg * 1.6) * 0.8}deg)`, transformOrigin: "50% 70%" }}><CajaRegistradora w={232} t={tg} /></div>
      {/* la plata que entra a la caja */}
      <Billetes t={tg} desde={0.5} hasta={hasta} x0={-40} y0={330} x1={170} y1={470} cada={0.24} alto={80} />
      <div style={{ left: 0, right: 0, top: 78, textAlign: "center", transform: `scale(${golpe})` }}>
        <div style={{ position: "static", font: `800 22px/1.1 ${BODY}`, color: C.tinta, letterSpacing: ".04em" }}>CAJA DE HOY</div>
        <div style={{ position: "static", font: `800 62px/1.02 ${DISP}`, color: C.hoja, letterSpacing: "-.03em" }}>{ars(ENTRO)}</div>
      </div>
      <Cartel texto="…Y PERDÍ PLATA" top={172} s={Math.min(1.1, 0.75 + sp(tg + 0.12, 1.1, 15, 0.45) * 0.25) * latido(tg + 0.31, 0.62, 0.05)} rot={-3 + Math.sin(tg * 4.4) * 1.6} size={28} />
    </div>
  );
};

/** La caja de $210.000 partida en bloques: proveedor, gastos y lo tuyo; después cae lo dormido y aplasta lo tuyo. */
const Partida: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const k = 240 / ENTRO; // px por peso
  const base = 470, x = 106, w = 148;
  const pProv = entra((t - (T.mitad - 0.1)) / 0.3), pRest = entra((t - (T.mitad + 0.35)) / 0.3), pDorm = entra((t - (T.dormido - 0.05)) / 0.4);
  const hProv = PROVEEDOR * k, hGas = (QR + FIJOS) * k, hTuyo = TUYO * k, hDorm = DORMIDO * k;
  const bloque = (y: number, h: number, color: string, p: number, icono?: React.ReactNode) => (
    <div style={{ left: x, width: w, top: y, height: h, borderRadius: 8, background: color, border: `3px solid ${C.tinta}`, opacity: Math.min(1, p * 1.4), transform: `translateX(${(1 - p) * 220}px)`, overflow: "hidden" }}>
      {icono ? <div style={{ left: 0, right: 0, top: Math.max(0, h / 2 - 22), display: "flex", justifyContent: "center" }}>{icono}</div> : null}
    </div>
  );
  // al caer lo dormido, lo tuyo se aplasta y queda un hueco rojo por arriba de la caja
  const yTuyo = base - hProv - hGas - hTuyo;
  const label = t < T.mitad - 0.1 ? { txt: `TU CAJA: ${ars(ENTRO)}`, c: C.hoja } : t < T.mitad + 0.35 ? { txt: `PROVEEDOR ${ars(PROVEEDOR)}`, c: C.tinta } : t < T.dormido - 0.05 ? { txt: `TUYO: ${ars(TUYO)}`, c: C.hoja } : { txt: `DORMIDO EN EL DEPÓSITO ${ars(DORMIDO)}`, c: C.rojo };
  return (
    <div style={{ inset: 0 }}>
      <Cartel texto={label.txt} top={70} fondo={label.c} color="#fff" size={label.txt.length > 22 ? 17 : 22} s={latido(t, 0.6, 0.03)} rot={-1.5} />
      {/* contorno de la caja ($210.000) */}
      <div style={{ left: x - 8, width: w + 16, top: base - 240 - 8, height: 256, borderRadius: 14, border: `4px dashed ${C.tinta}55` }} />
      {(() => {
        const llena = entra((t - T.revela) / 0.9);
        return <div style={{ left: x, width: w, top: base - 240 * llena, height: 240 * llena, borderRadius: 8, background: "#bfe3cb", border: `3px solid ${C.tinta}`, opacity: 1 - pProv }} />;
      })()}
      <Billetes t={t} desde={T.revela} hasta={T.mitad - 0.5} x0={-40} y0={200} x1={x + 50} y1={base - 120} cada={0.28} alto={60} />
      {bloque(base - hProv, hProv, "#d9a86c", pProv, <div style={{ transform: "scale(0.9)" }}><Camion w={110} t={t} /></div>)}
      {bloque(base - hProv - hGas, hGas, "#c3c7c0", pRest)}
      {bloque(yTuyo + hTuyo * pDorm, hTuyo * (1 - pDorm), C.hoja, pRest)}
      {pDorm > 0 ? (
        <div style={{ left: x, width: w, top: yTuyo + hTuyo - hDorm * pDorm, height: hDorm, borderRadius: 8, background: "#8a8f88", border: `3px solid ${C.tinta}`, transform: `translateY(${(1 - pDorm) * -200}px)` }}>
          <div style={{ left: 30, top: 34 }}><CajaDeposito w={90} polvo={1} /></div>
        </div>
      ) : null}
      {pDorm > 0.6 ? (
        <>
          <div style={{ left: x - 10, width: w + 20, top: yTuyo + hTuyo - hDorm, height: hDorm - hTuyo, borderRadius: 10, border: `4px solid ${C.rojo}`, background: `${C.rojo}26`, opacity: 0.6 + 0.4 * Math.abs(Math.sin(t * 6)) }} />
          <div style={{ left: 0, right: 0, top: yTuyo + hTuyo - hDorm - 38, textAlign: "center", font: `800 30px ${DISP}`, color: C.rojo, transform: `scale(${latido(t, 0.5, 0.06)})` }}>{conSigno(FINAL)}</div>
        </>
      ) : null}
    </div>
  );
};

export const LaCajaMiente: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, dur);
  const esc = escena(t, T);
  const loop = t >= T.LOOP;
  const tw = loop ? 0 : t;
  const { l, e } = T;
  const h = hora(t, T);

  const beats = [0.03, T.perdi, T.siete, T.ocho, T.proveedor, T.cuarenta + 0.45, T.noche, T.qr + 0.45, T.gastos + 0.45, T.noventa + 0.45, T.revela, T.mitad, T.dormido, T.tuyo, T.dormida, T.probalo];
  const cortes = [l[1], l[3], l[4], l[5], T.revela, l[7], l[8]];
  const cam: Cam2D = esc === "silencio" ? { z: 1.03 + (t - e[5]) * 0.08, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : ritmo(pal, beats, [[Math.min(e[5] + 0.12, T.revela - 0.35), T.revela - 0.02], [T.LOOP - 0.4, 999]]), loop ? [] : cortes, 0.75);
  const hs = loop ? 0 : temblor(t, [[0.03, 9], [T.perdi, 5], [T.cuarenta + 0.45, 8], [T.l[3], 5], [T.noventa + 0.45, 10], [T.dormido, 8]]);
  let wf = 0, red = 0;
  if (!loop) {
    [[T.revela, 0.3]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });
    if (esc === "deposito" && t > T.noventa + 0.4) red = 0.08;
  }

  // fondo: mañana celeste → mediodía cálido → tarde naranja → noche
  const cielo = h < 12 ? mezcla("#dff1fb", "#fff4dc", (h - 7) / 5) : h < 17 ? mezcla("#fff4dc", "#ffd8a8", (h - 12) / 5) : mezcla("#ffd8a8", "#2b3a4f", (h - 17) / 3);
  const fondo = esc === "dia" || esc === "regancho" ? <Fondo t={t} tinte={`radial-gradient(circle at 50% 30%, ${cielo}, ${mezcla(cielo.startsWith("#") ? cielo : "#fff4dc", "#000000", 0)} 80%)`} />
    : esc === "silencio" ? <Fondo t={t} modo="negro" /> : esc === "truco" ? <Fondo t={t} modo="verde" /> : <Fondo t={t} />;

  // ---------- sonido ----------
  const clientes = Array.from({ length: 12 }, (_, i) => T.abro + 0.3 + i * ((l[3] - T.abro - 0.6) / 12)).filter((a) => Math.abs(a - T.cuarenta) > 0.4);
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, { en: 0, sfx: "caja", vol: 0.6 }, { en: 0, sfx: "calle", vol: 0.4 }, { en: T.perdi, sfx: "sello", vol: 0.5 },
    ...cortes.map((a) => ({ en: a - 0.1, sfx: "whoosh", vol: 0.3 })),
    { en: l[1], sfx: "reloj", vol: 0.4 },
    ...clientes.map((a) => ({ en: a, sfx: "ding", vol: 0.22 })),
    { en: T.proveedor - 0.4, sfx: "whoosh", vol: 0.4 }, { en: T.proveedor, sfx: "buzz", vol: 0.35 }, { en: T.cuarenta + 0.45, sfx: "thump", vol: 0.6 },
    { en: l[3], sfx: "rayon", vol: 0.5 }, { en: l[3] + 0.5, sfx: "heart", vol: 0.5 }, { en: l[3] + 1.1, sfx: "heart", vol: 0.5 }, { en: T.todos, sfx: "heart", vol: 0.5 },
    { en: T.qr, sfx: "click", vol: 0.5 }, { en: T.qr + 0.45, sfx: "thump", vol: 0.5 }, { en: T.gastos, sfx: "metal", vol: 0.35 }, { en: T.gastos + 0.45, sfx: "thump", vol: 0.5 },
    ...restas(T).slice(0, 3).map((r) => ({ en: r.en + 0.43, sfx: "click", vol: 0.45 })),
    ...Array.from({ length: 6 }, (_, i) => ({ en: l[5] + 0.1 + i * 0.22, sfx: i % 2 ? "cajon" : "thump", vol: 0.35 })),
    { en: T.noventa + 0.45, sfx: "slam", vol: 0.5 }, { en: T.noventa + 0.47, sfx: "thump", vol: 0.6 },
    { en: T.revela, sfx: "thump", vol: 0.5 }, { en: T.mitad, sfx: "thump", vol: 0.45 }, { en: T.mitad + 0.35, sfx: "thump", vol: 0.4 }, { en: T.dormido, sfx: "slam", vol: 0.5 }, { en: T.dormido + 0.3, sfx: "buzz", vol: 0.4 },
    { en: l[7] - 0.1, sfx: "whoosh", vol: 0.45 }, { en: T.tuyo, sfx: "ding", vol: 0.45 }, { en: T.app0 + APP.tarjeta + 0.7, sfx: "click", vol: 0.45 }, { en: T.dormida, sfx: "ding", vol: 0.5 },
    { en: l[8], sfx: "caja", vol: 0.5 }, { en: T.probalo, sfx: "click", vol: 0.5 }, { en: T.LOOP - 0.12, sfx: "whoosh", vol: 0.35 }, { en: T.LOOP, sfx: "thump", vol: 0.45 },
  ].filter((s) => !(s.en > Math.min(e[5] + 0.14, T.revela - 0.33) && s.en < T.revela - 0.05));

  const finSil = Math.min(e[5] + 0.12, T.revela - 0.35);
  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(finSil * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.12 * Math.min(1, Math.max(0, finSil * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(T.revela * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(T.revela * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.12 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // posiciones en la pantalla del celular (px CSS de la grabación → pantalla)
  const ganancia = aPantalla(12, 92, 336, 96);
  const dormida = aPantalla(12, 80, 336, 140);
  const ocultoReloj = esc === "deposito" ? 1 - entra((t - l[5]) / 0.25) : 1;

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={red} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, e[0] + 0.1], [finSil - 0.05, T.revela + 0.05], [T.LOOP - 0.01, 999]]}
      fondo={fondo}
      frente={
        <>
          {esc === "gancho" ? <Gancho tg={loop ? 0 : t} hasta={l[1] - 0.7} /> : null}

          {esc === "dia" || esc === "regancho" || esc === "gastos" || esc === "deposito" ? <Contadores t={t} T={T} /> : null}

          {esc === "dia" ? (
            <>
              <div style={{ left: 125, top: 160, transform: `scale(${latido(t, 0.5, 0.03)})` }}><Reloj w={110} hora={h} /></div>
              <div style={{ left: 50, top: 288 }}><Kiosco w={210} t={t} /></div>
              {Array.from({ length: 10 }, (_, i) => {
                const a = T.abro + i * ((l[3] - T.abro) / 10);
                const k = (t - a) / 1.2;
                return k > 0 && k < 1 ? <Silueta key={i} k={k} i={i} /> : null;
              })}
              {t > T.proveedor - 0.45 ? (
                <div style={{ left: 380 - 190 * entra((t - T.proveedor + 0.45) / 0.5) + Math.max(0, t - T.cuarenta - 0.9) * 260, top: 384 }}><Camion w={160} t={t} /></div>
              ) : null}
              {t > T.cuarenta && t < T.cuarenta + 1.6 ? <Rotulo t={t} desde={T.cuarenta} texto={`− ${ars(PROVEEDOR)} · proveedor, en efectivo`} top={276} /> : null}
            </>
          ) : null}

          {esc === "regancho" || esc === "gastos" ? (
            <div style={{ left: esc === "regancho" ? 80 : 256, top: esc === "regancho" ? 172 : 160, transform: `scale(${esc === "regancho" ? latido(t - l[3], 0.55, 0.05) : 1})`, transformOrigin: "0 0" }}>
              <Reloj w={esc === "regancho" ? 200 : 86} hora={20} />
              <svg width={esc === "regancho" ? 200 : 86} height={esc === "regancho" ? 200 : 86} viewBox="0 0 100 100" style={{ position: "absolute", left: 0, top: 0 }}>
                <path d="M16 16 L84 84 M84 16 L16 84" stroke={C.rojo} strokeWidth="9" strokeLinecap="round" strokeDasharray="100" strokeDashoffset={100 - 100 * entra((t - l[3]) / 0.25)} />
              </svg>
              <div style={{ left: esc === "regancho" ? 150 : 64, top: esc === "regancho" ? -26 : -14, font: `800 ${esc === "regancho" ? 64 : 34}px ${DISP}`, color: C.rojo, transform: `rotate(12deg) scale(${latido(t, 0.5, 0.12)})` }}>?</div>
            </div>
          ) : null}
          {esc === "regancho" ? <Rotulo t={t} desde={T.noche - 0.1} texto="20:00 · ¿qué hice?" top={400} /> : null}

          {esc === "gastos" ? (
            <>
              <div style={{ left: 40, top: 236, transform: `rotate(-4deg) scale(${sp(t - (T.qr - 0.25), 1.05)})` }}><CartelQR w={100} /></div>
              {t > T.qr + 0.15 ? <div style={{ left: 54, width: 72, top: 280 + (((t - T.qr) / 0.6) % 1) * 70, height: 3, background: C.rojo, boxShadow: `0 0 10px ${C.rojo}` }} /> : null}
              {t > T.gastos - 0.25 ? <div style={{ left: 160, top: 236, transform: `scale(${sp(t - (T.gastos - 0.25), 1.05)})`, transformOrigin: "0 0" }}><PersianaLuz w={170} t={t} /></div> : null}
              <Rotulo t={t} desde={T.qr} texto={t < T.gastos ? `− ${ars(QR)} · comisión del QR` : `− ${ars(FIJOS)} · alquiler, luz y sueldo del día`} top={410} />
            </>
          ) : null}

          {esc === "deposito" ? (
            <>
              <div style={{ left: 0, right: 0, top: 160, height: 300, opacity: ocultoReloj > 0 ? 1 : 1 }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const a = l[5] + 0.1 + i * 0.22;
                  const p = entra((t - a) / 0.3);
                  const col = i % 3, fila = Math.floor(i / 3);
                  return t > a - 0.05 ? (
                    <div key={i} style={{ left: 40 + col * 96 + (fila % 2) * 46, top: 220 - fila * 74 - (1 - p) * 300, transform: `rotate(${(i % 2 ? 2 : -2) * (1 - p)}deg)` }}>
                      <CajaDeposito w={92} polvo={clamp((t - T.meses + 0.5) / 0.8, 0, 1)} color={["#d9a86c", "#c9965a", "#e0b57c"][i % 3]} />
                    </div>
                  ) : null;
                })}
              </div>
              <Rotulo t={t} desde={T.noventa} texto={`PLATA DORMIDA: ${ars(DORMIDO)} (ejemplo)`} top={176} size={18} />
            </>
          ) : null}

          {esc === "silencio" ? <Numero t={t} v={FINAL} top={262} size={66} color="#ff6b5e" /> : null}

          {esc === "partida" ? <Partida t={t} T={T} /> : null}

          {esc === "truco" ? (
            <>
              <div style={{ left: 0, right: 0, top: 80, textAlign: "center", transform: `scale(${sp(t - l[7], 1.06)})` }}>
                <span style={{ position: "static", font: `800 24px/1.1 ${DISP}`, color: "#fff" }}>En Claro <span style={{ position: "static", color: C.ambar }}>te dice la verdad</span></span>
              </div>
              <AppGrabada t={t} carpeta="tomas/v8-03" app0={T.app0} rate={1} durGrab={APP.fin} entrada={l[7] - 0.05} top={124}
                zoom={1 + 0.12 * entra((t - T.tuyo + 0.2) / 0.3)} zoomY="22%"
                aros={[{ desde: T.tuyo - 0.1, hasta: T.app0 + APP.tarjeta, ...ganancia }, { desde: T.dormida, ...dormida, color: C.rojo }]} />
            </>
          ) : null}

          {esc === "cierre" ? (
            <>
              <div style={{ left: 30, top: 226, transform: `scale(${1 + (t - l[8]) * 0.02})`, transformOrigin: "50% 100%" }}><Kiosco w={300} t={t} persiana={0.5} /></div>
              <div style={{ left: 64, top: 336, transform: `rotate(-2deg) scale(${latido(t, 0.62, 0.04)})`, transformOrigin: "50% 70%" }}><CajaRegistradora w={232} t={t} /></div>
              <Billetes t={t} desde={l[8] + 0.2} hasta={T.LOOP - 0.8} x0={-40} y0={330} x1={170} y1={470} cada={0.24} alto={80} />
              <Cartel texto="¿TU CAJA TE DICE LA VERDAD?" top={96} fondo={C.verde} color={C.ambar} size={20} s={sp(t - l[8], 1.06) * latido(t, 0.62, 0.03)} rot={-2 + Math.sin(t * 4) * 1.2} />
              {t >= T.probalo - 0.1 ? <Probalo s={sp(t - (T.probalo - 0.1), 1.05, 15, 0.45) * latido(t - T.probalo, 0.6, 0.05)} top={170} /> : null}
            </>
          ) : null}
        </>
      }
      sobre={musica}
    />
  );
};
