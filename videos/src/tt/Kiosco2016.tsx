import React from "react";
import { Html5Audio, OffthreadVideo, Sequence, getStaticFiles, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { guionSchema } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Celular, Marco, camaraBeats, temblor, type Cam2D } from "../v6/comun";
import { entra, latido, sp } from "../v8/comun";
import { C } from "../v8/iconos";
import dialogo from "../../public/voces/tt-05/dialogo.json";

// TT-05 "Tu kiosco: 2016 vs 2026" (videos/guiones/TT-05-2016-VS-2026.md). Trend "2026 es el nuevo 2016" + dosis de realidad.
// Pantalla partida: arriba 2016 (sepia, VHS), abajo 2026 (saturado). 5 comparaciones, re-gancho, giro (el cuaderno), app 2 s.
// Voz: narrador Orus en frases sueltas (guiones/dialogos/tt-05.json); la línea de tiempo sale de lo que dura cada frase.

const g = guionSchema.parse({ id: "tt-05", titulo: "2016 vs 2026", duracionSeg: 30, voz: null, ganchos: [{ lineas: ["", "", ""], voz: "" }], lineas: [], sonidos: [] });
const FR = dialogo.frases as Record<string, { dur: number }>;
const d = (id: string) => FR[id]?.dur ?? 2;
const TEXTO: Record<string, string> = {
  n1: "2026 es el nuevo 2016… menos para tu kiosco.", n2: "Antes te pagaban con billete. Hoy con QR… y el QR se queda una parte.",
  n3: "Antes vendías golosinas. Hoy vendés de todo… y no sabés qué te deja plata.", n4: "Antes llevaban tres cosas. Hoy, una.",
  n5: "Y la quinta es la que más duele.", n6: "Antes fiabas a dos. Hoy, volvió el fiado.",
  n7: "En 10 años, si abrís 12 horas por día, pasaste más tiempo en el kiosco que durmiendo.", n8: "Y lo único que no cambió en 10 años… es el cuaderno.", n9: "En 2026, le hablás.",
};
const VOCES = ["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9"];

function armar() {
  const T: Record<string, number> = {};
  let c = 0.1;
  const at = (id: string, min = 0, aire = 0.28) => { const s = Math.max(min, c); T[id] = s; c = s + d(id) + aire; return s; };
  at("n1", 0.1, 0.35);
  T.tacha = T.n1 + d("n1") * 0.5;
  for (const id of ["n2", "n3", "n4", "n5", "n6", "n7", "n8"]) at(id, 0, id === "n7" ? 0.45 : 0.3);
  at("n9", 0, 0.2);
  T.app = T.n9 - 0.25;
  T.cierre = Math.max(c + 1.3, T.app + 2.4);
  T.fin = T.cierre + 2.8;
  // segunda mitad de cada comparación ("Hoy…")
  T.hoy2 = T.n2 + d("n2") * 0.42; T.hoy3 = T.n3 + d("n3") * 0.42; T.hoy4 = T.n4 + d("n4") * 0.6; T.hoy6 = T.n6 + d("n6") * 0.5;
  return T;
}
const T = armar();
export const DUR_TT05 = T.fin;
const LOOP = T.fin - 0.27;
const ROJO = "#ff3b30", AMARILLO = "#ffcc00";

// ---------- piezas ----------
const Fachada: React.FC<{ t: number; viejo: boolean }> = ({ t, viejo }) => (
  <svg width="300" height="230" viewBox="0 0 300 230">
    <rect x="20" y="60" width="260" height="170" fill={viejo ? "#f3d9a4" : "#3a3f47"} />
    {Array.from({ length: 10 }, (_, i) => <rect key={i} x={10 + i * 28} y="30" width="28" height="36" fill={i % 2 ? "#fff" : viejo ? "#2e8b57" : "#7a1f1f"} />)}
    <path d="M10 66 Q24 78 38 66 Q52 78 66 66 Q80 78 94 66 Q108 78 122 66 Q136 78 150 66 Q164 78 178 66 Q192 78 206 66 Q220 78 234 66 Q248 78 262 66 Q276 78 290 66" fill="none" stroke={viejo ? "#2e8b57" : "#7a1f1f"} strokeWidth="4" />
    <rect x="40" y="96" width="140" height="100" rx="4" fill={viejo ? "#fff8e7" : "#1b1e22"} stroke="#222" strokeWidth="4" />
    {Array.from({ length: 12 }, (_, i) => <rect key={i} x={50 + (i % 6) * 21} y={112 + Math.floor(i / 6) * 38} width="15" height="24" rx="3" fill={viejo ? ["#e53935", "#fdd835", "#43a047", "#1e88e5"][i % 4] : "#444"} />)}
    <rect x="196" y="96" width="64" height="134" fill={viejo ? "#8d6e63" : "#222"} stroke="#222" strokeWidth="4" />
    <text x="150" y="22" textAnchor="middle" style={{ font: `900 20px ${DISP}` }} fill={viejo ? "#2e8b57" : "#888"}>KIOSCO</text>
    {!viejo ? <rect x="40" y="96" width="140" height="100" fill="url(#rayas)" opacity="0.0" /> : null}
    {viejo ? [0, 1, 2].map((i) => <circle key={i} cx={60 + i * 70 + Math.sin(t * 2 + i) * 6} cy="215" r="10" fill="#5d4037" opacity=".8" />) : null}
  </svg>
);

const Billete: React.FC<{ w: number; mordido?: number }> = ({ w, mordido = 0 }) => (
  <svg width={w} height={w * 0.5} viewBox="0 0 120 60">
    <path d={`M2 2 H118 V58 H${2 + 30 * mordido} Q${10 + 20 * mordido} ${50 - 10 * mordido} 2 ${58 - 26 * mordido} Z`} fill="#8bc34a" stroke="#33691e" strokeWidth="3" />
    <circle cx="60" cy="30" r="13" fill="#c5e1a5" stroke="#33691e" strokeWidth="2.5" />
    <text x="60" y="35" textAnchor="middle" style={{ font: `900 14px ${DISP}` }} fill="#33691e">$</text>
  </svg>
);

const QR: React.FC<{ t: number; s: number }> = ({ t, s }) => (
  <svg width={90 * s} height={90 * s} viewBox="0 0 21 21" style={{ background: "#fff", borderRadius: 6, padding: 3 }}>
    {Array.from({ length: 441 }, (_, i) => {
      const x = i % 21, y = Math.floor(i / 21);
      const esquina = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      const on = esquina ? (x % 6 === 0 || y % 6 === 0 || (x % 7 > 1 && x % 7 < 5 && y % 7 > 1 && y % 7 < 5) || x === 20 || y === 20 || x === 14 || y === 14) : ((x * 7 + y * 13 + x * y) % 3 === 0);
      return on ? <rect key={i} x={x} y={y} width="1" height="1" fill="#111" /> : null;
    })}
    <rect x="0" y={((t * 12) % 21)} width="21" height="0.6" fill={ROJO} opacity=".7" />
  </svg>
);

const Item: React.FC<{ tipo: number; s?: number }> = ({ tipo, s = 1 }) => {
  const c = ["#e53935", "#fdd835", "#1e88e5", "#43a047", "#8e24aa", "#fb8c00"][tipo % 6];
  return <div style={{ position: "relative", width: 34 * s, height: 46 * s, borderRadius: 6, background: c, border: "3px solid #0005" }} />;
};

/** Cuaderno de fiados (renglones con nombres). `explota` 0..1 lo llena y le saca páginas volando. */
const Cuaderno: React.FC<{ t: number; nombres: number; explota?: number; w?: number }> = ({ t, nombres, explota = 0, w = 190 }) => {
  const NOM = ["Juan", "la vecina", "Carlos", "Marta", "el de la moto", "Rubén", "la profe", "el sobrino", "'el viernes'"];
  return (
    <div style={{ position: "relative", width: w, height: w * 0.72 }}>
      {explota > 0 ? Array.from({ length: 8 }, (_, i) => {
        const k = ((t * 0.9 + i * 0.13) % 1) * explota;
        return <div key={i} style={{ left: w * 0.3 + Math.sin(i * 2.1) * 30 + k * (i % 2 ? 140 : -140), top: -k * 120 + (i % 3) * 10, width: w * 0.4, height: w * 0.5, background: "#fdfbf3", border: "1px solid #9cc3e6", transform: `rotate(${k * 300 + i * 40}deg)`, opacity: 1 - k * 0.7 }} />;
      }) : null}
      <div style={{ inset: 0, borderRadius: 8, background: "repeating-linear-gradient(#fdfbf3 0 18px, #9cc3e6 18px 19px)", boxShadow: "0 8px 16px #0007", border: "2px solid #d7d2c4" }} />
      <div style={{ left: 22, top: 0, bottom: 0, width: 2, background: "#ff8a8a" }} />
      {NOM.slice(0, nombres).map((n, i) => (
        <div key={i} style={{ left: 30, right: 10, top: 2 + i * 19 * (w / 190), font: `700 ${15 * (w / 190)}px "Caveat", ${BODY}`, color: "#1a3d8f", whiteSpace: "nowrap" }}>
          <span style={{ position: "static" }}>{n}</span><span style={{ position: "absolute", right: 0, color: "#c0392b" }}>debe</span>
        </div>
      ))}
    </div>
  );
};

const Reloj: React.FC<{ t: number; k: number; color: string; rebalsa?: boolean }> = ({ t, k, color, rebalsa = false }) => (
  <svg width="90" height="130" viewBox="0 0 90 130" style={{ overflow: "visible" }}>
    <path d="M10 6 H80 M10 124 H80" stroke="#6d4c41" strokeWidth="8" strokeLinecap="round" />
    <path d="M16 10 Q16 50 45 65 Q74 50 74 10 Z M16 120 Q16 80 45 65 Q74 80 74 120 Z" fill="#ffffff22" stroke="#fff" strokeWidth="3" />
    <path d={`M${45 - 27 * (1 - k)} ${10 + 50 * k} Q45 ${62} ${45 + 27 * (1 - k)} ${10 + 50 * k} Z`} fill={color} opacity={1 - k} />
    <path d={`M20 120 Q20 ${120 - 50 * k} 45 ${120 - 52 * k} Q70 ${120 - 50 * k} 70 120 Z`} fill={color} />
    {k > 0.02 && k < 1 ? <rect x="44" y="62" width="2" height={58 - 52 * k} fill={color} /> : null}
    {rebalsa ? Array.from({ length: 6 }, (_, i) => <circle key={i} cx={45 + Math.sin(t * 6 + i) * 30} cy={124 + ((t * 60 + i * 9) % 40)} r="3" fill={color} />) : null}
  </svg>
);

// ---------- composición ----------
export const Kiosco2016: React.FC<VideoProps> = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const loop = t >= LOOP;
  const tw = loop ? 0 : t;
  const enApp = tw >= T.app && tw < T.cierre;
  const freeze = tw >= T.n5 - 0.1 && tw < T.n6 - 0.15;
  const giro = tw >= T.n8 - 0.15 && tw < T.app;

  // qué comparación está en pantalla
  const esc = tw < T.n2 - 0.15 ? 0 : tw < T.n3 - 0.15 ? 1 : tw < T.n4 - 0.15 ? 2 : tw < T.n6 - 0.15 ? 3 : tw < T.n7 - 0.15 ? 4 : tw < T.n8 - 0.15 ? 5 : 6;
  const inicioEsc = [0, T.n2, T.n3, T.n4, T.n6, T.n7, T.n8][esc] - 0.15;
  const desliz = esc === 0 ? 0 : 1 - entra((tw - inicioEsc) / 0.35);

  const mitad = (arriba: boolean, contenido: React.ReactNode) => (
    <div style={{ left: 0, right: 0, top: arriba ? 0 : 320, height: 320, overflow: "hidden" }}>
      <div style={{ inset: 0, background: arriba ? "radial-gradient(circle at 50% 40%, #ffe0a3, #c99a5b 75%)" : "radial-gradient(circle at 50% 40%, #2b3440, #0d1117 80%)" }} />
      <div style={{ inset: 0, transform: `translateX(${desliz * (arriba ? 380 : -380)}px)`, filter: arriba ? "sepia(0.55) saturate(0.85) contrast(0.95) brightness(1.04)" : "saturate(1.25) contrast(1.05)" }}>{contenido}</div>
      {arriba ? (
        <>
          <div style={{ inset: 0, background: "repeating-linear-gradient(#0000 0 3px, #0000000d 3px 4px)", transform: `translateY(${(t * 40) % 4}px)` }} />
          <div style={{ right: 14, bottom: 12, font: `700 15px "Courier New", monospace`, color: "#ff9d3b", textShadow: "0 0 4px #ff6a00" }}>NOV 24 2016</div>
          <div style={{ left: 14, top: 12, font: `700 14px "Courier New", monospace`, color: "#fff", opacity: Math.sin(t * 4) > 0 ? 1 : 0.4 }}>▶ PLAY</div>
        </>
      ) : null}
      <div style={{ left: 12, top: arriba ? 286 : 8, padding: "2px 10px", borderRadius: 6, background: arriba ? "#c99a5b" : ROJO, border: "2px solid #000", font: `900 18px ${DISP}`, color: arriba ? "#3e2723" : "#fff" }}>{arriba ? "2016" : "2026"}</div>
    </div>
  );

  // contenido de cada comparación
  const tt = tw;
  let arriba: React.ReactNode = null, abajo: React.ReactNode = null;
  if (esc === 0) {
    arriba = <div style={{ left: 30, top: 60 }}><Fachada t={tt} viejo /></div>;
    abajo = <div style={{ left: 30, top: 60, opacity: 0.85 }}><Fachada t={tt} viejo={false} /></div>;
  } else if (esc === 1) {
    const k = clamp((tt - T.n2 - 0.2) / 1.0, 0, 1);
    arriba = <div style={{ left: 40 + k * 140, top: 120 + Math.sin(k * Math.PI) * -40, transform: `rotate(${-10 + k * 20}deg)` }}><Billete w={120} /></div>;
    const m = entra((tt - T.hoy2 - 0.6) / 0.25);
    abajo = (
      <>
        <div style={{ left: 50, top: 90, transform: `scale(${sp(tt - T.hoy2 + 0.2, 1.08)})` }}><QR t={tt} s={1.2} /></div>
        <div style={{ left: 190, top: 120 - m * 6, transform: `rotate(${-6 + Math.sin(tt * 9) * 3 * m}deg)` }}><Billete w={130} mordido={m} /></div>
        {m > 0.3 ? <div style={{ left: 190, top: 210, transform: `scale(${sp(tt - T.hoy2 - 0.7, 1.15)})`, padding: "3px 10px", borderRadius: 8, background: ROJO, font: `900 16px ${BODY}`, color: "#fff" }}>COMISIÓN −%</div> : null}
      </>
    );
  } else if (esc === 2) {
    arriba = <div style={{ left: 60, top: 140, display: "flex", gap: 22 }}>{[0, 1, 2].map((i) => <div key={i} style={{ position: "relative", transform: `translateY(${Math.sin(tt * 2 + i) * 3}px)` }}><Item tipo={i} s={1.3} /></div>)}</div>;
    const n = Math.min(14, Math.floor((tt - T.hoy3) / 0.08) + 1);
    const etiquetas = ["SUBE", "LUZ", "RECARGA", "GAS", "PAPELERÍA", "HIELO", "PAN"];
    abajo = (
      <>
        {Array.from({ length: Math.max(0, n) }, (_, i) => (
          <div key={i} style={{ left: 30 + (i * 53) % 290, top: 70 + Math.floor(i / 6) * 60 + (i % 3) * 8, transform: `rotate(${(i % 5) * 7 - 14}deg) scale(${sp(tt - T.hoy3 - i * 0.08, 1.15)})` }}>
            {i % 2 ? <div style={{ position: "relative", padding: "6px 8px", borderRadius: 6, background: ["#1565c0", "#f9a825", "#6a1b9a", "#00838f"][i % 4], color: "#fff", font: `900 13px ${BODY}` }}>{etiquetas[i % etiquetas.length]}</div> : <Item tipo={i} />}
          </div>
        ))}
        {tt > T.hoy3 + 0.9 ? <div style={{ left: 0, right: 0, top: 250, textAlign: "center", transform: `scale(${sp(tt - T.hoy3 - 0.9, 1.15) * latido(tt, 0.4, 0.05)})` }}><span style={{ position: "static", padding: "4px 12px", borderRadius: 8, background: AMARILLO, color: C.tinta, font: `900 20px ${DISP}` }}>¿CUÁL TE DEJA PLATA?</span></div> : null}
      </>
    );
  } else if (esc === 3) {
    const k = entra((tt - T.n4 - 0.3) / 0.6);
    arriba = (
      <div style={{ left: 90, top: 80 + k * 20 }}>
        <div style={{ position: "relative", width: 150, height: 150, borderRadius: "10px 10px 30px 30px", background: "#fff", border: "4px solid #999" }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ left: 14 + i * 42, top: -30 + (i % 2) * 8 }}><Item tipo={i} /></div>)}
        </div>
      </div>
    );
    const v = entra((tt - T.hoy4) / 0.5);
    abajo = (
      <>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ left: 70 + i * 80 + (i < 2 ? -v * 0 : 0), top: 110 - (i === 2 ? v * 30 : 0), opacity: i < 2 ? 1 - v * 0.75 : 1, transform: `translateX(${i < 2 ? -v * 40 : 0}px) scale(${i === 2 ? 1 + v * 0.3 : 1})` }}><Item tipo={i} s={1.3} /></div>
        ))}
        {v > 0.5 ? <div style={{ left: 16, right: 16, top: 230, textAlign: "center", transform: `scale(${sp(tt - T.hoy4 - 0.3, 1.12)})` }}><span style={{ position: "static", display: "inline-block", padding: "4px 10px", borderRadius: 8, background: "#fff", color: C.tinta, font: `900 15px/1.2 ${BODY}`, border: `3px solid ${ROJO}` }}>2 DE CADA 3 ARGENTINOS RECORTAN GASTOS<br /><span style={{ position: "static", font: `700 11px ${BODY}`, color: "#666" }}>Ámbito, nov. 2026</span></span></div> : null}
      </>
    );
  } else if (esc === 4) {
    arriba = <div style={{ left: 85, top: 90, transform: `rotate(-3deg)` }}><Cuaderno t={tt} nombres={2} /></div>;
    const v = entra((tt - T.hoy6) / 0.4);
    abajo = (
      <>
        <div style={{ left: 85, top: 90, transform: `rotate(3deg) scale(${1 + v * 0.08 + Math.sin(tt * 18) * 0.01 * v})` }}><Cuaderno t={tt} nombres={Math.round(2 + v * 7)} explota={v} /></div>
        {v > 0.4 ? <div style={{ left: 0, right: 0, top: 250, textAlign: "center", transform: `scale(${sp(tt - T.hoy6 - 0.2, 1.15)}) rotate(-3deg)` }}><span style={{ position: "static", display: "inline-block", padding: "4px 12px", borderRadius: 8, background: ROJO, color: "#fff", font: `900 18px ${DISP}` }}>VOLVIÓ EL FIADO <span style={{ position: "static", font: `700 11px ${BODY}` }}>· UKRA</span></span></div> : null}
      </>
    );
  } else if (esc === 5) {
    const k = clamp((tt - T.n7 - 0.2) / Math.max(1, d("n7") - 0.4), 0, 1);
    const dormir = Math.round(25550 * Math.min(1, k * 1.15)), mostrador = Math.round(43800 * k);
    arriba = (
      <>
        <div style={{ left: 40, top: 80 }}><Reloj t={tt} k={Math.min(1, k * 0.58)} color="#7986cb" /></div>
        <div style={{ left: 140, top: 95, font: `900 13px ${BODY}`, color: "#3e2723" }}>DORMISTE</div>
        <div style={{ left: 140, top: 116, font: `900 34px ${DISP}`, color: "#3e2723", fontVariantNumeric: "tabular-nums" }}>{dormir.toLocaleString("es-AR")} h</div>
      </>
    );
    abajo = (
      <>
        <div style={{ left: 40, top: 60, transform: `scale(${k >= 1 ? latido(tt, 0.3, 0.06) : 1})` }}><Reloj t={tt} k={k} color={ROJO} rebalsa={k >= 1} /></div>
        <div style={{ left: 140, top: 75, font: `900 13px ${BODY}`, color: "#fff" }}>DETRÁS DEL MOSTRADOR</div>
        <div style={{ left: 140, top: 96, font: `900 34px ${DISP}`, color: "#ff6b6b", fontVariantNumeric: "tabular-nums" }}>{mostrador.toLocaleString("es-AR")} h</div>
        <div style={{ left: 140, top: 140, font: `700 12px ${BODY}`, color: "#ffffffaa" }}>12 h × 365 × 10 años</div>
      </>
    );
  }

  // giro: las dos mitades se juntan sobre el mismo cuaderno
  const junta = giro ? entra((tw - T.n8 - d("n8") * 0.45) / 0.5) : 0;

  let escena: React.ReactNode;
  if (enApp) {
    escena = (
      <>
        <div style={{ inset: 0, background: `radial-gradient(circle at 50% 45%, #1e6b46, ${C.verde} 70%)` }} />
        <Celular t={tw} sp={sp(tw - T.app, 1.04, 13, 0.55)} left={85} top={140}>
          <Sequence from={Math.round(T.app * fps)} layout="none">
            <OffthreadVideo src={staticFile("tomas/fb-01/app.mp4")} startFrom={Math.round(10.6 * 30)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} />
          </Sequence>
        </Celular>
      </>
    );
  } else if (giro) {
    escena = (
      <>
        <div style={{ inset: 0, background: `linear-gradient(#c99a5b ${50 - junta * 50}%, #0d1117 ${50 + junta * 50}%)` }} />
        <div style={{ left: 85, top: 90 + junta * 120, filter: `sepia(${0.55 * (1 - junta)})`, opacity: 1 - junta * 0.5 }}><Cuaderno t={tw} nombres={3} /></div>
        <div style={{ left: 85, top: 410 - junta * 200 }}><Cuaderno t={tw} nombres={3} /></div>
        {junta < 1 ? <div style={{ left: 0, right: 0, top: 318, height: 4, background: "#000", opacity: 1 - junta }} /> : null}
      </>
    );
  } else if (tw >= T.cierre || loop) {
    escena = <>{mitad(true, <div style={{ left: 30, top: 60 }}><Fachada t={tw} viejo /></div>)}{mitad(false, <div style={{ left: 30, top: 60, opacity: 0.85 }}><Fachada t={tw} viejo={false} /></div>)}<div style={{ left: 0, right: 0, top: 318, height: 4, background: "#000" }} /></>;
  } else {
    escena = <>{mitad(true, arriba)}{mitad(false, abajo)}<div style={{ left: 0, right: 0, top: 318, height: 4, background: "#000" }} />{freeze ? <div style={{ inset: 0, background: "#000", opacity: 0.5 }} /> : null}</>;
  }

  // ---------- textos ----------
  const hablando = VOCES.find((id) => tw >= T[id] && tw < T[id] + d(id) + 0.1);
  const frente = (
    <>
      {tw < T.n2 - 0.15 ? (
        <div style={{ left: 0, right: 0, top: 248, textAlign: "center", transform: `scale(${Math.min(1.1, sp(tw + 0.15, 1.12)) * latido(tw, 0.5, 0.03)}) rotate(-3deg)` }}>
          <span style={{ position: "relative", display: "inline-block", padding: "7px 14px", borderRadius: 12, background: "#fff", color: C.tinta, font: `900 27px/1.05 ${DISP}`, boxShadow: "0 6px 0 #000" }}>
            2026 ES EL NUEVO 2016…
            {tw > T.tacha ? <span style={{ position: "absolute", left: 8, top: "48%", height: 5, width: `${entra((tw - T.tacha) / 0.25) * 92}%`, background: ROJO, borderRadius: 3, transform: "rotate(-4deg)" }} /> : null}
          </span>
          {tw > T.tacha + 0.1 ? <div style={{ position: "relative", marginTop: 10, transform: `scale(${sp(tw - T.tacha - 0.1, 1.15)}) rotate(5deg)` }}><span style={{ position: "static", display: "inline-block", padding: "5px 12px", borderRadius: 10, background: ROJO, color: "#fff", font: `900 24px ${DISP}`, boxShadow: "0 5px 0 #000" }}>MENOS PARA TU KIOSCO</span></div> : null}
        </div>
      ) : null}
      {freeze ? (
        <div style={{ left: 30, right: 30, top: 250 }}>
          <div style={{ left: 0, right: 0, top: 0, textAlign: "center", font: `900 30px/1.1 ${DISP}`, color: "#fff", textShadow: "0 4px 0 #000", transform: `scale(${sp(tw - T.n5, 1.12)})` }}>LA 5 ES LA QUE<br /><span style={{ position: "static", color: AMARILLO }}>MÁS DUELE</span></div>
          <div style={{ left: 20, right: 20, top: 92, height: 14, borderRadius: 7, background: "#333", border: "2px solid #fff", overflow: "hidden" }}><div style={{ left: 0, top: 0, bottom: 0, width: `${clamp((tw - T.n5) / Math.max(0.6, d("n5")), 0, 1) * 100}%`, background: AMARILLO }} /></div>
          <div style={{ left: 0, right: 0, top: 112, textAlign: "center", font: `800 12px ${BODY}`, color: "#fff" }}>cargando 4 de 5…</div>
        </div>
      ) : null}
      {esc >= 1 && esc <= 5 && !freeze && !giro && !enApp && tw < T.cierre ? (
        <div style={{ right: 12, top: 330, width: 34, height: 34, borderRadius: 17, background: AMARILLO, border: "3px solid #000", textAlign: "center", font: `900 20px/28px ${DISP}`, color: C.tinta, transform: `scale(${sp(tw - inicioEsc, 1.25)})` }}>{esc}</div>
      ) : null}
      {giro && junta > 0.3 ? (
        <div style={{ left: 0, right: 0, top: 120, textAlign: "center", transform: `scale(${sp(tw - T.n8 - d("n8") * 0.45 - 0.2, 1.12)}) rotate(-2deg)` }}>
          <span style={{ position: "static", display: "inline-block", padding: "6px 14px", borderRadius: 10, background: AMARILLO, color: C.tinta, font: `900 22px/1.1 ${DISP}`, boxShadow: "0 5px 0 #000" }}>LO ÚNICO QUE NO CAMBIÓ<br />EN 10 AÑOS</span>
        </div>
      ) : null}
      {enApp ? (
        <div style={{ left: 0, right: 0, top: 52, textAlign: "center", transform: `scale(${sp(tw - T.app, 1.1)}) rotate(-2deg)` }}>
          <span style={{ position: "static", display: "inline-block", padding: "6px 14px", borderRadius: 10, background: AMARILLO, color: C.tinta, font: `900 21px/1.1 ${DISP}`, boxShadow: "0 5px 0 #000" }}>2026: LE HABLÁS Y TE DICE<br />CUÁNTO TE QUEDÓ</span>
        </div>
      ) : null}
      {tw >= T.cierre ? (
        <>
          <div style={{ left: 0, right: 0, top: 250, textAlign: "center", transform: `scale(${sp(tw - T.cierre, 1.15) * latido(tw, 0.45, 0.04)}) rotate(-2deg)` }}>
            <span style={{ position: "static", display: "inline-block", padding: "8px 14px", borderRadius: 12, background: ROJO, color: "#fff", font: `900 24px/1.1 ${DISP}`, boxShadow: "0 5px 0 #000" }}>¿EN QUÉ AÑO ABRISTE<br />TU KIOSCO? COMENTALO ↓</span>
          </div>
          <div style={{ left: 20, right: 20, top: 350, textAlign: "center", transform: `scale(${sp(tw - T.cierre - 0.7, 1.12)})` }}>
            <span style={{ position: "static", display: "inline-block", padding: "6px 12px", borderRadius: 10, background: "#fff", color: C.tinta, font: `900 16px/1.15 ${BODY}`, boxShadow: "0 4px 0 #000" }}>Mandáselo al que tiene kiosco desde 2016</span>
          </div>
          <div style={{ left: 0, right: 0, top: 604, textAlign: "center", font: `800 13px ${BODY}`, color: "#fff" }}>En Claro · link en el perfil</div>
        </>
      ) : null}
      {hablando && !loop && tw >= T.n2 - 0.15 ? (
        <div style={{ left: 14, right: 14, top: enApp ? 556 : giro ? 520 : 556, textAlign: "center" }}>
          <span style={{ position: "static", display: "inline-block", padding: "5px 10px", borderRadius: 10, background: "#000d", border: `2px solid ${AMARILLO}`, font: `900 15px/1.2 ${DISP}`, color: "#fff" }}>{TEXTO[hablando]}</span>
        </div>
      ) : null}
    </>
  );

  // ---------- sonido ----------
  const archivos = getStaticFiles().map((f) => f.name);
  const inicios = [T.n2, T.n3, T.n4, T.n6, T.n7, T.n8].map((x) => x - 0.15);
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "rebobinado", vol: 0.35 }, { en: 0.05, sfx: "thump", vol: 0.5 }, { en: T.tacha, sfx: "rayon", vol: 0.5 }, { en: T.tacha + 0.1, sfx: "slam", vol: 0.45 },
    ...inicios.flatMap((a) => [{ en: a - 0.05, sfx: "whoosh", vol: 0.45 }, { en: a + 0.25, sfx: "click", vol: 0.35 }]),
    { en: T.n2 + 0.3, sfx: "caja", vol: 0.4 }, { en: T.hoy2 + 0.1, sfx: "ding", vol: 0.35 }, { en: T.hoy2 + 0.6, sfx: "tijera", vol: 0.5 },
    ...Array.from({ length: 10 }, (_, i) => ({ en: T.hoy3 + i * 0.08, sfx: "tic", vol: 0.3 })), { en: T.hoy3 + 0.9, sfx: "glitch", vol: 0.35 },
    { en: T.hoy4, sfx: "papel", vol: 0.4 }, { en: T.hoy4 + 0.5, sfx: "piano_grave", vol: 0.35 },
    { en: T.n5 - 0.1, sfx: "rebobinado", vol: 0.5 }, ...Array.from({ length: 6 }, (_, i) => ({ en: T.n5 + i * 0.25, sfx: "tic", vol: 0.3 })),
    { en: T.hoy6, sfx: "hoja", vol: 0.5 }, { en: T.hoy6 + 0.15, sfx: "papel_arrancado", vol: 0.45 }, { en: T.hoy6 + 0.3, sfx: "sello", vol: 0.5 },
    ...Array.from({ length: 12 }, (_, i) => ({ en: T.n7 + 0.2 + i * 0.32, sfx: "reloj", vol: 0.3 })), { en: T.n7 + d("n7") - 0.2, sfx: "slam", vol: 0.5 },
    { en: T.n8 + d("n8") * 0.45, sfx: "riser", vol: 0.4 }, { en: T.n8 + d("n8") * 0.45 + 0.5, sfx: "thump", vol: 0.55 },
    { en: T.app, sfx: "whoosh", vol: 0.45 }, { en: T.app + 0.8, sfx: "ding", vol: 0.5 }, { en: T.cierre, sfx: "slam", vol: 0.45 },
  ];
  const musica = (
    <>
      {VOCES.filter((id) => archivos.includes(`voces/tt-05/${id}.mp3`)).map((id) => (
        <Sequence key={id} from={Math.round(T[id] * fps)} durationInFrames={Math.round(6 * fps)} layout="none">
          <Html5Audio src={staticFile(`voces/tt-05/${id}.mp3`)} volume={1} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={Math.round((T.n5 - 0.1) * fps)} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} loop volume={(f) => 0.09 * Math.min(1, Math.max(0, (T.n5 - 0.1) * fps - f) / 3)} />
      </Sequence>
      <Sequence from={Math.round((T.n6 - 0.15) * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round((T.n6 - 0.15) * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} loop volume={(f) => 0.09 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  const beats = [0.02, T.tacha, ...inicios, T.hoy2 + 0.6, T.hoy3, T.hoy3 + 0.9, T.hoy4, T.n5, T.hoy6, T.n7 + 1, T.n7 + 2, T.n7 + d("n7") - 0.2, T.n8 + d("n8") * 0.45 + 0.5, T.app, T.cierre];
  const cam: Cam2D = freeze ? { z: 1.05, rot: -1.5, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : beats, loop ? [] : [T.app, T.cierre], 0.8);
  const hs = loop ? 0 : temblor(t, [[0.05, 8], [T.tacha + 0.1, 9], [T.hoy2 + 0.6, 7], [T.hoy6 + 0.3, 9], [T.n7 + d("n7") - 0.2, 10], [T.n8 + d("n8") * 0.45 + 0.5, 10]]);
  let wf = 0;
  if (!loop) [[0.02, 0.3], ...inicios.map((a) => [a, 0.12]), [T.app, 0.2]].forEach(([a, f]) => { const dd = t - a; if (dd >= 0 && dd < 0.15) wf += f * (1 - dd / 0.15); });

  return (
    <Marco
      g={g} voz={null} pal={[]} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={loop ? [] : sonidos} ocultos={[]}
      fondo={escena}
      frente={frente}
      sobre={musica}
      filtro={freeze ? "saturate(0.15) contrast(1.1)" : undefined}
    />
  );
};
