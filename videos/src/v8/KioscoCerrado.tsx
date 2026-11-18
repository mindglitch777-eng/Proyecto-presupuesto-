import React, { useMemo } from "react";
import * as THREE from "three";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { GUION_V8_10, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, camaraClaves, lineasDeVoz, temblor, type Cam2D, type Clave } from "../v6/comun";
import { Cartel, CupoFundadores, Rotulo, entra, latido, ritmo, sp } from "./comun";
import { Camara, Estudio, PantallaApp, Profundidad, cajaR, useLienzo } from "./estudio3d";
import { C } from "./iconos";
import { FacturaClavo, HojaMes, Kiosco3D, Papelito, PersianaFrente, Polvo, Registradora3D, Vereda } from "./modelos3d";

// V8-10 "Entramos a un kiosco que cerró" (videos/guiones/V8-10-KIOSCO-CERRADO.md). RECREACIÓN (historia de ejemplo, no un caso real).
// Todo oscuro salvo el haz de la linterna (spotlight que sigue a la cámara) y el brillo de la caja. Las tres pistas: cuaderno, factura, papelito.

const g = GUION_V8_10;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const X = -30; // el interior está aparte del frente
const RENGLONES: [string, string][] = [["Marta", "$62.000"], ["Carlos", "$54.000"], ["Juan", "$48.000"], ["Rosa", "$41.500"], ["Beto", "$39.000"], ["Nélida", "$36.500"], ["Hugo", "$33.000"], ["Sandra", "$29.000"], ["Pocho", "$21.000"], ["Graciela", "$16.000"]];
// grabación real de la app (app/scripts/grabar-v8.cjs v8-10)
const APP = { fiados: 2.175, aumento: 5.16, fin: 7.361 };
const CAJA: [number, number, number] = [X, 1.04, -1.25];
const CUADERNO: [number, number, number] = [X - 0.75, 1.045, -1.15];
const FACTURA: [number, number, number] = [X + 1.95, 1.55, -0.6];

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e, dur,
    entramos: w(0, "entramos", 2.5), mira: w(0, "mirá", 3.7),
    cuaderno: w(2, "cuaderno", l[2] + 1.3), trescientos: w(2, "trescientos", l[2] + 2.0), nadie: w(2, "nadie", e[2] - 0.8),
    factura: w(3, "factura", l[3] + 1.2), veinte: w(3, "veinte", l[3] + 3.3), viejo: w(3, "viejo", e[3] - 0.4),
    caja: w(4, "caja", l[4] + 0.3), algo: w(4, "algo", e[4] - 0.4),
    sale: w(5, "sale", e[5] - 0.4),
    cerro2: w(6, "cerró", l[6] + 1.9), quedaba: w(6, "quedaba", e[6] - 0.5),
    linterna: w(7, "linterna", l[7] + 0.7), cuanto: w(7, "cuánto", l[7] + 3.3), quien: w(7, "quién", l[7] + 4.8), precio: w(7, "precio", l[7] + 6.4),
    papelito: w(8, "papelito", e[8] - 0.7),
    LOOP: dur - 0.27,
  };
}
type T = ReturnType<typeof tiempos>;

/** Persiana del frente: baja en el cuadro 0, sube de golpe a la mitad, y al final vuelve a bajar despacio (empalma con el inicio). */
function persiana(t: number, T: T) {
  if (t >= T.l[8]) return 0.5 * (1 - clamp((t - T.l[8]) / Math.max(1, T.LOOP - T.l[8] - 0.3), 0, 1));
  return 0.5 * entra((t - 0.15) / 0.35);
}

function claves(T: T): Clave[] {
  const { l } = T;
  const c0: Clave = { t: 0, pos: [0.25, 1.15, 5.0], target: [0, 1.0, 0], fov: 50 };
  const caja: [number, number, number] = [CAJA[0], CAJA[1] + 0.15, CAJA[2]];
  return [
    c0,
    { t: T.entramos - 0.1, pos: [0.15, 1.0, 4.0], target: [0, 0.9, 0], fov: 50 },
    { t: T.mira - 0.15, pos: [0.0, 0.65, 1.3], target: [0, 0.6, 0], fov: 52 },
    { t: T.mira, pos: [X, 0.7, 2.4], target: [X, 0.95, -1.3], fov: 52 },
    { t: l[1] - 0.1, pos: [X + 0.05, 1.1, 1.8], target: caja, fov: 50 },
    { t: l[1] + 0.6, pos: [X + 0.3, 1.35, 1.3], target: [X - 1.9, 1.3, -0.3], fov: 52 },
    { t: l[2] - 0.1, pos: [X + 0.2, 1.4, 1.2], target: [X - 1.4, 1.95, -1.8], fov: 52 },
    { t: l[2] + 0.4, pos: [X - 0.6, 1.5, -0.35], target: CUADERNO, fov: 44 },
    { t: l[3] - 0.1, pos: [X - 0.65, 1.47, -0.4], target: CUADERNO, fov: 42 },
    { t: l[3] + 0.5, pos: [X + 1.15, 1.45, -0.2], target: FACTURA, fov: 44 },
    { t: l[4] - 0.1, pos: [X + 1.25, 1.45, -0.28], target: [FACTURA[0], FACTURA[1] - 0.12, FACTURA[2]], fov: 42 },
    { t: l[4] + 0.5, pos: [X + 0.1, 1.45, 0.05], target: caja, fov: 44 },
    { t: l[5] - 0.2, pos: [X + 0.05, 1.5, -0.45], target: [CAJA[0], CAJA[1] + 0.05, CAJA[2] + 0.3], fov: 42 },
    { t: l[5] + 0.3, pos: [X + 0.02, 1.52, -0.66], target: [CAJA[0], CAJA[1], CAJA[2] + 0.34], fov: 36 },
    { t: l[6] - 0.15, pos: [X + 0.0, 1.47, -0.7], target: [CAJA[0], CAJA[1], CAJA[2] + 0.34], fov: 34 },
    { t: l[6] + 0.4, pos: [X + 0.2, 1.4, 1.2], target: [X - 0.2, 1.6, -2.3], fov: 50 },
    { t: l[7] - 0.1, pos: [X + 0.1, 1.35, 1.35], target: [X - 0.2, 1.6, -2.3], fov: 50 },
    { t: l[7] + 0.5, pos: [X + 0.3, 1.6, 0.5], target: [X + 0.2, 1.7, -2.3], fov: 52 },
    { t: l[8] - 0.1, pos: [X + 0.25, 1.6, 0.35], target: [X + 0.2, 1.7, -2.3], fov: 51 },
    { t: l[8] + 0.4, pos: [0.22, 1.13, 4.95], target: [0, 1.0, 0], fov: 50 },
    { ...c0, t: T.LOOP },
  ];
}

/** Linterna: luz de cono que sale de la cámara y apunta a donde mira (con temblor de mano). */
const Linterna: React.FC<{ pos: number[]; target: number[]; t: number; fuerza: number }> = ({ pos, target, t, fuerza }) => {
  const { luz, mira } = useMemo(() => {
    const l = new THREE.SpotLight("#fff2d6", 0, 12, 0.42, 0.55, 1.6);
    l.castShadow = true;
    l.shadow.mapSize.set(1024, 1024);
    const m = new THREE.Object3D();
    l.target = m;
    return { luz: l, mira: m };
  }, []);
  const dist = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]);
  luz.intensity = 20 * fuerza * Math.min(1, Math.pow(dist / 1.3, 2));
  luz.position.set(pos[0] + 0.12, pos[1] - 0.12, pos[2] + 0.02);
  mira.position.set(target[0] + Math.sin(t * 2.3) * 0.03, target[1] + Math.cos(t * 1.9) * 0.025, target[2]);
  return (
    <>
      <primitive object={luz} />
      <primitive object={mira} />
    </>
  );
};

/** Cuaderno de fiados grande abierto con sus renglones (se iluminan uno por uno). */
const CuadernoFiados: React.FC<{ luz: number; cerrado: number }> = ({ luz, cerrado }) => {
  const tex = useLienzo("cuaderno-v810", 768, 512, (x, w, h) => {
    x.fillStyle = "#fffdf4"; x.fillRect(0, 0, w, h);
    x.strokeStyle = "#9cc3e8"; x.lineWidth = 2;
    for (let y = 44; y < h; y += 42) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
    x.fillStyle = "#d9d2bf"; x.fillRect(w / 2 - 6, 0, 12, h);
    x.font = `400 30px "Permanent Marker", cursive`;
    RENGLONES.forEach(([n, m], i) => {
      const col = i < 5 ? 0 : 1, fila = i % 5;
      x.fillStyle = "#1d3b8a";
      x.fillText(n, 30 + col * (w / 2), 82 + fila * 84);
      x.textAlign = "right"; x.fillText(m, (col + 1) * (w / 2) - 26, 82 + fila * 84); x.textAlign = "left";
    });
    x.fillStyle = "rgba(120,110,90,0.18)"; x.fillRect(0, 0, w, h);
  });
  return (
    <group>
      <mesh position={[0, 0.006, 0]} castShadow receiveShadow><boxGeometry args={[0.64, 0.012, 0.42]} /><meshStandardMaterial color="#5a3d22" roughness={0.8} /></mesh>
      <mesh position={[0, 0.0125, 0]} rotation-x={-Math.PI / 2}><planeGeometry args={[0.62, 0.4]} /><meshStandardMaterial map={tex} roughness={0.9} /></mesh>
      {/* renglón iluminado */}
      {luz >= 0 && luz < 10 ? (
        <mesh position={[-0.155 + (luz >= 5 ? 0.31 : 0), 0.0135, -0.137 + (Math.floor(luz) % 5) * 0.066]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.3, 0.05]} /><meshBasicMaterial color="#ffe28a" transparent opacity={0.4} toneMapped={false} />
        </mesh>
      ) : null}
      <group position={[0, 0.013, -0.21]} rotation-x={cerrado * Math.PI * 0.98}>
        <mesh position={[0, 0.003, 0.105]} castShadow><boxGeometry args={[0.62, 0.006, 0.21]} /><meshStandardMaterial color="#1e7a4c" roughness={0.6} /></mesh>
      </group>
    </group>
  );
};

/** Barras proyectadas en la pared: VENDÍA (alta) y LE QUEDABA: ? (punteada, sin llenar). */
const Barras: React.FC<{ k: number }> = ({ k }) => {
  const tex = useLienzo("barras-v810", 512, 640, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = "rgba(255,226,138,0.85)"; x.fillRect(60, 120, 150, h - 200);
    x.strokeStyle = "rgba(255,226,138,0.9)"; x.lineWidth = 6; x.setLineDash([18, 14]); x.strokeRect(300, 120, 150, h - 200);
    x.setLineDash([]);
    x.fillStyle = "#fff6d8"; x.font = `800 30px "Space Grotesk", sans-serif`; x.textAlign = "center";
    x.fillText("VENDÍA", 135, 70); x.fillText("$150.000/día", 135, 104);
    x.fillText("LE QUEDABA", 375, 70); x.font = `800 120px "Space Grotesk", sans-serif`; x.fillText("?", 375, 380);
    x.font = `600 24px "Inter", sans-serif`; x.fillText("(ejemplo)", 135, h - 40);
  });
  return (
    <mesh scale={[1, k, 1]} position={[0, (k - 1) * 0.6, 0]}>
      <planeGeometry args={[1.0, 1.25]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
};

/** Góndola de pared medio vacía con golosinas polvorientas. */
const Gondola: React.FC = () => (
  <group>
    <mesh position={[0, 1.1, -0.15]} receiveShadow><boxGeometry args={[1.6, 2.2, 0.04]} /><meshStandardMaterial color="#cfc9bd" roughness={0.9} /></mesh>
    {[0.35, 0.85, 1.35, 1.85].map((y, f) => (
      <group key={y}>
        <mesh position={[0, y, 0.05]} castShadow receiveShadow><boxGeometry args={[1.56, 0.03, 0.38]} /><meshStandardMaterial color="#9ea29c" metalness={0.5} roughness={0.5} /></mesh>
        {Array.from({ length: 9 }, (_, k) => (rnd(f * 9 + k) > 0.45 ? (
          <mesh key={k} position={[-0.68 + k * 0.17, y + 0.08, 0.06 + (rnd(k + f) - 0.5) * 0.1]} rotation-y={(rnd(k * 3 + f) - 0.5) * 0.4} rotation-z={rnd(k + f * 5) > 0.85 ? 1.4 : 0} geometry={cajaR(0.11, 0.14, 0.08, 0.01, 2)} castShadow>
            <meshStandardMaterial color={["#a8665e", "#b8a06a", "#5f8a6e", "#6d7fa0", "#a87c94"][(k + f) % 5]} roughness={0.9} />
          </mesh>
        ) : null))}
      </group>
    ))}
  </group>
);

const Interior: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const piso = useLienzo("piso-v810", 512, 512, (x, w, h) => {
    x.fillStyle = "#8f887c"; x.fillRect(0, 0, w, h);
    x.strokeStyle = "#6f695f"; x.lineWidth = 4;
    for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo((i * w) / 4, 0); x.lineTo((i * w) / 4, h); x.stroke(); x.beginPath(); x.moveTo(0, (i * h) / 4); x.lineTo(w, (i * h) / 4); x.stroke(); }
    for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${rnd(i) > 0.5 ? "60,55,48" : "200,195,185"},${0.04 + rnd(i + 1) * 0.06})`; x.fillRect(rnd(i + 2) * w, rnd(i + 3) * h, 2 + rnd(i + 4) * 4, 2 + rnd(i + 5) * 4); }
  }, [3, 3]);
  const pared = useLienzo("pared-v810", 512, 512, (x, w, h) => {
    x.fillStyle = "#cbbfa8"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) { x.fillStyle = `rgba(90,75,55,${0.03 + rnd(i) * 0.07})`; x.beginPath(); x.arc(rnd(i + 1) * w, rnd(i + 2) * h, 2 + rnd(i + 3) * 8, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = "rgba(70,60,40,0.25)"; for (let i = 0; i < 8; i++) x.fillRect(rnd(i + 50) * w, 0, 3 + rnd(i) * 4, h * (0.3 + rnd(i + 7) * 0.5));
  }, [2, 1]);
  const etiqueta = useLienzo("etiqueta-vieja", 256, 128, (x, w, h) => {
    x.fillStyle = "#fff6c4"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#c0261b"; x.font = `800 30px "Space Grotesk", sans-serif`; x.fillText("ALFAJOR", 16, 44);
    x.fillStyle = "#222"; x.font = `800 48px "Space Grotesk", sans-serif`; x.fillText("$1.200", 16, 104);
  });
  const cajon = entra((t - (T.l[5] - 0.55)) / 0.5);
  const brillo = t < T.l[8] ? 0.6 + 0.4 * Math.abs(Math.sin(t * (t > T.l[4] ? 4.5 : 2))) : 0.3;
  const renglon = t > T.trescientos - 0.3 && t < T.l[3] ? Math.min(9.99, ((t - (T.trescientos - 0.3)) / Math.max(0.5, T.nadie - T.trescientos + 0.3)) * 10) : -1;
  const cerrado = entra((t - T.quien) / 0.4);
  const verde = t > T.precio ? 1 : 0;
  const barras = t > T.l[6] - 0.1 && t < T.l[7] + 0.3 ? entra((t - T.l[6]) / 0.5) * (1 - entra((t - T.l[7]) / 0.3)) : 0;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[X, 0, 0]} receiveShadow><planeGeometry args={[5, 6]} /><meshStandardMaterial map={piso} roughness={0.85} /></mesh>
      <mesh position={[X, 1.6, -2.4]} receiveShadow><planeGeometry args={[5, 3.2]} /><meshStandardMaterial map={pared} roughness={0.95} /></mesh>
      <mesh position={[X - 2.3, 1.6, 0]} rotation-y={Math.PI / 2} receiveShadow><planeGeometry args={[6, 3.2]} /><meshStandardMaterial map={pared} roughness={0.95} /></mesh>
      <mesh position={[X + 2.3, 1.6, 0]} rotation-y={-Math.PI / 2} receiveShadow><planeGeometry args={[6, 3.2]} /><meshStandardMaterial map={pared} roughness={0.95} /></mesh>
      <mesh position={[X, 3.1, 0]} rotation-x={Math.PI / 2}><planeGeometry args={[5, 6]} /><meshStandardMaterial color="#3a3833" roughness={1} /></mesh>
      {/* góndolas, calendario viejo, mostrador */}
      <group position={[X - 2.2, 0, -0.4]} rotation-y={Math.PI / 2}><Gondola /></group>
      <group position={[X - 1.4, 0, -2.3]}><Gondola /></group>
      <group position={[X - 1.4, 2.35, -2.33]} scale={[1.3, 1.3, 1.3]}><HojaMes mes="MARZO" anio="(hace meses)" /></group>
      <mesh position={[X, 0.5, -1.2]} geometry={cajaR(2.2, 1.0, 0.7, 0.03)} castShadow receiveShadow><meshStandardMaterial color="#6e4a30" roughness={0.7} /></mesh>
      <mesh position={[X, 1.02, -1.2]} castShadow receiveShadow><boxGeometry args={[2.3, 0.04, 0.78]} /><meshStandardMaterial color="#d8d2c4" roughness={0.6} /></mesh>
      {/* pista 1: el cuaderno */}
      <group position={CUADERNO} rotation-y={0.25}><CuadernoFiados luz={renglon} cerrado={cerrado} /></group>
      {/* pista 2: la factura pinchada en el clavo y la etiqueta con el precio viejo */}
      <group position={FACTURA} rotation-y={-Math.PI / 2}><FacturaClavo verde={verde} /></group>
      <mesh position={[X + 2.29, 1.18, -0.95]} rotation-y={-Math.PI / 2}><planeGeometry args={[0.2, 0.1]} /><meshStandardMaterial map={etiqueta} roughness={0.8} /></mesh>
      {/* pista 3: la caja con el papelito */}
      <group position={CAJA}>
        <Registradora3D cajon={cajon} brillo={brillo}>
          {cajon > 0.1 ? <group position={[0, 0.002, 0.04]}><Papelito fecha="junio" lineas={[["Este mes sí sale.", false], ["Este mes sí sale.", true]]} /></group> : null}
        </Registradora3D>
      </group>
      {/* proyecciones en la pared del fondo: las barras y la pantalla de En Claro */}
      {barras > 0 ? <group position={[X - 0.2, 1.75, -2.38]}><Barras k={barras} /></group> : null}
      {t > T.l[7] - 0.2 && t < T.l[8] + 0.2 ? (
        <group position={[X + 0.2, 1.75, -2.38]} scale={[entra((t - T.l[7] + 0.2) / 0.5) * 12, entra((t - T.l[7] + 0.2) / 0.5) * 12, 1]}>
          <PantallaApp t={appTiempo(t, T)} carpeta="tomas/v8-10" app0={0} rate={1} durGrab={APP.fin} />
        </group>
      ) : null}
      <Polvo t={t} centro={[X, 1.3, 0]} radio={1.6} n={220} brillo={0.9} />
      {/* luz de la calle que entra por la persiana a medio abrir */}
      <pointLight position={[X, 0.6, 2.6]} intensity={0.9} distance={4} decay={1.8} color="#9fb6d8" />
    </group>
  );
};

/** Tiempo de la grabación de la app: Tu día en "cuánto te quedó", Fiados en "a quién cobrarle", el aumento en "qué precio subir". */
function appTiempo(t: number, T: T) {
  const p: [number, number][] = [[T.l[7], 0], [T.cuanto + 0.6, 0.6], [T.quien - 0.2, APP.fiados], [T.precio - 0.6, APP.aumento - 0.4], [T.precio + 0.4, APP.aumento + 0.4], [T.precio + 2.2, APP.fin]];
  if (t <= p[0][0]) return 0;
  for (let i = 0; i < p.length - 1; i++) {
    const [a, s0] = p[i], [b, s1] = p[i + 1];
    if (t < b) return s0 + (s1 - s0) * ((t - a) / (b - a));
  }
  return APP.fin;
}

const Escena3D: React.FC<{ t: number; T: T; cam: ReturnType<typeof camaraClaves> }> = ({ t, T, cam }) => {
  const adentro = cam.pos[0] < -10;
  const enfoque = Math.hypot(cam.pos[0] - cam.target[0], cam.pos[1] - cam.target[1], cam.pos[2] - cam.target[2]);
  const linterna = adentro ? 1 : clamp((t - 0.35) / 0.3, 0, 1) * (t < T.l[8] ? 1 : 0);
  return (
    <>
      <Estudio fondo="#06090c" niebla={adentro ? [3, 9] : [7, 24]} luz={adentro ? 0.015 : 0.22} calida={0.5} exposicion={adentro ? 0.9 : 1.0} principal={[3, 6, 5]} />
      <Camara c={cam} t={t} mano={adentro ? 2.2 : 1} />
      <Linterna pos={cam.pos} target={cam.target} t={t} fuerza={linterna} />
      {!adentro ? (
        <>
          <pointLight position={[3.5, 3.6, 3]} intensity={2.2} distance={8} decay={1.7} color="#9fb6d8" />
          <Vereda largo={5} ancho={24} />
          <Kiosco3D t={t} noche={0} />
          <PersianaFrente ancho={4.4} alto={2.25} abierta={persiana(t, T)} cartel grafiti />
          {/* el brillo de la caja que se ve al fondo por debajo de la persiana */}
          <pointLight position={[0.2, 0.55, -0.1]} intensity={1.6 * clamp(persiana(t, T) * 2, 0, 1) * (0.7 + 0.3 * Math.sin(t * 2))} distance={2.5} decay={2} color="#ffd890" />
        </>
      ) : (
        <Interior t={t} T={T} />
      )}
      <Profundidad foco={enfoque} apertura={adentro ? 0.007 : 0.012} max={0.009} />
    </>
  );
};

export const KioscoCerrado: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, dur);
  const loop = t >= T.LOOP;
  const tw = loop ? 0 : t;
  const { l, e } = T;
  const sil0 = e[4] + 0.05;
  const cam3 = camaraClaves(tw, claves(T));

  const manual = [0.03, T.entramos, T.mira, l[1], l[2], T.cuaderno, T.trescientos, T.nadie, l[3], T.factura, T.veinte, T.viejo, T.caja, T.algo, T.cerro2, T.quedaba, T.linterna, T.cuanto, T.quien, T.precio, T.papelito];
  const cortes = [T.mira, l[2], l[3], l[6], l[8]];
  const quieto = (t > sil0 && t < l[5]) || (t >= l[5] && t < l[6] - 0.1);
  const cam: Cam2D = quieto ? { z: 1.02 + (t - sil0) * 0.012, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : ritmo(pal, manual, [[sil0, l[6]], [T.LOOP - 0.4, 999]], 0.7), loop ? [] : cortes, 0.35);
  const hs = loop ? 0 : temblor(t, [[0.15, 9], [T.nadie + 0.2, 5], [T.veinte, 5], [l[6], 7]]);
  const renglones = Array.from({ length: 10 }, (_, i) => T.trescientos - 0.3 + (i / 10) * Math.max(0.5, T.nadie - T.trescientos + 0.3));

  // ---------- sonido ----------
  const pasos = Array.from({ length: 6 }, (_, i) => T.mira + 0.1 + i * 0.42);
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0.15, sfx: "metal", vol: 0.65 }, { en: 0.5, sfx: "thump", vol: 0.55 }, { en: 0, sfx: "viento", vol: 0.35 },
    { en: T.mira - 0.2, sfx: "whoosh", vol: 0.35 }, ...pasos.map((a) => ({ en: a, sfx: "vidrio", vol: 0.12 })),
    { en: l[2] + 0.3, sfx: "hoja", vol: 0.5 }, ...renglones.map((a) => ({ en: a, sfx: "click", vol: 0.35 })), { en: T.nadie, sfx: "thump", vol: 0.55 },
    { en: l[3] + 0.3, sfx: "papel", vol: 0.5 }, { en: T.veinte, sfx: "thump", vol: 0.5 },
    { en: l[4], sfx: "heart", vol: 0.5 }, { en: l[4] + 0.6, sfx: "heart", vol: 0.55 }, { en: l[4] + 1.2, sfx: "heart", vol: 0.6 },
    { en: l[5] - 0.55, sfx: "cajon", vol: 0.45 },
    { en: l[6], sfx: "thump", vol: 0.6 },
    { en: T.linterna, sfx: "riser", vol: 0.3 }, ...[T.cuanto, T.quien, T.precio].map((a) => ({ en: a, sfx: "ding", vol: 0.45 })), { en: T.quien + 0.1, sfx: "hoja", vol: 0.4 },
    { en: l[8] + 0.4, sfx: "click", vol: 0.45 }, { en: T.LOOP - 2.2, sfx: "metal", vol: 0.4 },
  ].filter((x) => !(x.en > sil0 + 0.02 && x.en < l[6] - 0.05 && x.sfx !== "cajon"));
  // nota grave de piano (sintetizada) justo después del papelito
  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(sil0 * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.06 * Math.min(1, Math.max(0, sil0 * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round((T.sale + 0.3) * fps)} durationInFrames={Math.round(4 * fps)} layout="none">
        <Html5Audio src={staticFile("sfx/piano_grave.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={Math.round(l[7] * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(l[7] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.08 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // ---------- capa gráfica ----------
  const tg = loop ? 0 : t;
  const frente = (
    <>
      <div style={{ left: 12, top: 12, padding: "3px 8px", borderRadius: 6, background: "#000000aa", border: "1px solid #ffffff55", font: `700 11px ${BODY}`, color: "#ffffffdd", letterSpacing: ".1em" }}>RECREACIÓN</div>
      {tg < l[1] - 0.05 || loop ? <Cartel texto="MIRÁ LO QUE DEJÓ EN LA CAJA" top={78} size={21} s={Math.min(1.08, 0.8 + sp(tg + 0.1) * 0.2) * latido(tg, 0.62, 0.04)} rot={-2 + Math.sin(tg * 4) * 1.2} /> : null}
      {!loop && t >= l[2] && t < l[3] - 0.05 ? <Rotulo t={t} desde={T.nadie - 0.2} texto="$380.000 en fiados (ejemplo)" top={84} size={18} /> : null}
      {!loop && t >= l[3] && t < l[4] - 0.05 ? <Rotulo t={t} desde={T.veinte} texto="+20% del proveedor · siguió a $1.200 (ejemplo)" top={84} size={15} /> : null}
      {!loop && t >= l[6] && t < l[7] - 0.05 ? <Cartel texto="NUNCA SUPO CUÁNTO LE QUEDABA" top={80} size={18} s={sp(t - T.cerro2, 1.06)} rot={-2} /> : null}
      {!loop && t >= l[7] - 0.05 && t < l[8] - 0.05 ? (
        <div style={{ left: 0, right: 0, top: 80, textAlign: "center", transform: `scale(${sp(t - l[7], 1.06)})` }}>
          <span style={{ position: "static", font: `800 21px/1.15 ${DISP}`, color: "#fff", textShadow: "0 3px 12px #000a" }}>En Claro: <span style={{ position: "static", color: C.ambar }}>la linterna que él no tuvo</span></span>
        </div>
      ) : null}
      {!loop && t >= l[8] - 0.05 ? <CupoFundadores t={t} desde={l[8]} top={150} /> : null}
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={0} red={0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, e[0] + 0.1], [sil0, l[6] - 0.05], [l[8] - 0.05, 999]]}
      fondo={<div style={{ inset: 0, background: "#06090c" }} />}
      tres={<Escena3D t={tw} T={T} cam={cam3} />}
      frente={frente}
      sobre={musica}
    />
  );
};
