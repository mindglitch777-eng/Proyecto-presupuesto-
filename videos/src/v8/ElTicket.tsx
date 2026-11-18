import React, { useMemo } from "react";
import * as THREE from "three";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V8_07, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { Cartel, Etiqueta, Probalo, Rotulo, entra, latido, ritmo, sp } from "./comun";
import { Camara, Estudio, PantallaApp, Profundidad, cajaR, useLienzo } from "./estudio3d";
import { C } from "./iconos";
import { Celular3D, Kiosco3D } from "./modelos3d";

// V8-07 "El ticket de 3 cuadras" (videos/guiones/V8-07-EL-TICKET.md). La caja imprime todo lo que el kiosco perdió en el año:
// precios viejos $246.000/mes × 12 = $2.952.000 + fiado que no vuelve $8.000/día × 360 = $2.880.000 → TOTAL −$5.832.000 (ejemplo).

const g = GUION_V8_07;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const PRECIOS = 246000 * 12, FIADO = 8000 * 360, TOTAL = PRECIOS + FIADO; // 2.952.000 + 2.880.000 = 5.832.000
// recorrido del ticket: sale por la puerta del kiosco y hace tres cuadras (1 unidad = 1 m)
const RUTA: [number, number][] = [[1.48, -0.1], [1.48, 2.8], [36, 2.8], [36, 38.6], [70, 38.6]];
const ANCHO = 0.26; // ancho del ticket (exagerado para que se lea desde lejos)
const LARGOS = RUTA.slice(1).map((p, i) => Math.hypot(p[0] - RUTA[i][0], p[1] - RUTA[i][1]));
const LARGO = LARGOS.reduce((a, b) => a + b, 0);
/** Punto del recorrido a `u` metros de la puerta (con la dirección del tramo). */
function enRuta(u: number): { x: number; z: number; dx: number; dz: number } {
  let r = clamp(u, 0, LARGO);
  for (let i = 0; i < LARGOS.length; i++) {
    if (r <= LARGOS[i] || i === LARGOS.length - 1) {
      const [x0, z0] = RUTA[i], [x1, z1] = RUTA[i + 1];
      const k = r / LARGOS[i];
      return { x: x0 + (x1 - x0) * k, z: z0 + (z1 - z0) * k, dx: (x1 - x0) / LARGOS[i], dz: (z1 - z0) / LARGOS[i] };
    }
    r -= LARGOS[i];
  }
  return { x: RUTA[RUTA.length - 1][0], z: RUTA[RUTA.length - 1][1], dx: 1, dz: 0 };
}
// renglones del ticket (los primeros son los que dice la voz; después, todo el año)
const PRODUCTOS = ["ALFAJOR", "GASEOSA", "YERBA", "GALLETITAS", "CARAMELOS", "AGUA", "TURRÓN", "CHOCOLATE", "PAPAS", "CHICLES", "FIDEOS", "ACEITE", "AZÚCAR", "ARROZ"];
const FIADOS = ["MARTA", "CARLOS", "JUAN", "ROSA", "BETO", "HUGO", "NÉLIDA", "SANDRA"];
function renglon(i: number): [string, string] {
  if (i === 0) return ["ALFAJOR PRECIO VIEJO", "−$250"];
  if (i === 1) return ["FIADO MARTA", "−$14.000"];
  if (i === 2) return ["YERBA PRECIO VIEJO", "−$400"];
  if (i === 3) return ["GALLETITAS", "+$6"];
  if (rnd(i) > 0.55) return [`FIADO ${FIADOS[i % FIADOS.length]}`, `−$${(2 + Math.floor(rnd(i + 3) * 14)) * 500}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")];
  return [`${PRODUCTOS[i % PRODUCTOS.length]} PRECIO VIEJO`, `−$${(1 + Math.floor(rnd(i + 5) * 9)) * 50}`];
}
const POR_METRO = 4; // renglones por metro de ticket
// grabación real de la app (app/scripts/grabar-v8.cjs v8-07)
const APP = { alertas: 3.032, fin: 6.033 };

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  const T = {
    l, e, dur,
    perdiste: w(0, "perdiste", 2.0), cuenta: w(0, "cuenta", e[0] - 0.5),
    cuadras: w(1, "cuadras", l[1] + 0.8),
    marta: w(2, "marta", l[2] + 4.2), catorce: w(2, "catorce", l[2] + 5.3), yerba: w(2, "yerba", l[2] + 6.8), cuatrocientos: w(2, "cuatrocientos", e[2] - 0.8),
    seis: w(3, "seis", l[3] + 1.0), seis2: w(3, "seis.", e[3] - 0.4),
    total: w(4, "total", e[4] - 0.5),
    mil: w(5, "mil", e[5] - 0.4),
    corta: w(7, "corta", l[7] + 0.8), renglon: w(7, "renglón", l[7] + 3.4), arreglar: w(7, "arreglar", e[7] - 0.6),
    probalo: w(8, "probalo", l[8] + 1.6),
    LOOP: dur - 0.27,
  };
  return T;
}
type T = ReturnType<typeof tiempos>;

/** Metros recorridos por la cámara (persigue la punta del ticket). */
function avance(t: number, T: T) {
  const { l, e } = T;
  const tramos: [number, number][] = [[l[1], 0], [l[2], 4], [T.cuatrocientos + 0.6, 30], [T.seis2, 31.6], [l[4], 74], [e[4] + 0.15, LARGO - 1.6], [l[5], LARGO - 0.9]];
  if (t <= tramos[0][0]) return 0;
  for (let i = 0; i < tramos.length - 1; i++) {
    const [a, u0] = tramos[i], [b, u1] = tramos[i + 1];
    if (t < b) {
      const k = (t - a) / (b - a);
      const suave = i === 3 ? k * k * (3 - 2 * k) : i === 5 ? 1 - Math.pow(1 - k, 2.2) : k;
      return u0 + (u1 - u0) * suave;
    }
  }
  return LARGO - 0.9;
}

/** Cámara: mostrador (gancho y cierre), persecución a ras del piso, grúa aérea, puerta del kiosco (truco). */
type Cam3 = { pos: [number, number, number]; target: [number, number, number]; fov: number };
function camara(t: number, T: T): Cam3 {
  const { l } = T;
  const mostrador: Cam3 = { pos: [-29.1, 1.55, 1.9], target: [-30, 0.85, 0], fov: 50 };
  if (t < l[1] - 0.05 || t >= l[8] + 0.35) {
    const k = t >= l[8] ? 0 : t / Math.max(1, l[1]);
    return { ...mostrador, pos: [mostrador.pos[0] - 0.1 * k, mostrador.pos[1] - 0.05 * k, mostrador.pos[2] - 0.25 * k] as [number, number, number] };
  }
  if (t < l[6] - 0.05) {
    const u = avance(t, T);
    const a = enRuta(u - 1.3), b = enRuta(u + 2.2);
    const lado = t > l[5] - 0.3 ? 0 : 0.55;
    const alto = t > l[4] + 0.6 ? 0.55 + clamp((t - l[4] - 0.6) / 1.5, 0, 1) * 0.6 : 0.42;
    // al final se frena encima del último renglón
    const arriba = clamp((t - (T.e[4] - 0.1)) / 0.5, 0, 1);
    const fin = enRuta(LARGO - 0.55);
    const pos: [number, number, number] = [a.x - a.dz * lado, alto, a.z + a.dx * lado];
    const tgt: [number, number, number] = [b.x, 0.12, b.z];
    return {
      pos: [pos[0] + (fin.x - 0.9 - pos[0]) * arriba, pos[1] + (1.25 - pos[1]) * arriba, pos[2] + (fin.z + 0.05 - pos[2]) * arriba] as [number, number, number],
      target: [tgt[0] + (fin.x - tgt[0]) * arriba, tgt[1] + (0.0 - tgt[1]) * arriba, tgt[2] + (fin.z - tgt[2]) * arriba] as [number, number, number],
      fov: 58 - arriba * 14,
    };
  }
  if (t < l[7] - 0.05) {
    // grúa: sube desde el final del ticket hasta ver las tres cuadras desde arriba
    const k = entra((t - l[6]) / 2.2);
    const fin = enRuta(LARGO - 0.55);
    return {
      pos: [fin.x - 0.9 + (34 - fin.x + 0.9) * k, 1.25 + 92 * k, fin.z + 0.05 + (60 - fin.z) * k] as [number, number, number],
      target: [fin.x + (34 - fin.x) * k, 0, fin.z + (19 - fin.z) * k] as [number, number, number],
      fov: 44 + 6 * k,
    };
  }
  // truco: la puerta del kiosco
  const k = entra((t - l[7]) / 0.8);
  const telefono = t > T.corta + 0.9;
  const kk = entra((t - (T.corta + 0.9)) / 0.7);
  return telefono
    ? { pos: [1.62 - 0.03 * kk, 1.08, 3.02 - 0.15 * kk] as [number, number, number], target: [1.58, 1.02, 2.4] as [number, number, number], fov: 34 }
    : { pos: [2.6 - 0.6 * k, 1.5 - 0.3 * k, 6.5 - 2.6 * k] as [number, number, number], target: [1.48, 0.15, 1.6] as [number, number, number], fov: 50 };
}

/** Un metro de ticket con sus renglones impresos (textura propia por metro). */
const Tramo: React.FC<{ i: number; texto: boolean; tapado?: boolean; total?: boolean }> = ({ i, texto, tapado, total }) => {
  const tex = useLienzo(`ticket-${i}-${total ? (tapado ? "t" : "r") : ""}`, 192, 768, (x, w, h) => {
    x.fillStyle = "#fbfaf4"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#1c1c1c";
    if (total) {
      x.fillStyle = "#1c1c1c"; x.fillRect(10, 30, w - 20, 4);
      if (tapado) { x.fillStyle = "#111"; x.fillRect(10, h * 0.3, w - 20, h * 0.4); }
      else {
        x.save(); x.translate(w / 2, h / 2); x.rotate(-Math.PI / 2);
        x.font = `800 46px "Space Grotesk", monospace`; x.textAlign = "center"; x.fillStyle = "#c0261b";
        x.fillText("TOTAL −$5.832.000", 0, -8); x.font = `700 30px "Inter", sans-serif`; x.fillStyle = "#1c1c1c"; x.fillText("(ejemplo)", 0, 40);
        x.restore();
      }
      return;
    }
    for (let k = 0; k < POR_METRO; k++) {
      const [a, b] = renglon(i * POR_METRO + k);
      const y0 = (k + 0.5) * (h / POR_METRO);
      x.save(); x.translate(w / 2, y0); x.rotate(-Math.PI / 2);
      x.font = `700 22px "Space Grotesk", monospace`; x.textAlign = "left"; x.fillStyle = "#222";
      x.fillText(a.slice(0, 18), -h / POR_METRO / 2 + 10, -16);
      x.font = `800 30px "Space Grotesk", monospace`; x.textAlign = "right"; x.fillStyle = b.startsWith("+") ? "#16794a" : "#c0261b";
      x.fillText(b, h / POR_METRO / 2 - 10, 26);
      x.restore();
      x.fillStyle = "rgba(0,0,0,0.12)"; x.fillRect(8, (k + 1) * (h / POR_METRO) - 1, w - 16, 2);
    }
  });
  return <meshStandardMaterial map={texto ? tex : null} color={texto ? "#ffffff" : "#f3f1ea"} roughness={0.85} emissive="#ffffff" emissiveIntensity={texto ? 0.06 : 0.18} side={THREE.DoubleSide} />;
};

/** El ticket desplegado por las tres cuadras: un metro por tramo; solo los cercanos a la cámara llevan los renglones. */
const Ticket: React.FC<{ t: number; T: T; cerca: number; corte: number; desaparece: number; revelado: boolean }> = ({ cerca, corte, desaparece, revelado }) => {
  const n = Math.ceil(LARGO);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const u = i + 0.5;
        if (corte > 0 && u > 1.6 && u - 1.6 < desaparece * LARGO) return null;
        const p = enRuta(u);
        const ang = Math.atan2(p.dx, p.dz);
        const ondula = Math.sin(i * 1.7) * 0.012;
        const esFinal = i === n - 1;
        const cercano = Math.abs(u - cerca) < 22 || esFinal;
        return (
          <mesh key={i} position={[p.x, 0.006 + ondula * 0.3 + (i % 2) * 0.001, p.z]} rotation={[-Math.PI / 2, 0, ang + ondula]} receiveShadow castShadow>
            <planeGeometry args={[ANCHO, 1.02, 1, 1]} />
            <Tramo key={`${cercano ? "t" : "p"}${esFinal && !revelado ? "x" : ""}`} i={i} texto={cercano} total={esFinal} tapado={esFinal && !revelado} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Casa / local de barrio genérico (revoque, ventanas con luz, portón o persiana). */
const Casa: React.FC<{ w: number; h: number; color: string; semilla: number }> = ({ w, h, color, semilla }) => {
  const ventanas = Math.max(1, Math.floor(w / 2.2));
  return (
    <group>
      <mesh position={[0, h / 2, 0]} geometry={cajaR(w, h, 6, 0.05, 2)} castShadow receiveShadow><meshStandardMaterial color={color} roughness={0.9} /></mesh>
      <mesh position={[0, h + 0.08, 0.1]} castShadow><boxGeometry args={[w + 0.2, 0.16, 6.2]} /><meshStandardMaterial color="#d9d3c6" roughness={0.8} /></mesh>
      {Array.from({ length: ventanas }, (_, k) => {
        const x = -w / 2 + (k + 0.5) * (w / ventanas);
        const porton = k === 0 && rnd(semilla) > 0.4;
        return porton ? (
          <mesh key={k} position={[x, 1.1, 3.01]}><planeGeometry args={[2.2, 2.2]} /><meshStandardMaterial color="#8d938d" metalness={0.7} roughness={0.4} /></mesh>
        ) : (
          <group key={k}>
            <mesh position={[x, h > 4 ? 1.6 : 1.5, 3.01]}><planeGeometry args={[1.1, 1.3]} /><meshStandardMaterial color="#1d2730" emissive="#ffcf8a" emissiveIntensity={rnd(semilla + k) > 0.45 ? 0.75 : 0.04} /></mesh>
            {h > 4 ? <mesh position={[x, 4.4, 3.01]}><planeGeometry args={[1.0, 1.2]} /><meshStandardMaterial color="#1d2730" emissive="#ffcf8a" emissiveIntensity={rnd(semilla + k + 9) > 0.5 ? 0.7 : 0.03} /></mesh> : null}
          </group>
        );
      })}
    </group>
  );
};

/** Árbol de vereda (tronco y copa de varias esferas con textura de hojas). */
const Arbol: React.FC<{ s: number }> = ({ s }) => {
  const hojas = useLienzo("hojas-arbol", 256, 256, (x, w, h) => {
    x.fillStyle = "#2f5a34"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) { x.fillStyle = `hsl(${105 + rnd(i) * 30},${35 + rnd(i + 1) * 25}%,${18 + rnd(i + 2) * 22}%)`; x.beginPath(); x.ellipse(rnd(i + 3) * w, rnd(i + 4) * h, 3 + rnd(i + 5) * 5, 2 + rnd(i + 6) * 3, rnd(i + 7) * 3, 0, Math.PI * 2); x.fill(); }
  }, [2, 2]);
  return (
    <group scale={[s, s, s]}>
      <mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.1, 0.15, 2.8, 12]} /><meshStandardMaterial color="#4a3a2c" roughness={0.95} /></mesh>
      {[[0, 3.3, 0, 1.3], [0.7, 3.0, 0.2, 0.9], [-0.6, 3.1, -0.2, 1.0], [0.1, 3.9, 0.1, 0.9]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow><sphereGeometry args={[r, 20, 16]} /><meshStandardMaterial map={hojas} roughness={0.9} /></mesh>
      ))}
    </group>
  );
};

/** Farol de calle con luz cálida. */
const Farol: React.FC = () => (
  <group>
    <mesh position={[0, 2.2, 0]} castShadow><cylinderGeometry args={[0.05, 0.07, 4.4, 10]} /><meshStandardMaterial color="#2b2f2c" metalness={0.7} roughness={0.4} /></mesh>
    <mesh position={[0, 4.35, 0.35]}><boxGeometry args={[0.12, 0.08, 0.8]} /><meshStandardMaterial color="#2b2f2c" metalness={0.7} roughness={0.4} /></mesh>
    <mesh position={[0, 4.28, 0.65]}><boxGeometry args={[0.28, 0.06, 0.36]} /><meshStandardMaterial color="#fff2cf" emissive="#ffd27a" emissiveIntensity={3} /></mesh>
  </group>
);

/** Barrio: veredas, calles, casas, árboles y faroles a lo largo de las tres cuadras. */
const Barrio: React.FC = () => {
  const vereda = useLienzo("vereda-ticket", 256, 256, (x, w, h) => {
    x.fillStyle = "#a9a49a"; x.fillRect(0, 0, w, h);
    x.strokeStyle = "#7d786f"; x.lineWidth = 4;
    for (let i = 0; i <= 2; i++) { x.beginPath(); x.moveTo((i * w) / 2, 0); x.lineTo((i * w) / 2, h); x.stroke(); x.beginPath(); x.moveTo(0, (i * h) / 2); x.lineTo(w, (i * h) / 2); x.stroke(); }
  }, [60, 60]);
  const asfalto = useLienzo("asfalto-ticket", 256, 256, (x, w, h) => {
    x.fillStyle = "#2c2e30"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(200,200,200,${0.03 + rnd(i) * 0.05})`; x.fillRect(rnd(i + 1) * w, rnd(i + 2) * h, 2, 2); }
  }, [40, 40]);
  const casas = useMemo(() => {
    const out: { p: [number, number, number]; ry: number; w: number; h: number; c: string; s: number }[] = [];
    const colores = ["#e6d3b3", "#cfd8c8", "#e8c9b5", "#d7d0e0", "#f0e2c4", "#c9d6dc", "#e3b9a2"];
    let k = 0;
    for (let x = 3.2; x < 33; ) { const w = 5 + rnd(k) * 4; out.push({ p: [x + w / 2, 0, -3.3], ry: 0, w, h: 3 + rnd(k + 1) * 4, c: colores[k % 7], s: k }); x += w + 0.2; k++; }
    for (let z = 6; z < 36; ) { const w = 5 + rnd(k) * 4; out.push({ p: [39.3, 0, z + w / 2], ry: -Math.PI / 2, w, h: 3 + rnd(k + 1) * 4, c: colores[k % 7], s: k }); z += w + 0.2; k++; }
    for (let x = 39.5; x < 72; ) { const w = 5 + rnd(k) * 4; out.push({ p: [x + w / 2, 0, 35.3], ry: 0, w, h: 3 + rnd(k + 1) * 4, c: colores[k % 7], s: k }); x += w + 0.2; k++; }
    return out;
  }, []);
  const arboles: [number, number][] = [];
  for (let x = 6; x < 34; x += 7) arboles.push([x, 5.0]);
  for (let z = 8; z < 36; z += 7) arboles.push([33.8, z]);
  for (let x = 42; x < 70; x += 7) arboles.push([x, 40.8]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[30, -0.02, 20]} receiveShadow><planeGeometry args={[160, 160]} /><meshStandardMaterial map={asfalto} roughness={0.95} /></mesh>
      {/* veredas que siguen el recorrido */}
      <mesh rotation-x={-Math.PI / 2} position={[18, 0, 1.4]} receiveShadow><planeGeometry args={[40, 4.2]} /><meshStandardMaterial map={vereda} roughness={0.85} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[37.6, 0, 20]} receiveShadow><planeGeometry args={[4.2, 40]} /><meshStandardMaterial map={vereda} roughness={0.85} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[55, 0, 37.2]} receiveShadow><planeGeometry args={[36, 4.2]} /><meshStandardMaterial map={vereda} roughness={0.85} /></mesh>
      {casas.map((c, i) => <group key={i} position={c.p} rotation-y={c.ry}><Casa w={c.w} h={c.h} color={c.c} semilla={c.s} /></group>)}
      {arboles.map(([x, z], i) => <group key={i} position={[x, 0, z]}><Arbol s={0.85 + rnd(i) * 0.3} /></group>)}
      {arboles.filter((_, i) => i % 2).map(([x, z], i) => <group key={`f${i}`} position={[x + 2.5, 0, z]}><Farol /></group>)}
    </group>
  );
};

/** Mostrador del kiosco por dentro con la caja registradora imprimiendo y la montaña de papel en el piso (gancho y cierre). */
const Mostrador: React.FC<{ t: number }> = ({ t }) => {
  const madera = useLienzo("madera", 256, 256, (x, w, h) => {
    x.fillStyle = "#8a5a3c"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(60,35,20,${0.15 + rnd(i) * 0.2})`; x.lineWidth = 1 + rnd(i + 1) * 2; x.beginPath(); x.moveTo(0, rnd(i + 2) * h); x.bezierCurveTo(w * 0.3, rnd(i + 3) * h, w * 0.6, rnd(i + 4) * h, w, rnd(i + 5) * h); x.stroke(); }
  });
  const papel = useLienzo("papel-impreso", 128, 512, (x, w, h) => {
    x.fillStyle = "#fbfaf4"; x.fillRect(0, 0, w, h);
    for (let k = 0; k < 16; k++) { x.fillStyle = "#333"; x.fillRect(10, k * 32 + 10, 60 + rnd(k) * 30, 5); x.fillStyle = "#c0261b"; x.fillRect(w - 40, k * 32 + 18, 30, 6); }
  }, [1, 3]);
  papel.offset.y = -t * 0.9;
  const rollos = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ p: [-30 + (rnd(i) - 0.5) * 0.9, 0.05 + rnd(i + 1) * 0.35, 0.55 + (rnd(i + 2) - 0.5) * 0.7] as [number, number, number], r: [rnd(i + 3) * 3, rnd(i + 4) * 3, rnd(i + 5) * 3] as [number, number, number], s: 0.12 + rnd(i + 6) * 0.12 })), []);
  return (
    <group>
      <mesh position={[-30, 0.5, -0.2]} geometry={cajaR(1.8, 1.0, 0.7, 0.03)} castShadow receiveShadow><meshStandardMaterial map={madera} roughness={0.6} /></mesh>
      <mesh position={[-30, 1.02, -0.2]} castShadow receiveShadow><boxGeometry args={[1.9, 0.04, 0.78]} /><meshPhysicalMaterial color="#e9e4da" roughness={0.3} clearcoat={0.6} /></mesh>
      {/* caja registradora */}
      <group position={[-30, 1.04, -0.25]}>
        <mesh position={[0, 0.1, 0]} geometry={cajaR(0.46, 0.2, 0.42, 0.03)} castShadow><meshPhysicalMaterial color="#25302b" roughness={0.35} clearcoat={0.7} /></mesh>
        <mesh position={[0, 0.27, -0.08]} rotation-x={-0.5} geometry={cajaR(0.3, 0.16, 0.03, 0.01)} castShadow><meshStandardMaterial color="#1b1f1d" roughness={0.4} /></mesh>
        <mesh position={[0, 0.275, -0.063]} rotation-x={-0.5}><planeGeometry args={[0.26, 0.12]} /><meshStandardMaterial color="#0b1f15" emissive="#5ff09a" emissiveIntensity={0.7} /></mesh>
        {Array.from({ length: 12 }, (_, k) => (
          <mesh key={k} position={[-0.12 + (k % 4) * 0.08, 0.205, 0.06 + Math.floor(k / 4) * 0.055]} geometry={cajaR(0.06, 0.018, 0.045, 0.006, 2)} castShadow><meshStandardMaterial color="#eae6dc" roughness={0.5} /></mesh>
        ))}
        {/* ticket que sale de la impresora y cae por el borde */}
        <mesh position={[0.16, 0.24, 0.13]} rotation-x={-0.3}><planeGeometry args={[0.08, 0.12]} /><meshStandardMaterial map={papel} roughness={0.8} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0.16, 0.12, 0.33]} rotation-x={-1.2}><planeGeometry args={[0.08, 0.3]} /><meshStandardMaterial map={papel} roughness={0.8} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0.16, -0.45, 0.44]}><planeGeometry args={[0.08, 1.0]} /><meshStandardMaterial map={papel} roughness={0.8} side={THREE.DoubleSide} /></mesh>
      </group>
      {/* montaña de papel en el piso */}
      {rollos.map((r, i) => (
        <mesh key={i} position={r.p} rotation={r.r} castShadow receiveShadow>
          <torusGeometry args={[r.s, 0.004, 4, 40]} />
          <meshStandardMaterial color="#f7f5ee" roughness={0.85} />
        </mesh>
      ))}
      {rollos.map((r, i) => (
        <mesh key={`c${i}`} position={[r.p[0], r.p[1], r.p[2]]} rotation={r.r} castShadow>
          <cylinderGeometry args={[r.s, r.s, 0.08, 40, 1, true]} />
          <meshStandardMaterial map={papel} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* pared del fondo con estantes */}
      <mesh position={[-30, 1.6, -1.2]} receiveShadow><planeGeometry args={[6, 3.2]} /><meshStandardMaterial color="#e6dccb" roughness={0.9} /></mesh>
      {[0.9, 1.45, 2.0].map((y) => (
        <group key={y}>
          <mesh position={[-30, y, -1.05]} castShadow><boxGeometry args={[2.4, 0.03, 0.3]} /><meshStandardMaterial color="#d0d0cb" metalness={0.5} roughness={0.4} /></mesh>
          {Array.from({ length: 11 }, (_, k) => (
            <mesh key={k} position={[-31.1 + k * 0.21, y + 0.09, -1.05]} geometry={cajaR(0.15, 0.16 + rnd(k + y * 10) * 0.08, 0.1, 0.01, 2)} castShadow>
              <meshPhysicalMaterial color={["#e94b3c", "#f2b134", "#2f8f5b", "#3d6fb5", "#f07aa8", "#8a4fbf"][(k + Math.round(y * 3)) % 6]} roughness={0.35} clearcoat={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[-30, 0, 0.5]} receiveShadow><planeGeometry args={[6, 5]} /><meshStandardMaterial color="#b8b2a6" roughness={0.8} /></mesh>
      <pointLight position={[-29.6, 2.6, 1.0]} intensity={5} distance={6} decay={1.6} color="#ffe0b0" castShadow shadow-mapSize={[1024, 1024]} />
    </group>
  );
};

const Escena3D: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const cam = camara(t, T);
  const u = avance(t, T);
  const corte = t > T.corta ? 1 : 0;
  const desaparece = clamp((t - T.corta - 0.15) / 1.0, 0, 1);
  const revelado = t >= T.l[5] - 0.02;
  const enfoque = Math.hypot(cam.pos[0] - cam.target[0], cam.pos[1] - cam.target[1], cam.pos[2] - cam.target[2]);
  const aereo = t > T.l[6] - 0.05 && t < T.l[7] - 0.05;
  return (
    <>
      <Estudio fondo="#141c2a" niebla={aereo ? [120, 260] : [18, 70]} luz={0.5} calida={0.7} exposicion={1.0} principal={[20, 40, 25]} />
      <Camara c={cam} t={t} mano={aereo ? 0 : 1} />
      <Mostrador t={t} />
      <Barrio />
      <group position={[0, 0, -0.2]}><Kiosco3D t={t} /></group>
      <Ticket t={t} T={T} cerca={u} corte={corte} desaparece={desaparece} revelado={revelado} />
      {/* tijera de luz que corta el ticket en la puerta */}
      {t > T.corta - 0.2 && t < T.corta + 0.8 ? (
        <mesh position={[1.48, 0.03, 1.6]} rotation-x={-Math.PI / 2} scale={[1, 1, 1]}>
          <planeGeometry args={[0.6 * entra((t - T.corta + 0.2) / 0.25), 0.03]} />
          <meshBasicMaterial color="#9ffcff" toneMapped={false} transparent opacity={1 - clamp((t - T.corta - 0.4) / 0.4, 0, 1)} />
        </mesh>
      ) : null}
      {t > T.corta + 0.5 && t < T.l[8] + 0.6 ? (
        <group position={[1.58, 1.02 - (1 - entra((t - T.corta - 0.5) / 0.6)) * 0.5, 2.4]} rotation-y={Math.sin(t * 0.8) * 0.05}>
          <Celular3D><PantallaApp t={t} carpeta="tomas/v8-07" app0={T.corta + 1.0} rate={1} durGrab={APP.fin} /></Celular3D>
        </group>
      ) : null}
      {!aereo ? <Profundidad foco={enfoque} apertura={0.012} max={0.012} /> : null}
    </>
  );
};

export const ElTicket: React.FC<VideoProps> = ({ voz, palabras }) => {
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
  const renglonesVoz = [l[2], T.marta - 0.3, T.yerba - 0.1, l[3]];

  const manual = [0.03, T.perdiste, T.cuenta, T.cuadras, ...renglonesVoz, T.catorce, T.seis, T.seis2, l[4], T.total, l[5], T.mil, l[6], T.corta, T.renglon, T.probalo];
  const cortes = [l[1], T.seis2 + 0.3, l[4], l[6], l[7], l[8]];
  const persecucion = t > l[2] && t < sil0;
  const cam: Cam2D = t > sil0 && t < l[5] ? { z: 1.02, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : ritmo(pal, manual, [[sil0, l[5] - 0.02], [T.LOOP - 0.4, 999]]), loop ? [] : cortes, 0.45);
  // desenfoque de movimiento en la persecución (menos en la cámara lenta de las galletitas)
  const lenta = t > l[3] - 0.1 && t < T.seis2 + 0.1;
  if (persecucion && !lenta) cam.blur += t > T.seis2 + 0.2 && t < l[4] + 0.3 ? 1.6 : 0.5;
  const hs = loop ? 0 : temblor(t, [[0.03, 8], [l[5], 12], [T.mil, 6], [T.corta, 7]]) + (persecucion && !lenta ? Math.sin(t * 40) * 0.4 : 0);
  let wf = 0;
  if (!loop) [[l[5], 0.3], [T.corta, 0.35]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });

  // ---------- sonido ----------
  const tics: number[] = [];
  for (let a = l[2]; a < e[4]; a += lenta ? 0.3 : Math.max(0.07, 0.28 - (a - l[2]) * 0.018)) if (!(a > l[3] - 0.1 && a < T.seis2 + 0.1)) tics.push(a);
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, { en: 0, sfx: "papel", vol: 0.5 }, ...[0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75].map((a) => ({ en: a, sfx: "tic", vol: 0.35 })),
    ...cortes.map((a) => ({ en: a - 0.12, sfx: "whoosh", vol: 0.35 })),
    { en: l[1], sfx: "papel_arrancado", vol: 0.4 }, { en: T.cuadras, sfx: "thump", vol: 0.45 },
    ...tics.map((a) => ({ en: a, sfx: "tic", vol: 0.45 })),
    { en: l[3] + 0.1, sfx: "rebobinado", vol: 0.3 }, { en: T.seis2, sfx: "coins", vol: 0.55 }, { en: T.seis2 + 0.3, sfx: "viento", vol: 0.35 },
    { en: l[4], sfx: "heart", vol: 0.5 }, { en: l[4] + 0.55, sfx: "heart", vol: 0.5 }, { en: l[4] + 1.05, sfx: "heart", vol: 0.55 },
    { en: l[5], sfx: "slam", vol: 0.5 }, { en: l[5] + 0.02, sfx: "thump", vol: 0.6 }, { en: T.mil + 0.1, sfx: "tijera", vol: 0.45 },
    { en: l[6], sfx: "viento", vol: 0.4 }, { en: l[6] + 1.6, sfx: "thump", vol: 0.45 },
    { en: T.corta - 0.05, sfx: "tijera", vol: 0.6 }, { en: T.corta + 0.2, sfx: "whoosh", vol: 0.45 }, { en: T.corta + 1.0 + APP.alertas, sfx: "ding", vol: 0.45 }, { en: T.renglon, sfx: "ding", vol: 0.45 },
    { en: T.probalo, sfx: "click", vol: 0.5 }, ...[0.25, 0.75, 1.25, 1.75].map((a) => ({ en: T.LOOP - 2 + a, sfx: "tic", vol: 0.3 })), { en: T.LOOP, sfx: "thump", vol: 0.45 },
  ].filter((x) => !(x.en > sil0 + 0.02 && x.en < l[5] - 0.05));

  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(sil0 * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.12 * Math.min(1, Math.max(0, sil0 * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(l[5] * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(l[5] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.12 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // ---------- capa gráfica (máximo 2 textos + subtítulo) ----------
  const tg = loop ? 0 : t;
  const cuadra = t < T.seis2 + 0.3 ? 1 : t < l[4] ? 2 : 3;
  const rengs: [string, string][] = [["ALFAJOR PRECIO VIEJO", "−$250"], ["FIADO MARTA", "−$14.000"], ["YERBA PRECIO VIEJO", "−$400"], ["GALLETITAS", "+$6"]];
  const actual = renglonesVoz.map((a, i) => ({ a, i })).reverse().find((x) => t >= x.a);
  const frente = (
    <>
      {tg < l[1] - 0.05 || loop ? (
        <>
          <Cartel texto="TODO LO QUE PERDISTE" top={86} size={27} s={Math.min(1.08, 0.8 + sp(tg + 0.1) * 0.2) * latido(tg, 0.62, 0.04)} rot={-2 + Math.sin(tg * 4) * 1.2} />
          <div style={{ left: 0, right: 0, top: 140, textAlign: "center", font: `700 17px ${BODY}`, color: "#fff", textShadow: "0 2px 8px #000" }}>ESTE AÑO · tu kiosco (ejemplo)</div>
        </>
      ) : null}
      {t >= l[1] - 0.05 && t < sil0 && !loop ? (
        <>
          <Etiqueta texto={`CUADRA ${cuadra}`} top={72} fondo={C.verde} color={C.ambar} size={20} />
          {actual && t < T.seis2 + 0.3 ? (
            <div key={actual.i} style={{ left: 24, right: 24, top: 118, padding: "10px 14px", borderRadius: 10, background: "#fbfaf4", boxShadow: "0 8px 20px #0008", transform: `scale(${sp(t - actual.a, 1.08, 18, 0.45)}) rotate(${actual.i % 2 ? 1.5 : -1.5}deg)` }}>
              <div style={{ position: "static", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, whiteSpace: "nowrap", font: `700 16px ${DISP}`, color: "#222" }}>
                <span style={{ position: "static" }}>{rengs[actual.i][0]}</span>
                <span style={{ position: "static", font: `800 ${actual.i === 3 ? 30 : 26}px ${DISP}`, color: actual.i === 3 ? C.hoja : "#c0261b" }}>{rengs[actual.i][1]}</span>
              </div>
              <div style={{ position: "static", textAlign: "right", font: `600 12px ${BODY}`, color: "#666" }}>(ejemplo)</div>
            </div>
          ) : t >= l[4] - 0.05 ? (
            <Rotulo t={t} desde={l[4]} texto="…y todavía no llegamos al total" top={124} color={C.rojo} size={18} />
          ) : null}
        </>
      ) : null}
      {t >= l[5] - 0.02 && t < l[6] - 0.05 ? (
        <>
          <Etiqueta texto="TOTAL DEL AÑO" top={70} fondo={C.rojo} />
          <div style={{ left: 0, right: 0, top: 98, textAlign: "center", font: `800 46px ${DISP}`, color: "#ff6b5e", letterSpacing: "-.03em", transform: `scale(${sp(t - l[5], 1.1, 16, 0.45) * latido(t - T.mil, 0.6, 0.05)})`, textShadow: "0 4px 18px #000c" }}>−{ars(TOTAL)}</div>
          <div style={{ left: 0, right: 0, top: 156, textAlign: "center", font: `700 16px ${BODY}`, color: "#fff", textShadow: "0 2px 8px #000" }}>(ejemplo)</div>
        </>
      ) : null}
      {t >= l[6] - 0.05 && t < l[7] - 0.05 ? (
        <>
          <Cartel texto="3 CUADRAS DE PLATA PERDIDA" top={84} size={20} s={sp(t - l[6], 1.06) * latido(t, 0.6, 0.03)} rot={-2} />
          <Rotulo t={t} desde={l[6] + 0.8} texto={`PRECIOS VIEJOS ${ars(PRECIOS)} · FIADO ${ars(FIADO)}`} top={138} size={15} />
        </>
      ) : null}
      {t >= l[7] - 0.05 && t < l[8] - 0.05 ? (
        <div style={{ left: 0, right: 0, top: 78, textAlign: "center", transform: `scale(${sp(t - l[7], 1.06)})` }}>
          <span style={{ position: "static", font: `800 22px/1.15 ${DISP}`, color: "#fff", textShadow: "0 3px 12px #000a" }}>En Claro <span style={{ position: "static", color: C.ambar }}>corta el ticket</span></span>
        </div>
      ) : null}
      {t >= l[8] - 0.05 && !loop ? (
        t >= T.probalo - 0.1 ? <Probalo s={sp(t - (T.probalo - 0.1), 1.05, 15, 0.45) * latido(t - T.probalo, 0.6, 0.05)} top={96} />
          : <Cartel texto="¿CUÁNTO MEDIRÍA EL TUYO?" top={90} fondo={C.verde} color={C.ambar} size={22} s={sp(t - l[8], 1.06)} rot={-2 + Math.sin(t * 4) * 1.2} />
      ) : null}
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, e[0] + 0.1], [sil0, l[5] + 0.05], [T.LOOP - 0.01, 999]]}
      fondo={<div style={{ inset: 0, background: "#141c2a" }} />}
      tres={<Escena3D t={tw} T={T} />}
      frente={frente}
      sobre={musica}
    />
  );
};
