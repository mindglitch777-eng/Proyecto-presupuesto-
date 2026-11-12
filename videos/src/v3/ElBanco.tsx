import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { I, clamp, eIO, eIn, eOut, lin, rnd, spring, win } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V3_02, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import { Fondo, Grano, Vineta } from "../components/Capas";
import { Subtitulos } from "../components/Subtitulos";
import { Icono } from "../components/Iconos";
import { TextoCinetico } from "../escenas/Dolor";
import { Piso } from "./Modelos3D";
import { Banco, Cartel3D, Casita, Cuaderno3D, Moneda, MontonPapel, Papelito, Producto } from "./ModelosBanco";
import { ControlCamara, Pildora, mixV, useFuentesListas, type Cam } from "./ElDueno";
import type { VideoProps } from "../Video";

// Video 02 de IDEAS_V3: "Sos el banco del barrio" (27 s, 3D). Todo se calcula desde t (segundos).

const g = GUION_V3_02;
const GOLPES = [0, 0.35];
const SELLO = 1.75;
const PAGOS = [20.0, 21.0, 22.0]; // salen las monedas de cada casita hacia la bóveda
const DEUDAS: [string, number, string][] = [["Marta", 18000, "41 días"], ["Juan", 7500, "22 días"], ["Rosa", 12300, "9 días"]];
const LLEGA = 0.9;
const T_VOS = 10.85; // "Vos, cero." en la voz de Tomás // lo que tarda una moneda en llegar

type V3 = [number, number, number];
const CASITAS: V3[] = [[-1.75, 0, 3.4], [1.75, 0, 3.4], [-1.75, 0, 5.7], [1.75, 0, 5.7], [-1.75, 0, 8.0], [1.75, 0, 8.0]];
const VAULT: V3 = [0, 1.9, 0.9];

function camara(t: number): Cam {
  // gancho: fachada y cuaderno gigante de frente, algo bajo
  const gPos: V3 = [0, I(t, 0, 2.7, 2.9, 3.1, lin), I(t, 0, 2.7, 12.6, 11.8, lin)];
  const gTar: V3 = [0, 3.5, 0];
  // diorama: cámara alta que orbita despacio (el barrio hacia abajo en pantalla)
  const th = I(t, 3.6, 13.2, -0.2, 0.2, lin);
  let pPos: V3 = [Math.sin(th) * 13.5, I(t, 3.6, 13.2, 7.2, 6.6, lin), Math.cos(th) * 13.5 + 1.5];
  let pTar: V3 = [0, 1.5, 2.6];
  if (t >= 13.2) {
    pPos = mixV(pPos, [0, 6.6, 15.0], I(t, 13.2, 14.0, 0, 1, eIO));
    pTar = mixV(pTar, [0, 1.8, 2.2], I(t, 13.2, 14.0, 0, 1, eIO));
  }
  if (t >= 17.0) {
    pPos = mixV([0, 6.6, 15.0], [0.3, 6.2, 14.4], I(t, 17, 24, 0, 1, lin));
    pTar = [0, 1.8, 2.2];
  }
  const kf = I(t, 24.2, 27, 0, 1, eIO);
  pPos = mixV(pPos, [0, 4.6, 12.2], kf);
  pTar = mixV(pTar, [0, 3.7, 0.8], kf);
  const k = I(t, 2.75, 3.6, 0, 1, eIO);
  return { pos: mixV(gPos, pPos, k), target: mixV(gTar, pTar, k), fov: 56 };
}

/** Punto sobre una curva entre a y b que sube hasta `alto` a mitad de camino. */
function vuelo(t: number, t0: number, dur: number, a: V3, b: V3, alto: number): V3 | null {
  const p = (t - t0) / dur;
  if (p < 0 || p > 1) return null;
  const k = eIO(p);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + Math.sin(Math.PI * k) * alto, a[2] + (b[2] - a[2]) * k];
}

const Escena3D: React.FC<{ t: number; listo: boolean }> = ({ t, listo }) => {
  const c = camara(t);
  const abre = I(t, 2.8, 3.7, 0, 1, eOut);
  const brillo = I(t, PAGOS[0] + LLEGA, PAGOS[2] + LLEGA + 0.4, 0, 1, lin);
  // cuaderno: de pie delante del banco y después se desploma al suelo
  const cae = I(t, 2.6, 3.25, 0, 1, eIn);
  const chico = I(t, 3.0, 3.7, 0, 1, eIO);
  const cuadPos: V3 = [I(t, 2.6, 3.7, 0, 2.3, eIO), I(t, 2.6, 3.25, 1.2, 0.14, eIn), I(t, 2.6, 3.7, 5.4, 6.6, eIO)];
  const monton = I(t, 13.6, 16.6, 0, 1, eOut) * (1 - I(t, PAGOS[0] + LLEGA, PAGOS[2] + LLEGA + 0.4, 0, 1, eIO));

  // productos que salen de la bóveda hacia las casitas
  const productos: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const t0 = 3.4 + i * 0.38;
    const cs = CASITAS[i % CASITAS.length];
    const p = vuelo(t, t0, 1.1, [(i % 3 - 1) * 0.3, 1.7, 0.9], [cs[0], 0.7, cs[2] + 0.4], 1.7);
    if (p) productos.push(<Producto key={i} tipo={i} position={p} rot={[t * 4 + i, t * 3, t * 2]} />);
  }
  // monedas que vuelven
  const monedas: React.ReactNode[] = [];
  PAGOS.forEach((a, n) => {
    for (let j = 0; j < 4; j++) {
      const cs = CASITAS[(n * 2 + (j % 2)) % CASITAS.length];
      const p = vuelo(t, a + j * 0.1, LLEGA, [cs[0], 1.0, cs[2] + 0.3], VAULT, 2.4);
      if (p) monedas.push(<Moneda key={n * 10 + j} position={p} giro={t * 9 + j} />);
    }
  });
  // papelitos que llueven
  const papelitos: React.ReactNode[] = [];
  if (t > 13.3 && t < 16.4) {
    for (let i = 0; i < 70; i++) {
      const t0 = 13.3 + rnd(i) * 2.4, dur = 1.3 + rnd(i + 100) * 0.8;
      const pp = (t - t0) / dur;
      if (pp < 0 || pp > 1) continue;
      papelitos.push(
        <Papelito key={i} listo={listo} position={[(rnd(i + 200) - 0.5) * 5 + Math.sin(t * 3 + i) * 0.4 * (1 - pp), 7.5 - 7.0 * pp * pp, 0.9 + rnd(i + 300) * 2.0]} rot={[t * 4 + i, t * 3 + i * 2, t * 5]} />,
      );
    }
  }
  // carteles BANCO / VOS
  const sB = Math.min(1.05, spring(t - 8.6, 13, 0.5)) * (1 - I(t, 13.0, 13.35, 0, 1, eIn));
  const sV = Math.min(1.05, spring(t - T_VOS, 13, 0.5)) * (1 - I(t, 13.0, 13.35, 0, 1, eIn));

  return (
    <>
      <ControlCamara c={c} />
      <ambientLight intensity={0.4} />
      <hemisphereLight args={["#7d95ff", "#3a2a1a", 0.6]} />
      <directionalLight position={[5, 11, 9]} intensity={2.5} color="#fff1dc" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-bias={-0.0004} />
      <directionalLight position={[-6, 4, -6]} intensity={0.8} color="#5FD39A" />
      <Piso />
      <Banco abre={abre} brillo={brillo} listo={listo} />
      {t < 3.8 ? (
        <group position={cuadPos} rotation={[-0.25 - 1.2 * cae, 0, 0]} scale={0.82 * (1 - 0.45 * chico)}>
          <Cuaderno3D listo={listo} />
        </group>
      ) : (
        <group position={[2.3, 0.14, 6.6]} rotation={[-1.45, 0, 0.3]} scale={0.55}>
          <Cuaderno3D listo={listo} />
        </group>
      )}
      {t > 3.0 ? CASITAS.map((p, i) => <Casita key={i} position={p} i={i} pulso={0} />) : null}
      {productos}
      {monedas}
      {t > 8.5 && t < 13.4 ? (
        <>
          <Cartel3D tipo="banco" position={[-2.5, 0, 2.4]} rotY={0.28} escala={sB} listo={listo} />
          <Cartel3D tipo="vos" position={[2.5, 0, 2.4]} rotY={-0.28} escala={sV} listo={listo} />
        </>
      ) : null}
      {monton > 0.01 ? <MontonPapel k={monton} listo={listo} /> : null}
      {papelitos}
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
              left: 18, right: 10, top: i === 2 ? 188 : 92 + i * 42, whiteSpace: "nowrap", transformOrigin: "0 50%",
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

const Prestas: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, 3.2, 8.4, 0.05, 0.25);
  if (o <= 0) return null;
  const sellos: [number, string, string][] = [[5.9, "SIN FIRMA", "#FFB703"], [6.6, "SIN INTERÉS", "#FF4D5A"], [7.34, "SIN FECHA", "#5FD39A"]];
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 215, background: "linear-gradient(#000d,#0009 65%,transparent)" }} />
      <TextoCinetico t={t} desde={3.45} paso={0.08} texto="Prestás de todo." amarillas={[2]} style={{ left: 20, right: 20, top: 66, font: `700 34px/1.05 ${DISP}`, color: "#fff" }} />
      <div style={{ left: 20, top: 108, font: `800 13px ${BODY}`, letterSpacing: ".1em", color: "#ffffffaa" }}>LECHE · PAN · CIGARRILLOS</div>
      {sellos.map(([a, txt, col], i) => {
        // un sello a la vez, en el mismo lugar: cada uno reemplaza al anterior
        const fin = i < 2 ? sellos[i + 1][0] : 8.2;
        if (t < a || t >= fin) return null;
        const s = Math.min(1.1, spring(t - a, 15, 0.4));
        return (
          <div key={i} style={{ left: 20, top: 128, padding: "3px 14px", border: `3px solid ${col}`, borderRadius: 8, color: col, font: `700 28px ${DISP}`, letterSpacing: ".05em", transform: `scale(${s}) rotate(${-3 + i * 3}deg)`, transformOrigin: "0 50%", opacity: Math.min(1, s * 2), background: "#000a" }}>
            {txt}
          </div>
        );
      })}
    </div>
  );
};

const Compara: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, 8.4, 13.2, 0.05, 0.2);
  if (o <= 0) return null;
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 200, background: "linear-gradient(#000d,#0009 65%,transparent)" }} />
      <TextoCinetico t={t} desde={8.7} paso={0.09} texto="Un banco cobra." amarillas={[]} style={{ left: 20, right: 20, top: 68, font: `700 34px/1.05 ${DISP}`, color: "#c9d3e3" }} />
      <TextoCinetico t={t} desde={T_VOS} paso={0.09} texto="Vos, cero." amarillas={[0]} style={{ left: 20, right: 20, top: 112, font: `700 44px/1.05 ${DISP}`, color: "#fff" }} />
      <div style={{ right: 16, top: 66, font: `600 10px ${BODY}`, letterSpacing: ".1em", color: "#ffffff88", border: "1px solid #ffffff44", borderRadius: 5, padding: "2px 6px", textTransform: "uppercase" }}>ejemplo</div>
    </div>
  );
};

const Encima: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, 13.2, 17.1, 0.05, 0.3);
  if (o <= 0) return null;
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 230, background: "linear-gradient(#000e,#000b 65%,transparent)" }} />
      <TextoCinetico t={t} desde={13.45} paso={0.12} texto="Y encima," amarillas={[]} style={{ left: 20, right: 20, top: 74, font: `700 42px/1.05 ${DISP}`, color: "#fff" }} />
      <TextoCinetico t={t} desde={14.1} paso={0.14} texto="nadie te paga." amarillas={[]} style={{ left: 20, right: 20, top: 124, font: `700 46px/1.05 ${DISP}`, color: "#FF4D5A" }} />
    </div>
  );
};

const Solucion: React.FC<{ t: number }> = ({ t }) => {
  if (t < 17.0 || t > 24.4) return null;
  const sp = spring(t - 17.2, 11, 0.55);
  const chico = I(t, 18.6, 19.2, 0, 1, eIO);
  const sale = I(t, 23.9, 24.4, 0, 1, eIn);
  let debe = 0;
  DEUDAS.forEach(([, m], i) => (debe += m - I(t, PAGOS[i] + LLEGA, PAGOS[i] + LLEGA + 0.4, 0, m, eOut)));
  const cobrado = t > PAGOS[2] + LLEGA + 0.4;
  const ox = 85 - chico * 78, oy = 190 + chico * 128;
  return (
    <>
      <div style={{ left: 0, right: 0, top: 0, height: 200, background: "linear-gradient(#000d,#0008 65%,transparent)", opacity: win(t, 17, 24.4, 0.1, 0.2) }} />
      <div style={{ left: 20, top: 62, font: `800 12px ${BODY}`, letterSpacing: ".12em", color: "#FFB703", opacity: win(t, 17.1, 24.4, 0.2, 0.2) }}>EN CLARO</div>
      <TextoCinetico t={t} desde={17.25} paso={0.07} texto="Te dice quién te debe." amarillas={[3]} style={{ left: 20, right: 20, top: 80, font: `700 28px/1.05 ${DISP}`, color: "#fff", opacity: win(t, 17.1, 24.4, 0.01, 0.2) }} />
      {/* lo que te deben, grande, con el semáforo */}
      <div style={{ left: 20, top: 122, opacity: win(t, 18.4, 24.4, 0.2, 0.2) }}>
        <div style={{ position: "static", font: `800 11px ${BODY}`, letterSpacing: ".12em", color: "#ffffffbb" }}>{cobrado ? "COBRADO" : "TE DEBEN"} <span style={{ position: "static", color: "#ffffff88", fontSize: 9 }}>· EJEMPLO</span></div>
        <div style={{ position: "static", font: `700 46px/1 ${DISP}`, fontVariantNumeric: "tabular-nums", color: cobrado ? "#5FD39A" : "#FF4D5A", textShadow: "0 4px 0 #000" }}>{cobrado ? ars(37800) : ars(debe)}</div>
      </div>
      <div style={{ left: ox, top: oy, width: 190, height: 390, perspective: 900, opacity: 1 - sale, transform: `translateY(${(1 - sp) * 560 + sale * 500}px) scale(${(0.75 + 0.3 * sp) * (1 - 0.42 * chico)})`, transformOrigin: "0 0" }}>
        <div style={{ inset: 0, borderRadius: 30, background: "#0b0b0b", boxShadow: "0 30px 60px #000c, 0 0 80px #FFB70333, inset 0 0 0 2px #2a2a2a", transform: `rotateY(${(1 - sp) * 50 - 10 + Math.sin(t) * 5}deg) rotateX(6deg)` }}>
          <div style={{ left: 8, top: 8, right: 8, bottom: 8, borderRadius: 23, overflow: "hidden", background: "#0E2A1C" }}>
            <div style={{ left: 60, right: 60, top: 6, height: 16, borderRadius: 9, background: "#000" }} />
            <div style={{ left: 14, top: 32, font: `700 13px ${DISP}`, color: "#fff" }}>Quién te debe</div>
            {DEUDAS.map(([n, m, d], i) => {
              const pagado = t > PAGOS[i] + LLEGA;
              const avisa = t > PAGOS[i] - 0.5 && !pagado;
              const col = pagado ? "#5FD39A" : i === 2 ? "#FFB703" : "#FF4D5A";
              return (
                <div key={i} style={{ left: 10, right: 10, top: 58 + i * 62, height: 54, borderRadius: 12, background: "#143723", border: `1px solid ${pagado ? "#5FD39A" : "#2f6a4b"}`, padding: "6px 10px", opacity: Math.min(1, spring(t - 17.6 - i * 0.15)) }}>
                  <div style={{ position: "static", font: `700 12px ${DISP}`, color: "#fff" }}><Icono nombre="punto" size={10} color={col} />{n} · {ars(m)}</div>
                  <div style={{ position: "static", font: `600 9px ${BODY}`, color: pagado ? "#5FD39A" : "#9DB8A8", marginTop: 2 }}>{pagado ? "Cobrado ✓" : `Debe hace ${d}`}</div>
                  {!pagado ? (
                    <div style={{ right: 8, top: 14, padding: "3px 8px", borderRadius: 999, background: "#25D366", color: "#062", font: `800 8px ${BODY}`, transform: `scale(${avisa ? 1.15 : 1})` }}>Avisar</div>
                  ) : null}
                </div>
              );
            })}
            <div style={{ left: 10, right: 10, top: 252, padding: 10, borderRadius: 12, background: "#143723", border: "1px solid #2f6a4b" }}>
              <div style={{ position: "static", font: `600 9px ${BODY}`, color: "#9DB8A8", letterSpacing: ".08em" }}>TE DEBEN</div>
              <div style={{ position: "static", font: `700 22px/1.1 ${DISP}`, color: cobrado ? "#5FD39A" : "#FFB703", fontVariantNumeric: "tabular-nums" }}>{ars(debe)}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Final: React.FC<{ t: number }> = ({ t }) => {
  if (t < 24.1) return null;
  const sl = spring(t - 24.3, 12, 0.45);
  const sb = spring(t - 25.6, 16, 0.4);
  const sc = spring(t - 26.0);
  return (
    <>
      <div style={{ left: 0, right: 0, top: 0, height: 240, background: "linear-gradient(#000c,#0007 65%,transparent)" }} />
      <div style={{ left: 18, top: 62, display: "flex", alignItems: "center", gap: 10, transform: `scale(${0.5 + 0.5 * sl})`, transformOrigin: "0 50%", opacity: Math.min(1, sl) }}>
        <div style={{ position: "relative", width: 40, height: 40, borderRadius: 11, background: "#FFB703", boxShadow: "0 0 30px #FFB70366" }}>
          <div style={{ left: 9, right: 9, top: 14, height: 4, borderRadius: 3, background: "#06140D" }} />
          <div style={{ left: 9, right: 15, top: 22, height: 4, borderRadius: 3, background: "#06140D" }} />
        </div>
        <div style={{ position: "static", font: `700 34px/1 ${DISP}`, letterSpacing: "-.02em", color: "#fff" }}>En Claro</div>
      </div>
      <TextoCinetico t={t} desde={24.55} paso={0.12} texto="Cobrá como" amarillas={[]} style={{ left: 18, right: 18, top: 112, font: `700 42px/1 ${DISP}`, color: "#fff" }} />
      <TextoCinetico t={t} desde={25.0} paso={0.12} texto="un banco." amarillas={[1]} style={{ left: 18, right: 18, top: 158, font: `700 46px/1 ${DISP}`, color: "#fff" }} />
      <Pildora texto="Probalo gratis · 14 días sin tarjeta" style={{ left: 18, top: 216, transform: `scale(${sb})`, transformOrigin: "0 50%" }} />
      <div style={{ left: 40, right: 40, top: 496, padding: 12, borderRadius: 999, background: "#FFB703", textAlign: "center", font: `900 15px ${BODY}`, color: "#1A1200", overflow: "hidden", boxShadow: "0 10px 30px #FFB70355", opacity: Math.min(1, sc), transform: `scale(${0.8 + 0.2 * sc})` }}>
        <span style={{ position: "static" }}>Link en el perfil</span>
        <i style={{ top: 0, bottom: 0, width: 40, background: "linear-gradient(90deg,transparent,#ffffffaa,transparent)", left: I(t, 26.2, 26.9, -50, 300, eIO) }} />
      </div>
    </>
  );
};

export const ElBanco: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const listo = useFuentesListas();
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);

  let hs = 0, wf = 0, red = 0;
  [...GOLPES, SELLO].forEach((a, i) => {
    const d = t - a;
    if (d >= 0) { hs += (i === 2 ? 12 : 18) * Math.exp(-14 * d) * Math.sin(70 * d + 1.2); wf += Math.max(0, 1 - d / 0.15) * (i === 2 ? 0.25 : i === 0 ? 0.28 : 0.5); }
  });
  [2.8, 8.7, T_VOS, 13.4, 16.5, 24.9].forEach((a) => { const d = t - a; if (d > 0) hs += 8 * Math.exp(-12 * d) * Math.sin(60 * d); });
  if (t >= SELLO) red += Math.max(0, 1 - (t - SELLO) / 0.35);
  if (t >= 8.6) red += Math.max(0, 1 - (t - 8.6) / 0.35) * 0.7;
  if (t >= 13.4) red += Math.max(0, 1 - (t - 13.4) / 0.35) * 0.7;
  const lk = Math.max(win(t, 22.6, 23.6, 0.3, 0.5) * 0.7, win(t, 24.2, 25.2, 0.3, 0.6));

  return (
    <AbsoluteFill style={{ background: "#050f0a" }}>
      <style>{`.stage *{position:absolute;box-sizing:border-box} .stage{font-family:${BODY};color:#fff}`}</style>
      <div className="stage" style={{ position: "absolute", left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" }}>
        <Fondo t={t} />
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${hs * 3}px,${hs * 1.6}px)` }}>
        <ThreeCanvas width={1080} height={1920} shadows gl={{ alpha: true, antialias: true }} camera={{ fov: 56, near: 0.1, far: 200 }}>
          <Escena3D t={t} listo={listo} />
        </ThreeCanvas>
      </div>
      <div className="stage" style={{ position: "absolute", left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" }}>
        <Gancho t={t} hs={hs} />
        <Prestas t={t} />
        <Compara t={t} />
        <Encima t={t} />
        <Solucion t={t} />
        <Final t={t} />
        <Grano frame={frame} />
        <Vineta />
        {lk > 0 ? <div style={{ inset: -40, mixBlendMode: "screen", opacity: lk, background: `radial-gradient(circle at ${45 + Math.sin(t) * 10}% 40%, #FFB703ee, #FF7A00aa 30%, transparent 65%)` }} /> : null}
        <div style={{ inset: 0, background: "#FF4D5A", opacity: Math.min(0.28, red * 0.25) }} />
        <div style={{ inset: 0, background: "#fff", opacity: clamp(wf, 0, 0.6) }} />
        <Subtitulos t={t} tv={t} g={g} palabras={pal} ocultos={[[-1, 3.2], [13.2, 17.1], [24.1, 30]]} />
      </div>

      {voz ? <Html5Audio src={staticFile(voz)} /> : null}
      {g.sonidos.map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.en * fps))} durationInFrames={Math.round(5 * fps)} layout="none">
          <Html5Audio src={staticFile(`sfx/${s.sfx}.wav`)} volume={0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
