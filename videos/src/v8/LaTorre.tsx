import React from "react";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, eIO } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V8_05, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, camaraClaves, lineasDeVoz, temblor, type Cam2D, type Clave } from "../v6/comun";
import { Cartel, Etiqueta, Numero, Probalo, Rotulo, entra, latido, ritmo, sp, valorPasos } from "./comun";
import { Camara, Estudio, PantallaApp, Profundidad } from "./estudio3d";
import { C } from "./iconos";
import { Camion3D, CartelQR3D, Celular3D, Cuaderno3D, Kiosco3D, Lona, Marca, Moneda3D, PilaBilletes, Polvo, Regla, Silueta, Vereda } from "./modelos3d";

// V8-05 "La torre" (videos/guiones/V8-05-LA-TORRE.md). 3D "render de producto", escala real (1 unidad = 1 m).
// Lo que vende un kiosco en un año ($54.000.000) apilado en billetes de $1.000: 5,4 m. Se le arrancan bloques y queda una pilita de 85 cm.

const g = GUION_V8_05;
const VENDE = 54_000_000;
// bloques de abajo hacia arriba (alto en m = monto / 10.000.000: 0,1 mm por billete de $1.000)
const QUEDA = 8_460_000, QR = 1_080_000, FIADO = 2_880_000, ALQ = 6_480_000, MERC = 35_100_000;
const h = (m: number) => m / 10_000_000;
const SEG = [
  { nombre: "queda", monto: QUEDA },
  { nombre: "qr", monto: QR },
  { nombre: "fiado", monto: FIADO },
  { nombre: "alquiler", monto: ALQ },
  { nombre: "merc", monto: MERC },
].map((s, i, a) => ({ ...s, alto: h(s.monto), base: a.slice(0, i).reduce((x, y) => x + h(y.monto), 0) }));
const TORRE: [number, number, number] = [2.05, 0, 0.45];
const SILUETA: [number, number, number] = [2.62, 0, 0.5];
const CUADERNO: [number, number, number] = [1.25, 0, 1.5];
const QRPOS: [number, number, number] = [3.15, 0, 1.25];
const CAMION: [number, number, number] = [5.0, 0, 2.7];
const VECINO: [number, number, number] = [-4.9, 0, 0];
const TELEFONO: [number, number, number] = [2.62, 0.72, 0.95];
// grabación real de la app (app/scripts/grabar-v8.cjs v8-05)
const APP = { semana: 3.392, fin: 7.159 };

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  const T = {
    l, e, dur,
    anio: w(0, "año", 2.8),
    millones: w(1, "millones", l[1] + 1.1), cinco: w(1, "cinco", l[1] + 1.7), metros: w(1, "metros", l[1] + 2.9),
    hasta: w(2, "¿hasta", l[2] + 2.1),
    merc: w(3, "mercadería", l[3] + 0.2), treinta: w(3, "treinta", l[3] + 1.6),
    alq: w(4, "alquiler", l[4]), seis: w(4, "seis", l[4] + 0.75),
    fiado: w(5, "fiado", l[5] + 0.2), casi: w(5, "casi", l[5] + 1.6), qr: w(5, "qr", l[5] + 3.5), uno: w(5, "uno", l[5] + 4.4),
    pista: w(6, "pista", l[6] + 0.4), cintura: w(6, "cintura", l[6] + 2.3),
    ocho: l[7], ochenta: w(7, "ochenta", l[7] + 0.8), rodilla: w(7, "rodilla", l[7] + 4.3),
    tuyo: w(8, "tuyo", l[8] + 4.4), engane: w(8, "engañe", e[8] - 0.6),
    probalo: w(9, "probalo", l[9] + 1.8),
    LOOP: dur - 0.27,
  };
  return T;
}
type T = ReturnType<typeof tiempos>;

/** Momento en que sale cada bloque (de arriba hacia abajo). */
const salidas = (T: T) => ({ merc: T.merc + 0.25, alquiler: T.alq + 0.1, fiado: T.fiado + 0.1, qr: T.qr });
const restas = (T: T) => [
  { en: T.treinta, a: VENDE - MERC, txt: `− ${ars(MERC)} · mercadería` },
  { en: T.seis, a: VENDE - MERC - ALQ, txt: `− ${ars(ALQ)} · alquiler y luz` },
  { en: T.casi, a: VENDE - MERC - ALQ - FIADO, txt: `− ${ars(FIADO)} · fiado que no vuelve` },
  { en: T.uno, a: QUEDA, txt: `− ${ars(QR)} · comisión del QR` },
];

function claves(T: T): Clave[] {
  const { l } = T;
  const c0: Clave = { t: 0, pos: [2.75, 0.42, 1.55], target: [1.15, 2.45, -0.1], fov: 66 };
  return [
    c0,
    { t: l[1] - 0.05, pos: [2.8, 0.45, 1.42], target: [1.2, 2.5, -0.1], fov: 65 },
    { t: l[1] + 0.35, pos: [3.7, 0.9, 2.7], target: [2.05, 0.8, 0.45], fov: 42 },
    { t: T.metros + 0.9, pos: [3.5, 5.9, 2.5], target: [2.05, 5.3, 0.45], fov: 42 },
    { t: l[2] + 0.25, pos: [4.9, 1.45, 4.6], target: [2.3, 1.1, 0.45], fov: 46 },
    { t: l[3] - 0.1, pos: [4.6, 1.5, 4.3], target: [2.3, 1.1, 0.45], fov: 46 },
    { t: l[3] + 0.35, pos: [1.2, 3.1, 8.2], target: [3.7, 1.9, 1.6], fov: 58 },
    { t: l[4] - 0.1, pos: [1.5, 3.0, 7.9], target: [3.9, 1.8, 1.7], fov: 58 },
    { t: l[4] + 0.3, pos: [1.4, 1.8, 6.3], target: [-0.4, 1.3, 0.3], fov: 56 },
    { t: T.seis + 0.75, pos: [-1.7, 1.7, 5.4], target: [-4.5, 1.1, 0.0], fov: 54 },
    { t: l[5] - 0.1, pos: [-1.8, 1.7, 5.3], target: [-4.6, 1.1, 0.0], fov: 54 },
    { t: l[5] + 0.3, pos: [2.95, 1.3, 3.7], target: [1.75, 0.4, 1.15], fov: 48 },
    { t: T.qr - 0.3, pos: [3.1, 1.2, 3.5], target: [2.4, 0.45, 1.0], fov: 48 },
    { t: l[6] - 0.1, pos: [3.3, 1.1, 3.4], target: [2.6, 0.5, 0.95], fov: 48 },
    { t: l[6] + 0.3, pos: [3.95, 1.1, 3.4], target: [2.55, 0.85, 0.5], fov: 44 },
    { t: T.ocho, pos: [3.7, 1.0, 3.0], target: [2.5, 0.8, 0.5], fov: 42 },
    { t: T.ochenta - 0.05, pos: [1.0, 1.0, 2.7], target: [2.3, 0.75, 0.48], fov: 42 },
    { t: T.ochenta + 0.9, pos: [5.2, 2.6, 6.4], target: [2.2, 2.3, 0.45], fov: 52 },
    { t: l[8] - 0.1, pos: [5.4, 2.4, 6.1], target: [2.2, 2.2, 0.45], fov: 52 },
    { t: l[8] + 0.55, pos: [2.85, 0.8, 1.4], target: [2.62, 0.72, 0.95], fov: 35 },
    { t: l[9] - 0.1, pos: [2.77, 0.78, 1.33], target: [2.62, 0.72, 0.95], fov: 34 },
    { t: l[9] + 0.5, pos: [2.77, 0.43, 1.52], target: [1.17, 2.46, -0.1], fov: 65.5 },
    { ...c0, t: T.LOOP },
  ];
}

/** Bloque de la torre que sale volando hacia su destino (arco), girando hasta quedar acostado. */
function vuelo(t: number, desde: number, durar: number, de: [number, number, number], a: [number, number, number], arco = 1.2) {
  const k = eIO(clamp((t - desde) / durar, 0, 1));
  const p: [number, number, number] = [de[0] + (a[0] - de[0]) * k, de[1] + (a[1] - de[1]) * k + Math.sin(k * Math.PI) * arco, de[2] + (a[2] - de[2]) * k];
  return { p, k };
}

const Escena3D: React.FC<{ t: number; T: T; cam: ReturnType<typeof camaraClaves> }> = ({ t, T, cam }) => {
  const s = salidas(T);
  const ida = { merc: 1.5, alquiler: 1.1, fiado: 0.9, qr: 0.8 };
  // lona (re-gancho) y revelación
  const cae = entra((t - (T.l[6] + 0.05)) / 0.45);
  const arranca = clamp((t - T.ocho) / 0.6, 0, 1);
  const lonaY = (1 - cae) * 1.8 + arranca * arranca * 3.2;
  const tiembla = t > T.l[6] && t < T.cintura + 0.5 ? 0.6 + 0.4 * Math.sin(t * 3) : 0;
  const fantasma = entra((t - T.ochenta) / 0.6) * (t < T.l[8] + 0.4 ? 1 : 1 - clamp((t - T.l[8] - 0.4) / 0.4, 0, 1));
  const crece = 0.07 * entra((t - (T.tuyo - 0.6)) / 1.6);
  const silueta = entra((t - T.hasta) / 0.5) * (t < T.l[9] ? 1 : 0);
  const cuaderno = entra((t - (T.fiado - 0.4)) / 0.4) * (t < T.l[6] + 0.4 ? 1 : 0);
  const qrVisible = entra((t - (T.qr - 0.5)) / 0.4) * (t < T.l[6] + 0.4 ? 1 : 0);
  const persiana = entra((t - (T.seis + 0.35)) / 0.35);
  const camion = t > T.l[3] - 0.5 && t < T.l[4] + 0.8;
  const camionX = CAMION[0] + Math.max(0, t - (T.treinta + 0.9)) * 6;
  const reglaVis = clamp((t - T.l[1] - 0.3) / Math.max(0.5, T.metros + 0.7 - T.l[1] - 0.3), 0, 1) * 5.4;
  const enfoque = Math.hypot(cam.pos[0] - cam.target[0], cam.pos[1] - cam.target[1], cam.pos[2] - cam.target[2]);
  const deDia = 0;
  return (
    <>
      <Estudio fondo="#0b1116" niebla={[9, 34]} luz={0.42 + deDia} calida={0.9} exposicion={0.95} principal={[5, 8, 7]} />
      <Camara c={cam} t={t} />
      <pointLight position={[3.4, 3.8, 2.6]} intensity={6} distance={9} decay={1.6} color="#ffd9a0" castShadow shadow-mapSize={[1024, 1024]} />
      <Vereda largo={5} ancho={34} />
      <Kiosco3D t={t} />
      {/* local de al lado, con la persiana que se cierra sobre el alquiler */}
      <group position={VECINO}>
        <mesh position={[0, 1.75, -0.5]} castShadow receiveShadow><boxGeometry args={[3.6, 3.5, 0.3]} /><meshStandardMaterial color="#cfc6b6" roughness={0.9} /></mesh>
        <mesh position={[0.2, 1.1, -0.3]}><boxGeometry args={[2.4, 2.0, 0.05]} /><meshStandardMaterial color="#1a1d1b" roughness={0.9} /></mesh>
        <mesh position={[0.2, 2.1 - persiana, -0.24]} castShadow><boxGeometry args={[2.5, 2.0 * persiana + 0.04, 0.04]} /><meshStandardMaterial color="#a9ada7" metalness={0.75} roughness={0.38} /></mesh>
        <mesh position={[0.2, 2.18, -0.22]}><boxGeometry args={[2.6, 0.16, 0.12]} /><meshStandardMaterial color="#7c817a" metalness={0.6} roughness={0.4} /></mesh>
      </group>
      {/* la torre: cada bloque queda en su lugar hasta que sale */}
      {SEG.map((b, i) => {
        if (b.nombre === "queda") {
          return <group key={i} position={TORRE}><PilaBilletes alto={b.alto + crece} /></group>;
        }
        const desde = s[b.nombre as keyof typeof s], durar = ida[b.nombre as keyof typeof ida];
        if (t > desde + durar + 0.05) return null;
        const de: [number, number, number] = [TORRE[0], b.base, TORRE[2]];
        const destino: [number, number, number] =
          b.nombre === "merc" ? [CAMION[0] - 0.4, 2.35, CAMION[2]] : b.nombre === "alquiler" ? [VECINO[0] + 0.2, 0.3, VECINO[2] - 0.2] : b.nombre === "fiado" ? [CUADERNO[0], 0.03, CUADERNO[2]] : [QRPOS[0], 0.15, QRPOS[2]];
        const { p, k } = vuelo(t, desde, durar, de, destino, b.nombre === "merc" ? 2.5 : 0.9);
        const acuesta = b.nombre === "merc" ? -Math.PI / 2 * k : 0;
        const achica = b.nombre === "qr" || b.nombre === "fiado" ? 1 - 0.85 * k : 1;
        return (
          <group key={i} position={p} rotation-z={acuesta} scale={[achica, achica, achica]}>
            <PilaBilletes alto={b.alto} />
          </group>
        );
      })}
      {/* monedas que se van por el QR */}
      {t > s.qr && t < s.qr + 1.4
        ? Array.from({ length: 14 }, (_, i) => {
            const d = t - s.qr - i * 0.05;
            if (d < 0 || d > 0.6) return null;
            const kk = d / 0.6;
            return (
              <group key={i} position={[TORRE[0] + (QRPOS[0] - TORRE[0]) * kk, 0.95 - kk * 0.7 + Math.sin(kk * Math.PI) * 0.4, TORRE[2] + (QRPOS[2] - TORRE[2]) * kk + (i % 3 - 1) * 0.03]} rotation-y={d * 20}>
                <Moneda3D />
              </group>
            );
          })
        : null}
      {/* fantasma de la torre de 5,4 m */}
      {fantasma > 0 ? <group position={TORRE}><PilaBilletes alto={5.4} fantasma={fantasma} /></group> : null}
      {/* regla de metros (subida por la torre) */}
      {t > T.l[1] && t < T.l[2] + 0.6 ? <group position={[TORRE[0] - 0.22, 0, TORRE[2]]}><Regla alto={6} visible={reglaVis} /></group> : null}
      {/* silueta de referencia de 1,75 m con marcas */}
      {silueta > 0 ? (
        <group position={[SILUETA[0], 0, SILUETA[2] - (1 - silueta) * 0.4]} rotation-y={-0.35} scale={[1, silueta, 1]}>
          <Silueta />
          <group position={[0.3, 0, 0]}>
            <Marca y={1.75} texto="1,75 m" ancho={0.14} />
            <Marca y={1.05} texto="CINTURA" ancho={0.14} activa={t > T.cintura - 0.1 && t < T.ocho + 0.2 ? 0.5 + 0.5 * Math.round((Math.sin(t * 14) + 1) / 2) : 0} />
            <Marca y={0.55} texto="RODILLA" ancho={0.14} activa={t > T.rodilla - 0.05 ? 1 : 0} />
          </group>
        </group>
      ) : null}
      {/* lona que tapa lo que queda */}
      {t > T.l[6] && t < T.ocho + 0.7 ? (
        <group position={[TORRE[0], lonaY, TORRE[2]]} rotation-z={arranca * 0.9} rotation-x={arranca * 0.6}>
          <Lona alto={0.98} ancho={0.36} t={t} tiembla={tiembla} />
        </group>
      ) : null}
      {t > T.cintura && t < T.ocho + 1.2 ? <Polvo t={t} centro={[TORRE[0], 1.3, TORRE[2] + 0.2]} radio={0.7} brillo={t < T.ocho ? 1 : 1 - clamp(t - T.ocho, 0, 1)} /> : null}
      {cuaderno > 0 ? <group position={CUADERNO} scale={[cuaderno * 2.4, cuaderno * 2.4, cuaderno * 2.4]}><Cuaderno3D cierre={entra((t - (T.casi + 0.1)) / 0.3)} /></group> : null}
      {qrVisible > 0 ? <group position={QRPOS} rotation-y={-0.5} scale={[qrVisible * 1.5, qrVisible * 1.5, qrVisible * 1.5]}><CartelQR3D /></group> : null}
      {camion ? <group position={[camionX, 0, CAMION[2]]} rotation-y={0}><Camion3D t={t} /></group> : null}
      {/* el celular con la app, flotando al lado de la pilita */}
      {t > T.l[8] - 0.4 && t < T.l[9] + 0.6 ? (
        <group position={[TELEFONO[0], TELEFONO[1] + (1 - entra((t - T.l[8] + 0.4) / 0.7)) * -0.6 + Math.sin(t * 1.4) * 0.006, TELEFONO[2]]} rotation-y={-0.32 + Math.sin(t * 0.8) * 0.04} rotation-x={-0.05}>
          <Celular3D>
            <PantallaApp t={t} carpeta="tomas/v8-05" app0={T.l[8] + 0.4} rate={1} durGrab={APP.fin} />
          </Celular3D>
        </group>
      ) : null}
      <Profundidad foco={enfoque} apertura={0.012} max={0.011} />
    </>
  );
};

export const LaTorre: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, dur);
  const loop = t >= T.LOOP;
  const tw = loop ? 0 : t;
  const { l, e } = T;
  const sil0 = e[6] + 0.05;
  const cam3 = camaraClaves(tw, claves(T));
  const R = restas(T);
  const metros = [1, 2, 3, 4, 5].map((m) => T.l[1] + 0.3 + (m / 5.4) * (T.metros + 0.7 - T.l[1] - 0.3));

  const manual = [0.03, T.anio, T.millones, T.cinco, T.hasta, T.treinta, T.seis, T.casi, T.uno, T.pista, T.cintura, T.ocho, T.ochenta, T.rodilla, T.tuyo, T.probalo];
  const cortes = [l[2], l[3], l[4], l[5], l[8], l[9]];
  const cam: Cam2D = t > sil0 && t < T.ocho ? { z: 1.02, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : ritmo(pal, manual, [[sil0, T.ocho - 0.02], [T.LOOP - 0.4, 999]]), loop ? [] : cortes, 0.45);
  const hs = loop ? 0 : temblor(t, [[0.03, 8], [s(T).merc + 1.5, 7], [T.ocho, 10], [T.treinta, 5]]);
  let wf = 0;
  if (!loop) [[T.ocho, 0.3]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });

  // ---------- sonido ----------
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, { en: 0.02, sfx: "coins", vol: 0.4 }, { en: 0, sfx: "calle", vol: 0.35 },
    ...cortes.map((a) => ({ en: a - 0.12, sfx: "whoosh", vol: 0.35 })),
    { en: l[1] + 0.2, sfx: "riser", vol: 0.3 }, ...metros.map((a) => ({ en: a, sfx: "click", vol: 0.55 })),
    { en: T.hasta, sfx: "thump", vol: 0.5 }, { en: T.hasta + 0.5, sfx: "heart", vol: 0.45 },
    { en: s(T).merc, sfx: "papel_arrancado", vol: 0.5 }, { en: s(T).merc + 0.2, sfx: "whoosh", vol: 0.5 }, { en: s(T).merc + 1.5, sfx: "thump", vol: 0.6 },
    { en: s(T).alquiler, sfx: "whoosh", vol: 0.45 }, { en: T.seis + 0.35, sfx: "metal", vol: 0.5 }, { en: T.seis + 0.7, sfx: "thump", vol: 0.5 },
    { en: s(T).fiado, sfx: "whoosh", vol: 0.4 }, { en: T.casi + 0.1, sfx: "hoja", vol: 0.6 }, { en: T.casi + 0.4, sfx: "thump", vol: 0.45 },
    { en: s(T).qr, sfx: "coins", vol: 0.55 }, { en: T.uno, sfx: "thump", vol: 0.45 },
    ...R.map((r) => ({ en: r.en + 0.4, sfx: "click", vol: 0.45 })),
    { en: l[6] + 0.05, sfx: "papel", vol: 0.5 }, { en: l[6] + 0.5, sfx: "thump", vol: 0.4 },
    ...Array.from({ length: Math.max(0, Math.floor((sil0 - l[6] - 0.8) / 0.55)) }, (_, i) => ({ en: l[6] + 0.8 + i * 0.55, sfx: "heart", vol: 0.45 + i * 0.02 })),
    { en: T.ocho, sfx: "papel_arrancado", vol: 0.6 }, { en: T.ocho + 0.05, sfx: "thump", vol: 0.65 }, { en: T.ochenta + 0.1, sfx: "riser", vol: 0.3 }, { en: T.rodilla, sfx: "slam", vol: 0.45 },
    { en: l[8] - 0.1, sfx: "whoosh", vol: 0.45 }, { en: l[8] + 0.55, sfx: "ding", vol: 0.4 }, { en: T.tuyo, sfx: "ding", vol: 0.45 }, { en: l[8] + 0.4 + APP.semana, sfx: "click", vol: 0.4 },
    { en: T.probalo, sfx: "click", vol: 0.5 }, { en: T.LOOP - 0.12, sfx: "whoosh", vol: 0.35 }, { en: T.LOOP, sfx: "thump", vol: 0.45 },
  ].filter((x) => !(x.en > sil0 + 0.02 && x.en < T.ocho - 0.05));

  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(sil0 * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.12 * Math.min(1, Math.max(0, sil0 * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(T.ocho * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(T.ocho * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.12 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // ---------- capa gráfica (máximo 2 textos + subtítulo) ----------
  const tg = loop ? 0 : t;
  const enGancho = tg < l[1] - 0.05 || t >= l[9] - 0.05 || loop;
  const valor = valorPasos(t, VENDE, R.map((r) => ({ en: r.en, a: r.a })));
  const restaActual = [...R].reverse().find((r) => t >= r.en - 0.05);
  const frente = (
    <>
      {enGancho && !(t >= l[9] - 0.05 && !loop) ? (
        <>
          <Cartel texto="LO QUE VENDE EN UN AÑO" top={86} fondo={C.verde} color={C.ambar} size={23} s={Math.min(1.08, 0.8 + sp(tg + 0.1) * 0.2) * latido(tg, 0.62, 0.03)} rot={-2 + Math.sin(tg * 4) * 1.2} />
          <div style={{ left: 0, right: 0, top: 134, textAlign: "center", font: `700 15px ${BODY}`, color: "#ffffffcc" }}>un kiosco · (ejemplo)</div>
        </>
      ) : null}
      {t >= l[1] - 0.05 && t < l[2] - 0.05 ? (
        <>
          <Numero t={t} v={valorPasos(t, 0, [{ en: l[1], a: VENDE }], Math.max(0.4, T.millones + 0.3 - l[1]))} pasos={[{ en: l[1], a: VENDE }]} dur={Math.max(0.4, T.millones + 0.3 - l[1])} top={92} size={50} color="#ffffff" />
          <Rotulo t={t} desde={T.cinco} texto="5,4 m de billetes de $1.000 (ejemplo)" top={156} color={C.ambar} />
        </>
      ) : null}
      {t >= l[2] - 0.05 && t < l[3] - 0.05 ? <Cartel texto="¿CUÁNTO ES TUYO?" top={90} size={30} s={sp(t - l[2], 1.06) * latido(t - l[2], 0.5, 0.05)} rot={Math.sin(t * 5) * 1.5} /> : null}
      {t >= l[3] - 0.05 && t < l[6] - 0.05 ? (
        <>
          <Etiqueta texto="TE QUEDA" top={70} fondo={C.verde} color={C.ambar} />
          <Numero t={t} v={valor} pasos={R.map((r) => ({ en: r.en, a: r.a }))} top={98} size={48} color="#ffffff" />
          {restaActual ? <Rotulo t={t} desde={restaActual.en} texto={restaActual.txt} top={156} /> : null}
        </>
      ) : null}
      {t >= l[6] - 0.05 && t < sil0 ? (
        <>
          <Etiqueta texto="TE QUEDA" top={70} fondo={C.verde} color={C.ambar} />
          <Numero t={t} v={0} tapado top={98} size={56} color="#ff6b5e" />
          {t > T.pista - 0.1 ? <Cartel texto="NI A LA CINTURA" top={170} size={26} s={sp(t - T.pista, 1.08) * latido(t, 0.5, 0.05)} rot={-3} /> : null}
        </>
      ) : null}
      {t >= T.ocho - 0.02 && t < l[8] - 0.05 ? (
        t < T.ochenta - 0.05 ? (
          <Numero t={t} v={valorPasos(t, 0, [{ en: T.ocho, a: QUEDA }], 0.5)} pasos={[{ en: T.ocho, a: QUEDA }]} dur={0.5} top={96} size={56} color="#ff6b5e" />
        ) : (
          <>
            <Rotulo t={t} desde={T.ochenta} texto="VENDISTE: 5,4 m" top={84} color="#9fd6ff" size={22} />
            <Rotulo t={t} desde={T.ochenta + 0.35} texto="TE QUEDÓ: 85 cm (ejemplo)" top={130} color={C.rojo} size={22} />
          </>
        )
      ) : null}
      {t >= l[8] - 0.05 && t < l[9] - 0.05 ? (
        <div style={{ left: 0, right: 0, top: 78, textAlign: "center", transform: `scale(${sp(t - l[8], 1.06)})` }}>
          <span style={{ position: "static", font: `800 22px/1.15 ${DISP}`, color: "#fff", textShadow: "0 3px 12px #000a" }}>En Claro: <span style={{ position: "static", color: C.ambar }}>cuánto es tuyo</span></span>
        </div>
      ) : null}
      {t >= l[9] - 0.05 && !loop ? (
        t >= T.probalo - 0.1 ? <Probalo s={sp(t - (T.probalo - 0.1), 1.05, 15, 0.45) * latido(t - T.probalo, 0.6, 0.05)} top={96} />
          : <Cartel texto="¿HASTA DÓNDE TE LLEGA?" top={90} fondo={C.verde} color={C.ambar} size={23} s={sp(t - l[9], 1.06)} rot={-2 + Math.sin(t * 4) * 1.2} />
      ) : null}
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, e[0] + 0.1], [sil0, T.ocho + 0.05], [T.LOOP - 0.01, 999]]}
      fondo={<div style={{ inset: 0, background: "#0b1116" }} />}
      tres={<Escena3D t={tw} T={T} cam={cam3} />}
      frente={frente}
      sobre={musica}
    />
  );
};
const s = salidas;
void eIO;
