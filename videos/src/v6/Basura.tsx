import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { I, clamp, eIn, eOut, rnd, spring, win } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V3_06, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import { TextoCinetico } from "../escenas/Dolor";
import { Pildora, proyectar, useFuentesListas } from "../v3/ElDueno";
import type { VideoProps } from "../Video";
import { BotonProbalo, Celular, ControlCamaraRoll, GanchoGigante, LogoEnClaro, Marco, W, camaraBeats, camaraClaves, lineasDeVoz, temblor, type Clave } from "./comun";
import { Deposito, Objeto, Tacho } from "./ModelosBasura";

// V3-06 "Tirás plata a la basura": un tacho monstruo se traga lo que compraste y no vendiste.
// El misterio (cuánta plata) queda tapado con "$??.???" hasta que la voz dice el número. Todo atado a las palabras de Tomás.

const g = GUION_V3_06;
type V3 = [number, number, number];
const BOCA: V3 = [0, 2.95, 0.05];

function tiempos(pal: Palabra[]) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e,
    compraste: w(1, "compraste", l[1] + 0.4), nunca: w(1, "nunca", l[1] + 1.2), vendio: w(1, "vendi", l[1] + 1.8),
    vencio: w(2, "venci", l[2] + 0.4), deposito: w(2, "depósito", l[2] + 1.3),
    peor: w(3, "peor", l[3] + 0.9), anotas: w(3, "anotás", l[3] + 1.8),
    treinta: w(4, "treinta", l[4]), mes: w(4, "mes", e[4] - 0.5), pesos: w(4, "pesos", l[4] + 2.0),
    avisa: w(5, "avisa", l[5] + 0.5), reponer: w(5, "reponer", l[5] + 1.8), tacho: w(5, "tacho", e[5] - 0.5),
    revisa: w(6, "revisá", l[6]), gratis: w(6, "gratis", e[6] - 0.5),
  };
}
type T = ReturnType<typeof tiempos>;

type Ev = { ts: number; kind: number; from: V3; color: string; precio: number; spin: number };
const COLORES = ["#e24a4a", "#f5a524", "#4aa3e2", "#c75ad8"];

function eventos(T_: T): Ev[] {
  const ev: Ev[] = [];
  const add = (ts: number, kind: number, i: number, precio: number, color?: string) =>
    ev.push({ ts, kind, from: [(i % 2 ? 1 : -1) * (3.2 + rnd(i) * 1.4), 6.2 + rnd(i + 3) * 1.6, 0.6 + rnd(i + 5) * 1.4], color: color ?? COLORES[i % 4], precio, spin: 1 + rnd(i + 9) });
  // cuadro 0: billetes y golosinas que entran sin parar
  [0.35, 0.72, 1.05, 1.4, 1.75, 2.1, 2.45, 2.8, 3.15].forEach((ts, i) => add(ts, [3, 1, 3, 1, 3, 0, 3, 1, 3][i], i, 0));
  add(T_.compraste + 0.45, 0, 20, 2400);
  add(T_.nunca + 0.45, 1, 21, 1800);
  add(T_.vendio + 0.45, 1, 22, 900);
  add(T_.vencio + 0.45, 2, 23, 3100, "#7fb069");
  add(T_.deposito + 0.45, 0, 24, 4200);
  add(T_.deposito + 0.95, 1, 25, 1500);
  add(T_.peor + 0.45, 0, 26, 5600);
  add(T_.anotas + 0.45, 2, 27, 2800, "#7fb069");
  const n = Math.max(4, Math.floor((T_.mes - T_.treinta) / 0.36));
  for (let k = 0; k < n; k++) add(T_.treinta + 0.5 + k * 0.36, [0, 1, 2, 3, 1][k % 5], 30 + k, [3000, 2200, 4800, 1700, 2600][k % 5]);
  return ev.sort((a, b) => a.ts - b.ts);
}

function posEv(e: Ev, t: number) {
  const u = clamp((t - (e.ts - 0.55)) / 0.55, 0, 1);
  const k = u * u * (3 - 2 * u);
  const d = clamp((t - e.ts) / 0.3, 0, 1);
  const p: V3 = [
    e.from[0] + (BOCA[0] - e.from[0]) * k,
    e.from[1] + (BOCA[1] - e.from[1]) * k + Math.sin(Math.PI * u) * 1.1 - d * 1.2,
    e.from[2] + (BOCA[2] - e.from[2]) * k,
  ];
  return { p, s: 1 - 0.85 * d, rot: [e.spin * u * 3.2, e.spin * u * 2.4, e.spin * u * 1.6] as V3 };
}

function claves(T_: T, dur: number): Clave[] {
  const c = (t: number, pos: V3, target: V3, fov: number, roll = 0): Clave => ({ t, pos, target, fov, roll });
  return [
    c(0, [0.9, 3.9, 6.4], [0, 2.4, 0], 56),
    c(1.6, [-0.4, 3.5, 5.0], [0, 2.5, 0], 50),
    c(T_.l[1] - 0.25, [-0.2, 3.4, 4.8], [0, 2.5, 0], 49),
    c(T_.l[1] + 0.1, [-3.8, 3.2, 5.4], [0, 2.2, 0], 52, 0.07),
    c(T_.l[2] - 0.2, [-3.4, 3.0, 5.6], [0, 2.2, 0], 52, 0.04),
    c(T_.l[2] + 0.15, [3.8, 2.7, 5.2], [0, 2.1, 0], 52, -0.06),
    c(T_.l[3] - 0.1, [3.5, 2.6, 5.4], [0, 2.1, 0], 52, -0.03),
    c(T_.l[3] + 0.3, [0, 1.0, 4.6], [0, 2.4, 0], 64, -0.14),
    c(T_.l[4] - 0.2, [0.2, 1.1, 4.5], [0, 2.4, 0], 62, -0.1),
    c(T_.l[4] + 0.25, [0, 2.7, 4.2], [0, 2.3, 0], 46),
    c(T_.e[4] + 0.1, [0, 2.8, 4.4], [0, 2.3, 0], 46),
    c(T_.l[5] + 0.3, [-1.3, 3.2, 8.4], [1.8, 3.5, 0], 50),
    c(T_.l[6] + 0.1, [0, 3.0, 7.2], [0, 2.4, 0], 50),
    c(dur + 1, [0.4, 3.1, 6.6], [0, 2.4, 0], 50),
  ];
}

const Escena3D: React.FC<{ t: number; T_: T; ev: Ev[]; dur: number; listo: boolean }> = ({ t, T_, ev, dur, listo }) => {
  const c = camaraClaves(t, claves(T_, dur));
  c.pos = [c.pos[0] + Math.sin(t * 0.9) * 0.12, c.pos[1] + Math.sin(t * 1.3) * 0.08, c.pos[2]];
  let mastica = 0;
  ev.forEach((e) => {
    const d = t - e.ts;
    if (d >= 0 && d < 1.2) mastica += Math.exp(-7 * d) * (0.5 - 0.5 * Math.cos(Math.min(d, 0.55) * Math.PI * 2 * 3.6));
  });
  mastica = clamp(mastica, 0, 1.2);
  const de = t - (T_.mes + 0.1);
  const eructo = de >= 0 ? Math.exp(-5 * de) * Math.abs(Math.sin(de * 13)) * 1.3 : 0;
  const cierre = I(t, T_.reponer - 0.1, T_.reponer + 0.3, 0, 1, eIn);
  const rebote = t > T_.reponer + 0.3 ? 0.07 * Math.exp(-12 * (t - T_.reponer - 0.3)) * Math.abs(Math.sin((t - T_.reponer - 0.3) * 24)) : 0;
  const tapa = clamp(1 - cierre + rebote, 0, 1);
  const candado = Math.min(1.1, spring(t - (T_.reponer + 0.4), 14, 0.5));
  const prox = ev.find((e) => e.ts > t - 0.1);
  const mira: [number, number] = prox ? [clamp(prox.from[0] * 0.05, -0.14, 0.14), 0.1] : [0, 0];
  return (
    <>
      <ControlCamaraRoll c={c} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#ffe9c4", "#3a2412", 0.6]} />
      <directionalLight position={[3, 9, 7]} intensity={2.4} color="#fff0d0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={10} shadow-camera-bottom={-4} />
      <pointLight position={[0, 4.5, 3]} intensity={26} distance={12} color="#ffd9a0" />
      <pointLight position={[0, 2.5, 2.5]} intensity={eructo * 40 + (t > T_.treinta && t < T_.e[4] ? 12 : 0)} distance={9} color="#ff4d5a" />
      <Deposito t={t} listo={listo} />
      <Tacho mastica={mastica} tapa={tapa} candado={t > T_.reponer + 0.3 ? candado : 0} eructo={eructo} mira={mira} />
      {ev.map((e, i) => {
        if (t < e.ts - 0.56 || t > e.ts + 0.32) return null;
        const q = posEv(e, t);
        return <Objeto key={i} kind={e.kind} p={q.p} rot={q.rot} s={q.s} color={e.color} />;
      })}
    </>
  );
};

// ---------- capas 2D ----------
const Contador: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.l[1] - 0.2, T_.e[5] - 0.1, 0.25, 0.3);
  if (o <= 0) return null;
  const k = win(t, T_.treinta - 0.15, T_.e[4] + 0.25, 0.2, 0.3);
  const v = I(t, T_.treinta + 0.1, T_.pesos + 0.25, 0, 37800, eOut);
  const revelado = t >= T_.treinta + 0.1;
  const sg = Math.min(1.12, spring(t - (T_.treinta + 0.1), 12, 0.45));
  const jit = revelado ? 0 : Math.sin(t * 40) * 1.4;
  return (
    <div style={{ left: 16, right: 16, top: 62 + 160 * k, opacity: o, transform: `scale(${1 + 0.55 * k}) translateX(${jit}px)`, transformOrigin: "50% 0" }}>
      <div style={{ position: "relative", padding: "9px 12px 11px", borderRadius: 16, background: "#14110dee", border: `2px solid ${revelado ? "#FF4D5A" : "#FFB703"}`, boxShadow: `0 10px 30px #000a, 0 0 ${revelado ? 34 : 14}px ${revelado ? "#FF4D5A77" : "#FFB70044"}`, textAlign: "center" }}>
        <div style={{ position: "static", font: `800 11px ${BODY}`, letterSpacing: ".14em", color: "#ffffffbb" }}>PLATA TIRADA ESTE MES</div>
        <div style={{ position: "static", font: `800 42px/1.05 ${DISP}`, color: revelado ? "#FF4D5A" : "#FFB703", fontVariantNumeric: "tabular-nums", transform: `scale(${revelado ? sg : 1})`, textShadow: "0 3px 0 #000" }}>
          {revelado ? ars(v) : "$??.???"}
        </div>
        {revelado ? <div style={{ position: "static", font: `400 13px ${BODY}`, color: "#ffffffaa", fontStyle: "italic" }}>ejemplo</div> : null}
      </div>
    </div>
  );
};

const Popups: React.FC<{ t: number; ev: Ev[]; c: ReturnType<typeof camaraClaves> }> = ({ t, ev, c }) => (
  <>
    {ev.map((e, i) => {
      const d = t - e.ts;
      if (e.precio <= 0 || d < 0.05 || d > 1.15) return null;
      const q = proyectar(c, [BOCA[0] + (rnd(i * 7) - 0.5) * 1.3, 3.5, 0.6]);
      const s = Math.min(1.1, spring(d - 0.05, 16, 0.45));
      return (
        <div key={i} style={{ left: q.x - 70, width: 140, top: q.y - d * 70, textAlign: "center", font: `900 26px/1 ${DISP}`, color: "#FF4D5A", opacity: (1 - I(t, e.ts + 0.75, e.ts + 1.15, 0, 1, eIn)) * Math.min(1, s * 2), transform: `scale(${s}) rotate(${(rnd(i) - 0.5) * 10}deg)`, textShadow: "0 3px 0 #000, 0 0 12px #000" }}>
          −{ars(e.precio)}
        </div>
      );
    })}
  </>
);

const FILAS: [string, number, string][] = [["Turrones surtidos", 9800, "94 días sin venderse"], ["Yerba 500 g", 11200, "71 días sin venderse"], ["Galletitas rellenas", 16800, "63 días sin venderse"]];

const Truco: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.l[5] - 0.1, T_.l[6] + 0.1, 0.1, 0.3);
  if (o <= 0) return null;
  const sp = spring(t - (T_.avisa - 0.5), 11, 0.55);
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 138, top: 128, width: 190, height: 400, transform: "scale(0.82)", transformOrigin: "0 0" }}>
        <Celular t={t} sp={sp} left={0} top={0}>
          <div style={{ left: 14, top: 32, font: `700 13px ${DISP}`, color: "#fff" }}>Plata dormida</div>
          {FILAS.map(([n, m, d], i) => {
            const s = Math.min(1, spring(t - T_.avisa - i * 0.18, 13, 0.6));
            const sello = Math.min(1.15, spring(t - (T_.reponer + 0.05 + i * 0.12), 17, 0.4));
            return (
              <div key={i} style={{ left: 10, right: 10, top: 58 + i * 78, height: 70, borderRadius: 12, background: "#143723", border: "1px solid #2f6a4b", padding: "8px 10px", opacity: s, transform: `translateX(${(1 - s) * 90}px)` }}>
                <div style={{ position: "static", font: `700 12px ${DISP}`, color: "#fff" }}>{n}</div>
                <div style={{ position: "static", font: `600 9px ${BODY}`, color: "#9DB8A8", marginTop: 1 }}>{d}</div>
                <div style={{ position: "static", font: `700 17px ${DISP}`, color: "#FFB703", marginTop: 2 }}>{ars(m)}</div>
                {t >= T_.reponer + 0.05 + i * 0.12 ? (
                  <div style={{ right: 6, top: 40, padding: "2px 6px", border: "2px solid #FF4D5A", borderRadius: 6, color: "#FF4D5A", font: `900 10px ${BODY}`, letterSpacing: ".06em", transform: `rotate(-9deg) scale(${sello})`, background: "#0E2A1CCC" }}>NO REPONER</div>
                ) : null}
              </div>
            );
          })}
          <div style={{ left: 10, right: 10, top: 296, padding: 10, borderRadius: 12, background: "#143723", border: "1px solid #2f6a4b" }}>
            <div style={{ position: "static", font: `600 9px ${BODY}`, color: "#9DB8A8", letterSpacing: ".08em" }}>DORMIDO · EJEMPLO</div>
            <div style={{ position: "static", font: `700 22px/1.1 ${DISP}`, color: "#FFB703" }}>{ars(37800)}</div>
          </div>
        </Celular>
      </div>
    </div>
  );
};

const Cierre: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.l[6] - 0.15, T_.l[6] + 999, 0.2, 0.01);
  if (o <= 0) return null;
  const sb = spring(t - (T_.gratis - 0.15), 16, 0.4);
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 250, background: "linear-gradient(#000d,transparent)" }} />
      <LogoEnClaro style={{ position: "absolute", left: 18, top: 62, opacity: Math.min(1, spring(t - T_.l[6], 12, 0.5)) }} />
      <TextoCinetico t={t} desde={T_.revisa} paso={0.09} texto="Revisá tu" amarillas={[]} style={{ left: 18, right: 10, top: 118, font: `700 34px/1.05 ${DISP}`, color: "#fff" }} />
      <TextoCinetico t={t} desde={T_.revisa + 0.25} paso={0.09} texto="depósito hoy." amarillas={[0]} style={{ left: 18, right: 10, top: 156, font: `800 42px/1.05 ${DISP}`, color: "#fff" }} />
      <BotonProbalo s={sb} top={548} />
    </div>
  );
};

export const Basura: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrameSeguro();
  const { t, dur } = frame;
  const listo = useFuentesListas();
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T_ = tiempos(pal);
  const ev = eventos(T_);
  const cam3 = camaraClaves(t, claves(T_, dur));

  const hs = temblor(t, [[0.05, 10], [T_.treinta + 0.1, 14], [T_.mes + 0.1, 16], [T_.reponer + 0.3, 10], [T_.peor, 7]]);
  let wf = t < 0.1 ? 0.3 : 0, red = 0;
  { const d = t - (T_.treinta + 0.1); if (d >= 0) { wf += Math.max(0, 1 - d / 0.18) * 0.5; red += Math.max(0, 1 - d / 0.5); } }
  { const d = t - (T_.mes + 0.1); if (d >= 0) red += Math.max(0, 1 - d / 0.4) * 0.8; }
  const beats = [0.45, 1.2, T_.compraste, T_.nunca, T_.vendio, T_.vencio, T_.deposito, T_.peor, T_.anotas, T_.treinta, T_.pesos, T_.mes, T_.avisa, T_.reponer, T_.revisa, T_.gratis];
  const cam = camaraBeats(t, beats, [T_.l[1], T_.l[2], T_.l[3], T_.l[4], T_.l[5], T_.l[6]]);

  const sonidos = [
    { en: 0.05, sfx: "slam" }, { en: 0.0, sfx: "whoosh" },
    ...ev.flatMap((e) => [{ en: e.ts, sfx: "thump", vol: 0.42 }, { en: e.ts - 0.2, sfx: e.kind === 3 ? "papel" : e.kind === 1 ? "papel" : "rattle", vol: 0.32 }]),
    ...[T_.l[1], T_.l[2], T_.l[3], T_.l[5], T_.l[6]].map((a) => ({ en: a - 0.12, sfx: "whoosh" })),
    { en: T_.peor, sfx: "heart" }, { en: T_.treinta - 0.55, sfx: "riser" }, { en: T_.treinta + 0.1, sfx: "slam" }, { en: T_.treinta + 0.2, sfx: "caja" },
    { en: T_.mes + 0.1, sfx: "slam" }, { en: T_.avisa - 0.3, sfx: "whoosh" }, { en: T_.reponer + 0.2, sfx: "lock" }, { en: T_.reponer + 0.3, sfx: "metal" },
    { en: T_.reponer + 0.05, sfx: "click" }, { en: T_.reponer + 0.17, sfx: "click" }, { en: T_.reponer + 0.29, sfx: "click" }, { en: T_.gratis, sfx: "ding" },
  ];

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={red} frame={frame.frame} t={t} sonidos={sonidos}
      ocultos={[[-1, T_.e[0] + 0.1], [T_.treinta - 0.1, T_.e[4] + 0.1], [T_.gratis - 0.1, 999]]}
      fondo={<div style={{ inset: 0, background: "radial-gradient(circle at 50% 40%,#3a2b1c,#0b0805 78%)" }} />}
      tres={<Escena3D t={t} T_={T_} ev={ev} dur={dur} listo={listo} />}
      frente={
        <>
          <GanchoGigante t={t} lineas={[...g.ganchos[0].lineas]} hasta={T_.e[0]} top={116} />
          {t < T_.l[1] + 0.6 ? <Pildora texto="ALMACENERO:" style={{ left: 18, top: 62, transform: "rotate(-3deg)", opacity: win(t, -1, T_.l[1] + 0.5, 0.01, 0.4) }} /> : null}
          <Contador t={t} T_={T_} />
          <Popups t={t} ev={ev} c={cam3} />
          <Truco t={t} T_={T_} />
          <Cierre t={t} T_={T_} />
        </>
      }
      luzCalida={Math.max(win(t, T_.l[5], T_.l[5] + 1.2, 0.3, 0.8) * 0.25, 0)}
    />
  );
};

function useCurrentFrameSeguro() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return { frame, t: frame / fps, dur: durationInFrames / fps };
}
