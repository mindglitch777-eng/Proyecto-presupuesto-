import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { I, clamp, eIO, eIn, eOut, lin, spring, win } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V3_03, palabrasDeRespaldo, tPalabra, type Palabra } from "../lib/guion";
import { Fondo, Grano, Vineta } from "../components/Capas";
import { Subtitulos } from "../components/Subtitulos";
import { Icono } from "../components/Iconos";
import { TextoCinetico } from "../escenas/Dolor";
import { Kiosco3D, Muneco } from "./Modelos3D";
import { AGUJERO_X, AGUJERO_Y, Agujero, Agua, Casco, FRENTE_Z, Gaviota, Gota, Moneda, Sol, Tapon } from "./ModelosBarco";
import { ControlCamara, Pildora, mixV, proyectar, useFuentesListas, type Cam } from "./ElDueno";
import type { VideoProps } from "../Video";

// Video 03 de IDEAS_V3: "Tu kiosco se hunde" (30 s, 3D).
// Los momentos clave (corte bajo el agua, agujeros, tapones, cierre) leen el segundo exacto de cada
// palabra de Tomás desde `palabras`; si no hay voz, usan tiempos de respaldo.

const g = GUION_V3_03;
type V3 = [number, number, number];
const GOLPES = [0, 0.35];
const SELLO = 1.75;
const ETIQ = ["FIADO", "PRECIOS VIEJOS", "MERCADERÍA QUE NO SE VENDE", "LUZ"];
const MONTOS = [37800, 22400, 31500, 14000];
const TOTAL = MONTOS.reduce((a, b) => a + b, 0);

function tiempos(pal: Palabra[]) {
  return {
    vendes: tPalabra(pal, 1, "vendés", 3.4),
    trab: tPalabra(pal, 1, "trabajás", 4.6),
    agua: tPalabra(pal, 1, "agua", 7.4),
    dive: tPalabra(pal, 2, "porque", 9.8),
    prob: tPalabra(pal, 2, "problema", 10.6),
    son: tPalabra(pal, 2, "son", 13.2),
    claro: tPalabra(pal, 3, "en", 16.6),
    tap: tPalabra(pal, 3, "taparlo", 21.2),
    final: tPalabra(pal, 4, "dejá", 24.4),
  };
}
type T = ReturnType<typeof tiempos>;

const popT = (T_: T, i: number) => T_.son + i * 0.38;
const plugT = (T_: T, i: number) => T_.tap + i * 0.5;

/** Estado del barco en el segundo t: altura, inclinación y cuánto se hundió (0 a 1). */
function barco(t: number, T_: T) {
  const s1 = I(t, 2.7, T_.son + 1.0, 0, 1, lin);
  const r = I(t, T_.tap + 1.9, T_.tap + 3.3, 0, 1, eOut);
  const s = s1 * (1 - r);
  const y = 0.4 - 0.85 * s + Math.sin(t * 1.7) * 0.07;
  const tilt = (0.22 + 0.12 * s) * (1 - r) + Math.sin(t * 1.3) * 0.03 * (1 - 0.6 * r);
  return { s1, s, r, y, tilt };
}
type Barco = ReturnType<typeof barco>;

/** Posición en el mundo de un agujero (el casco se inclina con el barco). */
function agujeroMundo(b: Barco, i: number): V3 {
  const x = AGUJERO_X[i], y = AGUJERO_Y;
  const c = Math.cos(b.tilt), s = Math.sin(b.tilt);
  return [x * c - y * s, b.y + x * s + y * c, FRENTE_Z];
}

function camara(t: number, T_: T): Cam {
  const gPos: V3 = [I(t, 0, 2.7, 0, 0.5, lin), I(t, 0, 2.7, 2.7, 2.9, lin), I(t, 0, 2.7, 11.8, 11.0, lin)];
  const gTar: V3 = [0.2, 2.5, 0];
  const th = I(t, 3.3, T_.dive, -0.3, 0.35, lin);
  const aPos: V3 = [Math.sin(th) * 12.5, 4.8, Math.cos(th) * 12.5];
  const aTar: V3 = [0, 1.7, 0.4];
  const k0 = I(t, 2.75, 3.6, 0, 1, eIO);
  let pos = mixV(gPos, aPos, k0);
  let tar = mixV(gTar, aTar, k0);
  const dv = I(t, T_.dive, T_.dive + 0.9, 0, 1, eIO);
  pos = mixV(pos, [0, -1.2, 14.8], dv);
  tar = mixV(tar, [0, 0.1, 1.0], dv);
  const up = I(t, T_.tap + 2.4, T_.tap + 3.4, 0, 1, eIO);
  pos = mixV(pos, [0.2, 3.9, 12.5], up);
  tar = mixV(tar, [0, 2.9, 0.4], up);
  const kf = I(t, T_.final, T_.final + 4, 0, 1, lin);
  pos = mixV(pos, [0.5, 3.4, 10.6], kf * 0.7);
  return { pos, target: tar, fov: 56 };
}

const Escena3D: React.FC<{ t: number; T_: T; listo: boolean }> = ({ t, T_, listo }) => {
  const c = camara(t, T_);
  const b = barco(t, T_);
  const sub = I(t, T_.dive + 0.35, T_.dive + 0.8, 0, 1, lin) * (1 - I(t, T_.tap + 2.5, T_.tap + 3.0, 0, 1, lin));
  const cielo = I(t, T_.tap + 2.6, T_.tap + 3.8, 0, 1, lin);
  const pers = clamp(0.38 + 0.22 * b.s1 - 0.6 * I(t, T_.tap + 2.2, T_.tap + 3.4, 0, 1, eIO), 0, 1);
  const luz = 0.55 + 0.45 * I(t, T_.tap + 2.2, T_.tap + 3.4, 0, 1, eIO);
  const aguaVidriera = (0.35 + 0.9 * b.s1) * (1 - b.r) + 0.001;
  const festeja = t > T_.tap + 2.7;
  const frenesi = 6 + 7 * b.s1;

  // gotas que tira con el vasito (adentro del grupo del barco)
  const gotas: React.ReactNode[] = [];
  if (t > 3.0 && t < T_.tap + 2.4) {
    const n0 = Math.floor((t - 3.0) / 0.3);
    for (let j = 0; j < 3; j++) {
      const ti = 3.0 + (n0 - j) * 0.3, age = t - ti;
      if (age < 0 || age > 0.8) continue;
      gotas.push(<Gota key={n0 - j} position={[2.0 + age * 2.4, 1.9 + 3 * age - 5 * age * age, 1.4 + age * 0.8]} />);
    }
  }

  // chorros de monedas por cada agujero abierto
  const monedas: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const t0 = popT(T_, i), t1 = plugT(T_, i);
    if (t < t0 || t > t1) continue;
    const h = agujeroMundo(b, i);
    for (let k = 0; k < 10; k++) {
      const ini = t0 + k * 0.09;
      if (t < ini) continue;
      const age = (((t - ini) % 0.9) + 0.9) % 0.9;
      monedas.push(<Moneda key={i * 10 + k} giro={t * 9 + k} position={[h[0] + (k % 3 - 1) * 0.12, h[1] + age * 1.3 - 4.4 * age * age, h[2] + 0.1 + age * 1.7]} />);
    }
  }

  // tapones que vuelan desde abajo a la izquierda (donde estaba el celular) hasta cada agujero
  const tapones: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const tl = plugT(T_, i), p = (t - (tl - 0.42)) / 0.42;
    if (p < 0) continue;
    const h = agujeroMundo(b, i);
    const dest: V3 = [h[0], h[1], h[2] + 0.17];
    if (p >= 1) {
      const pop = 1 + 0.25 * Math.exp(-10 * (t - tl)) * Math.cos(30 * (t - tl));
      tapones.push(<Tapon key={i} position={dest} giro={0} escala={pop} />);
    } else {
      const k = eIn(p);
      const a: V3 = [-3.6, -2.6, 7.6];
      tapones.push(<Tapon key={i} position={[a[0] + (dest[0] - a[0]) * k, a[1] + (dest[1] - a[1]) * k + Math.sin(Math.PI * k) * 1.3, a[2] + (dest[2] - a[2]) * k]} giro={p * 9} escala={1.6 - 0.6 * k} />);
    }
  }

  return (
    <>
      <ControlCamara c={c} />
      {sub > 0.5 ? <fog attach="fog" args={["#0d6a96", 10, 42]} /> : null}
      {sub > 0.5 ? <pointLight position={[0, 0.5, 11]} intensity={90} distance={30} color="#bfe9ff" /> : null}
      <ambientLight intensity={0.45 + 0.15 * cielo} />
      <hemisphereLight args={["#cfe8ff", "#1d86bd", 0.7]} />
      <directionalLight position={[5, 11, 9]} intensity={2.3 + 0.6 * cielo} color={cielo > 0.5 ? "#fff0cc" : "#fff1dc"} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-bias={-0.0004} />
      <Agua t={t} nivel={0} />
      <group position={[0, b.y, 0]} rotation={[0, 0, b.tilt]}>
        <Casco />
        {AGUJERO_X.map((_, i) => (
          <Agujero key={i} i={i} k={Math.min(1.1, spring(t - popT(T_, i), 14, 0.45))} />
        ))}
        <group position={[0, 0.62, -0.7]}>
          <Kiosco3D persiana={pers} luz={luz} fuentesListas={listo} />
          {aguaVidriera > 0.01 ? (
            <mesh position={[0, 1.0 + aguaVidriera / 2, 1.12]}>
              <boxGeometry args={[3.1, aguaVidriera, 0.1]} />
              <meshStandardMaterial color="#2a9bd6" transparent opacity={0.62} roughness={0.2} />
            </mesh>
          ) : null}
        </group>
        <group position={[1.45, 0.62, 1.4]} scale={1.25}>
          <Muneco
            tipo="kiosquero"
            vaso
            position={[0, 0, 0]}
            rotY={-0.45}
            pose={{
              brazoD: festeja ? 2.7 + Math.sin(t * 12) * 0.25 : 0.9 + 0.9 * Math.sin(t * frenesi),
              brazoI: festeja ? 2.7 + Math.sin(t * 12 + 1) * 0.25 : 0.5 + 0.5 * Math.sin(t * frenesi + 1.5),
              salto: festeja ? Math.abs(Math.sin(t * 8)) * 0.25 : 0,
            }}
          />
        </group>
        {gotas}
      </group>
      {monedas}
      {tapones}
      {cielo > 0.02 ? <Sol k={cielo} /> : null}
      {cielo > 0.5
        ? [0, 1, 2].map((i) => (
            <Gaviota key={i} t={t} fase={i * 1.7} position={[-7 + ((t - T_.final + 4) * 2.1 + i * 2.2) % 15, 5 + i * 0.7 + Math.sin(t * 1.6 + i) * 0.25, -2 - i]} />
          ))
        : null}
    </>
  );
};

// ---------- capas 2D ----------
const Gancho: React.FC<{ t: number; hs: number }> = ({ t, hs }) => {
  if (t > 3.2) return null;
  const L = g.ganchos[0].lineas;
  return (
    <div style={{ inset: 0, opacity: win(t, -1, 3.15, 0.01, 0.25) }}>
      <div style={{ left: 0, right: 0, top: 0, height: 240, background: "linear-gradient(#000e,#000b 65%,transparent)" }} />
      <Pildora texto="KIOSQUERO:" style={{ left: 18, top: 62, transform: `scale(${0.6 + 0.4 * Math.min(1, spring(t + 0.2, 16, 0.4))}) rotate(-3deg)` }} />
      {L.map((l, i) => {
        const a = i < 2 ? GOLPES[i] : SELLO;
        const q = I(t, a, a + 0.13, 0, 1, eOut);
        const gl = i === 2 && t > a && t < a + 0.35;
        const size = Math.min(i === 2 ? 40 : 46, Math.floor(326 / (l.length * 0.66)));
        return (
          <div
            key={i}
            style={{
              left: 18, right: 10, top: i === 2 ? 186 : 92 + i * 42, whiteSpace: "nowrap", transformOrigin: "0 50%",
              font: `700 ${size}px/1 ${DISP}`, letterSpacing: "-.02em", color: i === 2 ? "#FF2D3B" : "#fff",
              opacity: t > a ? 1 : 0,
              transform: `translate(${hs * 0.5}px,0) scale(${2.6 - 1.6 * q}) rotate(${i === 2 ? -4 : 0}deg) skewX(${gl ? Math.sin(t * 90) * 12 : 0}deg)`,
              filter: `blur(${(1 - q) * 6}px)`,
              textShadow: gl ? `${Math.sin(t * 70) * 6}px 0 #00E5FF,0 4px 0 #000` : "0 4px 0 #000,0 0 30px #000",
            }}
          >
            {l}
          </div>
        );
      })}
    </div>
  );
};

const Sube: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, 3.2, T_.dive + 0.3, 0.05, 0.25);
  if (o <= 0) return null;
  const lleno = I(t, 3.4, T_.dive, 0, 1, lin);
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 215, background: "linear-gradient(#000d,#0009 65%,transparent)" }} />
      <TextoCinetico t={t} desde={T_.vendes} paso={0.08} texto="Vendés más." amarillas={[]} style={{ left: 20, right: 20, top: 62, font: `700 34px/1.05 ${DISP}`, color: "#fff" }} />
      <TextoCinetico t={t} desde={T_.trab} paso={0.08} texto="Trabajás más." amarillas={[]} style={{ left: 20, right: 20, top: 102, font: `700 34px/1.05 ${DISP}`, color: "#fff" }} />
      <TextoCinetico t={t} desde={T_.agua} paso={0.09} texto="El agua sigue subiendo." amarillas={[]} style={{ left: 20, right: 20, top: 146, font: `700 28px/1.05 ${DISP}`, color: "#4fc3ff" }} />
      {/* medidor del agua */}
      <div style={{ right: 16, top: 250, width: 16, height: 170, borderRadius: 8, background: "#ffffff22", border: "1px solid #ffffff55", overflow: "hidden" }}>
        <div style={{ left: 0, right: 0, bottom: 0, height: `${12 + lleno * 80}%`, background: "linear-gradient(#4fc3ff,#1d86bd)" }} />
      </div>
    </div>
  );
};

const Agujeros: React.FC<{ t: number; T_: T; c: Cam; b: Barco }> = ({ t, T_, c, b }) => {
  const o = win(t, T_.dive + 0.3, T_.tap + 2.7, 0.2, 0.3);
  if (o <= 0) return null;
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 200, background: "linear-gradient(#000d,#0009 65%,transparent)", opacity: win(t, T_.dive + 0.3, T_.claro, 0.2, 0.2) }} />
      <TextoCinetico t={t} desde={T_.prob} paso={0.07} texto="El problema no es cuánto vendés." amarillas={[]} style={{ left: 20, right: 40, top: 62, font: `700 27px/1.08 ${DISP}`, color: "#fff", opacity: win(t, T_.dive + 0.3, T_.claro, 0.01, 0.2) }} />
      <TextoCinetico t={t} desde={T_.son} paso={0.1} texto="Son los agujeros." amarillas={[]} style={{ left: 20, right: 20, top: 128, font: `700 36px/1.05 ${DISP}`, color: "#FF4D5A", opacity: win(t, T_.son - 0.05, T_.claro, 0.01, 0.2) }} />
      {ETIQ.map((txt, i) => {
        const p0 = popT(T_, i), p1 = plugT(T_, i);
        if (t < p0 || t > p1 + 1.0) return null;
        const h = agujeroMundo(b, i);
        const arriba = i % 2 === 0;
        const pp = proyectar(c, [h[0], h[1] + (arriba ? 0.55 : -0.55), h[2]]);
        const s = Math.min(1.08, spring(t - p0 - 0.1, 15, 0.4));
        const tapado = t >= p1;
        return (
          <div key={i} style={{ left: pp.x - 40, top: pp.y - (arriba ? 34 : 4), width: 80, textAlign: "center", transform: `scale(${s})`, transformOrigin: "50% 50%", opacity: tapado ? Math.max(0, 1 - (t - p1) * 1.6) : 1 }}>
            <div style={{ position: "static", display: "inline-block", padding: "3px 5px", borderRadius: 7, background: "#7a0010ee", border: "1.5px solid #FF4D5A", color: "#fff", font: `700 9px/1.15 ${DISP}`, letterSpacing: ".02em" }}>{txt}</div>
          </div>
        );
      })}
    </div>
  );
};

const Celular: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const ini = T_.claro, fin = T_.tap - 0.3;
  if (t < ini - 0.1 || t > fin + 0.7) return null;
  const sp = spring(t - ini, 11, 0.55);
  const sale = I(t, fin, fin + 0.6, 0, 1, eIn);
  let debe = TOTAL;
  MONTOS.forEach((m, i) => (debe -= I(t, plugT(T_, i) + 0.2, plugT(T_, i) + 0.5, 0, m, eOut)));
  const cuentas = [["Fiados sin cobrar", MONTOS[0]], ["Precios viejos", MONTOS[1]], ["Mercadería parada", MONTOS[2]], ["Luz", MONTOS[3]]] as const;
  return (
    <div style={{ left: 85, top: 215, width: 190, height: 390, perspective: 900, opacity: 1 - sale, transform: `translateY(${(1 - sp) * 560 + sale * 520}px) scale(${0.78 + 0.22 * sp})`, transformOrigin: "0 0" }}>
      <div style={{ inset: 0, borderRadius: 30, background: "#0b0b0b", boxShadow: "0 30px 60px #000c, 0 0 80px #FFB70333, inset 0 0 0 2px #2a2a2a", transform: `rotateY(${(1 - sp) * 50 - 10 + Math.sin(t) * 5}deg) rotateX(6deg)` }}>
        <div style={{ left: 8, top: 8, right: 8, bottom: 8, borderRadius: 23, overflow: "hidden", background: "#0E2A1C" }}>
          <div style={{ left: 60, right: 60, top: 6, height: 16, borderRadius: 9, background: "#000" }} />
          <div style={{ left: 14, top: 32, font: `700 13px ${DISP}`, color: "#fff" }}>Tus agujeros</div>
          {cuentas.map(([n, m], i) => (
            <div key={i} style={{ left: 10, right: 10, top: 56 + i * 52, height: 46, borderRadius: 12, background: "#143723", border: "1px solid #2f6a4b", padding: "6px 10px", opacity: Math.min(1, spring(t - ini - 0.3 - i * 0.18)) }}>
              <div style={{ position: "static", font: `700 11px ${DISP}`, color: "#fff" }}><Icono nombre="punto" size={10} color="#FF4D5A" />{n}</div>
              <div style={{ position: "static", font: `700 15px ${DISP}`, color: "#FF4D5A", fontVariantNumeric: "tabular-nums" }}>−{ars(m)}</div>
              <div style={{ right: 8, top: 12, padding: "3px 8px", borderRadius: 999, background: "#FFB703", color: "#1A1200", font: `800 8px ${BODY}` }}>Tapar</div>
            </div>
          ))}
          <div style={{ left: 10, right: 10, top: 272, padding: 10, borderRadius: 12, background: "#143723", border: "1px solid #2f6a4b" }}>
            <div style={{ position: "static", font: `600 9px ${BODY}`, color: "#9DB8A8", letterSpacing: ".08em" }}>SE TE VAN POR MES</div>
            <div style={{ position: "static", font: `700 22px/1.1 ${DISP}`, color: "#FF4D5A", fontVariantNumeric: "tabular-nums" }}>{ars(debe)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Tapados: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  if (t < T_.claro || t > T_.final) return null;
  let debe = TOTAL;
  MONTOS.forEach((m, i) => (debe -= I(t, plugT(T_, i) + 0.2, plugT(T_, i) + 0.5, 0, m, eOut)));
  const listo = t > plugT(T_, 3) + 0.5;
  return (
    <div style={{ inset: 0, opacity: win(t, T_.claro, T_.final - 0.1, 0.2, 0.2) }}>
      <div style={{ left: 0, right: 0, top: 0, height: 205, background: "linear-gradient(#000d,#0009 65%,transparent)" }} />
      <div style={{ left: 20, top: 62, font: `800 12px ${BODY}`, letterSpacing: ".12em", color: "#FFB703" }}>EN CLARO</div>
      <TextoCinetico t={t} desde={T_.claro + 0.1} paso={0.07} texto="Te muestra cada agujero." amarillas={[3]} style={{ left: 20, right: 14, top: 82, font: `700 25px/1.05 ${DISP}`, color: "#fff" }} />
      <div style={{ left: 20, top: 124 }}>
        <div style={{ position: "static", font: `800 11px ${BODY}`, letterSpacing: ".12em", color: "#ffffffbb" }}>{listo ? "TAPADO" : "SE TE VAN POR MES"} <span style={{ position: "static", color: "#ffffff88", fontSize: 9 }}>· EJEMPLO</span></div>
        <div style={{ position: "static", font: `700 46px/1 ${DISP}`, fontVariantNumeric: "tabular-nums", color: listo ? "#5FD39A" : "#FF4D5A", textShadow: "0 4px 0 #000" }}>{listo ? "$0" : ars(debe)}</div>
      </div>
    </div>
  );
};

const Final: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  if (t < T_.final - 0.3) return null;
  const f = T_.final;
  const sl = spring(t - (f - 0.1), 12, 0.45);
  const sb = spring(t - (f + 1.2), 16, 0.4);
  const sc = spring(t - (f + 1.8));
  return (
    <>
      <div style={{ left: 0, right: 0, top: 0, height: 240, background: "linear-gradient(#000b,#0006 65%,transparent)" }} />
      <div style={{ left: 18, top: 62, display: "flex", alignItems: "center", gap: 10, transform: `scale(${0.5 + 0.5 * sl})`, transformOrigin: "0 50%", opacity: Math.min(1, sl) }}>
        <div style={{ position: "relative", width: 40, height: 40, borderRadius: 11, background: "#FFB703", boxShadow: "0 0 30px #FFB70366" }}>
          <div style={{ left: 9, right: 9, top: 14, height: 4, borderRadius: 3, background: "#06140D" }} />
          <div style={{ left: 9, right: 15, top: 22, height: 4, borderRadius: 3, background: "#06140D" }} />
        </div>
        <div style={{ position: "static", font: `700 34px/1 ${DISP}`, letterSpacing: "-.02em", color: "#fff" }}>En Claro</div>
      </div>
      <TextoCinetico t={t} desde={f + 0.05} paso={0.12} texto="Dejá de achicar" amarillas={[]} style={{ left: 18, right: 18, top: 112, font: `700 40px/1 ${DISP}`, color: "#fff" }} />
      <TextoCinetico t={t} desde={f + 0.5} paso={0.12} texto="agua." amarillas={[0]} style={{ left: 18, right: 18, top: 156, font: `700 46px/1 ${DISP}`, color: "#fff" }} />
      <Pildora texto="Probalo gratis · 14 días sin tarjeta" style={{ left: 18, top: 214, transform: `scale(${sb})`, transformOrigin: "0 50%" }} />
      <div style={{ left: 40, right: 40, top: 496, padding: 12, borderRadius: 999, background: "#FFB703", textAlign: "center", font: `900 15px ${BODY}`, color: "#1A1200", overflow: "hidden", boxShadow: "0 10px 30px #FFB70355", opacity: Math.min(1, sc), transform: `scale(${0.8 + 0.2 * sc})` }}>
        <span style={{ position: "static" }}>Link en el perfil</span>
        <i style={{ top: 0, bottom: 0, width: 40, background: "linear-gradient(90deg,transparent,#ffffffaa,transparent)", left: I(t, f + 2.2, f + 2.9, -50, 300, eIO) }} />
      </div>
    </>
  );
};

export const SeHunde: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const listo = useFuentesListas();
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T_ = tiempos(pal);
  const c = camara(t, T_);
  const b = barco(t, T_);
  const sub = I(t, T_.dive + 0.35, T_.dive + 0.8, 0, 1, lin) * (1 - I(t, T_.tap + 2.5, T_.tap + 3.0, 0, 1, lin));
  const cielo = I(t, T_.tap + 2.6, T_.tap + 3.8, 0, 1, lin);

  // golpes: temblor y destellos
  let hs = 0, wf = 0, red = 0;
  [...GOLPES, SELLO].forEach((a, i) => {
    const d = t - a;
    if (d >= 0) { hs += (i === 2 ? 12 : 18) * Math.exp(-14 * d) * Math.sin(70 * d + 1.2); wf += Math.max(0, 1 - d / 0.15) * (i === 2 ? 0.25 : i === 0 ? 0.28 : 0.5); }
  });
  const golpes = [T_.dive, ...[0, 1, 2, 3].map((i) => popT(T_, i)), ...[0, 1, 2, 3].map((i) => plugT(T_, i)), T_.final];
  golpes.forEach((a) => { const d = t - a; if (d > 0) hs += 7 * Math.exp(-12 * d) * Math.sin(60 * d); });
  if (t >= SELLO) red += Math.max(0, 1 - (t - SELLO) / 0.35);
  [0, 1, 2, 3].forEach((i) => { const d = t - popT(T_, i); if (d > 0) red += Math.max(0, 1 - d / 0.35) * 0.6; });
  const lk = Math.max(win(t, T_.tap + 2.3, T_.tap + 3.3, 0.3, 0.5) * 0.7, win(t, T_.final - 0.3, T_.final + 0.8, 0.3, 0.6));

  // sonidos que dependen de la voz
  const extra: { en: number; sfx: string }[] = [
    { en: T_.dive + 0.05, sfx: "burbujas" }, { en: T_.dive + 0.5, sfx: "whoosh" }, { en: T_.son - 0.5, sfx: "riser" },
    { en: T_.claro, sfx: "whoosh" }, { en: T_.tap - 0.7, sfx: "riser" },
    ...[0, 1, 2, 3].flatMap((i) => [{ en: popT(T_, i), sfx: "thump" }, { en: popT(T_, i) + 0.03, sfx: "coins" }, { en: plugT(T_, i), sfx: "metal" }, { en: plugT(T_, i), sfx: "thump" }]),
    { en: T_.tap + 2.0, sfx: "agua" }, { en: T_.tap + 2.3, sfx: "rattle" }, { en: T_.tap + 2.8, sfx: "caja" },
    { en: T_.final - 0.3, sfx: "whoosh" }, { en: T_.final + 0.2, sfx: "gaviota" }, { en: T_.final + 2.0, sfx: "gaviota" }, { en: T_.final + 2.3, sfx: "thump" },
  ];
  const sonidos = [...g.sonidos, ...extra];

  return (
    <AbsoluteFill style={{ background: "#050f0a" }}>
      <style>{`.stage *{position:absolute;box-sizing:border-box} .stage{font-family:${BODY};color:#fff}`}</style>
      <div className="stage" style={{ position: "absolute", left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" }}>
        <Fondo t={t} />
        <div style={{ inset: 0, background: "radial-gradient(circle at 50% 35%, #1288bd, #052538 80%)", opacity: sub }} />
        <div style={{ inset: 0, background: "linear-gradient(#7ec8f5, #ffe9b5)", opacity: cielo * 0.95 * (1 - sub) }} />
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${hs * 3}px,${hs * 1.6}px)` }}>
        <ThreeCanvas width={1080} height={1920} shadows gl={{ alpha: true, antialias: true }} camera={{ fov: 56, near: 0.1, far: 200 }}>
          <Escena3D t={t} T_={T_} listo={listo} />
        </ThreeCanvas>
      </div>
      <div className="stage" style={{ position: "absolute", left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" }}>
        <Gancho t={t} hs={hs} />
        <Sube t={t} T_={T_} />
        <Agujeros t={t} T_={T_} c={c} b={b} />
        <Tapados t={t} T_={T_} />
        <Celular t={t} T_={T_} />
        <Final t={t} T_={T_} />
        <Grano frame={frame} />
        <Vineta />
        {lk > 0 ? <div style={{ inset: -40, mixBlendMode: "screen", opacity: lk, background: `radial-gradient(circle at ${45 + Math.sin(t) * 10}% 40%, #FFB703ee, #FF7A00aa 30%, transparent 65%)` }} /> : null}
        <div style={{ inset: 0, background: "#FF4D5A", opacity: Math.min(0.28, red * 0.25) }} />
        <div style={{ inset: 0, background: "#fff", opacity: clamp(wf, 0, 0.6) }} />
        <Subtitulos t={t} tv={t} g={g} palabras={pal} ocultos={[[-1, 3.2], [T_.final - 0.4, 31]]} />
      </div>

      {voz ? <Html5Audio src={staticFile(voz)} /> : null}
      {sonidos.map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.en * fps))} durationInFrames={Math.round(5 * fps)} layout="none">
          <Html5Audio src={staticFile(`sfx/${s.sfx}.wav`)} volume={0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
