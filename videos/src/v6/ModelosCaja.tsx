import React, { useMemo } from "react";
import * as THREE from "three";
import { rnd } from "../lib/anim";
import { useTex } from "./comun";

type V3 = [number, number, number];

const Mat: React.FC<{ c: string; r?: number; m?: number; e?: string; ei?: number }> = ({ c, r = 0.55, m = 0.2, e, ei = 0 }) => (
  <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e ?? "#000"} emissiveIntensity={ei} />
);

export type ModoDisplay = "ojos" | "num" | "feliz" | "triste";

/** La pantalla de la caja: se redibuja en cada cuadro (ojos que miran, parpadeo o números tipo LCD). */
function useDisplay() {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 128;
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    return { cv, tx };
  }, []);
}

function dibujar(cv: HTMLCanvasElement, modo: ModoDisplay, texto: string, mx: number, my: number, parpadeo: number, color: string) {
  const x = cv.getContext("2d")!;
  const { width: w, height: h } = cv;
  x.fillStyle = "#08180f";
  x.fillRect(0, 0, w, h);
  x.fillStyle = "#0d2a1a";
  for (let j = 0; j < h; j += 4) x.fillRect(0, j, w, 1);
  if (modo === "num") {
    x.font = `700 ${texto.length > 7 ? 50 : 68}px "Space Grotesk", monospace`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.shadowColor = color;
    x.shadowBlur = 14;
    x.fillStyle = color;
    x.fillText(texto, w / 2, h / 2 + 4);
    x.shadowBlur = 0;
    return;
  }
  [w * 0.3, w * 0.7].forEach((cx) => {
    if (modo === "feliz") {
      x.strokeStyle = "#7CFFB0";
      x.lineWidth = 12;
      x.lineCap = "round";
      x.beginPath();
      x.arc(cx, h * 0.62, 30, Math.PI * 1.1, Math.PI * 1.9);
      x.stroke();
      return;
    }
    const ry = 36 * (1 - parpadeo * 0.92);
    x.fillStyle = "#f4fff6";
    x.beginPath();
    x.ellipse(cx, h / 2, 32, ry, 0, 0, Math.PI * 2);
    x.fill();
    if (parpadeo < 0.6) {
      x.fillStyle = "#06140D";
      x.beginPath();
      x.arc(cx + mx * 14, h / 2 + my * 10 + (modo === "triste" ? 6 : 0), 15, 0, Math.PI * 2);
      x.fill();
    }
    if (modo === "triste") {
      x.strokeStyle = "#7CFFB0";
      x.lineWidth = 8;
      x.lineCap = "round";
      x.beginPath();
      x.moveTo(cx - 34, h / 2 - (cx < w / 2 ? 44 : 62));
      x.lineTo(cx + 34, h / 2 - (cx < w / 2 ? 62 : 44));
      x.stroke();
    }
  });
}

type Props = {
  cajon: number; // 0 cerrado .. 1 abierto
  ticket: number; // 0..1 largo del ticket que sale
  campana: number; // sacudida de la campanita
  salto: number; // saltito de todo el cuerpo
  modo: ModoDisplay;
  texto: string;
  mira: [number, number];
  parpadeo: number;
  colorLcd: string;
  restante: number; // 0..1 pila de billetes en el cajón
  listo: boolean;
};

/** Caja registradora de kiosco: cuerpo mostaza, teclas, pantalla con ojos, campanita, ticket y cajón de billetes. */
export const Caja: React.FC<Props> = ({ cajon, ticket, campana, salto, modo, texto, mira, parpadeo, colorLcd, restante, listo }) => {
  const disp = useDisplay();
  dibujar(disp.cv, modo, texto, mira[0], mira[1], parpadeo, colorLcd);
  disp.tx.needsUpdate = true;
  const papel = useTex("ticket", 256, 700, (x, w, h) => {
    x.fillStyle = "#f7f3e6";
    x.fillRect(0, 0, w, h);
    x.fillStyle = "#2a2418";
    x.font = "700 19px 'Space Grotesk', monospace";
    x.textAlign = "left";
    const L: [string, string, string?][] = [["EN CLARO · CAJA", ""], ["ENTRÓ", "$120.000"], ["MERCADERÍA", "-$66.000"], ["ALQ+LUZ+SUELDO", "-$36.333"], ["FIADO", "-$8.000"], ["- - - - - - - - -", ""], ["TE QUEDÓ", "$9.667"]];
    L.forEach(([a, b], i) => {
      const y = 36 + i * 46;
      if (i === 6) { x.font = "900 24px 'Space Grotesk', monospace"; x.fillStyle = "#b42318"; }
      x.textAlign = "left";
      x.fillText(a, 14, y);
      x.textAlign = "right";
      x.fillText(b, w - 14, y);
    });
    x.textAlign = "left";
    x.fillStyle = "#6a6150";
    x.font = "400 13px 'Space Grotesk', monospace";
    x.fillText("(ejemplo)", 14, 36 + 7 * 46);
  }, listo);
  papel.wrapT = THREE.ClampToEdgeWrapping;
  const r = Math.max(0.001, Math.min(1, ticket));
  papel.repeat.set(1, r);
  papel.offset.set(0, 1 - r);
  const teclas = Array.from({ length: 20 }, (_, i) => ({ c: i % 5, f: Math.floor(i / 5) }));
  const colTecla = (i: number) => (i === 19 ? "#4fae72" : i === 14 ? "#e24a4a" : i % 7 === 0 ? "#d9d9d9" : "#f4efe2");
  return (
    <group position={[0, salto * 0.06, 0]}>
      {/* mostrador */}
      <mesh position={[0, -0.13, 0.2]} receiveShadow castShadow>
        <boxGeometry args={[9, 0.26, 4]} />
        <Mat c="#7a5230" r={0.8} m={0} />
      </mesh>
      {/* cuerpo */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 1.0, 1.9]} />
        <Mat c="#d9a441" r={0.4} m={0.35} />
      </mesh>
      <mesh position={[0, 0.05, 0.96]} castShadow>
        <boxGeometry args={[2.78, 0.1, 0.08]} />
        <Mat c="#8f6a22" />
      </mesh>
      {/* panel inclinado de teclas */}
      <group position={[0, 1.08, 0.18]} rotation={[-0.4, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.5, 0.12, 1.25]} />
          <Mat c="#2a2420" r={0.6} m={0.3} />
        </mesh>
        {teclas.map(({ c, f }, i) => (
          <mesh key={i} position={[-0.9 + c * 0.45, 0.1, -0.47 + f * 0.31]} castShadow>
            <boxGeometry args={[0.36, 0.12, 0.25]} />
            <Mat c={colTecla(i)} r={0.4} m={0.1} />
          </mesh>
        ))}
      </group>
      {/* pantalla */}
      <group position={[0, 1.78, -0.45]} rotation={[-0.15, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.1, 0.95, 0.35]} />
          <Mat c="#3a2f26" r={0.5} m={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.181]}>
          <planeGeometry args={[1.85, 0.74]} />
          <meshBasicMaterial map={disp.tx} toneMapped={false} />
        </mesh>
      </group>
      {/* campanita */}
      <group position={[-1.05, 1.24, -0.2]} rotation={[0, 0, campana * 0.5]}>
        <mesh castShadow>
          <sphereGeometry args={[0.24, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Mat c="#ffcf4a" r={0.2} m={0.9} e="#FFB703" ei={0.15} />
        </mesh>
        <mesh position={[0, 0.27, 0]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <Mat c="#ffcf4a" r={0.2} m={0.9} />
        </mesh>
      </group>
      {/* ticket que sale por arriba */}
      {ticket > 0.005 ? (
        <mesh position={[0.62, 2.28 + r * 1.2, -0.62]} rotation={[-0.12, 0, 0.03]} castShadow>
          <planeGeometry args={[0.9, 2.4 * r]} />
          <meshStandardMaterial map={papel} side={2} roughness={0.95} />
        </mesh>
      ) : null}
      {/* cajón con billetes */}
      <group position={[0, 0.3, 0.9 + cajon * 1.4]}>
        <mesh castShadow>
          <boxGeometry args={[2.4, 0.34, 1.5]} />
          <Mat c="#b28830" r={0.5} m={0.4} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <boxGeometry args={[2.2, 0.02, 1.3]} />
          <meshStandardMaterial color="#1a120a" />
        </mesh>
        {restante > 0.01 ? (
          <mesh position={[-0.55, 0.19 + restante * 0.13, 0]}>
            <boxGeometry args={[0.95, 0.26 * restante + 0.02, 1.1]} />
            <Mat c="#4fae72" r={0.6} m={0} />
          </mesh>
        ) : null}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[0.45 + (i % 4) * 0.3, 0.2 + Math.floor(i / 4) * 0.05, -0.3 + Math.floor(i / 4) * 0.5]}>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
            <Mat c={rnd(i) > 0.5 ? "#ffcf4a" : "#d0d3d6"} r={0.25} m={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
