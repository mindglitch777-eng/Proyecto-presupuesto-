import React, { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Cam } from "../v3/ElDueno";

// Base 3D "render de producto" de la serie V8 (V8-05 a V8-07): reflejos de estudio (RoomEnvironment), luz suave con sombras,
// tono ACES y profundidad de campo (BokehPass). 1 unidad = 1 metro. Todo sale del tiempo: nada depende del cuadro anterior.

/** Luz de estudio: reflejos del entorno + luz principal con sombra suave + relleno + contraluz. */
export const Estudio: React.FC<{ calida?: number; exposicion?: number; fondo?: string; niebla?: [number, number]; luz?: number; principal?: [number, number, number] }> = ({ calida = 0.5, exposicion = 1, fondo, niebla, luz = 1, principal = [4, 7, 5] }) => {
  const { gl, scene } = useThree();
  const env = useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const tex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    return tex;
  }, [gl]);
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = exposicion;
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.environment = env;
  (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.55 * luz;
  scene.background = fondo ? new THREE.Color(fondo) : null;
  scene.fog = niebla && fondo ? new THREE.Fog(fondo, niebla[0], niebla[1]) : null;
  const tibio = new THREE.Color("#fff3e0").lerp(new THREE.Color("#ffd29a"), calida);
  return (
    <>
      <hemisphereLight args={["#f4f1ea", "#3b2f25", 0.35 * luz]} />
      <directionalLight position={principal} intensity={2.2 * luz} color={tibio} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-radius={6}
        shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-near={0.5} shadow-camera-far={40} />
      <directionalLight position={[-5, 3, 4]} intensity={0.55 * luz} color="#dfe8ff" />
      <directionalLight position={[0, 4, -6]} intensity={0.9 * luz} color="#ffffff" />
    </>
  );
};

/** Profundidad de campo: `foco` = distancia en metros desde la cámara al plano nítido; `apertura` chica = más nítido. */
export const Profundidad: React.FC<{ foco: number; apertura?: number; max?: number }> = ({ foco, apertura = 0.012, max = 0.012 }) => {
  const { gl, scene, camera, size } = useThree();
  const comp = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    const b = new BokehPass(scene, camera, { focus: 5, aperture: 0.01, maxblur: 0.01 });
    c.addPass(b);
    c.addPass(new OutputPass());
    return { c, b };
  }, [gl, scene, camera]);
  useEffect(() => {
    comp.c.setPixelRatio(gl.getPixelRatio());
    comp.c.setSize(size.width, size.height);
  }, [comp, gl, size]);
  const u = comp.b.uniforms as Record<string, { value: number }>;
  u.focus.value = foco;
  u.aperture.value = apertura;
  u.maxblur.value = max;
  useFrame(() => {
    u.focus.value = foco;
    u.aperture.value = apertura;
    u.maxblur.value = max;
    comp.c.render();
  }, 1);
  return null;
};

/** Cámara: posición, mira y lente (con un leve "aire" de cámara en mano que sale del tiempo). */
export const Camara: React.FC<{ c: Cam & { roll?: number }; t: number; mano?: number }> = ({ c, t, mano = 1 }) => {
  const cam = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  const a = 0.012 * mano;
  cam.fov = c.fov;
  cam.near = 0.05;
  cam.far = 200;
  cam.position.set(c.pos[0] + Math.sin(t * 0.9) * a * 3, c.pos[1] + Math.sin(t * 1.3 + 1) * a * 2, c.pos[2] + Math.cos(t * 0.7) * a * 2);
  cam.lookAt(c.target[0] + Math.sin(t * 1.1) * a, c.target[1] + Math.cos(t * 0.8) * a, c.target[2]);
  cam.rotateZ(c.roll ?? 0);
  cam.updateProjectionMatrix();
  return null;
};

/** Textura de canvas cacheada por clave (se dibuja una sola vez). */
export function useLienzo(clave: string, w: number, h: number, dibujar: (x: CanvasRenderingContext2D, w: number, h: number) => void, repetir?: [number, number]) {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    dibujar(cv.getContext("2d")!, w, h);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 8;
    if (repetir) {
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      tx.repeat.set(...repetir);
    }
    return tx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
}

/** Geometría de caja con bordes redondeados (cacheada). */
const cacheRB = new Map<string, THREE.BufferGeometry>();
export const cajaR = (w: number, h: number, d: number, r = 0.02, seg = 3) => {
  const k = `${w}|${h}|${d}|${r}|${seg}`;
  if (!cacheRB.has(k)) cacheRB.set(k, new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2)));
  return cacheRB.get(k)!;
};

/** Billete genérico de $1.000 (sin copiar el diseño oficial): cara del billete. */
export function dibujarBillete(x: CanvasRenderingContext2D, w: number, h: number) {
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#e9c28a");
  g.addColorStop(0.5, "#f3d7a7");
  g.addColorStop(1, "#d9a565");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  x.strokeStyle = "#8a5a2b";
  x.lineWidth = h * 0.03;
  x.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1);
  for (let i = 0; i < 40; i++) {
    x.strokeStyle = `rgba(138,90,43,${0.08 + (i % 3) * 0.03})`;
    x.lineWidth = 1.5;
    x.beginPath();
    x.ellipse(w * 0.68, h * 0.5, h * (0.1 + i * 0.008), h * (0.06 + i * 0.006), 0, 0, Math.PI * 2);
    x.stroke();
  }
  x.fillStyle = "#6b3f17";
  x.font = `800 ${h * 0.34}px "Space Grotesk", sans-serif`;
  x.fillText("1000", w * 0.07, h * 0.42);
  x.font = `700 ${h * 0.12}px "Inter", sans-serif`;
  x.fillText("MIL PESOS · EJEMPLO", w * 0.07, h * 0.86);
  x.fillStyle = "#c98d4a";
  x.beginPath();
  x.arc(w * 0.68, h * 0.5, h * 0.2, 0, Math.PI * 2);
  x.fill();
}

/** Canto de un fajo de 100 billetes (1 cm): hojitas finas y la faja de papel en el medio. */
export function dibujarCanto(x: CanvasRenderingContext2D, w: number, h: number) {
  x.fillStyle = "#e3b878";
  x.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 3) {
    const k = Math.sin(y * 12.9898) * 43758.5453;
    const r = k - Math.floor(k);
    x.fillStyle = r > 0.7 ? "#b9824a" : r > 0.4 ? "#f1d3a0" : "#d4a465";
    x.fillRect(0, y, w, 1.5);
  }
  // faja de papel del fajo
  x.fillStyle = "#f6efe0";
  x.fillRect(w * 0.42, 0, w * 0.16, h);
  x.fillStyle = "#c33d2e";
  x.fillRect(w * 0.47, 0, w * 0.06, h);
  // bordes más oscuros entre fajos
  x.fillStyle = "rgba(60,35,10,0.45)";
  x.fillRect(0, 0, w, h * 0.06);
}

/** Textura de una imagen de public/ (espera a que cargue y vuelve a dibujar la escena antes de sacar el cuadro). */
export function useImagen(src: string) {
  const advance = useThree((st) => st.advance);
  const [tex, setTex] = React.useState<THREE.Texture | null>(null);
  const [h] = React.useState(() => delayRender(`imagen ${src}`));
  React.useEffect(() => {
    new THREE.TextureLoader().load(staticFile(src), (t) => {
      // sin mipmaps: en el render por software (swangle) las fotos con mipmaps salen negras
      t.colorSpace = THREE.SRGBColorSpace;
      t.generateMipmaps = false;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.needsUpdate = true;
      setTex(t);
    }, undefined, () => continueRender(h));
  }, [src, h]);
  React.useEffect(() => {
    if (!tex) return;
    advance(performance.now());
    continueRender(h);
  }, [tex, advance, h]);
  return tex;
}

/** Un cuadro de la grabación como textura (se monta de nuevo en cada cuadro: `key` = archivo). */
const PlanoImagen: React.FC<{ src: string; w: number; h: number }> = ({ src, w, h }) => {
  const tex = useImagen(src);
  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      {tex ? <meshBasicMaterial key="foto" map={tex} toneMapped={false} /> : <meshBasicMaterial key="vacia" color="#f7f8f5" />}
    </mesh>
  );
};

/**
 * Pantalla de la app para el celular 3D: los cuadros de la grabación real (public/tomas/v8-0N/cuadros, 15 por segundo),
 * quietos en el primero antes de `app0` y en el último al terminar. w × h en metros (pantalla de 7,2 × 15,6 cm).
 */
export const PantallaApp: React.FC<{ t: number; carpeta: string; app0: number; rate: number; durGrab: number; w?: number; h?: number }> = ({ t, carpeta, app0, rate, durGrab, w = 0.072, h = 0.156 }) => {
  const total = Math.floor(durGrab * 15) - 1;
  const i = Math.max(0, Math.min(total, Math.floor((t - app0) * rate * 15)));
  const src = `${carpeta}/cuadros/c${String(i).padStart(3, "0")}.jpg`;
  return (
    <group position={[0, 0, 0.0045]}>
      <PlanoImagen key={src} src={src} w={w} h={h} />
    </group>
  );
};
