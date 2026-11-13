import React from "react";
import { rnd } from "../lib/anim";
import { useTex } from "./comun";

type V3 = [number, number, number];

const Mat: React.FC<{ c: string; r?: number; m?: number; e?: string; ei?: number }> = ({ c, r = 0.7, m = 0, e, ei = 0 }) => (
  <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e ?? "#000"} emissiveIntensity={ei} />
);

/**
 * El tacho monstruo: cuerpo de chapa con costillas, ojos que miran lo que viene, boca de dientes al frente
 * y la tapa con bisagra atrás. `mastica` aprieta y estira el cuerpo, `tapa` va de 0 (cerrada) a 1 (abierta),
 * `candado` de 0 a 1 y `eructo` infla el cuerpo de golpe.
 */
export const Tacho: React.FC<{ mastica: number; tapa: number; candado: number; eructo: number; mira: [number, number] }> = ({ mastica, tapa, candado, eructo, mira }) => {
  const sy = 1 - 0.12 * mastica + 0.12 * eructo;
  const sx = 1 + 0.09 * mastica + 0.1 * eructo;
  const boca = 0.32 + 0.5 * mastica + 0.3 * eructo;
  return (
    <group scale={[sx, sy, sx]}>
      {/* cuerpo */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 0.9, 2.4, 40]} />
        <Mat c="#3f7d68" r={0.45} m={0.45} />
      </mesh>
      {[0.55, 1.25, 1.95].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <torusGeometry args={[0.9 + (y / 2.4) * 0.2 + 0.01, 0.045, 10, 48]} />
          <Mat c="#2f5e4e" r={0.5} m={0.5} />
        </mesh>
      ))}
      {/* borde y boca de arriba */}
      <mesh position={[0, 2.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[1.1, 0.085, 14, 56]} />
        <Mat c="#8fb5a6" r={0.35} m={0.6} />
      </mesh>
      <mesh position={[0, 2.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.04, 40]} />
        <meshBasicMaterial color="#030504" />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.96, 2.2, Math.sin(a) * 0.96]} rotation={[Math.PI + Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]}>
            <coneGeometry args={[0.09, 0.34, 6]} />
            <Mat c="#f4efe2" r={0.4} />
          </mesh>
        );
      })}
      {/* ojos */}
      {[-0.4, 0.4].map((x, i) => (
        <group key={i} position={[x, 1.78, 0.97]}>
          <mesh scale={[1, 1, 0.55]}>
            <sphereGeometry args={[0.31, 24, 18]} />
            <Mat c="#ffffff" r={0.25} />
          </mesh>
          <mesh position={[mira[0] * 0.9, mira[1] * 0.9, 0.12]}>
            <sphereGeometry args={[0.14, 16, 12]} />
            <meshBasicMaterial color="#0a0a0a" />
          </mesh>
          <mesh position={[mira[0] * 0.9 + 0.04, mira[1] * 0.9 + 0.05, 0.25]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0.4, 0.1]} rotation={[0, 0, (i ? 1 : -1) * 0.45]}>
            <boxGeometry args={[0.5, 0.09, 0.08]} />
            <Mat c="#142b23" />
          </mesh>
        </group>
      ))}
      {/* boca del frente */}
      <group position={[0, 0.95, 1.01]}>
        <mesh scale={[1, boca, 1]}>
          <boxGeometry args={[1.25, 0.5, 0.1]} />
          <meshBasicMaterial color="#120305" />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-0.52 + i * 0.208, 0.25 * boca * 2 - 0.25 * boca * 1.0 - 0.02, 0.07]}>
            <boxGeometry args={[0.13, 0.15, 0.05]} />
            <Mat c="#f4efe2" r={0.4} />
          </mesh>
        ))}
        <mesh position={[0, -0.12 - 0.12 * mastica, 0.06]}>
          <sphereGeometry args={[0.28, 14, 10]} />
          <meshBasicMaterial color="#b0243a" />
        </mesh>
      </group>
      {/* tapa con bisagra */}
      <group position={[0, 2.42, -1.05]} rotation={[-tapa * 2.15, 0, 0]}>
        <mesh position={[0, 0.06, 1.05]} castShadow>
          <cylinderGeometry args={[1.18, 1.18, 0.11, 40]} />
          <Mat c="#4a9a80" r={0.4} m={0.5} />
        </mesh>
        <mesh position={[0, 0.2, 1.05]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.04, 8, 20]} />
          <Mat c="#8fb5a6" m={0.7} r={0.3} />
        </mesh>
      </group>
      {/* candado en el frente cuando la tapa está cerrada */}
      {candado > 0.01 ? (
        <group position={[0, 2.36, 1.2]} scale={candado}>
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.46, 0.38, 0.2]} />
            <Mat c="#FFB703" r={0.25} m={0.85} e="#FFB703" ei={0.25} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <torusGeometry args={[0.15, 0.04, 10, 24, Math.PI]} />
            <Mat c="#d9d9d9" r={0.2} m={0.9} />
          </mesh>
          <mesh position={[0, 0.03, 0.11]}>
            <circleGeometry args={[0.05, 12]} />
            <meshBasicMaterial color="#3a2600" />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

/** Cosas que se tiran: 0 caja de cartón, 1 paquete de golosinas, 2 lata/botella, 3 billete. */
export const Objeto: React.FC<{ kind: number; p: V3; rot: V3; s?: number; color?: string }> = ({ kind, p, rot, s = 1, color = "#e24a4a" }) => (
  <group position={p} rotation={rot} scale={s}>
    {kind === 0 ? (
      <>
        <mesh castShadow>
          <boxGeometry args={[0.95, 0.75, 0.75]} />
          <Mat c="#bf8d54" r={0.9} />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[0.97, 0.02, 0.16]} />
          <Mat c="#e8d4a6" r={0.8} />
        </mesh>
      </>
    ) : null}
    {kind === 1 ? (
      <>
        <mesh castShadow>
          <boxGeometry args={[0.58, 0.88, 0.14]} />
          <Mat c={color} r={0.45} />
        </mesh>
        <mesh position={[0, 0, 0.075]}>
          <boxGeometry args={[0.4, 0.18, 0.01]} />
          <Mat c="#fff6d9" r={0.5} />
        </mesh>
      </>
    ) : null}
    {kind === 2 ? (
      <>
        <mesh castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.8, 20]} />
          <Mat c={color} r={0.3} m={0.5} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.18, 0.26, 0.06, 20]} />
          <Mat c="#cfd4d6" r={0.25} m={0.8} />
        </mesh>
      </>
    ) : null}
    {kind === 3 ? (
      <>
        <mesh castShadow>
          <boxGeometry args={[0.95, 0.44, 0.02]} />
          <Mat c="#4fae72" r={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <boxGeometry args={[0.62, 0.28, 0.01]} />
          <Mat c="#8fd3a6" r={0.6} />
        </mesh>
      </>
    ) : null}
  </group>
);

/** Depósito: piso de cemento, fondo con estantes y pilas de cajas polvorientas. Las motas de polvo flotan solas. */
export const Deposito: React.FC<{ t: number; listo: boolean }> = ({ t, listo }) => {
  const pared = useTex("pared-dep", 512, 512, (x, w, h) => {
    x.fillStyle = "#4a4036";
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < 180; i++) {
      x.fillStyle = `rgba(${rnd(i) > 0.5 ? "255,240,210" : "0,0,0"},${0.025 + rnd(i + 9) * 0.05})`;
      x.fillRect(rnd(i + 3) * w, rnd(i + 5) * h, 20 + rnd(i + 7) * 80, 6 + rnd(i + 11) * 30);
    }
    x.strokeStyle = "rgba(0,0,0,.25)";
    x.lineWidth = 3;
    for (let j = 0; j < h; j += 64) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); }
  }, listo);
  const pilas: [number, number, number][] = [[-3.4, 0, -2.2], [-4.4, 0, -1.2], [3.6, 0, -2.0], [4.5, 0, -0.9], [-2.4, 0, -3.4], [2.2, 0, -3.6]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#6c6a66" roughness={1} />
      </mesh>
      <mesh position={[0, 5, -5.5]} receiveShadow>
        <planeGeometry args={[30, 12]} />
        <meshStandardMaterial map={pared} roughness={1} />
      </mesh>
      {/* estante de fondo */}
      {[1.2, 2.6, 4.0].map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, -5.2]} castShadow>
            <boxGeometry args={[11, 0.1, 0.9]} />
            <meshStandardMaterial color="#5c4630" roughness={0.9} />
          </mesh>
          {Array.from({ length: 7 }, (_, k) => (
            <mesh key={k} position={[-4.8 + k * 1.6 + rnd(i * 9 + k) * 0.3, y + 0.5, -5.2]} castShadow>
              <boxGeometry args={[1.0 + rnd(k + i) * 0.4, 0.8 + rnd(k * 3 + i) * 0.3, 0.7]} />
              <meshStandardMaterial color={["#b98a55", "#a8794a", "#c79a63"][(k + i) % 3]} roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}
      {/* pilas de cajas */}
      {pilas.map(([x, y, z], i) =>
        Array.from({ length: 3 + (i % 3) }, (_, k) => (
          <mesh key={`${i}-${k}`} position={[x + (rnd(i * 5 + k) - 0.5) * 0.3, y + 0.4 + k * 0.78, z]} rotation={[0, (rnd(i + k * 2) - 0.5) * 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 0.76, 1.0]} />
            <meshStandardMaterial color={["#b98a55", "#a8794a", "#c79a63"][(i + k) % 3]} roughness={1} />
          </mesh>
        )),
      )}
      {/* polvo en el aire */}
      {Array.from({ length: 44 }, (_, i) => (
        <mesh key={i} position={[-6 + rnd(i) * 12 + Math.sin(t * 0.4 + i) * 0.4, 0.4 + ((rnd(i + 20) * 7 + t * (0.12 + rnd(i + 40) * 0.25)) % 7), -3 + rnd(i + 60) * 9]}>
          <sphereGeometry args={[0.025 + rnd(i + 80) * 0.03, 6, 6]} />
          <meshBasicMaterial color="#f5e6c8" transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
};
