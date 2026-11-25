import React from "react";
import { Html5Audio, Sequence, getStaticFiles, staticFile } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { entra, sp } from "../v8/comun";

// Kit de motion graphics 2D para TikTok (TT-06 en adelante): tipografía cinética, glitch, monitor cardíaco, contadores, CTA.
// Paleta fija negro / amarillo / rojo. Todo depende solo de t (render repartido en 10 máquinas).

export const NEGRO = "#0b0b0d", AMARILLO = "#ffd400", ROJO = "#ff2a2a", BLANCO = "#ffffff", VERDE_WA = "#25d366";

/** Línea de tiempo atada a la voz: cada frase empieza cuando termina la anterior (+ aire). */
export function lineaDeVoz(durs: Record<string, { dur: number }>, ids: string[], aire: Record<string, number> = {}, aireBase = 0.14) {
  const d = (id: string) => durs[id]?.dur ?? 1.5;
  const T: Record<string, number> = {};
  let c = 0.08;
  for (const id of ids) { T[id] = c; c += d(id) + (aire[id] ?? aireBase); }
  return { T, fin: c, d };
}

/** Las voces del diálogo como audio, solo las que ya existen (en el contenedor de Claude todavía no hay). */
export const Voces: React.FC<{ carpeta: string; T: Record<string, number>; ids: string[]; fps: number }> = ({ carpeta, T, ids, fps }) => {
  const archivos = getStaticFiles().map((f) => f.name);
  return (
    <>
      {ids.filter((id) => archivos.includes(`voces/${carpeta}/${id}.mp3`)).map((id) => (
        <Sequence key={id} from={Math.round(T[id] * fps)} durationInFrames={Math.round(6 * fps)} layout="none">
          <Html5Audio src={staticFile(`voces/${carpeta}/${id}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </>
  );
};

/** Música de pulso con cortes de silencio [desde, hasta]. */
export const Pulso: React.FC<{ fps: number; fin: number; silencios: [number, number][]; vol?: number }> = ({ fps, fin, silencios, vol = 0.1 }) => {
  const tramos: [number, number][] = [];
  let a = 0;
  for (const [s0, s1] of [...silencios].sort((x, y) => x[0] - y[0])) { if (s0 > a) tramos.push([a, s0]); a = Math.max(a, s1); }
  if (fin > a) tramos.push([a, fin]);
  return (
    <>
      {tramos.map(([x, y], i) => (
        <Sequence key={i} from={Math.round(x * fps)} durationInFrames={Math.max(1, Math.round((y - x) * fps))} layout="none">
          <Html5Audio src={staticFile("sfx/pulso.wav")} loop volume={(f) => vol * Math.min(1, f / 4, Math.max(0, (y - x) * fps - f) / 3)} />
        </Sequence>
      ))}
    </>
  );
};

/** Fondo plano de color con rayas diagonales que corren y viñeta. */
export const Fondo: React.FC<{ t: number; color: string; rayas?: boolean }> = ({ t, color, rayas = true }) => (
  <div style={{ inset: 0, background: color }}>
    {rayas ? <div style={{ inset: -80, background: "repeating-linear-gradient(-45deg, #ffffff00 0 26px, #ffffff0d 26px 52px)", transform: `translateX(${(t * 40) % 73.5}px)` }} /> : null}
    <div style={{ inset: 0, background: "radial-gradient(circle at 50% 45%, #0000 40%, #0007 100%)" }} />
  </div>
);

/** Palabra que cae de golpe (escala, desenfoque y rebote), con glitch RGB opcional. */
export const Golpe: React.FC<{ t: number; desde: number; texto: string; top: number; size?: number; color?: string; fondo?: string; glitch?: boolean; rot?: number; peso?: number; tiembla?: number }> = ({ t, desde, texto, top, size = 64, color = BLANCO, fondo, glitch = false, rot = 0, peso = 900, tiembla = 0 }) => {
  const d = t - desde;
  if (d < 0) return null;
  const s = d < 0.1 ? 2.3 - d * 13 : 1 + Math.exp(-11 * (d - 0.1)) * Math.sin((d - 0.1) * 42) * 0.07;
  const blur = Math.max(0, 10 - d * 110);
  const g = glitch && (d < 0.45 || Math.sin(t * 9.3) > 0.93);
  const dx = g ? 3 + Math.round(Math.abs(Math.sin(t * 77)) * 5) : 0;
  const jx = tiembla ? Math.sin(t * 61) * tiembla : 0, jy = tiembla ? Math.cos(t * 53) * tiembla : 0;
  return (
    <div style={{ left: 0, right: 0, top, textAlign: "center", transform: `translate(${jx}px, ${jy}px) scale(${s}) rotate(${rot}deg)`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined, opacity: Math.min(1, d * 14) }}>
      <span style={{ position: "static", display: "inline-block", padding: fondo ? "2px 14px 4px" : 0, background: fondo, font: `${peso} ${size}px/0.95 ${DISP}`, color, letterSpacing: "-0.02em", textTransform: "uppercase", textShadow: g ? `${dx}px 0 ${ROJO}, ${-dx}px 0 #00e5ff` : "0 6px 0 #0006" }}>{texto}</span>
    </div>
  );
};

/** Raya roja que tacha una palabra (de izquierda a derecha). */
export const Tacha: React.FC<{ t: number; desde: number; top: number; ancho: number; alto?: number }> = ({ t, desde, top, ancho, alto = 9 }) => {
  const k = entra((t - desde) / 0.18);
  if (k <= 0) return null;
  return <div style={{ left: 180 - ancho / 2, top, width: ancho * k, height: alto, background: ROJO, borderRadius: 4, transform: "rotate(-6deg)", boxShadow: "0 3px 0 #0006" }} />;
};

/** Monitor cardíaco que cruza la pantalla. `pulso` en latidos por minuto; `plano` desde ese segundo, línea plana. */
export const Monitor: React.FC<{ t: number; pulso: number; top: number; alto?: number; color?: string; plano?: number; revive?: number }> = ({ t, pulso, top, alto = 110, color = "#39ff88", plano, revive }) => {
  const muerto = plano !== undefined && t >= plano && (revive === undefined || t < revive);
  const pts: string[] = [];
  const latidos = 2.2;
  for (let x = 0; x <= 360; x += 2) {
    const fase = ((x / 360) * latidos - (t * pulso) / 60) % 1;
    const f = fase < 0 ? fase + 1 : fase;
    let y = 0;
    if (!muerto) {
      if (f > 0.42 && f < 0.46) y = -(f - 0.42) / 0.04 * 0.25;
      else if (f >= 0.46 && f < 0.5) y = -0.25 + ((f - 0.46) / 0.04) * 1.25;
      else if (f >= 0.5 && f < 0.54) y = 1 - ((f - 0.5) / 0.04) * 1.6;
      else if (f >= 0.54 && f < 0.58) y = -0.6 + ((f - 0.54) / 0.04) * 0.6;
      else if (f > 0.68 && f < 0.8) y = -Math.sin(((f - 0.68) / 0.12) * Math.PI) * 0.18;
    }
    pts.push(`${x},${(alto / 2 - y * alto * 0.42).toFixed(1)}`);
  }
  return (
    <svg width="360" height={alto} viewBox={`0 0 360 ${alto}`} style={{ left: 0, top, overflow: "visible" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={muerto ? ROJO : color} strokeWidth="4" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${muerto ? ROJO : color})` }} />
      <text x="350" y="18" textAnchor="end" style={{ font: `900 22px ${DISP}` }} fill={muerto ? ROJO : color}>{muerto ? "0" : Math.round(pulso)} ♥</text>
    </svg>
  );
};

/** Momentos de "bip" del monitor (para el sonido): uno por latido entre desde y hasta. */
export const bips = (desde: number, hasta: number, pulso: number, vol = 0.3) => {
  const out: { en: number; sfx: string; vol: number }[] = [];
  for (let a = desde; a < hasta; a += 60 / pulso) out.push({ en: a, sfx: "beep", vol });
  return out;
};

export const fmt = (v: number) => "$" + Math.round(v).toLocaleString("es-AR");

/** Número que corre de `de` a `a` entre desde y desde+dur, con desenfoque mientras corre. */
export const Contador: React.FC<{ t: number; desde: number; de: number; a: number; dur?: number; top: number; size?: number; color?: string; redondeo?: number }> = ({ t, desde, de, a, dur = 0.8, top, size = 72, color = BLANCO, redondeo = 1000 }) => {
  if (t < desde - 0.05) return null;
  const k = entra((t - desde) / dur);
  const v = Math.round((de + (a - de) * k) / redondeo) * redondeo;
  const corriendo = k > 0 && k < 1;
  return (
    <div style={{ left: 0, right: 0, top, textAlign: "center", transform: `scale(${sp(t - desde, 1.08)})` }}>
      <span style={{ position: "static", font: `900 ${size}px ${DISP}`, color, fontVariantNumeric: "tabular-nums", textShadow: "0 6px 0 #0007", filter: corriendo ? "blur(1.2px)" : undefined }}>{fmt(v)}</span>
    </div>
  );
};

/** Chip chico (número de "forma", rótulo). */
export const Chip: React.FC<{ t: number; desde: number; texto: string; top: number; fondo?: string; color?: string; size?: number }> = ({ t, desde, texto, top, fondo = BLANCO, color = NEGRO, size = 18 }) => {
  if (t < desde) return null;
  return (
    <div style={{ left: 0, right: 0, top, textAlign: "center", transform: `scale(${sp(t - desde, 1.15)})` }}>
      <span style={{ position: "static", display: "inline-block", padding: "4px 12px", borderRadius: 8, background: fondo, color, font: `900 ${size}px ${BODY}`, letterSpacing: ".04em" }}>{texto}</span>
    </div>
  );
};

/** Flash blanco (desfibrilador, golpes). */
export const Flash: React.FC<{ t: number; en: number; fuerza?: number }> = ({ t, en, fuerza = 0.9 }) => {
  const d = t - en;
  if (d < 0 || d > 0.25) return null;
  return <div style={{ inset: 0, background: "#fff", opacity: fuerza * (1 - d / 0.25) }} />;
};

/** Cierre de anuncio: botón de WhatsApp grande. */
export const CtaWhatsApp: React.FC<{ t: number; desde: number }> = ({ t, desde }) => {
  if (t < desde) return null;
  const s = sp(t - desde, 1.1);
  const late = 1 + 0.04 * Math.sin((t - desde) * 8);
  return (
    <>
      <div style={{ left: 30, right: 30, top: 380, height: 86, borderRadius: 43, background: VERDE_WA, boxShadow: "0 8px 0 #0a6b32", transform: `scale(${s * late})`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <svg width="40" height="40" viewBox="0 0 32 32" style={{ position: "static" }}><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3z" fill="#fff" /><path d="M11.5 9.5c.4-.9 1-.9 1.4-.9h1c.3 0 .7 0 1 .8l1 2.4c.1.3.1.6-.1.9l-.7.9c-.2.3-.3.5 0 .9.9 1.5 2.1 2.6 3.7 3.4.3.2.6.1.8-.1l1-1.2c.3-.3.6-.3.9-.2l2.4 1.1c.4.2.6.4.6.7 0 .9-.3 1.9-1.2 2.5-.9.6-2.4.9-4.5 0-2.6-1.1-5-3.3-6.3-5.9-1.1-2.1-.7-3.9-.1-4.9z" fill={VERDE_WA} /></svg>
        <span style={{ position: "static", font: `900 26px ${DISP}`, color: "#fff" }}>ESCRIBIME</span>
      </div>
      <div style={{ left: 0, right: 0, top: 486, textAlign: "center", font: `800 17px ${BODY}`, color: BLANCO, opacity: clamp((t - desde - 0.4) / 0.3, 0, 1) }}>14 días gratis · te muestro cómo funciona</div>
    </>
  );
};

/** Subtítulo de lo que se dice (para quien mira sin sonido). */
export const Sub: React.FC<{ texto?: string; top?: number }> = ({ texto, top = 560 }) =>
  texto ? (
    <div style={{ left: 16, right: 16, top, textAlign: "center" }}>
      <span style={{ position: "static", display: "inline-block", padding: "5px 10px", borderRadius: 10, background: "#000c", border: `2px solid ${AMARILLO}`, font: `800 16px/1.2 ${BODY}`, color: BLANCO }}>{texto}</span>
    </div>
  ) : null;
