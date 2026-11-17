import React from "react";
import { I, clamp, eOut, rnd, spring, win } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";

// Rompe-patrones de la serie V7 "Rompe-esquemas" (videos/referencia/DIRECCION-V7.md, sección 5).
// Todo se dibuja en el lienzo lógico de 360 × 640 y se calcula desde el tiempo `t` (segundos): sin estado ni azar sin semilla.

/** Curvas de la personalidad "Enérgica": entradas expo-out, salidas rápidas. */
export const entra = (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(p, 0, 1)));
export const sale = (p: number) => {
  const x = clamp(p, 0, 1);
  return x * x * x * x;
};

/** Mapea el tiempo real a un tiempo de imagen que va de `de` a `a` entre `t0` y `t1` (sirve para rebobinar o ir en cámara lenta). */
export const remapear = (t: number, t0: number, t1: number, de: number, a: number, ease: (p: number) => number = (p) => p) =>
  de + (a - de) * ease(clamp((t - t0) / (t1 - t0), 0, 1));

// ---------------------------------------------------------------------------------------------
// Congelado: el cuadro se congela, se desatura, rayón de disco e ícono ‖ gigante.
// ---------------------------------------------------------------------------------------------
export const Congelado: React.FC<{ t: number; desde: number; hasta: number }> = ({ t, desde, hasta }) => {
  const o = win(t, desde - 0.01, hasta, 0.02, 0.08);
  if (o <= 0) return null;
  const dt = t - desde;
  const raya = entra(dt / 0.12);
  const sp = Math.min(1.12, spring(dt - 0.05, 16, 0.42));
  const pts = Array.from({ length: 9 }, (_, i) => `${-10 + i * 48},${80 + i * 58 + (rnd(i + 3) - 0.5) * 30}`).join(" ");
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ inset: 0, backdropFilter: "grayscale(0.9) contrast(1.2) brightness(0.8)", WebkitBackdropFilter: "grayscale(0.9) contrast(1.2) brightness(0.8)", background: "#0003" }} />
      <svg width={360} height={640} style={{ left: 0, top: 0 }}>
        <polyline points={pts} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray={900} strokeDashoffset={900 * (1 - raya)} opacity={0.85} />
        <polyline points={pts} fill="none" stroke="#000" strokeWidth={1} strokeDasharray={900} strokeDashoffset={900 * (1 - raya)} transform="translate(2,3)" opacity={0.5} />
      </svg>
      <div style={{ left: 120, top: 248, width: 120, height: 130, transform: `scale(${sp})`, opacity: Math.min(1, sp * 1.3) }}>
        <div style={{ left: 14, top: 0, width: 32, height: 130, borderRadius: 8, background: "#fff", boxShadow: "0 6px 0 #000a" }} />
        <div style={{ left: 74, top: 0, width: 32, height: 130, borderRadius: 8, background: "#fff", boxShadow: "0 6px 0 #000a" }} />
      </div>
      <div style={{ inset: 8, border: "3px solid #ffffffcc", borderRadius: 14 }} />
      <div style={{ left: 18, top: 62, font: `700 14px ${MONO}`, color: "#fff", letterSpacing: ".1em", opacity: Math.floor(dt * 4) % 2 ? 0.4 : 1 }}>‖ PAUSA</div>
    </div>
  );
};

const MONO = `"Space Grotesk", ui-monospace, monospace`;

// ---------------------------------------------------------------------------------------------
// RebobinadoVHS: líneas de tracking, ruido, colores corridos y el cartel ◀◀ (o ▶ ×0,4 en cámara lenta).
// La imagen la rebobina quien lo usa con `remapear` (renderiza cuadros anteriores del propio video).
// ---------------------------------------------------------------------------------------------
export const RebobinadoVHS: React.FC<{ t: number; k: number; modo: "atras" | "lento" }> = ({ t, k, modo }) => {
  if (k <= 0.01) return null;
  const banda = ((t * (modo === "atras" ? 1300 : 260)) % 760) - 60;
  const lineas = Array.from({ length: 5 }, (_, i) => ({ y: (rnd(Math.floor(t * 30) + i * 7) * 640) | 0, h: 1 + ((rnd(i + Math.floor(t * 30)) * 4) | 0) }));
  return (
    <div style={{ inset: 0, opacity: k }}>
      <div style={{ inset: 0, background: "repeating-linear-gradient(#0000 0 2px, #0003 2px 3px)" }} />
      <div style={{ left: 0, right: 0, top: banda, height: 46, background: "linear-gradient(#fff0,#ffffff55 40%,#ffffffaa 50%,#ffffff55 60%,#fff0)", transform: "skewX(-18deg)", mixBlendMode: "screen" }} />
      <div style={{ left: 0, right: 0, top: banda + 18, height: 8, background: "#000a" }} />
      {lineas.map((l, i) => (
        <div key={i} style={{ left: 0, right: 0, top: l.y, height: l.h, background: i % 2 ? "#ff4d5a88" : "#5ad1ff88", mixBlendMode: "screen" }} />
      ))}
      <div style={{ inset: 0, boxShadow: "inset 6px 0 0 #ff2a5544, inset -6px 0 0 #2ad4ff44" }} />
      <div style={{ left: 18, top: 58, font: `700 18px ${MONO}`, color: "#fff", textShadow: "2px 0 #ff2a55, -2px 0 #2ad4ff", opacity: Math.floor(t * 5) % 2 ? 1 : 0.55 }}>
        {modo === "atras" ? "◀◀ REBOBINANDO" : "▶ ×0,4  CÁMARA LENTA"}
      </div>
      <div style={{ right: 70, top: 62, font: `700 14px ${MONO}`, color: "#fff", textShadow: "2px 0 #ff2a55" }}>SP</div>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// FinFalso: "FIN" sobre negro y créditos que empiezan a subir (en silencio).
// ---------------------------------------------------------------------------------------------
export const FinFalso: React.FC<{ t: number; desde: number; hasta: number; creditos?: string[] }> = ({ t, desde, hasta, creditos = [] }) => {
  if (t < desde || t >= hasta) return null;
  const dt = t - desde;
  const s = 0.92 + 0.08 * entra(dt / 0.25);
  return (
    <div style={{ inset: 0, background: "#000" }}>
      <div style={{ left: 0, right: 0, top: 236, textAlign: "center", font: `400 64px/1 Georgia, "Times New Roman", serif`, color: "#fff", letterSpacing: ".3em", transform: `scale(${s})`, opacity: Math.min(1, dt / 0.08) }}>FIN</div>
      {creditos.map((c, i) => (
        <div key={i} style={{ left: 0, right: 0, top: 560 + i * 26 - dt * 110, textAlign: "center", font: `500 13px ${BODY}`, color: "#ffffffaa", letterSpacing: ".08em" }}>{c}</div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// VidrioRoto: la pantalla (negra, la del FIN) se parte en triángulos desde un punto y vuelan hacia la cámara.
// ---------------------------------------------------------------------------------------------
type Trozo = { poly: [number, number][]; c: [number, number] };
function trozos(cx: number, cy: number): Trozo[] {
  const out: Trozo[] = [];
  const N = 11;
  const radios = [0, 70, 170, 900];
  const ang = Array.from({ length: N + 1 }, (_, i) => (i / N) * Math.PI * 2 + (i < N ? (rnd(i + 11) - 0.5) * 0.35 : 0));
  ang[N] = ang[0] + Math.PI * 2;
  const p = (a: number, r: number, j: number): [number, number] => {
    const rr = r === 0 ? 0 : r * (0.85 + rnd(j) * 0.3);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  };
  for (let k = 0; k < radios.length - 1; k++) {
    for (let i = 0; i < N; i++) {
      const a0 = ang[i], a1 = ang[i + 1];
      const poly = [p(a0, radios[k], i * 10 + k), p(a1, radios[k], (i + 1) * 10 + k), p(a1, radios[k + 1], (i + 1) * 10 + k + 1), p(a0, radios[k + 1], i * 10 + k + 1)];
      const c: [number, number] = [poly.reduce((s, q) => s + q[0], 0) / 4, poly.reduce((s, q) => s + q[1], 0) / 4];
      out.push({ poly, c });
    }
  }
  return out;
}
export const VidrioRoto: React.FC<{ t: number; desde: number; cx?: number; cy?: number; color?: string }> = ({ t, desde, cx = 180, cy = 290, color = "#000" }) => {
  const dt = t - desde;
  if (dt < 0 || dt > 0.9) return null;
  const grieta = dt < 0.08;
  const vuelo = Math.max(0, dt - 0.06);
  return (
    <div style={{ inset: 0 }}>
      {trozos(cx, cy).map((tr, i) => {
        const dx = tr.c[0] - cx, dy = tr.c[1] - cy;
        const len = Math.hypot(dx, dy) || 1;
        const v = 260 + rnd(i + 40) * 340;
        const tx = (dx / len) * v * vuelo * (1 + vuelo * 2);
        const ty = (dy / len) * v * vuelo * (1 + vuelo * 2) + 420 * vuelo * vuelo;
        const sc = 1 + vuelo * (1.4 + rnd(i) * 1.6);
        const rot = (rnd(i + 5) - 0.5) * 540 * vuelo;
        const op = 1 - clamp((vuelo - 0.35) / 0.4, 0, 1);
        const clip = `polygon(${tr.poly.map(([x, y]) => `${x}px ${y}px`).join(",")})`;
        return (
          <div key={i} style={{ inset: 0, opacity: op, transformOrigin: `${tr.c[0]}px ${tr.c[1]}px`, transform: `translate(${tx}px,${ty}px) rotate(${rot}deg) scale(${sc})` }}>
            <div style={{ inset: 0, clipPath: clip, background: `linear-gradient(${135 + i * 17}deg, ${color}, #1a1a1a 60%, ${color})` }} />
          </div>
        );
      })}
      {grieta ? (
        <svg width={360} height={640} style={{ left: 0, top: 0 }}>
          {trozos(cx, cy).map((tr, i) => (
            <polygon key={i} points={tr.poly.map((q) => q.join(",")).join(" ")} fill="none" stroke="#fff" strokeWidth={1.4} opacity={0.9} />
          ))}
        </svg>
      ) : null}
      {dt < 0.12 ? <div style={{ inset: 0, background: "#fff", opacity: 0.5 * (1 - dt / 0.12) }} /> : null}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// Escudo: burbuja de luz desde el celular; lo que choca rebota con destello y "BLOQUEADO".
// ---------------------------------------------------------------------------------------------
export type Choque = { en: number; ang: number; texto?: string };
export const Escudo: React.FC<{ t: number; desde: number; hasta: number; cx: number; cy: number; r: number; choques: Choque[] }> = ({ t, desde, hasta, cx, cy, r, choques }) => {
  const o = win(t, desde, hasta, 0.05, 0.2);
  if (o <= 0) return null;
  const sp = Math.min(1.08, spring(t - desde, 13, 0.5));
  const R = r * sp;
  const pulso = 1 + 0.02 * Math.sin(t * 9);
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: cx - R * pulso, top: cy - R * pulso, width: 2 * R * pulso, height: 2 * R * pulso, borderRadius: "50%", background: "radial-gradient(circle, #FFB70000 50%, #FFB70033 70%, #fff5 87%, #FFB703ee 96%, #FFB70000 100%)", border: "2px solid #FFE08acc", boxShadow: "0 0 50px #FFB70088, inset 0 0 50px #FFB70066" }} />
      {[0, 1, 2].map((i) => {
        const fase = ((t - desde) * 0.9 + i / 3) % 1;
        return <div key={i} style={{ left: cx - R * fase, top: cy - R * fase, width: 2 * R * fase, height: 2 * R * fase, borderRadius: "50%", border: "1.5px solid #FFE08a", opacity: 0.35 * (1 - fase) }} />;
      })}
      {choques.map((c, i) => {
        const d = t - c.en;
        if (d < 0 || d > 0.9) return null;
        const x = cx + Math.cos(c.ang) * R, y = cy + Math.sin(c.ang) * R;
        const f = Math.max(0, 1 - d / 0.25);
        const sl = Math.min(1.1, spring(d, 16, 0.45));
        return (
          <React.Fragment key={i}>
            <div style={{ left: x - 50, top: y - 50, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle,#fff,#FFB703aa 35%,#FFB70000 70%)", opacity: f, transform: `scale(${0.5 + d * 3})` }} />
            <div style={{ left: clamp(x - 60, 4, 236), top: y - 70 - d * 40, width: 120, textAlign: "center", opacity: 1 - clamp((d - 0.6) / 0.3, 0, 1), transform: `scale(${sl}) rotate(${i % 2 ? 6 : -6}deg)` }}>
              <span style={{ position: "static", display: "inline-block", padding: "4px 10px", borderRadius: 8, background: "#FF4D5A", color: "#fff", font: `900 15px ${DISP}`, letterSpacing: ".04em", boxShadow: "0 4px 0 #000a" }}>{c.texto ?? "BLOQUEADO"}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// Tragamonedas: rodillos que giran y frenan con rebote; jackpot con luces (V7-02).
// ---------------------------------------------------------------------------------------------
export type Rodillo = { simbolos: React.ReactNode[]; arranca: number; frena: number; final: number };
export const Tragamonedas: React.FC<{ t: number; rodillos: Rodillo[]; left: number; top: number; ancho: number; alto: number; jackpot?: number }> = ({ t, rodillos, left, top, ancho, alto, jackpot }) => {
  const w = ancho / rodillos.length;
  const luces = jackpot !== undefined && t >= jackpot;
  return (
    <div style={{ left, top, width: ancho, height: alto, borderRadius: 14, background: "#120c06", border: `4px solid ${luces && Math.floor(t * 8) % 2 ? "#FFB703" : "#7a5a1a"}`, overflow: "hidden", boxShadow: luces ? "0 0 40px #FFB703aa" : "0 10px 30px #000a" }}>
      {rodillos.map((r, i) => {
        const n = r.simbolos.length;
        const vel = 14;
        let pos: number;
        if (t < r.arranca) pos = 0;
        else if (t < r.frena) pos = (t - r.arranca) * vel;
        else {
          const base = (r.frena - r.arranca) * vel;
          const destino = Math.ceil(base / n) * n + r.final;
          const k = clamp((t - r.frena) / 0.35, 0, 1);
          const rebote = k >= 1 ? Math.exp(-10 * (t - r.frena - 0.35)) * Math.sin((t - r.frena - 0.35) * 30) * 0.12 : 0;
          pos = base + (destino - base) * entra(k) + rebote;
        }
        const frac = pos - Math.floor(pos);
        const idx = Math.floor(pos);
        return (
          <div key={i} style={{ left: i * w, top: 0, width: w, height: alto, overflow: "hidden", borderRight: i < rodillos.length - 1 ? "2px solid #3a2a10" : undefined, filter: t > r.arranca && t < r.frena ? "blur(1.2px)" : undefined }}>
            {[-1, 0, 1].map((k) => (
              <div key={k} style={{ left: 0, width: w, height: alto, top: (k - frac) * alto, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {r.simbolos[(((idx + k) % n) + n) % n]}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// ZoomMejorar: zoom por pasos ×2 ×4 ×8 con pixelado que se aclara (V7-02, sirve para V6-02).
// ---------------------------------------------------------------------------------------------
export const ZoomMejorar: React.FC<{ t: number; desde: number; pasos?: number[]; cx: number; cy: number; paso?: number; children: React.ReactNode }> = ({ t, desde, pasos = [2, 4, 8], cx, cy, paso = 0.4, children }) => {
  const dt = t - desde;
  let z = 1, mosaico = 0, i = -1;
  pasos.forEach((p, k) => {
    const a = k * paso;
    if (dt >= a) {
      i = k;
      const prev = k ? pasos[k - 1] : 1;
      z = prev + (p - prev) * entra((dt - a) / 0.12);
      mosaico = 1 - clamp((dt - a - 0.05) / (paso * 0.7), 0, 1);
    }
  });
  const celda = 4 + 10 * mosaico;
  return (
    <div style={{ inset: 0, overflow: "hidden" }}>
      <div style={{ inset: 0, transformOrigin: `${cx}px ${cy}px`, transform: `scale(${z})`, filter: mosaico > 0.02 ? `blur(${mosaico * 3}px)` : undefined }}>{children}</div>
      {mosaico > 0.02 ? <div style={{ inset: 0, opacity: mosaico * 0.6, background: `repeating-linear-gradient(90deg,#0004 0 1px,#0000 1px ${celda}px),repeating-linear-gradient(#0004 0 1px,#0000 1px ${celda}px)` }} /> : null}
      {i >= 0 ? <div style={{ left: 18, top: 92, font: `700 18px ${MONO}`, color: "#7CFFB0", textShadow: "0 2px 0 #000" }}>MEJORAR ×{pasos[i]}</div> : null}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// BarraVida: barra tipo videojuego; al bajar deja una estela que se vacía después (V7-02, V7-03).
// ---------------------------------------------------------------------------------------------
export const BarraVida: React.FC<{ t: number; valor: number; estela: number; left: number; top: number; ancho: number; etiqueta?: string; numeros?: boolean; color?: string; golpe?: number }> = ({ t, valor, estela, left, top, ancho, etiqueta, numeros = false, color, golpe }) => {
  const v = clamp(valor, 0, 1), e = clamp(Math.max(estela, valor), 0, 1);
  const col = color ?? (v > 0.5 ? "#34d399" : v > 0.25 ? "#FFB703" : "#FF4D5A");
  const tiembla = golpe !== undefined && t >= golpe ? Math.exp(-14 * (t - golpe)) * Math.sin((t - golpe) * 70) * 4 : 0;
  return (
    <div style={{ left, top, width: ancho, height: 40, transform: `translateX(${tiembla}px)` }}>
      {etiqueta ? <div style={{ left: 0, top: 0, font: `900 12px ${DISP}`, letterSpacing: ".08em", color: "#fff", textShadow: "0 2px 0 #000" }}>{etiqueta}</div> : null}
      <div style={{ left: 0, top: 16, width: ancho, height: 20, borderRadius: 6, background: "#1a1a1a", border: "2px solid #fff", boxShadow: "0 4px 0 #000a", overflow: "hidden" }}>
        <div style={{ left: 0, top: 0, bottom: 0, width: `${e * 100}%`, background: "#fff" }} />
        <div style={{ left: 0, top: 0, bottom: 0, width: `${v * 100}%`, background: col }} />
        <div style={{ left: 0, right: 0, top: 0, height: 6, background: "#ffffff33" }} />
      </div>
      {numeros ? <div style={{ right: 4, top: 18, font: `900 13px ${DISP}`, color: "#fff", textShadow: "0 1px 0 #000" }}>{Math.round(v * 100)}</div> : null}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// Glitch: cuadros repetidos, canales de color corridos y bloques que saltan (V7-03).
// ---------------------------------------------------------------------------------------------
export const Glitch: React.FC<{ t: number; k: number; children: React.ReactNode }> = ({ t, k, children }) => {
  if (k <= 0.01) return <>{children}</>;
  const f = Math.floor(t * 24);
  const cortes = Array.from({ length: 4 }, (_, i) => ({ y: rnd(f + i * 13) * 600, h: 8 + rnd(f + i) * 40, dx: (rnd(f * 3 + i) - 0.5) * 50 * k }));
  return (
    <div style={{ inset: 0 }}>
      <div style={{ inset: 0, transform: `translateX(${-4 * k}px)`, filter: "drop-shadow(4px 0 0 #ff2a55aa) drop-shadow(-4px 0 0 #2ad4ffaa)" }}>{children}</div>
      {cortes.map((c, i) => (
        <div key={i} style={{ inset: 0, clipPath: `inset(${c.y}px 0 ${Math.max(0, 640 - c.y - c.h)}px 0)`, transform: `translateX(${c.dx}px)` }}>{children}</div>
      ))}
      {cortes.slice(0, 2).map((c, i) => (
        <div key={"b" + i} style={{ left: rnd(f + i * 5) * 300, top: c.y, width: 30 + rnd(f + i) * 60, height: c.h / 2, background: i ? "#2ad4ff" : "#ff2a55", opacity: 0.5 * k, mixBlendMode: "screen" }} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// CartelPelea: "ROUND N" en diagonal que entra con latigazo (V7-03).
// ---------------------------------------------------------------------------------------------
export const CartelPelea: React.FC<{ t: number; desde: number; hasta: number; texto: string; sub?: string }> = ({ t, desde, hasta, texto, sub }) => {
  const o = win(t, desde, hasta, 0.02, 0.12);
  if (o <= 0) return null;
  const x = I(t, desde, desde + 0.18, 420, 0, entra) + I(t, hasta - 0.15, hasta, 0, -420, sale);
  const s = Math.min(1.1, spring(t - desde - 0.12, 15, 0.4));
  return (
    <div style={{ left: -40, right: -40, top: 250, height: 110, opacity: o, transform: `translateX(${x}px) rotate(-8deg)` }}>
      <div style={{ inset: 0, background: "linear-gradient(90deg,#000,#C1121F 20%,#C1121F 80%,#000)", boxShadow: "0 0 40px #C1121F99" }} />
      <div style={{ left: 0, right: 0, top: 14, textAlign: "center", font: `900 58px/1 ${DISP}`, color: "#fff", letterSpacing: ".02em", textShadow: "0 5px 0 #000", transform: `scale(${s})`, fontStyle: "italic" }}>{texto}</div>
      {sub ? <div style={{ left: 0, right: 0, top: 78, textAlign: "center", font: `800 16px ${BODY}`, color: "#FFB703", letterSpacing: ".12em" }}>{sub}</div> : null}
    </div>
  );
};

void eOut;
