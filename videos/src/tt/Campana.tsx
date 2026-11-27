import React from "react";
import { Audio, Sequence, getStaticFiles, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import dialogo from "../../public/voces/tt-12/dialogo.json";
import { BODY, DISP, MARKER } from "../lib/fuentes";
import { guionSchema } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, temblor } from "../v6/comun";
import { entra, sp } from "../v8/comun";
import { Escena, Telefono } from "./DondeEstaTuPlata";
import { CORAL, MOSTAZA, PAPEL, Pildora, SOMBRA, TINTA, Titulo, VERDE } from "./MatandoExplicado";
import { Pulso } from "./motion";

// Campaña 27/11: "demo" (Meta, la app de frente función por función), "dif" (Meta, contra los sistemas que te hacen
// cargar todo) y "rank" (TikTok, las 4 cosas que más plata le hacen perder a un kiosco, con comparaciones locas).
export type Pieza = "demo" | "dif" | "rank";
const FR = dialogo.frases as Record<string, { dur: number }>;
const dur = (id: string) => FR[id]?.dur ?? 2;
const g = guionSchema.parse({ id: "tt-12", titulo: "Campaña", duracionSeg: 25, voz: null, ganchos: [{ lineas: ["", "", ""], voz: "" }], lineas: [], sonidos: [] });
const TXT: Record<string, string> = {
  d1: "La app para tu kiosco que te dice cuánto ganaste de verdad.", d2: "Le hablás 20 segundos, y hace el cierre del día.", d3: "Te muestra tu ganancia real, no lo que entró a la caja.",
  d4: "Quién te debe, y le recordás por WhatsApp en un toque.", d5: "Qué te aumentó el proveedor, con una foto de la factura.", d6: "Y qué mercadería está quieta en el depósito.",
  dm: "14 días gratis. Tocá Enviar mensaje y te lo dejo andando hoy.", x1: "¿Tu sistema te hace cargar todo?", x2: "Cada producto, cada código, cada precio. Horas y horas.",
  x3: "Y al final del día, igual no sabés cuánto ganaste.", x4: "En Claro es al revés: le hablás 20 segundos, y te dice tu ganancia.", x5: "Sin cargar productos uno por uno. Sin computadora. Desde el celular.",
  xm: "Probalo 14 días gratis. Escribime y te lo dejo andando.", r0: "Las 4 cosas que más plata le hacen perder a tu kiosco. La 1 te va a doler.",
  r4: "Cuatro: el precio viejo. Es como pagarle vos al cliente para que se lleve la yerba.", r3: "Tres: la mercadería quieta. Es tener tu plata congelada en el estante.",
  r2: "Dos: el fiado. Sos un banco que presta sin interés, y encima no te devuelven.", r1: "Y la uno: no saber cuánto ganaste. Es manejar de noche con las luces apagadas.",
  ra: "En Claro te prende las luces: le hablás 20 segundos y te muestra las cuatro.", rt: "¿Cuántas te pasan a vos? Comentá el número.",
};
const IDS: Record<Pieza, string[]> = { demo: ["d1", "d2", "d3", "d4", "d5", "d6", "dm"], dif: ["x1", "x2", "x3", "x4", "x5", "xm"], rank: ["r0", "r4", "r3", "r2", "r1", "ra", "rt"] };
function linea(p: Pieza) {
  const T: Record<string, number> = {};
  let c = 0.08;
  for (const id of IDS[p]) { T[id] = c; c += dur(id) + (id === "r0" || id === "x3" || id === "r1" ? 0.35 : 0.22); }
  return { T, ids: IDS[p], total: c + 0.6 };
}
export const durTT12 = (p: Pieza) => linea(p).total;
const ap = (t: number, desde: number, dd = 0.35) => entra((t - desde) / dd);

const Boton: React.FC<{ t: number; desde: number; texto: string; top: number }> = ({ t, desde, texto, top }) => (
  <div style={{ left: 40, right: 40, top, height: 60, borderRadius: 30, background: "#25D366", boxShadow: "0 6px 0 #0f8a43", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${t > desde ? sp(t - desde, 1.08) * (1 + 0.03 * Math.sin(t * 7)) : 0})` }}>
    <span style={{ position: "static", font: `700 21px ${DISP}`, color: "#fff" }}>{texto}</span>
  </div>
);
const Marca: React.FC<{ t: number; desde: number; top: number }> = ({ t, desde, top }) => (
  <div style={{ left: 0, right: 0, top, textAlign: "center", opacity: ap(t, desde) }}>
    <div style={{ position: "static", font: `700 30px ${DISP}`, color: TINTA }}>En Claro</div>
    <div style={{ position: "static", font: `600 14px ${BODY}`, color: VERDE }}>Tené claro tu negocio · 14 días gratis</div>
  </div>
);
const Grande: React.FC<{ t: number; desde: number; texto: string; top: number; color?: string; size?: number }> = ({ t, desde, texto, top, color = CORAL, size = 40 }) => (t < desde ? null : (
  <div style={{ left: 0, right: 0, top, textAlign: "center", transform: `scale(${sp(t - desde, 1.12, 16, 0.5)})` }}>
    <span style={{ position: "static", display: "inline-block", padding: "8px 18px", borderRadius: 16, background: color, boxShadow: SOMBRA, font: `700 ${size}px ${DISP}`, color: "#fff" }}>{texto}</span>
  </div>
));

// ---------- DEMO ----------
const PANTALLAS: Record<string, { titulo: [string, string]; src?: string; video?: boolean; foco: [number, number, number]; marco?: [number, number, number, number] }> = {
  d1: { titulo: ["App para kioscos", "y almacenes"], src: "tomas/v8-11/app-inicio.jpg", foco: [0.5, 0.2, 1.1], marco: [0.04, 0.09, 0.92, 0.4] },
  d2: { titulo: ["Le hablás.", "Hace el cierre."], video: true, foco: [0.5, 0.5, 1] },
  d3: { titulo: ["Tu ganancia real,", "no la caja."], src: "tomas/fb-01/resultado.jpg", foco: [0.5, 0.22, 1.12], marco: [0.04, 0.1, 0.92, 0.38] },
  d4: { titulo: ["Quién te debe", "+ WhatsApp"], src: "tomas/p3/app-final.jpg", foco: [0.5, 0.75, 1.15], marco: [0.03, 0.83, 0.94, 0.09] },
  d5: { titulo: ["Qué aumentó", "el proveedor"], src: "tomas/v8-04/app-final.jpg", foco: [0.5, 0.15, 1.12], marco: [0.03, 0.08, 0.94, 0.22] },
  d6: { titulo: ["Plata quieta", "en el depósito"], src: "tomas/v8-03/app-final.jpg", foco: [0.5, 0.2, 1.1], marco: [0.03, 0.07, 0.94, 0.2] },
};

// ---------- DIF ----------
const Formulario: React.FC<{ t: number; desde: number }> = ({ t, desde }) => {
  const n = Math.min(999, Math.floor(Math.max(0, t - desde) * 37) + 1);
  return (
    <div style={{ left: 40, right: 40, top: 200, height: 300, borderRadius: 14, background: "#fff", boxShadow: SOMBRA, border: "1px solid #ccd" }}>
      <div style={{ left: 0, right: 0, top: 0, height: 36, background: "#5b6b82", borderRadius: "14px 14px 0 0", font: `700 13px/36px ${BODY}`, color: "#fff", paddingLeft: 14 }}>Cargar producto · {n} de ???</div>
      {["Código de barras", "Nombre", "Precio de costo", "Precio de venta", "Stock", "Proveedor"].map((l, i) => (
        <div key={l} style={{ left: 16, right: 16, top: 48 + i * 40 }}>
          <div style={{ position: "static", font: `600 10px ${BODY}`, color: "#667" }}>{l}</div>
          <div style={{ position: "static", height: 20, borderRadius: 4, border: "1.5px solid #c8ccd6", background: (Math.floor(t * 6) + i) % 6 === 0 ? "#eef3ff" : "#fafbfc" }} />
        </div>
      ))}
    </div>
  );
};
const Torre: React.FC<{ t: number; desde: number; left: number; ancho: number; tope: number }> = ({ t, desde, left, ancho, tope }) => {
  const n = Math.min(40, Math.floor(Math.max(0, t - desde) * 14));
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} style={{ left: left + ((i * 37) % 13) - 6, top: tope - i * 9, width: ancho, height: 22, borderRadius: 4, background: "#fff", border: "1.5px solid #9aa3b5", transform: `rotate(${((i * 53) % 9) - 4}deg)`, boxShadow: "0 2px 4px rgba(0,0,0,.08)" }}>
          <div style={{ left: 6, top: 7, width: ancho * 0.5, height: 5, borderRadius: 3, background: "#c8ccd6" }} />
        </div>
      ))}
    </>
  );
};
const Reloj: React.FC<{ t: number; left: number; top: number; vel: number; color?: string; size?: number }> = ({ t, left, top, vel, color = CORAL, size = 70 }) => (
  <svg viewBox="0 0 70 70" width={size} height={size} style={{ left, top }}>
    <circle cx={35} cy={35} r={31} fill="#FFFDF8" stroke={color} strokeWidth={5} />
    <line x1={35} y1={35} x2={35 + Math.sin(t * vel) * 22} y2={35 - Math.cos(t * vel) * 22} stroke={TINTA} strokeWidth={4} strokeLinecap="round" />
    <line x1={35} y1={35} x2={35 + Math.sin(t * vel / 12) * 14} y2={35 - Math.cos(t * vel / 12) * 14} stroke={TINTA} strokeWidth={5} strokeLinecap="round" />
  </svg>
);

// ---------- RANK ----------
const Fichas: React.FC<{ t: number; T: Record<string, number> }> = ({ t, T }) => {
  const orden: [string, string][] = [["4", "r4"], ["3", "r3"], ["2", "r2"], ["1", "r1"]];
  return (
    <div style={{ left: 30, right: 30, top: 18, height: 50, display: "flex", gap: 8 }}>
      {orden.map(([n, id]) => {
        const activa = t >= T[id] && (id === "r1" ? t < T.ra : t < T[orden[orden.findIndex((o) => o[1] === id) + 1]?.[1] ?? "ra"]);
        const vista = t >= T[id];
        return (
          <div key={n} style={{ position: "relative", flex: 1, borderRadius: 12, background: activa ? CORAL : vista ? TINTA : "#FFFDF8", boxShadow: SOMBRA, transform: `scale(${activa ? 1.08 : 1})`, textAlign: "center" }}>
            <span style={{ position: "static", font: `700 26px/50px ${DISP}`, color: vista ? "#fff" : n === "1" ? CORAL : TINTA }}>{n === "1" && !vista ? "1 ?" : n}</span>
          </div>
        );
      })}
    </div>
  );
};
const Comparacion: React.FC<{ t: number; desde: number; id: string }> = ({ t, desde, id }) => {
  const k = ap(t, desde, 0.4);
  if (id === "r4")
    return (
      <>
        <div style={{ left: 40, top: 250, width: 110, height: 150, borderRadius: 10, background: VERDE, border: `3px solid ${TINTA}`, transform: `rotate(-5deg) scale(${k})`, display: "flex", alignItems: "center", justifyContent: "center", font: `800 18px ${BODY}`, color: "#fff" }}>YERBA</div>
        {[0, 1, 2, 3].map((i) => { const kk = ap(t, desde + 0.6 + i * 0.25, 0.5); return <div key={i} style={{ left: 170 + kk * 90, top: 290 + i * 26 - Math.sin(kk * Math.PI) * 50, width: 40, height: 40, borderRadius: 20, background: MOSTAZA, border: `3px solid #a9761a`, opacity: kk > 0 ? 1 : 0, font: `800 14px/34px ${DISP}`, textAlign: "center", color: "#6a4a10" }}>$</div>; })}
        <Grande t={t} desde={desde + 1.6} texto="PERDÉS $400 CADA UNA" top={460} size={24} />
      </>
    );
  if (id === "r3")
    return (
      <>
        <div style={{ left: 70, top: 220, width: 220, height: 220, borderRadius: 16, background: "linear-gradient(135deg, #e3f4fb, #a9d8ec)", border: "3px solid #6fb6d6", boxShadow: "inset 0 0 30px #fff", transform: `scale(${k})`, opacity: 0.95 }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ left: 30 + i * 18, top: 50 + i * 40, width: 120, height: 56, borderRadius: 6, background: "#8FD19E", border: `2px solid ${VERDE}`, transform: `rotate(${-10 + i * 9}deg)`, opacity: 0.75, font: `700 22px/52px ${DISP}`, color: VERDE, textAlign: "center" }}>$</div>)}
          <div style={{ inset: 0, borderRadius: 14, background: "linear-gradient(160deg, rgba(255,255,255,.65), transparent 45%)" }} />
        </div>
        <Grande t={t} desde={desde + 1.3} texto="PLATA CONGELADA 🧊" top={470} color="#2f7fa6" size={30} />
      </>
    );
  if (id === "r2")
    return (
      <>
        <svg viewBox="0 0 260 200" width={260} height={200} style={{ left: 50, top: 220, transform: `scale(${k})`, transformOrigin: "50% 100%" }}>
          <path d="M10 60 L130 10 L250 60 Z" fill={TINTA} />
          <rect x={20} y={60} width={220} height={16} fill="#2b3550" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={36 + i * 52} y={80} width={20} height={90} fill="#FFFDF8" stroke={TINTA} strokeWidth={2} />)}
          <rect x={10} y={170} width={240} height={24} fill={TINTA} />
          <text x={130} y={50} textAnchor="middle" fill={MOSTAZA} style={{ font: `700 18px ${DISP}` }}>BANCO DEL KIOSCO</text>
        </svg>
        <Grande t={t} desde={desde + 1.0} texto="0% interés" top={440} color={TINTA} size={28} />
        <Grande t={t} desde={desde + 2.2} texto="NO DEVUELVEN" top={496} size={28} />
      </>
    );
  // r1: manejar de noche
  const off = (t - desde) * 160;
  return (
    <>
      <div style={{ left: 20, right: 20, top: 200, height: 260, borderRadius: 16, overflow: "hidden", background: "#070a12", transform: `scale(${0.9 + 0.1 * k})` }}>
        <div style={{ left: 0, right: 0, bottom: 0, height: 160, background: "#141823", clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)" }} />
        {[0, 1, 2, 3].map((i) => { const y = ((i * 60 + off) % 240) - 20; return <div key={i} style={{ left: 176 - y * 0.05, top: 100 + y * 0.66, width: 4 + y * 0.05, height: 10 + y * 0.12, background: "#3a3f4c" }} />; })}
        <div style={{ left: 0, right: 0, top: 30, textAlign: "center", font: `700 50px ${DISP}`, color: "#2a3040" }}>$ ? ? ?</div>
      </div>
      <Grande t={t} desde={desde + 1.4} texto="A CIEGAS" top={480} />
    </>
  );
};
const MINI: Record<string, [string, [number, number, number], [number, number, number, number]]> = {
  r4: ["tomas/v8-04/app-final.jpg", [0.5, 0.15, 1.1], [0.03, 0.08, 0.94, 0.22]], r3: ["tomas/v8-03/app-final.jpg", [0.5, 0.2, 1.1], [0.03, 0.07, 0.94, 0.2]],
  r2: ["tomas/p3/app-final.jpg", [0.5, 0.75, 1.1], [0.03, 0.83, 0.94, 0.09]], r1: ["tomas/v8-11/app-inicio.jpg", [0.5, 0.2, 1.1], [0.04, 0.09, 0.92, 0.4]],
};

export const Campana: React.FC<VideoProps & { pieza?: Pieza }> = ({ pieza = "demo" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { T, ids, total } = linea(pieza);
  const fin = (id: string) => T[id] + dur(id);
  const sonidos: { en: number; sfx: string; vol?: number }[] = [{ en: 0, sfx: "slam", vol: 0.5 }];
  const golpes: [number, number][] = [[0.02, 6]];
  let escenas: React.ReactNode = null;

  if (pieza === "demo") {
    const pasos = ["d1", "d2", "d3", "d4", "d5", "d6"];
    escenas = (
      <>
        {pasos.map((id, i) => {
          const desde = T[id], hasta = i < 5 ? T[pasos[i + 1]] : T.dm;
          const p = PANTALLAS[id];
          return (
            <Escena key={id} t={t} desde={i === 0 ? 0 : desde} hasta={hasta} zoom={[1, 1]}>
              <Titulo t={t} desde={i === 0 ? -0.8 : desde} top={i === 0 ? 30 : 34} size={i === 0 ? 34 : 32} lineas={[[p.titulo[0], TINTA], [p.titulo[1], i === 0 ? VERDE : CORAL]]} />
              {i > 0 ? <div style={{ right: 20, top: 40, font: `700 14px ${DISP}`, color: TINTA, opacity: 0.5 }}>{i}/5</div> : null}
              <Telefono t={t} desde={i === 0 ? -0.5 : desde} src={p.src} video={p.video ? { src: "tomas/fb-01/app.mp4", desde: 3.6, vel: 1.8 } : undefined} aspecto={p.video || p.src?.includes("fb-01") ? 1848 / 1080 : 2340 / 1080} foco={p.foco} marco={p.marco} fps={fps} top={118} ancho={226} altoMax={462} />
            </Escena>
          );
        })}
        {t >= T.dm ? (
          <div style={{ inset: 0, background: PAPEL }}>
            <Marca t={t} desde={T.dm} top={110} />
            {["Cierre por voz", "Ganancia real", "Fiados + WhatsApp", "Precios y facturas", "Plata quieta"].map((x, i) => <div key={x} style={{ left: 70, top: 210 + i * 40, font: `700 18px ${BODY}`, color: TINTA, opacity: ap(t, T.dm + 0.2 + i * 0.12) }}>✅  {x}</div>)}
            <Boton t={t} desde={T.dm + 1} texto="Enviar mensaje ➜" top={450} />
          </div>
        ) : null}
      </>
    );
    pasos.slice(1).concat("dm").forEach((id) => sonidos.push({ en: T[id] - 0.05, sfx: "whoosh", vol: 0.35 }, { en: T[id] + 0.9, sfx: "click", vol: 0.3 }));
  } else if (pieza === "dif") {
    escenas = (
      <>
        <Escena t={t} desde={0} hasta={T.x3} zoom={[1, 1.05]}>
          <Titulo t={t} desde={-0.8} top={50} size={34} lineas={[["¿Tu sistema te hace", TINTA], ["cargar TODO?", CORAL]]} />
          {t < T.x2 ? <Formulario t={t} desde={0} /> : (
            <>
              <Torre t={t} desde={T.x2} left={110} ancho={140} tope={500} />
              <Reloj t={t} left={30} top={170} vel={14} />
              <Grande t={t} desde={T.x2 + 1.3} texto="HORAS Y HORAS" top={520} size={30} />
            </>
          )}
        </Escena>
        <Escena t={t} desde={T.x3} hasta={T.x4}>
          <Titulo t={t} desde={T.x3} top={80} size={32} lineas={[["Y al final del día…", TINTA]]} />
          <div style={{ left: 40, right: 40, top: 200, height: 200, borderRadius: 20, background: "#FFFDF8", boxShadow: SOMBRA, textAlign: "center" }}>
            <div style={{ left: 0, right: 0, top: 30, font: `800 14px ${BODY}`, letterSpacing: 2, color: TINTA, opacity: 0.6 }}>GANANCIA DE HOY</div>
            <div style={{ left: 0, right: 0, top: 60, font: `700 90px ${DISP}`, color: CORAL, transform: `rotate(${Math.sin(t * 6) * 3}deg)` }}>$ ¿?</div>
          </div>
          <Grande t={t} desde={T.x3 + 1.2} texto="IGUAL NO SABÉS" top={440} size={32} />
        </Escena>
        <Escena t={t} desde={T.x4} hasta={T.xm} zoom={[1, 1]}>
          <div style={{ left: 0, width: 178, top: 0, bottom: 0, background: "#ECE4D4" }} />
          <div style={{ left: 178, width: 4, top: 0, bottom: 0, background: TINTA }} />
          <div style={{ left: 0, width: 178, top: 24, textAlign: "center", font: `800 12px ${BODY}`, letterSpacing: 1.2, color: TINTA }}>SISTEMA DE CAJA</div>
          <div style={{ left: 182, right: 0, top: 24, textAlign: "center", font: `800 12px ${BODY}`, letterSpacing: 1.2, color: VERDE }}>EN CLARO</div>
          <Torre t={t} desde={T.x4 - 3} left={34} ancho={110} tope={470} />
          <Reloj t={t} left={58} top={60} vel={14} size={62} />
          <div style={{ left: 0, width: 178, top: 520, textAlign: "center", font: `700 26px ${DISP}`, color: CORAL }}>3 horas</div>
          {t < T.x4 + 2.4 ? <Telefono t={t} desde={T.x4} video={{ src: "tomas/fb-01/app.mp4", desde: 3.6, vel: 2.2 }} aspecto={1848 / 1080} foco={[0.5, 0.5, 1]} fps={fps} top={100} ancho={150} altoMax={300} cx={270} />
            : <Telefono t={t} desde={T.x4 + 2.4} src="tomas/fb-01/resultado.jpg" aspecto={1848 / 1080} foco={[0.5, 0.25, 1.1]} marco={[0.04, 0.1, 0.92, 0.38]} fps={fps} top={100} ancho={150} altoMax={300} cx={270} />}
          <div style={{ left: 182, right: 0, top: 520, textAlign: "center", font: `700 26px ${DISP}`, color: VERDE }}>20 segundos</div>
          {t >= T.x5 ? (
            <div style={{ left: 196, right: 10, top: 420 }}>
              {["Sin cargar productos", "Sin computadora", "Desde el celular"].map((x, i) => <div key={x} style={{ position: "static", font: `700 12px/1.9 ${BODY}`, color: TINTA, opacity: ap(t, T.x5 + i * 0.7) }}>✅ {x}</div>)}
            </div>
          ) : null}
        </Escena>
        {t >= T.xm ? (
          <div style={{ inset: 0, background: PAPEL }}>
            <Marca t={t} desde={T.xm} top={140} />
            <Grande t={t} desde={T.xm + 0.4} texto="Le hablás. Listo." top={250} color={VERDE} size={30} />
            <Boton t={t} desde={T.xm + 0.9} texto="Escribime por WhatsApp ➜" top={380} />
          </div>
        ) : null}
      </>
    );
    [T.x2, T.x3, T.x4, T.xm].forEach((en) => sonidos.push({ en: en - 0.05, sfx: "whoosh", vol: 0.35 }));
    [0, 1, 2, 3, 4, 5].forEach((i) => sonidos.push({ en: 0.3 + i * 0.35, sfx: "click", vol: 0.25 }, { en: T.x2 + i * 0.3, sfx: "papel", vol: 0.25 }));
    sonidos.push({ en: T.x3 + 1.2, sfx: "buzz", vol: 0.4 }, { en: T.x4 + 2.4, sfx: "ding", vol: 0.45 });
    golpes.push([T.x3 + 1.2, 5]);
  } else {
    const items = ["r4", "r3", "r2", "r1"];
    const tit: Record<string, [string, string]> = { r4: ["El precio viejo", "le pagás al cliente"], r3: ["Mercadería quieta", "plata congelada"], r2: ["El fiado", "sos un banco gratis"], r1: ["No saber cuánto ganás", "manejar sin luces"] };
    escenas = (
      <>
        <Escena t={t} desde={0} hasta={T.r4} zoom={[1, 1.05]}>
          <Titulo t={t} desde={-0.8} top={110} size={28} lineas={[["Las 4 cosas que más", TINTA], ["plata le hacen perder", TINTA], ["a tu kiosco", CORAL]]} />
          <Grande t={t} desde={T.r0 + dur("r0") * 0.6} texto="la 1 te va a doler" top={300} size={28} />
          {[4, 3, 2, 1].map((n, i) => <div key={n} style={{ left: 40 + i * 74, top: 400, width: 62, height: 80, borderRadius: 14, background: n === 1 ? CORAL : TINTA, boxShadow: SOMBRA, font: `700 40px/80px ${DISP}`, color: "#fff", textAlign: "center", transform: `scale(${sp(t - 0.3 - i * 0.15, 1.1)})` }}>{n === 1 ? "?" : n}</div>)}
        </Escena>
        {items.map((id, i) => (
          <Escena key={id} t={t} desde={T[id]} hasta={i < 3 ? T[items[i + 1]] : T.ra}>
            <Titulo t={t} desde={T[id]} top={86} size={30} lineas={[[tit[id][0], TINTA], [tit[id][1], CORAL]]} />
            {t < fin(id) - 1.0 ? <Comparacion t={t} desde={T[id] + 0.3} id={id} /> : null}
            {t >= fin(id) - 1.0 ? <Telefono t={t} desde={fin(id) - 1.0} src={MINI[id][0]} foco={MINI[id][1]} marco={MINI[id][2]} fps={fps} top={190} ancho={180} altoMax={390} cx={180} /> : null}
          </Escena>
        ))}
        {t >= T.r4 && t < T.ra ? <Fichas t={t} T={T} /> : null}
        <Escena t={t} desde={T.ra} hasta={T.rt} zoom={[1, 1]}>
          <div style={{ inset: 0, background: PAPEL }} />
          <Titulo t={t} desde={T.ra} top={34} size={30} lineas={[["En Claro te", TINTA], ["prende las luces", VERDE]]} />
          <Telefono t={t} desde={T.ra} src="tomas/v8-11/app-inicio.jpg" foco={[0.5, 0.2, 1.1]} marco={[0.04, 0.09, 0.92, 0.4]} fps={fps} top={120} ancho={226} altoMax={462} />
        </Escena>
        {t >= T.rt ? (
          <div style={{ inset: 0, background: PAPEL }}>
            <Titulo t={t} desde={T.rt} top={90} size={36} lineas={[["¿Cuántas te", TINTA], ["pasan a vos?", CORAL]]} />
            {[4, 3, 2, 1].map((n, i) => <div key={n} style={{ left: 40 + i * 74, top: 240, width: 62, height: 80, borderRadius: 14, background: TINTA, boxShadow: SOMBRA, font: `700 40px/80px ${DISP}`, color: "#fff", textAlign: "center", transform: `scale(${sp(t - T.rt - 0.2 - i * 0.1, 1.1)})` }}>{n}</div>)}
            <Pildora t={t} desde={T.rt + 0.8} texto="COMENTÁ EL NÚMERO 👇" top={360} centro fondo={CORAL} color="#fff" size={18} />
            <Marca t={t} desde={T.rt + 1.1} top={440} />
          </div>
        ) : null}
      </>
    );
    items.concat("ra", "rt").forEach((id) => sonidos.push({ en: T[id] - 0.05, sfx: "whoosh", vol: 0.35 }, { en: T[id] + 0.05, sfx: "thump", vol: 0.4 }));
    sonidos.push({ en: T.r4 + 0.9, sfx: "coins", vol: 0.4 }, { en: T.r3 + 0.4, sfx: "vidrio", vol: 0.25 }, { en: T.r2 + 1.3, sfx: "sello", vol: 0.45 }, { en: T.r2 + 2.5, sfx: "buzz", vol: 0.4 }, { en: T.r1 + 0.3, sfx: "viento", vol: 0.3 }, { en: T.ra + 0.2, sfx: "ding", vol: 0.45 });
    items.forEach((id) => { sonidos.push({ en: fin(id) - 1.0, sfx: "click", vol: 0.35 }); golpes.push([T[id], 4]); });
    golpes.push([T.r1, 7]);
  }

  const cta = ids[ids.length - 1];
  const h = ids.find((id) => t >= T[id] && t < T[id] + dur(id) + 0.1);
  const fondo = (
    <>
      <div style={{ inset: 0, background: PAPEL, backgroundImage: `radial-gradient(${TINTA}1c 1.2px, transparent 1.3px)`, backgroundSize: "22px 22px" }} />
      {escenas}
      {h && h !== cta ? (
        <div style={{ left: 16, right: 16, top: 592, textAlign: "center" }}>
          <span style={{ position: "static", display: "inline-block", padding: "6px 12px", borderRadius: 12, background: "rgba(27,35,51,.92)", font: `600 13.5px/1.3 ${BODY}`, color: "#fff" }}>{TXT[h]}</span>
        </div>
      ) : null}
    </>
  );
  sonidos.push({ en: T[cta] + 0.9, sfx: "ding", vol: 0.4 });
  const archivos = getStaticFiles().map((f) => f.name);
  const voces = ids.filter((id) => archivos.includes(`voces/tt-12/${id}.mp3`)).map((id) => (
    <Sequence key={id} from={Math.round(T[id] * fps)} durationInFrames={Math.round((dur(id) + 0.6) * fps)} layout="none"><Audio src={staticFile(`voces/tt-12/${id}.mp3`)} /></Sequence>
  ));
  void MARKER;
  return <Marco g={g} voz={null} pal={[]} cam={{ z: 1, rot: 0, tx: 0, ty: 0, blur: 0 }} hs={temblor(t, golpes)} wf={0} red={0} frame={frame} t={t} sonidos={sonidos.filter((s) => s.en >= 0)} ocultos={[]} fondo={fondo} frente={null} sobre={<>{voces}<Pulso fps={fps} fin={total} silencios={[]} vol={0.09} /></>} />;
};
