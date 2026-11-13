import React from "react";
import { rnd } from "../lib/anim";
import { MARKER } from "../lib/fuentes";
import { useTex } from "./comun";

type V3 = [number, number, number];
export const ANCHO = 1.5;
export const ALTO = 3.4;
export const XS = [-1.7, 0, 1.7, 3.4];

function chapa(x: CanvasRenderingContext2D, w: number, h: number) {
  const gr = x.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, "#8b949a");
  gr.addColorStop(0.5, "#aab2b7");
  gr.addColorStop(1, "#858d93");
  x.fillStyle = gr;
  x.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 20) {
    x.fillStyle = "#5c646a";
    x.fillRect(0, y + 15, w, 5);
    x.fillStyle = "#c7ced2";
    x.fillRect(0, y, w, 2);
  }
  for (let i = 0; i < 26; i++) {
    x.fillStyle = `rgba(110,60,25,${0.06 + rnd(i) * 0.1})`;
    x.fillRect(rnd(i + 3) * w, rnd(i + 5) * h * 0.7, 3 + rnd(i + 7) * 5, 40 + rnd(i + 9) * 160);
  }
}

function pintura(x: CanvasRenderingContext2D, txt: string, cx: number, cy: number, size: number, color: string, borde = false) {
  x.save();
  x.translate(cx, cy);
  x.rotate(-0.04);
  x.font = txt === "1" ? `900 ${size * 1.05}px "Space Grotesk", sans-serif` : `400 ${size}px ${MARKER}`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  if (borde) {
    x.lineJoin = "round";
    x.lineWidth = 12;
    x.strokeStyle = "#1a0d05";
    x.strokeText(txt, 0, 0);
  }
  x.shadowColor = color;
  x.shadowBlur = 14;
  x.fillStyle = color;
  x.fillText(txt, 0, 0);
  x.shadowBlur = 0;
  x.restore();
  // chorreaduras
  for (let i = 0; i < 5; i++) {
    x.fillStyle = color;
    const px = cx - size * 0.28 + rnd(i * 3 + txt.length) * size * 0.56;
    x.fillRect(px, cy + size * 0.25, 4, 18 + rnd(i + 20) * 60);
    x.beginPath();
    x.arc(px + 2, cy + size * 0.25 + 18 + rnd(i + 20) * 60, 4, 0, Math.PI * 2);
    x.fill();
  }
}

function dibujarNumero(x: CanvasRenderingContext2D, w: number, h: number, n: string, color: string) {
  chapa(x, w, h);
  pintura(x, n, w / 2, h * 0.5, 470, color);
}

function dibujarMensaje(x: CanvasRenderingContext2D, w: number, h: number) {
  chapa(x, w, h);
  const lineas = ["VENDER", "CON EL", "PRECIO", "DE LA", "SEMANA", "PASADA"];
  lineas.forEach((l, i) => {
    let size = 92;
    x.font = `400 ${size}px ${MARKER}`;
    while (x.measureText(l).width > w - 36 && size > 30) {
      size -= 4;
      x.font = `400 ${size}px ${MARKER}`;
    }
    pintura(x, l, w / 2, 70 + i * 100, size, i === 5 ? "#FF2D3B" : "#FFB703", true);
  });
}

function dibujarLona(x: CanvasRenderingContext2D, w: number, h: number, txt: string, color: string) {
  const gr = x.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, "#3b7ec9");
  gr.addColorStop(1, "#27598f");
  x.fillStyle = gr;
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    x.strokeStyle = `rgba(${rnd(i) > 0.5 ? "255,255,255" : "0,0,40"},${0.05 + rnd(i + 1) * 0.1})`;
    x.lineWidth = 2 + rnd(i + 2) * 4;
    x.beginPath();
    x.moveTo(rnd(i + 3) * w, 0);
    x.quadraticCurveTo(rnd(i + 4) * w, h / 2, rnd(i + 5) * w, h);
    x.stroke();
  }
  [[18, 18], [w - 18, 18], [18, h - 18], [w - 18, h - 18]].forEach(([a, b]) => {
    x.fillStyle = "#d8dde2";
    x.beginPath();
    x.arc(a, b, 9, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "#111";
    x.beginPath();
    x.arc(a, b, 4, 0, Math.PI * 2);
    x.fill();
  });
  pintura(x, txt, w / 2, h * 0.5, 460, color);
}

function dibujarInterior(x: CanvasRenderingContext2D, w: number, h: number) {
  x.fillStyle = "#3a2c20";
  x.fillRect(0, 0, w, h);
  const col = ["#e24a4a", "#f5a524", "#4aa3e2", "#c75ad8", "#5fd39a", "#f4efe2"];
  for (let s = 0; s < 5; s++) {
    const y = 90 + s * 120;
    x.fillStyle = "#6a4a2c";
    x.fillRect(0, y + 78, w, 12);
    for (let k = 0; k < 8; k++) {
      x.fillStyle = col[(s * 3 + k) % 6];
      const bw = 18 + rnd(s * 9 + k) * 12, bh = 34 + rnd(s * 5 + k) * 36;
      x.fillRect(8 + k * 31, y + 78 - bh, bw, bh);
    }
  }
}

/**
 * Persiana de chapa: se enrolla hacia arriba escondiéndose detrás del cajón. `abre` va de 0 (cerrada) a 1 (toda arriba).
 * `modo`: "3" | "2" | "1" número pintado, "msg" el mensaje del error uno, "?" persiana tapada. La lona cuelga delante.
 */
export const Persiana: React.FC<{ x: number; abre: number; modo: "3" | "2" | "1" | "msg" | "?"; lona?: "1" | "?" | null; tearP?: number; luz?: string; luzInt?: number; golpe?: number; t: number; listo: boolean; y?: number }> = ({
  x, abre, modo, lona = null, tearP = 0, luz = "#ffcf7a", luzInt = 0.5, golpe = 0, t, listo, y = 0,
}) => {
  const tex = useTex(`pers-${modo}`, 256, 640, (c, w, h) => {
    if (modo === "msg") dibujarMensaje(c, w, h);
    else if (modo === "?") dibujarNumero(c, w, h, "?", "#FFB703");
    else dibujarNumero(c, w, h, modo, modo === "3" ? "#FF4D5A" : modo === "2" ? "#FFB703" : "#ffffff");
  }, listo);
  const texLona = useTex(`lona-${lona}`, 256, 640, (c, w, h) => dibujarLona(c, w, h, lona === "?" ? "?" : "1", lona === "?" ? "#FFB703" : "#ffffff"), listo);
  const texInt = useTex("interior", 256, 640, dibujarInterior, listo);
  const p = tearP;
  return (
    <group position={[x, y, 0]}>
      {/* interior del local */}
      <mesh position={[0, ALTO / 2, -0.76]}>
        <planeGeometry args={[ANCHO, ALTO]} />
        <meshStandardMaterial map={texInt} emissiveMap={texInt} emissive={luz} emissiveIntensity={luzInt} roughness={1} />
      </mesh>
      {/* chapa que sube */}
      <mesh position={[0, ALTO / 2 + abre * ALTO - golpe * 0.04, 0.04]} castShadow>
        <planeGeometry args={[ANCHO - 0.02, ALTO]} />
        <meshStandardMaterial map={tex} roughness={0.55} metalness={0.35} />
      </mesh>
      {/* cajón de la persiana */}
      <mesh position={[0, ALTO + 0.28, 0.1]} castShadow>
        <boxGeometry args={[ANCHO + 0.1, 0.56, 0.4]} />
        <meshStandardMaterial color="#4a5157" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* lona colgada */}
      {lona && p < 0.995 ? (
        <mesh
          position={[p * 1.8, ALTO / 2 + p * 2.2 - p * p * 3 + Math.sin(t * 1.7) * 0.01, 0.26 + p * 7]}
          rotation={[p * 1.2, p * 2.0, Math.sin(t * 2.2 + x) * 0.012 + p * 3.2]}
          scale={1 + p * 0.3}
          castShadow
        >
          <planeGeometry args={[ANCHO + 0.1, ALTO + 0.1]} />
          <meshStandardMaterial map={texLona} roughness={0.85} side={2} />
        </mesh>
      ) : null}
    </group>
  );
};

/** Fachada: lintel, pilares entre las aberturas y vereda. */
export const Fachada: React.FC = () => {
  const pilares = [-2.55, -0.85, 0.85, 2.55];
  return (
    <group>
      <mesh position={[1.7, 5.4, -0.4]} receiveShadow castShadow>
        <boxGeometry args={[22, 3.4, 0.8]} />
        <meshStandardMaterial color="#6e6a63" roughness={1} />
      </mesh>
      <mesh position={[-7, 3.0, -0.4]} receiveShadow castShadow>
        <boxGeometry args={[9, 6.0, 0.8]} />
        <meshStandardMaterial color="#6e6a63" roughness={1} />
      </mesh>
      <mesh position={[10.5, 3.0, -0.4]} receiveShadow castShadow>
        <boxGeometry args={[12, 6.0, 0.8]} />
        <meshStandardMaterial color="#6e6a63" roughness={1} />
      </mesh>
      {[...pilares, 4.25].map((px, i) => (
        <mesh key={i} position={[px, 1.9, -0.4]} receiveShadow castShadow>
          <boxGeometry args={[0.2, 3.8, 0.8]} />
          <meshStandardMaterial color="#77726a" roughness={1} />
        </mesh>
      ))}
      {/* vereda y calle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 3]} receiveShadow>
        <planeGeometry args={[40, 12]} />
        <meshStandardMaterial color="#8a8a86" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 14]} receiveShadow>
        <planeGeometry args={[40, 14]} />
        <meshStandardMaterial color="#25282c" roughness={0.9} />
      </mesh>
    </group>
  );
};

