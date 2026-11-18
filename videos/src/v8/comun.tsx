import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import { clamp, eOut, spring } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { Celular } from "../v6/comun";
import { C } from "./iconos";

// Piezas comunes de la serie V8 "explicador financiero" (V8-02 en adelante; el V8-01 tiene las suyas adentro).
// Todo sale del tiempo t (determinista): el render se reparte en 10 máquinas.

/** Pulso corto cada `periodo` segundos (algo visible pasa siempre, regla de 0,7 s). */
export const latido = (t: number, periodo = 0.6, fuerza = 0.05) => 1 + fuerza * Math.pow(Math.abs(Math.sin((t / periodo) * Math.PI)), 12) * (t >= 0 ? 1 : 0);
/** Entrada expo (0 → 1). */
export const entra = (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(p, 0, 1)));
/** Resorte limitado (para escalas de entrada). */
export const sp = (dt: number, max = 1.06, w = 15, z = 0.5) => (dt < 0 ? 0 : Math.min(max, spring(dt, w, z)));
export const mezcla = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * clamp(k, 0, 1))).join(",")})`;
};
/** Formato con signo: −$64.900 */
export const conSigno = (v: number) => (v < 0 ? "−" + ars(-v) : ars(v));

export type Paso = { en: number; a: number };
/** Valor de un número que cambia por pasos: cada paso cuenta sus dígitos en `dur` s. */
export const valorPasos = (t: number, inicio: number, pasos: Paso[], dur = 0.42) =>
  pasos.reduce((v, p, i) => {
    const antes = i === 0 ? inicio : pasos[i - 1].a;
    return v + (p.a - antes) * eOut(clamp((t - p.en) / dur, 0, 1));
  }, inicio);

/** Número protagonista que cuenta dígito por dígito, con golpe al terminar cada paso. */
export const Numero: React.FC<{ t: number; v: number; pasos?: Paso[]; top: number; size: number; color: string; dur?: number; tapado?: boolean; left?: number; right?: number }> = ({ t, v, pasos = [], top, size, color, dur = 0.42, tapado = false, left = 0, right = 0 }) => {
  const rodando = pasos.some((p) => t > p.en && t < p.en + dur);
  const golpe = pasos.reduce((s, p) => s + (t > p.en + dur ? Math.exp(-10 * (t - p.en - dur)) * Math.sin((t - p.en - dur) * 30) * 0.07 : 0), 0);
  const txt = tapado ? "$???.???" : conSigno(Math.round(v / 10) * 10);
  return (
    <div style={{ left, right, top, textAlign: "center", transform: `scale(${(1 + golpe + 0.012 * Math.sin(t * 2.4)) * latido(t, 0.6, 0.035)})` }}>
      <span style={{ position: "static", font: `800 ${size}px/1 ${DISP}`, letterSpacing: "-.03em", color, fontVariantNumeric: "tabular-nums", filter: rodando ? "blur(0.8px)" : undefined, textShadow: "0 3px 0 #0f1f1722", whiteSpace: "nowrap" }}>
        {txt.split("").map((ch, i) => (
          <span key={i} style={{ position: "relative", display: "inline-block", transform: (rodando || tapado) && /[\d?]/.test(ch) ? `translateY(${Math.sin(t * (tapado ? 9 : 60) + i) * (tapado ? 2 : 3)}px)` : undefined }}>{ch}</span>
        ))}
      </span>
    </div>
  );
};

/** Etiqueta en mayúsculas sobre un número ("DEUDA", "ES TUYO"). */
export const Etiqueta: React.FC<{ texto: string; top: number; color?: string; fondo?: string; left?: number; right?: number; size?: number }> = ({ texto, top, color = "#fff", fondo = C.verde, left = 0, right = 0, size = 17 }) => (
  <div style={{ left, right, top, textAlign: "center" }}>
    <span style={{ position: "static", display: "inline-block", padding: "4px 12px", borderRadius: 8, background: fondo, color, font: `800 ${size}px ${BODY}`, letterSpacing: ".06em" }}>{texto}</span>
  </div>
);

/** Rótulo chico (pastilla blanca con borde). */
export const Rotulo: React.FC<{ t: number; desde: number; texto: string; top: number; color?: string; size?: number }> = ({ t, desde, texto, top, color = C.rojo, size = 17 }) => {
  if (t < desde - 0.05) return null;
  const s = sp(t - desde, 1.08, 16, 0.5);
  return (
    <div style={{ left: 0, right: 0, top, textAlign: "center", opacity: Math.min(1, s * 1.4), transform: `translateY(${(1 - Math.min(1, s)) * 14}px) scale(${0.9 + 0.1 * s})` }}>
      <span style={{ position: "static", display: "inline-block", padding: "5px 14px", borderRadius: 999, background: "#fff", border: `2.5px solid ${color}`, font: `700 ${size}px ${BODY}`, color: C.tinta, boxShadow: "0 4px 0 #0f1f1720" }}>{texto}</span>
    </div>
  );
};

/** Pastilla grande de color (títulos del gancho). */
export const Cartel: React.FC<{ texto: string; top: number; fondo?: string; color?: string; size?: number; s?: number; rot?: number }> = ({ texto, top, fondo = C.rojo, color = "#fff", size = 26, s = 1, rot = -2 }) => (
  <div style={{ left: 0, right: 0, top, textAlign: "center", transform: `scale(${s}) rotate(${rot}deg)`, opacity: Math.min(1, s * 1.3) }}>
    <span style={{ position: "static", display: "inline-block", padding: "7px 16px", borderRadius: 12, background: fondo, color, font: `800 ${size}px ${DISP}`, boxShadow: `0 5px 0 ${C.tinta}`, whiteSpace: "nowrap" }}>{texto}</span>
  </div>
);

/** Fondo de papel crema (o verde oscuro / noche), con textura que se mueve apenas y la franja de marca abajo. */
export const Fondo: React.FC<{ t: number; modo?: "papel" | "verde" | "noche" | "negro"; tinte?: string }> = ({ t, modo = "papel", tinte }) => {
  const bg = modo === "verde" ? `radial-gradient(circle at 50% 30%, #17573b, ${C.verde} 70%)`
    : modo === "noche" ? "radial-gradient(circle at 50% 30%, #23384a, #0d1822 75%)"
    : modo === "negro" ? "radial-gradient(circle at 50% 45%, #1d2a23, #070b09 75%)"
    : `radial-gradient(circle at 50% 28%, #fffaf0, ${C.crema} 60%, #f3e3bd)`;
  const claro = modo === "papel";
  return (
    <div style={{ inset: 0 }}>
      <div style={{ inset: 0, background: tinte ?? bg }} />
      <div style={{ inset: -20, opacity: claro ? 0.22 : 0.09, background: "repeating-linear-gradient(115deg, #0000 0 7px, #b2864818 7px 8px), repeating-linear-gradient(25deg, #0000 0 11px, #b2864812 11px 12px)", transform: `translate(${Math.sin(t * 0.7) * 4}px, ${Math.cos(t * 0.5) * 4}px)` }} />
      <div style={{ left: 0, right: 0, bottom: 0, height: 10, background: `repeating-linear-gradient(90deg, ${C.hoja} 0 26px, ${C.crema} 26px 52px)`, opacity: claro ? 1 : 0.6 }} />
    </div>
  );
};

/** Foto real como recorte de collage. */
export const Foto: React.FC<{ t: number; desde: number; src: string; left: number; top: number; w: number; h: number; rot: number }> = ({ t, desde, src, left, top, w, h, rot }) => {
  if (t < desde - 0.05) return null;
  const s = sp(t - desde, 1.06, 13, 0.5);
  return (
    <div style={{ left, top, width: w, height: h, padding: 6, background: "#fff", boxShadow: "0 12px 26px #0f1f1740", transform: `translateY(${(1 - Math.min(1, s)) * 160}px) rotate(${rot + (1 - Math.min(1, s)) * 8 + Math.sin(t * 1.3) * 0.6}deg) scale(${0.85 + 0.15 * s})` }}>
      <div style={{ left: 6, top: 6, right: 6, bottom: 6, overflow: "hidden" }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.04 + (t - desde) * 0.025})`, filter: "contrast(1.08) saturate(1.1) sepia(0.12) brightness(1.03)" }} />
      </div>
    </div>
  );
};

/** Botón de cierre. */
export const Probalo: React.FC<{ s: number; top?: number; texto?: string }> = ({ s, top = 196, texto = "Probalo 14 días gratis · link en el perfil" }) => (
  <div style={{ left: 30, right: 30, top, padding: "12px 10px", borderRadius: 999, background: C.ambar, textAlign: "center", font: `800 17px ${BODY}`, color: C.tinta, boxShadow: `0 6px 0 ${C.tinta}`, opacity: Math.min(1, s), transform: `scale(${0.85 + 0.15 * s})` }}>
    <span style={{ position: "static" }}>{texto}</span>
  </div>
);

/** Aro de marcador alrededor de una zona de la pantalla del celular (coordenadas de la pantalla: 174 × 384). */
export type Aro = { desde: number; hasta?: number; x: number; y: number; w: number; h: number; color?: string };

/**
 * Pantalla real de En Claro grabada (app/scripts/grabar-v8.cjs), dentro del celular.
 * `app0`: segundo del video en que arranca la grabación; `rate`: velocidad; al terminar queda la última imagen.
 * Las coordenadas de la grabación (px CSS de 360 × 780) pasan a la pantalla con `aPantalla`.
 */
export const AppGrabada: React.FC<{ t: number; carpeta: string; app0: number; rate: number; durGrab: number; entrada: number; aros?: Aro[]; zoom?: number; zoomY?: string; left?: number; top?: number }> = ({ t, carpeta, app0, rate, durGrab, entrada, aros = [], zoom = 1, zoomY = "30%", left = 85, top = 124 }) => {
  const { fps } = useVideoConfig();
  const s = sp(t - entrada, 1.04, 12, 0.55);
  const terminado = t >= app0 + durGrab / rate - 0.04;
  return (
    <div style={{ left, top, width: 190, height: 400, transform: `scale(${zoom})`, transformOrigin: `50% ${zoomY}` }}>
      <Celular t={t} sp={s} left={0} top={0}>
        <div style={{ inset: 0, background: C.papel }}>
          {t < app0 ? (
            <Img src={staticFile(`${carpeta}/app-inicio.jpg`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} />
          ) : !terminado ? (
            <Sequence from={Math.round(app0 * fps)} durationInFrames={Math.max(1, Math.round((durGrab / rate) * fps))} layout="none">
              <OffthreadVideo src={staticFile(`${carpeta}/app.mp4`)} playbackRate={rate} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} />
            </Sequence>
          ) : (
            <Img src={staticFile(`${carpeta}/app-final.jpg`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} />
          )}
          {aros.map((a, i) => {
            if (t < a.desde || (a.hasta !== undefined && t > a.hasta)) return null;
            const k = entra((t - a.desde) / 0.25);
            const sal = a.hasta !== undefined ? clamp((a.hasta - t) / 0.15, 0, 1) : 1;
            return <div key={i} style={{ left: a.x - 3, top: a.y - 3, width: a.w + 6, height: a.h + 6, borderRadius: 12, border: `3px solid ${a.color ?? C.ambar}`, boxShadow: `0 0 16px ${a.color ?? C.ambar}`, opacity: Math.min(1, k * 1.5) * sal, transform: `scale(${1.15 - 0.15 * k})` }} />;
          })}
        </div>
      </Celular>
    </div>
  );
};
/** px CSS de la grabación (360 × 780) → px de la pantalla del celular (la imagen cubre 384 de alto: ×0,4923, centrada en x). */
export const aPantalla = (x: number, y: number, w: number, h: number) => {
  const k = 384 / 780;
  return { x: x * k - (360 * k - 174) / 2, y: y * k, w: w * k, h: h * k };
};

/**
 * Ritmo de cámara atado a la voz: a los golpes elegidos a mano les suma el comienzo de cada palabra que caiga a más de `gap` s
 * de cualquier otro golpe (así nunca pasan más de ~0,7 s sin un cambio visible). `fuera`: tramos sin golpes (silencios, loop).
 */
export function ritmo(pal: { desde: number }[], manual: number[], fuera: [number, number][], gap = 0.62) {
  const golpes = [...manual].sort((a, b) => a - b);
  for (const p of [...pal].sort((a, b) => a.desde - b.desde)) {
    const s = p.desde;
    if (fuera.some(([a, b]) => s >= a && s <= b)) continue;
    if (golpes.every((b) => Math.abs(b - s) >= gap)) golpes.push(s);
  }
  return golpes.sort((a, b) => a - b);
}

/** Billetes que viajan en arco de (x0, y0) a (x1, y1), uno cada `cada` s desde `desde` (plata que entra o que se va). */
export const Billetes: React.FC<{ t: number; desde: number; hasta?: number; x0: number; y0: number; x1: number; y1: number; cada?: number; vuelo?: number; alto?: number }> = ({ t, desde, hasta = 999, x0, y0, x1, y1, cada = 0.36, vuelo = 0.75, alto = 90 }) => {
  const n = Math.ceil((Math.min(hasta, t) - desde) / cada) + 1;
  const desdeK = Math.max(0, Math.floor((t - desde - vuelo) / cada));
  const out: React.ReactNode[] = [];
  for (let i = desdeK; i < n; i++) {
    const d = t - (desde + i * cada);
    if (d < 0 || d > vuelo || desde + i * cada > hasta) continue;
    const k = d / vuelo;
    out.push(
      <div key={i} style={{ left: x0 + (x1 - x0) * k + (i % 3) * 6, top: y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * alto + (i % 2) * 12, opacity: Math.min(1, (1 - k) * 4, k * 6), transform: `rotate(${k * 280 + i * 47}deg) scale(${1 - k * 0.35})` }}>
        <svg width={54} height={27} viewBox="0 0 80 40"><rect x="2" y="2" width="76" height="36" rx="5" fill="#7cc79a" stroke={C.tinta} strokeWidth="3" /><circle cx="40" cy="20" r="9" fill={C.hoja} stroke={C.tinta} strokeWidth="2.5" /></svg>
      </div>,
    );
  }
  return <>{out}</>;
};
