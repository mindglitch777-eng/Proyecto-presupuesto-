import React from "react";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { GUION_P3, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { entra, ritmo } from "../v8/comun";
import { Camara, Estudio, PantallaApp, Profundidad } from "../v8/estudio3d";
import { C } from "../v8/iconos";
import { CajaCarton, Celular3D, Contador3D, ManoBrazo, Registradora3D, Vereda } from "../v8/modelos3d";
import { Frase, Monto, Oferta, SUB_TOP } from "./comun";
import { Billete3D, BilleteFiado, CasaBarrio, HojaCalendario, KioscoInterior, TicketFiado, Vidrio3D } from "./modelos";

// Prueba piloto · Video 3 "Tu plata está en la calle". Cuenta (EJEMPLO): $96.000 pendientes de cobro ÷ $24.000 por día = 4 días.
// No es plata perdida: es plata fiada que todavía no volvió. Pantalla real: Fiados (demo p3): te deben $96.000 y el botón "Recordale por WhatsApp".

const g = GUION_P3;
const REG: [number, number, number] = [-0.75, 1.03, 0.3];
const VIDRIO_Z = 1.3;
const CEL: [number, number, number] = [0, 1.6, VIDRIO_Z];
const CASAS_Z = 15.4;
const CASAS = [-6.6, -3.3, 0, 3.3, 6.6];
const COLORES = ["#e7b7a0", "#9fc3b8", "#f0d58c", "#c6b3d8", "#e9c8a0"];
const MONTOS = ["$32.000", "$24.000", "$18.000", "$14.000", "$8.000"]; // = $96.000 (los mismos de la pantalla real)

type V3 = [number, number, number];
type Cam = { pos: V3; target: V3; fov: number };
const mez = (a: Cam, b: Cam, k: number): Cam => ({ pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, target: a.target.map((v, i) => v + (b.target[i] - v) * k) as V3, fov: a.fov + (b.fov - a.fov) * k });
const suave = (k: number) => { const x = clamp(k, 0, 1); return x * x * (3 - 2 * x); };
const r = (i: number, k: number) => { const x = Math.sin((i + 1) * 91.7 + k * 13.3) * 43758.5453; return x - Math.floor(x); };

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e, dur,
    afuera: w(0, "afuera", e[0] - 0.5),
    fiada: w(1, "fiada", l[1] + 0.4), cobraste: w(1, "cobraste", e[1] - 0.5),
    veinticuatro: w(2, "veinticuatro", l[2] + 0.6), son: w(2, "son", l[2] + 2.3), cuatro: w(2, "cuatro", l[2] + 2.6),
    esperando: w(3, "esperando", l[3] + 1.4), calle: w(3, "calle", e[3] - 0.4),
    fiados: w(4, "fiados", l[4] + 1.0), whatsapp: w(4, "whatsapp", e[4] - 0.6),
    primeros: w(5, "primeros", l[5] + 0.1),
  };
}
type T = ReturnType<typeof tiempos>;

/** Billetes fiados flotando en la calle (posición base de cada uno). */
const flotante = (i: number, t: number): V3 => [(r(i, 1) - 0.5) * 9, 1.0 + r(i, 2) * 2.2 + Math.sin(t * 1.3 + i) * 0.12, 4.2 + r(i, 3) * 7.5];

function camara(t: number, T: T): Cam {
  const { l, e } = T;
  const mostrador: Cam = { pos: [-0.25, 1.6, 1.8], target: [-0.4, 1.12, 0.35], fov: 50 };
  const calle: Cam = { pos: [0.2, 1.75, 2.6], target: [0.1, 2.3, 8.5], fov: 50 };
  if (t < l[1] - 0.05) return mez(mostrador, calle, suave((t - 0.45) / 1.1));
  if (t < l[2] - 0.05) {
    const k = suave((t - l[1]) / Math.max(1.5, e[1] - l[1] + 0.5));
    return mez(calle, { pos: [3.2, 1.6, 9.0], target: [1.5, 1.5, CASAS_Z], fov: 48 }, k);
  }
  if (t < l[3] - 0.05) {
    const k = suave((t - l[2]) / 0.8);
    return mez({ pos: [3.2, 1.6, 9.0], target: [1.5, 1.5, CASAS_Z], fov: 48 }, { pos: [0, 3.1, 3.2], target: [0, 1.5, 9.0], fov: 50 }, k);
  }
  if (t < l[4] - 0.05) {
    // adentro, detrás de la mano; después la cámara cruza la barrera y mira la plata suspendida
    const adentro: Cam = { pos: [0.8, 1.78, -0.05], target: [0.1, 1.45, 3], fov: 48 };
    const afuera: Cam = { pos: [0.5, 1.6, 3.6], target: [0.05, 1.55, VIDRIO_Z], fov: 46 };
    const c1 = mez({ pos: [0, 3.1, 3.2], target: [0, 1.5, 9.0], fov: 50 }, adentro, suave((t - l[3] + 0.05) / 0.5));
    const cruce = suave((t - (T.esperando - 0.2)) / 0.9);
    // al cruzar, la mira gira de la calle al kiosco
    return cruce <= 0 ? c1 : mez(c1, afuera, cruce);
  }
  if (t < l[5] - 0.05) {
    const k = suave((t - l[4]) / Math.max(1, e[4] - l[4] + 0.5));
    return mez({ pos: [0.5, 1.6, 3.6], target: [0.05, 1.55, VIDRIO_Z], fov: 46 }, { pos: [0, CEL[1], VIDRIO_Z + 1.35], target: [0, CEL[1], VIDRIO_Z], fov: 40 }, k);
  }
  const k = suave((t - l[5]) / 1.2);
  return mez({ pos: [0, CEL[1], VIDRIO_Z + 1.35], target: [0, CEL[1], VIDRIO_Z], fov: 40 }, { pos: [0.45, CEL[1] + 0.25, VIDRIO_Z + 2.0], target: [0.08, CEL[1] + 0.18, VIDRIO_Z - 0.3], fov: 44 }, k);
}

const Escena3D: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const { l, e } = T;
  const cam = camara(t, T);
  const foco = Math.hypot(cam.target[0] - cam.pos[0], cam.target[1] - cam.pos[1], cam.target[2] - cam.pos[2]);

  // 1. el billete sale del cajón y vuela a la calle
  const vb = clamp((t + 0.15) / 1.35, 0, 1);
  const b0: V3 = [REG[0], REG[1] + 0.25, REG[2] + 0.25], b1: V3 = [0.25, 2.2, 6.6];
  const billete: V3 = [b0[0] + (b1[0] - b0[0]) * vb, b0[1] + (b1[1] - b0[1]) * vb + Math.sin(vb * Math.PI) * 0.7, b0[2] + (b1[2] - b0[2]) * vb];
  const entrega = clamp((t + 0.3) / 0.9, 0, 1);
  // 2. billetes fiados → tickets en las puertas
  const aTicket = (i: number) => suave((t - (T.fiada + (i % 5) * 0.18)) / 0.9);
  // 3. cuatro días
  const dias = [T.son, T.cuatro, T.cuatro + 0.35, T.cuatro + 0.7];
  // 4. barrera y mano
  const vidrio = t >= l[3] - 0.1 ? entra((t - (l[3] + 0.3)) / 0.35) : 0;
  const aCel = suave((t - (l[4] - 0.2)) / 0.6);
  const estira = t >= l[3] && t < l[4] + 0.2 ? Math.min(1, (t - l[3]) / 1.4) : 0;
  return (
    <>
      <Camara c={cam} t={t} mano={t < 0.5 ? 2 : 1} />
      <Estudio fondo="#9ec3dc" niebla={[14, 40]} luz={0.6} calida={1.0} exposicion={1.05} principal={[3, 8, 6]} />
      <directionalLight position={[-6, 9, 14]} intensity={2.2} color="#ffd6a0" castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0.3, 2.9, 0.4]} intensity={4} distance={6} decay={1.6} color="#ffd59a" />
      <KioscoInterior luz="#cfe6ff" />
      <group position={[0, 0.004, 1.2]}><Vereda ancho={24} largo={4} /></group>
      <group position={[0, 0.004, CASAS_Z]} rotation-y={Math.PI}><Vereda ancho={24} largo={4} calle={false} /></group>
      {CASAS.map((x, i) => <group key={x} position={[x, 0, CASAS_Z]} rotation-y={Math.PI}><CasaBarrio color={COLORES[i]} semilla={i} /></group>)}
      {/* la caja del kiosco y la mano que entrega un producto */}
      <group position={REG} scale={[1.3, 1.3, 1.3]}><Registradora3D cajon={t < 2 ? 0.6 * entra((t + 0.3) / 0.3) : 0.6} /></group>
      {t < l[1] ? (
        <group position={[-0.05, 1.2, 0.1 + entrega * 0.55]} rotation-y={Math.PI / 2}>
          <ManoBrazo cierra={0.7} />
          <group position={[-0.12, 0.02, 0]}><CajaCarton w={0.14} h={0.1} d={0.08} rubro={0} /></group>
        </group>
      ) : null}
      {t < 1.3 ? <group position={billete} rotation={[vb * 5, vb * 7, vb * 3]}><Billete3D escala={1.5} /></group> : null}
      {/* $96.000 en la calle */}
      {t > 0.9 && t < l[2] ? (
        <group position={[0.1, 2.75 - (1 - entra((t - 0.9) / 0.4)) * 1.5, 7.2]} rotation-y={Math.PI + Math.sin(t * 0.7) * 0.06}>
          <group rotation-y={0}><Contador3D texto="$96.000" sub="PENDIENTE DE COBRO · EJEMPLO" color="#ffcf6b" ancho={2.0} /></group>
        </group>
      ) : null}
      {/* billetes fiados flotando; en "fiada" se vuelven tickets que van a las puertas */}
      {t > 0.6 && t < l[3] + 0.4 ? Array.from({ length: 15 }, (_, i) => {
        const p = flotante(i, t), k = aTicket(i);
        const casa = CASAS[i % 5];
        const puerta: V3 = [casa + 0.7 + ((Math.floor(i / 5) - 1) * 0.22), 1.45 + Math.floor(i / 5) * 0.12, CASAS_Z - 0.08];
        const pos: V3 = [p[0] + (puerta[0] - p[0]) * k, p[1] + (puerta[1] - p[1]) * k, p[2] + (puerta[2] - p[2]) * k];
        return (
          <group key={i} position={pos} rotation={[0, Math.PI + (1 - k) * Math.sin(t + i) * 0.6, (1 - k) * Math.sin(t * 1.7 + i) * 0.4]} scale={[1.8, 1.8, 1.8]}>
            {k < 0.5 ? <group rotation-y={Math.PI}><BilleteFiado /></group> : <group rotation-y={Math.PI}><TicketFiado monto={MONTOS[i % 5]} /></group>}
          </group>
        );
      }) : null}
      {/* cuatro días: calendarios sobre la calle */}
      {t >= l[2] - 0.2 && t < l[3] + 0.3 ? dias.map((a, i) => (
        <group key={i} position={[1.65 - i * 1.1, 1.0 + (1 - entra((t - (l[2] - 0.2) - i * 0.08) / 0.4)) * -1.2, 8.6]} rotation-y={Math.PI}>
          <mesh position={[0, -0.5, -0.05]} castShadow><boxGeometry args={[0.06, 1.0, 0.06]} /><meshStandardMaterial color="#333" metalness={0.7} /></mesh>
          <group position={[0, 0.25, 0]}><HojaCalendario arriba="DÍA" numero={String(i + 1)} abajo="$24.000 · EJEMPLO" activo={t > a ? 1 : 0} w={0.85} h={1.0} /></group>
        </group>
      )) : null}
      {/* la plata suspendida del otro lado de la barrera */}
      {t >= l[3] - 0.1 && t < l[5] ? Array.from({ length: 9 }, (_, i) => (
        <group key={i} position={[(r(i, 5) - 0.5) * 2.6, 1.1 + r(i, 6) * 1.1 + Math.sin(t * 1.6 + i) * 0.05, VIDRIO_Z + 0.35 + r(i, 7) * 1.3]} rotation={[Math.sin(t + i) * 0.3, Math.sin(t * 0.9 + i) * 0.45, Math.sin(t * 1.2 + i) * 0.4]} scale={[1.6 * (1 - aCel), 1.6 * (1 - aCel), 1.6 * (1 - aCel)]}>
          <BilleteFiado />
        </group>
      )) : null}
      {/* la mano del kiosquero que no llega */}
      {estira > 0 ? (
        <group position={[0.2, 1.45 + Math.sin(t * 6) * 0.01, VIDRIO_Z - 0.75 + estira * 0.62]} rotation-y={Math.PI / 2} rotation-x={-0.2}>
          <ManoBrazo cierra={0.1 + Math.sin(t * 4) * 0.1} />
        </group>
      ) : null}
      {/* la barrera transparente que se vuelve el celular */}
      {vidrio > 0 && aCel < 0.99 ? (
        <group position={[0, 1.35, VIDRIO_Z]} scale={[1 - 0.97 * aCel, 1 - 0.94 * aCel, 1]}>
          <Vidrio3D w={3.2} h={2.6} k={vidrio} />
        </group>
      ) : null}
      {aCel > 0.01 ? (
        <group position={CEL} scale={[5 * entra(aCel), 5 * entra(aCel), 5 * entra(aCel)]}>
          <Celular3D><PantallaApp t={t < T.whatsapp - 0.4 ? clamp(t - l[4], 0, 1.4) : 1.857 + clamp(t - (T.whatsapp - 0.4), 0, 2.9)} carpeta="tomas/p3" app0={0} rate={1} durGrab={4.858} /></Celular3D>
        </group>
      ) : null}
      <Profundidad foco={foco} apertura={0.012} max={0.01} />
    </>
  );
};

export const PlataEnLaCalle: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, durationInFrames / fps);
  const { l, e } = T;

  const manual = [0.03, T.afuera, T.fiada, T.cobraste, T.veinticuatro, T.son, T.cuatro, T.esperando, T.calle, T.fiados, T.whatsapp, T.primeros, l[6], l[7]];
  const cortes = [l[1], l[2], l[3], l[4], l[5]];
  const cam: Cam2D = camaraBeats(t, ritmo(pal, manual, [], 0.5), cortes, 0.4);
  const hs = temblor(t, [[0.0, 8], [1.0, 8], [T.fiada, 4], [T.cuatro, 6], [l[3] + 0.3, 6]]);
  let wf = 0;
  [[0.0, 0.25], [1.0, 0.2], [l[4] - 0.2, 0.3]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });

  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "calle", vol: 0.35 }, { en: 0, sfx: "cajon", vol: 0.6 }, { en: 0.05, sfx: "whoosh", vol: 0.6 }, { en: 1.0, sfx: "thump", vol: 0.75 },
    { en: l[1], sfx: "viento", vol: 0.3 }, ...[0, 1, 2, 3, 4].map((i) => ({ en: T.fiada + i * 0.18 + 0.8, sfx: "papel", vol: 0.3 })),
    { en: l[2], sfx: "whoosh", vol: 0.4 }, { en: T.veinticuatro, sfx: "click", vol: 0.4 }, ...[T.son, T.cuatro, T.cuatro + 0.35, T.cuatro + 0.7].map((a) => ({ en: a, sfx: "ding", vol: 0.4 })),
    { en: l[3] + 0.3, sfx: "vidrio", vol: 0.3 }, { en: l[3] + 0.3, sfx: "thump", vol: 0.45 }, { en: T.esperando, sfx: "heart", vol: 0.5 },
    { en: l[4] - 0.2, sfx: "glitch", vol: 0.35 }, { en: l[4] - 0.1, sfx: "whoosh", vol: 0.5 }, { en: T.fiados, sfx: "ding", vol: 0.45 }, { en: T.whatsapp, sfx: "click", vol: 0.5 },
    { en: l[5], sfx: "riser", vol: 0.3 }, { en: l[6], sfx: "click", vol: 0.45 }, { en: l[7], sfx: "whoosh", vol: 0.45 },
  ];
  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round((l[3] + 0.2) * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.1 * Math.min(1, Math.max(0, (l[3] + 0.2) * fps - f) / 10)} />
      </Sequence>
      <Sequence from={Math.round(l[4] * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(l[4] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.11 * Math.min(1, f / 8)} />
      </Sequence>
    </>
  );

  const frente = (
    <>
      <div style={{ left: 0, right: 0, top: 0, height: 170, background: "linear-gradient(#000a, #0000)" }} />
      {t < l[1] - 0.05 ? <Frase t={t} desde={-0.4} lineas={["Tu plata sigue afuera."]} top={74} size={25} /> : null}
      {t >= l[1] - 0.05 && t < l[2] - 0.05 ? <Frase t={t} desde={l[1] + 0.2} lineas={["Plata fiada:", "todavía no la cobraste."]} top={74} size={21} fondo={C.verde} color="#fff" /> : null}
      {t >= l[2] - 0.05 && t < l[3] - 0.05 ? (
        t < T.son - 0.05 ? <Monto t={t} desde={T.veinticuatro} texto="$24.000 por día" top={74} size={36} color="#ffd27a" /> : <Monto t={t} desde={T.son} texto="$96.000 = 4 días" top={74} size={36} color="#ffd27a" />
      ) : null}
      {t >= l[3] - 0.05 && t < l[4] - 0.05 ? <Frase t={t} desde={l[3]} lineas={["Cuatro días de resultado", "esperando en la calle."]} top={74} size={21} /> : null}
      {t >= l[4] - 0.05 && t < l[5] - 0.05 ? <Frase t={t} desde={l[4] + 0.3} lineas={["Ordená lo que te deben."]} top={70} size={22} fondo={C.ambar} color={C.tinta} /> : null}
      {t >= l[5] - 0.05 ? <Oferta t={t} desde={l[5]} top={70} /> : null}
      {t >= l[6] - 0.05 && t < l[7] - 0.05 ? <Frase t={t} desde={l[6]} lineas={["¿Cuánto tenés pendiente?"]} top={262} size={21} fondo={C.ambar} color={C.tinta} /> : null}
      {t >= l[7] - 0.05 ? <Frase t={t} desde={l[7]} lineas={["Mandáselo al que", "siempre fía."]} top={262} size={22} /> : null}
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[l[3] - 0.05, l[4] - 0.05], [l[6] - 0.05, 999]]} subTop={SUB_TOP}
      fondo={<div style={{ inset: 0, background: "#9ec3dc" }} />}
      tres={<Escena3D t={t} T={T} />}
      frente={frente}
      sobre={musica}
    />
  );
};
