import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { I, eIO, eOut, spring, clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { Grano, Vineta } from "../components/Capas";
import { Subtitulos } from "../components/Subtitulos";
import { tPalabra, type Guion, type Palabra } from "../lib/guion";
import type { Cam } from "../v3/ElDueno";

// Piezas compartidas por los videos V3-06, V4-02 y V5-02: marco con cámara 2D, capa 3D, subtítulos y sonidos.

export type Cam2D = { z: number; rot: number; tx: number; ty: number; blur: number };

/** Tiempos de cada línea de la voz: inicio y fin reales (o los del guion si todavía no hay voz). */
export function lineasDeVoz(g: Guion, pal: Palabra[]) {
  const ini = g.lineas.map((l, n) => {
    const w = pal.filter((p) => p.linea === n);
    return w.length ? Math.min(...w.map((p) => p.desde)) : l.desde;
  });
  const fin = g.lineas.map((l, n) => {
    const w = pal.filter((p) => p.linea === n);
    return w.length ? Math.max(...w.map((p) => p.hasta)) : l.hasta;
  });
  return { l: ini, e: fin };
}

export const W = (g: Guion, pal: Palabra[]) => (n: number, pre: string, def: number) => tPalabra(pal, n, pre, def);

/** Cámara 2D: golpe de zoom y giro en cada palabra clave, deriva suave y barrido con desenfoque en cada corte. */
export function camaraBeats(t: number, beats: number[], cortes: number[], intensidad = 1): Cam2D {
  let z = 1.05 + 0.025 * Math.sin(t * 1.9), rot = 0.5 * Math.sin(t * 1.3), tx = 3 * Math.sin(t * 2.1), ty = 3 * Math.cos(t * 1.7), blur = 0;
  beats.forEach((b, i) => {
    const d = t - b;
    if (d >= 0) {
      const p = Math.exp(-6.5 * d) * intensidad;
      z += (i % 3 === 2 ? 0.17 : 0.09) * p;
      rot += (i % 2 ? 1 : -1) * 1.7 * p;
      tx += Math.sin(i * 2.3) * 9 * p;
      ty += Math.cos(i * 1.7) * 7 * p;
    }
  });
  cortes.forEach((c, i) => {
    const d = Math.abs(t - c);
    if (d < 0.22) {
      const k = (1 - d / 0.22) * intensidad;
      z += 0.24 * k;
      blur += 5 * k;
      rot += (i % 2 ? -1 : 1) * 2.6 * k;
      tx += (i % 2 ? -1 : 1) * 22 * k * (t < c ? -1 : 1);
    }
  });
  return { z, rot, tx, ty, blur };
}

/** Cámara 3D por cuadros clave, con aceleración suave entre uno y otro. */
export type Clave = { t: number; pos: [number, number, number]; target: [number, number, number]; fov: number; roll?: number };
export function camaraClaves(t: number, claves: Clave[]): Cam & { roll: number } {
  if (t <= claves[0].t) return { ...claves[0], roll: claves[0].roll ?? 0 };
  for (let i = 0; i < claves.length - 1; i++) {
    const a = claves[i], b = claves[i + 1];
    if (t < b.t) {
      const k = eIO(clamp((t - a.t) / (b.t - a.t), 0, 1));
      const m = (x: number[], y: number[]) => x.map((v, j) => v + (y[j] - v) * k) as [number, number, number];
      return { pos: m(a.pos, b.pos), target: m(a.target, b.target), fov: a.fov + (b.fov - a.fov) * k, roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * k };
    }
  }
  const u = claves[claves.length - 1];
  return { ...u, roll: u.roll ?? 0 };
}

/** Golpes de pantalla (temblor) sumados desde una lista de instantes. */
export function temblor(t: number, golpes: [number, number][]) {
  let hs = 0;
  golpes.forEach(([a, fuerza]) => {
    const d = t - a;
    if (d >= 0) hs += fuerza * Math.exp(-12 * d) * Math.sin(64 * d);
  });
  return hs;
}

/** Pone la cámara 3D en su lugar en cada cuadro (con giro lateral "roll"). */
export const ControlCamaraRoll: React.FC<{ c: Cam & { roll: number } }> = ({ c }) => {
  const cam = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  cam.fov = c.fov;
  cam.position.set(...c.pos);
  cam.lookAt(...c.target);
  cam.rotateZ(c.roll);
  cam.updateProjectionMatrix();
  return null;
};

/** Textura dibujada con canvas (carteles, etiquetas). */
export function useTex(key: string, w: number, h: number, dibujar: (x: CanvasRenderingContext2D, w: number, h: number) => void, listo: boolean) {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    dibujar(cv.getContext("2d")!, w, h);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 8;
    return tx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, w, h, listo]);
}

type MarcoProps = {
  g: Guion;
  voz: string | null;
  pal: Palabra[];
  cam: Cam2D;
  hs: number;
  wf: number;
  red: number;
  frame: number;
  t: number;
  sonidos: { en: number; sfx: string; vol?: number }[];
  ocultos: [number, number][];
  fondo: React.ReactNode;
  tres?: React.ReactNode;
  tresOpacidad?: number;
  frente: React.ReactNode;
  sobre?: React.ReactNode;
  luzCalida?: number;
  sombras?: boolean;
};

/** Capas de siempre: fondo 2D → 3D → frente 2D (los tres con cámara) → grano, viñeta, destellos y subtítulos (sin cámara). */
export const Marco: React.FC<MarcoProps> = ({ g, voz, pal, cam, hs, wf, red, frame, t, sonidos, ocultos, fondo, tres, tresOpacidad = 1, frente, sobre, luzCalida = 0, sombras = true }) => {
  const { fps } = useVideoConfig();
  const lienzo: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" };
  return (
    <AbsoluteFill style={{ background: "#08110d" }}>
      <style>{`.stage *{position:absolute;box-sizing:border-box} .stage{font-family:${BODY};color:#fff}`}</style>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${hs * 3}px,${hs * 1.6}px)` }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 50%", transform: `translate(${cam.tx * 3}px,${cam.ty * 3}px) rotate(${cam.rot}deg) scale(${cam.z})`, filter: cam.blur > 0.2 ? `blur(${cam.blur * 3}px)` : undefined }}>
          <div className="stage" style={lienzo}>{fondo}</div>
          {tres ? (
            <div style={{ position: "absolute", inset: 0, opacity: tresOpacidad }}>
              <ThreeCanvas width={1080} height={1920} shadows={sombras} gl={{ alpha: true, antialias: true }} camera={{ fov: 60, near: 0.1, far: 200 }}>
                {tres}
              </ThreeCanvas>
            </div>
          ) : null}
          <div className="stage" style={lienzo}>{frente}</div>
        </div>
        <div className="stage" style={lienzo}>
          <Grano frame={frame} />
          <Vineta />
          {luzCalida > 0 ? <div style={{ inset: -40, mixBlendMode: "screen", opacity: luzCalida, background: "radial-gradient(circle at 50% 100%, #FFB703ee, #FF7A00aa 30%, transparent 65%)" }} /> : null}
          <div style={{ inset: 0, background: "#FF4D5A", opacity: Math.min(0.28, red * 0.25) }} />
          <div style={{ inset: 0, background: "#fff", opacity: clamp(wf, 0, 0.6) }} />
          <Subtitulos t={t} tv={t} g={g} palabras={pal} ocultos={ocultos} />
          {sobre}
        </div>
      </div>
      {voz ? <Html5Audio src={staticFile(voz)} /> : null}
      {sonidos.map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.en * fps))} durationInFrames={Math.round(5 * fps)} layout="none">
          <Html5Audio src={staticFile(`sfx/${s.sfx}.wav`)} volume={s.vol ?? 0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** Texto gigante del gancho: tres renglones que caen con rebote y se van antes del fin. */
export const GanchoGigante: React.FC<{ t: number; lineas: string[]; hasta: number; top?: number; colores?: string[] }> = ({ t, lineas, hasta, top = 118, colores = ["#fff", "#FFB703", "#FF4D5A"] }) => {
  if (t > hasta + 0.3) return null;
  const sal = I(t, hasta - 0.05, hasta + 0.25, 0, 1, eOut);
  return (
    <div style={{ left: 0, right: 0, top: 0, bottom: 0, opacity: 1 - sal, transform: `translateY(${-sal * 60}px)` }}>
      <div style={{ left: 0, right: 0, top: 0, height: 330, background: "linear-gradient(#000e,#000a 62%,transparent)" }} />
      {lineas.map((txt, i) => {
        if (!txt) return null;
        const s = spring(t - i * 0.1 + 0.05, 15, 0.42);
        return (
          <div key={i} style={{ left: 10, right: 10, top: top + i * 62, textAlign: "center", whiteSpace: "nowrap", font: `900 ${Math.min(i === 1 ? 44 : 58, Math.floor(330 / (Math.max(txt.length, 4) * 0.6)))}px/1 ${DISP}`, color: colores[i], letterSpacing: "-.02em", transform: `scale(${0.3 + 0.7 * s}) rotate(${(1 - s) * (i % 2 ? 6 : -6) - 1.2 + i * 1.2}deg)`, opacity: Math.min(1, s * 1.4), textShadow: "0 5px 0 #000, 0 0 26px #000a" }}>
            {txt}
          </div>
        );
      })}
    </div>
  );
};

/** Celular con pantalla: `sp` es el resorte de entrada (0 abajo → 1 en su lugar). La pantalla mide 174 × 384. */
export const Celular: React.FC<{ t: number; sp: number; left?: number; top?: number; children: React.ReactNode }> = ({ t, sp, left = 85, top = 124, children }) => (
  <div style={{ left, top, width: 190, height: 400, perspective: 900, transform: `translateY(${(1 - sp) * 560}px) scale(${0.85 + 0.15 * sp})`, transformOrigin: "0 0" }}>
    <div style={{ inset: 0, borderRadius: 30, background: "#0b0b0b", boxShadow: "0 30px 60px #000c, 0 0 90px #FFB70055, inset 0 0 0 2px #2a2a2a", transform: `rotateY(${(1 - sp) * 50 - 8 + Math.sin(t) * 4}deg) rotateX(5deg)` }}>
      <div style={{ left: 8, top: 8, right: 8, bottom: 8, borderRadius: 23, overflow: "hidden", background: "#0E2A1C" }}>
        <div style={{ left: 60, right: 60, top: 6, height: 16, borderRadius: 9, background: "#000", zIndex: 5 }} />
        {children}
      </div>
    </div>
  </div>
);

export const LogoEnClaro: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, ...style }}>
    <div style={{ position: "relative", width: 38, height: 38, borderRadius: 10, background: "#FFB703", boxShadow: "0 0 28px #FFB70066" }}>
      <div style={{ left: 9, right: 9, top: 13, height: 4, borderRadius: 3, background: "#06140D" }} />
      <div style={{ left: 9, right: 14, top: 21, height: 4, borderRadius: 3, background: "#06140D" }} />
    </div>
    <div style={{ position: "static", font: `700 32px/1 ${DISP}`, letterSpacing: "-.02em", color: "#fff" }}>En Claro</div>
  </div>
);

/** Botón de cierre "Probalo gratis". */
export const BotonProbalo: React.FC<{ s: number; top?: number }> = ({ s, top = 540 }) => (
  <div style={{ left: 40, right: 40, top, padding: 12, borderRadius: 999, background: "#FFB703", textAlign: "center", font: `900 15px ${BODY}`, color: "#1A1200", boxShadow: "0 10px 30px #FFB70055", opacity: Math.min(1, s), transform: `scale(${0.85 + 0.15 * s})` }}>
    <span style={{ position: "static" }}>Probalo gratis · link en el perfil</span>
  </div>
);
