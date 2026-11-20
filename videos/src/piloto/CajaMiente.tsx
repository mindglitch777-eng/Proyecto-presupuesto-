import React from "react";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { GUION_P1, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { entra, ritmo } from "../v8/comun";
import { Camara, Estudio, PantallaApp, Profundidad } from "../v8/estudio3d";
import { C } from "../v8/iconos";
import { Celular3D } from "../v8/modelos3d";
import { Frase, Monto, Oferta, SUB_TOP } from "./comun";
import { Billete3D, Bolsillo3D, CajaGigante, Cartel3D, Cinta, Conducto, KioscoInterior, Maquina3D, Recibo3D } from "./modelos";

// Prueba piloto · Video 1 "La caja miente". Cuenta (EJEMPLO): $180.000 − $126.000 (reposición) − $22.000 (gastos) = $32.000, antes de otros costos.
// Pantalla real: Tu día (demo p1): entró a la caja $32.000; con los fijos del día, la ganancia de hoy es $14.000.

const g = GUION_P1;
const CAJA: [number, number, number] = [0, 1.03, 0.25];
const CAJON_Z = CAJA[2] + 0.5; // frente del cajón cerrado
const IZQ: [number, number, number] = [-2.55, 0, 0.9]; // reposición: cinta con cajas
const DER: [number, number, number] = [2.45, 0, 0.9]; // gastos: máquina
const DELANTAL: [number, number, number] = [1.9, 1.15, 1.25];
const CEL_Y = CAJA[1] + 0.33; // celular gigante parado sobre el mostrador

type V3 = [number, number, number];
type Cam = { pos: V3; target: V3; fov: number };
const mez = (a: Cam, b: Cam, k: number): Cam => ({ pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, target: a.target.map((v, i) => v + (b.target[i] - v) * k) as V3, fov: a.fov + (b.fov - a.fov) * k });
const suave = (k: number) => { const x = clamp(k, 0, 1); return x * x * (3 - 2 * x); };

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e, dur,
    ochenta: w(0, "ochenta", 1.4), cuanto: w(0, "¿cuánto", 2.3),
    reposicion: w(1, "reposición", l[1] + 1.5), veintidos: w(1, "veintidós", l[1] + 2.2), gastos: w(1, "gastos", e[1] - 0.4),
    treinta: w(2, "treinta", l[2] + 0.2), costos: w(2, "costos", e[2] - 0.5),
    llena: w(3, "llena", l[3] + 0.6), bolsillo: w(3, "bolsillo", l[3] + 1.6), necesariamente: w(3, "necesariamente", e[3] - 0.8),
    dia: w(4, "día", l[4] + 0.9), registrados: w(4, "registrados", e[4] - 0.6),
    primeros: w(5, "primeros", l[5] + 0.1), siempre: w(5, "siempre", e[5] - 0.4),
    sabes: l[6], mandaselo: l[7],
  };
}
type T = ReturnType<typeof tiempos>;

/** Cuánta plata queda en el cajón (1 = $180.000). */
function lleno(t: number, T: T) {
  const r1 = entra((t - (T.l[1] + 0.3)) / Math.max(0.6, T.veintidos - T.l[1] - 0.3)); // se van $126.000
  const r2 = entra((t - (T.veintidos + 0.1)) / Math.max(0.5, T.e[1] - T.veintidos + 0.2)); // se van $22.000
  return 1 - (126 / 180) * r1 - (22 / 180) * r2;
}

/** La caja se deforma y se convierte en el celular. */
const morph = (t: number, T: T) => suave((t - (T.e[3] + 0.05)) / Math.max(0.5, T.l[4] - T.e[3] - 0.05));

function camara(t: number, T: T): Cam {
  const { l, e } = T;
  const cerca: Cam = { pos: [0.1, 1.72, 2.5], target: [0, 1.42, 0.55], fov: 50 };
  const general: Cam = { pos: [0.35, 2.05, 4.7], target: [0, 1.45, 0.3], fov: 46 };
  if (t < l[1] - 0.05) return mez(cerca, general, suave((t - (T.ochenta - 0.1)) / 1.1));
  if (t < l[2] - 0.05) {
    const centro: Cam = { pos: [0, 2.3, 5.4], target: [0, 1.35, 0.6], fov: 50 };
    const izq: Cam = { pos: [-1.3, 1.7, 4.6], target: [-1.9, 1.45, 0.6], fov: 50 };
    const der: Cam = { pos: [1.3, 1.7, 4.6], target: [1.9, 1.5, 0.6], fov: 50 };
    const c1 = mez(general, centro, suave((t - l[1]) / 0.6));
    const c2 = mez(c1, izq, suave((t - (T.reposicion - 0.5)) / 0.6));
    return mez(c2, der, suave((t - (T.veintidos - 0.2)) / 0.6));
  }
  if (t < l[3] - 0.05) {
    const abierta: Cam = { pos: [0, 2.35, 3.2], target: [0, 1.15, CAJON_Z + 0.4], fov: 46 };
    const pila: Cam = { pos: [0, 1.55, CAJON_Z + 1.35], target: [0, 1.13, CAJON_Z + 0.45], fov: 42 };
    return mez(mez({ pos: [1.3, 1.7, 4.6], target: [1.9, 1.5, 0.6], fov: 50 }, abierta, suave((t - l[2] + 0.05) / 0.5)), pila, suave((t - (T.treinta + 0.3)) / Math.max(0.8, e[2] - T.treinta)));
  }
  if (t < l[4] - 0.05) {
    const bols: Cam = { pos: [DELANTAL[0] - 0.1, DELANTAL[1] + 0.1, DELANTAL[2] + 1.75], target: [DELANTAL[0], DELANTAL[1] - 0.05, DELANTAL[2]], fov: 40 };
    const vuelta: Cam = { pos: [0, CEL_Y + 0.05, 2.6], target: [0, CEL_Y, CAJA[2]], fov: 42 };
    const c1 = mez({ pos: [0, 1.55, CAJON_Z + 1.35], target: [0, 1.13, CAJON_Z + 0.45], fov: 42 }, bols, suave((t - (T.llena + 0.1)) / 0.9));
    return mez(c1, vuelta, suave((t - (T.necesariamente + 0.1)) / Math.max(0.5, e[3] - T.necesariamente)));
  }
  if (t < l[5] - 0.05) {
    const k = suave((t - l[4]) / Math.max(1, e[4] - l[4] + 0.6));
    return { pos: [0.05 * Math.sin(t), CEL_Y + 0.02, 2.2 - 0.85 * k], target: [0, CEL_Y, CAJA[2]], fov: 40 };
  }
  // oferta: el celular adelante y el kiosco detrás
  const k = suave((t - l[5]) / 1.2);
  const atras: Cam = { pos: [0.55, CEL_Y + 0.25, 2.6], target: [0.15, CEL_Y + 0.05, CAJA[2]], fov: 44 };
  return mez({ pos: [0, CEL_Y + 0.02, 1.35], target: [0, CEL_Y, CAJA[2]], fov: 40 }, mez(atras, { pos: [0.3, CEL_Y + 0.12, 2.0], target: [0.05, CEL_Y + 0.02, CAJA[2]], fov: 42 }, suave((t - l[6]) / 4)), k);
}

/** Billetes que explotan del cajón en el cuadro 0. */
const Explosion: React.FC<{ t: number }> = ({ t }) => {
  const tau = t + 0.25;
  if (tau > 1.8) return null;
  return (
    <>
      {Array.from({ length: 34 }, (_, i) => {
        const r = (k: number) => { const x = Math.sin((i + 1) * 91.7 + k * 13.3) * 43758.5453; return x - Math.floor(x); };
        const v = [(r(1) - 0.5) * 2.6, 1.2 + r(2) * 2.2, 1.2 + r(3) * 2.6];
        const y = CAJA[1] + 0.15 + v[1] * tau - 2.6 * tau * tau;
        if (y < 0.1) return null;
        return (
          <group key={i} position={[(r(4) - 0.5) * 0.9 + v[0] * tau, y, CAJON_Z + 0.4 + v[2] * tau]} rotation={[tau * (3 + r(5) * 6), tau * (2 + r(6) * 5), tau * 4 + i]}>
            <Billete3D escala={1.8} />
          </group>
        );
      })}
    </>
  );
};

/** Corriente de billetes por un conducto, de `a` a `b`, entre t0 y t1. */
const Corriente: React.FC<{ t: number; t0: number; t1: number; a: V3; b: V3; n?: number }> = ({ t, t0, t1, a, b, n = 18 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const s = t0 + ((t1 - t0) * i) / n;
      const k = (t - s) / 0.55;
      if (k < 0 || k > 1) return null;
      return (
        <group key={i} position={[a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + Math.sin(k * Math.PI) * 0.12, a[2] + (b[2] - a[2]) * k]} rotation={[k * 6 + i, k * 4, k * 8]}>
          <Billete3D escala={1.6} />
        </group>
      );
    })}
  </>
);

const Escena3D: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const { l, e } = T;
  const cam = camara(t, T);
  const foco = Math.hypot(cam.target[0] - cam.pos[0], cam.target[1] - cam.pos[1], cam.target[2] - cam.pos[2]);
  const abre = t < 0.05 ? 0.42 : 0.55 + Math.sin(Math.max(0, t) * 14) * Math.exp(-t * 5) * 0.08;
  const ll = lleno(t, T);
  const crece = entra((t - (l[1] - 0.1)) / 0.45);
  const m = morph(t, T);
  const display = t < l[2] - 0.05 ? (t < l[1] + 0.3 ? "$180.000" : `$${Math.round((ll * 180)).toLocaleString("es-AR")}.000`) : "$32.000";
  const verMaquinas = t >= l[1] - 0.1 && t < l[3] + 0.5;
  return (
    <>
      <Camara c={cam} t={t} mano={t < 0.6 ? 2.5 : 1} />
      <Estudio fondo="#140f0a" niebla={[7, 24]} luz={0.5} calida={1.1} exposicion={1.0} principal={[2.5, 5, 4]} />
      <pointLight position={[0.4, 2.9, 2.0]} intensity={6} distance={7} decay={1.5} color="#ffd59a" castShadow shadow-mapSize={[1024, 1024]} />
      <spotLight position={[-2.5, 3.2, 3]} angle={0.5} penumbra={0.8} intensity={14} distance={10} color="#ffe9c2" target-position={[0, 1, 0]} castShadow />
      <KioscoInterior luz={t > T.l[4] ? "#ffd08a" : "#9fc8ff"} />
      {/* caja registradora gigante sobre el mostrador; al final se aplasta y se convierte en el celular */}
      {m < 0.98 ? (
        <group position={CAJA} scale={[1 - 0.94 * m, 1 + 0.4 * m - 0.95 * m * m, 1 - 0.9 * m]} rotation-y={m * 1.2}>
          <CajaGigante cajon={abre} lleno={ll} display={display} color={t >= l[2] - 0.05 ? "#ffcf6b" : "#4dff9a"} />
        </group>
      ) : null}
      {t < 1.6 ? <Explosion t={t} /> : null}
      {/* la caja se vuelve una máquina: conductos a reposición (cinta con cajas) y a gastos */}
      {verMaquinas ? (
        <>
          <group scale={[crece, crece, crece]} position={[0, 0, 0]}>
            <Conducto a={[-0.72, CAJA[1] + 0.12, CAJON_Z + 0.2]} b={[IZQ[0] + 0.5, 1.15, IZQ[2]]} radio={0.17} />
            <Conducto a={[0.72, CAJA[1] + 0.12, CAJON_Z + 0.2]} b={[DER[0] - 0.2, 1.62, DER[2]]} radio={0.15} />
          </group>
          <group position={IZQ}><Cinta t={t} largo={2.0} vel={0.8} /></group>
          <group position={DER}><Maquina3D t={t} gira={t > T.veintidos ? 2 : 0.4} luz={t > T.veintidos ? 1 : 0.3} /></group>
          <group position={[IZQ[0], 1.95, IZQ[2] - 0.35]} scale={[crece, crece, crece]}><Cartel3D titulo="REPOSICIÓN" monto="$126.000" fondo="#1d4ed8" w={1.3} h={0.62} brillo={t > T.reposicion - 0.2 ? 0.7 : 0.25} /></group>
          <group position={[DER[0], 2.15, DER[2] - 0.35]} scale={[crece, crece, crece]}><Cartel3D titulo="GASTOS" monto="$22.000" fondo="#b42318" w={1.1} h={0.55} brillo={t > T.veintidos - 0.2 ? 0.7 : 0.25} /></group>
          <Corriente t={t} t0={l[1] + 0.25} t1={T.veintidos} a={[-0.6, CAJA[1] + 0.2, CAJON_Z + 0.2]} b={[IZQ[0] + 0.4, 1.0, IZQ[2]]} n={22} />
          <Corriente t={t} t0={T.veintidos} t1={e[1] + 0.2} a={[0.6, CAJA[1] + 0.2, CAJON_Z + 0.2]} b={[DER[0] - 0.1, 1.5, DER[2]]} n={9} />
          {/* facturas y recibos que entran a la máquina de gastos */}
          {Array.from({ length: 6 }, (_, i) => {
            const k = (t - (T.veintidos + i * 0.22)) / 0.8;
            if (k < 0 || k > 1) return null;
            return <group key={i} position={[DER[0] + 0.9 - k * 0.9, 2.6 - k * 1.05, DER[2] + 0.2]} rotation={[0.2, k * 2, k * 3 + i]}><Recibo3D semilla={i} /></group>;
          })}
        </>
      ) : null}
      {/* el delantal colgado al lado del mostrador: el bolsillo casi vacío */}
      <group position={[DELANTAL[0], 0, DELANTAL[2] - 0.08]}>
        <mesh position={[0, 0.95, -0.06]} castShadow><cylinderGeometry args={[0.025, 0.025, 1.9, 12]} /><meshStandardMaterial color="#3b2a1e" roughness={0.6} /></mesh>
        <mesh position={[0, 1.88, 0]} castShadow><boxGeometry args={[0.45, 0.04, 0.04]} /><meshStandardMaterial color="#3b2a1e" roughness={0.6} /></mesh>
      </group>
      <group position={DELANTAL} scale={[0.75, 0.9, 1]} rotation-z={Math.sin(t * 0.8) * 0.01}><Bolsillo3D /></group>
      {/* el celular (aparece donde estaba la caja) */}
      {m > 0.05 ? (
        <group position={[0, CEL_Y, CAJA[2]]} scale={[4 * entra(m), 4 * entra(m), 4 * entra(m)]} rotation-y={(1 - m) * -1.2}>
          <Celular3D><PantallaApp t={clamp(t - l[4], 0, 3.3)} carpeta="tomas/p1" app0={0} rate={1} durGrab={5.518} /></Celular3D>
          {/* resalta "Entró a la caja: $32.000" (dato real de la pantalla, sin tocarlo) */}
          {t > T.dia ? (
            <group position={[0, 0.0245, 0.0052]}>
              {[[0, 0.0056, 0.066, 0.0007], [0, -0.0056, 0.066, 0.0007], [-0.033, 0, 0.0007, 0.0112], [0.033, 0, 0.0007, 0.0112]].map(([x, y, w, h], i) => (
                <mesh key={i} position={[x, y, 0]}><planeGeometry args={[w, h]} /><meshBasicMaterial color="#f5a524" toneMapped={false} transparent opacity={Math.min(1, (t - T.dia) * 3)} /></mesh>
              ))}
            </group>
          ) : null}
        </group>
      ) : null}
      <Profundidad foco={foco} apertura={0.014} max={0.01} />
    </>
  );
};

export const CajaMiente: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, durationInFrames / fps);
  const { l, e } = T;

  const manual = [0.03, T.ochenta, T.cuanto, l[1], T.reposicion, T.veintidos, T.gastos, T.treinta, T.costos, T.llena, T.bolsillo, T.dia, T.registrados, T.primeros, T.siempre, T.sabes, T.mandaselo];
  const cortes = [l[1], l[2], l[3], e[3], l[5]];
  const cam: Cam2D = camaraBeats(t, ritmo(pal, manual, [], 0.5), cortes, 0.4);
  const hs = temblor(t, [[0.0, 12], [T.ochenta, 6], [T.reposicion, 4], [T.veintidos, 4], [T.treinta, 5], [T.bolsillo, 6]]);
  let wf = 0;
  [[0.0, 0.35], [T.ochenta, 0.15], [e[3] + 0.3, 0.3]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });

  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "slam", vol: 0.8 }, { en: 0, sfx: "caja", vol: 0.7 }, { en: 0.02, sfx: "whoosh", vol: 0.6 }, { en: 0.05, sfx: "coins", vol: 0.5 },
    { en: T.ochenta, sfx: "thump", vol: 0.75 }, { en: T.cuanto, sfx: "heart", vol: 0.45 },
    { en: l[1] - 0.1, sfx: "metal", vol: 0.5 }, { en: l[1] + 0.1, sfx: "aspiradora", vol: 0.35 }, { en: T.reposicion, sfx: "whoosh", vol: 0.45 },
    ...Array.from({ length: 8 }, (_, i) => ({ en: l[1] + 0.4 + i * 0.4, sfx: "click", vol: 0.25 })),
    { en: T.veintidos, sfx: "whoosh", vol: 0.45 }, { en: T.veintidos + 0.2, sfx: "papel", vol: 0.45 }, { en: T.gastos, sfx: "caja", vol: 0.35 },
    { en: l[2], sfx: "whoosh", vol: 0.35 }, { en: T.treinta, sfx: "thump", vol: 0.55 }, { en: T.costos, sfx: "heart", vol: 0.5 },
    { en: T.bolsillo, sfx: "thump", vol: 0.7 }, { en: e[3] + 0.05, sfx: "glitch", vol: 0.4 }, { en: e[3] + 0.15, sfx: "whoosh", vol: 0.55 },
    { en: T.dia, sfx: "ding", vol: 0.5 }, { en: l[5], sfx: "riser", vol: 0.3 }, { en: T.siempre, sfx: "ding", vol: 0.45 },
    { en: T.sabes, sfx: "click", vol: 0.45 }, { en: T.mandaselo, sfx: "whoosh", vol: 0.45 },
  ];
  const corte = l[3] - 0.1;
  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(corte * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.11 * Math.min(1, Math.max(0, corte * fps - f) / 3)} />
      </Sequence>
      <Sequence from={Math.round(l[4] * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(l[4] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.11 * Math.min(1, f / 8)} />
      </Sequence>
    </>
  );

  const frente = (
    <>
      <div style={{ left: 0, right: 0, top: 0, height: 170, background: "linear-gradient(#000b, #0000)" }} />
      {t < l[1] - 0.05 ? (
        <>
          <Frase t={t} desde={-0.4} lineas={["Vendiste $180.000.", "¿Y?"]} top={78} size={28} />
          <div style={{ left: 0, right: 0, top: 160, textAlign: "center" }}><span style={{ position: "static", display: "inline-block", padding: "2px 8px", borderRadius: 6, background: C.ambar, color: C.tinta, font: "800 12px Inter, sans-serif", letterSpacing: ".1em" }}>EJEMPLO</span></div>
        </>
      ) : null}
      {t >= l[2] - 0.05 && t < l[3] - 0.05 ? <Monto t={t} desde={T.treinta} texto="$32.000" top={80} size={60} color="#ffd27a" sub="Antes de otros costos" /> : null}
      {t >= l[3] - 0.05 && t < l[4] - 0.05 ? (
        <>
          <Frase t={t} desde={l[3]} lineas={["La caja está llena."]} top={78} size={24} fondo={C.verde} color="#fff" />
          {t > T.bolsillo - 0.1 ? <Frase t={t} desde={T.bolsillo} lineas={["Tu bolsillo", "no necesariamente."]} top={130} size={24} /> : null}
        </>
      ) : null}
      {t >= l[4] - 0.05 && t < l[5] - 0.05 ? <Frase t={t} desde={l[4] + 0.2} lineas={["Entendé qué te queda."]} top={74} size={22} fondo={C.ambar} color={C.tinta} /> : null}
      {t >= l[5] - 0.05 ? <Oferta t={t} desde={l[5]} top={70} /> : null}
      {t >= l[6] - 0.05 && t < l[7] - 0.05 ? <Frase t={t} desde={l[6]} lineas={["¿Sabés cuánto te queda?"]} top={262} size={22} fondo={C.ambar} color={C.tinta} /> : null}
      {t >= l[7] - 0.05 ? <Frase t={t} desde={l[7]} lineas={["Mandáselo al kiosquero", "que mira solo la caja."]} top={262} size={20} /> : null}
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[l[3] - 0.05, l[4] - 0.05], [l[6] - 0.05, 999]]} subTop={SUB_TOP}
      fondo={<div style={{ inset: 0, background: "#140f0a" }} />}
      tres={<Escena3D t={t} T={T} />}
      frente={frente}
      sobre={musica}
    />
  );
};
