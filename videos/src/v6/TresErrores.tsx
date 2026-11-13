import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { I, clamp, eIn, eIO, eOut, lin, rnd, spring, win } from "../lib/anim";
import { BODY, DISP, MARKER } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V4_02, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import { TextoCinetico } from "../escenas/Dolor";
import { Pildora, useFuentesListas } from "../v3/ElDueno";
import type { VideoProps } from "../Video";
import { BotonProbalo, Celular, ControlCamaraRoll, GanchoGigante, LogoEnClaro, Marco, W, camaraBeats, camaraClaves, lineasDeVoz, temblor, type Clave } from "./comun";
import { Fachada, Persiana, XS } from "./ModelosPersianas";

// V4-02 "3 errores que cierran kioscos": tres persianas con un 3, un 2 y un 1 (la del 1 tapada con lona).
// Loop abierto: el error uno queda tapado hasta que la voz lo dice; el truco es la foto a la factura; el final deja una cuarta persiana tapada.

const g = GUION_V4_02;
type V3 = [number, number, number];

function tiempos(pal: Palabra[]) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e,
    tres: w(1, "tres", l[1] + 0.3), prev: w(1, "preventista", l[1] + 2.6), vende: w(1, "vende", e[1] - 0.5),
    dos: w(2, "dos", l[2] + 0.3), fiar: w(2, "fiar", l[2] + 1.0), fecha: w(2, "fecha", e[2] - 0.6),
    uno: w(3, "uno", l[3] + 0.3), hoy: w(3, "hoy", l[3] + 1.8), abriste: w(3, "abriste", e[3] - 0.6),
    vender: w(4, "vender", l[4]), semana: w(4, "semana", l[4] + 1.6), pasada: w(4, "pasada", l[4] + 2.2), prov: w(4, "proveedor", l[4] + 3.0), aumento: w(4, "aument", l[4] + 3.7), vos: w(4, "vos", e[4] - 0.5),
    foto: w(5, "foto", l[5] + 0.5), factura: w(5, "factura", l[5] + 1.0), cuanto: w(5, "cuánto", l[5] + 3.0), hoy2: w(5, "hoy", e[5] - 0.5),
    mas: w(6, "más", l[6] + 1.2), nadie: w(6, "nadie", l[6] + 2.0), manana: w(6, "mañana", l[6] + 2.5),
  };
}
type T = ReturnType<typeof tiempos>;

/** Sube la persiana en `a`, la deja arriba hasta `b` y la baja de golpe. */
const sube = (t: number, a: number, b: number, tope = 0.62) => I(t, a, a + 0.55, 0, tope, eOut) * (1 - I(t, b, b + 0.14, 0, 1, eIn));

function estadoPersianas(t: number, T_: T, dur: number) {
  const final = I(t, T_.l[5] + 0.9, T_.l[5] + 1.6, 0, 0.55, eOut) * (1 - I(t, T_.l[6] - 0.3, T_.l[6], 0, 0.6, eIO));
  const a3 = Math.max(sube(t, T_.prev - 0.6, T_.e[1] - 0.15), 0);
  const a2 = Math.max(sube(t, T_.fiar - 0.5, T_.e[2] - 0.15), 0);
  const tear = I(t, T_.vender + 0.15, T_.vender + 1.0, 0, 1, eIn);
  return { a3: Math.max(a3, t > T_.l[5] ? final : 0), a2: Math.max(a2, t > T_.l[5] ? final : 0), a1: t > T_.l[5] ? final : 0, tear, dur };
}

function claves(T_: T, dur: number): Clave[] {
  const c = (t: number, pos: V3, target: V3, fov: number, roll = 0): Clave => ({ t, pos, target, fov, roll });
  return [
    c(0, [0, 2.0, 10.6], [0, 1.9, 0], 50),
    c(1.8, [0.1, 1.95, 8.6], [0, 1.9, 0], 50),
    c(T_.l[1] - 0.2, [0, 1.95, 8.3], [0, 1.9, 0], 50),
    c(T_.l[1] + 0.4, [-1.5, 1.7, 4.6], [-1.7, 1.7, 0], 48, 0.05),
    c(T_.e[1] + 0.1, [-1.7, 1.7, 4.2], [-1.7, 1.7, 0], 46, 0.02),
    c(T_.l[2] + 0.35, [0.2, 1.7, 4.6], [0, 1.7, 0], 48, -0.05),
    c(T_.e[2] + 0.1, [0, 1.7, 4.2], [0, 1.7, 0], 46, -0.02),
    c(T_.l[3] + 0.1, [1.2, 1.8, 7.0], [1.7, 1.8, 0], 48),
    c(T_.e[3] - 0.1, [1.7, 1.8, 3.3], [1.7, 1.8, 0], 42),
    c(T_.l[4] + 0.2, [1.7, 1.8, 4.6], [1.7, 1.8, 0], 46, 0.04),
    c(T_.e[4], [1.2, 1.9, 5.6], [1.7, 1.9, 0], 46),
    c(T_.l[5] + 0.2, [0.6, 2.4, 9.2], [1.1, 2.5, 0], 50),
    c(T_.l[6] - 0.2, [0.3, 2.2, 9.4], [0, 2.0, 0], 50),
    c(T_.l[6] + 1.0, [3.9, 1.9, 6.4], [3.4, 1.8, 0], 46, -0.05),
    c(dur + 1, [3.5, 1.9, 5.6], [3.4, 1.8, 0], 44),
  ];
}

const Escena3D: React.FC<{ t: number; T_: T; dur: number; listo: boolean }> = ({ t, T_, dur, listo }) => {
  const c = camaraClaves(t, claves(T_, dur));
  c.pos = [c.pos[0] + Math.sin(t * 0.8) * 0.06, c.pos[1] + Math.sin(t * 1.2) * 0.04, c.pos[2]];
  const e = estadoPersianas(t, T_, dur);
  const golpe = (a: number) => (t > a ? Math.exp(-14 * (t - a)) * Math.abs(Math.sin((t - a) * 40)) : 0);
  const latido = (t - T_.l[3]) > 0 && t < T_.vender ? Math.abs(Math.sin((t - T_.l[3]) * 5.2)) ** 6 : 0;
  const luzV = t > T_.l[5] + 0.9 && t < T_.l[6] - 0.1 ? "#9dffc0" : "#ffcf7a";
  const brillo = t > T_.l[5] + 0.9 && t < T_.l[6] - 0.1 ? 1.0 : 0.5;
  const sacude = t > T_.l[6] + 0.4 ? 0.02 * Math.sin(t * 22) * Math.exp(-3 * Math.max(0, t - T_.l[6] - 1.0)) : 0;
  return (
    <>
      <ControlCamaraRoll c={c} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#9fb4ff", "#2a2118", 0.5]} />
      <directionalLight position={[-3, 7, 9]} intensity={2.2} color="#ffe9c9" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-3} />
      <pointLight position={[0, 4.5, 4]} intensity={10 + latido * 30} distance={14} color={latido > 0.3 ? "#ff4d5a" : "#ffd9a0"} />
      <Fachada />
      <Persiana x={XS[0]} abre={e.a3} modo="3" golpe={golpe(T_.e[1] - 0.15 + 0.14)} t={t} listo={listo} luz={luzV} luzInt={brillo} />
      <Persiana x={XS[1]} abre={e.a2} modo="2" golpe={golpe(T_.e[2] - 0.15 + 0.14)} t={t} listo={listo} luz={luzV} luzInt={brillo} />
      <Persiana x={XS[2]} abre={e.a1} modo={e.tear > 0.01 || t > T_.vender ? "msg" : "1"} lona="1" tearP={e.tear} t={t + latido * 0} listo={listo} luz={luzV} luzInt={brillo} y={0} />
      <group position={[sacude, 0, 0]}>
        <Persiana x={XS[3]} abre={0} modo="?" lona="?" tearP={0} t={t} listo={listo} />
      </group>
    </>
  );
};

// ---------- capas 2D ----------
const Etiqueta: React.FC<{ t: number; a: number; b: number; txt: string; sub?: string; color?: string }> = ({ t, a, b, txt, sub, color = "#FFB703" }) => {
  const o = win(t, a, b, 0.1, 0.2);
  if (o <= 0) return null;
  const s = Math.min(1.1, spring(t - a, 16, 0.42));
  return (
    <div style={{ left: 16, top: 62, opacity: o, transform: `scale(${0.5 + 0.5 * s}) rotate(-2deg)`, transformOrigin: "0 0" }}>
      <div style={{ position: "relative", display: "inline-block", padding: "6px 14px", borderRadius: 12, background: color, color: "#1A1200", font: `900 26px/1 ${DISP}`, letterSpacing: "-.01em", boxShadow: "0 6px 0 #0008" }}>{txt}</div>
      {sub ? <div style={{ position: "static", marginTop: 6, font: `800 12px ${BODY}`, letterSpacing: ".1em", color: "#fff", textShadow: "0 2px 0 #000" }}>{sub}</div> : null}
    </div>
  );
};

const Dormido: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.prev, T_.e[1] + 0.1, 0.15, 0.2);
  if (o <= 0) return null;
  const v = I(t, T_.prev, T_.vende, 0, 37800, eOut);
  const s = Math.min(1.08, spring(t - T_.prev, 13, 0.5));
  return (
    <div style={{ left: 16, right: 16, top: 128, opacity: o, transform: `scale(${s})`, transformOrigin: "50% 0" }}>
      <div style={{ position: "relative", padding: "8px 12px 10px", borderRadius: 16, background: "#14110dee", border: "2px solid #FF4D5A", textAlign: "center", boxShadow: "0 10px 26px #000a, 0 0 26px #FF4D5A55" }}>
        <div style={{ position: "static", font: `800 11px ${BODY}`, letterSpacing: ".14em", color: "#ffffffbb" }}>MERCADERÍA DORMIDA</div>
        <div style={{ position: "static", font: `800 40px/1.05 ${DISP}`, color: "#FF4D5A", fontVariantNumeric: "tabular-nums", textShadow: "0 3px 0 #000" }}>{ars(v)}</div>
        <div style={{ position: "static", font: `400 13px ${BODY}`, color: "#ffffffaa", fontStyle: "italic" }}>ejemplo</div>
      </div>
    </div>
  );
};

const Fiados: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.fiar - 0.1, T_.e[2] + 0.05, 0.12, 0.2);
  if (o <= 0) return null;
  const filas = ["Doña Marta", "Juan", "Rosa"];
  return (
    <div style={{ inset: 0, opacity: o }}>
      {filas.map((n, i) => {
        const a = T_.fiar + 0.1 + i * 0.28;
        const s = Math.min(1, spring(t - a, 14, 0.6));
        const estira = I(t, a + 0.2, T_.fecha + 0.4, 0, 1, eOut);
        const ancho = 120 + estira * 190 + Math.sin(t * 6 + i * 2) * 5 * estira;
        return (
          <div key={i} style={{ left: 14, top: 130 + i * 70, width: Math.min(332, ancho), height: 52, borderRadius: 14, background: "#F4EBD3", boxShadow: "0 8px 0 #0006", transform: `translateX(${(1 - s) * -200}px) scaleY(${1 - estira * 0.18})`, transformOrigin: "0 50%", overflow: "hidden" }}>
            <div style={{ left: 12, top: 8, font: `400 24px/1 ${MARKER}`, color: "#1f3fbf", whiteSpace: "nowrap" }}>{n}</div>
            <div style={{ left: 12, top: 32, font: `400 15px/1 ${MARKER}`, color: "#FF2D3B", whiteSpace: "nowrap" }}>¿desde cuándo? ¿?</div>
          </div>
        );
      })}
      <div style={{ right: 16, top: 360, transform: `rotate(${-8 + Math.sin(t * 9) * 1.5}deg) scale(${Math.min(1.15, spring(t - T_.fecha, 15, 0.4))})`, border: "4px solid #FF4D5A", borderRadius: 10, padding: "4px 10px", color: "#FF4D5A", font: `900 24px ${DISP}`, background: "#000a" }}>SIN FECHA</div>
    </div>
  );
};

const Latido: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.l[3] + 0.05, T_.vender, 0.1, 0.1);
  if (o <= 0) return null;
  const p = Math.abs(Math.sin((t - T_.l[3]) * 5.2)) ** 6;
  return (
    <>
      <div style={{ inset: 0, background: `radial-gradient(circle at 50% 50%,transparent 38%,#FF4D5A${Math.round(p * 120 + 20).toString(16).padStart(2, "0")} 100%)`, opacity: o }} />
      <TextoCinetico t={t} desde={T_.uno - 0.1} paso={0.1} texto="Y el uno…" amarillas={[2]} style={{ left: 16, right: 10, top: 118, font: `900 46px/1 ${DISP}`, color: "#fff", opacity: o, textShadow: "0 5px 0 #000, 0 0 20px #000" }} />
    </>
  );
};

const PrecioViejo: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.semana - 0.1, T_.l[5] - 0.1, 0.12, 0.25);
  if (o <= 0) return null;
  const nuevo = t >= T_.aumento;
  const gl = Math.max(0, 1 - (t - T_.aumento) / 0.4);
  const s = Math.min(1.08, spring(t - (T_.semana - 0.1), 13, 0.5));
  const jx = nuevo ? Math.sin(t * 70) * 6 * gl : 0;
  return (
    <div style={{ left: 60, width: 240, top: 372, opacity: o, transform: `translateX(${jx}px) rotate(${5 - gl * 6}deg) scale(${s})` }}>
      {gl > 0 && nuevo ? <div style={{ inset: 0, background: "#FF4D5A", opacity: 0.4 * gl, mixBlendMode: "screen", borderRadius: 10, transform: "translateX(5px)" }} /> : null}
      <div style={{ position: "relative", borderRadius: 10, background: "#FFF8DC", color: "#1a1200", padding: "8px 12px", boxShadow: "0 10px 0 #0007", textAlign: "center", border: `3px solid ${nuevo ? "#FF2D3B" : "#1a1200"}` }}>
        <div style={{ position: "static", font: `800 11px ${BODY}`, letterSpacing: ".1em" }}>GASEOSA 500 · EJEMPLO</div>
        <div style={{ position: "static", font: `900 40px/1.05 ${DISP}`, textDecoration: nuevo ? "line-through" : "none", textDecorationColor: "#FF2D3B", textDecorationThickness: 5 }}>$2.000</div>
        {nuevo ? (
          <div style={{ position: "static", font: `900 15px ${DISP}`, color: "#FF2D3B", marginTop: 2, opacity: I(t, T_.aumento, T_.aumento + 0.2, 0, 1) }}>
            Hoy te la cobran {ars(2160)} (+8%)
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Truco: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.l[5] - 0.1, T_.l[6] + 0.05, 0.1, 0.3);
  if (o <= 0) return null;
  const sp = spring(t - (T_.l[5] - 0.2), 11, 0.55);
  const scan = I(t, T_.factura - 0.1, T_.factura + 1.3, 0, 1, lin);
  const ok = I(t, T_.cuanto - 0.2, T_.cuanto + 0.3, 0, 1);
  const items: [string, string, string][] = [["Gaseosa 500", "$2.000", "$2.160"], ["Galletitas", "$1.400", "$1.510"], ["Yerba 500 g", "$3.100", "$3.350"]];
  return (
    <div style={{ inset: 0, opacity: o }}>
      <Celular t={t} sp={sp} left={85} top={150}>
        <div style={{ left: 14, top: 32, font: `700 13px ${DISP}`, color: "#fff" }}>Factura del proveedor</div>
        <div style={{ left: 10, right: 10, top: 56, height: 150, borderRadius: 10, background: "#F4EBD3", padding: 8 }}>
          {items.map(([n, a], i) => (
            <div key={i} style={{ left: 8, right: 8, top: 10 + i * 30, height: 24, display: "flex", justifyContent: "space-between", font: `700 11px ${BODY}`, color: "#2a2418" }}>
              <span style={{ position: "static" }}>{n}</span>
              <span style={{ position: "static", color: "#b42318" }}>{a}</span>
            </div>
          ))}
          <div style={{ left: 0, right: 0, top: 4 + scan * 130, height: 3, background: "#34d399", boxShadow: "0 0 14px 4px #34d399aa", opacity: scan > 0 && scan < 1 ? 1 : 0 }} />
        </div>
        <div style={{ left: 14, top: 214, font: `700 12px ${DISP}`, color: "#fff", opacity: ok }}>Vendé hoy a:</div>
        {items.map(([n, , b], i) => {
          const s = Math.min(1, spring(t - T_.cuanto - 0.15 * i, 13, 0.6));
          const verde = I(t, T_.cuanto + 0.2 + 0.15 * i, T_.cuanto + 0.5 + 0.15 * i, 0, 1);
          return (
            <div key={i} style={{ left: 10, right: 10, top: 236 + i * 44, height: 38, borderRadius: 10, background: "#143723", border: `1px solid ${verde > 0.5 ? "#34d399" : "#ff4d5a"}`, padding: "6px 10px", opacity: s, transform: `translateX(${(1 - s) * 60}px)` }}>
              <span style={{ position: "static", font: `700 11px ${BODY}`, color: "#fff" }}>{n}</span>
              <span style={{ right: 10, top: 8, font: `800 15px ${DISP}`, color: verde > 0.5 ? "#5FD39A" : "#FF4D5A" }}>{b}</span>
            </div>
          );
        })}
        <div style={{ left: 10, right: 10, top: 372 - 8, font: `600 8px ${BODY}`, color: "#9DB8A8" }}>ejemplo</div>
      </Celular>
      <TextoCinetico t={t} desde={T_.foto - 0.1} paso={0.09} texto="Foto a la factura." amarillas={[2]} style={{ left: 16, right: 10, top: 66, font: `800 30px/1.05 ${DISP}`, color: "#fff", textShadow: "0 4px 0 #000" }} />
    </div>
  );
};

const Cliff: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.l[6] - 0.1, 9999, 0.2, 0.01);
  if (o <= 0) return null;
  const s = spring(t - (T_.manana - 0.1), 15, 0.4);
  const flecha = (Math.sin(t * 7) + 1) * 8;
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 220, background: "linear-gradient(#000d,transparent)" }} />
      <LogoEnClaro style={{ position: "absolute", left: 18, top: 62, opacity: Math.min(1, spring(t - T_.l[6], 12, 0.5)) }} />
      <TextoCinetico t={t} desde={T_.mas - 0.2} paso={0.09} texto="Un error más" amarillas={[2]} style={{ left: 16, right: 10, top: 112, font: `900 36px/1 ${DISP}`, color: "#fff", textShadow: "0 4px 0 #000" }} />
      <Pildora texto="PARTE 2 · MAÑANA" style={{ left: 16, top: 172, transform: `scale(${s}) rotate(-3deg)`, transformOrigin: "0 50%", fontSize: 18 }} />
      <div style={{ right: 26 - flecha, top: 300, font: `900 60px/1 ${DISP}`, color: "#FFB703", textShadow: "0 5px 0 #000", opacity: Math.min(1, s) }}>→</div>
      <BotonProbalo s={s} top={560} />
    </div>
  );
};

export const TresErrores: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const listo = useFuentesListas();
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T_ = tiempos(pal);

  const hs = temblor(t, [[0.05, 10], [T_.e[1] - 0.01, 12], [T_.e[2] - 0.01, 12], [T_.vender + 0.95, 16], [T_.foto, 6], [T_.aumento, 10], [T_.l[6] + 1.0, 8]]);
  let wf = t < 0.1 ? 0.3 : 0, red = 0;
  { const d = t - (T_.vender + 0.95); if (d >= 0) { wf += Math.max(0, 1 - d / 0.18) * 0.5; red += Math.max(0, 1 - d / 0.5); } }
  { const d = t - T_.aumento; if (d >= 0) red += Math.max(0, 1 - d / 0.4) * 0.7; }
  { const d = t - (T_.l[5] + 0.9); if (d >= 0) wf += Math.max(0, 1 - d / 0.2) * 0.25; }
  const beats = [0.45, 1.2, T_.tres, T_.prev, T_.vende, T_.dos, T_.fiar, T_.fecha, T_.uno, T_.hoy, T_.vender, T_.semana, T_.prov, T_.aumento, T_.vos, T_.foto, T_.cuanto, T_.mas, T_.manana];
  const cam = camaraBeats(t, beats, [T_.l[1], T_.l[2], T_.l[3], T_.l[4], T_.l[5], T_.l[6]]);

  const sonidos = [
    { en: 0.05, sfx: "slam" }, { en: 0.0, sfx: "whoosh" },
    ...[T_.l[1], T_.l[2], T_.l[3], T_.l[5], T_.l[6]].map((a) => ({ en: a - 0.12, sfx: "whoosh" })),
    { en: T_.prev - 0.6, sfx: "metal" }, { en: T_.fiar - 0.5, sfx: "metal" },
    { en: T_.e[1] - 0.15 + 0.14, sfx: "slam" }, { en: T_.e[1] - 0.15 + 0.14, sfx: "metal" },
    { en: T_.e[2] - 0.15 + 0.14, sfx: "slam" }, { en: T_.e[2] - 0.15 + 0.14, sfx: "metal" },
    { en: T_.dos + 0.1, sfx: "caja" }, { en: T_.fecha, sfx: "buzz" },
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ en: T_.l[3] + 0.1 + k * 0.6, sfx: "heart", vol: 0.45 })),
    { en: T_.vender - 0.3, sfx: "riser" }, { en: T_.vender + 0.15, sfx: "papel_arrancado" }, { en: T_.vender + 0.95, sfx: "slam" }, { en: T_.vender + 1.0, sfx: "thump" },
    { en: T_.aumento, sfx: "glitch" }, { en: T_.foto, sfx: "click" }, { en: T_.factura, sfx: "whoosh" },
    { en: T_.cuanto, sfx: "ding" }, { en: T_.cuanto + 0.3, sfx: "caja" }, { en: T_.l[5] + 0.9, sfx: "metal" },
    { en: T_.manana - 0.1, sfx: "ding" }, { en: T_.l[6] + 0.95, sfx: "rattle" },
  ];

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={red} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, T_.e[0] + 0.1], [T_.vender - 0.1, T_.vender + 0.8], [T_.l[6] + 2.4, 999]]}
      fondo={<div style={{ inset: 0, background: "linear-gradient(#0b1224,#1d2a3f 55%,#0f1620)" }} />}
      tres={<Escena3D t={t} T_={T_} dur={dur} listo={listo} />}
      frente={
        <>
          <GanchoGigante t={t} lineas={[...g.ganchos[0].lineas]} hasta={T_.e[0]} top={112} />
          {t < T_.l[1] + 0.6 ? <Pildora texto="KIOSQUERO:" style={{ left: 18, top: 62, transform: "rotate(-3deg)", opacity: win(t, -1, T_.l[1] + 0.5, 0.01, 0.4) }} /> : null}
          <Etiqueta t={t} a={T_.tres - 0.3} b={T_.e[1] + 0.1} txt="ERROR 3" />
          <Etiqueta t={t} a={T_.dos - 0.3} b={T_.e[2] + 0.1} txt="ERROR 2" />
          <Etiqueta t={t} a={T_.vender - 0.1} b={T_.l[5] - 0.1} txt="ERROR 1" color="#FF4D5A" />
          <Dormido t={t} T_={T_} />
          <Fiados t={t} T_={T_} />
          <Latido t={t} T_={T_} />
          <PrecioViejo t={t} T_={T_} />
          <Truco t={t} T_={T_} />
          <Cliff t={t} T_={T_} />
        </>
      }
    />
  );
};

void clamp;
void rnd;
