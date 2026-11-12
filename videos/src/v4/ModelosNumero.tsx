import React, { useMemo } from "react";
import * as THREE from "three";
import { eIn } from "../lib/anim";

// Modelos del video v4-01 ("El número tapado"): número pintado con aerosol sobre la persiana,
// parches de cinta de embalar que se despegan, trozos sueltos y boletas.

type V3 = [number, number, number];
const MARK = "'Permanent Marker', cursive";
const DISP = "'Space Grotesk', 'DejaVu Sans', sans-serif";

function useTex(key: string, w: number, h: number, dibujar: (x: CanvasRenderingContext2D, w: number, h: number) => void, listo: boolean) {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    dibujar(cv.getContext("2d")!, w, h);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 4;
    return tx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, w, h, listo]);
}

/** Dónde queda el número en el kiosco (coordenadas del kiosco): centro de la persiana al 70%. */
export const NUM_Y = 2.18;
export const NUM_Z = 1.215;
export const NUM_W = 2.9;
export const NUM_H = 0.96;

/** Número pintado con aerosol (rojo, con chorreaduras). `pulso` 0..1 lo hace latir. */
export const NumeroAerosol: React.FC<{ texto: string; pulso: number; listo: boolean }> = ({ texto, pulso, listo }) => {
  const tx = useTex("num-" + texto, 1024, 340, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.font = `400 262px ${MARK}`;
    x.textAlign = "center";
    x.textBaseline = "alphabetic";
    x.shadowColor = "#ff2d3b";
    x.shadowBlur = 26;
    x.fillStyle = "#FF2D3B";
    x.fillText(texto, w / 2, 262);
    x.shadowBlur = 0;
    // chorreaduras de pintura
    x.strokeStyle = "#c4141f";
    x.lineCap = "round";
    for (let i = 0; i < 9; i++) {
      const px = 70 + ((i * 113) % 880), largo = 24 + ((i * 37) % 44);
      x.lineWidth = 7 + (i % 3) * 2;
      x.beginPath();
      x.moveTo(px, 255);
      x.lineTo(px, 255 + largo);
      x.stroke();
    }
  }, listo);
  const c = 0.78 + 0.22 * pulso;
  return (
    <mesh position={[0, NUM_Y, NUM_Z]} scale={1 + 0.012 * pulso}>
      <planeGeometry args={[NUM_W, NUM_H]} />
      <meshBasicMaterial map={tx} transparent toneMapped={false} color={new THREE.Color(c, c, c)} />
    </mesh>
  );
};

function useTexturaCinta() {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 256;
    const x = cv.getContext("2d")!;
    // bordes irregulares a izquierda y derecha
    x.beginPath();
    x.moveTo(6, 0);
    for (let y = 0; y <= 256; y += 16) x.lineTo(6 + ((y * 7) % 11), y);
    for (let y = 256; y >= 0; y -= 16) x.lineTo(250 - ((y * 5) % 9), y);
    x.closePath();
    const gr = x.createLinearGradient(0, 0, 256, 256);
    gr.addColorStop(0, "#d2b26a");
    gr.addColorStop(0.5, "#c19b50");
    gr.addColorStop(1, "#a9833b");
    x.fillStyle = gr;
    x.fill();
    x.save();
    x.clip();
    x.strokeStyle = "#ffffff33";
    x.lineWidth = 5;
    for (let i = -2; i < 7; i++) {
      x.beginPath();
      x.moveTo(i * 60, 0);
      x.lineTo(i * 60 + 120, 256);
      x.stroke();
    }
    x.strokeStyle = "#8a6f3a44";
    x.lineWidth = 2;
    for (let y = 20; y < 256; y += 36) {
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(256, y + 3);
      x.stroke();
    }
    x.restore();
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }, []);
}

/**
 * Parche de cinta pegado sobre el número. `p` (0..1) es cuánto se despegó: gira desde el borde de arriba,
 * se viene hacia la cámara y cae. `tiron` lo arranca más fuerte (la revelación).
 * `lift` lo afloja un poco antes de despegarse; `alpha` y `escala` sirven para volver a pegarlo (loop final).
 */
export const Cinta: React.FC<{ cx: number; ancho: number; rotZ: number; p: number; tiron?: boolean; lift?: number; alpha?: number; escala?: number }> = ({ cx, ancho, rotZ, p, tiron = false, lift = 0, alpha = 1, escala = 1 }) => {
  const tx = useTexturaCinta();
  if (p >= 1 || alpha <= 0.005) return null;
  const e = eIn(p);
  const rotX = -(lift * 0.5 + (tiron ? 2.7 : 2.3) * e);
  const dy = tiron ? -2.2 * p * p + 1.4 * p : -3.2 * p * p + 0.5 * p;
  const dz = (tiron ? 4.6 : 1.7) * p;
  const dx = tiron ? cx * 0.9 * p : 0;
  const op = alpha * (1 - p * p * p) * 0.92;
  return (
    <group position={[cx + dx, NUM_Y + 0.58 + dy, NUM_Z + 0.03 + dz]} rotation={[rotX, 0, rotZ + (tiron ? p * 0.7 * (cx > 0 ? 1 : -1) : 0)]} scale={escala}>
      <mesh position={[0, -0.58, 0]}>
        <planeGeometry args={[ancho, 1.16]} />
        <meshBasicMaterial map={tx} transparent opacity={op} side={THREE.DoubleSide} alphaTest={0.04} toneMapped={false} />
      </mesh>
    </group>
  );
};

/** Trocito de cinta que sale volando cuando cae una boleta. */
export const TrozoCinta: React.FC<{ position: V3; rot: V3; opacidad: number }> = ({ position, rot, opacidad }) => {
  const tx = useTexturaCinta();
  return (
    <mesh position={position} rotation={rot}>
      <planeGeometry args={[0.42, 0.2]} />
      <meshBasicMaterial map={tx} transparent opacity={opacidad} side={THREE.DoubleSide} alphaTest={0.04} toneMapped={false} />
    </mesh>
  );
};

const BOLETAS: [string, string][] = [["ALQUILER", "−$450.000"], ["LUZ", "−$140.000"], ["SUELDO", "−$500.000"], ["÷ 30", "DÍAS"]];

/** Boleta (papel con borde rojo) que cae sobre la persiana. */
export const Boleta: React.FC<{ k: number; position: V3; rot: V3; escala?: number; opacidad?: number; listo: boolean }> = ({ k, position, rot, escala = 1, opacidad = 1, listo }) => {
  const [a, b] = BOLETAS[k];
  const tx = useTex("boleta-" + k, 512, 320, (x, w, h) => {
    x.fillStyle = "#F7F1DC";
    x.fillRect(0, 0, w, h);
    x.strokeStyle = "#C1121F";
    x.lineWidth = 12;
    x.strokeRect(8, 8, w - 16, h - 16);
    x.fillStyle = "#777";
    x.font = `700 30px ${DISP}`;
    x.textAlign = "center";
    x.fillText(k === 3 ? "DIVIDIDO POR" : "BOLETA", w / 2, 66);
    x.fillStyle = "#222";
    x.font = `700 84px ${DISP}`;
    x.fillText(a, w / 2, 168);
    x.fillStyle = "#C1121F";
    x.font = `700 ${k === 3 ? 84 : 76}px ${DISP}`;
    x.fillText(b, w / 2, 262);
  }, listo);
  return (
    <mesh position={position} rotation={rot} scale={escala} castShadow>
      <planeGeometry args={[1.5, 0.94]} />
      <meshStandardMaterial map={tx} side={THREE.DoubleSide} transparent opacity={opacidad} roughness={0.9} />
    </mesh>
  );
};
