import React from "react";
import { Audio, Sequence, getStaticFiles, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import dialogo from "../../public/voces/tt-11/dialogo.json";
import { clamp, eIO } from "../lib/anim";
import { BODY, DISP, MARKER } from "../lib/fuentes";
import { guionSchema } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, temblor } from "../v6/comun";
import { entra, sp } from "../v8/comun";
import { Escena, Telefono } from "./DondeEstaTuPlata";
import { CORAL, MOSTAZA, PAPEL, Pildora, SOMBRA, TINTA, Titulo, VERDE } from "./MatandoExplicado";
import { Pulso } from "./motion";

// TT-11 "Vendiste un alfajor a $1.000. ¿Cuánto ganaste?" (aprobado 27/11). Situación de mostrador + pregunta A/B/C,
// el billete se vuelve pizza de 8 porciones y cada gasto se lleva lo suyo. Cuentas de la demo de la app (vendiste $150.000,
// ganancia $23.500): de cada $1.000 → mercadería $650 · fijos $120 · gastos $73 · vos $157.

type Canal = "meta" | "tiktok";
const FR = dialogo.frases as Record<string, { dur: number }>;
const dur = (id: string) => FR[id]?.dur ?? 1.5;
const g = guionSchema.parse({ id: "tt-11", titulo: "La pizza", duracionSeg: 25, voz: null, ganchos: [{ lineas: ["", "", ""], voz: "" }], lineas: [], sonidos: [] });
const TXT: Record<string, string> = {
  z1: "Vendiste un alfajor a mil. ¿Cuánto ganaste?", z2: "Casi todos dicen $350. Error.", z3: "Mirá tu billete como si fuera una pizza.",
  z4: "El proveedor se come más de cinco porciones.", z5: "Alquiler y luz, una.", z6: "La comisión y los gastos, un mordisco.",
  z7: "Y vos, una porción. $157.", z8: "Y si encima era fiado, te quedaste sin pizza.", z9: "En Claro te dice tu porción real. Todas las noches.",
  zt: "¿Cuál dijiste vos? Comentá.", zm: "Escribime por WhatsApp y te lo dejo andando. 14 días gratis.",
};

function linea(canal: Canal) {
  const ids = ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8", "z9", canal === "meta" ? "zm" : "zt"];
  const aire: Record<string, number> = { z1: 0.35, z2: 0.2, z3: 0.15, z4: 0.25, z5: 0.25, z6: 0.25, z7: 0.4, z8: 0.35, z9: 0.3 };
  const T: Record<string, number> = {};
  let c = 0.08;
  for (const id of ids) { T[id] = c; c += dur(id) + (aire[id] ?? 0.2); }
  T.cta = T[ids[ids.length - 1]];
  return { T, ids, total: c + 0.6 };
}
export const durTT11 = (canal: Canal) => linea(canal).total;

const ap = (t: number, desde: number, dd = 0.35) => entra((t - desde) / dd);
const rad = (a: number) => ((a - 90) * Math.PI) / 180;
const CX = 180, CY = 340, R = 128;
const cuña = (a0: number, a1: number, r = R) => `M0 0 L${Math.cos(rad(a0)) * r} ${Math.sin(rad(a0)) * r} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${Math.cos(rad(a1)) * r} ${Math.sin(rad(a1)) * r} Z`;

// grupos de la pizza: [desde°, hasta°, nombre, monto, color de etiqueta]
const GRUPOS: [number, number, string, number, string][] = [
  [0, 234, "MERCADERÍA (PROVEEDOR)", 650, TINTA], [234, 277.2, "ALQUILER Y LUZ", 120, CORAL], [277.2, 303.5, "COMISIÓN Y GASTOS", 73, CORAL], [303.5, 360, "VOS", 157, VERDE],
];

const Porcion: React.FC<{ a0: number; a1: number; dx: number; dy: number; s: number; rot: number; op: number; brillo?: number }> = ({ a0, a1, dx, dy, s, rot, op, brillo = 0 }) => {
  const pep: [number, number][] = [];
  for (let a = a0 + 12; a < a1 - 6; a += 22) for (const r of [48, 92]) pep.push([Math.cos(rad(a + (r === 48 ? 8 : 0))) * r, Math.sin(rad(a + (r === 48 ? 8 : 0))) * r]);
  const cortes = [];
  for (let a = Math.ceil(a0 / 45) * 45; a < a1; a += 45) if (a > a0) cortes.push(a);
  return (
    <g transform={`translate(${CX + dx} ${CY + dy}) rotate(${rot}) scale(${s})`} opacity={op}>
      {brillo > 0 ? <path d={cuña(a0, a1, R + 10)} fill={MOSTAZA} opacity={0.5 * brillo} filter="url(#blur)" /> : null}
      <path d={cuña(a0, a1, R)} fill="#D99A4E" stroke={TINTA} strokeWidth={3} strokeLinejoin="round" />
      <path d={cuña(a0, a1, R - 14)} fill="#F6C453" />
      {pep.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill="#C0392B" stroke="#8e2a20" strokeWidth={1.5} />)}
      {cortes.map((a) => <line key={a} x1={0} y1={0} x2={Math.cos(rad(a)) * R} y2={Math.sin(rad(a)) * R} stroke="#B9772F" strokeWidth={2} />)}
    </g>
  );
};

const Camion: React.FC<{ x: number }> = ({ x }) => (
  <svg viewBox="0 0 160 90" width={160} height={90} style={{ left: x, top: 300, overflow: "visible" }}>
    <rect x={0} y={10} width={100} height={56} rx={6} fill="#FFFDF8" stroke={TINTA} strokeWidth={3} />
    <text x={50} y={44} textAnchor="middle" fill={TINTA} style={{ font: `800 12px ${BODY}`, letterSpacing: 1 }}>PROVEEDOR</text>
    <path d="M100 26 H132 L152 46 V66 H100 Z" fill={CORAL} stroke={TINTA} strokeWidth={3} strokeLinejoin="round" />
    <rect x={110} y={32} width={18} height={14} fill="#CFE6EE" stroke={TINTA} strokeWidth={2} />
    {[26, 124].map((cx) => <circle key={cx} cx={cx} cy={70} r={12} fill={TINTA} />)}
  </svg>
);

const Mordedor: React.FC<{ t: number; desde: number; ico: "casa" | "posnet"; left: number; top: number }> = ({ t, desde, ico, left, top }) => {
  if (t < desde) return null;
  const s = sp(t - desde, 1.08, 16, 0.55);
  const ch = Math.sin(Math.max(0, t - desde - 0.4) * 22) * (t - desde > 0.4 && t - desde < 1 ? 6 : 0);
  return (
    <svg viewBox="0 0 90 90" width={90} height={90} style={{ left, top, transform: `scale(${s}) translateY(${ch}px)` }}>
      {ico === "casa" ? (
        <>
          <path d="M10 42 L45 12 L80 42 V82 H10 Z" fill="#FFFDF8" stroke={TINTA} strokeWidth={3} strokeLinejoin="round" />
          <rect x={36} y={56} width={18} height={26} fill={MOSTAZA} stroke={TINTA} strokeWidth={2.5} />
          <path d="M60 50 l-8 12 h8 l-6 12" fill="none" stroke={CORAL} strokeWidth={3} strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x={20} y={8} width={50} height={76} rx={10} fill={TINTA} />
          <rect x={27} y={16} width={36} height={24} rx={4} fill="#7CF29A" />
          {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={28 + c * 12} y={48 + r * 11} width={9} height={7} rx={2} fill="#e8e2d6" />))}
          <text x={45} y={33} textAnchor="middle" style={{ font: `800 10px ${BODY}` }} fill={TINTA}>QR</text>
        </>
      )}
    </svg>
  );
};

const Opcion: React.FC<{ t: number; desde: number; letra: string; texto: string; top: number; estado?: "bien" | "mal" | "nada" }> = ({ t, desde, letra, texto, top, estado = "nada" }) => {
  const k = ap(t, desde, 0.3);
  const bg = estado === "bien" ? VERDE : "#FFFDF8", fg = estado === "bien" ? "#fff" : TINTA;
  return (
    <div style={{ left: 40, right: 40, top, height: 50, borderRadius: 14, background: bg, boxShadow: SOMBRA, opacity: k, transform: `translateX(${(1 - k) * 80}px) scale(${estado === "bien" ? 1 + 0.03 * Math.sin(t * 8) : 1})`, display: "flex", alignItems: "center" }}>
      <span style={{ position: "static", marginLeft: 12, width: 30, height: 30, borderRadius: 15, background: estado === "bien" ? "#fff" : TINTA, color: estado === "bien" ? VERDE : PAPEL, font: `800 16px/30px ${DISP}`, textAlign: "center" }}>{letra}</span>
      <span style={{ position: "static", marginLeft: 14, font: `700 22px ${DISP}`, color: fg, textDecoration: estado === "mal" ? "line-through" : undefined, textDecorationColor: CORAL, textDecorationThickness: 3 }}>{texto}</span>
      {estado === "mal" ? <span style={{ position: "static", marginLeft: "auto", marginRight: 14, font: `800 20px ${BODY}`, color: CORAL }}>✗</span> : null}
    </div>
  );
};

const Mostrador: React.FC<{ t: number }> = ({ t }) => {
  const k = sp(t + 0.4, 1.02, 14, 0.6);
  return (
    <>
      <div style={{ left: -20, right: -20, top: 470, height: 200, background: "#C98B4E", borderTop: `4px solid ${TINTA}` }} />
      <div style={{ left: -20, right: -20, top: 478, height: 8, background: "#B07438" }} />
      <div style={{ left: 60, top: 430, width: 92, height: 52, borderRadius: 10, background: "#5A3A22", border: `3px solid ${TINTA}`, transform: "rotate(-6deg)", display: "flex", alignItems: "center", justifyContent: "center", font: `800 11px ${BODY}`, color: "#F3E2BF", letterSpacing: 1 }}>ALFAJOR</div>
      <div style={{ left: 178, top: 418 - (1 - k) * 260, width: 132, height: 62, borderRadius: 6, background: "#8FD19E", border: `3px solid ${VERDE}`, transform: `rotate(${8 - (1 - k) * 30}deg)`, boxShadow: SOMBRA }}>
        <div style={{ left: 10, top: 8, font: `700 26px ${DISP}`, color: "#1f5e36" }}>$1.000</div>
        <div style={{ right: 10, top: 12, width: 34, height: 34, borderRadius: 17, border: "2px solid #1f5e36", opacity: 0.5 }} />
      </div>
    </>
  );
};

export const LaPizza: React.FC<VideoProps & { canal?: Canal }> = ({ canal = "tiktok" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { T, ids } = linea(canal);
  const d = dur;
  const fin = T.z9 + d("z9") + 0.3;

  // pizza
  const sale = ap(t, T.z4 + 0.7, 1.1);
  const mord1 = ap(t, T.z5 + 0.45, 0.45), mord2 = ap(t, T.z6 + 0.5, 0.45);
  const vuela = ap(t, T.z8 + 0.6, 0.8);
  const entraPizza = ap(t, T.z3, 0.7);
  const queda = t < T.z4 + 0.7 ? 1000 : t < T.z5 + 0.45 ? 1000 - 650 * sale : t < T.z6 + 0.5 ? 350 - 120 * mord1 : t < T.z8 + 0.6 ? 230 - 73 * mord2 : 157 - 157 * vuela;
  const zoomVos = t >= T.z7 && t < T.z8 + 0.6 ? ap(t, T.z7, 0.6) : t >= T.z8 + 0.6 ? 1 - ap(t, T.z8 + 0.6, 0.5) : 0;
  const zv = 1 + 0.55 * eIO(zoomVos);
  const fx = CX + Math.cos(rad(331)) * 70, fy = CY + Math.sin(rad(331)) * 70;

  const pizza = (
    <div style={{ inset: 0, transformOrigin: `${fx}px ${fy}px`, transform: `scale(${zv})` }}>
      <svg viewBox="0 0 360 640" width={360} height={640} style={{ left: 0, top: 0, overflow: "visible" }}>
        <defs><filter id="blur"><feGaussianBlur stdDeviation="6" /></filter></defs>
        <ellipse cx={CX} cy={CY + 8} rx={R + 26} ry={R + 22} fill="#FFFDF8" stroke="#1B233322" strokeWidth={2} />
        <g transform={`translate(${CX} ${CY}) rotate(${(1 - entraPizza) * -200}) scale(${0.3 + 0.7 * entraPizza}) translate(${-CX} ${-CY})`}>
          <Porcion a0={0} a1={234} dx={sale * 420} dy={-sale * 20} s={1} rot={0} op={1} />
          <Porcion a0={234} a1={277.2} dx={-mord1 * 40} dy={-mord1 * 30} s={1 - mord1 * 0.9} rot={0} op={1 - mord1} />
          <Porcion a0={277.2} a1={303.5} dx={-mord2 * 30} dy={-mord2 * 40} s={1 - mord2 * 0.9} rot={0} op={1 - mord2} />
          <Porcion a0={303.5} a1={360} dx={-vuela * 150} dy={vuela * 210} s={1 - vuela * 0.75} rot={-vuela * 160} op={1 - vuela * 0.9} brillo={zoomVos * (0.6 + 0.4 * Math.sin(t * 8))} />
        </g>
      </svg>
    </div>
  );

  const etiquetas: [string, number, string, number][] = [["PROVEEDOR −$650", T.z4 + 0.6, TINTA, 150], ["ALQUILER Y LUZ −$120", T.z5 + 0.3, CORAL, 196], ["COMISIÓN Y GASTOS −$73", T.z6 + 0.35, CORAL, 242]];

  const enCierre = t >= T.cta - 0.1;
  const fondo = (
    <>
      <div style={{ inset: 0, background: PAPEL, backgroundImage: `radial-gradient(${TINTA}1c 1.2px, transparent 1.3px)`, backgroundSize: "22px 22px" }} />
      {/* 1 · mostrador + pregunta */}
      <Escena t={t} desde={0} hasta={T.z3} zoom={[1, 1.06]}>
        <Titulo t={t} desde={-0.8} top={54} size={30} lineas={[["Vendiste un alfajor", TINTA], ["a $1.000.", VERDE]]} />
        <Titulo t={t} desde={-0.6} top={126} size={38} lineas={[["¿Cuánto ganaste?", CORAL]]} />
        <Opcion t={t} desde={0.35} letra="A" texto="$1.000" top={190} />
        <Opcion t={t} desde={0.5} letra="B" texto="$350" top={250} estado={t > T.z2 + d("z2") * 0.7 ? "mal" : "nada"} />
        <Opcion t={t} desde={0.65} letra="C" texto="$157" top={310} />
        {t >= T.z2 && t < T.z2 + d("z2") * 0.7 ? <div style={{ left: 300, top: 252, font: `700 30px ${DISP}`, color: CORAL, transform: `scale(${sp(t - T.z2, 1.1)})` }}>{3 - Math.min(2, Math.floor(((t - T.z2) / (d("z2") * 0.7)) * 3))}</div> : null}
        {t >= T.z2 ? <Pildora t={t} desde={T.z2} texto="LA MAYORÍA DICE LA B" top={378} centro fondo={MOSTAZA} color={TINTA} size={13} /> : null}
        <Mostrador t={t} />
      </Escena>
      {/* 2 · la pizza */}
      <Escena t={t} desde={T.z3} hasta={T.z9} zoom={[1, 1]}>
        <div style={{ left: 0, right: 0, top: 70, textAlign: "center", opacity: ap(t, T.z3 + 0.2) }}>
          <span style={{ position: "static", font: `700 28px ${DISP}`, color: TINTA }}>Tus $1.000 = </span><span style={{ position: "static", font: `700 28px ${DISP}`, color: CORAL }}>1 pizza</span>
        </div>
        {pizza}
        {t >= T.z4 - 0.1 && t < T.z5 + 0.5 ? <Camion x={360 - ap(t, T.z4, 0.6) * 180 + sale * 420} /> : null}
        {t < T.z6 ? <Mordedor t={t} desde={T.z5} ico="casa" left={34} top={196} /> : null}
        {t < T.z7 ? <Mordedor t={t} desde={T.z6} ico="posnet" left={34} top={196} /> : null}
        {etiquetas.map(([txt, en, c, top]) => (t >= en && t < T.z7 ? <Pildora key={txt} t={t} desde={en} texto={txt} top={top + 14} left={206} fondo={c} color="#fff" size={12} /> : null))}
        {t >= T.z7 + 0.3 && t < T.z8 + 0.5 ? (
          <div style={{ left: 0, right: 0, top: 520, textAlign: "center", transform: `scale(${sp(t - T.z7 - 0.3, 1.12, 16, 0.5)})` }}>
            <span style={{ position: "static", display: "inline-block", padding: "10px 22px", borderRadius: 18, background: VERDE, boxShadow: SOMBRA, font: `700 40px ${DISP}`, color: "#fff" }}>VOS: $157</span>
          </div>
        ) : null}
        {t >= T.z8 ? (
          <>
            <div style={{ left: 36, top: 486, width: 96, height: 76, borderRadius: 8, background: "#FFFDF4", boxShadow: SOMBRA, transform: `rotate(-6deg) scale(${sp(t - T.z8, 1.06)})` }}>
              <div style={{ left: 0, top: 0, bottom: 0, width: 12, background: CORAL, borderRadius: "8px 0 0 8px" }} />
              <div style={{ left: 20, top: 10, font: `16px ${MARKER}`, color: TINTA }}>FIADOS</div>
              <div style={{ left: 20, top: 36, font: `13px ${MARKER}`, color: CORAL }}>alfajor $1.000</div>
            </div>
            {t >= T.z8 + 1.4 ? <div style={{ left: 0, right: 0, top: 196, textAlign: "center", font: `700 150px ${DISP}`, color: CORAL, opacity: 0.85, transform: `scale(${sp(t - T.z8 - 1.4, 1.2, 18, 0.5)})` }}>✗</div> : null}
          </>
        ) : null}
        <div style={{ left: 0, right: 0, top: 120, textAlign: "center", opacity: ap(t, T.z4) }}>
          <span style={{ position: "static", display: "inline-block", padding: "4px 14px", borderRadius: 12, background: "#FFFDF8", boxShadow: SOMBRA, font: `800 11px ${BODY}`, letterSpacing: 1.4, color: TINTA }}>TE QUEDA <span style={{ font: `700 20px ${DISP}`, color: queda > 200 ? TINTA : queda > 0 ? VERDE : CORAL, letterSpacing: 0 }}>${Math.round(queda).toLocaleString("es-AR")}</span></span>
        </div>
      </Escena>
      {/* 3 · la app */}
      <Escena t={t} desde={T.z9} hasta={T.cta} zoom={[1, 1]}>
        <div style={{ inset: 0, background: PAPEL }} />
        <Telefono t={t} desde={T.z9} src="tomas/v8-11/app-inicio.jpg" foco={[0.5, 0.2, 1.15]} marco={[0.04, 0.09, 0.92, 0.4]} fps={fps} />
        <Pildora t={t} desde={T.z9 + 0.2} texto="TU PORCIÓN REAL, CADA NOCHE" top={36} centro fondo={TINTA} color={PAPEL} size={14} />
      </Escena>
      {/* 4 · vuelve la pregunta */}
      {enCierre ? (
        <div style={{ inset: 0, background: PAPEL, opacity: ap(t, T.cta - 0.1, 0.25) }}>
          <Titulo t={t} desde={T.cta - 0.1} top={70} size={34} lineas={[["¿Cuál dijiste", TINTA], ["vos?", CORAL]]} />
          <Opcion t={t} desde={T.cta} letra="A" texto="$1.000" top={180} estado="mal" />
          <Opcion t={t} desde={T.cta + 0.1} letra="B" texto="$350" top={240} estado="mal" />
          <Opcion t={t} desde={T.cta + 0.2} letra="C" texto="$157" top={300} estado="bien" />
          {canal === "tiktok" ? (
            <Pildora t={t} desde={T.cta + 0.6} texto="COMENTÁ A, B o C 👇" top={400} centro fondo={CORAL} color="#fff" size={18} />
          ) : (
            <div style={{ left: 40, right: 40, top: 400, height: 60, borderRadius: 30, background: "#25D366", boxShadow: "0 6px 0 #0f8a43", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${t > T.cta + 0.6 ? sp(t - T.cta - 0.6, 1.08) * (1 + 0.03 * Math.sin(t * 7)) : 0})` }}>
              <span style={{ position: "static", font: `700 21px ${DISP}`, color: "#fff" }}>Escribime por WhatsApp ➜</span>
            </div>
          )}
          <div style={{ left: 0, right: 0, top: 486, textAlign: "center", opacity: ap(t, T.cta + 0.9) }}>
            <div style={{ position: "static", font: `700 26px ${DISP}`, color: TINTA }}>En Claro</div>
            <div style={{ position: "static", font: `600 14px ${BODY}`, color: VERDE }}>Tené claro tu negocio · 14 días gratis</div>
          </div>
        </div>
      ) : null}
      {(() => {
        const h = ids.find((id) => t >= T[id] && t < T[id] + d(id) + 0.1);
        return h && !enCierre ? (
          <div style={{ left: 16, right: 16, top: 592, textAlign: "center" }}>
            <span style={{ position: "static", display: "inline-block", padding: "6px 12px", borderRadius: 12, background: "rgba(27,35,51,.92)", font: `600 13.5px/1.3 ${BODY}`, color: "#fff" }}>{TXT[h]}</span>
          </div>
        ) : null;
      })()}
    </>
  );

  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "slam", vol: 0.5 }, { en: 0.35, sfx: "tic", vol: 0.4 }, { en: 0.5, sfx: "tic", vol: 0.4 }, { en: 0.65, sfx: "tic", vol: 0.4 },
    ...[0, 1, 2].map((i) => ({ en: T.z2 + (i * d("z2") * 0.7) / 3, sfx: "reloj", vol: 0.4 })), { en: T.z2 + d("z2") * 0.7, sfx: "buzz", vol: 0.45 },
    { en: T.z3 - 0.05, sfx: "whoosh", vol: 0.45 }, { en: T.z3 + 0.6, sfx: "thump", vol: 0.45 },
    { en: T.z4, sfx: "whoosh", vol: 0.3 }, { en: T.z4 + 0.7, sfx: "thump", vol: 0.5 }, { en: T.z5 + 0.45, sfx: "papel_arrancado", vol: 0.45 }, { en: T.z6 + 0.5, sfx: "papel_arrancado", vol: 0.4 },
    { en: T.z7, sfx: "ding", vol: 0.5 }, { en: T.z8 + 0.6, sfx: "whoosh", vol: 0.4 }, { en: T.z8 + 1.4, sfx: "buzz", vol: 0.4 },
    { en: T.z9 - 0.05, sfx: "whoosh", vol: 0.35 }, { en: T.z9 + 0.1, sfx: "click", vol: 0.4 }, { en: T.cta, sfx: "ding", vol: 0.45 },
  ];
  const archivos = getStaticFiles().map((f) => f.name);
  const voces = ids.filter((id) => archivos.includes(`voces/tt-11/${id}.mp3`)).map((id) => (
    <Sequence key={id} from={Math.round(T[id] * fps)} durationInFrames={Math.round((d(id) + 0.6) * fps)} layout="none"><Audio src={staticFile(`voces/tt-11/${id}.mp3`)} /></Sequence>
  ));
  const hs = temblor(t, [[0.02, 7], [T.z2 + d("z2") * 0.7, 5], [T.z4 + 0.7, 6], [T.z8 + 1.4, 6]]);
  void fin; void clamp;
  return <Marco g={g} voz={null} pal={[]} cam={{ z: 1, rot: 0, tx: 0, ty: 0, blur: 0 }} hs={hs} wf={0} red={0} frame={frame} t={t} sonidos={sonidos} ocultos={[]} fondo={fondo} frente={null} sobre={<>{voces}<Pulso fps={fps} fin={linea(canal).total} silencios={[]} vol={0.09} /></>} />;
};
