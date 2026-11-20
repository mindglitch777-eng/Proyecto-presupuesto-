import React, { useMemo } from "react";
import * as THREE from "three";
import { cajaR, dibujarBillete, useLienzo } from "../v8/estudio3d";
import { CajaCarton, GondolaPrecios, Reloj3D } from "../v8/modelos3d";

// Modelos de la prueba piloto (3 videos). Escala real: 1 unidad = 1 m. Sin marcas. Todo determinista.

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Billete suelto (genérico). */
export const Billete3D: React.FC<{ escala?: number }> = ({ escala = 1 }) => {
  const tex = useLienzo("billete-piloto", 256, 128, dibujarBillete);
  return <mesh castShadow scale={[escala, escala, escala]}><planeGeometry args={[0.16, 0.075]} /><meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.7} /></mesh>;
};

/** Cartel 3D con título, monto y "EJEMPLO" (canvas). */
export const Cartel3D: React.FC<{ titulo: string; monto?: string; color?: string; fondo?: string; w?: number; h?: number; ejemplo?: boolean; brillo?: number }> = ({
  titulo, monto = "", color = "#ffffff", fondo = "#14532d", w = 1.2, h = 0.5, ejemplo = true, brillo = 0.4,
}) => {
  const tex = useLienzo(`c3d|${titulo}|${monto}|${color}|${fondo}|${ejemplo}`, 1024, Math.round((1024 * h) / w), (x, cw, ch) => {
    x.fillStyle = fondo; x.fillRect(0, 0, cw, ch);
    x.strokeStyle = "#ffffff55"; x.lineWidth = 8; x.strokeRect(10, 10, cw - 20, ch - 20);
    x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = color;
    const filas = (monto ? 2 : 1) + (ejemplo ? 0.6 : 0);
    let y = ch / 2 - ((filas - 1) * ch) / (filas + 1.6) / 2 - (monto ? ch * 0.05 : 0);
    x.font = `800 ${Math.min(ch * (monto ? 0.24 : 0.42), (cw * 1.5) / Math.max(4, titulo.length))}px "Space Grotesk", sans-serif`;
    x.fillText(titulo, cw / 2, monto ? ch * 0.26 : y + (ejemplo ? -ch * 0.06 : 0));
    if (monto) { x.font = `800 ${Math.min(ch * 0.36, (cw * 1.7) / monto.length)}px "Space Grotesk", sans-serif`; x.fillText(monto, cw / 2, ch * 0.56); }
    if (ejemplo) {
      y = monto ? ch * 0.84 : ch * 0.78;
      x.font = `800 ${ch * 0.12}px "Inter", sans-serif`;
      const tw = x.measureText("EJEMPLO").width + 30;
      x.fillStyle = "#f5a524"; x.fillRect(cw / 2 - tw / 2, y - ch * 0.09, tw, ch * 0.18);
      x.fillStyle = "#1b1206"; x.fillText("EJEMPLO", cw / 2, y + 2);
    }
  });
  return (
    <group>
      <mesh geometry={cajaR(w + 0.04, h + 0.04, 0.06, 0.02, 3)} castShadow><meshStandardMaterial color="#1a1d1c" metalness={0.5} roughness={0.35} /></mesh>
      <mesh position={[0, 0, 0.031]}><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={brillo} roughness={0.5} /></mesh>
    </group>
  );
};

/** Bloque sólido con número (para dividir o pesar). */
export const Bloque3D: React.FC<{ texto: string; sub?: string; color?: string; w?: number; h?: number; d?: number; brillo?: number }> = ({ texto, sub = "EJEMPLO", color = "#f5c542", w = 0.5, h = 0.3, d = 0.3, brillo = 0 }) => {
  const tex = useLienzo(`blq|${texto}|${sub}|${color}`, 512, Math.round((512 * h) / w), (x, cw, ch) => {
    x.fillStyle = color; x.fillRect(0, 0, cw, ch);
    x.fillStyle = "#1b1206"; x.textAlign = "center"; x.textBaseline = "middle";
    x.font = `800 ${Math.min(ch * 0.42, (cw * 1.6) / texto.length)}px "Space Grotesk", sans-serif`; x.fillText(texto, cw / 2, ch * (sub ? 0.42 : 0.5));
    if (sub) { x.font = `800 ${ch * 0.15}px "Inter", sans-serif`; x.fillText(sub, cw / 2, ch * 0.8); }
  });
  return (
    <group>
      <mesh geometry={cajaR(w, h, d, 0.02, 3)} castShadow receiveShadow><meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.6} emissive={color} emissiveIntensity={brillo} /></mesh>
      <mesh position={[0, 0, d / 2 + 0.001]}><planeGeometry args={[w * 0.96, h * 0.92]} /><meshStandardMaterial map={tex} roughness={0.5} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.15 + brillo} /></mesh>
    </group>
  );
};

/** Interior de un kiosco de barrio: pared con guarda verde, góndolas, heladera de bebidas y ventana a la calle (`luz` = color de afuera). */
export const KioscoInterior: React.FC<{ luz?: string; intensidad?: number; mostrador?: boolean }> = ({ luz = "#ffcf8a", intensidad = 1, mostrador = true }) => {
  const pared = useLienzo("pared-kiosco", 512, 512, (x, w, h) => {
    x.fillStyle = "#e9dfcc"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(110,90,60,${0.03 + rnd(i) * 0.05})`; x.beginPath(); x.arc(rnd(i + 1) * w, rnd(i + 2) * h, 1 + rnd(i + 3) * 4, 0, 7); x.fill(); }
  }, [3, 2]);
  const botellas = ["#c0392b", "#e67e22", "#2980b9", "#27ae60", "#f1c40f", "#8e44ad"];
  return (
    <group>
      <mesh position={[0, 1.7, -1.2]} receiveShadow><planeGeometry args={[9, 3.4]} /><meshStandardMaterial map={pared} roughness={0.9} /></mesh>
      {[0.95, 2.95].map((y) => <mesh key={y} position={[0, y, -1.19]}><planeGeometry args={[9, 0.1]} /><meshStandardMaterial color="#1e7a4c" roughness={0.6} /></mesh>)}
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[12, 8]} /><meshStandardMaterial color="#8d8172" roughness={0.75} /></mesh>
      <group position={[-1.7, 0, -0.95]} scale={[0.95, 0.95, 0.95]}><GondolaPrecios giro={() => 1} /></group>
      <group position={[-0.35, 0, -0.95]} scale={[0.95, 0.95, 0.95]}><GondolaPrecios giro={() => 1} /></group>
      {/* heladera de bebidas */}
      <group position={[1.35, 0, -0.85]}>
        <mesh position={[0, 0.95, 0]} geometry={cajaR(0.8, 1.9, 0.6, 0.03)} castShadow><meshStandardMaterial color="#d7dbd8" metalness={0.4} roughness={0.35} /></mesh>
        {[0, 1, 2, 3].map((f) => Array.from({ length: 5 }, (_, k) => (
          <mesh key={`${f}${k}`} position={[-0.28 + k * 0.14, 0.4 + f * 0.38, 0.22]} castShadow><cylinderGeometry args={[0.035, 0.035, 0.24, 12]} /><meshPhysicalMaterial color={botellas[(f * 5 + k) % 6]} roughness={0.15} clearcoat={1} /></mesh>
        )))}
        <mesh position={[0, 0.98, 0.305]}><planeGeometry args={[0.7, 1.7]} /><meshPhysicalMaterial color="#dff3ff" transparent opacity={0.16} roughness={0.05} /></mesh>
        <pointLight position={[0, 1.2, 0.3]} intensity={0.8} distance={1.6} color="#dff3ff" />
      </group>
      {/* ventana a la calle */}
      <group position={[3.0, 1.6, -1.15]}>
        <mesh><planeGeometry args={[1.4, 1.3]} /><meshBasicMaterial color={luz} toneMapped={false} /></mesh>
        {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[-0.6 + i * 0.2, 0, 0.02]}><boxGeometry args={[0.03, 1.3, 0.03]} /><meshStandardMaterial color="#222" metalness={0.8} /></mesh>)}
        <pointLight position={[0, 0, 1.0]} intensity={3 * intensidad} distance={5} color={luz} />
      </group>
      {mostrador ? (
        <group position={[0, 0, 0.35]}>
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow><boxGeometry args={[3.2, 1.0, 0.7]} /><meshStandardMaterial color="#6b4a32" roughness={0.6} /></mesh>
          <mesh position={[0, 1.015, 0]} castShadow receiveShadow><boxGeometry args={[3.28, 0.03, 0.78]} /><meshPhysicalMaterial color="#d9d4c7" roughness={0.3} clearcoat={0.6} /></mesh>
          {/* frasco de caramelos */}
          <mesh position={[-1.2, 1.15, 0.05]} castShadow><cylinderGeometry args={[0.1, 0.1, 0.24, 24]} /><meshPhysicalMaterial color="#ffffff" transparent opacity={0.3} roughness={0.05} /></mesh>
          {Array.from({ length: 14 }, (_, i) => <mesh key={i} position={[-1.2 + (rnd(i) - 0.5) * 0.14, 1.06 + rnd(i + 4) * 0.14, 0.05 + (rnd(i + 8) - 0.5) * 0.14]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color={botellas[i % 6]} /></mesh>)}
        </group>
      ) : null}
    </group>
  );
};

/** Caja registradora gigante con display, cajón y montón de billetes adentro (`lleno` 0 → 1). */
export const CajaGigante: React.FC<{ cajon: number; lleno: number; display: string; color?: string }> = ({ cajon, lleno, display, color = "#4dff9a" }) => {
  const pantalla = useLienzo(`disp|${display}|${color}`, 512, 160, (x, w, h) => {
    x.fillStyle = "#040806"; x.fillRect(0, 0, w, h);
    x.fillStyle = color; x.shadowColor = color; x.shadowBlur = 16; x.textAlign = "center"; x.textBaseline = "middle";
    x.font = `700 ${h * 0.5}px "Space Grotesk", monospace`; x.fillText(display, w / 2, h * 0.42);
    x.shadowBlur = 0; x.font = `800 ${h * 0.17}px "Inter", sans-serif`; x.fillStyle = "#f5a524"; x.fillText("EJEMPLO", w / 2, h * 0.82);
  });
  const filas = Math.round(lleno * 9);
  return (
    <group>
      <mesh position={[0, 0.34, -0.05]} geometry={cajaR(1.5, 0.46, 1.1, 0.06)} castShadow receiveShadow><meshPhysicalMaterial color="#25302b" roughness={0.35} clearcoat={0.7} /></mesh>
      {/* teclado */}
      {Array.from({ length: 16 }, (_, k) => (
        <mesh key={k} position={[-0.42 + (k % 4) * 0.2, 0.585, 0.05 + Math.floor(k / 4) * 0.12]} geometry={cajaR(0.15, 0.04, 0.1, 0.015, 2)} castShadow><meshStandardMaterial color={k === 15 ? "#c0392b" : "#d8d4ca"} roughness={0.6} /></mesh>
      ))}
      {/* display */}
      <group position={[0, 0.95, -0.38]} rotation-x={-0.2}>
        <mesh geometry={cajaR(1.1, 0.4, 0.1, 0.03)} castShadow><meshStandardMaterial color="#1b1f1d" roughness={0.4} /></mesh>
        <mesh position={[0, 0, 0.051]}><planeGeometry args={[1.0, 0.31]} /><meshBasicMaterial map={pantalla} toneMapped={false} /></mesh>
        <pointLight position={[0, 0, 0.4]} intensity={1.6} distance={2} color={color} />
      </group>
      <mesh position={[0, 0.72, -0.38]} castShadow><cylinderGeometry args={[0.05, 0.07, 0.2, 16]} /><meshStandardMaterial color="#1b1f1d" /></mesh>
      {/* cajón */}
      <group position={[0, 0.07, cajon * 0.9]}>
        <mesh geometry={cajaR(1.44, 0.14, 1.0, 0.02)} castShadow receiveShadow><meshStandardMaterial color="#2f3532" roughness={0.45} metalness={0.3} /></mesh>
        <mesh position={[0, 0.071, 0]} rotation-x={-Math.PI / 2}><planeGeometry args={[1.36, 0.92]} /><meshStandardMaterial color="#20251f" roughness={0.7} /></mesh>
        {[-0.45, -0.15, 0.15, 0.45].map((x, c) => (
          <group key={c} position={[x, 0.075, 0]}>
            {Array.from({ length: Math.max(0, filas - (c % 2)) }, (_, i) => (
              <mesh key={i} position={[(rnd(c * 20 + i) - 0.5) * 0.02, 0.006 + i * 0.012, (rnd(c * 9 + i) - 0.5) * 0.03]} rotation-y={(rnd(i + c) - 0.5) * 0.1}>
                <boxGeometry args={[0.27, 0.011, 0.58]} />
                <meshStandardMaterial color={i % 3 === 0 ? "#7cc79a" : "#6fb88c"} roughness={0.8} />
              </mesh>
            ))}
          </group>
        ))}
        <mesh position={[0, 0.02, 0.51]} geometry={cajaR(0.3, 0.05, 0.04, 0.01)}><meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} /></mesh>
      </group>
    </group>
  );
};

/** Conducto (tubo de metal) con boca y cartel. Va de `a` a `b`. */
export const Conducto: React.FC<{ a: [number, number, number]; b: [number, number, number]; radio?: number }> = ({ a, b, radio = 0.18 }) => {
  const { pos, quat, largo } = useMemo(() => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { pos: va.clone().add(vb).multiplyScalar(0.5), quat: q, largo: dir.length() };
  }, [a, b]);
  return (
    <group position={pos} quaternion={quat}>
      <mesh><cylinderGeometry args={[radio, radio, largo, 32, 1, true]} /><meshPhysicalMaterial color="#dff1ff" transparent opacity={0.22} roughness={0.05} clearcoat={1} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      {[-0.5, 0, 0.5].map((f) => <mesh key={f} position={[0, f * largo * 0.9, 0]}><torusGeometry args={[radio * 1.04, 0.015, 8, 32]} /><meshStandardMaterial color="#4a555d" metalness={0.9} roughness={0.3} /></mesh>)}
    </group>
  );
};

/** Cinta transportadora con rodillos que giran y cajas que avanzan (`t` en s). Largo en x. */
export const Cinta: React.FC<{ t: number; largo?: number; vel?: number; cajas?: boolean }> = ({ t, largo = 2.4, vel = 0.6, cajas = true }) => {
  const n = 10;
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow><boxGeometry args={[largo, 0.04, 0.6]} /><meshStandardMaterial color="#23272a" roughness={0.8} /></mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[-largo / 2 + (i + 0.5) * (largo / n), 0.47, 0]} rotation-x={Math.PI / 2} rotation-y={t * vel * 20}><cylinderGeometry args={[0.04, 0.04, 0.62, 12]} /><meshStandardMaterial color="#9aa3a8" metalness={0.9} roughness={0.25} /></mesh>
      ))}
      {[-1, 1].map((s) => <mesh key={s} position={[0, 0.25, s * 0.32]} castShadow><boxGeometry args={[largo, 0.5, 0.04]} /><meshStandardMaterial color="#e2a32a" metalness={0.4} roughness={0.5} /></mesh>)}
      {cajas ? Array.from({ length: 5 }, (_, i) => {
        const x = ((t * vel + i * (largo / 5)) % largo) - largo / 2;
        return <group key={i} position={[x, 0.52, 0]}><CajaCarton w={0.34} h={0.26} d={0.34} rubro={i * 3 + 1} /></group>;
      }) : null}
    </group>
  );
};

/** Máquina de gastos: caja de metal con boca, engranajes que giran y luz roja. */
export const Maquina3D: React.FC<{ t: number; gira?: number; luz?: number }> = ({ t, gira = 1, luz = 0.5 }) => (
  <group>
    <mesh position={[0, 0.7, 0]} geometry={cajaR(1.0, 1.4, 0.8, 0.05)} castShadow receiveShadow><meshStandardMaterial color="#3c4a54" metalness={0.7} roughness={0.35} /></mesh>
    <mesh position={[0, 1.15, 0.41]}><planeGeometry args={[0.6, 0.18]} /><meshBasicMaterial color="#0a0a0a" /></mesh>
    {[[-0.25, 0.55, 0.16], [0.18, 0.62, 0.2], [0.0, 0.3, 0.12]].map(([x, y, r], i) => (
      <group key={i} position={[x, y, 0.42]} rotation-z={(i % 2 ? -1 : 1) * t * 3 * gira}>
        <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[r, r, 0.04, 24]} /><meshStandardMaterial color="#c9a227" metalness={1} roughness={0.3} /></mesh>
        {Array.from({ length: 10 }, (_, k) => <mesh key={k} rotation-z={(k / 10) * Math.PI * 2} position={[Math.cos((k / 10) * Math.PI * 2) * r, Math.sin((k / 10) * Math.PI * 2) * r, 0]}><boxGeometry args={[0.04, 0.04, 0.04]} /><meshStandardMaterial color="#c9a227" metalness={1} roughness={0.3} /></mesh>)}
      </group>
    ))}
    <mesh position={[0.38, 1.3, 0.41]}><circleGeometry args={[0.05, 16]} /><meshBasicMaterial color="#ff3b30" toneMapped={false} transparent opacity={0.4 + 0.6 * luz} /></mesh>
    <pointLight position={[0.38, 1.3, 0.7]} intensity={1.2 * luz} distance={1.5} color="#ff3b30" />
    <mesh position={[0, 1.55, -0.1]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.12, 0.12, 0.5, 16]} /><meshStandardMaterial color="#7a8a96" metalness={0.85} roughness={0.3} /></mesh>
  </group>
);

/** Recibo / factura de papel (plano con renglones). */
export const Recibo3D: React.FC<{ semilla?: number }> = ({ semilla = 0 }) => {
  const tex = useLienzo(`recibo|${semilla % 3}`, 192, 256, (x, w, h) => {
    x.fillStyle = "#f6f2e6"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#333"; x.font = `800 22px "Inter", sans-serif`; x.fillText(["FACTURA", "RECIBO", "LUZ"][semilla % 3], 16, 34);
    for (let i = 0; i < 8; i++) { x.fillStyle = "#999"; x.fillRect(16, 60 + i * 22, 90 + rnd(i + semilla) * 60, 6); x.fillRect(150, 60 + i * 22, 26, 6); }
  });
  return <mesh castShadow><planeGeometry args={[0.15, 0.2]} /><meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.9} /></mesh>;
};

/** Bolsillo de delantal (tela verde con costura y el bolsillo casi vacío: una moneda y un papelito). */
export const Bolsillo3D: React.FC = () => {
  const tela = useLienzo("delantal", 512, 512, (x, w, h) => {
    x.fillStyle = "#1e5a3a"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < h; i += 4) { x.fillStyle = `rgba(0,0,0,${0.05 + rnd(i) * 0.05})`; x.fillRect(0, i, w, 2); }
    for (let i = 0; i < w; i += 6) { x.fillStyle = "rgba(255,255,255,0.03)"; x.fillRect(i, 0, 2, h); }
  });
  const costura = useLienzo("costura", 512, 32, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = "#e9d8a6"; for (let i = 0; i < w; i += 24) x.fillRect(i, h / 2 - 2, 14, 4); });
  return (
    <group>
      <mesh receiveShadow><planeGeometry args={[1.2, 1.2, 16, 16]} /><meshStandardMaterial map={tela} roughness={0.95} /></mesh>
      {/* boca del bolsillo: la sombra adentro */}
      <mesh position={[0, 0.08, 0.004]}><planeGeometry args={[0.5, 0.06]} /><meshBasicMaterial color="#04140b" /></mesh>
      <mesh position={[0, -0.09, 0.012]} castShadow receiveShadow geometry={cajaR(0.56, 0.36, 0.02, 0.01, 2)}><meshStandardMaterial map={tela} roughness={0.95} /></mesh>
      {[0.1, -0.27].map((y) => <mesh key={y} position={[0, y, 0.024]}><planeGeometry args={[0.54, 0.02]} /><meshBasicMaterial map={costura} transparent /></mesh>)}
      {/* lo único que hay: una moneda asomando */}
      <mesh position={[0.12, 0.1, 0.01]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.025, 0.025, 0.004, 24]} /><meshStandardMaterial color="#c9a227" metalness={1} roughness={0.25} /></mesh>
    </group>
  );
};

/** Reloj de pared gigante con leyenda en el centro. */
export const RelojGigante: React.FC<{ hora: number; radio?: number; leyenda?: string; color?: string }> = ({ hora, radio = 1.0, leyenda = "", color = "#c0261b" }) => {
  const tex = useLienzo(`leyenda|${leyenda}|${color}`, 512, 160, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = color; x.beginPath(); x.roundRect(10, 20, w - 20, h - 40, 24); x.fill();
    x.fillStyle = "#fff"; x.font = `800 ${h * 0.4}px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(leyenda, w / 2, h / 2 + 2, w - 50);
  });
  return (
    <group>
      <Reloj3D hora={hora} radio={radio} />
      {leyenda ? <mesh position={[0, -radio * 0.38, 0.03]}><planeGeometry args={[radio * 0.95, radio * 0.3]} /><meshBasicMaterial map={tex} transparent toneMapped={false} /></mesh> : null}
    </group>
  );
};

/** Calendario de pie (bloque con hoja que se puede arrancar). */
export const HojaCalendario: React.FC<{ arriba: string; numero: string; abajo?: string; activo?: number; w?: number; h?: number }> = ({ arriba, numero, abajo = "", activo = 0, w = 0.6, h = 0.72 }) => {
  const tex = useLienzo(`cal|${arriba}|${numero}|${abajo}`, 384, Math.round((384 * h) / w), (x, cw, ch) => {
    x.fillStyle = "#fbfaf6"; x.fillRect(0, 0, cw, ch);
    x.fillStyle = "#d92d20"; x.fillRect(0, 0, cw, ch * 0.24);
    x.fillStyle = "#fff"; x.font = `800 ${ch * 0.13}px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(arriba, cw / 2, ch * 0.12, cw - 20);
    x.fillStyle = "#1c1c1c"; x.font = `800 ${ch * 0.42}px "Space Grotesk", sans-serif`; x.fillText(numero, cw / 2, ch * 0.56, cw - 20);
    if (abajo) { x.fillStyle = "#555"; x.font = `700 ${ch * 0.09}px "Inter", sans-serif`; x.fillText(abajo, cw / 2, ch * 0.88, cw - 20); }
  });
  return (
    <group>
      <mesh geometry={cajaR(w + 0.04, h + 0.04, 0.05, 0.015, 2)} castShadow><meshStandardMaterial color="#2b2f2d" roughness={0.5} /></mesh>
      <mesh position={[0, 0, 0.026]}><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex} roughness={0.7} emissive="#ffd27a" emissiveIntensity={activo * 0.35} /></mesh>
      {[-w / 3, w / 3].map((x) => <mesh key={x} position={[x, h / 2 + 0.01, 0.03]} rotation-x={Math.PI / 2}><torusGeometry args={[0.025, 0.006, 8, 16]} /><meshStandardMaterial color="#999" metalness={0.9} /></mesh>)}
      {activo > 0 ? <pointLight position={[0, 0, 0.5]} intensity={1.6 * activo} distance={1.6} color="#ffd27a" /> : null}
    </group>
  );
};

/** Balanza de dos platos. `inclina` en radianes (positivo = baja el plato derecho). Los hijos van en cada plato. */
export const Balanza3D: React.FC<{ inclina: number; izq?: React.ReactNode; der?: React.ReactNode; brazo?: number }> = ({ inclina, izq, der, brazo = 0.9 }) => {
  const metal = <meshStandardMaterial color="#c9a227" metalness={1} roughness={0.28} />;
  const plato = (lado: -1 | 1, hijo: React.ReactNode) => {
    const x = lado * brazo, y = -lado * Math.sin(inclina) * brazo;
    return (
      <group position={[x * Math.cos(inclina), 1.6 + y, 0]}>
        <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.006, 0.006, 0.5, 6]} />{metal}</mesh>
        <mesh position={[0, -0.5, 0]} castShadow receiveShadow><cylinderGeometry args={[0.3, 0.27, 0.04, 40]} />{metal}</mesh>
        <group position={[0, -0.48, 0]}>{hijo}</group>
      </group>
    );
  };
  return (
    <group>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow><cylinderGeometry args={[0.4, 0.46, 0.06, 40]} />{metal}</mesh>
      <mesh position={[0, 0.8, 0]} castShadow><cylinderGeometry args={[0.04, 0.05, 1.6, 16]} />{metal}</mesh>
      <mesh position={[0, 1.6, 0]} rotation-z={-inclina} castShadow><boxGeometry args={[brazo * 2.1, 0.05, 0.06]} />{metal}</mesh>
      <mesh position={[0, 1.66, 0]}><coneGeometry args={[0.06, 0.12, 16]} />{metal}</mesh>
      {plato(-1, izq)}
      {plato(1, der)}
    </group>
  );
};

/** Casa de barrio (frente): pared de color, puerta, ventana con reja y cornisa. */
export const CasaBarrio: React.FC<{ color: string; ancho?: number; alto?: number; semilla?: number }> = ({ color, ancho = 3.2, alto = 3.2, semilla = 0 }) => (
  <group>
    <mesh position={[0, alto / 2, -0.1]} castShadow receiveShadow><boxGeometry args={[ancho, alto, 0.2]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
    <mesh position={[0, alto + 0.06, 0]} castShadow><boxGeometry args={[ancho + 0.1, 0.14, 0.32]} /><meshStandardMaterial color="#e9e4d8" roughness={0.8} /></mesh>
    <mesh position={[-ancho * 0.22, 1.05, 0.01]} castShadow><boxGeometry args={[0.95, 2.1, 0.06]} /><meshStandardMaterial color={["#5a3b28", "#2f4f6f", "#4a5d3a"][semilla % 3]} roughness={0.6} /></mesh>
    <mesh position={[-ancho * 0.22 + 0.33, 1.05, 0.05]}><sphereGeometry args={[0.03, 12, 12]} /><meshStandardMaterial color="#c9a227" metalness={1} /></mesh>
    <group position={[ancho * 0.24, 1.6, 0.01]}>
      <mesh><planeGeometry args={[1.0, 1.0]} /><meshStandardMaterial color="#ffd89a" emissive="#ffb04a" emissiveIntensity={0.5} /></mesh>
      {Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[-0.42 + i * 0.17, 0, 0.03]}><boxGeometry args={[0.025, 1.0, 0.025]} /><meshStandardMaterial color="#1e1e1e" metalness={0.8} /></mesh>)}
    </group>
  </group>
);

/** Billete con etiquetita "FIADO" colgando. */
export const BilleteFiado: React.FC = () => {
  const tag = useLienzo("tag-fiado", 128, 64, (x, w, h) => {
    x.fillStyle = "#fff4d6"; x.fillRect(0, 0, w, h); x.strokeStyle = "#b03a2e"; x.lineWidth = 4; x.strokeRect(3, 3, w - 6, h - 6);
    x.fillStyle = "#b03a2e"; x.font = `800 30px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("FIADO", w / 2, h / 2 + 2);
  });
  return (
    <group>
      <Billete3D />
      <mesh position={[0.07, -0.06, 0.002]}><boxGeometry args={[0.002, 0.05, 0.002]} /><meshBasicMaterial color="#8a7a5a" /></mesh>
      <mesh position={[0.07, -0.1, 0.003]}><planeGeometry args={[0.07, 0.035]} /><meshStandardMaterial map={tag} side={THREE.DoubleSide} /></mesh>
    </group>
  );
};

/** Ticket de cuenta pendiente ("FIADO" + monto). */
export const TicketFiado: React.FC<{ monto: string }> = ({ monto }) => {
  const tex = useLienzo(`ticket|${monto}`, 192, 256, (x, w, h) => {
    x.fillStyle = "#fbf7ea"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#b03a2e"; x.font = `800 40px "Space Grotesk", sans-serif`; x.textAlign = "center"; x.fillText("FIADO", w / 2, 52);
    x.fillStyle = "#333"; x.font = `700 34px "Space Grotesk", sans-serif`; x.fillText(monto, w / 2, 130);
    x.fillStyle = "#888"; x.font = `700 20px "Inter", sans-serif`; x.fillText("pendiente", w / 2, 170);
    x.fillStyle = "#f5a524"; x.fillRect(w / 2 - 60, 196, 120, 30); x.fillStyle = "#1b1206"; x.font = `800 18px "Inter", sans-serif`; x.fillText("EJEMPLO", w / 2, 218);
  });
  return <mesh castShadow><planeGeometry args={[0.18, 0.24]} /><meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.85} /></mesh>;
};

/** Barrera de vidrio con marco y brillo (`k` 0 → 1 aparece). */
export const Vidrio3D: React.FC<{ w: number; h: number; k: number }> = ({ w, h, k }) => {
  if (k <= 0) return null;
  return (
    <group scale={[1, Math.max(0.01, k), 1]} position={[0, (h * (1 - k)) / 2, 0]}>
      <mesh><planeGeometry args={[w, h]} /><meshPhysicalMaterial color="#cfe8ff" transparent opacity={0.18} roughness={0.04} metalness={0.1} clearcoat={1} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      {[[0, h / 2], [0, -h / 2]].map(([x, y], i) => <mesh key={i} position={[x, y, 0]}><boxGeometry args={[w, 0.02, 0.02]} /><meshBasicMaterial color="#bfe3ff" toneMapped={false} /></mesh>)}
      {[-w / 2, w / 2].map((x) => <mesh key={x} position={[x, 0, 0]}><boxGeometry args={[0.02, h, 0.02]} /><meshBasicMaterial color="#bfe3ff" toneMapped={false} /></mesh>)}
      {/* reflejo diagonal */}
      <mesh position={[-w * 0.15, h * 0.1, 0.005]} rotation-z={0.6}><planeGeometry args={[0.08, h * 0.9]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.12} depthWrite={false} /></mesh>
    </group>
  );
};
