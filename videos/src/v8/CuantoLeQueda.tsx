import React from "react";
import { Html5Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { I, clamp, eOut, rnd, spring, win } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V8_01, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Celular, Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { Billete, C, Gondola, Kiosco, Kiosquero, PersianaLuz } from "./iconos";

// V8-01 "¿Cuánto le queda de verdad a un kiosco?" — estilo explicador financiero (videos/guiones/V8-01-CUANTO-LE-QUEDA.md).
// El protagonista es el número: baja contando dígito por dígito y cambia de verde a rojo. Máximo 2 textos a la vez + subtítulo.
// Todo sale del tiempo (determinista): el render se reparte en 10 máquinas.

const g = GUION_V8_01;
/** Pulso corto cada `periodo` segundos (algo visible pasa siempre, regla de 0,7 s). */
const latido = (t: number, periodo = 0.6, fuerza = 0.05) => 1 + fuerza * Math.pow(Math.abs(Math.sin((t / periodo) * Math.PI)), 12) * (t >= 0 ? 1 : 0);
const VENDE = 150000;
const RESTAS: { monto: number; rotulo: string }[] = [
  { monto: 97500, rotulo: "mercadería" },
  { monto: 18000, rotulo: "alquiler y luz del día" },
  { monto: 8000, rotulo: "fiado que no vuelve" },
  { monto: 3000, rotulo: "comisión del QR (4%)" },
];
const QUEDA = VENDE - RESTAS.reduce((s, r) => s + r.monto, 0); // 23.500
// tiempos de la grabación real de la app (app/scripts/grabar-v8-01.cjs → videos/public/tomas/v8-01/app-cierre.json)
const APP = { hablar: 0.769, entendio: 3.68, resultado: 5.492, fin: 8.097 };

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  const T = {
    l, e, dur,
    comentarios: w(1, "comentarios", l[1] + 1.0), antes: w(1, "antes", l[1] + 1.7), final: w(1, "final", e[1] - 0.45),
    merc: w(2, "mercadería", l[2] + 0.5), noventa: w(2, "noventa", l[2] + 1.3),
    dieciocho: w(3, "dieciocho", l[3] + 1.3),
    descartaste: w(4, "descartaste", l[4] + 0.3), laA: w(4, "a", e[4] - 0.25),
    ocho: w(5, "ocho", l[5] + 1.2), comision: w(5, "comisión", l[5] + 1.9), tres: w(5, "tres", e[5] - 0.5),
    quedan: w(6, "quedan", l[6] + 0.1), cree: w(6, "cree", l[6] + 1.9),
    cuenta: w(7, "cuenta", l[7]), sola: w(7, "sola", l[7] + 1.5), quedo: w(7, "quedó", e[7] - 0.8),
    habias: w(8, "habías", l[8] + 0.3), probalo: w(8, "probalo", l[8] + 1.3),
    LOOP: dur - 0.27,
    app0: 0, rate: 1,
  };
  // la grabación de la app arranca apenas entra el celular y el resultado cae cuando la voz dice "cuánto te quedó"
  T.app0 = T.l[7] + 0.25;
  T.rate = clamp(APP.resultado / Math.max(1, T.quedo - T.app0), 1, 1.8);
  return T;
}
type T = ReturnType<typeof tiempos>;
const enApp = (T: T, s: number) => T.app0 + s / T.rate; // segundo de la grabación → segundo del video

type Esc = "gancho" | "opciones" | "merc" | "alq" | "descarte" | "fiado" | "qr" | "silencio" | "revela" | "truco" | "cierre";
function escena(t: number, T: T): Esc {
  if (t >= T.LOOP) return "gancho";
  const { l, e } = T;
  if (t < l[1] - 0.05) return "gancho";
  if (t < l[2] - 0.05) return "opciones";
  if (t < l[3] - 0.05) return "merc";
  if (t < l[4] - 0.05) return "alq";
  if (t < l[5] - 0.05) return "descarte";
  if (t < T.comision - 0.12) return "fiado";
  if (t < e[5] + 0.08) return "qr";
  if (t < l[6] - 0.02) return "silencio";
  if (t < l[7] - 0.05) return "revela";
  if (t < l[8] - 0.05) return "truco";
  return "cierre";
}

/** Momentos en que el número baja (cada resta cuenta sus dígitos en 0,42 s y termina con un "clac"). */
const bajadas = (T: T) => [T.noventa, T.dieciocho, T.ocho, T.tres];
function valorEn(t: number, T: T) {
  return bajadas(T).reduce((v, a, i) => v - RESTAS[i].monto * eOut(clamp((t - (a + 0.05)) / 0.42, 0, 1)), VENDE);
}
const mezcla = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * clamp(k, 0, 1))).join(",")})`;
};
const colorDe = (v: number) => (v > 52500 ? mezcla(C.hoja, C.mostaza, (VENDE - v) / (VENDE - 52500)) : mezcla(C.mostaza, C.rojo, (52500 - v) / (52500 - 34500)));

/** El número protagonista: cuenta dígito por dígito (con desenfoque de movimiento mientras rueda). */
const Numero: React.FC<{ t: number; T: T; top: number; size: number; color?: string; valor?: number }> = ({ t, T, top, size, color, valor }) => {
  const v = valor ?? valorEn(t, T);
  const rodando = bajadas(T).some((a) => t > a + 0.05 && t < a + 0.47);
  const golpe = bajadas(T).reduce((s, a) => s + (t > a + 0.47 ? Math.exp(-10 * (t - a - 0.47)) * Math.sin((t - a - 0.47) * 30) * 0.06 : 0), 0);
  const txt = ars(Math.round(v / 10) * 10);
  return (
    <div style={{ left: 0, right: 0, top, textAlign: "center", transform: `scale(${(1 + golpe + 0.012 * Math.sin(t * 2.4)) * latido(t, 0.6, 0.035)})` }}>
      <span style={{ position: "static", font: `800 ${size}px/1 ${DISP}`, letterSpacing: "-.03em", color: color ?? colorDe(v), fontVariantNumeric: "tabular-nums", filter: rodando ? "blur(0.8px)" : undefined, textShadow: "0 3px 0 #0f1f1722" }}>
        {txt.split("").map((ch, i) => (
          <span key={i} style={{ position: "relative", display: "inline-block", transform: rodando && /\d/.test(ch) ? `translateY(${Math.sin(t * 60 + i) * 3}px)` : undefined }}>{ch}</span>
        ))}
      </span>
    </div>
  );
};

/** Rótulo chico debajo del número ("− $97.500 · mercadería"). */
const Rotulo: React.FC<{ t: number; desde: number; texto: string; top?: number; color?: string }> = ({ t, desde, texto, top = 172, color = C.rojo }) => {
  if (t < desde - 0.05) return null;
  const s = Math.min(1.08, spring(t - desde, 16, 0.5));
  return (
    <div style={{ left: 0, right: 0, top, textAlign: "center", opacity: Math.min(1, s * 1.4), transform: `translateY(${(1 - Math.min(1, s)) * 14}px) scale(${0.9 + 0.1 * s})` }}>
      <span style={{ position: "static", display: "inline-block", padding: "5px 14px", borderRadius: 999, background: "#fff", border: `2.5px solid ${color}`, font: `700 17px ${BODY}`, color: C.tinta, boxShadow: "0 4px 0 #0f1f1720" }}>{texto}</span>
    </div>
  );
};

/** Foto real como recorte de collage: borde blanco, sombra, color cálido y un leve empuje constante. */
const Foto: React.FC<{ t: number; desde: number; src: string; left: number; top: number; w: number; h: number; rot: number }> = ({ t, desde, src, left, top, w, h, rot }) => {
  if (t < desde - 0.05) return null;
  const s = Math.min(1.06, spring(t - desde, 13, 0.5));
  const dt = t - desde;
  return (
    <div style={{ left, top, width: w, height: h, padding: 6, background: "#fff", boxShadow: "0 12px 26px #0f1f1740, 0 2px 0 #0f1f1715", transform: `translateY(${(1 - Math.min(1, s)) * 160}px) rotate(${rot + (1 - Math.min(1, s)) * 8 + Math.sin(t * 1.3) * 0.6}deg) scale(${0.85 + 0.15 * s})` }}>
      <div style={{ left: 6, top: 6, right: 6, bottom: 6, overflow: "hidden" }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.04 + dt * 0.025})`, filter: "contrast(1.08) saturate(1.1) sepia(0.12) brightness(1.03)" }} />
      </div>
    </div>
  );
};

/** Billetes que salen volando cuando el número baja (capa de apoyo, entra 2–3 cuadros después). */
const Vuelo: React.FC<{ t: number; T: T }> = ({ t, T }) => (
  <>
    {bajadas(T).flatMap((a, k) =>
      Array.from({ length: 5 }, (_, i) => {
        const d = t - (a + 0.1 + i * 0.035);
        if (d < 0 || d > 0.8) return null;
        const dir = i % 2 ? 1 : -1;
        return (
          <div key={`${k}-${i}`} style={{ left: 160 + dir * (20 + d * (120 + rnd(i + k * 7) * 90)), top: 150 + d * 260 + d * d * 260, opacity: 1 - d / 0.8, transform: `rotate(${dir * d * (300 + i * 60)}deg)` }}>
            <Billete w={34} />
          </div>
        );
      }),
    )}
  </>
);

const OPCIONES: { letra: string; monto: number }[] = [
  { letra: "B", monto: 50000 },
  { letra: "C", monto: 23500 },
  { letra: "A", monto: 80000 },
];
/** Las tres respuestas (orden mezclado). `tacha`: letra → instante del tachón; la A además sale volando. */
const Opciones: React.FC<{ t: number; entradas: number[]; top: number; escala?: number; tachaA?: [number, number]; recorre?: boolean }> = ({ t, entradas, top, escala = 1, tachaA, recorre = false }) => (
  <div style={{ left: 40, right: 40, top, height: 230, transform: `scale(${escala})`, transformOrigin: "50% 0" }}>
    {OPCIONES.map((o, i) => {
      const s = Math.min(1.08, spring(t - entradas[i], 15, 0.48));
      if (t < entradas[i] - 0.05) return null;
      const esA = o.letra === "A" && tachaA;
      const tachon = esA ? entra((t - tachaA[0]) / 0.16) : 0;
      const vuela = esA ? Math.max(0, t - tachaA[1]) : 0;
      return (
        <div key={o.letra} style={{ left: 0, right: 0, top: i * 74 + Math.sin(t * 2.6 + i * 1.7) * 3, height: 62, opacity: Math.min(1, s * 1.4) * (1 - clamp(vuela / 0.35, 0, 1)), transform: `translateX(${(1 - Math.min(1, s)) * (i % 2 ? 260 : -260) + vuela * 900}px) rotate(${vuela * 60}deg) scale(${recorre && t > entradas[2] + 0.2 && Math.floor((t - entradas[2]) / 0.45) % 3 === i ? 1.05 : 1})` }}>
          <div style={{ inset: 0, borderRadius: 16, background: recorre && t > entradas[2] + 0.2 && Math.floor((t - entradas[2]) / 0.45) % 3 === i ? "#fff6dc" : "#fff", border: `3px solid ${recorre && t > entradas[2] + 0.2 && Math.floor((t - entradas[2]) / 0.45) % 3 === i ? C.ambar : C.tinta}`, boxShadow: `0 5px 0 ${C.tinta}` }} />
          <div style={{ left: 10, top: 9, width: 44, height: 44, borderRadius: 12, background: C.verde, textAlign: "center", font: `800 26px/44px ${DISP}`, color: C.ambar }}>{o.letra}</div>
          <div style={{ left: 70, top: 10, font: `800 34px/42px ${DISP}`, color: C.tinta, fontVariantNumeric: "tabular-nums" }}>{ars(o.monto)}</div>
          {tachon > 0 ? <div style={{ left: -6, top: 26, height: 9, width: `${tachon * 104}%`, borderRadius: 5, background: C.rojo, transform: "rotate(-4deg)", boxShadow: "0 2px 0 #0003" }} /> : null}
        </div>
      );
    })}
  </div>
);
const entra = (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(p, 0, 1)));

const Fondo: React.FC<{ t: number; esc: Esc }> = ({ t, esc }) => {
  const oscuro = esc === "truco";
  return (
    <div style={{ inset: 0 }}>
      <div style={{ inset: 0, background: oscuro ? `radial-gradient(circle at 50% 30%, #17573b, ${C.verde} 70%)` : `radial-gradient(circle at 50% 28%, #fffaf0, ${C.crema} 60%, #f3e3bd)` }} />
      {/* textura de papel: fibras suaves que se mueven apenas */}
      <div style={{ inset: -20, opacity: oscuro ? 0.08 : 0.22, background: "repeating-linear-gradient(115deg, #0000 0 7px, #b2864818 7px 8px), repeating-linear-gradient(25deg, #0000 0 11px, #b2864812 11px 12px)", transform: `translate(${Math.sin(t * 0.7) * 4}px, ${Math.cos(t * 0.5) * 4}px)` }} />
      {/* franja de marca abajo */}
      <div style={{ left: 0, right: 0, bottom: 0, height: 10, background: `repeating-linear-gradient(90deg, ${C.hoja} 0 26px, ${C.crema} 26px 52px)`, opacity: oscuro ? 0.6 : 1 }} />
    </div>
  );
};

/** Cuadro 0 (y su repetición al final): kiosco + "VENDE $150.000 POR DÍA" + "¿CUÁNTO LE QUEDA?". */
/** Billetes que entran por la puerta del kiosco (la plata que vende). */
const Entrando: React.FC<{ t: number; desde?: number }> = ({ t, desde = 0.3 }) => (
  <>
    {Array.from({ length: 12 }, (_, i) => {
      const d = t - (desde + i * 0.42);
      if (d < 0 || d > 0.7) return null;
      const k = d / 0.7;
      return (
        <div key={i} style={{ left: -30 + k * 270 + (i % 3) * 8, top: 300 + Math.sin(k * Math.PI) * -90 + (i % 2) * 20, opacity: Math.min(1, (1 - k) * 3), transform: `rotate(${k * 260 + i * 40}deg) scale(${1 - k * 0.5})` }}>
          <Billete w={36} />
        </div>
      );
    })}
  </>
);

const Gancho: React.FC<{ tg: number }> = ({ tg }) => {
  const golpe = (1 + 0.16 * Math.exp(-7 * tg) * Math.cos(tg * 22)) * latido(tg, 0.62, 0.04);
  const sp = Math.min(1.1, 0.75 + spring(tg + 0.12, 15, 0.45) * 0.25);
  return (
    <div style={{ inset: 0 }}>
      <div style={{ left: 30, top: 252, transform: `scale(${1.0 + tg * 0.035}) translateY(${Math.sin(tg * 2.2) * 2}px)`, transformOrigin: "50% 100%" }}>
        <Kiosco w={300} t={tg} />
        <div style={{ left: 196, top: 128, transform: `translateY(${Math.sin(tg * 1.8) * 1.5}px)` }}><Kiosquero w={62} t={tg} /></div>
      </div>
      <Entrando t={tg} />
      <div style={{ left: 0, right: 0, top: 84, textAlign: "center", transform: `scale(${golpe})` }}>
        <div style={{ position: "static", font: `800 21px/1.1 ${BODY}`, color: C.tinta, letterSpacing: ".03em" }}>ESTE KIOSCO VENDE</div>
        <div style={{ position: "static", font: `800 60px/1.02 ${DISP}`, color: C.hoja, letterSpacing: "-.03em", textShadow: `0 4px 0 ${C.tinta}22` }}>$150.000</div>
        <div style={{ position: "static", font: `800 21px/1.1 ${BODY}`, color: C.tinta, letterSpacing: ".03em" }}>POR DÍA</div>
      </div>
      <div style={{ left: 0, right: 0, top: 206, textAlign: "center", transform: `scale(${sp * latido(tg + 0.31, 0.62, 0.05)}) rotate(${-2 + Math.sin(tg * 4.4) * 1.6}deg)` }}>
        <span style={{ position: "static", display: "inline-block", padding: "7px 16px", borderRadius: 12, background: C.rojo, color: "#fff", font: `800 26px ${DISP}`, boxShadow: `0 5px 0 ${C.tinta}` }}>¿CUÁNTO LE QUEDA?</span>
      </div>
    </div>
  );
};

/** Pantalla real de En Claro grabada (360 px), dentro del celular, con zoom al resultado. */
const Truco: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const { fps } = useVideoConfig();
  const sp = Math.min(1.04, spring(t - (T.l[7] - 0.05), 12, 0.55));
  const tRes = enApp(T, APP.resultado);
  const zoom = 1 + 0.18 * entra((t - tRes - 0.1) / 0.3);
  const durClip = Math.round((APP.fin / T.rate) * fps);
  const desde = Math.round(T.app0 * fps);
  const terminado = t >= T.app0 + APP.fin / T.rate - 0.04;
  const titulo = Math.min(1.06, spring(t - (T.cuenta - 0.05), 15, 0.5));
  const aro = t >= tRes ? entra((t - tRes) / 0.25) : 0;
  return (
    <div style={{ inset: 0 }}>
      <div style={{ left: 0, right: 0, top: 86, textAlign: "center", transform: `scale(${titulo})`, opacity: Math.min(1, titulo * 1.4) * (1 - Math.min(1, aro * 1.5)) }}>
        <span style={{ position: "static", font: `800 24px/1.1 ${DISP}`, color: "#fff" }}>En Claro <span style={{ position: "static", color: C.ambar }}>te la hace sola</span></span>
      </div>
      <div style={{ left: 85, top: 124, width: 190, height: 400, transform: `scale(${zoom})`, transformOrigin: "50% 22%" }}>
        <Celular t={t} sp={sp} left={0} top={0}>
          <div style={{ inset: 0, background: C.papel }}>
            {!terminado ? (
              <Sequence from={desde} durationInFrames={durClip} layout="none">
                <OffthreadVideo src={staticFile("tomas/v8-01/app-cierre.mp4")} playbackRate={T.rate} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} />
              </Sequence>
            ) : (
              <Img src={staticFile("tomas/v8-01/app-resultado.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} />
            )}
            {aro > 0 ? <div style={{ left: 6, top: 46, width: 136 * aro + 20, height: 66, borderRadius: 16, border: `3px solid ${C.ambar}`, boxShadow: `0 0 18px ${C.ambar}`, opacity: Math.min(1, aro * 1.5) }} /> : null}
          </div>
        </Celular>
      </div>
      {aro > 0 ? (
        <div style={{ left: 0, right: 0, top: 84, textAlign: "center", opacity: Math.min(1, aro * 1.4), transform: `scale(${0.9 + 0.1 * aro})` }}>
          <span style={{ position: "static", display: "inline-block", padding: "4px 12px", borderRadius: 999, background: "#fff", font: `700 17px ${BODY}`, color: C.verde }}>Hoy te quedaron $23.500 (ejemplo)</span>
        </div>
      ) : null}
    </div>
  );
};

export const CuantoLeQueda: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, dur);
  const esc = escena(t, T);
  const loop = t >= T.LOOP;
  const tw = loop ? 0 : t; // el último cuadro repite el cuadro 0 (cámara y golpes incluidos)
  const { l, e } = T;

  const beats = [0.03, T.comentarios, T.antes, T.final, T.noventa + 0.47, T.dieciocho + 0.47, T.descartaste, T.ocho + 0.47, T.tres + 0.47, T.quedan, T.cree, T.cuenta, T.quedo, T.probalo];
  const cortes = [l[1], l[2], l[3], l[4], l[5], T.comision, l[6], l[7], l[8]];
  const cam: Cam2D = esc === "silencio" ? { z: 1.03 + (t - e[5]) * 0.08, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : beats, loop ? [] : cortes, 0.75);
  const hs = loop ? 0 : temblor(t, [[0.03, 9], [T.noventa + 0.47, 6], [T.dieciocho + 0.47, 6], [T.tres + 0.47, 7], [T.quedan, 12], [T.cree, 8]]);
  let wf = 0, red = 0;
  if (!loop) {
    [[T.quedan, 0.45], [T.cree, 0.3]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });
    if (esc === "revela") red = 0.12;
  }

  // ---------- sonido ----------
  const tRes = enApp(T, APP.resultado);
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, { en: 0, sfx: "calle", vol: 0.45 }, { en: 0.02, sfx: "whoosh", vol: 0.35 },
    ...[l[1] + 0.3, T.comentarios, T.antes].map((a) => ({ en: a - 0.03, sfx: "click", vol: 0.6 })),
    ...cortes.map((a) => ({ en: a - 0.1, sfx: "whoosh", vol: 0.3 })),
    { en: T.noventa, sfx: "caja", vol: 0.45 }, { en: T.noventa + 0.47, sfx: "thump", vol: 0.55 },
    { en: l[3], sfx: "metal", vol: 0.35 }, { en: T.dieciocho + 0.47, sfx: "thump", vol: 0.55 },
    { en: T.descartaste - 0.02, sfx: "marcador" }, { en: T.laA + 0.12, sfx: "buzz", vol: 0.6 },
    { en: l[5], sfx: "hoja", vol: 0.5 }, { en: T.ocho + 0.47, sfx: "thump", vol: 0.55 },
    { en: T.comision - 0.05, sfx: "lock", vol: 0.55 }, { en: T.tres + 0.47, sfx: "thump", vol: 0.6 },
    ...bajadas(T).map((a) => ({ en: a + 0.45, sfx: "click", vol: 0.5 })),
    { en: T.quedan - 0.02, sfx: "slam", vol: 0.5 },
    ...Array.from({ length: Math.max(0, Math.floor((T.cree - T.quedan - 0.2) / 0.55)) }, (_, i) => ({ en: T.quedan + 0.28 + i * 0.55, sfx: "heart", vol: 0.55 })), { en: T.cree, sfx: "marcador", vol: 0.45 }, { en: T.cree + 0.02, sfx: "thump", vol: 0.5 },
    { en: l[7] - 0.1, sfx: "whoosh", vol: 0.45 },
    { en: enApp(T, APP.hablar), sfx: "click", vol: 0.5 }, { en: enApp(T, APP.entendio), sfx: "ding", vol: 0.35 }, { en: tRes, sfx: "ding", vol: 0.5 }, { en: tRes + 0.18, sfx: "coins", vol: 0.35 },
    { en: T.probalo, sfx: "click", vol: 0.5 }, { en: T.LOOP - 0.12, sfx: "whoosh", vol: 0.35 },
  ].filter((s) => !(s.en > e[5] + 0.06 && s.en < l[6] - 0.05)); // silencio total antes de revelar

  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round((e[5] + 0.05) * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.12 * Math.min(1, Math.max(0, (e[5] + 0.05) * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(l[7] * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(l[7] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.12 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  const restaVisible = (i: number) => bajadas(T)[i];
  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={red} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, e[0] + 0.1], [e[5] + 0.05, l[6] + 0.05], [T.LOOP - 0.01, 999]]}
      fondo={<Fondo t={t} esc={esc} />}
      frente={
        <>
          {esc === "gancho" ? <Gancho tg={loop ? 0 : t} /> : null}

          {esc === "opciones" ? (
            <>
              <div style={{ left: 0, right: 0, top: 96, textAlign: "center", transform: `scale(${Math.min(1.05, spring(t - l[1], 15, 0.5)) * latido(t - l[1], 0.5, 0.06)}) rotate(${Math.sin(t * 5) * 1.5}deg)` }}>
                <span style={{ position: "static", display: "inline-block", padding: "7px 16px", borderRadius: 12, background: C.rojo, color: "#fff", font: `800 28px ${DISP}`, boxShadow: `0 5px 0 ${C.tinta}` }}>¿CUÁNTO LE QUEDA?</span>
              </div>
              <Opciones t={t} entradas={[l[1] + 0.3, T.comentarios - 0.03, T.antes - 0.03]} top={190} recorre />
            </>
          ) : null}

          {esc === "merc" ? (
            <>
              <div style={{ left: 16, top: 236, transform: `rotate(-2deg) translateX(${Math.sin(t * 1.1) * 3}px)` }}><Gondola w={200} t={t} vacia={clamp((t - T.noventa) / 0.5, 0, 1) * 0.66 + clamp((t - T.noventa - 0.5) / 1.8, 0, 1) * 0.3} /></div>
              <Foto t={t} desde={l[2] + 0.12} src="tomas/v8-01/recorte-almacen.jpg" left={168} top={262} w={176} h={92} rot={5} />
              <Numero t={t} T={T} top={96} size={64} />
              <Rotulo t={t} desde={T.noventa} texto={`− ${ars(RESTAS[0].monto)} · ${RESTAS[0].rotulo}`} />
            </>
          ) : null}

          {esc === "alq" ? (
            <>
              <div style={{ left: 42, top: 236, transform: `translateY(${Math.sin(t * 1.4) * 4}px)` }}><PersianaLuz w={270} t={t} /></div>
              <div style={{ left: 214, top: 280, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, #ffe28acc, #ffe28a00 65%)", opacity: 0.25 + 0.75 * Math.pow(Math.abs(Math.sin(((t - l[3]) / 0.5) * Math.PI)), 6) }} />
              <Numero t={t} T={T} top={96} size={64} />
              <Rotulo t={t} desde={restaVisible(1)} texto={`− ${ars(RESTAS[1].monto)} · ${RESTAS[1].rotulo}`} />
            </>
          ) : null}

          {esc === "descarte" ? (
            <>
              <Numero t={t} T={T} top={96} size={64} />
              <Opciones t={t} entradas={[l[4] - 0.05, l[4] - 0.02, l[4] + 0.01]} top={200} escala={0.92} tachaA={[T.descartaste, T.laA + 0.12]} />
            </>
          ) : null}

          {esc === "fiado" ? (
            <>
              <Foto t={t} desde={l[5] + 0.05} src="tomas/v8-01/recorte-cuaderno.jpg" left={26} top={232} w={308} h={236} rot={-3} />
              <Numero t={t} T={T} top={96} size={64} />
              <Rotulo t={t} desde={restaVisible(2)} texto={`− ${ars(RESTAS[2].monto)} · ${RESTAS[2].rotulo}`} />
            </>
          ) : null}

          {esc === "qr" ? (
            <>
              <Foto t={t} desde={T.comision - 0.1} src="tomas/v8-01/recorte-qr.jpg" left={78} top={232} w={204} h={180} rot={4} />
              {t > T.comision + 0.15 ? <div style={{ left: 90, width: 182, top: 244 + (((t - T.comision) / 0.6) % 1) * 160, height: 4, borderRadius: 2, background: C.rojo, boxShadow: `0 0 12px ${C.rojo}`, transform: "rotate(4deg)" }} /> : null}
              <Numero t={t} T={T} top={96} size={64} />
              <Rotulo t={t} desde={restaVisible(3)} texto={`− ${ars(RESTAS[3].monto)} · ${RESTAS[3].rotulo}`} />
            </>
          ) : null}

          {esc === "silencio" ? (
            <>
              <div style={{ left: 30, top: 252, opacity: 0.35, filter: "grayscale(0.6)" }}><Kiosco w={300} t={t} persiana={0.7} /></div>
              <div style={{ inset: 0, background: `${C.verde}e6` }} />
              <Numero t={t} T={T} top={266} size={70} color={C.rosa} valor={QUEDA} />
            </>
          ) : null}

          {esc === "revela" ? (
            t < T.cree - 0.05 ? (
              <>
                <div style={{ inset: 0, background: `radial-gradient(circle at 50% 42%, ${C.rojo}${Math.round(20 + 18 * Math.abs(Math.sin(t * 5.2))).toString(16)} 0%, transparent 55%)` }} />
                <Caida t={t} desde={T.quedan} />
                <div style={{ left: 0, right: 0, top: 0, bottom: 0, transform: `scale(${latido(t - T.quedan, 0.55, 0.07)})`, transformOrigin: "50% 40%" }}>
                  <Numero t={t} T={T} top={206} size={74} color={C.rojo} valor={QUEDA} />
                </div>
                <Rotulo t={t} desde={T.quedan} texto="le queda por día (ejemplo)" top={300} />
              </>
            ) : (
              <Comparacion t={t} desde={T.cree - 0.05} />
            )
          ) : null}

          {esc === "truco" ? <Truco t={t} T={T} /> : null}

          {esc === "cierre" ? (
            <>
              <div style={{ left: 30, top: 252, transform: `scale(${1 + (t - l[8]) * 0.03}) translateY(${Math.sin(t * 2.2) * 2}px)`, transformOrigin: "50% 100%" }}><Kiosco w={300} t={t} /><div style={{ left: 196, top: 128 }}><Kiosquero w={62} t={t} /></div></div>
              <Entrando t={t} desde={l[8] + 0.2} />
              <div style={{ left: 0, right: 0, top: 120, textAlign: "center", transform: `scale(${Math.min(1.05, spring(t - l[8], 15, 0.5)) * latido(t, 0.62, 0.04)}) rotate(${-2 + Math.sin(t * 4.4) * 1.6}deg)` }}>
                <span style={{ position: "static", display: "inline-block", padding: "7px 16px", borderRadius: 12, background: C.rojo, color: "#fff", font: `800 28px ${DISP}`, boxShadow: `0 5px 0 ${C.tinta}` }}>¿CUÁNTO LE QUEDA?</span>
              </div>
              {t >= T.probalo - 0.1 ? <Probalo s={Math.min(1.05, spring(t - (T.probalo - 0.1), 15, 0.45)) * latido(t - T.probalo, 0.6, 0.05)} /> : null}
            </>
          ) : null}

          {["merc", "alq", "fiado", "qr"].includes(esc) ? <Vuelo t={t} T={T} /> : null}
        </>
      }
      sobre={musica}
    />
  );
};

/** Lluvia lenta de billetes que se escurren (lo que no queda). */
const Caida: React.FC<{ t: number; desde: number }> = ({ t, desde }) => (
  <>
    {Array.from({ length: 10 }, (_, i) => {
      const d = t - (desde + i * 0.3);
      if (d < 0 || d > 1.6) return null;
      return (
        <div key={i} style={{ left: 30 + rnd(i + 3) * 280, top: 330 + d * 120, opacity: 0.55 * (1 - d / 1.6), transform: `rotate(${d * 90 + i * 30}deg)` }}>
          <Billete w={30} />
        </div>
      );
    })}
  </>
);

/** Botón de cierre (texto de 17 px lógicos = 51 px reales). */
const Probalo: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ left: 30, right: 30, top: 196, padding: "12px 10px", borderRadius: 999, background: C.ambar, textAlign: "center", font: `800 17px ${BODY}`, color: C.tinta, boxShadow: `0 6px 0 ${C.tinta}`, opacity: Math.min(1, s), transform: `scale(${0.85 + 0.15 * s})` }}>
    <span style={{ position: "static" }}>Probalo 14 días gratis · link en el perfil</span>
  </div>
);

/** Pantalla partida: lo que cree (verde, más chico) contra lo que le queda (rojo, más grande). La B se tacha. */
const Comparacion: React.FC<{ t: number; desde: number }> = ({ t, desde }) => {
  const sA = Math.min(1.06, spring(t - desde, 15, 0.5));
  const sB = Math.min(1.1, spring(t - desde - 0.12, 14, 0.42));
  const tacha = entra((t - desde - 0.35) / 0.15);
  return (
    <div style={{ inset: 0 }}>
      <div style={{ left: 14, top: 120, width: 158, height: 300, borderRadius: 20, background: "#e7f3eb", border: `3px solid ${C.hoja}`, transform: `translateX(${(1 - Math.min(1, sA)) * -200}px)` }}>
        <div style={{ left: 0, right: 0, top: 22, textAlign: "center", font: `800 17px/1.15 ${BODY}`, color: C.verde }}>LO QUE CREE</div>
        <div style={{ left: 10, right: 10, top: 64, height: 76, borderRadius: 38, background: "#fff", border: `3px solid ${C.hoja}` }} />
        <div style={{ left: 64, top: 142, width: 14, height: 14, borderRadius: 7, background: "#fff", border: `3px solid ${C.hoja}` }} />
        <div style={{ left: 0, right: 0, top: 82, textAlign: "center", font: `800 34px ${DISP}`, color: C.hoja, letterSpacing: "-.02em" }}>{ars(50000)}</div>
        <div style={{ left: 22, right: 22, top: 98, height: 8, borderRadius: 4, background: C.rojo, transform: `rotate(-6deg) scaleX(${tacha})`, transformOrigin: "0 50%" }} />
        <div style={{ left: 44, top: 170, transform: `translateY(${Math.sin(t * 2) * 2}px)` }}><Kiosquero w={70} t={t} ceno={entra((t - desde - 0.35) / 0.3)} /></div>
        <div style={{ left: 0, right: 0, top: 254, textAlign: "center", transform: `translateX(${t > desde + 0.35 ? Math.sin((t - desde) * 40) * 3 * Math.max(0, 1 - (t - desde - 0.35)) : 0}px) rotate(${Math.sin(t * 6) * 4}deg)` }}><span style={{ position: "static", display: "inline-block", width: 38, height: 38, borderRadius: 10, background: C.verde, font: `800 22px/38px ${DISP}`, color: C.ambar }}>B</span></div>
      </div>
      <div style={{ left: 182, top: 104, width: 166, height: 332, borderRadius: 20, background: C.rojo, boxShadow: `0 8px 0 ${C.tinta}`, transform: `translateX(${(1 - Math.min(1, sB)) * 220}px) scale(${(0.9 + 0.1 * sB) * latido(t - desde, 0.55, 0.04)})` }}>
        <div style={{ left: 0, right: 0, top: 22, textAlign: "center", font: `800 17px/1.15 ${BODY}`, color: "#fff" }}>LO QUE LE QUEDA</div>
        <div style={{ left: 0, right: 0, top: 128, textAlign: "center", font: `800 42px ${DISP}`, color: "#fff", letterSpacing: "-.03em" }}>{ars(QUEDA)}</div>
        <div style={{ left: 0, right: 0, top: 182, textAlign: "center", font: `600 16px ${BODY}`, color: "#ffffffdd" }}>(ejemplo)</div>
      </div>
    </div>
  );
};

void win;
void I;
