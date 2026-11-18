import React, { useMemo } from "react";
import * as THREE from "three";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V8_06, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, camaraClaves, lineasDeVoz, temblor, type Cam2D, type Clave } from "../v6/comun";
import { Cartel, Etiqueta, Numero, Probalo, Rotulo, entra, latido, ritmo, sp, valorPasos } from "./comun";
import { Camara, Estudio, PantallaApp, Profundidad, cajaR, dibujarBillete, useLienzo } from "./estudio3d";
import { C } from "./iconos";
import { Celular3D, PilaBilletes } from "./modelos3d";

// V8-06 "Rayos X" (videos/guiones/V8-06-RAYOS-X.md). Un escáner barre el depósito: las cajas se vuelven transparentes y adentro hay
// plata congelada. $86.000 + $120.000 + $94.000 + $100.000 = $400.000 (ejemplo) = 17 días de lo que le queda por día ($23.500).

const g = GUION_V8_06;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
type Caja = { id: string; nombre: string; monto: number; p: [number, number, number]; s: [number, number, number]; color: string };
const CAJAS: Caja[] = [
  { id: "galletitas", nombre: "galletitas que vencen en 40 días", monto: 86000, p: [-1.45, 1.17, -0.15], s: [0.62, 0.42, 0.44], color: "#e0b57c" },
  { id: "golosinas", nombre: "golosinas que nadie lleva", monto: 120000, p: [0.05, 0.47, -0.75], s: [0.86, 0.94, 0.62], color: "#d4a46a" },
  { id: "bebidas", nombre: "bebidas que no rotan", monto: 94000, p: [1.35, 0.4, 0.05], s: [0.56, 0.5, 0.44], color: "#c9965a" },
  { id: "limpieza", nombre: "limpieza parada", monto: 100000, p: [1.55, 1.39, -0.2], s: [0.6, 0.42, 0.42], color: "#dcae73" },
];
const TOTAL = 400000, POR_DIA = 23500;
// cajas de relleno (no se escanean)
const RELLENO: { p: [number, number, number]; s: [number, number, number] }[] = [
  { p: [-1.75, 0.38, -0.2], s: [0.5, 0.36, 0.4] }, { p: [-1.15, 0.36, -0.15], s: [0.42, 0.32, 0.4] }, { p: [-1.6, 1.97, -0.2], s: [0.5, 0.3, 0.4] },
  { p: [-1.1, 1.95, -0.25], s: [0.4, 0.26, 0.36] }, { p: [0.95, 1.4, -0.2], s: [0.42, 0.42, 0.4] }, { p: [1.2, 2.0, -0.25], s: [0.6, 0.28, 0.4] },
  { p: [1.75, 0.38, -0.25], s: [0.4, 0.36, 0.4] }, { p: [-0.6, 0.25, -0.85], s: [0.5, 0.5, 0.5] }, { p: [0.75, 0.3, -1.0], s: [0.5, 0.6, 0.5] },
  { p: [-0.55, 0.75, -0.95], s: [0.4, 0.36, 0.4] },
];
// grabación real de la app (app/scripts/grabar-v8.cjs v8-06)
const APP = { noReponer: 1.882, marcado: 3.213, fin: 5.415 };

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  const T = {
    l, e, dur,
    escondidos: w(0, "escondidos", 2.1), gastar: w(0, "gastar", e[0] - 0.4),
    ochenta: w(2, "ochenta", l[2] + 2.1), ciento: w(3, "ciento", l[3] + 1.9), limpieza: w(4, "limpieza", l[4] + 2.0),
    cara: w(5, "cara", l[5] + 0.7), reponer: w(5, "reponer", e[5] - 0.5),
    dias: w(7, "días", l[7] + 0.4), guardados: w(7, "guardados", l[7] + 2.8),
    dormida: w(8, "dormida", l[8] + 1.7), que: w(8, "qué", l[8] + 3.2), comprar: w(8, "comprar", e[8] - 0.5),
    probalo: w(9, "probalo", l[9] + 2.6),
    LOOP: dur - 0.27,
    app0: 0,
  };
  T.app0 = T.que + 0.3 - APP.marcado;
  return T;
}
type T = ReturnType<typeof tiempos>;
/** Cuándo se escanea cada caja (galletitas, golosinas, bebidas, limpieza). */
const escaneos = (T: T) => [T.l[2], T.l[3], T.l[4], T.limpieza];
const sumas = (T: T) => [{ en: T.ochenta, a: 86000 }, { en: T.ciento, a: 206000 }, { en: T.l[4] + 0.4, a: 300000 }, { en: T.limpieza + 0.3, a: TOTAL }];

/** Posición x del haz del escáner en cada momento (entra por la izquierda, va caja por caja, sale por la derecha). */
function haz(t: number, T: T) {
  const E = escaneos(T);
  const xs = CAJAS.map((c) => c.p[0]);
  const pasos: [number, number][] = [[0, -1.9], [T.l[1], -1.7], [E[0] - 0.05, xs[0]], [E[1] - 0.05, xs[1]], [E[2] - 0.05, xs[2]], [E[3] - 0.05, xs[3]], [T.l[5], xs[1]], [T.l[6] - 0.3, 2.9]];
  for (let i = 0; i < pasos.length - 1; i++) {
    const [a, x0] = pasos[i], [b, x1] = pasos[i + 1];
    if (t < b) {
      const k = clamp((t - a) / Math.min(0.55, b - a), 0, 1);
      return x0 + (x1 - x0) * (k * k * (3 - 2 * k));
    }
  }
  return 2.9;
}
/** El haz entra ya visible en el cuadro 0 y se mueve un poco antes de "Mirá". */

function claves(T: T): Clave[] {
  const { l } = T;
  const c0: Clave = { t: 0, pos: [0.15, 1.45, 4.0], target: [0, 0.95, -0.2], fov: 52 };
  const foco = (c: Caja, d = 1.3, alto = 0.35): [number, number, number] => [c.p[0] * 0.75 + 0.2, c.p[1] + alto, c.p[2] + d];
  return [
    c0,
    { t: l[1] - 0.05, pos: [0.1, 1.42, 3.6], target: [0, 0.95, -0.2], fov: 52 },
    { t: l[2] + 0.35, pos: foco(CAJAS[0]), target: CAJAS[0].p, fov: 42 },
    { t: l[3] - 0.1, pos: [foco(CAJAS[0])[0] + 0.12, foco(CAJAS[0])[1] - 0.05, foco(CAJAS[0])[2] - 0.15], target: CAJAS[0].p, fov: 41 },
    { t: l[3] + 0.35, pos: foco(CAJAS[1], 1.75, 0.45), target: CAJAS[1].p, fov: 44 },
    { t: l[4] - 0.1, pos: [foco(CAJAS[1], 1.6, 0.4)[0] - 0.1, foco(CAJAS[1], 1.6, 0.4)[1], foco(CAJAS[1], 1.6, 0.4)[2]], target: CAJAS[1].p, fov: 43 },
    { t: l[4] + 0.3, pos: foco(CAJAS[2], 1.2, 0.3), target: CAJAS[2].p, fov: 42 },
    { t: T.limpieza + 0.3, pos: foco(CAJAS[3], 1.25, 0.2), target: CAJAS[3].p, fov: 42 },
    { t: l[5] - 0.1, pos: [foco(CAJAS[3], 1.15, 0.2)[0] - 0.1, foco(CAJAS[3], 1.15, 0.2)[1], foco(CAJAS[3], 1.15, 0.2)[2]], target: CAJAS[3].p, fov: 41 },
    { t: l[5] + 0.4, pos: [0.25, 1.15, 1.6], target: CAJAS[1].p, fov: 46 },
    { t: l[6] - 0.15, pos: [0.15, 1.05, 1.15], target: [0.05, 0.6, -0.6], fov: 44 },
    { t: l[6] + 0.3, pos: [0.0, 1.15, 1.75], target: [0, 1.1, 0.35], fov: 40 },
    { t: l[7] - 0.05, pos: [0.0, 1.12, 1.6], target: [0, 1.1, 0.35], fov: 40 },
    { t: l[7] + 0.35, pos: [-2.9, 0.62, 1.95], target: [-2.2, 0.35, 0.85], fov: 46 },
    { t: l[8] - 0.1, pos: [2.9, 0.62, 1.95], target: [2.2, 0.35, 0.85], fov: 46 },
    { t: l[8] + 0.45, pos: [0.14, 1.06, 1.68], target: [0.0, 1.0, 1.2], fov: 36 },
    { t: l[9] - 0.1, pos: [0.1, 1.04, 1.62], target: [0.0, 1.0, 1.2], fov: 35 },
    { t: l[9] + 0.5, pos: [0.14, 1.44, 3.95], target: [0, 0.95, -0.2], fov: 52 },
    { ...c0, t: T.LOOP },
  ];
}

/** Estante metálico de depósito (3 niveles). */
const Estante: React.FC<{ x: number }> = ({ x }) => (
  <group position={[x, 0, -0.2]}>
    {[-0.55, 0.55].flatMap((dx) => [-0.28, 0.28].map((dz) => (
      <mesh key={`${dx}${dz}`} position={[dx, 1.15, dz]} castShadow><boxGeometry args={[0.04, 2.3, 0.04]} /><meshStandardMaterial color="#5f6b66" metalness={0.8} roughness={0.35} /></mesh>
    )))}
    {[0.15, 0.95, 1.75].map((y) => (
      <mesh key={y} position={[0, y, 0]} castShadow receiveShadow><boxGeometry args={[1.18, 0.03, 0.62]} /><meshStandardMaterial color="#7d8984" metalness={0.7} roughness={0.4} /></mesh>
    ))}
  </group>
);

/** Caja de cartón con cinta; con `rayos` > 0 se vuelve transparente (borde azul brillante) y se ve lo que tiene adentro. */
const CajaCarton: React.FC<{ s: [number, number, number]; color: string; rayos: number; verde?: number; tapa?: number; children?: React.ReactNode }> = ({ s, color, rayos, verde = 0, tapa = 0, children }) => {
  const carton = useLienzo(`carton-${color}`, 256, 256, (x, w, h) => {
    x.fillStyle = color; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(90,60,30,${0.03 + rnd(i) * 0.05})`; x.fillRect(rnd(i + 1) * w, rnd(i + 2) * h, 2 + rnd(i + 3) * 6, 1 + rnd(i + 4) * 2); }
    x.fillStyle = "rgba(200,170,120,0.85)"; x.fillRect(w * 0.44, 0, w * 0.12, h);
  });
  const bordes = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...s)), [s]);
  const azul = new THREE.Color("#5fc8ff").lerp(new THREE.Color("#46e08a"), verde);
  return (
    <group>
      {rayos < 0.98 ? (
        <mesh geometry={cajaR(s[0], s[1], s[2], 0.015, 2)} castShadow receiveShadow>
          <meshStandardMaterial map={carton} roughness={0.9} transparent={rayos > 0} opacity={1 - rayos} depthWrite={rayos < 0.5} />
        </mesh>
      ) : null}
      {rayos > 0 ? (
        <>
          <mesh>
            <boxGeometry args={s} />
            <meshStandardMaterial color={azul} emissive={azul} emissiveIntensity={0.35} transparent opacity={0.12 * rayos} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <lineSegments geometry={bordes}>
            <lineBasicMaterial color={azul} transparent opacity={rayos} />
          </lineSegments>
          <group scale={[rayos > 0.2 ? 1 : 0, 1, 1]}>{children}</group>
        </>
      ) : null}
      {tapa > 0 ? (
        <>
          <group position={[-s[0] / 2, s[1] / 2, 0]} rotation-z={tapa * 1.9}><mesh position={[s[0] / 4, 0.004, 0]} castShadow><boxGeometry args={[s[0] / 2, 0.008, s[2]]} /><meshStandardMaterial map={carton} roughness={0.9} /></mesh></group>
          <group position={[s[0] / 2, s[1] / 2, 0]} rotation-z={-tapa * 1.9}><mesh position={[-s[0] / 4, 0.004, 0]} castShadow><boxGeometry args={[s[0] / 2, 0.008, s[2]]} /><meshStandardMaterial map={carton} roughness={0.9} /></mesh></group>
        </>
      ) : null}
    </group>
  );
};

/** Lo que hay adentro de cada caja: productos y billetes congelados (escarcha) o con telarañas. */
const Contenido: React.FC<{ c: Caja; t: number }> = ({ c, t }) => {
  const billete = useLienzo("billete", 512, 228, dibujarBillete);
  const tela = useLienzo("telarana", 256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.strokeStyle = "rgba(240,248,255,0.9)"; x.lineWidth = 1.6;
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 0.5; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * w, Math.sin(a) * h); x.stroke(); }
    for (let r = 30; r < w; r += 34) { x.beginPath(); for (let i = 0; i <= 9; i++) { const a = (i / 9) * Math.PI * 0.5; const rr = r * (0.92 + 0.08 * Math.sin(i * 3)); i ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.stroke(); }
  });
  const [sx, sy, sz] = c.s;
  const prod = c.id === "bebidas" ? "#3c2a20" : c.id === "limpieza" ? "#4f9bd9" : c.id === "golosinas" ? "#e94b3c" : "#d9a86c";
  const n = c.id === "golosinas" ? 14 : 8;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const col = i % (c.id === "golosinas" ? 5 : 4), fila = Math.floor(i / (c.id === "golosinas" ? 5 : 4));
        const px = -sx / 2 + 0.08 + col * ((sx - 0.16) / ((c.id === "golosinas" ? 5 : 4) - 1));
        const pz = -sz / 4 + fila * (sz / 2.5) - sz * 0.1;
        return c.id === "bebidas" ? (
          <mesh key={i} position={[px, -sy / 2 + 0.17, pz]}><cylinderGeometry args={[0.045, 0.05, 0.32, 16]} /><meshPhysicalMaterial color={prod} roughness={0.15} clearcoat={1} transparent opacity={0.85} /></mesh>
        ) : (
          <mesh key={i} position={[px, -sy / 2 + 0.07 + (fila % 2) * 0.02, pz]} geometry={cajaR(0.09, 0.12, 0.06, 0.01, 2)}><meshPhysicalMaterial color={i % 3 ? prod : "#f2b134"} roughness={0.4} clearcoat={0.5} /></mesh>
        );
      })}
      {/* billetes congelados */}
      {Array.from({ length: 5 }, (_, i) => (
        <group key={`b${i}`} position={[-sx / 4 + i * (sx / 8), sy * 0.08 + i * 0.012, (i % 2 ? 0.05 : -0.05)]} rotation={[-Math.PI / 2 + 0.2 * (i % 2 ? 1 : -1), 0, (i - 2) * 0.35 + Math.sin(t + i) * 0.02]}>
          <mesh><planeGeometry args={[0.156, 0.07]} /><meshStandardMaterial map={billete} roughness={0.6} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0, 0, 0.002]}><planeGeometry args={[0.16, 0.074]} /><meshStandardMaterial color="#e6f6ff" transparent opacity={0.45} roughness={0.2} metalness={0.1} emissive="#bfe8ff" emissiveIntensity={0.2} /></mesh>
        </group>
      ))}
      <group position={[0, sy * 0.12, 0]}><PilaBilletes alto={0.05} /></group>
      {c.id === "golosinas" ? (
        <>
          <mesh position={[-sx / 2 + 0.01, sy / 2 - 0.01, 0]} rotation-y={Math.PI / 2}><planeGeometry args={[0.35, 0.35]} /><meshBasicMaterial map={tela} transparent side={THREE.DoubleSide} /></mesh>
          <mesh position={[sx / 2 - 0.01, sy / 2 - 0.01, 0]} rotation-y={-Math.PI / 2} rotation-z={Math.PI / 2}><planeGeometry args={[0.35, 0.35]} /><meshBasicMaterial map={tela} transparent side={THREE.DoubleSide} /></mesh>
        </>
      ) : null}
    </group>
  );
};

/** Número de $400.000 que gira en 3D (placa con el número de los dos lados). */
const NumeroGira: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const tex = useLienzo("n400", 1024, 320, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = "#ff6b5e"; x.font = `800 ${h * 0.7}px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("$400.000", w / 2, h * 0.55);
  });
  return (
    <group position={[0, 1.1, 0.35]} rotation-y={Math.sin(t * 1.6) * 0.5} scale={[s, s, s]}>
      <mesh><planeGeometry args={[0.46, 0.144]} /><meshStandardMaterial map={tex} transparent emissive="#ff6b5e" emissiveMap={tex} emissiveIntensity={0.6} side={THREE.DoubleSide} metalness={0.3} roughness={0.3} /></mesh>
    </group>
  );
};

/** Hoja de calendario (un día de trabajo) con su pila de billetes del día adelante. */
const Dia: React.FC<{ n: number; s: number }> = ({ n, s }) => {
  const tex = useLienzo(`dia-${n}`, 256, 300, (x, w, h) => {
    x.fillStyle = "#fbfaf6"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#d92d20"; x.fillRect(0, 0, w, 70);
    x.fillStyle = "#fff"; x.font = `800 44px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.fillText("DÍA", w / 2, 52);
    x.fillStyle = "#0f1f17"; x.font = `800 150px "Space Grotesk", sans-serif`; x.fillText(String(n), w / 2, 230);
  });
  return (
    <group scale={[s, s, s]}>
      <mesh position={[0, 0.16, -0.02]} rotation-x={-0.12} geometry={cajaR(0.22, 0.26, 0.02, 0.008, 2)} castShadow><meshStandardMaterial color="#e8e6df" roughness={0.6} /></mesh>
      <mesh position={[0, 0.16, -0.008]} rotation-x={-0.12}><planeGeometry args={[0.2, 0.235]} /><meshStandardMaterial map={tex} roughness={0.7} /></mesh>
      <group position={[0, 0, 0.12]}><PilaBilletes alto={0.04} /></group>
    </group>
  );
};

const Escena3D: React.FC<{ t: number; T: T; cam: ReturnType<typeof camaraClaves> }> = ({ t, T, cam }) => {
  const x = haz(t, T);
  const E = escaneos(T);
  const encendido = t < T.l[6] - 0.2 ? 1 : 0;
  const cierran = entra((t - (T.l[6] - 0.25)) / 0.3);
  const alarma = t > T.l[5] + 0.25 && t < T.l[6] - 0.2 ? 0.5 + 0.5 * Math.round((Math.sin(t * 12) + 1) / 2) : 0;
  const hormigon = useLienzo("hormigon", 512, 512, (cx, w, h) => {
    cx.fillStyle = "#6e6a63"; cx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) { cx.fillStyle = `rgba(${rnd(i) > 0.5 ? "30,30,30" : "200,200,200"},${0.03 + rnd(i + 9) * 0.05})`; cx.fillRect(rnd(i + 1) * w, rnd(i + 2) * h, 2 + rnd(i + 3) * 5, 2 + rnd(i + 4) * 5); }
  }, [4, 4]);
  const ladrillo = useLienzo("ladrillo", 512, 512, (cx, w, h) => {
    cx.fillStyle = "#8b8076"; cx.fillRect(0, 0, w, h);
    for (let f = 0; f < 16; f++) for (let k = 0; k < 8; k++) { cx.fillStyle = `hsl(${18 + rnd(f * 9 + k) * 10},${20 + rnd(k + f) * 15}%,${36 + rnd(f + k * 3) * 12}%)`; cx.fillRect(k * 64 + (f % 2) * 32 + 3, f * 32 + 3, 58, 26); }
  }, [3, 2]);
  const enfoque = Math.hypot(cam.pos[0] - cam.target[0], cam.pos[1] - cam.target[1], cam.pos[2] - cam.target[2]);
  const verdes = [0, 1, 2, 3].map((i) => entra((t - (T.dormida + i * 0.45)) / 0.3));
  return (
    <>
      <Estudio fondo="#0a0d10" luz={0.28} calida={0.85} exposicion={1.0} principal={[1.5, 4, 3]} />
      <Camara c={cam} t={t} />
      {/* foco colgante */}
      <group position={[0, 2.6, 0.3]} rotation-z={Math.sin(t * 0.9) * 0.05}>
        <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.004, 0.004, 0.7]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh><sphereGeometry args={[0.05, 20, 16]} /><meshStandardMaterial color="#fff1c2" emissive="#ffd27a" emissiveIntensity={3} /></mesh>
        <pointLight intensity={4.5} distance={6} decay={1.7} color="#ffd9a0" castShadow shadow-mapSize={[1024, 1024]} />
      </group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[12, 12]} /><meshStandardMaterial map={hormigon} roughness={0.85} /></mesh>
      <mesh position={[0, 1.6, -1.25]} receiveShadow><planeGeometry args={[12, 3.2]} /><meshStandardMaterial map={ladrillo} roughness={0.9} /></mesh>
      <Estante x={-1.45} />
      <Estante x={1.45} />
      {RELLENO.map((r, i) => (
        <group key={i} position={r.p}><CajaCarton s={r.s} color={["#d9a86c", "#c9965a", "#e0b57c"][i % 3]} rayos={0} /></group>
      ))}
      {CAJAS.map((c, i) => {
        const rayos = encendido * clamp((t - (E[i] - 0.1)) / 0.35, 0, 1) * (1 - cierran) + (t > T.l[8] ? entra((t - T.l[8]) / 0.4) * 0.8 : 0) * (t < T.l[9] ? 1 : 0);
        const tiembla = i === 1 && t > T.l[5] && t < T.cara + 0.6 ? Math.sin(t * 46) * 0.012 : 0;
        const tapa = i === 1 ? entra((t - (T.cara + 0.4)) / 0.4) * (1 - cierran) : 0;
        return (
          <group key={c.id} position={[c.p[0] + tiembla, c.p[1], c.p[2]]}>
            <CajaCarton s={c.s} color={c.color} rayos={rayos} verde={verdes[i] * (t < T.l[9] ? 1 : 0)} tapa={tapa}><Contenido c={c} t={t} /></CajaCarton>
          </group>
        );
      })}
      {/* el haz del escáner */}
      {encendido && t > 0 ? null : null}
      {encendido ? (
        <group position={[x, 1.2, -0.2]}>
          <mesh><boxGeometry args={[0.025, 2.6, 2.2]} /><meshBasicMaterial color="#9fe0ff" transparent opacity={0.85} toneMapped={false} /></mesh>
          <mesh><boxGeometry args={[0.35, 2.6, 2.2]} /><meshBasicMaterial color="#3fb6ff" transparent opacity={0.12} depthWrite={false} toneMapped={false} /></mesh>
          <pointLight intensity={2.2} distance={2.5} decay={1.5} color="#5fc8ff" />
        </group>
      ) : null}
      {/* alarma roja del re-gancho */}
      {alarma > 0 ? <pointLight position={[0.05, 1.6, 0.3]} intensity={6 * alarma} distance={4} decay={1.5} color="#ff2a1f" /> : null}
      {/* el número que gira */}
      {t > T.l[6] - 0.3 && t < T.l[7] + 0.4 ? <NumeroGira t={t} s={entra((t - (T.l[6] - 0.3)) / 0.4) * (1 - entra((t - T.l[7] - 0.1) / 0.3))} /> : null}
      {/* 17 días de trabajo en fila */}
      {t > T.l[7] - 0.1 && t < T.l[8] + 0.3
        ? Array.from({ length: 17 }, (_, i) => (
            <group key={i} position={[-2.4 + i * 0.3, 0, 0.85]}>
              <Dia n={i + 1} s={entra((t - (T.l[7] + i * 0.07)) / 0.25)} />
            </group>
          ))
        : null}
      {/* celular con la app */}
      {t > T.l[8] - 0.2 && t < T.l[9] + 0.6 ? (
        <group position={[0, 1.0 - (1 - entra((t - T.l[8] + 0.2) / 0.6)) * 0.5 + Math.sin(t * 1.4) * 0.005, 1.2]} rotation-y={Math.sin(t * 0.8) * 0.05}>
          <Celular3D><PantallaApp t={t} carpeta="tomas/v8-06" app0={T.app0} rate={1} durGrab={APP.fin} /></Celular3D>
        </group>
      ) : null}
      <Profundidad foco={enfoque} apertura={0.014} max={0.012} />
    </>
  );
};

export const RayosX: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, dur);
  const loop = t >= T.LOOP;
  const tw = loop ? 0 : t;
  const { l, e } = T;
  const sil0 = e[5] + 0.05;
  const cam3 = camaraClaves(tw, claves(T));
  const E = escaneos(T);
  const S = sumas(T);

  const manual = [0.03, T.escondidos, T.gastar, l[1], ...E, ...S.map((x) => x.en + 0.42), T.cara, T.reponer, l[6], T.dias, T.guardados, T.dormida, T.que, T.probalo];
  const cortes = [l[2], l[3], l[4], l[5], l[7], l[8], l[9]];
  const cam: Cam2D = t > sil0 && t < l[6] ? { z: 1.02, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : ritmo(pal, manual, [[sil0, l[6] - 0.02], [T.LOOP - 0.4, 999]]), loop ? [] : cortes, 0.45);
  const hs = loop ? 0 : temblor(t, [[0.03, 8], ...S.map((x) => [x.en + 0.42, 4] as [number, number]), [T.cara, 8], [l[7], 6]]);
  let wf = 0, red = 0;
  if (!loop) {
    [[l[6], 0.25]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });
    if (t > l[5] + 0.25 && t < sil0) red = 0.06;
  }

  // ---------- sonido ----------
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, { en: 0, sfx: "buzz", vol: 0.35 }, { en: 0.02, sfx: "glitch", vol: 0.35 },
    ...cortes.map((a) => ({ en: a - 0.12, sfx: "whoosh", vol: 0.3 })),
    { en: l[1], sfx: "buzz", vol: 0.4 }, { en: l[1] + 0.05, sfx: "whoosh", vol: 0.35 },
    ...E.map((a) => ({ en: a + 0.1, sfx: "tic", vol: 0.7 })), ...E.map((a) => ({ en: a + 0.25, sfx: "vidrio", vol: 0.25 })),
    ...S.map((x) => ({ en: x.en + 0.42, sfx: "thump", vol: 0.5 })), ...S.map((x) => ({ en: x.en + 0.4, sfx: "click", vol: 0.45 })),
    { en: l[5] + 0.25, sfx: "buzz", vol: 0.5 }, ...[0, 0.55, 1.1, 1.6, 2.1].map((d) => ({ en: l[5] + 0.4 + d, sfx: "heart", vol: 0.5 })), { en: T.cara + 0.4, sfx: "cajon", vol: 0.5 },
    { en: l[6], sfx: "thump", vol: 0.55 },
    ...Array.from({ length: 17 }, (_, i) => ({ en: l[7] + i * 0.07, sfx: "click", vol: 0.35 })), { en: T.guardados, sfx: "thump", vol: 0.5 },
    { en: l[8] - 0.1, sfx: "whoosh", vol: 0.45 }, ...[0, 1, 2, 3].map((i) => ({ en: T.dormida + i * 0.45, sfx: "ding", vol: 0.4 })), { en: T.app0 + APP.noReponer, sfx: "click", vol: 0.45 }, { en: T.app0 + APP.marcado, sfx: "ding", vol: 0.5 },
    { en: T.probalo, sfx: "click", vol: 0.5 }, { en: T.LOOP - 0.15, sfx: "buzz", vol: 0.3 }, { en: T.LOOP, sfx: "thump", vol: 0.45 },
  ].filter((x) => !(x.en > sil0 + 0.02 && x.en < l[6] - 0.05));

  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(sil0 * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.11 * Math.min(1, Math.max(0, sil0 * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(l[7] * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(l[7] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.11 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // ---------- capa gráfica (máximo 2 textos + subtítulo) ----------
  const tg = loop ? 0 : t;
  const escondido = valorPasos(t, 0, S);
  const actual = [...CAJAS].map((c, i) => ({ c, en: E[i] })).reverse().find((x) => t >= x.en - 0.05);
  const frente = (
    <>
      {tg < l[1] - 0.05 || loop ? (
        <>
          <Cartel texto="$400.000 ESCONDIDOS" top={86} size={27} s={Math.min(1.08, 0.8 + sp(tg + 0.1) * 0.2) * latido(tg, 0.62, 0.04)} rot={-2 + Math.sin(tg * 4) * 1.2} />
          <div style={{ left: 0, right: 0, top: 140, textAlign: "center", font: `700 16px ${BODY}`, color: "#ffffffcc" }}>en el depósito de tu kiosco · (ejemplo)</div>
        </>
      ) : null}
      {t >= l[1] - 0.05 && t < l[5] - 0.05 && !loop ? (
        <>
          <Etiqueta texto="ESCONDIDO" top={70} fondo="#1d6fa3" />
          <Numero t={t} v={escondido} pasos={S} top={98} size={52} color="#bfe8ff" />
          {actual ? <Rotulo t={t} desde={actual.en} texto={`${actual.c.nombre} · ${ars(actual.c.monto)}`} top={160} color="#1d6fa3" size={16} /> : null}
        </>
      ) : null}
      {t >= l[5] - 0.05 && t < sil0 ? (
        <>
          <Cartel texto="LA MÁS CARA" top={88} size={30} s={sp(t - l[5], 1.08) * latido(t, 0.5, 0.05)} rot={Math.sin(t * 6) * 2} />
          {t > T.reponer - 0.2 ? <Rotulo t={t} desde={T.reponer - 0.2} texto="la que más reponés: golosinas · $120.000" top={146} size={16} /> : null}
        </>
      ) : null}
      {t >= l[6] - 0.02 && t < l[7] - 0.05 ? <Rotulo t={t} desde={l[6]} texto="¿Sabés cuánto es eso?" top={110} color={C.ambar} size={20} /> : null}
      {t >= l[7] - 0.05 && t < l[8] - 0.05 ? (
        <>
          <Cartel texto="17 DÍAS DE TRABAJO" top={86} size={28} s={sp(t - l[7], 1.08) * latido(t - l[7], 0.55, 0.04)} rot={-2} />
          <Rotulo t={t} desde={T.dias} texto={`${ars(TOTAL)} ÷ ${ars(POR_DIA)} por día (ejemplo)`} top={142} color={C.rojo} size={17} />
        </>
      ) : null}
      {t >= l[8] - 0.05 && t < l[9] - 0.05 ? (
        <div style={{ left: 0, right: 0, top: 78, textAlign: "center", transform: `scale(${sp(t - l[8], 1.06)})` }}>
          <span style={{ position: "static", font: `800 22px/1.15 ${DISP}`, color: "#fff", textShadow: "0 3px 12px #000a" }}>En Claro: <span style={{ position: "static", color: C.ambar }}>la plata dormida</span></span>
        </div>
      ) : null}
      {t >= l[9] - 0.05 && !loop ? (
        t >= T.probalo - 0.1 ? <Probalo s={sp(t - (T.probalo - 0.1), 1.05, 15, 0.45) * latido(t - T.probalo, 0.6, 0.05)} top={96} />
          : <Cartel texto="¿CUÁNTO TENÉS ESCONDIDO?" top={90} fondo={C.verde} color={C.ambar} size={21} s={sp(t - l[9], 1.06)} rot={-2 + Math.sin(t * 4) * 1.2} />
      ) : null}
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={red} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, e[0] + 0.1], [sil0, l[6] + 0.05], [T.LOOP - 0.01, 999]]}
      fondo={<div style={{ inset: 0, background: "#0a0d10" }} />}
      tres={<Escena3D t={tw} T={T} cam={cam3} />}
      frente={frente}
      sobre={musica}
    />
  );
};
