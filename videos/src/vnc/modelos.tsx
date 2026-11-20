import React, { useMemo } from "react";
import * as THREE from "three";
import { cajaR, useLienzo } from "../v8/estudio3d";
import { CajaCarton, GondolaPrecios, Silueta } from "../v8/modelos3d";

// "Vendés, pero no cobrás": kiosco de noche visto desde atrás del mostrador (vos sos el kiosquero). Escala real, 1 u = 1 m.

const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export const FRENTE_Z = 3.4; // pared de adelante (puerta y vidriera)
export const PUERTA_X = 0.95;

/** Piso de baldosas gastadas, techo y paredes laterales con góndolas. */
export const Local: React.FC = () => {
  const baldosa = useLienzo("baldosa-noche", 512, 512, (x, w, h) => {
    x.fillStyle = "#4a4640"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      x.fillStyle = (i + j) % 2 ? "#57524a" : "#3f3b36"; x.fillRect(i * 128 + 2, j * 128 + 2, 124, 124);
    }
    for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(0,0,0,${rnd(i) * 0.12})`; x.fillRect(rnd(i + 1) * w, rnd(i + 2) * h, 2 + rnd(i + 3) * 4, 2); }
  }, [6, 6]);
  const pared = useLienzo("pared-noche", 512, 512, (x, w, h) => {
    x.fillStyle = "#cfc4ae"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2200; i++) { x.fillStyle = `rgba(70,55,35,${0.04 + rnd(i) * 0.07})`; x.beginPath(); x.arc(rnd(i + 1) * w, rnd(i + 2) * h, 1 + rnd(i + 3) * 5, 0, 7); x.fill(); }
    const g = x.createLinearGradient(0, h, 0, h * 0.6); g.addColorStop(0, "rgba(40,30,20,0.35)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  }, [3, 2]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 1.2]} receiveShadow><planeGeometry args={[6, 6]} /><meshStandardMaterial map={baldosa} roughness={0.55} metalness={0.05} /></mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 3.05, 1.2]}><planeGeometry args={[6, 6]} /><meshStandardMaterial color="#1c1b19" roughness={0.9} /></mesh>
      {[-2.3, 2.3].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.5, 1.2]} rotation-y={x < 0 ? Math.PI / 2 : -Math.PI / 2} receiveShadow><planeGeometry args={[6, 3.1]} /><meshStandardMaterial map={pared} roughness={0.9} /></mesh>
          {[0.3, 1.75].map((z) => (
            <group key={z} position={[x + (x < 0 ? 0.22 : -0.22), 0, z]} rotation-y={x < 0 ? Math.PI / 2 : -Math.PI / 2} scale={[0.95, 0.95, 0.95]}><GondolaPrecios giro={() => 1} /></group>
          ))}
        </group>
      ))}
      <mesh position={[0, 1.5, -1.25]} receiveShadow><planeGeometry args={[4.6, 3.1]} /><meshStandardMaterial map={pared} roughness={0.9} /></mesh>
    </group>
  );
};

/** Mostrador con vitrina de golosinas (de frente al cliente; nosotros lo vemos desde atrás). */
export const Mostrador: React.FC = () => {
  const colores = ["#e94b3c", "#f2b134", "#2f8f5b", "#3d6fb5", "#f07aa8", "#8a4fbf"];
  return (
    <group position={[0, 0, 0.4]}>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow geometry={cajaR(3.0, 0.96, 0.7, 0.02)}><meshStandardMaterial color="#5b3a26" roughness={0.55} /></mesh>
      <mesh position={[0, 0.975, 0]} castShadow receiveShadow><boxGeometry args={[3.08, 0.035, 0.78]} /><meshPhysicalMaterial color="#8f877a" roughness={0.4} clearcoat={0.5} /></mesh>
      {/* vitrina del lado del cliente: golosinas iluminadas */}
      <mesh position={[0, 0.62, 0.36]}><planeGeometry args={[2.8, 0.6]} /><meshPhysicalMaterial color="#cfe8ff" transparent opacity={0.18} roughness={0.05} /></mesh>
      {Array.from({ length: 22 }, (_, i) => (
        <mesh key={i} position={[-1.3 + (i % 11) * 0.26, 0.45 + Math.floor(i / 11) * 0.22, 0.22]} geometry={cajaR(0.18, 0.14, 0.1, 0.01, 2)}><meshPhysicalMaterial color={colores[i % 6]} roughness={0.3} clearcoat={0.6} emissive={colores[i % 6]} emissiveIntensity={0.25} /></mesh>
      ))}
      <pointLight position={[0, 0.6, 0.25]} intensity={1.2} distance={1.8} color="#ffe2b0" />
    </group>
  );
};

/** Frente del local: pared, vidriera con reja y cartel de neón, y la puerta (`abre` 0 → 1). Afuera, la luz de la calle. */
export const Frente: React.FC<{ abre: number; neon: number; calle?: number }> = ({ abre, neon, calle = 1 }) => {
  const neonTex = useLienzo("neon-abierto", 512, 160, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.strokeStyle = "#ff3b30"; x.lineWidth = 6; x.shadowColor = "#ff3b30"; x.shadowBlur = 20;
    x.font = `800 ${h * 0.55}px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.strokeText("ABIERTO", w / 2, h / 2 + 4);
  });
  return (
    <group position={[0, 0, FRENTE_Z]}>
      {/* pared con hueco de puerta y vidriera */}
      <mesh position={[-1.55, 1.5, 0]} receiveShadow><boxGeometry args={[1.5, 3.1, 0.15]} /><meshStandardMaterial color="#b9ad96" roughness={0.9} /></mesh>
      <mesh position={[1.85, 1.5, 0]} receiveShadow><boxGeometry args={[0.9, 3.1, 0.15]} /><meshStandardMaterial color="#b9ad96" roughness={0.9} /></mesh>
      <mesh position={[PUERTA_X, 2.6, 0]} receiveShadow><boxGeometry args={[1.0, 0.9, 0.15]} /><meshStandardMaterial color="#b9ad96" roughness={0.9} /></mesh>
      <mesh position={[-0.35, 2.6, 0]} receiveShadow><boxGeometry args={[1.1, 0.9, 0.15]} /><meshStandardMaterial color="#b9ad96" roughness={0.9} /></mesh>
      <mesh position={[-0.35, 0.35, 0]} receiveShadow><boxGeometry args={[1.1, 0.7, 0.15]} /><meshStandardMaterial color="#b9ad96" roughness={0.9} /></mesh>
      {/* vidriera con reja y neón */}
      <group position={[-0.35, 1.42, 0.02]}>
        <mesh><planeGeometry args={[1.1, 1.45]} /><meshBasicMaterial color="#0d1a2a" /></mesh>
        {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[-0.49 + i * 0.14, 0, -0.04]}><boxGeometry args={[0.022, 1.45, 0.022]} /><meshStandardMaterial color="#1b1b1b" metalness={0.8} /></mesh>)}
        <mesh position={[0, 0.3, -0.06]} rotation-y={Math.PI}><planeGeometry args={[0.95, 0.3]} /><meshBasicMaterial map={neonTex} transparent toneMapped={false} opacity={neon} /></mesh>
        <pointLight position={[0, 0.3, -0.5]} intensity={2.5 * neon} distance={3} color="#ff3b30" />
      </group>
      {/* afuera: luz fría de la calle */}
      <mesh position={[PUERTA_X, 1.1, 0.4]}><planeGeometry args={[1.0, 2.2]} /><meshBasicMaterial color={new THREE.Color("#bcd7ff").multiplyScalar(0.6 + calle)} toneMapped={false} /></mesh>
      {/* puerta con vidrio, bisagra a la izquierda */}
      <group position={[PUERTA_X - 0.48, 0, 0.0]} rotation-y={-abre * 1.75}>
        <mesh position={[0.48, 1.08, 0]} castShadow><boxGeometry args={[0.95, 2.16, 0.05]} /><meshStandardMaterial color="#2a2f33" metalness={0.75} roughness={0.35} /></mesh>
        <mesh position={[0.48, 1.25, 0.03]}><planeGeometry args={[0.75, 1.5]} /><meshPhysicalMaterial color="#a8c8ff" transparent opacity={0.35} roughness={0.05} /></mesh>
        <mesh position={[0.86, 1.05, -0.05]}><boxGeometry args={[0.03, 0.3, 0.04]} /><meshStandardMaterial color="#c9c9c9" metalness={1} roughness={0.2} /></mesh>
      </group>
    </group>
  );
};

/** Tubo fluorescente del techo (con titileo). */
export const Tubo: React.FC<{ luz: number; x?: number; z?: number }> = ({ luz, x = 0, z = 1.0 }) => (
  <group position={[x, 2.98, z]}>
    <mesh><boxGeometry args={[1.25, 0.05, 0.12]} /><meshStandardMaterial color="#2b2b2b" /></mesh>
    <mesh position={[0, -0.04, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.022, 0.022, 1.2, 12]} /><meshBasicMaterial color={new THREE.Color("#eef6ff").multiplyScalar(0.3 + 1.6 * luz)} toneMapped={false} /></mesh>
    <pointLight position={[0, -0.25, 0]} intensity={2.4 * luz} distance={5} decay={1.6} color="#e8f2ff" castShadow shadow-mapSize={[1024, 1024]} />
  </group>
);

/** Luz volumétrica (haz que entra por la puerta): abanico de planos aditivos. */
export const Haz: React.FC<{ fuerza: number; largo?: number; ancho?: number; color?: string }> = ({ fuerza, largo = 3.5, ancho = 1.1, color = "#cfe2ff" }) => {
  const tex = useLienzo("haz", 64, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const s = x.createLinearGradient(0, 0, w, 0); s.addColorStop(0, "rgba(0,0,0,1)"); s.addColorStop(0.5, "rgba(0,0,0,0)"); s.addColorStop(1, "rgba(0,0,0,1)");
    x.globalCompositeOperation = "destination-out"; x.fillStyle = s; x.fillRect(0, 0, w, h);
  });
  if (fuerza <= 0) return null;
  return (
    <group>
      {[-0.5, -0.25, 0, 0.25, 0.5].map((a, i) => (
        <mesh key={i} rotation-y={a * 0.6} rotation-x={-Math.PI / 2 + 0.25} position={[0, 0, -largo / 2]}>
          <planeGeometry args={[ancho * (1 + i * 0.1), largo]} />
          <meshBasicMaterial map={tex} color={color} transparent opacity={0.035 * Math.min(1.6, fuerza)} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

/** Persona a contraluz (silueta negra) con estela de movimiento: `estela` = posiciones anteriores. */
export const Sombra: React.FC<{ pos: [number, number, number]; rotY?: number; estela?: [number, number, number][]; alto?: number }> = ({ pos, rotY = Math.PI, estela = [], alto = 1.75 }) => (
  <group>
    {estela.map((p, i) => (
      <group key={i} position={p} rotation-y={rotY}>
        <mesh><boxGeometry args={[0.01, 0.01, 0.01]} /><meshBasicMaterial visible={false} /></mesh>
        <group scale={[1, 1, 0.3]}><SiluetaFantasma alto={alto} opacidad={0.35 * (1 - i / Math.max(1, estela.length))} /></group>
      </group>
    ))}
    <group position={pos} rotation-y={rotY}><Silueta alto={alto} color="#050505" /></group>
  </group>
);

const SiluetaFantasma: React.FC<{ alto: number; opacidad: number }> = ({ alto, opacidad }) => {
  const forma = useMemo(() => {
    const s = new THREE.Shape(); const k = alto / 1.75;
    const P = (x: number, y: number) => [x * k, y * k] as const;
    s.moveTo(...P(-0.13, 0)); s.lineTo(...P(-0.15, 0.82)); s.lineTo(...P(-0.28, 1.0)); s.lineTo(...P(-0.28, 1.4)); s.lineTo(...P(-0.08, 1.52));
    s.quadraticCurveTo(...P(0, 1.82), ...P(0.08, 1.52)); s.lineTo(...P(0.28, 1.4)); s.lineTo(...P(0.28, 1.0)); s.lineTo(...P(0.15, 0.82)); s.lineTo(...P(0.13, 0)); s.closePath();
    return new THREE.ShapeGeometry(s);
  }, [alto]);
  return <mesh geometry={forma}><meshBasicMaterial color="#000000" transparent opacity={opacidad} depthWrite={false} side={THREE.DoubleSide} /></mesh>;
};

/** Factura del proveedor (papel con renglones y total). */
export const Factura3D: React.FC = () => {
  const tex = useLienzo("factura-proveedor", 512, 700, (x, w, h) => {
    x.fillStyle = "#f7f3e8"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#1c1c1c"; x.font = `800 54px "Space Grotesk", sans-serif`; x.fillText("FACTURA", 36, 80);
    x.font = `600 24px "Inter", sans-serif`; x.fillStyle = "#666"; x.fillText("Distribuidora · mercadería", 36, 120);
    const items = [["Golosinas surtidas", "$38.400"], ["Bebidas", "$31.200"], ["Galletitas", "$22.900"], ["Cigarrillos", "$17.500"]];
    items.forEach(([a, b], i) => { x.fillStyle = "#333"; x.font = `600 28px "Inter", sans-serif`; x.fillText(a, 36, 200 + i * 62); x.textAlign = "right"; x.fillText(b, w - 36, 200 + i * 62); x.textAlign = "left"; x.fillStyle = "#ddd"; x.fillRect(36, 218 + i * 62, w - 72, 2); });
    x.fillStyle = "#b42318"; x.fillRect(28, 470, w - 56, 120);
    x.fillStyle = "#fff"; x.font = `800 34px "Inter", sans-serif`; x.fillText("TOTAL", 52, 520); x.font = `800 64px "Space Grotesk", sans-serif`; x.textAlign = "right"; x.fillText("$110.000", w - 52, 568); x.textAlign = "left";
    x.fillStyle = "#f5a524"; x.fillRect(36, 620, 170, 44); x.fillStyle = "#1b1206"; x.font = `800 26px "Inter", sans-serif`; x.fillText("EJEMPLO", 50, 652);
  });
  return <mesh castShadow receiveShadow><planeGeometry args={[0.36, 0.49]} /><meshStandardMaterial map={tex} roughness={0.85} side={THREE.DoubleSide} /></mesh>;
};

/** Pila de cajas del proveedor. */
export const CajasProveedor: React.FC = () => (
  <group>
    <group position={[-0.28, 0, 0]}><CajaCarton w={0.5} h={0.38} d={0.42} rubro={1} /></group>
    <group position={[0.28, 0, 0.02]} rotation-y={0.08}><CajaCarton w={0.5} h={0.38} d={0.42} rubro={2} /></group>
    <group position={[0, 0.38, 0]} rotation-y={-0.06}><CajaCarton w={0.52} h={0.36} d={0.42} rubro={9} /></group>
  </group>
);

// ---------- notas de fiado ----------

export const DEUDAS: [string, string][] = [["Marta", "$32.000"], ["Juan", "$24.000"], ["Rosa", "$18.000"], ["Carlos", "$14.000"], ["Beto", "$8.000"]]; // = $96.000 (los de la pantalla real)

/** Textura de una nota de fiado escrita a mano (variante v; `pendiente` le pone el sello rojo). */
export function useNotaTex(v: number, pendiente: boolean) {
  return useLienzo(`nota|${v}|${pendiente}`, 256, 192, (x, w, h) => {
    const tonos = ["#fbf6e3", "#fff4c2", "#eef3ff", "#fbe9e1", "#f1f7e6"];
    x.fillStyle = tonos[v % 5]; x.fillRect(0, 0, w, h);
    x.strokeStyle = "#9cc3e8"; x.lineWidth = 2; for (let y = 52; y < h; y += 30) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
    x.fillStyle = "#1d3b8a"; x.font = `400 40px "Permanent Marker", cursive`; x.fillText("FIADO", 16, 46);
    x.font = `400 34px "Permanent Marker", cursive`; x.fillText(DEUDAS[v % 5][0], 18, 104); x.fillStyle = "#b42318"; x.fillText(DEUDAS[v % 5][1], 18, 150);
    if (pendiente) {
      x.save(); x.translate(w * 0.62, h * 0.62); x.rotate(-0.35); x.strokeStyle = "rgba(200,20,20,0.85)"; x.lineWidth = 6; x.strokeRect(-80, -26, 160, 52);
      x.fillStyle = "rgba(200,20,20,0.85)"; x.font = `800 30px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("PENDIENTE", 0, 2); x.restore();
    }
  });
}

/** Grupo de notas instanciadas de una variante. `pose(i)` devuelve [x, y, z, rotX, rotY, rotZ, escala] (escala 0 = oculta). */
export const Notas: React.FC<{ v: number; n: number; pose: (i: number) => [number, number, number, number, number, number, number]; pendiente?: boolean }> = ({ v, n, pose, pendiente = false }) => {
  const tex = useNotaTex(v, pendiente);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.85 }), n);
    m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    return m;
  }, [tex, n]);
  const d = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const [x, y, z, rx, ry, rz, s] = pose(i);
    d.position.set(x, y, z); d.rotation.set(rx, ry, rz); d.scale.set(s, s, s); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

/** Puntos que dibujan un texto (para que las notas formen el número): se muestrea un canvas. */
export function puntosDeTexto(texto: string, n: number, ancho: number): [number, number][] {
  const W = 600, H = 200;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const x = cv.getContext("2d")!;
  x.fillStyle = "#000"; x.fillRect(0, 0, W, H); x.fillStyle = "#fff"; x.font = `800 170px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(texto, W / 2, H / 2 + 8, W - 20);
  const d = x.getImageData(0, 0, W, H).data;
  const llenos: [number, number][] = [];
  for (let yy = 0; yy < H; yy += 6) for (let xx = 0; xx < W; xx += 6) if (d[(yy * W + xx) * 4] > 128) llenos.push([xx, yy]);
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const p = llenos.length ? llenos[Math.floor((i * llenos.length) / n)] : [W / 2, H / 2];
    out.push([((p[0] - W / 2) / W) * ancho, -((p[1] - H / 2) / W) * ancho]);
  }
  return out;
}
