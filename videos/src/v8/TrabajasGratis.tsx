import React from "react";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { DISP } from "../lib/fuentes";
import { GUION_V8_14, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { Cartel, CupoFundadores, Etiqueta, Numero, Rotulo, entra, latido, ritmo, sp } from "./comun";
import { Estudio, PantallaApp, dibujarBillete, useLienzo } from "./estudio3d";
import { C } from "./iconos";
import { Celular3D, Cuaderno3D, GondolaPrecios, PisoEstudio, Registradora3D, RelojKiosco3D, type Sector } from "./modelos3d";
import { Partida } from "./MismoKiosco";

// V8-14 "Hasta las 14:20 trabajás gratis" (videos/guiones/V8-14-TRABAJAS-GRATIS.md + referencia/SISTEMA-VIRAL.md).
// Cuenta (ejemplo): vende $150.000 en 13 h (7 a 20), margen 36% → $54.000. Fijos + gastos + comisiones = $30.500 → le quedan $23.500.
// El reloj se pinta en proporción a esa plata: alquiler y luz $18.000, gastos $6.500, QR y tarjeta $6.000 → lo tuyo arranca a las 14:20.
// Fiado perdido $8.000 → 16:16. El otro kiosco (precios al día, margen 42% → $63.000) → 13:17.

const g = GUION_V8_14;
const XB = 10;
const R = 0.82;
const RELOJ: [number, number, number] = [0, 2.2, -0.95];
const APP = { precio: 2.957, fiados: 4.857, fin: 6.857 };

const hora = (plata: number, bruta: number) => 7 + (plata / bruta) * 13;
const H = {
  alq: hora(18000, 54000), gas: hora(24500, 54000), tuyo: hora(30500, 54000), fiado: hora(38500, 54000),
  oAlq: hora(18000, 63000), oGas: hora(24500, 63000), oTuyo: hora(30500, 63000),
};
const fmt = (h: number) => `${Math.floor(h)}:${String(Math.floor((h % 1) * 60 + 1e-6)).padStart(2, "0")}`;
const COL = { alq: "#b8432f", gas: "#7a5aa8", qr: "#2f6fb5", fiado: "#a8761c", tuyo: "#16a34a", gris: "#8b918d" };

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e, dur,
    veinte: w(0, "veinte", 2.6), gratis: w(0, "gratis", e[0] - 0.4),
    duenio: w(2, "dueño", l[2] + 1.6), vos: w(2, "vos", e[2] - 0.3),
    tuyo: w(3, "tuyo", e[3] - 0.4),
    fias: w(4, "fiás", l[4] + 0.4), corre: w(4, "corre", e[4] - 0.4),
    otros: w(5, "otros", l[5] + 1.4), dias: w(5, "días", e[5] - 0.3),
    trece: w(6, "trece", e[6] - 0.9), diecisiete: w(6, "diecisiete", e[6] - 0.5),
    cuenta: w(7, "cuenta", l[7] + 0.9), adelantar: w(7, "adelantar", e[7] - 1.0), horaApp: w(7, "hora", e[7] - 0.3),
    comentalo: w(8, "comentalo", l[8] + 1.4), mandaselo: w(8, "mandáselo", l[8] + 2.0),
    LOOP: dur - 0.27,
  };
}
type T = ReturnType<typeof tiempos>;

const sectoresMios = (fiado: number, tuyoDesde: number, k = 0): Sector[] => {
  // k: 0 = este kiosco, 1 = ya con precios al día y el fiado cobrado (13:17)
  const a = H.alq + (H.oAlq - H.alq) * k, b = H.gas + (H.oGas - H.gas) * k, c = H.tuyo + (H.oTuyo - H.tuyo) * k;
  const out: Sector[] = [
    { desde: 7, hasta: a, color: COL.alq, texto: "ALQUILER\nY LUZ" },
    { desde: a, hasta: b, color: COL.gas, texto: "GASTOS" },
    { desde: b, hasta: c, color: COL.qr, texto: "QR" },
  ];
  if (fiado > c + 0.02) out.push({ desde: c, hasta: fiado, color: COL.fiado, texto: "FIADO" });
  out.push({ desde: Math.max(c, tuyoDesde), hasta: 20, color: COL.tuyo, texto: "TUYO" });
  return out;
};
const sectoresOtro: Sector[] = [
  { desde: 7, hasta: H.oAlq, color: COL.alq, texto: "ALQUILER\nY LUZ" },
  { desde: H.oAlq, hasta: H.oGas, color: COL.gas, texto: "GASTOS" },
  { desde: H.oGas, hasta: H.oTuyo, color: COL.qr, texto: "QR" },
  { desde: H.oTuyo, hasta: 20, color: COL.tuyo, texto: "TUYO" },
];

/** Estado del reloj de este kiosco (A) en el tiempo t: aguja, hasta dónde está pintado y sectores. */
function relojA(t: number, T: T) {
  const { l, e } = T;
  // gancho: la aguja corre de 7 a 14:20 pintando gris "GRATIS"
  if (t < l[1] - 0.05) {
    const k = clamp(t / Math.max(0.6, T.veinte + 0.2), 0, 1);
    const h = 7 + (H.tuyo - 7) * (k * k * (3 - 2 * k)) + (k >= 1 ? Math.sin(t * 30) * 0.02 : 0);
    return { hora: h, pinta: h, sectores: [{ desde: 7, hasta: H.tuyo, color: COL.gris, texto: "GRATIS" }] as Sector[] };
  }
  // para quién: vuelve a las 7 y se pinta por sectores hasta 14:20
  if (t < l[3] - 0.05) {
    const vuelta = clamp((t - l[1]) / 0.3, 0, 1);
    const k = clamp((t - (l[1] + 0.3)) / Math.max(0.8, e[2] - l[1] - 0.3), 0, 1);
    const h = vuelta < 1 ? H.tuyo - (H.tuyo - 7) * entra(vuelta) : 7 + (H.tuyo - 7) * k;
    return { hora: h, pinta: vuelta < 1 ? 7 : h, sectores: sectoresMios(0, 99) };
  }
  // empieza lo tuyo
  if (t < l[4] - 0.05) {
    const k = entra((t - T.tuyo + 0.1) / 0.9);
    const h = H.tuyo + (20 - H.tuyo) * k + (k <= 0 ? Math.sin(t * 25) * 0.02 : 0);
    return { hora: h, pinta: h, sectores: sectoresMios(0, H.tuyo) };
  }
  // si fiás, la hora se corre
  const fiado = H.tuyo + (H.fiado - H.tuyo) * entra((t - T.fias) / 1.4);
  if (t < l[7] - 0.05 || t < T.horaApp) {
    const tiembla = t < e[5] + 0.05 ? Math.sin(t * 18) * 0.015 : 0;
    return { hora: fiado + tiembla, pinta: 20, sectores: sectoresMios(fiado, fiado) };
  }
  // con En Claro: el verde se adelanta a las 13:17
  const m = entra((t - T.horaApp) / 1.1);
  const desde = H.fiado + (H.oTuyo - H.fiado) * m;
  let h = desde;
  let pinta = 20;
  // últimos cuadros: la aguja vuelve a las 7 (empalma con el cuadro 0)
  const vuelta = clamp((t - (T.LOOP - 0.7)) / 0.65, 0, 1);
  if (vuelta > 0) { h = desde - (desde - 7) * vuelta * vuelta; pinta = 20 - 13 * vuelta * vuelta; }
  return { hora: h, pinta, sectores: sectoresMios(H.fiado + (H.oTuyo - H.fiado) * m, desde, m) };
}

function relojB(t: number, T: T) {
  const k = clamp((t - (T.l[6] + 0.3)) / Math.max(0.8, T.diecisiete - T.l[6] - 0.3), 0, 1);
  const h = 7 + (H.oTuyo - 7) * k;
  const verde = entra((t - T.diecisiete) / 0.8);
  const fin = h + (20 - h) * verde;
  return { hora: fin, pinta: fin };
}

function appTiempo(t: number, T: T) {
  const p: [number, number][] = [[T.l[7], 0], [T.cuenta + 0.5, 0.6], [T.adelantar - 0.4, APP.precio - 0.3], [T.adelantar + 0.4, APP.precio + 0.4], [T.horaApp + 0.1, APP.fiados], [T.horaApp + 1.2, APP.fin]];
  if (t <= p[0][0]) return 0;
  for (let i = 0; i < p.length - 1; i++) { const [a, s0] = p[i], [b, s1] = p[i + 1]; if (t < b) return s0 + (s1 - s0) * ((t - a) / (b - a)); }
  return APP.fin;
}

type Vista = { pos: number[]; target: number[]; fov: number };
const partida = (t: number, T: T) => t >= T.l[6] - 0.05 && t < T.l[7] - 0.05;
const enApp = (t: number, T: T) => t >= T.l[7] - 0.05 && t < T.horaApp;

function camaras(t: number, T: T): { a: Vista; b: Vista; r: number } {
  const { l } = T;
  const base = (k: number): Vista => ({ pos: [Math.sin(t * 0.7) * 0.25 * k, 1.9 + 0.1 * k, RELOJ[2] + 4.6 - 0.7 * k], target: [0, 1.85, RELOJ[2]], fov: 40 });
  const kG = t < l[1] ? Math.sin((Math.PI / 2) * clamp(t / Math.max(0.5, l[1]), 0, 1)) : 1;
  let a = base(kG);
  let b: Vista = { pos: [XB, 2.2, RELOJ[2] + 3.1], target: [XB, 2.2, RELOJ[2]], fov: 40 };
  let r = 1;
  // billetes de la caja al reloj: plano más abierto
  if (t >= l[2] - 0.05 && t < l[3] - 0.05) a = { pos: [0.5 + Math.sin(t * 0.8) * 0.2, 1.7, RELOJ[2] + 5.0], target: [0.2, 1.75, RELOJ[2]], fov: 42 };
  // empieza lo tuyo: empuje al reloj
  if (t >= l[3] - 0.05 && t < l[4] - 0.05) { const k = entra((t - l[3]) / 1.2); a = { pos: [Math.sin(t * 0.6) * 0.15, 2.05, RELOJ[2] + 4.2 - 0.9 * k], target: [0, 2.05, RELOJ[2]], fov: 40 }; }
  // el fiado empuja el verde: de costado
  if (t >= l[4] - 0.05 && t < T.e[5] + 0.05) a = { pos: [0.9 + Math.sin(t * 0.7) * 0.2, 2.3, RELOJ[2] + 3.6], target: [0.15, 2.1, RELOJ[2]], fov: 40 };
  // silencio: quieto, empuje lento
  if (t >= T.e[5] + 0.05 && t < l[6] - 0.05) { const k = clamp((t - T.e[5]) / Math.max(0.2, l[6] - T.e[5]), 0, 1); a = { pos: [0, 2.2, RELOJ[2] + 3.6 - 0.25 * k], target: [0, 2.2, RELOJ[2]], fov: 40 }; }
  // comparación: los dos relojes (pantalla partida)
  if (partida(t, T)) {
    const k = entra((t - l[6]) / 0.5);
    a = { pos: [Math.sin(t * 0.7) * 0.12, 2.2, RELOJ[2] + 3.4 - 0.3 * k], target: [0, 2.2, RELOJ[2]], fov: 40 };
    b = { pos: [XB + Math.sin(t * 0.7 + 1) * 0.12, 2.2, RELOJ[2] + 3.4 - 0.3 * k], target: [XB, 2.2, RELOJ[2]], fov: 40 };
    r = 0.5;
  }
  // el truco: el celular con la app
  if (enApp(t, T)) { const k = entra((t - l[7]) / 0.6); a = { pos: [0.35 + Math.sin(t * 0.7) * 0.03, 1.59, 0.95 - 0.15 * k], target: [0.35, 1.55, 0.45], fov: 36 }; }
  // con En Claro: el verde se adelanta
  if (t >= T.horaApp && t < l[8] - 0.05) a = { pos: [Math.sin(t * 0.6) * 0.2, 2.2, RELOJ[2] + 3.3], target: [0, 2.15, RELOJ[2]], fov: 40 };
  // cierre: vuelve al encuadre del cuadro 0
  if (t >= l[8] - 0.05) {
    const k = clamp((t - l[8]) / Math.max(1, T.LOOP - l[8]), 0, 1);
    const f = base(0), m = entra(k * 1.5);
    a = { pos: [f.pos[0] + Math.sin(k * 6) * 0.35 * (1 - k), f.pos[1] + 0.3 * (1 - m), f.pos[2] - 1.0 * (1 - m)], target: [0, f.target[1] + 0.35 * (1 - m), RELOJ[2]], fov: 40 };
  }
  if (t >= T.LOOP) a = base(0);
  return { a, b, r };
}

/** Billete 3D que vuela de la caja al sector del reloj. */
const Billete3D: React.FC = () => {
  const tex = useLienzo("billete-v814", 256, 128, dibujarBillete);
  return <mesh castShadow><planeGeometry args={[0.16, 0.075]} /><meshStandardMaterial map={tex} side={2} roughness={0.7} /></mesh>;
};

const CAJA: [number, number, number] = [0.55, 1.18, -0.25];

/** El interior de un kiosco: pared, mostrador con caja, góndolas a los costados y el reloj. */
const Interior: React.FC<{ t: number; reloj: React.ReactNode; cajon?: number }> = ({ reloj, cajon = 0 }) => (
  <group>
    <mesh position={[0, 2.2, -1.06]} receiveShadow><planeGeometry args={[9, 5]} /><meshStandardMaterial color="#e3d8c4" roughness={0.9} /></mesh>
    <mesh position={[0, 3.2, -1.04]}><planeGeometry args={[9, 0.12]} /><meshStandardMaterial color="#1e7a4c" roughness={0.6} /></mesh>
    <group position={[RELOJ[0], RELOJ[1], RELOJ[2]]}>{reloj}</group>
    <group position={[-1.75, 0, -0.75]} scale={[0.9, 0.9, 0.9]}><GondolaPrecios /></group>
    <group position={[1.75, 0, -0.75]} scale={[0.9, 0.9, 0.9]}><GondolaPrecios giro={() => 1} /></group>
    {/* mostrador */}
    <mesh position={[0, 0.5, -0.25]} castShadow receiveShadow><boxGeometry args={[2.3, 1.0, 0.6]} /><meshStandardMaterial color="#6b4a32" roughness={0.6} /></mesh>
    <mesh position={[0, 1.01, -0.25]} castShadow receiveShadow><boxGeometry args={[2.36, 0.03, 0.66]} /><meshPhysicalMaterial color="#d9d4c7" roughness={0.3} clearcoat={0.6} /></mesh>
    <group position={[CAJA[0], 1.03, CAJA[2]]} scale={[0.8, 0.8, 0.8]}><Registradora3D cajon={cajon} /></group>
  </group>
);

const Escena3D: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const { l, e } = T;
  const { a, b, r } = camaras(t, T);
  const A = relojA(t, T);
  const B = relojB(t, T);
  // billetes: entran a la caja y salen al sector que se está pintando
  const billetes: React.ReactNode[] = [];
  if (t >= l[2] - 0.1 && t < l[3] + 0.6) {
    for (let i = 0; i < 14; i++) {
      const t0 = l[2] + i * Math.max(0.2, (e[2] - l[2]) / 14);
      const d = (t - t0) / 0.7;
      if (d < 0 || d > 1) continue;
      const hh = relojA(t0, T).hora;
      const ang = ((hh - 7) / 13) * Math.PI * 2;
      const fin = [RELOJ[0] + Math.sin(ang) * R * 0.55, RELOJ[1] + Math.cos(ang) * R * 0.55, RELOJ[2] + 0.12];
      const k = d * d * (3 - 2 * d);
      billetes.push(
        <group key={i} position={[CAJA[0] + (fin[0] - CAJA[0]) * k, CAJA[1] + 0.2 + (fin[1] - CAJA[1] - 0.2) * k + Math.sin(k * Math.PI) * 0.35, CAJA[2] + 0.2 + (fin[2] - CAJA[2] - 0.2) * k]} rotation={[k * 4 + i, k * 3, k * 6 + i * 0.7]}>
          <Billete3D />
        </group>,
      );
    }
  }
  // el cuaderno de fiados que empuja el verde
  const cu = t >= T.fias - 0.4 && t < T.e[6] ? entra((t - (T.fias - 0.4)) / 0.6) : 0;
  const angF = ((((H.tuyo + H.fiado) / 2) - 7) / 13) * Math.PI * 2;
  return (
    <>
      <Estudio fondo="#14110d" niebla={[12, 34]} luz={0.5} calida={1.0} exposicion={1.0} principal={[3, 6, 6]} />
      <pointLight position={[0, 3.0, 1.6]} intensity={5} distance={8} decay={1.6} color="#ffe1b0" castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[XB, 3.0, 1.6]} intensity={5} distance={8} decay={1.6} color="#ffe1b0" />
      <PisoEstudio color="#3a332b" />
      <Interior t={t} cajon={t > l[2] && t < e[2] ? 0.6 + 0.4 * Math.sin(t * 9) * 0.5 : 0} reloj={<RelojKiosco3D hora={A.hora} pinta={A.pinta} sectores={A.sectores} radio={R} />} />
      <group position={[XB, 0, 0]}>
        <Interior t={t} reloj={<RelojKiosco3D hora={B.hora} pinta={B.pinta} sectores={sectoresOtro} radio={R} />} />
      </group>
      {billetes}
      {cu > 0 ? (
        <group position={[RELOJ[0] + 1.6 * (1 - cu) + Math.sin(angF) * R * 0.62, RELOJ[1] + Math.cos(angF) * R * 0.62 - 0.05, RELOJ[2] + 0.2]} rotation={[1.2, 0, -0.5 + Math.sin(t * 20) * 0.04 * (t < T.corre + 0.5 ? 1 : 0.3)]} scale={[1.3, 1.3, 1.3]}>
          <Cuaderno3D cierre={0} />
        </group>
      ) : null}
      {t > l[7] - 0.3 && t < T.horaApp + 0.3 ? (
        <group position={[0.35, 1.55 - (1 - entra((t - l[7] + 0.3) / 0.5)) * 0.4, 0.45]} rotation-y={Math.sin(t * 0.8) * 0.05}>
          <Celular3D><PantallaApp t={appTiempo(t, T)} carpeta="tomas/v8-14" app0={0} rate={1} durGrab={APP.fin} /></Celular3D>
        </group>
      ) : null}
      <Partida a={a} b={b} r={r} />
    </>
  );
};

export const TrabajasGratis: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, dur);
  const loop = t >= T.LOOP;
  const tw = loop ? 0 : t;
  const { l, e } = T;
  const sil0 = e[5] + 0.05;

  const manual = [0.03, T.veinte, T.gratis, l[1], T.duenio, T.vos, T.tuyo, T.fias, T.corre, T.otros, T.dias, T.trece, T.diecisiete, T.cuenta, T.adelantar, T.horaApp, T.comentalo, T.mandaselo];
  const cortes = [l[2], l[3], l[4], l[6], l[7], T.horaApp, l[8]];
  const cam: Cam2D = t > sil0 && t < l[6] ? { z: 1.02, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : ritmo(pal, manual, [[sil0, l[6] - 0.02], [T.LOOP - 0.4, 999]], 0.45), loop ? [] : cortes, 0.45);
  const hs = loop ? 0 : temblor(t, [[0.03, 8], [T.gratis, 8], [T.tuyo, 8], [T.corre, 6], [T.diecisiete, 8]]);
  let wf = 0;
  if (!loop) [[T.tuyo, 0.25], [T.diecisiete, 0.2], [T.horaApp + 0.4, 0.15]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });

  const tics = (desde: number, hasta: number, cada: number, vol: number) => Array.from({ length: Math.max(0, Math.floor((hasta - desde) / cada)) }, (_, i) => ({ en: desde + i * cada, sfx: "tic", vol }));
  // un "clac" cuando la aguja entra a cada sector
  const entraSector = (h: number) => l[1] + 0.3 + ((h - 7) / (H.tuyo - 7)) * Math.max(0.8, e[2] - l[1] - 0.3);
  const billetesT = Array.from({ length: 14 }, (_, i) => l[2] + i * Math.max(0.2, (e[2] - l[2]) / 14));
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, ...tics(0, l[1], 0.18, 0.45),
    ...tics(l[1] + 0.3, e[2], 0.3, 0.3),
    ...[7, H.alq, H.gas].map((h) => ({ en: entraSector(h) + 0.05, sfx: "click", vol: 0.55 })),
    ...billetesT.filter((_, i) => i % 2 === 0).map((a) => ({ en: a, sfx: "caja", vol: 0.25 })), ...billetesT.filter((_, i) => i % 2 === 1).map((a) => ({ en: a + 0.3, sfx: "whoosh", vol: 0.2 })),
    ...cortes.map((a) => ({ en: a - 0.12, sfx: "whoosh", vol: 0.3 })),
    { en: T.tuyo, sfx: "thump", vol: 0.6 }, { en: T.tuyo + 0.1, sfx: "caja", vol: 0.5 },
    { en: T.fias, sfx: "rayon", vol: 0.4 }, { en: T.corre, sfx: "heart", vol: 0.5 }, { en: T.corre + 0.5, sfx: "heart", vol: 0.55 },
    ...tics(T.otros - 0.2, T.dias + 0.3, 0.07, 0.3),
    { en: l[6], sfx: "thump", vol: 0.55 }, ...tics(l[6] + 0.3, T.diecisiete, 0.25, 0.3), { en: T.diecisiete, sfx: "ding", vol: 0.55 },
    ...[T.cuenta, T.adelantar, T.horaApp].map((a) => ({ en: a, sfx: "ding", vol: 0.45 })),
    { en: T.horaApp + 0.4, sfx: "riser", vol: 0.25 },
    { en: T.mandaselo, sfx: "click", vol: 0.45 }, ...tics(T.LOOP - 0.7, T.LOOP, 0.1, 0.35),
  ].filter((x) => !(x.en > sil0 + 0.02 && x.en < l[6] - 0.05));

  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(sil0 * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.1 * Math.min(1, Math.max(0, sil0 * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(l[6] * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(l[6] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.1 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // ---------- capa gráfica (máximo 2 textos + subtítulo) ----------
  const tg = loop ? 0 : t;
  const A = relojA(tw, T);
  const reloj = (h: number, color: string, top = 84) => (
    <div style={{ left: 0, right: 0, top, textAlign: "center" }}>
      <span style={{ position: "static", display: "inline-block", padding: "2px 14px", borderRadius: 10, background: "#0b0f0dd9", border: `2px solid ${color}`, font: `800 30px ${DISP}`, color, fontVariantNumeric: "tabular-nums" }}>{fmt(h)}</span>
    </div>
  );
  const colorHora = (h: number) => (h < H.alq ? "#ff8a7a" : h < H.gas ? "#c9a8ff" : h < H.tuyo - 0.005 ? "#8cc2ff" : "#7cf2a8");
  const frente = (
    <>
      <div style={{ left: 0, right: 0, top: 0, height: 150, background: "linear-gradient(#000b, #0000)" }} />
      {tg < l[1] - 0.05 || loop ? (
        <>
          <Etiqueta texto="CUÁNTO GANA… #2 · GANANCIA DE UN KIOSCO" top={10} size={12} fondo={C.verde} color={C.ambar} />
          <div style={{ left: 0, right: 0, top: 34, textAlign: "center", transform: `scale(${Math.min(1.06, 0.82 + sp(tg + 0.1) * 0.2) * latido(tg, 0.62, 0.035)}) rotate(${-2 + Math.sin(tg * 4) * 1.0}deg)` }}>
            <span style={{ position: "static", display: "inline-block", padding: "5px 16px", borderRadius: 12, background: C.rojo, color: "#fff", font: `800 25px/1.1 ${DISP}`, boxShadow: `0 5px 0 ${C.tinta}` }}>HASTA LAS 14:20<br />TRABAJÁS GRATIS</span>
          </div>
        </>
      ) : null}
      {!loop && t >= l[1] - 0.05 && t < l[3] - 0.05 ? (
        <>
          <Etiqueta texto={t < l[2] - 0.05 ? "¿PARA QUIÉN TRABAJÁS?" : "CADA PESO YA TIENE DUEÑO"} top={40} size={18} fondo={C.rojo} />
          {reloj(A.hora, colorHora(A.hora))}
        </>
      ) : null}
      {!loop && t >= l[3] - 0.05 && t < l[4] - 0.05 ? (
        <>
          <Etiqueta texto="LO TUYO (ejemplo)" top={36} size={15} fondo={C.verde} color={C.ambar} />
          <Numero t={t} v={23500 * entra((t - T.tuyo) / 0.9)} pasos={[{ en: T.tuyo, a: 23500 }]} dur={0.9} top={62} size={54} color="#7cf2a8" redondeo={10} />
        </>
      ) : null}
      {!loop && t >= l[4] - 0.05 && t < l[5] - 0.05 ? (
        <div style={{ left: 0, right: 0, top: 46, textAlign: "center", transform: `scale(${sp(t - l[4], 1.05) * latido(t, 0.5, 0.03)})` }}>
          <span style={{ position: "static", display: "inline-block", padding: "4px 16px", borderRadius: 12, background: "#0b0f0de6", font: `800 40px ${DISP}`, color: "#fff" }}>
            <span style={{ position: "static", color: "#7cf2a8" }}>14:20</span> → <span style={{ position: "static", color: t > T.fias + 0.3 ? "#ffcf6b" : "#7cf2a8" }}>{fmt(H.tuyo + (H.fiado - H.tuyo) * entra((t - T.fias) / 1.4))}</span>
          </span>
        </div>
      ) : null}
      {!loop && t >= l[5] - 0.05 && t < l[6] - 0.05 ? (
        t < T.dias - 0.05 ? <Cartel texto="+1 h 56 min POR DÍA" top={46} size={26} fondo={C.ambar} color={C.tinta} s={sp(t - l[5], 1.06)} rot={-2} />
          : <Cartel texto="58 HORAS POR MES (ejemplo)" top={46} size={22} fondo={C.rojo} s={sp(t - T.dias, 1.1)} rot={-2} />
      ) : null}
      {!loop && partida(t, T) ? (
        <>
          <Rotulo t={t} desde={l[6] + 0.1} texto={`ESTE KIOSCO · empieza a ganar ${fmt(H.fiado)}`} top={276} color={C.rojo} size={14} />
          <Rotulo t={t} desde={l[6] + 0.4} texto={t > T.diecisiete ? `PRECIOS AL DÍA + FIADO COBRADO · ${fmt(H.oTuyo)}` : "PRECIOS AL DÍA + FIADO COBRADO · ¿?"} top={336} color={C.hoja} size={13} />
        </>
      ) : null}
      {!loop && enApp(t, T) ? (
        <div style={{ left: 0, right: 0, top: 70, textAlign: "center", transform: `scale(${sp(t - l[7], 1.06)})` }}>
          <span style={{ position: "static", font: `800 18px/1.15 ${DISP}`, color: "#fff", textShadow: "0 3px 12px #000a" }}>En Claro <span style={{ position: "static", color: C.ambar }}>hace la cuenta cada noche</span></span>
        </div>
      ) : null}
      {!loop && t >= T.horaApp && t < l[8] - 0.05 ? (
        <>
          <Etiqueta texto="EMPEZÁS A GANAR (ejemplo)" top={46} size={15} fondo={C.verde} color={C.ambar} />
          {reloj(A.sectores.find((s) => s.texto === "TUYO")!.desde, "#7cf2a8", 74)}
        </>
      ) : null}
      {!loop && t >= l[8] - 0.05 ? (
        <>
          {t < T.mandaselo - 0.05 ? <div style={{ left: 0, right: 0, top: 36, textAlign: "center", transform: `scale(${sp(t - l[8], 1.06) * latido(t, 0.55, 0.03)}) rotate(-2deg)` }}>
            <span style={{ position: "static", display: "inline-block", padding: "5px 16px", borderRadius: 12, background: C.ambar, color: C.tinta, font: `800 22px/1.1 "Space Grotesk", sans-serif`, boxShadow: `0 5px 0 ${C.tinta}` }}>¿A QUÉ HORA EMPEZÁS<br />A GANAR VOS?</span>
          </div>
            : <Cartel texto="MANDÁSELO A TU SOCIO" top={44} size={22} s={sp(t - T.mandaselo, 1.06)} rot={-2} />}
          {t >= T.mandaselo - 0.05 ? <CupoFundadores t={t} desde={T.mandaselo} top={300} mensual /> : null}
        </>
      ) : null}
    </>
  );

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[sil0, l[6] + 0.05], [T.mandaselo - 0.05, 999]]}
      fondo={<div style={{ inset: 0, background: "#14110d" }} />}
      tres={<Escena3D t={tw} T={T} />}
      frente={frente}
      sobre={musica}
    />
  );
};
