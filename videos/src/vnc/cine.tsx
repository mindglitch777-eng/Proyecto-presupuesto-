import React, { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ExtrudeGeometry, ShapePath } from "three";
import opentype, { type Font } from "opentype.js";

// Look de cine para "Vendés, pero no cobrás": brillo (bloom) en luces y neón, profundidad de campo, aberración cromática,
// desenfoque radial en los golpes, viñeta, grano y gradación teal/naranja. Todo sale de `t` (determinista).

const Grado = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uT: { value: 0 },
    uCA: { value: 0.002 },
    uZoom: { value: 0 },
    uFlash: { value: 0 },
    uRojo: { value: 0 },
    uGrano: { value: 0.045 },
  },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uT, uCA, uZoom, uFlash, uRojo, uGrano; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    vec3 muestra(vec2 uv){
      vec2 d = uv - 0.5; float r = length(d);
      vec2 o = d * (uCA + r * uCA * 2.0);
      return vec3(texture2D(tDiffuse, uv + o).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - o).b);
    }
    void main(){
      vec3 c = vec3(0.0);
      // desenfoque radial (golpe de zoom): varias muestras hacia el centro
      if (uZoom > 0.001) { for (int i = 0; i < 8; i++) { float k = float(i) / 7.0; c += muestra(mix(vUv, vec2(0.5), k * uZoom)); } c /= 8.0; }
      else c = muestra(vUv);
      // gradación: sombras frías, luces cálidas, contraste
      float l = dot(c, vec3(0.299,0.587,0.114));
      c = mix(c * vec3(0.86,1.0,1.08), c * vec3(1.1,1.0,0.86), smoothstep(0.15, 0.75, l));
      c = (c - 0.5) * 1.12 + 0.5;
      c = mix(c, c * vec3(1.35,0.55,0.5), uRojo);
      // viñeta
      vec2 d = vUv - 0.5; c *= 1.0 - smoothstep(0.35, 0.95, length(d * vec2(1.0, 0.75))) * 0.75;
      // grano
      c += (h(vUv * 900.0 + uT * 61.0) - 0.5) * uGrano;
      c += uFlash;
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export type CineProps = { t: number; foco: number; apertura?: number; bloom?: number; ca?: number; zoom?: number; flash?: number; rojo?: number };

/** Cadena de posproceso: render → profundidad de campo → bloom → grado (CA, zoom radial, viñeta, grano) → salida. */
export const Cine: React.FC<CineProps> = ({ t, foco, apertura = 0.012, bloom = 0.9, ca = 0.0025, zoom = 0, flash = 0, rojo = 0 }) => {
  const { gl, scene, camera, size } = useThree();
  const comp = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    const b = new BokehPass(scene, camera, { focus: 5, aperture: 0.01, maxblur: 0.01 });
    c.addPass(b);
    const u = new UnrealBloomPass(new THREE.Vector2(540, 960), 0.6, 0.4, 0.88);
    c.addPass(u);
    c.addPass(new OutputPass());
    const g = new ShaderPass(Grado);
    c.addPass(g);
    return { c, b, u, g };
  }, [gl, scene, camera]);
  useEffect(() => {
    comp.c.setPixelRatio(gl.getPixelRatio());
    comp.c.setSize(size.width, size.height);
  }, [comp, gl, size]);
  const aplicar = () => {
    const ub = comp.b.uniforms as Record<string, { value: number }>;
    ub.focus.value = foco; ub.aperture.value = apertura; ub.maxblur.value = 0.012;
    comp.u.strength = bloom;
    const ug = comp.g.uniforms as Record<string, { value: number }>;
    ug.uT.value = t; ug.uCA.value = ca; ug.uZoom.value = zoom; ug.uFlash.value = flash; ug.uRojo.value = rojo;
  };
  aplicar();
  useFrame(() => { aplicar(); comp.c.render(); }, 1);
  return null;
};

// ---------- texto 3D extruido con la tipografía de la marca ----------

const fuentes = new Map<string, Font>();

/** Carga una tipografía TTF de public/fuentes (una vez). Se usa dentro del canvas: al llegar la fuente vuelve a dibujar (`advance`) antes de seguir. */
export function useFuente(archivo: string) {
  const advance = useThree((st) => st.advance);
  const [f, setF] = React.useState<Font | null>(() => fuentes.get(archivo) ?? null);
  const [h] = React.useState(() => (fuentes.has(archivo) ? null : delayRender(`fuente ${archivo}`)));
  React.useEffect(() => {
    if (f) return;
    fetch(staticFile(`fuentes/${archivo}`)).then((r) => r.arrayBuffer()).then((buf) => {
      const font = opentype.parse(buf);
      fuentes.set(archivo, font);
      setF(font);
    });
  }, [archivo, f]);
  React.useEffect(() => {
    if (!f || h === null) return;
    advance(performance.now());
    continueRender(h);
  }, [f, h, advance]);
  return f;
}

const geos = new Map<string, THREE.BufferGeometry>();

/** Geometría de texto extruido (centrada; alto de mayúscula ≈ `size` m). */
export function geoTexto(font: Font, texto: string, size: number, fondo: number) {
  const k = `${texto}|${size}|${fondo}`;
  if (geos.has(k)) return geos.get(k)!;
  const p = font.getPath(texto, 0, 0, size * 1.4);
  const sp = new ShapePath();
  for (const c of p.commands) {
    if (c.type === "M") sp.moveTo(c.x, -c.y);
    else if (c.type === "L") sp.lineTo(c.x, -c.y);
    else if (c.type === "Q") sp.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
    else if (c.type === "C") sp.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
  }
  const shapes = sp.toShapes();
  const g = new ExtrudeGeometry(shapes, { depth: fondo, curveSegments: 6, bevelEnabled: true, bevelThickness: fondo * 0.18, bevelSize: size * 0.025, bevelSegments: 3 });
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -fondo / 2);
  geos.set(k, g);
  return g;
}

/** Texto 3D macizo. */
export const Texto3D: React.FC<{ texto: string; size: number; fondo?: number; color?: string; metal?: number; brillo?: number; archivo?: string; encima?: boolean }> = ({ texto, size, fondo = 0.15, color = "#e02424", metal = 0.3, brillo = 0, archivo = "SpaceGrotesk-Bold.ttf", encima = false }) => {
  const font = useFuente(archivo);
  if (!font) return null;
  return (
    <mesh geometry={geoTexto(font, texto, size, fondo)} castShadow={!encima} receiveShadow={!encima} renderOrder={encima ? 20 : 0}>
      <meshPhysicalMaterial color={color} metalness={metal} roughness={0.28} clearcoat={0.8} emissive={color} emissiveIntensity={brillo} depthTest={!encima} depthWrite={!encima} />
    </mesh>
  );
};
