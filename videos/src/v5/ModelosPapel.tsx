import React, { useMemo } from "react";
import * as THREE from "three";
import { clamp, eOut, rnd } from "../lib/anim";

// Mundo de papel del video V5-01 ("Confesiones de un cuaderno de fiados"): pasillo de páginas y el abanico "FUI YO".
// Todo determinista: texturas de canvas y posiciones que salen del tiempo.

const MARK = "'Permanent Marker', cursive";
const FECHAS = ["12/03/2015", "03/07/2016", "21/11/2017", "08/02/2019", "30/09/2020", "14/05/2022", "02/12/2023", "19/08/2025"];

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

/** Hoja cuadriculada con mancha de café, fecha vieja escrita con birome y esquina doblada. */
function dibujarHoja(x: CanvasRenderingContext2D, w: number, h: number, v: number) {
  x.fillStyle = "#F4EBD3";
  x.fillRect(0, 0, w, h);
  x.strokeStyle = "#a9c0dd";
  x.lineWidth = 2;
  for (let i = 0; i <= w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
  for (let j = 0; j <= h; j += 32) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); }
  // mancha de café
  const cx = 90 + ((v * 151) % 300), cy = 120 + ((v * 223) % 420);
  const gr = x.createRadialGradient(cx, cy, 20, cx, cy, 92);
  gr.addColorStop(0, "#7a4a1a00");
  gr.addColorStop(0.78, "#7a4a1a55");
  gr.addColorStop(0.9, "#5a3410aa");
  gr.addColorStop(1, "#5a341000");
  x.fillStyle = gr;
  x.beginPath();
  x.arc(cx, cy, 94, 0, Math.PI * 2);
  x.fill();
  // fecha vieja y rayas de anotaciones
  x.save();
  x.translate(60, 90 + ((v * 53) % 90));
  x.rotate(-0.04 + v * 0.015);
  x.fillStyle = "#1f3fbf";
  x.font = `400 46px ${MARK}`;
  x.fillText(FECHAS[v % FECHAS.length], 0, 0);
  x.font = `400 38px ${MARK}`;
  x.fillText("Marta  18.000", 0, 66);
  x.fillText("Juan    7.500", 0, 118);
  x.restore();
  // esquina doblada
  x.fillStyle = "#cdbb90";
  x.beginPath();
  x.moveTo(w, h - 130);
  x.lineTo(w - 130, h);
  x.lineTo(w, h);
  x.closePath();
  x.fill();
}

/** Pasillo de papel: hojas paradas a los dos lados, abiertas en V, que se pierden en la distancia. */
export const Pasillo: React.FC<{ listo: boolean }> = ({ listo }) => {
  const texs = [0, 1, 2, 3].map((v) => useTex("hoja" + v, 512, 704, (x, w, h) => dibujarHoja(x, w, h, v), listo)); // eslint-disable-line react-hooks/rules-of-hooks
  const hojas: React.ReactNode[] = [];
  for (let j = 0; j < 18; j++) {
    for (const lado of [-1, 1]) {
      const z = 3 - j * 1.55 + (lado > 0 ? 0.5 : 0);
      const alto = 4.2 + rnd(j * 3 + lado) * 0.8;
      hojas.push(
        <mesh key={`${j}-${lado}`} position={[lado * (2.15 + rnd(j + 40) * 0.25), alto / 2 - 0.2, z]} rotation={[0, -lado * (0.5 + rnd(j + 7) * 0.15), (rnd(j * 5 + lado) - 0.5) * 0.12]} castShadow>
          <planeGeometry args={[3.0, alto]} />
          <meshStandardMaterial map={texs[(j + (lado > 0 ? 1 : 0)) % 4]} side={THREE.DoubleSide} roughness={0.95} />
        </mesh>,
      );
    }
  }
  return (
    <group>
      {/* piso de madera del mostrador */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, -10]} receiveShadow>
        <planeGeometry args={[14, 50]} />
        <meshStandardMaterial color="#6b4325" roughness={0.9} />
      </mesh>
      {hojas}
    </group>
  );
};

/** Texto "FUI YO" a hoja completa (cuadrado): FUI arriba, YO abajo, en marcador rojo sobre papel. */
function dibujarFuiYo(x: CanvasRenderingContext2D, w: number, h: number) {
  x.fillStyle = "#F4EBD3";
  x.fillRect(0, 0, w, h);
  x.strokeStyle = "#a9c0dd";
  x.lineWidth = 3;
  for (let j = 80; j < h; j += 64) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); }
  x.fillStyle = "#FF2D3B";
  x.shadowColor = "#7a0010";
  x.shadowBlur = 10;
  x.textAlign = "center";
  x.textBaseline = "alphabetic";
  x.font = `400 470px ${MARK}`;
  x.fillText("FUI", w / 2, h * 0.47);
  x.fillText("YO", w / 2, h * 0.93);
}

const N = 26;
const ANCHO = 4.0;
const ALTO = 4.0;

/**
 * Abanico: N hojas paradas de canto (como los bordes de un libro visto de frente) que giran sobre su borde izquierdo
 * y, al quedar de frente, forman "FUI YO". `p` va de 0 a 1.
 */
export const AbanicoFuiYo: React.FC<{ p: number; listo: boolean }> = ({ p, listo }) => {
  const base = useTex("fuiyo", 1024, 1024, dibujarFuiYo, listo);
  const cortes = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        const tx = base.clone();
        tx.repeat.set(1 / N, 1);
        tx.offset.set(i / N, 0);
        tx.needsUpdate = true;
        return tx;
      }),
    [base],
  );
  const w = ANCHO / N;
  return (
    <group position={[0, ALTO / 2 + 0.1, 0]}>
      {cortes.map((tx, i) => {
        const pi = eOut(clamp(p * 1.7 - (i / N) * 0.7, 0, 1));
        const ang = (1 - pi) * (Math.PI / 2 - 0.02);
        const x0 = -ANCHO / 2 + i * w;
        return (
          <group key={i} position={[x0, 0, 0]} rotation={[0, ang, 0]}>
            <mesh position={[w / 2, 0, 0]} castShadow>
              <boxGeometry args={[w * 0.998, ALTO, 0.035]} />
              <meshStandardMaterial attach="material-0" color="#e6d9b6" />
              <meshStandardMaterial attach="material-1" color="#e6d9b6" />
              <meshStandardMaterial attach="material-2" color="#e6d9b6" />
              <meshStandardMaterial attach="material-3" color="#e6d9b6" />
              <meshStandardMaterial attach="material-4" map={tx} roughness={0.9} />
              <meshStandardMaterial attach="material-5" color="#d9ccaa" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
