import React, { useMemo } from "react";
import * as THREE from "three";

// Modelos del video 02 ("Sos el banco del barrio"): cuaderno de fiados, banco con bóveda, casitas,
// productos, monedas, papelitos y carteles. Todo hecho en código y determinista.

type V3 = [number, number, number];

/** Textura dibujada en un canvas. `listo` fuerza a redibujar cuando cargaron las fuentes. */
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

const B: React.FC<{ p: V3; s: V3; c: string; r?: V3; m?: number; ro?: number; e?: string; ei?: number; sombra?: boolean }> = ({ p, s, c, r, m = 0, ro = 0.7, e, ei = 0, sombra = true }) => (
  <mesh position={p} rotation={r} castShadow={sombra} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} metalness={m} roughness={ro} emissive={e ?? "#000"} emissiveIntensity={ei} />
  </mesh>
);

const DISP = "'Space Grotesk', 'DejaVu Sans', sans-serif";
const MARK = "'Permanent Marker', cursive";

// ---------- Cuaderno de fiados ----------
const IZQ = ["FIADOS", "Marta   18.000", "Juan     7.500", "Rosa    12.300", "Pedro    4.200", "Gaseos   ¿?", "Luz        ..."];
const DER = ["Don Raúl  9.800", "La Nené   5.600", "Fulano    ¿?", "“te pago el", " viernes”", "Marta otra vez", "..."];

function pagina(x: CanvasRenderingContext2D, w: number, h: number, lineas: string[], primeraGrande: boolean) {
  x.fillStyle = "#F4EBD3";
  x.fillRect(0, 0, w, h);
  x.strokeStyle = "#9FB6D6";
  x.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    x.beginPath();
    x.moveTo(0, 110 + i * 86);
    x.lineTo(w, 110 + i * 86);
    x.stroke();
  }
  x.strokeStyle = "#e29a9a";
  x.beginPath();
  x.moveTo(60, 0);
  x.lineTo(60, h);
  x.stroke();
  x.fillStyle = "#2C3E70";
  x.textBaseline = "alphabetic";
  lineas.forEach((l, i) => {
    x.font = i === 0 && primeraGrande ? `400 84px ${MARK}` : `400 54px ${MARK}`;
    x.fillText(l, 80, 100 + i * 86 - (i === 0 && primeraGrande ? 0 : 2));
  });
  // tachón rojo
  x.strokeStyle = "#C1121F";
  x.lineWidth = 7;
  x.beginPath();
  x.moveTo(250, 330);
  x.lineTo(470, 312);
  x.stroke();
}

export const Cuaderno3D: React.FC<{ listo: boolean }> = ({ listo }) => {
  const izq = useTex("cuad-i", 512, 740, (x, w, h) => pagina(x, w, h, IZQ, true), listo);
  const der = useTex("cuad-d", 512, 740, (x, w, h) => pagina(x, w, h, DER, false), listo);
  return (
    <group>
      <mesh position={[0, 0, -0.07]} castShadow receiveShadow>
        <boxGeometry args={[3.95, 2.85, 0.1]} />
        <meshStandardMaterial color="#2C4A8C" roughness={0.6} />
      </mesh>
      {[-1, 1].map((lado) => (
        <group key={lado} position={[lado * 0.92, 0, 0]} rotation={[0, -lado * 0.05, lado * 0.01]}>
          <B p={[0, 0, 0]} s={[1.82, 2.64, 0.06]} c="#EADFC2" />
          <mesh position={[0, 0, 0.032]}>
            <planeGeometry args={[1.8, 2.6]} />
            <meshStandardMaterial map={lado < 0 ? izq : der} roughness={0.9} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[0, -1.15 + i * 0.255, 0.04]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[0.075, 0.016, 8, 16]} />
          <meshStandardMaterial color="#444" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
};

// ---------- Banco con bóveda ----------
function usePediment() {
  return useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-3.9, 0);
    sh.lineTo(3.9, 0);
    sh.lineTo(0, 1.25);
    sh.closePath();
    return new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false });
  }, []);
}

export const Banco: React.FC<{ abre: number; brillo: number; listo: boolean }> = ({ abre, brillo, listo }) => {
  const placa = useTex("placa", 2048, 240, (x, w, h) => {
    x.fillStyle = "#0f3b24";
    x.fillRect(0, 0, w, h);
    x.strokeStyle = "#E9B949";
    x.lineWidth = 8;
    x.strokeRect(14, 14, w - 28, h - 28);
    x.font = `700 150px ${DISP}`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    (x as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "10px";
    x.shadowColor = "#FFB703";
    x.shadowBlur = 26;
    x.fillStyle = "#F7C948";
    x.fillText("BANCO DEL BARRIO", w / 2, h / 2 + 8);
  }, listo);
  const ped = usePediment();
  const rad = -abre * 1.9;
  const CREMA = "#E7DCC3";
  return (
    <group>
      {/* escalones */}
      <B p={[0, 0.1, 1.2]} s={[8.4, 0.2, 3.4]} c="#b9b2a2" />
      <B p={[0, 0.3, 1.0]} s={[7.8, 0.2, 2.8]} c="#cfc7b4" />
      {/* pared del fondo */}
      <B p={[0, 2.1, -0.1]} s={[7.6, 3.4, 0.5]} c={CREMA} />
      {/* columnas */}
      {[-3.0, -1.85, 1.85, 3.0].map((x) => (
        <group key={x} position={[x, 0, 1.3]}>
          <B p={[0, 0.5, 0]} s={[0.75, 0.2, 0.75]} c="#d9d1bd" />
          <mesh position={[0, 1.95, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.27, 0.3, 3.0, 20]} />
            <meshStandardMaterial color="#F2EAD5" roughness={0.6} />
          </mesh>
          <B p={[0, 3.5, 0]} s={[0.75, 0.2, 0.75]} c="#d9d1bd" />
        </group>
      ))}
      {/* friso con el cartel */}
      <B p={[0, 3.95, 0.8]} s={[8.2, 0.95, 1.9]} c="#d6cdb7" />
      <mesh position={[0, 3.95, 1.77]}>
        <planeGeometry args={[7.4, 0.86]} />
        <meshBasicMaterial map={placa} toneMapped={false} />
      </mesh>
      {/* frontón */}
      <mesh geometry={ped} position={[0, 4.42, -0.0]} castShadow receiveShadow>
        <meshStandardMaterial color="#EFE6CF" roughness={0.7} />
      </mesh>
      {/* bóveda: hueco, resplandor de adentro y puerta redonda con bisagra a la izquierda */}
      <mesh position={[0, 1.9, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 0.3, 40]} />
        <meshStandardMaterial color="#0b0b0b" roughness={1} />
      </mesh>
      <mesh position={[0, 1.9, 0.34]}>
        <circleGeometry args={[0.98, 40]} />
        <meshBasicMaterial color="#FFB703" transparent opacity={brillo * 0.9} toneMapped={false} />
      </mesh>
      {brillo > 0.02 ? <pointLight position={[0, 1.9, 1.6]} intensity={9 * brillo} distance={7} color="#ffcf7a" /> : null}
      <mesh position={[0, 1.9, 0.4]}>
        <torusGeometry args={[1.08, 0.13, 14, 48]} />
        <meshStandardMaterial color="#7d868d" metalness={0.9} roughness={0.3} />
      </mesh>
      <group position={[-1.08, 1.9, 0.46]} rotation={[0, rad, 0]}>
        <group position={[1.08, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[1.0, 1.0, 0.22, 40]} />
            <meshStandardMaterial color="#9aa3ab" metalness={0.9} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.72, 0.72, 0.04, 36]} />
            <meshStandardMaterial color="#6f7880" metalness={0.9} roughness={0.35} />
          </mesh>
          {/* rueda de la bóveda */}
          <mesh position={[0, 0, 0.22]} rotation={[0, 0, abre * 4]}>
            <torusGeometry args={[0.27, 0.035, 8, 24]} />
            <meshStandardMaterial color="#E9B949" metalness={0.8} roughness={0.3} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} position={[0, 0, 0.22]} rotation={[0, 0, abre * 4 + (i * Math.PI) / 3]}>
              <boxGeometry args={[0.7, 0.05, 0.05]} />
              <meshStandardMaterial color="#E9B949" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
          <mesh position={[0, 0, 0.22]}>
            <sphereGeometry args={[0.08, 12, 10]} />
            <meshStandardMaterial color="#E9B949" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// ---------- Casitas del barrio ----------
const PASTEL = ["#F4A261", "#8ecae6", "#E9C46A", "#b5e48c", "#f28482", "#cdb4db"];
export const Casita: React.FC<{ position: V3; i: number; pulso?: number }> = ({ position, i, pulso = 0 }) => (
  <group position={position} scale={0.8 + pulso * 0.1}>
    <B p={[0, 0.5, 0]} s={[1.15, 1.0, 1.0]} c={PASTEL[i % PASTEL.length]} />
    <mesh position={[0, 1.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[0.98, 0.65, 4]} />
      <meshStandardMaterial color="#9c4a3a" roughness={0.8} />
    </mesh>
    <B p={[0, 0.32, 0.51]} s={[0.28, 0.6, 0.04]} c="#5a3a22" />
    <B p={[-0.34, 0.62, 0.51]} s={[0.22, 0.22, 0.04]} c="#ffe08a" e="#ffe08a" ei={0.7} sombra={false} />
    <B p={[0.34, 0.62, 0.51]} s={[0.22, 0.22, 0.04]} c="#ffe08a" e="#ffe08a" ei={0.7} sombra={false} />
  </group>
);

// ---------- Productos que salen de la bóveda ----------
export const Producto: React.FC<{ tipo: number; position: V3; rot: V3 }> = ({ tipo, position, rot }) => {
  const k = tipo % 3;
  return (
    <group position={position} rotation={rot} scale={1.5}>
      {k === 0 ? (
        <>
          <B p={[0, 0, 0]} s={[0.2, 0.34, 0.16]} c="#f4f4f4" sombra={false} />
          <B p={[0, 0.07, 0.085]} s={[0.2, 0.12, 0.01]} c="#3A86FF" sombra={false} />
        </>
      ) : k === 1 ? (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.07, 0.3, 4, 10]} />
          <meshStandardMaterial color="#D9A55B" roughness={0.8} />
        </mesh>
      ) : (
        <>
          <B p={[0, 0, 0]} s={[0.2, 0.28, 0.07]} c="#C1121F" sombra={false} />
          <B p={[0, 0.03, 0.04]} s={[0.2, 0.08, 0.01]} c="#fff" sombra={false} />
        </>
      )}
    </group>
  );
};

export const Moneda: React.FC<{ position: V3; giro: number }> = ({ position, giro }) => (
  <mesh position={position} rotation={[Math.PI / 2 + Math.sin(giro) * 0.5, giro, 0]} scale={1.6} castShadow>
    <cylinderGeometry args={[0.14, 0.14, 0.035, 18]} />
    <meshStandardMaterial color="#F7C948" metalness={0.9} roughness={0.25} emissive="#FFB703" emissiveIntensity={0.35} />
  </mesh>
);

// ---------- Papelitos y montón ----------
export const Papelito: React.FC<{ position: V3; rot: V3; listo: boolean }> = ({ position, rot, listo }) => {
  const tx = useTex("papelito", 256, 180, (x, w, h) => {
    x.fillStyle = "#F7F1DC";
    x.fillRect(0, 0, w, h);
    x.strokeStyle = "#c9bf9e";
    x.lineWidth = 4;
    x.strokeRect(2, 2, w - 4, h - 4);
    x.fillStyle = "#2C3E70";
    x.font = `400 42px ${MARK}`;
    x.textAlign = "center";
    x.fillText("te pago", w / 2, 72);
    x.fillText("el viernes", w / 2, 124);
  }, listo);
  return (
    <mesh position={position} rotation={rot} castShadow>
      <planeGeometry args={[0.62, 0.44]} />
      <meshStandardMaterial map={tx} side={THREE.DoubleSide} roughness={0.95} />
    </mesh>
  );
};

export const MontonPapel: React.FC<{ k: number; listo: boolean }> = ({ k, listo }) => {
  const tx = useTex("monton", 512, 512, (x, w, h) => {
    x.fillStyle = "#EFE6CC";
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const px = (i * 97) % w, py = (i * 61) % h;
      x.save();
      x.translate(px, py);
      x.rotate(((i * 37) % 60) / 20 - 1.5);
      x.fillStyle = i % 3 ? "#F7F1DC" : "#E3D8B8";
      x.fillRect(-46, -32, 92, 64);
      x.strokeStyle = "#bfb38f";
      x.lineWidth = 2;
      x.strokeRect(-46, -32, 92, 64);
      x.fillStyle = "#2C3E70";
      x.font = `400 16px ${MARK}`;
      x.fillText("te pago", -34, -4);
      x.fillText("el viernes", -38, 18);
      x.restore();
    }
  }, listo);
  const s = Math.max(0.001, k);
  return (
    <mesh position={[0, 0.2, 1.9]} scale={[3.5 * Math.sqrt(s), 3.1 * s, 1.8 * Math.sqrt(s)]} castShadow receiveShadow>
      <sphereGeometry args={[1, 28, 16]} />
      <meshStandardMaterial map={tx} roughness={1} />
    </mesh>
  );
};

// ---------- Carteles BANCO vs VOS ----------
export const Cartel3D: React.FC<{ tipo: "banco" | "vos"; position: V3; rotY: number; escala: number; listo: boolean }> = ({ tipo, position, rotY, escala, listo }) => {
  const banco = tipo === "banco";
  const tx = useTex("cartel-" + tipo, 512, 640, (x, w, h) => {
    x.fillStyle = banco ? "#232a38" : "#1B4332";
    x.fillRect(0, 0, w, h);
    x.strokeStyle = banco ? "#8a94a3" : "#FFB703";
    x.lineWidth = 14;
    x.strokeRect(10, 10, w - 20, h - 20);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.shadowColor = "#0008";
    x.shadowBlur = 10;
    if (banco) {
      x.fillStyle = "#c9d3e3";
      x.font = `700 118px ${DISP}`;
      x.fillText("BANCO", w / 2, 150);
      x.fillStyle = "#ff6b6b";
      x.font = `700 70px ${DISP}`;
      x.fillText("TE COBRA", w / 2, 300);
      x.font = `700 92px ${DISP}`;
      x.fillText("INTERÉS", w / 2, 400);
      x.fillStyle = "#8a94a3";
      x.font = `700 90px ${DISP}`;
      x.fillText("$ $ $", w / 2, 530);
    } else {
      x.fillStyle = "#FFB703";
      x.font = `700 118px ${DISP}`;
      x.fillText("VOS", w / 2, 150);
      x.fillStyle = "#ffffff";
      x.font = `700 230px ${DISP}`;
      x.fillText("0%", w / 2, 340);
      x.fillStyle = "#5FD39A";
      x.font = `700 68px ${DISP}`;
      x.fillText("de interés", w / 2, 500);
    }
  }, listo);
  const e = Math.max(0.001, escala);
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={e}>
      <B p={[-0.9, 0.6, -0.05]} s={[0.12, 1.2, 0.12]} c="#555" />
      <B p={[0.9, 0.6, -0.05]} s={[0.12, 1.2, 0.12]} c="#555" />
      <B p={[0, 2.2, 0]} s={[2.4, 3.0, 0.1]} c="#222" />
      <mesh position={[0, 2.2, 0.06]}>
        <planeGeometry args={[2.3, 2.9]} />
        <meshBasicMaterial map={tx} toneMapped={false} />
      </mesh>
    </group>
  );
};
