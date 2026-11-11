import React, { useMemo } from "react";
import * as THREE from "three";

// Modelos low-poly hechos en código (nada descargado). Medidas en metros "de juguete".
// Todo depende solo de las props: deterministas cuadro a cuadro.

const M: React.FC<{ c: string; e?: string; ei?: number; r?: number; m?: number }> = ({ c, e, ei = 0, r = 0.7, m = 0 }) => (
  <meshStandardMaterial color={c} emissive={e ?? "#000"} emissiveIntensity={ei} roughness={r} metalness={m} />
);

type V3 = [number, number, number];
const Caja: React.FC<{ p: V3; s: V3; c: string; rot?: V3; e?: string; ei?: number; sombra?: boolean; r?: number; m?: number }> = ({ p, s, c, rot, e, ei, sombra = true, r, m }) => (
  <mesh position={p} rotation={rot} castShadow={sombra} receiveShadow>
    <boxGeometry args={s} />
    <M c={c} e={e} ei={ei} r={r} m={m} />
  </mesh>
);

/** Textura de texto dibujada en un canvas (para carteles). */
export function useTexturaTexto(texto: string, opts: { w?: number; h?: number; font?: string; color?: string; fondo?: string; glow?: string; listo?: boolean }) {
  const { w = 1024, h = 160, font = "700 104px 'Space Grotesk', 'DejaVu Sans', sans-serif", color = "#FFB703", fondo = "#141414", glow, listo } = opts;
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const x = cv.getContext("2d")!;
    x.fillStyle = fondo;
    x.fillRect(0, 0, w, h);
    x.font = font;
    x.textAlign = "center";
    x.textBaseline = "middle";
    if (glow) {
      x.shadowColor = glow;
      x.shadowBlur = 28;
    }
    x.fillStyle = color;
    x.fillText(texto, w / 2, h / 2 + 4);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 4;
    return tx;
    // `listo` fuerza a redibujar cuando cargan las fuentes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, w, h, font, color, fondo, glow, listo]);
}

function useTexturaPersiana() {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 64;
    cv.height = 64;
    const x = cv.getContext("2d")!;
    x.fillStyle = "#a3aaaf";
    x.fillRect(0, 0, 64, 64);
    x.fillStyle = "#9aa1a6";
    x.fillRect(0, 10, 64, 34);
    x.fillStyle = "#666d72";
    x.fillRect(0, 48, 64, 16);
    const tx = new THREE.CanvasTexture(cv);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }, []);
}

const COLS = ["#E63946", "#FFB703", "#2A9D8F", "#F4A261", "#8E44AD", "#3A86FF", "#FB5607", "#06D6A0"];

/** Kiosco 3D de frente. Origen: centro del piso, frente mirando a +z. */
export const Kiosco3D: React.FC<{ persiana: number; luz: number; fuentesListas: boolean; position?: V3; billete?: React.ReactNode }> = ({ persiana, luz, fuentesListas, position = [0, 0, 0] }) => {
  const cartel = useTexturaTexto("KIOSCO · ALMACÉN", { color: luz > 0.5 ? "#FFB703" : "#5a4a20", glow: luz > 0.5 ? "#FFB703" : undefined, listo: fuentesListas });
  const pers = useTexturaPersiana();
  const hP = 2.0 * persiana;
  pers.repeat.set(1, Math.max(0.01, hP / 0.16));
  const productos: React.ReactNode[] = [];
  for (let s = 0; s < 3; s++) {
    for (let i = 0; i < 7; i++) {
      const h = 0.22 + ((i * 7 + s * 3) % 4) * 0.05;
      productos.push(<Caja key={`${s}-${i}`} p={[-1.38 + i * 0.27, 1.15 + s * 0.58 + h / 2, 1.05]} s={[0.2, h, 0.14]} c={COLS[(i + s * 3) % COLS.length]} sombra={false} e={COLS[(i + s * 3) % COLS.length]} ei={0.15 * luz} />);
    }
    productos.push(<Caja key={"e" + s} p={[-0.57, 1.12 + s * 0.58, 1.02]} s={[2.0, 0.05, 0.3]} c="#6b4325" sombra={false} />);
  }
  return (
    <group position={position}>
      {/* cuerpo */}
      <Caja p={[0, 1.7, 0]} s={[4, 3.4, 2]} c="#B9A586" />
      {/* zócalo */}
      <Caja p={[0, 0.12, 1.01]} s={[4, 0.24, 0.04]} c="#7d6a50" />
      {/* cartel */}
      <Caja p={[0, 3.72, 1.02]} s={[3.5, 0.62, 0.12]} c="#111" />
      <mesh position={[0, 3.72, 1.09]}>
        <planeGeometry args={[3.4, 0.53]} />
        <meshBasicMaterial map={cartel} toneMapped={false} />
      </mesh>
      {/* toldo rayado */}
      {Array.from({ length: 10 }, (_, i) => (
        <Caja key={i} p={[-1.8 + i * 0.4, 3.13, 1.35]} rot={[0.5, 0, 0]} s={[0.4, 0.06, 0.85]} c={i % 2 ? "#F2F2EA" : "#1B7A43"} />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={"b" + i} position={[-1.8 + i * 0.4, 2.88, 1.72]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.05, 16, 1, false, 0, Math.PI]} />
          <M c={i % 2 ? "#F2F2EA" : "#1B7A43"} />
        </mesh>
      ))}
      {/* vidriera */}
      <Caja p={[0, 1.95, 1.0]} s={[3.3, 2.05, 0.06]} c="#3b3b3b" />
      <Caja p={[0, 1.95, 1.02]} s={[3.1, 1.9, 0.04]} c="#1a140f" e="#ffcf7a" ei={0.12 * luz} sombra={false} />
      {productos}
      {/* heladera */}
      <Caja p={[1.0, 1.9, 1.06]} s={[0.85, 1.7, 0.12]} c="#B5121B" e="#B5121B" ei={0.15 * luz} sombra={false} />
      <Caja p={[1.0, 1.82, 1.13]} s={[0.66, 1.35, 0.02]} c="#bfe9ff" e="#bfe9ff" ei={0.55 * luz + 0.05} sombra={false} />
      {Array.from({ length: 12 }, (_, i) => (
        <Caja key={"bt" + i} p={[0.8 + (i % 4) * 0.13, 1.3 + Math.floor(i / 4) * 0.42, 1.15]} s={[0.07, 0.3, 0.03]} c={i % 2 ? "#151515" : "#8e1010"} sombra={false} />
      ))}
      {/* persiana: baja desde arriba */}
      {persiana > 0.005 ? (
        <group>
          <mesh position={[0, 2.88 - hP / 2, 1.16]} castShadow>
            <boxGeometry args={[3.12, hP, 0.04]} />
            <meshStandardMaterial map={pers} roughness={0.5} metalness={0.4} />
          </mesh>
          <Caja p={[0, 2.88 - hP, 1.18]} s={[3.14, 0.08, 0.06]} c="#444" />
        </group>
      ) : null}
      <Caja p={[0, 2.95, 1.16]} s={[3.2, 0.14, 0.12]} c="#555" />
      {/* mostrador */}
      <Caja p={[0, 0.5, 1.35]} s={[3.6, 1.0, 0.6]} c="#8a5a33" />
      <Caja p={[0, 1.02, 1.35]} s={[3.7, 0.06, 0.7]} c="#a87347" />
      <Caja p={[-0.9, 1.1, 1.4]} s={[0.4, 0.06, 0.3]} c="#2C4A8C" rot={[0, 0.2, 0]} />
      <Caja p={[1.15, 1.22, 1.35]} s={[0.55, 0.3, 0.35]} c="#3a3a3a" />
      <Caja p={[1.15, 1.3, 1.53]} s={[0.4, 0.1, 0.01]} c="#8fd18f" e="#8fd18f" ei={0.6} sombra={false} />
      {/* luz cálida de adentro */}
      <pointLight position={[0, 2.3, 1.9]} intensity={6 * luz} distance={6} color="#ffcf7a" />
    </group>
  );
};

/** Podio que crece desde el piso. */
export const Podio: React.FC<{ x: number; z?: number; alto: number; color: string; borde: string }> = ({ x, z = 0, alto, color, borde }) => {
  const h = Math.max(0.02, alto);
  return (
    <group position={[x, 0, z]}>
      <Caja p={[0, h / 2, 0]} s={[1.5, h, 1.5]} c={color} r={0.4} />
      <Caja p={[0, h + 0.03, 0]} s={[1.6, 0.06, 1.6]} c={borde} r={0.3} m={0.3} />
      <Caja p={[0, h - 0.18, 0.76]} s={[1.52, 0.06, 0.02]} c={borde} e={borde} ei={0.4} sombra={false} />
    </group>
  );
};

export type Pose = {
  /** 0 parado, 1 recostado en reposera */
  recostado?: number;
  /** ángulo de los brazos (rad) a cada lado; positivo = adelante/arriba */
  brazoI?: number;
  brazoD?: number;
  /** salto vertical */
  salto?: number;
  lentes?: boolean;
  /** caída: giro y desplazamiento */
  caida?: number;
};

/** Muñeco low-poly. tipo "duenio": traje y llave; "kiosquero": camisa y delantal. */
export const Muneco: React.FC<{ tipo: "duenio" | "kiosquero"; pose: Pose; position: V3; rotY?: number }> = ({ tipo, pose, position, rotY = 0 }) => {
  const { recostado = 0, brazoI = 0, brazoD = 0, salto = 0, lentes = false, caida = 0 } = pose;
  const traje = tipo === "duenio";
  const torso = traje ? "#1d2a4a" : "#9cc3e8";
  const piernas = traje ? "#17213b" : "#3d4b63";
  const piel = "#e8b48a";
  // recostado: el torso se inclina hacia atrás desde la cadera y las piernas van adelante
  const incl = -1.15 * recostado;
  const pier = -1.4 * recostado;
  return (
    <group position={[position[0] + caida * 1.6, position[1] + salto - caida * caida * 3.2, position[2] + caida * 0.4]} rotation={[0, rotY, -caida * 2.2]}>
      {/* piernas */}
      <group position={[0, 0.62, 0]} rotation={[pier, 0, 0]}>
        <Caja p={[-0.1, -0.31, 0]} s={[0.16, 0.62, 0.18]} c={piernas} />
        <Caja p={[0.1, -0.31, 0]} s={[0.16, 0.62, 0.18]} c={piernas} />
        <Caja p={[-0.1, -0.64, 0.05]} s={[0.17, 0.08, 0.28]} c="#111" />
        <Caja p={[0.1, -0.64, 0.05]} s={[0.17, 0.08, 0.28]} c="#111" />
      </group>
      {/* torso y cabeza giran juntos desde la cadera */}
      <group position={[0, 0.62, 0]} rotation={[incl, 0, 0]}>
        <Caja p={[0, 0.3, 0]} s={[0.46, 0.6, 0.26]} c={torso} />
        {traje ? (
          <>
            <Caja p={[0, 0.42, 0.135]} s={[0.12, 0.34, 0.01]} c="#ffffff" sombra={false} />
            <Caja p={[0, 0.38, 0.145]} s={[0.06, 0.3, 0.01]} c="#C1121F" sombra={false} />
          </>
        ) : (
          <>
            <Caja p={[0, 0.2, 0.14]} s={[0.4, 0.46, 0.02]} c="#1B7A43" />
            <Caja p={[0, 0.2, 0.152]} s={[0.16, 0.1, 0.01]} c="#F2F2EA" sombra={false} />
          </>
        )}
        {/* cabeza */}
        <mesh position={[0, 0.78, 0]} castShadow>
          <sphereGeometry args={[0.17, 20, 16]} />
          <M c={piel} r={0.8} />
        </mesh>
        <Caja p={[0, 0.9, -0.02]} s={[0.3, 0.08, 0.3]} c={traje ? "#2b2118" : "#5a3a22"} />
        {/* ojos o anteojos */}
        {lentes ? (
          <>
            <Caja p={[-0.07, 0.8, 0.16]} s={[0.11, 0.06, 0.02]} c="#050505" m={0.8} r={0.15} />
            <Caja p={[0.07, 0.8, 0.16]} s={[0.11, 0.06, 0.02]} c="#050505" m={0.8} r={0.15} />
            <Caja p={[0, 0.81, 0.16]} s={[0.05, 0.015, 0.02]} c="#050505" />
          </>
        ) : (
          <>
            <Caja p={[-0.06, 0.8, 0.165]} s={[0.035, 0.035, 0.01]} c="#111" sombra={false} />
            <Caja p={[0.06, 0.8, 0.165]} s={[0.035, 0.035, 0.01]} c="#111" sombra={false} />
          </>
        )}
        <Caja p={[0, 0.71, 0.165]} s={[0.08, 0.02, 0.01]} c="#7a3b2b" sombra={false} />
        {/* brazos: giran desde el hombro */}
        <group position={[-0.29, 0.56, 0]} rotation={[-brazoI, 0, -0.12]}>
          <Caja p={[0, -0.25, 0]} s={[0.13, 0.52, 0.14]} c={torso} />
          <mesh position={[0, -0.54, 0]} castShadow>
            <sphereGeometry args={[0.07, 10, 8]} />
            <M c={piel} />
          </mesh>
        </group>
        <group position={[0.29, 0.56, 0]} rotation={[-brazoD, 0, 0.12]}>
          <Caja p={[0, -0.25, 0]} s={[0.13, 0.52, 0.14]} c={torso} />
          <mesh position={[0, -0.54, 0]} castShadow>
            <sphereGeometry args={[0.07, 10, 8]} />
            <M c={piel} />
          </mesh>
          {traje ? <Llave /> : null}
        </group>
      </group>
    </group>
  );
};

/** La llave gigante del dueño del local, en la mano derecha. */
const Llave: React.FC = () => (
  <group position={[0.02, -0.56, 0.1]} rotation={[0.2, 0, 0.5]}>
    <mesh position={[0, 0.62, 0]} castShadow>
      <torusGeometry args={[0.16, 0.05, 10, 24]} />
      <M c="#E9B949" m={0.85} r={0.25} />
    </mesh>
    <Caja p={[0, 0.2, 0]} s={[0.07, 0.68, 0.06]} c="#E9B949" m={0.85} r={0.25} />
    <Caja p={[0.07, -0.05, 0]} s={[0.12, 0.06, 0.06]} c="#E9B949" m={0.85} r={0.25} />
    <Caja p={[0.06, 0.06, 0]} s={[0.09, 0.05, 0.06]} c="#E9B949" m={0.85} r={0.25} />
  </group>
);

/** Reposera rayada (aparece desplegándose). */
export const Reposera: React.FC<{ position: V3; abre: number }> = ({ position, abre }) => {
  const a = Math.max(0.001, abre);
  return (
    <group position={position} scale={[1, a, 1]}>
      <Caja p={[0, 0.32, 0.25]} s={[0.62, 0.05, 0.9]} c="#E63946" />
      <Caja p={[0, 0.62, -0.3]} s={[0.62, 0.05, 0.75]} rot={[1.0, 0, 0]} c="#F2F2EA" />
      <Caja p={[-0.33, 0.16, 0.25]} s={[0.04, 0.32, 0.04]} c="#bbb" m={0.6} />
      <Caja p={[0.33, 0.16, 0.25]} s={[0.04, 0.32, 0.04]} c="#bbb" m={0.6} />
      <Caja p={[-0.33, 0.16, -0.25]} s={[0.04, 0.32, 0.04]} c="#bbb" m={0.6} />
      <Caja p={[0.33, 0.16, -0.25]} s={[0.04, 0.32, 0.04]} c="#bbb" m={0.6} />
      {/* sombrilla */}
      <Caja p={[0.5, 0.9, -0.3]} s={[0.04, 1.8, 0.04]} c="#ddd" />
      <mesh position={[0.5, 1.8, -0.3]} castShadow>
        <coneGeometry args={[0.75, 0.32, 10]} />
        <M c="#FFB703" />
      </mesh>
      {/* trago */}
      <mesh position={[-0.42, 0.42, 0.45]}>
        <cylinderGeometry args={[0.05, 0.04, 0.14, 12]} />
        <M c="#ff9f1c" e="#ff9f1c" ei={0.3} />
      </mesh>
    </group>
  );
};

/** Billete que sale volando. */
export const Billete: React.FC<{ position: V3; rot: V3; escala?: number; fuentesListas: boolean }> = ({ position, rot, escala = 1, fuentesListas }) => {
  const tx = useTexturaTexto("$ 10.000", { w: 512, h: 240, color: "#0f3b24", fondo: "#7fcf9a", font: "700 96px 'Space Grotesk', 'DejaVu Sans', sans-serif", listo: fuentesListas });
  return (
    <mesh position={position} rotation={rot} scale={escala} castShadow>
      <boxGeometry args={[0.9, 0.42, 0.01]} />
      <meshStandardMaterial map={tx} roughness={0.8} />
    </mesh>
  );
};

/** Cajones de mercadería apilados (aparecen de a uno). */
export const Cajones: React.FC<{ position: V3; cantidad: number; t: number }> = ({ position, cantidad, t }) => (
  <group position={position}>
    {Array.from({ length: 6 }, (_, i) => {
      const k = Math.min(1, Math.max(0, cantidad - i));
      if (k <= 0) return null;
      const y = 0.15 + Math.floor(i / 2) * 0.31 + (1 - k) * 0.8;
      return <Caja key={i} p={[(i % 2) * 0.42 - 0.21, y, 0]} rot={[0, Math.sin(i * 7.3) * 0.15 + (1 - k) * 0.6 + Math.sin(t * 2 + i) * 0.0, 0]} s={[0.38, 0.28, 0.32]} c={i % 3 === 0 ? "#C8955A" : i % 3 === 1 ? "#E63946" : "#3A86FF"} />;
    })}
  </group>
);

/** Vereda y calle. */
export const Piso: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#7d7d7d" roughness={0.95} />
    </mesh>
    {Array.from({ length: 16 }, (_, i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-12 + i * 1.6, 0.002, 0]}>
        <planeGeometry args={[0.025, 40]} />
        <meshBasicMaterial color="#6a6a6a" />
      </mesh>
    ))}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 9]} receiveShadow>
      <planeGeometry args={[40, 10]} />
      <meshStandardMaterial color="#2b2f33" roughness={0.9} />
    </mesh>
  </group>
);
