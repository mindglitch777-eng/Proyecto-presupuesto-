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
