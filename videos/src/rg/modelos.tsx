import React, { useMemo } from "react";
import * as THREE from "three";
import { cajaR, useLienzo } from "../v8/estudio3d";
import { GondolaPrecios } from "../v8/modelos3d";

// "¡Estás regalando tu ganancia!": el mismo kiosquero en todo el video, monedas, grieta, máquina de vidrio y góndola con precios viejos.

const rnd = (i: number, k = 0) => { const x = Math.sin((i + 1) * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

/** Pose del kiosquero (todo en radianes / 0 → 1). */
export type Pose = { giro?: number; mira?: number; brazo?: number; susto?: number; respira?: number };

/** El kiosquero (detrás del mostrador): camisa oscura, delantal verde, gorra. Se lo ve sobre todo a contraluz. */
export const Kiosquero: React.FC<{ pose: Pose }> = ({ pose }) => {
  const { giro = 0, mira = 0, brazo = 0, susto = 0, respira = 0 } = pose;
  const piel = <meshStandardMaterial color="#8a5c44" roughness={0.6} />;
  const camisa = <meshStandardMaterial color="#2c3440" roughness={0.75} />;
  const delantal = <meshStandardMaterial color="#1e5a3a" roughness={0.8} />;
  const brazoD = (lado: 1 | -1, extiende: number) => (
    <group position={[lado * 0.24, 1.42, 0]} rotation-x={-0.25 - extiende * 1.15} rotation-z={lado * 0.12}>
      <mesh position={[0, -0.16, 0]} castShadow><capsuleGeometry args={[0.055, 0.26, 6, 12]} />{camisa}</mesh>
      <group position={[0, -0.33, 0]} rotation-x={-0.35 - extiende * 0.3}>
        <mesh position={[0, -0.13, 0]} castShadow><capsuleGeometry args={[0.045, 0.22, 6, 12]} />{piel}</mesh>
        <mesh position={[0, -0.29, 0.01]} castShadow><sphereGeometry args={[0.05, 14, 12]} />{piel}</mesh>
      </group>
    </group>
  );
  return (
    <group rotation-y={giro * 0.35}>
      <group position={[0, respira * 0.01, -susto * 0.06]} rotation-x={-susto * 0.12}>
        {/* torso y delantal */}
        <mesh position={[0, 1.2, 0]} castShadow scale={[1, 1, 0.68]}><capsuleGeometry args={[0.2, 0.42, 8, 16]} />{camisa}</mesh>
        <mesh position={[0, 1.08, 0.13]} geometry={cajaR(0.36, 0.56, 0.03, 0.02)} castShadow>{delantal}</mesh>
        <mesh position={[0, 1.42, 0.12]} geometry={cajaR(0.3, 0.16, 0.025, 0.02)}>{delantal}</mesh>
        {/* cuello y cabeza */}
        <mesh position={[0, 1.55, 0]} castShadow><cylinderGeometry args={[0.055, 0.06, 0.1, 14]} />{piel}</mesh>
        <group position={[0, 1.7, 0]} rotation-y={giro} rotation-x={mira * 0.45 - susto * 0.25}>
          <mesh castShadow scale={[0.9, 1.08, 0.98]}><sphereGeometry args={[0.11, 24, 20]} />{piel}</mesh>
          <mesh position={[0, 0.04, -0.01]} scale={[0.95, 0.75, 1.0]}><sphereGeometry args={[0.115, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#1b1612" roughness={0.9} /></mesh>
          <mesh position={[0, -0.005, 0.105]} rotation-x={Math.PI / 2}><coneGeometry args={[0.018, 0.045, 10]} />{piel}</mesh>
          {[-0.04, 0.04].map((x) => <mesh key={x} position={[x, 0.02, 0.095]}><sphereGeometry args={[0.011 + susto * 0.004, 10, 8]} /><meshStandardMaterial color="#f2efe8" emissive="#ffffff" emissiveIntensity={0.1} /></mesh>)}
          {/* gorra */}
          <mesh position={[0, 0.08, 0]} scale={[1, 0.55, 1]}><sphereGeometry args={[0.118, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#14321f" roughness={0.7} /></mesh>
          <mesh position={[0, 0.075, 0.1]} rotation-x={0.15}><cylinderGeometry args={[0.09, 0.09, 0.012, 20, 1, false, -Math.PI / 2, Math.PI]} /><meshStandardMaterial color="#14321f" roughness={0.7} /></mesh>
        </group>
        {brazoD(1, brazo)}
        {brazoD(-1, 0)}
      </group>
    </group>
  );
};

/** Perfil de cara (silueta extruida) para el primer plano: frente, nariz, boca, mentón. Mira hacia +x. */
export const Perfil: React.FC<{ boca?: number }> = ({ boca = 0 }) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    const P: [number, number][] = [[-0.12, -0.32], [-0.1, -0.12], [-0.13, 0.0], [-0.12, 0.12], [-0.06, 0.2], [0.03, 0.21], [0.08, 0.17], [0.1, 0.1], [0.098, 0.05], [0.14, -0.02],
      [0.105, -0.045], [0.1, -0.065], [0.105, -0.08 - boca * 0.02], [0.095, -0.095 - boca * 0.03], [0.1, -0.11 - boca * 0.03], [0.075, -0.16 - boca * 0.02], [0.03, -0.18], [-0.02, -0.17], [-0.05, -0.32]];
    s.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i < P.length; i++) { const [x, y] = P[i]; const [px, py] = P[i - 1]; s.quadraticCurveTo(px + (x - px) * 0.5 + 0.004, py + (y - py) * 0.5, x, y); }
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 4 });
  }, [boca]);
  return <mesh geometry={geo} position={[0, 0, -0.08]}><meshStandardMaterial color="#120d0b" roughness={0.5} /></mesh>;
};

/** Grieta en el mostrador (con resplandor rojo de abajo). */
export const Grieta: React.FC<{ abre: number }> = ({ abre }) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    const n = 14;
    const arriba: [number, number][] = [], abajo: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const x = -0.22 + (i / n) * 0.44;
      const w = (0.012 + 0.03 * Math.sin((i / n) * Math.PI)) * (0.6 + rnd(i) * 0.8);
      const y = (rnd(i, 2) - 0.5) * 0.05;
      arriba.push([x, y + w]); abajo.push([x, y - w]);
    }
    s.moveTo(...arriba[0]); arriba.slice(1).forEach((p) => s.lineTo(...p)); [...abajo].reverse().forEach((p) => s.lineTo(...p)); s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  if (abre <= 0) return null;
  return (
    <group scale={[abre, abre, abre]}>
      <mesh geometry={geo} rotation-x={-Math.PI / 2}><meshBasicMaterial color="#ff4a10" toneMapped={false} /></mesh>
      <mesh geometry={geo} rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} scale={[0.92, 0.55, 1]}><meshBasicMaterial color="#7a0800" toneMapped={false} /></mesh>
      <mesh geometry={geo} rotation-x={-Math.PI / 2} position={[0, 0.002, 0]} scale={[0.85, 0.25, 1]}><meshBasicMaterial color="#000000" /></mesh>
    </group>
  );
};

/** Monedas instanciadas: `pose(i)` → [x, y, z, rotX, rotZ, visible]. */
export const Monedas: React.FC<{ n: number; pose: (i: number) => [number, number, number, number, number, number]; radio?: number; grosor?: number }> = ({ n, pose, radio = 0.03, grosor = 0.006 }) => {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.CylinderGeometry(radio, radio, grosor, 28), new THREE.MeshPhysicalMaterial({ color: "#c99a24", metalness: 0.9, roughness: 0.38, clearcoat: 0.3 }), n);
    m.castShadow = true;
    m.frustumCulled = false;
    return m;
  }, [n, radio, grosor]);
  const d = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const [x, y, z, rx, rz, v] = pose(i);
    d.position.set(x, y, z); d.rotation.set(rx, 0, rz); d.scale.setScalar(v); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

/** Tubo de vidrio (para comparar pilas de monedas), con base y rótulo. */
export const TuboVidrio: React.FC<{ alto?: number; radio?: number; rotulo: string; color?: string }> = ({ alto = 0.32, radio = 0.045, rotulo, color = "#16a34a" }) => {
  const tex = useLienzo(`rot|${rotulo}|${color}`, 256, 96, (x, w, h) => {
    x.fillStyle = color; x.fillRect(0, 0, w, h); x.fillStyle = "#fff"; x.font = `800 ${h * 0.55}px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(rotulo, w / 2, h / 2 + 2);
  });
  return (
    <group>
      <mesh position={[0, alto / 2, 0]}><cylinderGeometry args={[radio, radio, alto, 32, 1, true]} /><meshPhysicalMaterial color="#dff1ff" transparent opacity={0.2} roughness={0.04} clearcoat={1} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.006, 0]}><cylinderGeometry args={[radio * 1.3, radio * 1.35, 0.012, 32]} /><meshStandardMaterial color="#2b2f2d" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[0, -0.03, radio * 1.4]}><planeGeometry args={[0.12, 0.045]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
    </group>
  );
};

/** Caja de vidrio (se llena de monedas). */
export const CajaVidrio: React.FC<{ w?: number; h?: number; d?: number }> = ({ w = 0.36, h = 0.3, d = 0.28 }) => (
  <group>
    <mesh position={[0, h / 2, 0]}><boxGeometry args={[w, h, d]} /><meshPhysicalMaterial color="#e6f4ff" transparent opacity={0.18} roughness={0.04} clearcoat={1} depthWrite={false} side={THREE.DoubleSide} /></mesh>
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <mesh key={i} position={[(a * w) / 2, h / 2, (b * d) / 2]}><boxGeometry args={[0.012, h, 0.012]} /><meshStandardMaterial color="#bfc8cf" metalness={1} roughness={0.25} /></mesh>)}
  </group>
);

/** Etiqueta grande de góndola: producto, precio (viejo) y fecha. `rojo` 0 → 1 la marca como desactualizada. */
export const EtiquetaGrande: React.FC<{ producto: string; precio: string; fecha: string; rojo?: number }> = ({ producto, precio, fecha, rojo = 0 }) => {
  const tex = useLienzo(`etqg|${producto}|${precio}|${fecha}`, 512, 256, (x, w, h) => {
    x.fillStyle = "#ead9a4"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(120,90,30,${rnd(i) * 0.12})`; x.fillRect(rnd(i, 1) * w, rnd(i, 2) * h, 3, 3); }
    x.fillStyle = "#a8761c"; x.fillRect(0, 0, w, 30);
    x.fillStyle = "#3a2e1a"; x.font = `700 34px "Inter", sans-serif`; x.fillText(producto, 22, 76);
    x.font = `800 110px "Space Grotesk", sans-serif`; x.fillText(precio, 22, 190);
    x.font = `600 26px "Inter", sans-serif`; x.fillStyle = "#7a5a2a"; x.fillText(fecha, 22, 236);
  });
  return (
    <group>
      <mesh><planeGeometry args={[0.3, 0.15]} /><meshStandardMaterial map={tex} roughness={0.8} emissive="#ff1a1a" emissiveIntensity={rojo * 0.35} /></mesh>
      {rojo > 0 ? <mesh position={[0, 0, 0.002]}><planeGeometry args={[0.31, 0.16]} /><meshBasicMaterial color="#ff2020" transparent opacity={0.22 * rojo} toneMapped={false} /></mesh> : null}
    </group>
  );
};

/** Góndola con etiquetas viejas; `rojo(i)` las va marcando (12 etiquetas por góndola). */
export const GondolaVieja: React.FC<{ rojo: (i: number) => number }> = ({ rojo }) => (
  <group>
    <GondolaPrecios vieja />
    {[0.3, 0.8, 1.3].map((y, f) => [0, 1, 2, 3].map((k) => {
      const i = f * 4 + k, r = rojo(i);
      if (r <= 0) return null;
      return (
        <group key={i} position={[-0.45 + k * 0.3, y - 0.04, 0.204]}>
          <mesh><planeGeometry args={[0.28, 0.145]} /><meshBasicMaterial color="#ff1a1a" transparent opacity={0.5 * r} toneMapped={false} /></mesh>
        </group>
      );
    }))}
  </group>
);

/** Factura nueva del proveedor (costo del alfajor: $800 → $950). */
export const FacturaNueva: React.FC = () => {
  const tex = useLienzo("factura-nueva", 512, 640, (x, w, h) => {
    x.fillStyle = "#f7f3e8"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#1c1c1c"; x.font = `800 50px "Space Grotesk", sans-serif`; x.fillText("FACTURA", 34, 74);
    x.fillStyle = "#666"; x.font = `600 24px "Inter", sans-serif`; x.fillText("Distribuidora · lista nueva", 34, 112);
    x.fillStyle = "#333"; x.font = `700 32px "Inter", sans-serif`; x.fillText("Alfajor triple", 34, 196);
    x.fillStyle = "#999"; x.font = `600 30px "Inter", sans-serif`; x.fillText("antes $800", 34, 250); x.fillRect(34, 240, 150, 4);
    x.fillStyle = "#b42318"; x.fillRect(26, 290, w - 52, 150);
    x.fillStyle = "#fff"; x.font = `800 30px "Inter", sans-serif`; x.fillText("COSTO NUEVO", 50, 336); x.font = `800 86px "Space Grotesk", sans-serif`; x.fillText("$950", 50, 420);
    for (let i = 0; i < 3; i++) { x.fillStyle = "#ddd"; x.fillRect(34, 480 + i * 34, w - 68, 4); }
    x.fillStyle = "#f5a524"; x.fillRect(34, 586, 170, 40); x.fillStyle = "#1b1206"; x.font = `800 24px "Inter", sans-serif`; x.fillText("EJEMPLO", 50, 614);
  });
  return <mesh castShadow receiveShadow><planeGeometry args={[0.32, 0.4]} /><meshStandardMaterial map={tex} roughness={0.85} side={THREE.DoubleSide} /></mesh>;
};

/** Alfajor (paquete). */
export const Alfajor: React.FC = () => {
  const tex = useLienzo("alfajor-paq", 256, 128, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#5a2d82"); g.addColorStop(1, "#8a4fbf"); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = "#ffd166"; x.font = `800 34px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("ALFAJOR", w / 2, h / 2 - 6);
    x.fillStyle = "#fff"; x.font = `700 18px "Inter", sans-serif`; x.fillText("TRIPLE", w / 2, h / 2 + 26);
  });
  return (
    <group>
      <mesh geometry={cajaR(0.12, 0.035, 0.08, 0.012, 2)} castShadow><meshPhysicalMaterial color="#6b3a99" roughness={0.3} clearcoat={0.8} /></mesh>
      <mesh position={[0, 0.0181, 0]} rotation-x={-Math.PI / 2}><planeGeometry args={[0.11, 0.07]} /><meshStandardMaterial map={tex} roughness={0.4} /></mesh>
    </group>
  );
};
