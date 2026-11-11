import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { AbsoluteFill, Html5Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { I, clamp, eIO, eIn, eOut, lin, spring, win } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V3_01, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import { Fondo, Grano, Vineta } from "../components/Capas";
import { Subtitulos } from "../components/Subtitulos";
import { Icono } from "../components/Iconos";
import { TextoCinetico } from "../escenas/Dolor";
import { Billete, Cajones, Kiosco3D, Muneco, Piso, Podio, Reposera } from "./Modelos3D";
import type { VideoProps } from "../Video";

// Video 01 de IDEAS_V3: "El dueño del local gana más que vos" (28 s, 3D).
// Todo se calcula desde t (segundos). La cámara 3D y las etiquetas 2D usan la misma función camara(t).

const g = GUION_V3_01;
const KIOSCO_Z = -5;
const XD = -1.15; // podio del dueño
const XK = 1.15; // podio del kiosquero
const ALTO = (pesos: number) => (pesos / 400000) * 1.4;
const ESC = 1.25; // escala de los muñecos
const CABEZA = 2.2; // altura de la etiqueta sobre el podio

// ---------- línea de tiempo ----------
const GOLPES = [-0.06, 0.35];
const SELLO = 1.75;
const PASOS_K = [19.3, 20.5, 21.7]; // tarjetas que empujan al kiosquero
const SUMAS = [25000, 25000, 35000];

/** Plata del kiosquero en el segundo t (sube con cada tarjeta). */
function plataK(t: number) {
  let v = I(t, 6.6, 7.35, 0, 350000, eOut);
  PASOS_K.forEach((a, i) => (v += I(t, a + 0.45, a + 0.95, 0, SUMAS[i], eOut)));
  return v;
}
const plataD = (t: number) => I(t, 4.9, 5.75, 0, 400000, eOut);

/** Altura de un podio con rebote al frenar. */
function altoPodio(t: number, plata: number, frenos: number[]) {
  let rebote = 0;
  frenos.forEach((a) => { const d = t - a; if (d > 0) rebote += 0.08 * Math.exp(-7 * d) * Math.sin(d * 22); });
  return ALTO(plata) + rebote;
}

type Cam = { pos: [number, number, number]; target: [number, number, number]; fov: number };
const mixV = (a: number[], b: number[], k: number) => a.map((x, i) => x + (b[i] - x) * k) as [number, number, number];

export function camara(t: number): Cam {
  // gancho: el kiosco de frente ocupando la pantalla
  const gPos: [number, number, number] = [0, 2.9, I(t, 0, 2.8, 2.7, 2.2, lin)];
  const gTar: [number, number, number] = [0, 2.9, KIOSCO_Z];
  // podios: órbita lenta
  const th = I(t, 3.3, 12.9, -0.32, 0.3, lin);
  const r = I(t, 3.3, 12.9, 10.4, 9.5, lin);
  let pPos: [number, number, number] = [Math.sin(th) * r, 3.2, Math.cos(th) * r];
  let pTar: [number, number, number] = [0, 2.55, 0];
  if (t >= 16.9) {
    pPos = mixV([0, 3.1, 10.0], [0.35, 3.1, 9.3], I(t, 17, 24, 0, 1, lin));
    pTar = [0, 2.6, 0];
    const k = I(t, 24.2, 27.5, 0, 1, eIO);
    pPos = mixV(pPos, [-0.7, 3.0, 10.4], k);
    pTar = mixV(pTar, [0.2, 2.7, -1.5], k);
  }
  const k = I(t, 2.75, 3.45, 0, 1, eIO);
  return { pos: mixV(gPos, pPos, k), target: mixV(gTar, pTar, k), fov: 50 };
}

const camAux = new THREE.PerspectiveCamera(50, 9 / 16, 0.1, 200);
/** Punto 3D → posición en el lienzo de 360 × 640. */
function proyectar(c: Cam, p: [number, number, number]) {
  camAux.fov = c.fov;
  camAux.position.set(...c.pos);
  camAux.lookAt(...c.target);
  camAux.updateProjectionMatrix();
  camAux.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(camAux);
  return { x: ((v.x + 1) / 2) * 360, y: ((1 - v.y) / 2) * 640 };
}

const ControlCamara: React.FC<{ c: Cam }> = ({ c }) => {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  cam.fov = c.fov;
  cam.position.set(...c.pos);
  cam.lookAt(...c.target);
  cam.updateProjectionMatrix();
  return null;
};

/** Espera a que estén las fuentes para dibujar los carteles 3D con la tipografía correcta. */
function useFuentesListas() {
  const [listo, setListo] = useState(false);
  const [h] = useState(() => delayRender("fuentes para texturas 3D"));
  useEffect(() => {
    Promise.all([document.fonts.load("700 100px 'Space Grotesk'"), document.fonts.ready])
      .catch(() => undefined)
      .then(() => { setListo(true); continueRender(h); });
  }, [h]);
  return listo;
}

// ---------- escena 3D ----------
const Escena3D: React.FC<{ t: number; listo: boolean }> = ({ t, listo }) => {
  const c = camara(t);
  const hD = altoPodio(t, plataD(t), [5.75]);
  const hK = altoPodio(t, plataK(t), [7.35, ...PASOS_K.map((a) => a + 0.95)]);
  const negro = t > 12.9 && t < 17.0;
  // persiana del kiosco: a media altura, baja un poco más con la cuenta y sube al final
  const pers = clamp(0.5 + I(t, 6.6, 7.4, 0, 0.25, eOut) - I(t, 24.6, 25.8, 0, 0.75, eIO), 0, 1);
  const luz = I(t, 0, 0.01, 1, 1) * (1 - 0.55 * I(t, 6.6, 7.4, 0, 1)) + 0.55 * I(t, 25.3, 25.6, 0, 1);
  // dueño: reposera, anteojos y caída
  const repo = I(t, 8.2, 8.6, 0, 1, eOut);
  const rec = I(t, 8.4, 9.0, 0, 1, eIO) * (1 - I(t, 24.3, 24.5, 0, 1));
  const caida = I(t, 24.4, 25.05, 0, 1, eIn);
  const ocupado = t > 8.2 && t < 12.9;
  const festeja = t > 24.3;
  const billetes = [0, 0.35, 0.9].map((a, i) => {
    const d = t - a;
    if (d < 0 || d > 2.2) return null;
    return (
      <Billete key={i} fuentesListas={listo} position={[(i - 1) * 0.6 + Math.sin(d * 3 + i) * 0.4, 1.6 + d * 2.2 + d * d * 0.6, KIOSCO_Z + 1.4 + d * 2.4]} rot={[d * 5 + i, d * 3.3, d * 4 + i]} escala={1 + d * 0.3} />
    );
  });
  if (negro) return null;
  return (
    <>
      <ControlCamara c={c} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#7d95ff", "#3a2a1a", 0.55]} />
      <directionalLight position={[4, 9, 7]} intensity={2.4} color="#fff1dc" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-bias={-0.0004} />
      <directionalLight position={[-5, 4, -6]} intensity={0.9} color="#5FD39A" />
      <Piso />
      <Kiosco3D persiana={pers} luz={luz} fuentesListas={listo} position={[0, 0, KIOSCO_Z]} />
      {billetes}
      {t > 2.8 ? (
        <>
          <Podio x={XD} alto={hD} color="#2a3550" borde="#9aa4bd" />
          <Podio x={XK} alto={hK} color="#1B4332" borde="#FFB703" />
          {repo > 0.01 && caida < 1 ? <group position={[XD, hD + 0.06, 0]} scale={ESC}><Reposera position={[0, 0, 0]} abre={repo} /></group> : null}
          {hD > 0.3 && caida < 1 ? (
            <group position={[XD, hD + 0.06, 0]} scale={ESC}>
            <Muneco
              tipo="duenio"
              position={[0, -0.24 * rec, 0.02 * rec]}
              pose={{ recostado: rec, brazoD: 0.35 + 0.6 * rec, brazoI: rec * 0.4, lentes: t > 8.9, caida }}
            />
            </group>
          ) : null}
          {hK > 0.3 ? (
            <group position={[XK, hK + 0.06, 0.05]} scale={ESC}>
            <Muneco
              tipo="kiosquero"
              position={[0, 0, 0]}
              rotY={ocupado ? Math.sin(t * 5) * 0.35 : 0}
              pose={{
                brazoI: festeja ? 2.7 + Math.sin(t * 12) * 0.25 : ocupado ? 1.1 + 0.9 * Math.sin(t * 14) : 0.1,
                brazoD: festeja ? 2.7 + Math.sin(t * 12 + 1) * 0.25 : ocupado ? 1.1 + 0.9 * Math.sin(t * 14 + Math.PI) : 0.1,
                salto: festeja ? Math.abs(Math.sin(t * 8)) * 0.28 : ocupado ? Math.abs(Math.sin(t * 7)) * 0.06 : 0,
              }}
            />
            </group>
          ) : null}
          {t > 8.3 ? <Cajones position={[XK + 0.95, 0, 0.6]} cantidad={I(t, 8.4, 12.6, 0, 6, lin)} t={t} /> : null}
        </>
      ) : null}
    </>
  );
};

// ---------- capas 2D ----------
const Pildora: React.FC<{ texto: string; style?: React.CSSProperties }> = ({ texto, style }) => (
  <div style={{ padding: "4px 12px", borderRadius: 999, background: "#FFB703", color: "#1A1200", font: `900 15px ${BODY}`, letterSpacing: ".04em", ...style }}>{texto}</div>
);

const Gancho: React.FC<{ t: number; hs: number }> = ({ t, hs }) => {
  if (t > 3.0) return null;
  const L = g.ganchos[0].lineas;
  const o = win(t, -1, 2.95, 0.01, 0.25);
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 250, background: "linear-gradient(#000e,#000b 65%,transparent)" }} />
      <Pildora texto="KIOSQUERO:" style={{ left: 18, top: 62, transform: `scale(${0.6 + 0.4 * Math.min(1, spring(t + 0.2, 16, 0.4))}) rotate(-3deg)` }} />
      {L.map((l, i) => {
        const a = i < 2 ? GOLPES[i] : SELLO;
        const q = I(t, a, a + 0.13, 0, 1, eOut);
        const gl = i === 2 && t > a && t < a + 0.35;
        const size = Math.min(i === 2 ? 38 : 44, Math.floor(326 / (l.length * 0.66)));
        return (
          <div
            key={i}
            style={{
              left: 18, right: 10, top: i === 2 ? 186 : 94 + i * 46, whiteSpace: "nowrap", transformOrigin: "0 50%",
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

const Etiqueta: React.FC<{ x: number; y: number; arriba: string; monto: string; color: string; o: number; s: number; ejemplo?: boolean }> = ({ x, y, arriba, monto, color, o, s, ejemplo }) => (
  <div style={{ left: x - 80, top: y - 54, width: 160, textAlign: "center", opacity: o, transform: `scale(${0.4 + 0.6 * s})`, transformOrigin: "50% 100%" }}>
    <div style={{ position: "static", font: `800 11px ${BODY}`, letterSpacing: ".12em", color: "#ffffffcc", textShadow: "0 2px 0 #000" }}>{arriba}</div>
    <div style={{ position: "static", font: `700 30px/1.05 ${DISP}`, color, fontVariantNumeric: "tabular-nums", textShadow: "0 3px 0 #000, 0 0 18px #000" }}>{monto}</div>
    {ejemplo ? <div style={{ position: "static", font: `600 9px ${BODY}`, letterSpacing: ".1em", color: "#ffffff99", textTransform: "uppercase" }}>ejemplo</div> : null}
  </div>
);

const Cuenta: React.FC<{ t: number; c: Cam; shake: number }> = ({ t, c, shake }) => {
  const vis = (t > 4.85 && t < 12.9) || t > 17.0;
  if (!vis) return null;
  const hD = altoPodio(t, plataD(t), [5.75]);
  const hK = altoPodio(t, plataK(t), [7.35, ...PASOS_K.map((a) => a + 0.95)]);
  const pd = proyectar(c, [XD, hD + CABEZA, 0]);
  const pk = proyectar(c, [XK, hK + CABEZA, 0]);
  const kGana = plataK(t) > plataD(t);
  const caidaO = 1 - I(t, 24.4, 24.8, 0, 1);
  return (
    <>
      <Etiqueta x={pd.x + shake} y={pd.y} arriba="EL DUEÑO DEL LOCAL" monto={ars(plataD(t))} color="#ffffff" o={Math.min(1, win(t, 4.85, 40, 0.1, 0.1)) * caidaO} s={Math.min(1, spring(t - 4.9))} />
      <Etiqueta x={pk.x + shake} y={pk.y} arriba="VOS" monto={ars(plataK(t))} color={kGana ? "#5FD39A" : "#FFB703"} o={win(t, 6.55, 40, 0.1, 0.1)} s={Math.min(1, spring(t - 6.6))} ejemplo />
    </>
  );
};

const Vendes: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, 3.0, 8.15, 0.05, 0.2);
  if (o <= 0) return null;
  const s = spring(t - 3.0);
  const dif = spring(t - 7.45, 15, 0.4);
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 210, background: "linear-gradient(#000d,#0008 65%,transparent)" }} />
      <div style={{ left: 20, top: 64, font: `800 12px ${BODY}`, letterSpacing: ".12em", color: "#ffffffaa" }}>VENDÉS POR MES</div>
      <div style={{ left: 18, top: 82, font: `700 50px/1 ${DISP}`, color: "#fff", fontVariantNumeric: "tabular-nums", transform: `scale(${0.5 + 0.5 * s})`, transformOrigin: "0 50%", textShadow: "0 4px 0 #000" }}>{ars(I(t, 3.05, 3.75, 0, 3000000))}</div>
      <div style={{ right: 16, top: 66, font: `600 10px ${BODY}`, letterSpacing: ".1em", color: "#ffffff88", border: "1px solid #ffffff44", borderRadius: 5, padding: "2px 6px", textTransform: "uppercase" }}>ejemplo</div>
      {t > 7.4 ? (
        <div style={{ left: 18, top: 140, padding: "5px 12px", borderRadius: 10, background: "#FF4D5A", color: "#fff", font: `900 16px ${BODY}`, transform: `scale(${dif}) rotate(-2deg)`, transformOrigin: "0 50%", boxShadow: "0 8px 20px #0008" }}>
          Él se lleva $50.000 más que vos
        </div>
      ) : null}
    </div>
  );
};

const ElVsVos: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, 8.15, 12.9, 0.05, 0.01);
  if (o <= 0) return null;
  const items: [number, string, string][] = [[8.35, "No abre a las 8", "Abrís a las 8"], [9.65, "No atiende", "Atendés 14 h"], [11.0, "No fía", "Fiás"]];
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 230, background: "linear-gradient(#000d,#0009 70%,transparent)" }} />
      <div style={{ left: 18, top: 62, font: `700 22px ${DISP}`, color: "#9aa4bd" }}>ÉL</div>
      <div style={{ left: 196, top: 62, font: `700 22px ${DISP}`, color: "#FFB703" }}>VOS</div>
      {items.map(([a, el, vos], i) => {
        const s = Math.min(1, spring(t - a, 15, 0.45));
        const s2 = Math.min(1, spring(t - a - 0.12, 15, 0.45));
        return (
          <React.Fragment key={i}>
            <div style={{ left: 18, top: 92 + i * 34, font: `800 17px ${BODY}`, color: "#fff", opacity: s, transform: `translateX(${(1 - s) * -30}px)` }}>
              <span style={{ position: "static", color: "#5FD39A" }}>✓ </span>{el}
            </div>
            <div style={{ left: 196, top: 92 + i * 34, font: `800 17px ${BODY}`, color: "#fff", opacity: s2, transform: `translateX(${(1 - s2) * 30}px)` }}>
              <span style={{ position: "static", color: "#FF4D5A" }}>✗ </span>{vos}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const CorteNegro: React.FC<{ t: number }> = ({ t }) => {
  if (t <= 12.9 || t >= 17.0) return null;
  const d = t - 12.9;
  const push = 1 + d * 0.025;
  return (
    <div style={{ inset: 0, background: "#000" }}>
      <TextoCinetico t={t} desde={13.2} paso={0.13} texto="Y vos ni sabías esta cuenta." amarillas={[4, 5]} style={{ left: 22, right: 22, top: 104, font: `700 34px/1.08 ${DISP}`, color: "#fff" }} />
      <div style={{ left: 95, top: 270, width: 170, height: 220, transform: `scale(${push}) rotate(${-3 + Math.sin(t * 0.8) * 1.5}deg)` }}>
        <div style={{ inset: 0, borderRadius: "4px 10px 10px 4px", background: "linear-gradient(135deg,#34569c,#22396b)", boxShadow: "0 30px 60px #000, inset 6px 0 0 #1a2c55" }} />
        <div style={{ left: 22, right: 22, top: 40, height: 48, background: "#F4EBD3", borderRadius: 3, display: "grid", placeItems: "center", font: `700 18px ${DISP}`, color: "#22396b", letterSpacing: ".08em" }}>CUENTAS</div>
        <div style={{ left: 120, top: 0, width: 8, height: 220, background: "#111a" }} />
        <div style={{ left: -40 + ((d * 60) % 280), top: -10, width: 30, height: 240, background: "linear-gradient(90deg,transparent,#ffffff22,transparent)", transform: "rotate(12deg)" }} />
      </div>
      {Array.from({ length: 16 }, (_, i) => {
        const x = (i * 71) % 340, y = 600 - ((d * (14 + (i % 5) * 4) + i * 37) % 560);
        return <i key={i} style={{ left: x, top: y, width: 3, height: 3, borderRadius: "50%", background: "#ffe8b0", opacity: 0.35 }} />;
      })}
    </div>
  );
};

const TARJETAS: [string, string][] = [["Cobrá los fiados", "+$25.000"], ["Subí la gaseosa 8%", "+$25.000"], ["No repongas lo que no rota", "+$35.000"]];

const Solucion: React.FC<{ t: number; c: Cam }> = ({ t, c }) => {
  if (t < 17.0 || t > 24.4) return null;
  const sp = spring(t - 17.2, 11, 0.55);
  const chico = I(t, 18.5, 19.1, 0, 1, eIO);
  const sale = I(t, 23.8, 24.3, 0, 1, eIn);
  const hK = altoPodio(t, plataK(t), [7.35, ...PASOS_K.map((a) => a + 0.95)]);
  const destino = proyectar(c, [XK, hK + CABEZA - 0.3, 0]);
  const ox = 85 + (1 - chico) * 0 - chico * 70, oy = 200 + chico * 40;
  return (
    <>
      <div style={{ left: 0, right: 0, top: 0, height: 200, background: "linear-gradient(#000d,#0008 65%,transparent)", opacity: win(t, 17, 24.4, 0.1, 0.2) }} />
      <div style={{ left: 20, top: 62, font: `800 12px ${BODY}`, letterSpacing: ".12em", color: "#FFB703", opacity: win(t, 17.1, 24.4, 0.2, 0.2) }}>EN CLARO</div>
      <TextoCinetico t={t} desde={17.25} paso={0.07} texto="Te dice dónde se va tu plata." amarillas={[5]} style={{ left: 20, right: 20, top: 80, font: `700 28px/1.05 ${DISP}`, color: "#fff", opacity: win(t, 17.1, 24.4, 0.01, 0.2) }} />
      {/* celular */}
      <div style={{ left: ox, top: oy, width: 190, height: 390, perspective: 900, opacity: 1 - sale, transform: `translateY(${(1 - sp) * 560 + sale * 500}px) scale(${(0.75 + 0.3 * sp) * (1 - 0.4 * chico)})`, transformOrigin: "0 0" }}>
        <div style={{ inset: 0, borderRadius: 30, background: "#0b0b0b", boxShadow: "0 30px 60px #000c, 0 0 80px #FFB70333, inset 0 0 0 2px #2a2a2a", transform: `rotateY(${(1 - sp) * 50 - 10 + Math.sin(t) * 5}deg) rotateX(6deg)` }}>
          <div style={{ left: 8, top: 8, right: 8, bottom: 8, borderRadius: 23, overflow: "hidden", background: "#0E2A1C" }}>
            <div style={{ left: 60, right: 60, top: 6, height: 16, borderRadius: 9, background: "#000" }} />
            <div style={{ left: 14, top: 32, font: `700 13px ${DISP}`, color: "#fff" }}>Tu mes</div>
            <div style={{ left: 10, right: 10, top: 56, padding: 10, borderRadius: 12, background: "#143723", border: "1px solid #2f6a4b" }}>
              <div style={{ position: "static", font: `600 9px ${BODY}`, color: "#9DB8A8", letterSpacing: ".08em" }}>TE QUEDARON</div>
              <div style={{ position: "static", font: `700 24px/1.1 ${DISP}`, color: "#FFB703", fontVariantNumeric: "tabular-nums" }}>{ars(plataK(t))}</div>
            </div>
            {TARJETAS.map((x, i) => (
              <div key={i} style={{ left: 10, right: 10, top: 132 + i * 50, height: 42, borderRadius: 12, background: "#143723", border: "1px solid #2f6a4b", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", font: `600 10px ${BODY}`, color: "#fff", opacity: Math.min(1, spring(t - 17.6 - i * 0.15)) }}>
                <span style={{ position: "static" }}><Icono nombre="punto" size={10} color={["#FF4D5A", "#FFB703", "#9DB8A8"][i]} />{x[0]}</span>
                <b style={{ position: "static", color: "#5FD39A" }}>{x[1]}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* tarjetas que vuelan al podio del kiosquero */}
      {PASOS_K.map((a, i) => {
        const k = I(t, a, a + 0.5, 0, 1, eIn);
        const o = win(t, a, a + 0.55, 0.05, 0.08);
        if (o <= 0) return null;
        const x0 = 60, y0 = 330 + i * 30;
        const x = x0 + (destino.x - 70 - x0) * k, y = y0 + (destino.y - y0) * k - Math.sin(Math.PI * k) * 90;
        return (
          <div key={i} style={{ left: x, top: y, width: 150, padding: "8px 10px", borderRadius: 14, color: "#fff", background: "linear-gradient(160deg,#ffffff38,#ffffff12)", border: "1px solid #ffffff55", boxShadow: "0 14px 30px #000a", backdropFilter: "blur(8px)", opacity: o, transform: `scale(${1.1 - 0.6 * k}) rotate(${(1 - k) * -8 + k * 10}deg)` }}>
            <div style={{ position: "static", font: `700 11px ${BODY}` }}>{TARJETAS[i][0]}</div>
            <div style={{ position: "static", font: `700 20px ${DISP}`, color: "#5FD39A" }}>{TARJETAS[i][1]}</div>
          </div>
        );
      })}
    </>
  );
};

const Final: React.FC<{ t: number }> = ({ t }) => {
  if (t < 24.3) return null;
  const sl = spring(t - 24.5, 12, 0.45);
  const sp = spring(t - 24.65, 14, 0.4);
  const sb = spring(t - 25.6, 16, 0.4);
  const sc = spring(t - 26.2);
  return (
    <>
      <div style={{ left: 0, right: 0, top: 0, height: 230, background: "linear-gradient(#000c,#0007 65%,transparent)" }} />
      <div style={{ left: 18, top: 62, display: "flex", alignItems: "center", gap: 10, transform: `scale(${0.5 + 0.5 * sl})`, transformOrigin: "0 50%", opacity: Math.min(1, sl) }}>
        <div style={{ position: "relative", width: 40, height: 40, borderRadius: 11, background: "#FFB703", boxShadow: "0 0 30px #FFB70366" }}>
          <div style={{ left: 9, right: 9, top: 14, height: 4, borderRadius: 3, background: "#06140D" }} />
          <div style={{ left: 9, right: 15, top: 22, height: 4, borderRadius: 3, background: "#06140D" }} />
        </div>
        <div style={{ position: "static", font: `700 34px/1 ${DISP}`, letterSpacing: "-.02em", color: "#fff" }}>En Claro</div>
      </div>
      <div style={{ left: 18, top: 112, font: `700 44px/1 ${DISP}`, color: "#FFB703", transform: `scale(${1.6 - 0.6 * Math.min(1.2, sp)})`, transformOrigin: "0 50%", opacity: Math.min(1, sp * 2), textShadow: "0 4px 0 #000" }}>Probalo gratis.</div>
      <Pildora texto="14 días gratis · sin tarjeta" style={{ left: 18, top: 166, transform: `scale(${sb})`, transformOrigin: "0 50%" }} />
      <div style={{ left: 40, right: 40, top: 496, padding: 12, borderRadius: 999, background: "#FFB703", textAlign: "center", font: `900 15px ${BODY}`, color: "#1A1200", overflow: "hidden", boxShadow: "0 10px 30px #FFB70355", opacity: Math.min(1, sc), transform: `scale(${0.8 + 0.2 * sc})` }}>
        <span style={{ position: "static" }}>Link en el perfil</span>
        <i style={{ top: 0, bottom: 0, width: 40, background: "linear-gradient(90deg,transparent,#ffffffaa,transparent)", left: I(t, 26.6, 27.4, -50, 300, eIO) }} />
      </div>
    </>
  );
};

export const ElDueno: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const listo = useFuentesListas();
  const c = camara(t);
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);

  // golpes: temblor y destellos
  let hs = 0, wf = 0, red = 0, lk = 0;
  [...GOLPES.map((a) => Math.max(0, a)), SELLO].forEach((a, i) => {
    const d = t - a;
    if (d >= 0) { hs += (i === 2 ? 12 : 18) * Math.exp(-14 * d) * Math.sin(70 * d + 1.2); wf += Math.max(0, 1 - d / 0.15) * (i === 2 ? 0.25 : i === 0 ? 0.28 : 0.5); }
  });
  [5.75, 7.35, 12.9, 25.0].forEach((a) => { const d = t - a; if (d > 0) hs += 8 * Math.exp(-12 * d) * Math.sin(60 * d); });
  if (t >= 7.35) red += Math.max(0, 1 - (t - 7.35) / 0.35);
  if (t >= SELLO) red += Math.max(0, 1 - (t - SELLO) / 0.35);
  lk = Math.max(win(t, 16.7, 17.5, 0.3, 0.5), win(t, 22.1, 22.8, 0.2, 0.5) * 0.7, win(t, 25.2, 26.0, 0.3, 0.6));

  return (
    <AbsoluteFill style={{ background: "#050f0a" }}>
      <style>{`.stage *{position:absolute;box-sizing:border-box} .stage{font-family:${BODY};color:#fff}`}</style>
      <div className="stage" style={{ position: "absolute", left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" }}>
        <Fondo t={t} />
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${hs * 3}px,${hs * 1.6}px)` }}>
        <ThreeCanvas width={1080} height={1920} shadows gl={{ alpha: true, antialias: true }} camera={{ fov: 50, near: 0.1, far: 200 }}>
          <Escena3D t={t} listo={listo} />
        </ThreeCanvas>
      </div>
      <div className="stage" style={{ position: "absolute", left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" }}>
        <Cuenta t={t} c={c} shake={hs} />
        <Gancho t={t} hs={hs} />
        <Vendes t={t} />
        <ElVsVos t={t} />
        <Solucion t={t} c={c} />
        <Final t={t} />
        <CorteNegro t={t} />
        <Grano frame={frame} />
        <Vineta />
        {lk > 0 ? <div style={{ inset: -40, mixBlendMode: "screen", opacity: lk, background: `radial-gradient(circle at ${45 + Math.sin(t) * 10}% 40%, #FFB703ee, #FF7A00aa 30%, transparent 65%)` }} /> : null}
        <div style={{ inset: 0, background: "#FF4D5A", opacity: Math.min(0.28, red * 0.25) }} />
        <div style={{ inset: 0, background: "#fff", opacity: Math.min(0.6, wf) }} />
        <Subtitulos t={t} tv={t} g={g} palabras={pal} ocultos={[[-1, 3.0], [12.85, 17.05], [24.3, 30]]} />
      </div>

      {voz ? <Html5Audio src={staticFile(voz)} /> : null}
      {g.sonidos.map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.en * fps))} durationInFrames={Math.round(5 * fps)} layout="none">
          <Html5Audio src={staticFile(`sfx/${s.sfx}.wav`)} volume={s.sfx === "ukelele" ? 0.4 : 0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
