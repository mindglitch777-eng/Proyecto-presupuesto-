import React, { useMemo } from "react";
import * as THREE from "three";
import { cajaR, dibujarBillete, dibujarCanto, useLienzo } from "./estudio3d";

// Modelos 3D "render de producto" de la serie V8 (escala real: 1 unidad = 1 m). Sin marcas. Todo determinista.

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Ruido suave para revoque, cemento o cartón (textura de canvas). */
function dibujarRuido(base: string, manchas: string, n = 1800) {
  return (x: CanvasRenderingContext2D, w: number, h: number) => {
    x.fillStyle = base;
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      x.fillStyle = manchas;
      x.globalAlpha = 0.04 + rnd(i) * 0.08;
      const r = 1 + rnd(i + 7) * 5;
      x.beginPath();
      x.arc(rnd(i + 1) * w, rnd(i + 2) * h, r, 0, Math.PI * 2);
      x.fill();
    }
    x.globalAlpha = 1;
  };
}

/** Vereda de baldosas y calle. */
export const Vereda: React.FC<{ ancho?: number; largo?: number; calle?: boolean }> = ({ ancho = 30, largo = 12, calle = true }) => {
  const baldosa = useLienzo("baldosa", 512, 512, (x, w, h) => {
    dibujarRuido("#b9b4aa", "#6f6a62", 900)(x, w, h);
    x.strokeStyle = "#8d877d";
    x.lineWidth = 6;
    for (let i = 0; i <= 4; i++) {
      x.beginPath(); x.moveTo((i * w) / 4, 0); x.lineTo((i * w) / 4, h); x.stroke();
      x.beginPath(); x.moveTo(0, (i * h) / 4); x.lineTo(w, (i * h) / 4); x.stroke();
    }
  }, [ancho / 1.6, largo / 1.6]);
  const asfalto = useLienzo("asfalto", 512, 512, dibujarRuido("#2d2f31", "#9a9a9a", 3000), [ancho / 4, 2]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, largo / 2 - 0.3]} receiveShadow>
        <planeGeometry args={[ancho, largo]} />
        <meshStandardMaterial map={baldosa} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.075, largo - 0.3]} castShadow receiveShadow>
        <boxGeometry args={[ancho, 0.15, 0.25]} />
        <meshStandardMaterial color="#9d988e" roughness={0.8} />
      </mesh>
      {calle ? (
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.12, largo + 4]} receiveShadow>
          <planeGeometry args={[ancho, 8]} />
          <meshStandardMaterial map={asfalto} roughness={0.95} />
        </mesh>
      ) : null}
    </group>
  );
};

/** Frente de kiosco de barrio: revoque, toldo a rayas con volado, cartel luminoso, vidriera iluminada con golosinas, reja y puerta. */
export const Kiosco3D: React.FC<{ t: number; ancho?: number; noche?: number; persiana?: number }> = ({ t, ancho = 4.2, noche = 1, persiana = 0 }) => {
  const revoque = useLienzo("revoque", 512, 512, dibujarRuido("#e6dccb", "#8c7f6a", 2600), [2, 2]);
  const toldo = useLienzo("toldo", 512, 256, (x, w, h) => {
    for (let i = 0; i < 8; i++) {
      x.fillStyle = i % 2 ? "#f3ead6" : "#1e7a4c";
      x.fillRect((i * w) / 8, 0, w / 8, h);
    }
    dibujarRuido("rgba(0,0,0,0)", "#000", 500)(x, w, h);
  });
  const cartel = useLienzo("cartel-kiosco", 1024, 192, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0f3d2b");
    g.addColorStop(1, "#0a2a1d");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.fillStyle = "#ffcf5a";
    x.font = `800 ${h * 0.62}px "Space Grotesk", sans-serif`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("KIOSCO", w / 2, h * 0.54);
  });
  const H = 3.1, alto = H;
  const vw = ancho * 0.56, vh = 1.55, vx = -ancho / 2 + 0.25 + vw / 2, vy = 0.55 + vh / 2;
  const prod = ["#e94b3c", "#f2b134", "#2f8f5b", "#3d6fb5", "#f07aa8", "#8a4fbf", "#f5e2a8", "#d9612b"];
  const productos = useMemo(() => {
    const out: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [];
    for (let f = 0; f < 3; f++) {
      let xx = vx - vw / 2 + 0.08;
      let k = 0;
      while (xx < vx + vw / 2 - 0.1) {
        const w = 0.07 + rnd(f * 50 + k) * 0.09, h = 0.12 + rnd(f * 70 + k) * 0.14;
        out.push({ p: [xx + w / 2, vy - vh / 2 + 0.08 + f * 0.48 + h / 2, -0.32 + rnd(k + f) * 0.08], s: [w, h, 0.08], c: prod[(k * 3 + f) % prod.length] });
        xx += w + 0.015;
        k++;
      }
    }
    return out;
  }, [vx, vw, vy, vh]);
  const brillo = 0.85 + 0.05 * Math.sin(t * 2.3);
  return (
    <group>
      {/* pared con revoque */}
      <mesh position={[0, alto / 2, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[ancho + 0.6, alto + 0.4, 0.3]} />
        <meshStandardMaterial map={revoque} roughness={0.92} />
      </mesh>
      {/* zócalo */}
      <mesh position={[0, 0.25, -0.33]} receiveShadow>
        <boxGeometry args={[ancho + 0.6, 0.5, 0.06]} />
        <meshStandardMaterial color="#6f7a73" roughness={0.6} />
      </mesh>
      {/* interior iluminado de la vidriera */}
      <mesh position={[vx, vy, -0.45]}>
        <boxGeometry args={[vw, vh, 0.02]} />
        <meshStandardMaterial color="#fff2cf" emissive="#ffd892" emissiveIntensity={0.9 * noche * brillo} />
      </mesh>
      {[0, 1, 2].map((f) => (
        <mesh key={f} position={[vx, vy - vh / 2 + 0.07 + f * 0.48, -0.3]} castShadow receiveShadow>
          <boxGeometry args={[vw - 0.04, 0.025, 0.3]} />
          <meshStandardMaterial color="#d9d9d4" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {productos.map((q, i) => (
        <mesh key={i} position={q.p} geometry={cajaR(q.s[0], q.s[1], q.s[2], 0.012, 2)} castShadow>
          <meshPhysicalMaterial color={q.c} roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.25} />
        </mesh>
      ))}
      {/* vidrio */}
      <mesh position={[vx, vy, -0.14]}>
        <planeGeometry args={[vw, vh]} />
        <meshPhysicalMaterial color="#cfe6ff" transparent opacity={0.12} roughness={0.05} metalness={0} envMapIntensity={1.4} />
      </mesh>
      {/* marco de la vidriera y reja */}
      {[[vx, vy + vh / 2 + 0.03, vw + 0.1, 0.06], [vx, vy - vh / 2 - 0.03, vw + 0.1, 0.06]].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, -0.13]} castShadow><boxGeometry args={[w, h, 0.08]} /><meshStandardMaterial color="#25302b" metalness={0.7} roughness={0.35} /></mesh>
      ))}
      {Array.from({ length: 13 }, (_, i) => (
        <mesh key={i} position={[vx - vw / 2 + 0.06 + (i * (vw - 0.12)) / 12, vy, -0.08]} castShadow>
          <cylinderGeometry args={[0.011, 0.011, vh, 8]} />
          <meshStandardMaterial color="#1f2623" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* persiana (baja si persiana > 0) */}
      {persiana > 0 ? (
        <mesh position={[vx, vy + vh / 2 - (vh * persiana) / 2, -0.04]} castShadow>
          <boxGeometry args={[vw + 0.06, vh * persiana, 0.03]} />
          <meshStandardMaterial color="#a8aca6" metalness={0.75} roughness={0.4} />
        </mesh>
      ) : null}
      {/* puerta */}
      <mesh position={[ancho / 2 - 0.62, 1.05, -0.3]} geometry={cajaR(0.92, 2.1, 0.06, 0.02)} castShadow receiveShadow>
        <meshStandardMaterial color="#1e5a3d" roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh position={[ancho / 2 - 0.62, 1.32, -0.26]}>
        <planeGeometry args={[0.66, 1.1]} />
        <meshStandardMaterial color="#fff0c9" emissive="#ffd27a" emissiveIntensity={0.55 * noche} />
      </mesh>
      <mesh position={[ancho / 2 - 0.92, 1.02, -0.22]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.22, 12]} />
        <meshStandardMaterial color="#d4b878" metalness={1} roughness={0.2} />
      </mesh>
      {/* cartel luminoso */}
      <mesh position={[0, alto - 0.1, -0.22]} geometry={cajaR(ancho * 0.8, 0.5, 0.14, 0.03)} castShadow>
        <meshStandardMaterial color="#0c2f21" roughness={0.4} />
      </mesh>
      <mesh position={[0, alto - 0.1, -0.148]}>
        <planeGeometry args={[ancho * 0.76, 0.44]} />
        <meshStandardMaterial map={cartel} emissive="#ffffff" emissiveMap={cartel} emissiveIntensity={0.55 + 0.45 * noche} toneMapped />
      </mesh>
      {/* toldo inclinado con volado */}
      <group position={[0, 2.38, 0.05]}>
        <mesh rotation-x={0.42} position={[0, 0, 0.32]} castShadow receiveShadow>
          <boxGeometry args={[ancho + 0.2, 0.012, 0.8]} />
          <meshStandardMaterial map={toldo} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {Array.from({ length: 16 }, (_, i) => (
          <mesh key={i} position={[-ancho / 2 - 0.1 + (i + 0.5) * ((ancho + 0.2) / 16), -0.16, 0.69]} rotation-z={Math.PI} castShadow>
            <circleGeometry args={[(ancho + 0.2) / 32, 20, 0, Math.PI]} />
            <meshStandardMaterial color={i % 2 ? "#f3ead6" : "#1e7a4c"} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <mesh position={[0, -0.08, 0.69]}>
          <boxGeometry args={[ancho + 0.2, 0.16, 0.01]} />
          <meshStandardMaterial map={toldo} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* luz cálida que sale del local */}
      <pointLight position={[vx, vy, 0.6]} intensity={2.2 * noche} distance={5} decay={2} color="#ffcf8a" />
      <pointLight position={[ancho / 2 - 0.62, 1.4, 0.5]} intensity={1.2 * noche} distance={4} decay={2} color="#ffcf8a" />
    </group>
  );
};

/** Pila de billetes de $1.000 de `alto` metros (fajos de 100 billetes = 1 cm, apenas desalineados). Base en y = 0. */
export const PilaBilletes: React.FC<{ alto: number; t?: number; fantasma?: number }> = ({ alto, fantasma = 0 }) => {
  const cara = useLienzo("billete", 512, 228, dibujarBillete);
  const canto = useLienzo("canto", 256, 32, dibujarCanto);
  const n = Math.max(1, Math.round(alto * 100));
  const geo = useMemo(() => new THREE.BoxGeometry(0.156, 0.01, 0.07), []);
  const mats = useMemo(() => {
    const lado = new THREE.MeshStandardMaterial({ map: canto, roughness: 0.9 });
    const tapa = new THREE.MeshStandardMaterial({ map: cara, roughness: 0.75 });
    return [lado, lado, tapa, tapa, lado, lado];
  }, [cara, canto]);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mats, 600);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, [geo, mats]);
  const d = new THREE.Object3D();
  for (let i = 0; i < 600; i++) {
    if (i < n) {
      d.position.set((rnd(i) - 0.5) * 0.006, 0.005 + i * 0.01, (rnd(i + 99) - 0.5) * 0.004);
      d.rotation.set(0, (rnd(i + 7) - 0.5) * 0.14, 0);
      d.scale.set(1, 1, 1);
    } else d.scale.set(0, 0, 0);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
  }
  mesh.count = Math.min(600, n);
  mesh.instanceMatrix.needsUpdate = true;
  if (fantasma > 0) {
    return (
      <mesh position={[0, alto / 2, 0]}>
        <boxGeometry args={[0.16, alto, 0.075]} />
        <meshPhysicalMaterial color="#9fd6ff" transparent opacity={0.18 * fantasma} roughness={0.1} emissive="#4aa8ff" emissiveIntensity={0.25 * fantasma} depthWrite={false} />
      </mesh>
    );
  }
  return <primitive object={mesh} />;
};

/** Silueta de referencia de 1,75 m (plana, gris), de frente. */
export const Silueta: React.FC<{ alto?: number; color?: string }> = ({ alto = 1.75, color = "#8e9792" }) => {
  const forma = useMemo(() => {
    const s = new THREE.Shape();
    const k = alto / 1.75;
    const P = (x: number, y: number) => [x * k, y * k] as const;
    s.moveTo(...P(-0.08, 0));
    s.lineTo(...P(-0.13, 0));
    s.lineTo(...P(-0.15, 0.82));
    s.lineTo(...P(-0.2, 0.85));
    s.lineTo(...P(-0.26, 1.0));
    s.lineTo(...P(-0.28, 1.36));
    s.quadraticCurveTo(...P(-0.27, 1.46), ...P(-0.18, 1.47));
    s.lineTo(...P(-0.07, 1.5));
    s.lineTo(...P(-0.06, 1.55));
    s.quadraticCurveTo(...P(-0.11, 1.62), ...P(-0.09, 1.69));
    s.quadraticCurveTo(...P(0, 1.79), ...P(0.09, 1.69));
    s.quadraticCurveTo(...P(0.11, 1.62), ...P(0.06, 1.55));
    s.lineTo(...P(0.07, 1.5));
    s.lineTo(...P(0.18, 1.47));
    s.quadraticCurveTo(...P(0.27, 1.46), ...P(0.28, 1.36));
    s.lineTo(...P(0.26, 1.0));
    s.lineTo(...P(0.2, 0.85));
    s.lineTo(...P(0.15, 0.82));
    s.lineTo(...P(0.13, 0));
    s.lineTo(...P(0.08, 0));
    s.lineTo(...P(0.02, 0.8));
    s.lineTo(...P(-0.02, 0.8));
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 });
  }, [alto]);
  return (
    <mesh geometry={forma} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} />
    </mesh>
  );
};

/** Lona que tapa algo (tela con pliegues que tiembla). `tiembla` 0 → quieta. */
export const Lona: React.FC<{ alto: number; ancho?: number; t: number; tiembla?: number }> = ({ alto, ancho = 0.45, t, tiembla = 0 }) => {
  const geo = useMemo(() => new THREE.CylinderGeometry(ancho * 0.42, ancho * 0.62, alto, 40, 24, true), [alto, ancho]);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const base = useMemo(() => Float32Array.from(pos.array as Float32Array), [pos]);
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
    const a = Math.atan2(z, x);
    const pl = 1 + 0.08 * Math.sin(a * 7 + y * 3) + 0.03 * Math.sin(a * 13);
    const tb = 1 + tiembla * 0.04 * Math.sin(t * 38 + y * 9 + a * 3);
    pos.setXYZ(i, x * pl * tb, y, z * pl * tb);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <group position={[0, alto / 2, 0]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color="#5b5f57" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, alto / 2, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[ancho * 0.44, 32]} />
        <meshStandardMaterial color="#555a52" roughness={0.95} />
      </mesh>
    </group>
  );
};

/** Camión de reparto genérico (sin marca), con caja de carga abierta atrás. */
export const Camion3D: React.FC<{ t: number }> = () => (
  <group>
    <mesh position={[0, 1.35, 0]} geometry={cajaR(2.6, 1.9, 2.0, 0.06)} castShadow receiveShadow>
      <meshStandardMaterial color="#e9e6dd" roughness={0.5} metalness={0.1} />
    </mesh>
    <mesh position={[1.75, 0.95, 0]} geometry={cajaR(1.1, 1.3, 1.95, 0.12)} castShadow>
      <meshPhysicalMaterial color="#1e7a4c" roughness={0.3} clearcoat={0.8} />
    </mesh>
    <mesh position={[2.2, 1.2, 0]}>
      <boxGeometry args={[0.22, 0.55, 1.7]} />
      <meshPhysicalMaterial color="#a9c9e0" roughness={0.05} metalness={0.2} transparent opacity={0.6} />
    </mesh>
    {[[-0.8, 1], [-0.8, -1], [1.6, 1], [1.6, -1]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.38, z * 0.98]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.28, 24]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.8} />
      </mesh>
    ))}
  </group>
);

/** Cuaderno 3D (tapa que se cierra: `cierre` 0 abierto → 1 cerrado). */
export const Cuaderno3D: React.FC<{ cierre: number }> = ({ cierre }) => {
  const hojas = useLienzo("hojas", 512, 512, (x, w, h) => {
    x.fillStyle = "#fffdf4";
    x.fillRect(0, 0, w, h);
    x.strokeStyle = "#9cc3e8";
    x.lineWidth = 2;
    for (let y = 40; y < h; y += 28) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
    x.strokeStyle = "#f4b9b2";
    x.beginPath(); x.moveTo(50, 0); x.lineTo(50, h); x.stroke();
    x.fillStyle = "#1d3b8a";
    x.font = `700 22px "Permanent Marker", cursive`;
    ["Marta  $14.000", "Carlos  $9.500", "Juan  $8.000", "Rosa  $6.200", "Beto  $5.000"].forEach((s, i) => x.fillText(s, 62, 64 + i * 56));
  });
  return (
    <group>
      <mesh position={[0, 0.012, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.42, 0.024, 0.3]} />
        <meshStandardMaterial color="#14532f" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.0245, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.4, 0.28]} />
        <meshStandardMaterial map={hojas} roughness={0.9} />
      </mesh>
      <group position={[-0.21, 0.026, 0]} rotation-z={-Math.PI * (1 - cierre)}>
        <mesh position={[0.21, 0.004, 0]} castShadow>
          <boxGeometry args={[0.42, 0.008, 0.3]} />
          <meshStandardMaterial color="#1e7a4c" roughness={0.55} />
        </mesh>
      </group>
    </group>
  );
};

/** Celular 3D (cuerpo de aluminio y vidrio negro); la pantalla va como hijo (PantallaApp). Mide 7,8 × 16,2 cm. */
export const Celular3D: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <group>
    <mesh geometry={cajaR(0.078, 0.162, 0.008, 0.009, 4)} castShadow>
      <meshPhysicalMaterial color="#1b1d1f" metalness={0.85} roughness={0.25} clearcoat={1} />
    </mesh>
    <mesh position={[0, 0, 0.0041]}>
      <planeGeometry args={[0.075, 0.159]} />
      <meshBasicMaterial color="#050505" />
    </mesh>
    {children}
    <mesh position={[0, 0, 0.0048]}>
      <planeGeometry args={[0.072, 0.156]} />
      <meshPhysicalMaterial transparent opacity={0.025} roughness={0.02} color="#ffffff" depthWrite={false} />
    </mesh>
  </group>
);

/** Marca de altura con rótulo (línea fina horizontal y cartelito). */
export const Marca: React.FC<{ y: number; texto: string; color?: string; ancho?: number; activa?: number }> = ({ y, texto, color = "#e9eee9", ancho = 0.5, activa = 0 }) => {
  const tex = useLienzo(`marca-${texto}-${color}`, 512, 128, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = "rgba(10,20,16,0.82)";
    x.beginPath(); x.roundRect(4, 14, w - 8, h - 28, 24); x.fill();
    x.fillStyle = color;
    x.font = `800 ${h * 0.46}px "Inter", sans-serif`;
    x.textBaseline = "middle";
    x.fillText(texto, 26, h / 2 + 2);
  });
  const c = new THREE.Color(color).lerp(new THREE.Color("#ff3b30"), activa);
  return (
    <group position={[0, y, 0]}>
      <mesh position={[ancho / 2, 0, 0]}>
        <boxGeometry args={[ancho, 0.008, 0.008]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.4 + activa * 1.2} />
      </mesh>
      <mesh position={[ancho + 0.21, 0, 0]}>
        <planeGeometry args={[0.4, 0.1]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};

/** Regla vertical con una marca por metro (para medir la torre). */
export const Regla: React.FC<{ alto: number; visible: number }> = ({ alto, visible }) => (
  <group>
    <mesh position={[0, alto / 2, 0]} castShadow>
      <boxGeometry args={[0.03, alto, 0.03]} />
      <meshStandardMaterial color="#f2c14e" metalness={0.3} roughness={0.4} />
    </mesh>
    {Array.from({ length: Math.floor(alto) }, (_, i) => i + 1).map((m) => (m <= visible + 0.01 ? <Marca key={m} y={m} texto={`${m} m`} ancho={0.12} /> : null))}
  </group>
);

/** Polvo en el aire (puntos que flotan en un haz de luz; posiciones fijas por semilla). */
export const Polvo: React.FC<{ t: number; centro: [number, number, number]; radio?: number; n?: number; brillo?: number }> = ({ t, centro, radio = 0.8, n = 140, brillo = 1 }) => {
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = centro[0] + (rnd(i) - 0.5) * radio * 2 + Math.sin(t * 0.4 + i) * 0.03;
    arr[i * 3 + 1] = centro[1] + (rnd(i + 31) - 0.5) * radio * 2 + ((t * 0.04 + rnd(i + 5)) % 1) * 0.2;
    arr[i * 3 + 2] = centro[2] + (rnd(i + 77) - 0.5) * radio * 2;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.012} color="#fff2d0" transparent opacity={0.55 * brillo} depthWrite={false} />
    </points>
  );
};

/** Moneda (para el QR). */
export const Moneda3D: React.FC = () => (
  <mesh rotation-x={Math.PI / 2} castShadow>
    <cylinderGeometry args={[0.012, 0.012, 0.002, 24]} />
    <meshStandardMaterial color="#d8b25a" metalness={1} roughness={0.25} />
  </mesh>
);

/** Cartel de "Pagá con QR" en un atril (genérico). */
export const CartelQR3D: React.FC = () => {
  const tex = useLienzo("qr3d", 256, 320, (x, w, h) => {
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#1e7a4c"; x.fillRect(0, 0, w, 60);
    x.fillStyle = "#fff"; x.font = `800 30px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.fillText("PAGÁ CON QR", w / 2, 42);
    x.fillStyle = "#111";
    for (let i = 0; i < 15; i++) for (let j = 0; j < 15; j++) if (rnd(i * 15 + j) > 0.5 || (i < 4 && j < 4) || (i < 4 && j > 10) || (i > 10 && j < 4)) x.fillRect(38 + i * 12, 86 + j * 12, 11, 11);
  });
  return (
    <group>
      <mesh position={[0, 0.16, 0]} rotation-x={-0.25} geometry={cajaR(0.2, 0.25, 0.012, 0.01)} castShadow>
        <meshStandardMaterial color="#e9e9e4" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.16, 0.008]} rotation-x={-0.25}>
        <planeGeometry args={[0.18, 0.225]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
    </group>
  );
};

/** Piso de estudio infinito (curva de fondo) para planos de "producto". */
export const PisoEstudio: React.FC<{ color?: string }> = ({ color = "#1b2420" }) => (
  <mesh rotation-x={-Math.PI / 2} receiveShadow>
    <planeGeometry args={[80, 80]} />
    <meshStandardMaterial color={color} roughness={0.75} />
  </mesh>
);

/** Persiana metálica de todo el frente (tablillas, guías y tambor). `abierta` 1 = arriba del todo, 0 = toca el piso. */
export const PersianaFrente: React.FC<{ ancho: number; alto?: number; abierta: number; cartel?: boolean; grafiti?: boolean; chispas?: number; t?: number }> = ({ ancho, alto = 2.25, abierta, cartel = false, grafiti = false, chispas = 0, t = 0 }) => {
  const chapa = useLienzo(`persiana-${grafiti ? "g" : "l"}`, 512, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#b9bdb7"); g.addColorStop(1, "#9ea39d");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) { x.fillStyle = "rgba(60,64,60,0.55)"; x.fillRect(0, y, w, 3); x.fillStyle = "rgba(255,255,255,0.25)"; x.fillRect(0, y + 3, w, 2); }
    for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(90,70,50,${0.04 + rnd(i) * 0.06})`; x.fillRect(rnd(i + 1) * w, rnd(i + 2) * h, 2 + rnd(i + 3) * 10, 1 + rnd(i + 4) * 3); }
    if (grafiti) {
      x.lineCap = "round"; x.lineJoin = "round";
      [["#2b6fd6", 14], ["#e8473b", 10], ["#1f1f1f", 7]].forEach(([c, lw], k) => {
        x.strokeStyle = c as string; x.lineWidth = lw as number; x.beginPath();
        for (let i = 0; i < 9; i++) { const px = 40 + i * 50 + rnd(i + k * 20) * 20, py = 300 + Math.sin(i * 1.3 + k) * 60 + k * 30; i ? x.lineTo(px, py) : x.moveTo(px, py); }
        x.stroke();
      });
    }
  }, [Math.max(1, Math.round(ancho / 2)), 1]);
  const cartelTex = useLienzo("cartel-cerrado", 512, 220, (x, w, h) => {
    x.fillStyle = "#f5f1e6"; x.fillRect(0, 0, w, h);
    x.strokeStyle = "#c0261b"; x.lineWidth = 10; x.strokeRect(10, 10, w - 20, h - 20);
    x.fillStyle = "#c0261b"; x.font = `800 ${h * 0.5}px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("CERRADO", w / 2, h / 2 + 4);
  });
  const bajo = alto * (1 - clamp01(abierta));
  return (
    <group>
      {/* tambor arriba y guías a los costados */}
      <mesh position={[0, alto + 0.12, 0.02]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.13, 0.13, ancho + 0.1, 24]} /><meshStandardMaterial color="#868b85" metalness={0.75} roughness={0.4} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (ancho / 2 + 0.02), alto / 2, 0.02]} castShadow><boxGeometry args={[0.05, alto, 0.07]} /><meshStandardMaterial color="#5f6560" metalness={0.8} roughness={0.35} /></mesh>
      ))}
      {bajo > 0.01 ? (
        <mesh position={[0, alto - bajo / 2, 0.02]} castShadow receiveShadow>
          <boxGeometry args={[ancho, bajo, 0.03]} />
          <meshStandardMaterial map={chapa} metalness={0.55} roughness={0.45} />
        </mesh>
      ) : null}
      {bajo > 0.01 ? <mesh position={[0, alto - bajo + 0.02, 0.04]}><boxGeometry args={[ancho, 0.05, 0.05]} /><meshStandardMaterial color="#4c514d" metalness={0.8} roughness={0.3} /></mesh> : null}
      {cartel && bajo > 1.0 ? <mesh position={[ancho * 0.18, alto - bajo + 0.7, 0.04]} rotation-z={-0.04}><planeGeometry args={[0.7, 0.3]} /><meshStandardMaterial map={cartelTex} roughness={0.7} /></mesh> : null}
      {/* chispas en las guías cuando la persiana cae */}
      {chispas > 0
        ? Array.from({ length: 18 }, (_, i) => {
            const d = ((t * 3 + rnd(i)) % 1);
            const s = i % 2 ? 1 : -1;
            return (
              <mesh key={i} position={[s * (ancho / 2 + 0.02) + s * d * 0.25 * rnd(i + 3), alto - bajo + 0.02 - d * 0.4, 0.06 + d * 0.2 * rnd(i + 5)]}>
                <sphereGeometry args={[0.008, 6, 6]} />
                <meshBasicMaterial color="#ffd27a" toneMapped={false} transparent opacity={chispas * (1 - d)} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Calculadora de mostrador con la pantalla en "?????" (o un número). */
export const Calculadora3D: React.FC<{ pantalla: string }> = ({ pantalla }) => {
  const tex = useLienzo(`calc-${pantalla}`, 512, 128, (x, w, h) => {
    x.fillStyle = "#b8c4a8"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#1f2a1c"; x.font = `700 ${h * 0.72}px "Space Grotesk", monospace`; x.textAlign = "right"; x.textBaseline = "middle"; x.fillText(pantalla, w - 24, h / 2 + 4);
  });
  return (
    <group>
      <mesh position={[0, 0.015, 0]} geometry={cajaR(0.16, 0.03, 0.2, 0.012)} castShadow receiveShadow><meshPhysicalMaterial color="#2b2f2d" roughness={0.4} clearcoat={0.5} /></mesh>
      <mesh position={[0, 0.0305, -0.06]} rotation-x={-Math.PI / 2}><planeGeometry args={[0.13, 0.035]} /><meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.25} /></mesh>
      {Array.from({ length: 16 }, (_, k) => (
        <mesh key={k} position={[-0.048 + (k % 4) * 0.032, 0.033, -0.015 + Math.floor(k / 4) * 0.03]} geometry={cajaR(0.024, 0.008, 0.022, 0.004, 2)} castShadow><meshStandardMaterial color={k % 4 === 3 ? "#e9a400" : "#e8e5dc"} roughness={0.5} /></mesh>
      ))}
    </group>
  );
};

/** Caja registradora con cajón que se abre (`cajon` 0 → 1), brillo y lo que haya adentro (hijos, en el cajón). */
export const Registradora3D: React.FC<{ cajon: number; brillo?: number; children?: React.ReactNode }> = ({ cajon, brillo = 0, children }) => (
  <group>
    <mesh position={[0, 0.16, 0]} geometry={cajaR(0.46, 0.2, 0.42, 0.03)} castShadow receiveShadow><meshPhysicalMaterial color="#25302b" roughness={0.35} clearcoat={0.7} /></mesh>
    <mesh position={[0, 0.33, -0.08]} rotation-x={-0.5} geometry={cajaR(0.3, 0.16, 0.03, 0.01)} castShadow><meshStandardMaterial color="#1b1f1d" roughness={0.4} /></mesh>
    {Array.from({ length: 12 }, (_, k) => (
      <mesh key={k} position={[-0.12 + (k % 4) * 0.08, 0.265, 0.06 + Math.floor(k / 4) * 0.055]} geometry={cajaR(0.06, 0.018, 0.045, 0.006, 2)} castShadow><meshStandardMaterial color="#d8d4ca" roughness={0.6} /></mesh>
    ))}
    <group position={[0, 0.03, cajon * 0.3]}>
      <mesh geometry={cajaR(0.44, 0.06, 0.4, 0.008)} castShadow receiveShadow><meshStandardMaterial color="#2f3532" roughness={0.45} metalness={0.3} /></mesh>
      <mesh position={[0, 0.031, 0]} rotation-x={-Math.PI / 2}><planeGeometry args={[0.4, 0.36]} /><meshStandardMaterial color="#3a403c" roughness={0.6} /></mesh>
      <group position={[0, 0.034, 0]}>{children}</group>
    </group>
    {brillo > 0 ? <pointLight position={[0, 0.25, 0.4]} intensity={1.6 * brillo} distance={1.2} decay={2} color="#ffd890" /> : null}
    {brillo > 0 ? <mesh position={[0, 0.06, 0.215 + cajon * 0.3]}><boxGeometry args={[0.42, 0.004, 0.004]} /><meshBasicMaterial color="#ffe2a8" toneMapped={false} transparent opacity={brillo} /></mesh> : null}
  </group>
);

/** Papelito escrito a mano (`lineas`: [texto, tachado]). Mide 12 × 9 cm. */
export const Papelito: React.FC<{ lineas: [string, boolean][]; fecha: string }> = ({ lineas, fecha }) => {
  const tex = useLienzo(`papelito-${lineas.map((l) => l[0]).join("|")}`, 512, 384, (x, w, h) => {
    x.fillStyle = "#f6f1e2"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(120,100,60,${0.02 + rnd(i) * 0.04})`; x.fillRect(rnd(i + 1) * w, rnd(i + 2) * h, 3, 2); }
    x.strokeStyle = "rgba(120,160,210,0.5)"; x.lineWidth = 2;
    for (let y = 80; y < h; y += 70) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
    x.fillStyle = "#1d3b8a"; x.font = `400 26px "Permanent Marker", cursive`; x.fillText(fecha, 26, 52);
    lineas.forEach(([txt, tachado], i) => {
      const y = 140 + i * 110;
      x.save(); x.translate(28, y); x.rotate(-0.03 + i * 0.02);
      x.fillStyle = "#1d3b8a"; x.font = `400 ${i ? 44 : 50}px "Permanent Marker", cursive`; x.fillText(txt, 0, 0);
      if (tachado) { x.strokeStyle = "#1d3b8a"; x.lineWidth = 6; x.beginPath(); x.moveTo(-6, -14); x.lineTo(x.measureText(txt).width + 6, -20); x.stroke(); }
      x.restore();
    });
  });
  return (
    <mesh rotation-x={-Math.PI / 2} rotation-z={0.08}>
      <planeGeometry args={[0.12, 0.09]} />
      <meshStandardMaterial map={tex} roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
};

/** Factura pinchada en un clavo, con "+20%" marcado en rojo. */
export const FacturaClavo: React.FC<{ verde?: number }> = ({ verde = 0 }) => {
  const tex = useLienzo(`factura-clavo-${verde > 0.5 ? "v" : "r"}`, 384, 512, (x, w, h) => {
    x.fillStyle = "#fbfaf4"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#222"; x.font = `800 30px "Space Grotesk", monospace`; x.fillText("FACTURA B", 24, 52);
    x.font = `600 18px "Inter", sans-serif`; x.fillText("DISTRIBUIDORA DE EJEMPLO", 24, 82);
    for (let i = 0; i < 9; i++) { x.fillStyle = "#555"; x.fillRect(24, 120 + i * 34, 180 + rnd(i) * 80, 6); x.fillRect(w - 90, 120 + i * 34, 60, 6); }
    const c = verde > 0.5 ? "#16794a" : "#d92d20";
    x.strokeStyle = c; x.lineWidth = 7; x.beginPath(); x.ellipse(w - 110, 430, 90, 46, -0.1, 0, Math.PI * 2); x.stroke();
    x.fillStyle = c; x.font = `800 64px "Permanent Marker", cursive`; x.textAlign = "center"; x.fillText(verde > 0.5 ? "✓" : "+20%", w - 110, 452);
  });
  return (
    <group>
      <mesh position={[0, 0, 0.004]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.004, 0.004, 0.04, 8]} /><meshStandardMaterial color="#888" metalness={1} roughness={0.3} /></mesh>
      <mesh position={[0, -0.13, 0.006]} rotation-z={0.06}><planeGeometry args={[0.19, 0.25]} /><meshStandardMaterial map={tex} roughness={0.85} side={THREE.DoubleSide} /></mesh>
    </group>
  );
};

/** Auto usado genérico (sedán de 4,4 m, sin marca): carrocería con pintura brillante, vidrios, ruedas y faros. */
export const Auto3D: React.FC<{ color?: string; luces?: number; rueda?: number }> = ({ color = "#7a2a2a", luces = 0, rueda = 0 }) => (
  <group>
    <mesh position={[0, 0.55, 0]} geometry={cajaR(4.4, 0.62, 1.74, 0.16, 4)} castShadow receiveShadow><meshPhysicalMaterial color={color} roughness={0.25} metalness={0.5} clearcoat={1} clearcoatRoughness={0.08} /></mesh>
    <mesh position={[-0.15, 1.05, 0]} geometry={cajaR(2.3, 0.5, 1.6, 0.18, 4)} castShadow><meshPhysicalMaterial color={color} roughness={0.25} metalness={0.5} clearcoat={1} clearcoatRoughness={0.08} /></mesh>
    {/* vidrios */}
    <mesh position={[-0.15, 1.07, 0]} geometry={cajaR(2.2, 0.42, 1.62, 0.16, 4)}><meshPhysicalMaterial color="#1a2430" roughness={0.05} metalness={0.3} transparent opacity={0.85} /></mesh>
    {[-1.35, 1.35].map((x) => [-0.88, 0.88].map((z) => (
      <group key={`${x}${z}`} position={[x, 0.33, z]} rotation-x={Math.PI / 2}>
        <group rotation-y={rueda}>
          <mesh castShadow><cylinderGeometry args={[0.33, 0.33, 0.22, 28]} /><meshStandardMaterial color="#151515" roughness={0.85} /></mesh>
          <mesh position={[0, z > 0 ? 0.112 : -0.112, 0]}><cylinderGeometry args={[0.2, 0.2, 0.01, 24]} /><meshStandardMaterial color="#b8bcbf" metalness={0.9} roughness={0.25} /></mesh>
        </group>
      </group>
    )))}
    {[-0.6, 0.6].map((z) => (
      <mesh key={z} position={[2.2, 0.62, z]}><boxGeometry args={[0.02, 0.12, 0.32]} /><meshStandardMaterial color="#fff6dd" emissive="#fff3c4" emissiveIntensity={0.3 + 2 * luces} /></mesh>
    ))}
    {[-0.62, 0.62].map((z) => (
      <mesh key={`t${z}`} position={[-2.2, 0.66, z]}><boxGeometry args={[0.02, 0.1, 0.3]} /><meshStandardMaterial color="#8a1010" emissive="#ff2a1f" emissiveIntensity={0.4 + luces} /></mesh>
    ))}
  </group>
);

/** Hoja de calendario de pared con el mes (y el año) grande. */
export const HojaMes: React.FC<{ mes: string; anio?: string }> = ({ mes, anio = "" }) => {
  const tex = useLienzo(`mes-${mes}-${anio}`, 384, 448, (x, w, h) => {
    x.fillStyle = "#fbfaf6"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#d92d20"; x.fillRect(0, 0, w, 120);
    x.fillStyle = "#fff"; x.font = `800 62px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.fillText(mes, w / 2, 86);
    x.fillStyle = "#333"; x.font = `600 24px "Inter", sans-serif`;
    for (let i = 0; i < 30; i++) x.fillText(String(i + 1), 40 + (i % 7) * 50, 180 + Math.floor(i / 7) * 52);
    if (anio) { x.fillStyle = "#888"; x.font = `700 26px "Inter", sans-serif`; x.fillText(anio, w / 2, h - 20); }
  });
  return (
    <group>
      <mesh geometry={cajaR(0.4, 0.47, 0.012, 0.01, 2)} castShadow><meshStandardMaterial color="#e8e6df" roughness={0.6} /></mesh>
      <mesh position={[0, 0, 0.007]}><planeGeometry args={[0.38, 0.445]} /><meshStandardMaterial map={tex} roughness={0.7} /></mesh>
    </group>
  );
};

/** Lupa (aro metálico, mango y vidrio). */
export const Lupa3D: React.FC = () => (
  <group>
    <mesh><torusGeometry args={[0.32, 0.035, 16, 48]} /><meshStandardMaterial color="#2b2f2d" metalness={0.8} roughness={0.3} /></mesh>
    <mesh><circleGeometry args={[0.3, 48]} /><meshPhysicalMaterial color="#d8ecff" transparent opacity={0.18} roughness={0.02} /></mesh>
    <mesh position={[0.32, -0.32, 0]} rotation-z={Math.PI / 4}><cylinderGeometry args={[0.04, 0.05, 0.42, 16]} /><meshStandardMaterial color="#5a3320" roughness={0.6} /></mesh>
  </group>
);
