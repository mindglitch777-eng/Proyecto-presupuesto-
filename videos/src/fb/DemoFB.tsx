import React from "react";
import { AbsoluteFill, Freeze, Html5Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Subtitulos } from "../components/Subtitulos";
import { BODY, DISP } from "../lib/fuentes";
import { GUION_FB_01, GUION_FB_02, GUION_FB_03, palabrasDeRespaldo, tPalabra, type Guion, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import app01 from "../../public/tomas/fb-01/app.json";
import app02 from "../../public/tomas/fb-02/app.json";
import app03 from "../../public/tomas/fb-03/app.json";

// Demos de Facebook FB-01 a FB-03 (guiones/FB-DEMOS-01-03.md): "grabar pantalla" del celular, nada de 3D.
// La pantalla es la grabación real de la app (public/tomas/fb-0N/app.mp4, 1080 × 1848, con toques de dedo y scroll de verdad);
// arriba va la barra de estado del teléfono. Encima: un solo texto grande arriba + el subtítulo. Cartel final con el precio "por mes".
// La grabación se "acomoda" a la voz con anclas (segundo del video ↔ segundo de la grabación): entre dos anclas corre a velocidad
// normal y se queda quieta esperando la voz, o se apura si la voz llega antes. Cada palabra dictada tiene su ancla.

const FPS = 30;
type Ancla = [number, number]; // [segundo del video, segundo de la grabación]
type Marcas = Record<string, number>;
const S = (x: React.CSSProperties): React.CSSProperties => ({ position: "absolute", ...x });

/** Segundo de la grabación que se ve en el segundo `v` del video. */
function aGrabacion(v: number, anclas: Ancla[], fin: number) {
  const a = [...anclas].sort((x, y) => x[0] - y[0]);
  if (v <= a[0][0]) return a[0][1];
  for (let i = 0; i < a.length - 1; i++) {
    const [v0, r0] = a[i], [v1, r1] = a[i + 1];
    if (v < v1) {
      const dr = Math.max(0, r1 - r0), dv = Math.max(0.001, v1 - v0);
      const ritmo = Math.max(1, dr / dv);
      return Math.min(fin, r0 + Math.min((v - v0) * ritmo, dr));
    }
  }
  const [vu, ru] = a[a.length - 1];
  return Math.min(fin, ru + (v - vu));
}
/** Segundo del video en que la grabación pasa por `r` (para que suene el toque justo cuando se ve). */
function aVideoDe(r: number, anclas: Ancla[]) {
  const a = [...anclas].sort((x, y) => x[0] - y[0]);
  for (let i = 0; i < a.length - 1; i++) {
    const [v0, r0] = a[i], [v1, r1] = a[i + 1];
    if (r >= r0 && r <= r1 && r1 > r0) return v0 + (r - r0) / Math.max(1, (r1 - r0) / Math.max(0.001, v1 - v0));
  }
  return -1;
}
/** Anclas de las palabras dictadas: la palabra k de la línea `linea` de la voz ↔ la marca wk de la grabación. */
function anclasDictado(pal: Palabra[], linea: number, m: Marcas): Ancla[] {
  const voz = pal.filter((p) => p.linea === linea);
  const n = Object.keys(m).filter((k) => /^w\d+$/.test(k)).length;
  if (!voz.length || !n) return [];
  const ini = voz[0].desde, fin = voz[voz.length - 1].hasta;
  return Array.from({ length: n }, (_, k) => {
    // misma cantidad de palabras: palabra con palabra; si no, se reparte en proporción
    const v = voz.length === n ? voz[k].desde : ini + ((fin - ini) * k) / n;
    // la grabación queda justo antes de que aparezca la palabra k y arranca cuando la voz la dice
    return [v, m[`w${k}`] - 0.1] as Ancla; // la palabra se ve ~0,05 s antes de su marca (cuadros de 1/30 s)
  });
}
const lineas = (pal: Palabra[], g: Guion) => g.lineas.map((_, i) => {
  const w = pal.filter((p) => p.linea === i);
  return w.length ? [w[0].desde, w[w.length - 1].hasta] : [g.lineas[i].desde, g.lineas[i].hasta];
});
const ease = (k: number) => { const x = Math.min(1, Math.max(0, k)); return x * x * (3 - 2 * x); };
const entra = (k: number) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * Math.max(0, k)));

// ---------- piezas ----------
const BarraEstado: React.FC<{ fondo?: string; tinta?: string }> = ({ fondo = "#f5f6f4", tinta = "#15201a" }) => (
  <div style={S({ left: 0, top: 0, width: 360, height: 24, background: fondo, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", font: `600 12px ${BODY}`, color: tinta })}>
    <span style={{ position: "static" }}>21:47</span>
    <span style={{ position: "static", display: "flex", gap: 5, alignItems: "center" }}>
      <svg width="15" height="11" viewBox="0 0 15 11" style={{ position: "static" }}>{[0, 1, 2, 3].map((i) => <rect key={i} x={i * 4} y={8 - i * 2.6} width="3" height={3 + i * 2.6} rx="0.6" fill={tinta} />)}</svg>
      <svg width="15" height="11" viewBox="0 0 24 18" style={{ position: "static" }}><path d="M12 17l3.5-4.2a5 5 0 0 0-7 0zM4 8.6a11.5 11.5 0 0 1 16 0l-2.3 2.8a8 8 0 0 0-11.4 0zM0.3 4.3a17 17 0 0 1 23.4 0L21.4 7a13.4 13.4 0 0 0-18.8 0z" fill={tinta} /></svg>
      <span style={{ position: "static", font: `600 11px ${BODY}` }}>78%</span>
      <svg width="22" height="11" viewBox="0 0 22 11" style={{ position: "static" }}><rect x="0.5" y="0.5" width="18" height="10" rx="2.5" fill="none" stroke={tinta} /><rect x="2" y="2" width="12.5" height="7" rx="1.2" fill={tinta} /><rect x="19.5" y="3.5" width="1.8" height="4" rx="0.8" fill={tinta} /></svg>
    </span>
  </div>
);

const Icono: React.FC<{ cual: "mic" | "camara" | "lista" }> = ({ cual }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "static", flex: "none" }}>
    {cual === "mic" ? <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></> : null}
    {cual === "camara" ? <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></> : null}
    {cual === "lista" ? <><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></> : null}
  </svg>
);

/** El único texto grande: una franja fija arriba todo el video (tapa el encabezado de la app), con "montos de ejemplo" chiquito. */
const TextoArriba: React.FC<{ t: number; texto: React.ReactNode; icono: "mic" | "camara" | "lista"; ejemplo?: boolean }> = ({ t, texto, icono, ejemplo = true }) => {
  const k = entra(t / 0.35);
  return (
    <div style={S({ left: 0, right: 0, top: 24, height: 54, background: "#0e3b2a", boxShadow: "0 4px 12px #0003", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" })}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, color: "#fff", font: `800 19px/1.1 ${DISP}`, letterSpacing: "-0.02em", transform: `scale(${0.85 + 0.15 * k})`, whiteSpace: "nowrap" }}>
        <span style={{ position: "static", color: "#F5A524", display: "flex" }}><Icono cual={icono} /></span>
        <span style={{ position: "static" }}>{texto}</span>
      </div>
      {ejemplo ? <div style={{ position: "relative", marginTop: 3, font: `700 9px ${BODY}`, color: "#F5A524", letterSpacing: ".12em" }}>MONTOS DE EJEMPLO</div> : null}
    </div>
  );
};

/** Cartel final, igual en los 3: precio "por mes" del cupo real de 100 socios fundadores. */
const CartelFinal: React.FC<{ t: number; desde: number }> = ({ t, desde }) => {
  const k = entra((t - desde) / 0.45);
  if (t < desde) return null;
  return (
    <>
      <div style={S({ inset: 0, background: `rgba(10,20,15,${0.55 * k})` })} />
      <div style={S({ left: 22, right: 22, top: 190, transform: `translateY(${(1 - k) * 60}px)`, opacity: k, borderRadius: 24, background: "#fff", padding: "22px 18px", textAlign: "center", boxShadow: "0 16px 40px #0007" })}>
        <div style={{ position: "relative", font: `700 13px ${BODY}`, color: "#4b5a52", letterSpacing: ".04em" }}>PRIMEROS 100 KIOSCOS · SOCIOS FUNDADORES</div>
        <div style={{ position: "relative", font: `800 44px/1.05 ${DISP}`, color: "#0e3b2a", letterSpacing: "-0.03em", marginTop: 8 }}>$12.900</div>
        <div style={{ position: "relative", font: `800 20px ${DISP}`, color: "#0e3b2a" }}>por mes, para siempre</div>
        <div style={{ position: "relative", display: "inline-block", marginTop: 14, padding: "8px 14px", borderRadius: 12, background: "#F5A524", color: "#15201a", font: `800 17px ${BODY}` }}>14 días gratis</div>
        <div style={{ position: "relative", marginTop: 12, font: `700 15px ${BODY}`, color: "#15201a" }}>Escribinos por WhatsApp</div>
        <div style={{ position: "relative", marginTop: 4, font: `600 13px ${BODY}`, color: "#4b5a52" }}>enclaroar.netlify.app</div>
      </div>
    </>
  );
};

/** Pantalla grabada: ocupa todo debajo de la barra de estado. `zoom` acerca a un punto (x, y en px lógicos de la pantalla). */
const PantallaApp: React.FC<{ demo: string; r: number; zoom?: [number, number, number] }> = ({ demo, r, zoom }) => {
  const [z, zx, zy] = zoom ?? [1, 180, 300];
  return (
    <div style={S({ left: 0, top: 24, width: 360, height: 616, overflow: "hidden" })}>
      <div style={S({ inset: 0, transformOrigin: `${zx}px ${zy}px`, transform: `scale(${z})` })}>
        <Freeze frame={Math.max(0, Math.round(r * FPS))}>
          <OffthreadVideo src={staticFile(`tomas/${demo}/app.mp4`)} muted style={{ position: "absolute", left: 0, top: 0, width: 360, height: 616 }} />
        </Freeze>
      </div>
    </div>
  );
};

type Sonido = { en: number; sfx: string; vol?: number };
const Marco: React.FC<{ g: Guion; voz: string | null; pal: Palabra[]; t: number; sonidos: Sonido[]; ocultos: [number, number][]; children: React.ReactNode; dur: number }> = ({ g, voz, pal, t, sonidos, ocultos, children, dur }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#f5f6f4" }}>
      <style>{`.stage *{position:absolute;box-sizing:border-box} .stage{font-family:${BODY};color:#fff}`}</style>
      <div className="stage" style={{ position: "absolute", left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" }}>
        {children}
        <Subtitulos t={t} tv={t} g={g} palabras={pal} ocultos={ocultos} top={512} />
      </div>
      {voz ? <Html5Audio src={staticFile(voz)} /> : null}
      <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.045 * Math.min(1, f / 20) * Math.min(1, Math.max(0, dur * fps - f) / 20)} />
      {sonidos.filter((s) => s.en >= 0).map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.en * fps))} durationInFrames={Math.round(3 * fps)} layout="none">
          <Html5Audio src={staticFile(`sfx/${s.sfx}.wav`)} volume={s.vol ?? 0.4} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

function base(g: Guion, palabras: VideoProps["palabras"]) {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  return { frame, t: frame / fps, dur: durationInFrames / fps, pal, L: lineas(pal, g) };
}
const toques = (m: Marcas, claves: string[], anclas: Ancla[]): Sonido[] => claves.filter((k) => m[k] !== undefined).map((k) => ({ en: aVideoDe(m[k], anclas), sfx: "click", vol: 0.45 }));

// ---------- FB-01 · "Cierro el kiosco hablando" ----------
export const DemoFb01: React.FC<VideoProps> = ({ voz, palabras }) => {
  const g = GUION_FB_01;
  const { t, dur, pal, L } = base(g, palabras);
  const m = app01.marcas as Marcas;
  const w = (linea: number, p: string, d: number) => tPalabra(pal, linea, p, d);
  const tMic = w(1, "micr", L[1][0] + 0.8), tListo = w(3, "listo", L[3][0] + 0.3), tMe = w(3, "Me", L[3][0] + 1.0), tCuanto = w(3, "cuánto", L[3][0] + 1.4), tNo = w(3, "No", L[3][0] + 2.6);
  const anclas: Ancla[] = [
    [0, 0], [L[0][1] - 0.35, m.cierre - 0.45], [L[0][1] + 0.1, m.cierre],
    [tMic, m.mic - 0.05], ...anclasDictado(pal, 2, m), [L[2][1] + 0.1, m.listo - 0.3],
    [tListo, m.listo - 0.05], [tMe, m.guardar - 0.05], [tCuanto, m.resultado + 0.2], [L[3][1], m.resultado + 1.5],
  ];
  const r = aGrabacion(t, anclas, m.fin);
  const z = 1 + 0.32 * ease((t - tNo) / 1.2) * (t < L[4][0] ? 1 : 1 - ease((t - L[4][0]) / 0.4));
  const sonidos: Sonido[] = [
    { en: 0, sfx: "whoosh", vol: 0.3 }, ...toques(m, ["mic", "listo", "guardar"], anclas), { en: aVideoDe(m.cierre - 0.5, anclas), sfx: "click", vol: 0.4 },
    { en: tCuanto, sfx: "ding", vol: 0.45 }, { en: L[4][0], sfx: "whoosh", vol: 0.35 }, { en: L[4][0] + 0.3, sfx: "caja", vol: 0.35 },
  ];
  return (
    <Marco g={g} voz={voz} pal={pal} t={t} dur={dur} sonidos={sonidos} ocultos={[[L[2][0] - 0.05, L[2][1] + 0.1]]}>
      <PantallaApp demo="fb-01" r={r} zoom={[z, 110, 90]} />
      <BarraEstado />
      <TextoArriba t={t} texto="Cierro el kiosco hablando" icono="mic" />
      <CartelFinal t={t} desde={L[4][0]} />
    </Marco>
  );
};

// ---------- FB-02 · "¿Tu sistema te hace cargar TODO?" ----------
/** Un sistema genérico (dibujado, sin marca ni copia de ningún sistema real) que pide cargar venta por venta. */
const SistemaGenerico: React.FC<{ t: number; rojo: number }> = ({ t, rojo }) => {
  const ciclo = 1.25, n = Math.floor(t / ciclo), u = t - n * ciclo;
  const campos: [string, string][] = [["Producto", ["Alfajor", "Gaseosa 500", "Yerba 1 kg", "Cigarrillos", "Agua 500", "Caramelos"][n % 6]], ["Cantidad", String(1 + (n % 3))], ["Precio unitario", ["$1.200", "$2.160", "$3.900", "$4.500", "$1.000", "$100"][n % 6]], ["Medio de pago", ["Efectivo", "QR", "Débito"][n % 3]]];
  const lleno = (i: number) => rojo > 0 ? 0 : Math.min(1, Math.max(0, (u - 0.12 - i * 0.2) / 0.18));
  return (
    <div style={S({ left: 0, top: 24, width: 360, height: 616, background: "#e9ebee" })}>
      <div style={S({ left: 0, top: 0, width: 360, height: 52, background: "#5b6573", color: "#fff", font: `700 17px ${BODY}`, padding: "15px 16px" })}>Cargar venta</div>
      <div style={S({ left: 16, right: 16, top: 66, font: `600 13px ${BODY}`, color: rojo > 0 ? "#c62828" : "#5b6573" })}>{rojo > 0 ? "Martes: 0 ventas cargadas" : `Venta ${n + 1} de 214 de hoy`}</div>
      {campos.map(([et, val], i) => (
        <div key={i} style={S({ left: 16, right: 16, top: 96 + i * 72 })}>
          <div style={{ position: "relative", font: `600 13px ${BODY}`, color: "#3c4450" }}>{et}</div>
          <div style={{ position: "relative", marginTop: 6, height: 42, borderRadius: 8, background: "#fff", border: `2px solid ${rojo > 0 ? `rgba(198,40,40,${rojo})` : i === Math.min(3, Math.floor((u - 0.12) / 0.2)) ? "#5b6573" : "#c9ced6"}`, padding: "10px 12px", font: `500 16px ${BODY}`, color: "#1d232b", overflow: "hidden", whiteSpace: "nowrap" }}>
            {val.slice(0, Math.round(val.length * lleno(i)))}
          </div>
          {rojo > 0 ? <div style={{ position: "relative", marginTop: 3, font: `600 11px ${BODY}`, color: `rgba(198,40,40,${rojo})` }}>Campo obligatorio</div> : null}
        </div>
      ))}
      <div style={S({ left: 16, right: 16, top: 400, height: 48, borderRadius: 10, background: rojo > 0 ? "#b0b6bf" : "#5b6573", color: "#fff", font: `700 16px ${BODY}`, textAlign: "center", padding: "14px 0" })}>Guardar y cargar otra</div>
      {/* toque del dedo en "Guardar" al final de cada venta */}
      {rojo === 0 && u > 1.0 ? <div style={S({ left: 180 - 22, top: 424 - 22, width: 44, height: 44, borderRadius: 22, background: "rgba(120,120,120,.45)", border: "2px solid rgba(255,255,255,.7)", transform: `scale(${1 + (u - 1.0) * 1.4})`, opacity: 1 - (u - 1.0) / 0.25 })} /> : null}
    </div>
  );
};

export const DemoFb02: React.FC<VideoProps> = ({ voz, palabras }) => {
  const g = GUION_FB_02;
  const { t, dur, pal, L } = base(g, palabras);
  const m = app02.marcas as Marcas;
  const w = (linea: number, p: string, d: number) => tPalabra(pal, linea, p, d);
  const tHablando = w(2, "hablando", L[2][0] + 1.2), tCuanto = w(4, "cuánto", L[4][0] + 0.6), tQuien = w(4, "quién", L[4][0] + 1.6), tPrecio = w(4, "precio", L[4][0] + 2.6);
  const tApp = L[2][0] - 0.05;
  const anclas: Ancla[] = [
    [tApp, 0], [tHablando, m.mic - 0.05], ...anclasDictado(pal, 3, m), [L[3][1] + 0.1, m.listo - 0.05], [L[4][0], m.resultado - 0.05],
    [tCuanto, m.resultado + 0.4], [tQuien - 0.1, m.fiados], [tPrecio - 0.15, m.precio - 0.2], [L[4][1], m.precio + 0.4],
  ];
  const r = aGrabacion(t, anclas, m.fin);
  const rojo = t < L[1][0] - 0.05 ? 0 : ease((t - L[1][0]) / 0.5);
  const sonidos: Sonido[] = [
    { en: 0, sfx: "whoosh", vol: 0.3 },
    ...Array.from({ length: 12 }, (_, i) => ({ en: 1.0 + i * 1.25, sfx: "click", vol: 0.3 })).filter((s) => s.en < L[1][0]),
    ...Array.from({ length: 18 }, (_, i) => ({ en: 0.15 + Math.floor(i / 4) * 1.25 + (i % 4) * 0.2, sfx: "tic", vol: 0.18 })).filter((s) => s.en < L[1][0]),
    { en: L[1][0], sfx: "buzz", vol: 0.35 }, { en: tApp, sfx: "whoosh", vol: 0.4 },
    ...toques(m, ["mic", "listo"], anclas), { en: aVideoDe(m.resultado - 0.3, anclas), sfx: "click", vol: 0.4 }, { en: aVideoDe(m.dia - 0.3, anclas), sfx: "click", vol: 0.4 },
    { en: aVideoDe(m.fiados - 0.3, anclas), sfx: "click", vol: 0.4 }, { en: aVideoDe(m.precios - 0.3, anclas), sfx: "click", vol: 0.4 },
    { en: tCuanto, sfx: "ding", vol: 0.4 }, { en: L[5][0], sfx: "whoosh", vol: 0.35 }, { en: L[5][0] + 0.3, sfx: "caja", vol: 0.35 },
  ];
  return (
    <Marco g={g} voz={voz} pal={pal} t={t} dur={dur} sonidos={sonidos} ocultos={[[L[3][0] - 0.05, L[3][1] + 0.1]]}>
      {t < tApp ? <SistemaGenerico t={t} rojo={rojo} /> : <PantallaApp demo="fb-02" r={r} />}
      <BarraEstado />
      <TextoArriba t={t} texto={<>¿Tu sistema te hace cargar <span style={{ position: "static", color: "#F5A524" }}>TODO</span>?</>} icono="lista" ejemplo={t >= tApp} />
      <CartelFinal t={t} desde={L[5][0]} />
    </Marco>
  );
};

// ---------- FB-03 · "Le saco foto a la factura" ----------
export const DemoFb03: React.FC<VideoProps> = ({ voz, palabras }) => {
  const g = GUION_FB_03;
  const { t, dur, pal, L } = base(g, palabras);
  const m = app03.marcas as Marcas;
  const w = (linea: number, p: string, d: number) => tPalabra(pal, linea, p, d);
  const tFoto = w(1, "foto", L[1][0] + 0.7), tSubio = w(2, "subió", L[2][0] + 0.8), tCada = w(2, "cada", L[2][1] - 0.6), tMargen = w(3, "margen", L[3][1] - 0.8);
  const anclas: Ancla[] = [
    [0, 0], [tFoto, m.foto - 0.05], [L[2][0], m.leido - 0.2], [tSubio, m.lista - 0.6], [tCada, m.aumentaron - 0.2],
    [L[3][0] + 0.3, m.aumentaron + 0.9], [tMargen, m.aplicado], [L[3][1] + 0.2, m.carteles],
  ];
  const r = aGrabacion(t, anclas, m.fin);
  const sonidos: Sonido[] = [
    { en: 0, sfx: "whoosh", vol: 0.3 }, ...toques(m, ["foto"], anclas), { en: aVideoDe(m.foto + 0.05, anclas), sfx: "click", vol: 0.5 },
    { en: aVideoDe(m.leido - 0.3, anclas), sfx: "ding", vol: 0.4 }, { en: aVideoDe(m.aplicado - 0.3, anclas), sfx: "click", vol: 0.45 }, { en: tMargen, sfx: "ding", vol: 0.4 },
    { en: L[4][0], sfx: "whoosh", vol: 0.35 }, { en: L[4][0] + 0.3, sfx: "caja", vol: 0.35 },
  ];
  // destello de cámara al sacar la foto
  const tf = aVideoDe(m.foto + 0.05, anclas);
  const flash = tf > 0 && t >= tf && t < tf + 0.25 ? 1 - (t - tf) / 0.25 : 0;
  return (
    <Marco g={g} voz={voz} pal={pal} t={t} dur={dur} sonidos={sonidos} ocultos={[]}>
      <PantallaApp demo="fb-03" r={r} />
      <div style={S({ inset: 0, background: "#fff", opacity: flash * 0.8 })} />
      <BarraEstado />
      <TextoArriba t={t} texto="Le saco foto a la factura" icono="camara" />
      <CartelFinal t={t} desde={L[4][0]} />
    </Marco>
  );
};
