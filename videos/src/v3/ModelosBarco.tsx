import React, { useMemo } from "react";
import * as THREE from "three";

// Modelos del video 03 ("Tu kiosco se hunde"): casco del barco, agua con olas, agujeros, tapones, gaviotas y sol.

type V3 = [number, number, number];

const B: React.FC<{ p: V3; s: V3; c: string; r?: V3; m?: number; ro?: number; e?: string; ei?: number; sombra?: boolean }> = ({ p, s, c, r, m = 0, ro = 0.7, e, ei = 0, sombra = true }) => (
  <mesh position={p} rotation={r} castShadow={sombra} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} metalness={m} roughness={ro} emissive={e ?? "#000"} emissiveIntensity={ei} />
  </mesh>
);

/** Posición X de cada agujero sobre el frente del casco (local) y su altura. */
export const AGUJERO_X = [-1.65, -0.55, 0.55, 1.65];
export const AGUJERO_Y = -0.05;
export const FRENTE_Z = 1.92;

/** Casco rojo con franja, cubierta de madera y barandas bajas. Origen: centro del casco. */
export const Casco: React.FC = () => (
  <group>
    <B p={[0, 0, 0]} s={[5.2, 1.1, 3.84]} c="#A4262C" ro={0.55} />
    <B p={[0, 0.16, 0]} s={[5.24, 0.16, 3.88]} c="#F2F2EA" ro={0.5} />
    <B p={[0, -0.5, 0]} s={[4.7, 0.2, 3.3]} c="#6e1519" />
    <B p={[0, 0.58, 0]} s={[5.0, 0.08, 3.64]} c="#b98b5e" />
    {/* barandas bajas de la proa y la popa */}
    {[-2.45, 2.45].map((x) => (
      <B key={x} p={[x, 0.78, 0]} s={[0.08, 0.32, 3.5]} c="#E9E1CF" />
    ))}
    <B p={[0, 0.78, 1.78]} s={[4.9, 0.32, 0.08]} c="#E9E1CF" />
    {/* salvavidas */}
    <mesh position={[2.64, 0.12, 0.2]} rotation={[0, Math.PI / 2, 0]} castShadow>
      <torusGeometry args={[0.3, 0.1, 10, 24]} />
      <meshStandardMaterial color="#F2F2EA" roughness={0.6} />
    </mesh>
  </group>
);

/** Agujero en el casco: aparece con rebote (escala), con borde naranja. */
export const Agujero: React.FC<{ i: number; k: number }> = ({ i, k }) => {
  if (k <= 0.001) return null;
  return (
    <group position={[AGUJERO_X[i], AGUJERO_Y, FRENTE_Z]} scale={k}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.06, 24]} />
        <meshStandardMaterial color="#050505" roughness={1} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <torusGeometry args={[0.25, 0.05, 8, 24]} />
        <meshStandardMaterial color="#ff8a00" emissive="#ff5a00" emissiveIntensity={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
};

/** Tapón con el logo de En Claro: se clava en el agujero. */
export const Tapon: React.FC<{ position: V3; giro: number; escala?: number }> = ({ position, giro, escala = 1 }) => (
  <group position={position} rotation={[0, 0, giro]} scale={escala}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.3, 0.27, 0.3, 24]} />
      <meshStandardMaterial color="#FFB703" emissive="#FFB703" emissiveIntensity={0.35} roughness={0.4} />
    </mesh>
    <B p={[0, 0.07, 0.16]} s={[0.34, 0.06, 0.02]} c="#06140D" sombra={false} />
    <B p={[-0.03, -0.05, 0.16]} s={[0.28, 0.06, 0.02]} c="#06140D" sombra={false} />
  </group>
);

/** Agua con olas. `nivel` es la altura del mar; las olas salen del tiempo (determinista). */
export const Agua: React.FC<{ t: number; nivel: number }> = ({ t, nivel }) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(80, 80, 64, 64), []);
  useMemo(() => {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.45 + t * 1.7) * 0.11 + Math.cos(y * 0.38 + t * 1.3) * 0.1 + Math.sin((x + y) * 0.2 - t) * 0.07);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }, [geo, t]);
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, nivel, 0]} receiveShadow>
      <meshStandardMaterial color="#1d86bd" transparent opacity={0.86} side={THREE.DoubleSide} roughness={0.25} metalness={0.1} emissive="#0b3a5a" emissiveIntensity={0.35} />
    </mesh>
  );
};

export const Sol: React.FC<{ k: number }> = ({ k }) => (
  <group position={[7, 8, -12]}>
    <mesh scale={k}>
      <sphereGeometry args={[1.5, 24, 18]} />
      <meshBasicMaterial color="#FFE08A" toneMapped={false} />
    </mesh>
    <mesh scale={k * 1.5}>
      <sphereGeometry args={[1.5, 24, 18]} />
      <meshBasicMaterial color="#FFD166" transparent opacity={0.25} toneMapped={false} />
    </mesh>
  </group>
);

export const Gaviota: React.FC<{ position: V3; t: number; fase: number }> = ({ position, t, fase }) => {
  const ala = 0.35 + 0.45 * Math.sin(t * 7 + fase);
  return (
    <group position={position} rotation={[0, 0.3, 0]}>
      <mesh scale={[1.4, 0.8, 0.8]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color="#fafafa" />
      </mesh>
      <B p={[-0.38, 0.06, 0]} s={[0.7, 0.04, 0.26]} c="#f2f2f2" r={[0, 0, ala]} sombra={false} />
      <B p={[0.38, 0.06, 0]} s={[0.7, 0.04, 0.26]} c="#f2f2f2" r={[0, 0, -ala]} sombra={false} />
    </group>
  );
};

export const Gota: React.FC<{ position: V3 }> = ({ position }) => (
  <mesh position={position}>
    <sphereGeometry args={[0.1, 8, 6]} />
    <meshStandardMaterial color="#9fd8ff" transparent opacity={0.9} />
  </mesh>
);

export const Moneda: React.FC<{ position: V3; giro: number }> = ({ position, giro }) => (
  <mesh position={position} rotation={[Math.PI / 2 + Math.sin(giro) * 0.5, giro, 0]} scale={1.5}>
    <cylinderGeometry args={[0.14, 0.14, 0.035, 14]} />
    <meshStandardMaterial color="#F7C948" metalness={0.9} roughness={0.25} emissive="#FFB703" emissiveIntensity={0.45} />
  </mesh>
);
