import React from "react";
import { OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, eIO } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { guionSchema } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Celular, Marco, camaraBeats, temblor } from "../v6/comun";
import { entra, sp } from "../v8/comun";
import { armar } from "./MatandoKiosco";
import { Pulso, Voces, bips } from "./motion";

// TT-06 v2 "Estás matando a tu kiosco", versión explicada: ilustración editorial premium (papel crema, tinta azul),
// diagramas que explican cada dolor (cascada de la caja, margen que se achica), cámara que viaja por un mundo de paneles
// y una barra "salud de tu kiosco" que baja todo el video (loop abierto). Misma voz que el TT-06 (Charon).

const g = guionSchema.parse({ id: "tt-06", titulo: "Estás matando a tu kiosco", duracionSeg: 30, voz: null, ganchos: [{ lineas: ["", "", ""], voz: "" }], lineas: [], sonidos: [] });

const PAPEL = "#F4EEE3", TINTA = "#1B2333", MOSTAZA = "#E9A621", CORAL = "#D9483B", VERDE = "#2F8F5B", CELESTE = "#DCEBEF", GRIS = "#8E98A4";
const SOMBRA = "0 10px 24px rgba(27,35,51,.14), 0 2px 4px rgba(27,35,51,.08)";

const TXT: Record<string, string> = {
  a2: "Y lo hacés de 3 formas. Contá cuántas hacés vos.",
  a3: "Tres: contás la caja y creés que ganaste. Lo que entró no es lo que te quedó.", a4: "Dos: el proveedor te aumentó, y vos seguís cobrando el precio viejo.",
  a5: "Y la uno… es la que te mata.", a6: "No saber cuánto te quedó. Así se funden sin darse cuenta.", a7: "Le hablás 20 segundos al celular y sabés el número todas las noches.",
  a8ad: "Escribime por WhatsApp y te muestro cómo.",
};

// paneles del mundo (cada uno 360×640)
const P0 = [0, 0], P1 = [0, 760], P2 = [440, 760], P3 = [440, 1520];
type K = { t: number; x: number; y: number; z: number; d?: number };
const foco = (p: number[], x = 180, y = 320) => ({ x: p[0] + x, y: p[1] + y });

function camara(t: number, ks: K[]) {
  let i = 0;
  while (i + 1 < ks.length && ks[i + 1].t <= t) i++;
  const a = ks[Math.max(0, i - 1)], b = ks[i];
  const dur = b.d ?? 0.55;
  const p = i === 0 ? 1 : clamp((t - b.t) / dur, 0, 1);
  const e = eIO(p);
  const x = a.x + (b.x - a.x) * e, y = a.y + (b.y - a.y) * e, z = a.z + (b.z - a.z) * e;
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const blur = i === 0 ? 0 : (Math.sin(Math.PI * p) * Math.min(2.4, dist / 220)) / Math.max(1, z);
  return { x, y, z: z * (1 + 0.012 * Math.sin(t * 0.9)), blur };
}

const aparece = (t: number, desde: number, dur = 0.35) => entra((t - desde) / dur);
const pesos = (v: number) => "$" + Math.round(v).toLocaleString("es-AR");

// ---------- piezas ----------
const Titulo: React.FC<{ t: number; desde: number; lineas: [string, string][]; top: number; size?: number; left?: number }> = ({ t, desde, lineas, top, size = 44, left = 24 }) => (
  <>
    {lineas.map(([txt, color], i) => {
      const k = aparece(t, desde + i * 0.14, 0.45);
      return (
        <div key={i} style={{ left, right: 16, top: top + i * size * 1.05, height: size * 1.1, overflow: "hidden" }}>
          <div style={{ position: "static", font: `700 ${size}px/1.05 ${DISP}`, letterSpacing: -1, color, transform: `translateY(${(1 - k) * size * 1.1}px)` }}>{txt}</div>
        </div>
      );
    })}
  </>
);

const Pildora: React.FC<{ t: number; desde: number; texto: string; top: number; left?: number; fondo?: string; color?: string; size?: number; centro?: boolean }> = ({ t, desde, texto, top, left = 24, fondo = TINTA, color = PAPEL, size = 12, centro }) => {
  if (t < desde) return null;
  const s = sp(t - desde, 1.04, 16, 0.6);
  return (
    <div style={{ left: centro ? 0 : left, right: centro ? 0 : undefined, top, textAlign: centro ? "center" : "left", transform: `scale(${s})`, transformOrigin: centro ? "50% 50%" : "0 50%" }}>
      <span style={{ position: "static", display: "inline-block", padding: `${size * 0.45}px ${size}px`, borderRadius: 999, background: fondo, color, font: `800 ${size}px ${BODY}`, letterSpacing: 1.2, boxShadow: SOMBRA }}>{texto}</span>
    </div>
  );
};

const Kiosco: React.FC<{ t: number; cierre: number; vida: number; luz: number; peligro: number }> = ({ t, cierre, vida, luz, peligro }) => {
  const k = clamp(cierre, 0, 1);
  const gris = 1 - vida;
  const latido = 0.5 + 0.5 * Math.sin(t * 7);
  const prods = [CORAL, MOSTAZA, VERDE, TINTA, "#7FB8C9", CORAL, MOSTAZA];
  return (
    <svg viewBox="0 0 300 340" width={300} height={340} style={{ left: 30, top: 222, overflow: "visible", filter: `grayscale(${gris}) brightness(${1 - gris * 0.08})` }}>
      <defs>
        <radialGradient id="luz" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#FFD86B" stopOpacity={0.9} /><stop offset="1" stopColor="#FFD86B" stopOpacity={0} /></radialGradient>
        <clipPath id="frente"><rect x={36} y={112} width={228} height={208} /></clipPath>
        <pattern id="costillas" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#A8B0BA" /><rect y="6" width="8" height="2" fill="#8E97A2" /></pattern>
      </defs>
      <circle cx={150} cy={190} r={170 + latido * 8} fill={CORAL} opacity={peligro * (0.08 + latido * 0.06)} />
      <circle cx={150} cy={190} r={150} fill="url(#luz)" opacity={luz} />
      <ellipse cx={150} cy={330} rx={150} ry={9} fill={TINTA} opacity={0.14} />
      <rect x={20} y={70} width={260} height={256} rx={6} fill="#FFFDF8" stroke={TINTA} strokeWidth={2.5} />
      <rect x={40} y={34} width={220} height={46} rx={9} fill={TINTA} />
      <text x={150} y={66} textAnchor="middle" fill={PAPEL} style={{ font: `700 25px ${DISP}`, letterSpacing: 5 }}>KIOSCO</text>
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <rect x={14 + i * 34} y={84} width={34} height={24} fill={i % 2 ? PAPEL : MOSTAZA} stroke={TINTA} strokeWidth={1.5} />
          <path d={`M${14 + i * 34} 108 a17 12 0 0 0 34 0`} fill={i % 2 ? PAPEL : MOSTAZA} stroke={TINTA} strokeWidth={1.5} />
        </g>
      ))}
      <rect x={36} y={130} width={144} height={112} rx={3} fill={CELESTE} stroke={TINTA} strokeWidth={2.5} />
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <line x1={38} x2={178} y1={164 + r * 36} y2={164 + r * 36} stroke={TINTA} strokeWidth={2} />
          {prods.map((c, i) => ((i + r) % 3 === 2 ? null : <rect key={i} x={44 + i * 19} y={164 + r * 36 - 14 - ((i + r) % 2) * 6} width={13} height={14 + ((i + r) % 2) * 6} rx={2} fill={prods[(i + r * 2) % prods.length]} stroke={TINTA} strokeWidth={1} />))}
        </g>
      ))}
      <rect x={30} y={246} width={156} height={80} fill={MOSTAZA} stroke={TINTA} strokeWidth={2.5} />
      <rect x={30} y={262} width={156} height={6} fill={TINTA} opacity={0.85} />
      <rect x={196} y={130} width={66} height={196} rx={2} fill="#F3E2BF" stroke={TINTA} strokeWidth={2.5} />
      <rect x={206} y={142} width={46} height={70} rx={2} fill={CELESTE} stroke={TINTA} strokeWidth={2} />
      <circle cx={250} cy={236} r={4} fill={TINTA} />
      <g clipPath="url(#frente)">
        <rect x={20} y={112 - 214 + k * 214} width={260} height={214} fill="url(#costillas)" stroke={TINTA} strokeWidth={2} />
        <rect x={20} y={112 - 214 + k * 214 + 206} width={260} height={8} fill="#6E7782" />
      </g>
      {k > 0.95 ? (
        <g transform={`translate(150 ${215}) rotate(-6) scale(${sp((k - 0.95) * 20, 1.1)})`}>
          <rect x={-70} y={-22} width={140} height={44} rx={6} fill={CORAL} stroke={TINTA} strokeWidth={2} />
          <text x={0} y={9} textAnchor="middle" fill="#fff" style={{ font: `700 24px ${DISP}`, letterSpacing: 3 }}>CERRADO</text>
        </g>
      ) : null}
    </svg>
  );
};

const Salud: React.FC<{ t: number; v: number; muerto: boolean }> = ({ t, v, muerto }) => {
  const color = v > 60 ? VERDE : v > 30 ? MOSTAZA : CORAL;
  const late = muerto ? 1 : 1 + 0.18 * Math.pow(Math.abs(Math.sin(t * (v > 60 ? 3 : 5))), 10);
  return (
    <div style={{ left: 16, right: 16, top: 16, height: 46, borderRadius: 14, background: "#FFFDF8", boxShadow: SOMBRA }}>
      <svg viewBox="0 0 24 24" width={22} height={22} style={{ left: 12, top: 12, transform: `scale(${late})` }}>
        <path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.2 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.2 1.8-2 3.3-3.2 5.4-3.2 3.6 0 5.8 3.7 4.2 7.3C19.5 16.4 12 21 12 21z" fill={muerto ? GRIS : CORAL} />
      </svg>
      <div style={{ left: 44, top: 7, font: `800 9px ${BODY}`, letterSpacing: 1.6, color: TINTA, opacity: 0.7 }}>SALUD DE TU KIOSCO</div>
      <div style={{ left: 44, right: 62, top: 24, height: 10, borderRadius: 5, background: "#E8E2D6" }}>
        <div style={{ left: 0, top: 0, bottom: 0, width: `${v}%`, borderRadius: 5, background: color }} />
      </div>
      <div style={{ right: 12, top: 12, font: `700 18px ${DISP}`, color: v > 0 ? TINTA : CORAL }}>{Math.round(v)}%</div>
    </div>
  );
};

const Tarjeta: React.FC<{ t: number; desde: number; n: number; top: number; label: string; revela: number; icono: React.ReactNode; tilde: number; brillo?: number; provisional?: string; provDesde?: number }> = ({ t, desde, n, top, label, revela, icono, tilde, brillo = 0, provisional, provDesde = 999 }) => {
  if (t < desde) return null;
  const s = sp(t - desde, 1.03, 15, 0.62);
  const visto = t >= revela;
  const prov = !visto && provisional && t >= provDesde;
  const kt = aparece(t, tilde, 0.3);
  return (
    <div style={{ left: 22, right: 22, top, height: 86, borderRadius: 18, background: "#FFFDF8", boxShadow: brillo > 0 ? `0 0 0 3px ${CORAL}, 0 0 ${30 * brillo}px ${CORAL}99, ${SOMBRA}` : SOMBRA, transform: `translateX(${(1 - s) * 60}px) scale(${0.9 + 0.1 * s})`, opacity: clamp(s * 1.4, 0, 1) }}>
      <div style={{ left: 14, top: 21, width: 44, height: 44, borderRadius: 22, background: n === 1 ? CORAL : TINTA, color: PAPEL, font: `700 24px/44px ${DISP}`, textAlign: "center" }}>{n}</div>
      <div style={{ left: 68, top: 25, width: 36, height: 36 }}>{icono}</div>
      <div style={{ left: 112, right: 58, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
        <span style={{ position: "static", font: `700 15px/1.2 ${BODY}`, color: prov ? CORAL : TINTA, filter: visto || prov ? "none" : "blur(5px)", opacity: visto || prov ? 1 : 0.55 }}>{visto ? label : prov ? provisional : "Esta la hacés todos los días"}</span>
      </div>
      <div style={{ right: 16, top: 27, width: 32, height: 32, borderRadius: 9, border: `2.5px solid ${TINTA}`, background: kt > 0 ? MOSTAZA : "transparent" }}>
        {kt > 0 ? <svg viewBox="0 0 24 24" width={28} height={28} style={{ left: 0, top: 0 }}><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke={TINTA} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - kt)} /></svg> : null}
      </div>
    </div>
  );
};

const IcoCaja = <svg viewBox="0 0 36 36" width={36} height={36}><rect x={4} y={14} width={28} height={18} rx={3} fill={MOSTAZA} stroke={TINTA} strokeWidth={2} /><rect x={9} y={4} width={18} height={10} rx={2} fill={CELESTE} stroke={TINTA} strokeWidth={2} /><rect x={8} y={24} width={20} height={4} fill={TINTA} /></svg>;
const IcoTag = <svg viewBox="0 0 36 36" width={36} height={36}><path d="M4 18 L16 4 H32 V20 L18 33 Z" fill={MOSTAZA} stroke={TINTA} strokeWidth={2} strokeLinejoin="round" /><circle cx={25} cy={11} r={3} fill={PAPEL} stroke={TINTA} strokeWidth={2} /></svg>;
const IcoNiebla = <svg viewBox="0 0 36 36" width={36} height={36}><circle cx={18} cy={18} r={15} fill={CORAL} stroke={TINTA} strokeWidth={2} /><text x={18} y={25} textAnchor="middle" fill="#fff" style={{ font: `700 20px ${DISP}` }}>?</text></svg>;

const Barra: React.FC<{ t: number; desde: number; x: number; y0: number; y1: number; color: string; valor: string; nombre: string; colorValor?: string }> = ({ t, desde, x, y0, y1, color, valor, nombre, colorValor = TINTA }) => {
  const k = aparece(t, desde, 0.5);
  if (t < desde) return null;
  return (
    <>
      <div style={{ left: x, top: y0, width: 66, height: y1 - y0, borderRadius: 6, background: color, transform: `scaleY(${k})`, transformOrigin: "50% 100%", boxShadow: "0 6px 14px rgba(27,35,51,.15)" }} />
      <div style={{ left: x - 14, width: 94, top: y0 - 22, textAlign: "center", font: `700 13px ${DISP}`, color: colorValor, opacity: clamp((t - desde - 0.25) / 0.2, 0, 1) }}>{valor}</div>
      <div style={{ left: x - 14, width: 94, top: 566, textAlign: "center", font: `800 8.5px ${BODY}`, letterSpacing: 1, color: TINTA, opacity: 0.75 * k }}>{nombre}</div>
    </>
  );
};

// ---------- video ----------
export const MatandoExplicado: React.FC<VideoProps & { ad?: boolean }> = ({ ad = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { T, h, ids, d, total } = armar(ad);
  const LOOP = total - 0.27;
  const loop = !ad && t >= LOOP;
  const tw = loop ? 0 : t;

  const cierreP = T.plano + 0.35;
  const abre = T.revive + 0.25;
  const persiana = tw < cierreP ? 0 : tw < abre ? aparece(tw, cierreP, 0.6) : 1 - aparece(tw, abre, 0.5);
  const muerto = tw >= cierreP + 0.4 && tw < abre;
  const negro = tw >= T.negro && tw < T.revive;
  const freeze = tw >= T.a5 - 0.05 && tw < T.a6 + 0.1;

  const pasos: [number, number][] = [[0, 100], [T.w2, 86], [T.a3 + d("a3") * 0.6, 64], [T.a4 + d("a4") * 0.62, 38], [cierreP, 0], [abre + 0.2, 100]];
  let salud = 100;
  for (let i = 1; i < pasos.length; i++) if (tw >= pasos[i][0]) salud = pasos[i - 1][1] + (pasos[i][1] - pasos[i - 1][1]) * aparece(tw, pasos[i][0], 0.6);

  const enCierre = tw >= T.cierre;
  const ks: K[] = [
    { t: -1, ...foco(P0, 180, 330), z: 1.0 },
    { t: 0.4, ...foco(P0, 180, 340), z: 1.06, d: 1.8 },
    { t: T.a2 - 0.15, ...foco(P1), z: 1 },
    { t: T.a3 - 0.15, ...foco(P2, 110, 210), z: 1.45 },
    { t: T.a3 + 1.0, ...foco(P2), z: 1, d: 0.8 },
    { t: T.a3 + d("a3") * 0.72, ...foco(P2, 220, 470), z: 1.3, d: 0.6 },
    { t: T.a4 - 0.15, ...foco(P3), z: 1 },
    { t: T.a4 + d("a4") * 0.6, ...foco(P3, 180, 400), z: 1.08, d: 0.6 },
    { t: T.a5 - 0.1, ...foco(P1, 180, 443), z: 1.85, d: 0.5 },
    { t: T.a6 + d("a6") * 0.3, ...foco(P0, 180, 330), z: 1, d: 0.5 },
    { t: T.revive, ...foco(P0, 180, 330), z: 1, d: 0.3 },
    { t: T.cierre - 0.15, ...(ad ? foco(P0, 180, 330) : foco(P1)), z: 1 },
  ];
  const c = camara(tw, ks);

  // ---------- mundo ----------
  const kioscoTitulo = tw >= T.revive ? (
    <Titulo t={tw} desde={T.revive + 0.1} top={84} lineas={ad && enCierre ? [["¿Cuánto te", TINTA], ["quedó hoy?", VERDE]] : [["Tu número,", TINTA], ["todas las noches.", VERDE]]} size={34} />
  ) : ad ? (
    <Titulo t={tw} desde={T.w1 - 0.7} top={76} size={38} lineas={[["Así se están", TINTA], ["muriendo", CORAL], ["los kioscos.", TINTA]]} />
  ) : (
    <Titulo t={tw} desde={T.w1 - 0.7} top={86} size={42} lineas={[["Estás matando", CORAL], ["a tu kiosco.", TINTA]]} />
  );
  const tildes = enCierre && !ad ? [T.cierre + 0.5, T.cierre + 0.8, T.cierre + 1.1] : [999, 999, 999];

  const mundo = (
    <div style={{ left: 0, top: 0, width: 360, height: 640, transformOrigin: "0 0", transform: `translate(${180 - c.x * c.z}px, ${320 - c.y * c.z}px) scale(${c.z})`, filter: c.blur > 0.3 ? `blur(${c.blur}px)` : undefined }}>
      <div style={{ left: -800, top: -800, width: 2400, height: 3600, background: PAPEL, backgroundImage: `radial-gradient(${TINTA}22 1.2px, transparent 1.3px)`, backgroundSize: "22px 22px" }} />

      {/* P0 · el kiosco */}
      <div style={{ left: P0[0], top: P0[1], width: 360, height: 640 }}>
        {kioscoTitulo}
        <Kiosco t={tw} cierre={persiana} vida={muerto ? 0 : tw >= cierreP ? 1 - persiana : 1} luz={tw >= abre ? aparece(tw, abre, 0.6) : 0} peligro={tw < T.a2 ? 1 : 0} />
        {tw >= T.app ? (
          <div style={{ left: 166, top: 236, width: 190, height: 400, transform: "scale(.82)", transformOrigin: "0 0" }}>
            <Celular t={tw} sp={sp(tw - T.app, 1.04, 13, 0.55)} left={0} top={0}>
              <Sequence from={Math.round(T.app * fps)} layout="none">
                <OffthreadVideo src={staticFile("tomas/fb-01/app.mp4")} startFrom={Math.round(9.6 * 30)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} />
              </Sequence>
            </Celular>
          </div>
        ) : null}
        {tw >= T.app && !(ad && enCierre) ? <Pildora t={tw} desde={T.app + 0.4} texto="⏱  20 SEGUNDOS" top={300} left={26} fondo={MOSTAZA} color={TINTA} size={13} /> : null}
      </div>

      {/* P1 · las 3 formas */}
      <div style={{ left: P1[0], top: P1[1], width: 360, height: 640 }}>
        <Titulo t={tw} desde={T.a2 - 0.2} top={70} size={38} lineas={[["3 formas de", TINTA], ["matar tu kiosco", CORAL]]} />
        <Pildora t={tw} desde={T.a2 + d("a2") * 0.5} texto="CONTÁ CUÁNTAS HACÉS VOS" top={164} fondo={MOSTAZA} color={TINTA} />
        <Tarjeta t={tw} desde={T.a2 + 0.25} n={3} top={210} label="Contar la caja como si fuera ganancia" revela={T.a3} icono={IcoCaja} tilde={tildes[0]} />
        <Tarjeta t={tw} desde={T.a2 + 0.5} n={2} top={310} label="Seguir cobrando el precio viejo" revela={T.a4} icono={IcoTag} tilde={tildes[1]} />
        <Tarjeta t={tw} desde={T.a2 + 0.75} n={1} top={410} label="No saber cuánto te quedó" revela={T.a6 + 0.1} icono={IcoNiebla} tilde={tildes[2]} brillo={freeze ? 0.6 + 0.4 * Math.sin(tw * 6) : 0} provisional="La que te mata" provDesde={T.a5 + d("a5") * 0.5} />
        {enCierre && !ad ? (
          <>
            <Pildora t={tw} desde={T.cierre + 1.3} texto="¿CUÁNTAS HACÉS? COMENTÁ EL NÚMERO" top={520} centro fondo={CORAL} color="#fff" size={13} />
            <div style={{ left: 0, right: 0, top: 572, textAlign: "center", font: `700 12px ${BODY}`, color: TINTA, opacity: 0.7 * aparece(tw, T.cierre + 1.6) }}>En Claro · link en el perfil</div>
          </>
        ) : null}
      </div>

      {/* P2 · forma 3: la caja no es ganancia */}
      <div style={{ left: P2[0], top: P2[1], width: 360, height: 640 }}>
        <Pildora t={tw} desde={T.a3 - 0.2} texto="FORMA #3" top={36} />
        <Titulo t={tw} desde={T.a3 - 0.1} top={66} size={27} lineas={[["Contás la caja", TINTA], ["y creés que ganaste.", TINTA]]} />
        <svg viewBox="0 0 150 120" width={150} height={120} style={{ left: 36, top: 150 }}>
          <rect x={10} y={44} width={130} height={68} rx={8} fill={MOSTAZA} stroke={TINTA} strokeWidth={2.5} />
          <rect x={26} y={8} width={98} height={36} rx={5} fill={TINTA} />
          {[0, 1, 2, 3].map((i) => <circle key={i} cx={36 + i * 26} cy={62} r={6} fill="#FFFDF8" stroke={TINTA} strokeWidth={1.5} />)}
          <rect x={20} y={84} width={110} height={18} rx={3} fill="#C98B12" stroke={TINTA} strokeWidth={1.5} />
          <text x={75} y={33} textAnchor="middle" fill="#FFD86B" style={{ font: `700 17px ${DISP}` }}>{pesos(300000 * aparece(tw, T.a3 + 0.1, 1.0))}</text>
        </svg>
        <div style={{ left: 196, top: 178, width: 140, font: `600 13px/1.3 ${BODY}`, color: TINTA, opacity: aparece(tw, T.a3 + 0.5) }}>Esto es lo que <b>entró</b>.<br />No lo que <b style={{ color: VERDE }}>te quedó</b>.</div>
        <div style={{ left: 22, right: 22, top: 560, height: 2, background: TINTA, opacity: 0.4 }} />
        <Barra t={tw} desde={T.a3 + 1.0} x={24} y0={330} y1={560} color={TINTA} valor="$300.000" nombre="ENTRÓ" />
        <Barra t={tw} desde={T.a3 + d("a3") * 0.36} x={104} y0={330} y1={468} color={CORAL} valor="−$180.000" nombre="MERCADERÍA" colorValor={CORAL} />
        <Barra t={tw} desde={T.a3 + d("a3") * 0.48} x={184} y0={468} y1={491} color={CORAL} valor="−$30.000" nombre="GASTOS" colorValor={CORAL} />
        <Barra t={tw} desde={T.a3 + d("a3") * 0.6} x={264} y0={491} y1={560} color={VERDE} valor="$90.000" nombre="TE QUEDÓ" colorValor={VERDE} />
        {[[90, 330, 104], [170, 468, 184], [250, 491, 264]].map(([x0, y, x1], i) => <div key={i} style={{ left: x0, top: y, width: (x1 - x0) * aparece(tw, T.a3 + d("a3") * (0.36 + i * 0.12) - 0.1), borderTop: `2px dashed ${TINTA}66` }} />)}
      </div>

      {/* P3 · forma 2: el margen se achica */}
      <div style={{ left: P3[0], top: P3[1], width: 360, height: 640 }}>
        {(() => {
          const rompe = T.a4 + d("a4") * 0.5;
          const k = aparece(tw, rompe, 0.7);
          const W = 312, costo = 1000 + 70 * k, gan = 1300 - costo;
          return (
            <>
              <Pildora t={tw} desde={T.a4 - 0.2} texto="FORMA #2" top={36} />
              <Titulo t={tw} desde={T.a4 - 0.1} top={66} size={27} lineas={[["El proveedor aumentó.", TINTA], ["Vos cobrás lo de antes.", CORAL]]} />
              <div style={{ left: 30, top: 150, width: 120, height: 150, borderRadius: 6, background: "#FFFDF8", boxShadow: SOMBRA, transform: `rotate(-4deg) translateY(${(1 - aparece(tw, T.a4 + 0.2, 0.5)) * 40}px)`, opacity: aparece(tw, T.a4 + 0.2, 0.5) }}>
                <div style={{ left: 12, top: 12, font: `800 9px ${BODY}`, letterSpacing: 1.4, color: TINTA }}>FACTURA</div>
                {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ left: 12, right: 12 + (i % 2) * 24, top: 34 + i * 16, height: 5, borderRadius: 3, background: "#DDD6C8" }} />)}
                <div style={{ left: 12, top: 118, font: `700 15px ${DISP}`, color: TINTA }}>{pesos(costo)}</div>
                {tw >= T.a4 + d("a4") * 0.32 ? <div style={{ left: 50, top: 40, padding: "4px 10px", border: `3px solid ${CORAL}`, borderRadius: 8, color: CORAL, font: `700 26px ${DISP}`, transform: `rotate(-14deg) scale(${2 - sp(tw - T.a4 - d("a4") * 0.32, 1, 22, 0.7)})` }}>+7%</div> : null}
              </div>
              <svg viewBox="0 0 130 110" width={130} height={110} style={{ left: 196, top: 172, opacity: aparece(tw, T.a4 + 0.5, 0.5) }}>
                <path d="M8 55 L40 10 H122 V100 H40 Z" fill={MOSTAZA} stroke={TINTA} strokeWidth={2.5} strokeLinejoin="round" />
                <circle cx={30} cy={55} r={7} fill={PAPEL} stroke={TINTA} strokeWidth={2} />
                <text x={82} y={50} textAnchor="middle" fill={TINTA} style={{ font: `800 9px ${BODY}`, letterSpacing: 1 }}>VOS COBRÁS</text>
                <text x={82} y={76} textAnchor="middle" fill={TINTA} style={{ font: `700 22px ${DISP}` }}>$1.300</text>
              </svg>
              <div style={{ left: 24, top: 336, font: `800 9px ${BODY}`, letterSpacing: 1.4, color: TINTA, opacity: 0.7 * aparece(tw, T.a4 + 0.8) }}>CADA PRODUCTO QUE VENDÉS</div>
              <div style={{ left: 24, top: 356, width: W, height: 48, borderRadius: 10, overflow: "hidden", boxShadow: SOMBRA, opacity: aparece(tw, T.a4 + 0.8), background: VERDE }}>
                <div style={{ left: 0, top: 0, bottom: 0, width: (W * 1000) / 1300, background: TINTA }} />
                <div style={{ left: (W * 1000) / 1300, top: 0, bottom: 0, width: (W * (costo - 1000)) / 1300, background: `repeating-linear-gradient(45deg, ${CORAL}, ${CORAL} 4px, #E8786D 4px, #E8786D 8px)` }} />
                <div style={{ left: 12, top: 15, font: `700 14px ${DISP}`, color: PAPEL }}>costo {pesos(costo)}</div>
              </div>
              <div style={{ right: 360 - 24 - W, top: 414, textAlign: "right", font: `700 14px ${DISP}`, color: VERDE, opacity: aparece(tw, T.a4 + 0.9) }}>ganás {pesos(gan)}</div>
              {tw >= rompe + 0.5 ? (
                <div style={{ left: 22, right: 22, top: 456, height: 92, borderRadius: 18, background: "#FFFDF8", boxShadow: SOMBRA, transform: `scale(${sp(tw - rompe - 0.5, 1.04, 15, 0.6)})` }}>
                  <div style={{ left: 0, right: 0, top: 12, textAlign: "center", font: `700 30px ${DISP}`, color: CORAL }}>−$70 en cada uno</div>
                  <div style={{ left: 0, right: 0, top: 56, textAlign: "center", font: `600 12.5px ${BODY}`, color: TINTA, opacity: aparece(tw, rompe + 1.0) }}>Vendiendo 50 por día: <b style={{ color: CORAL }}>−$105.000 por mes</b></div>
                </div>
              ) : null}
            </>
          );
        })()}
      </div>
    </div>
  );

  const hablando = ids.find((id) => tw >= T[id] && tw < T[id] + d(id) + 0.1);
  const mostrarSub = hablando && !loop && tw >= T.a2 - 0.05 && !negro && !(enCierre && ad);
  const fondo = (
    <>
      {mundo}
      {freeze ? <div style={{ inset: 0, background: "radial-gradient(ellipse at 50% 58%, transparent 32%, rgba(14,18,28,.72) 75%)" }} /> : null}
      {!negro ? <Salud t={tw} v={salud} muerto={muerto} /> : null}
      {mostrarSub ? (
        <div style={{ left: 18, right: 18, top: 594, textAlign: "center" }}>
          <span style={{ position: "static", display: "inline-block", padding: "6px 12px", borderRadius: 12, background: "rgba(27,35,51,.92)", font: `600 13.5px/1.3 ${BODY}`, color: "#fff" }}>{TXT[hablando as string]}</span>
        </div>
      ) : null}
      {ad && enCierre ? (
        <div style={{ left: 30, right: 30, top: 520, height: 64, borderRadius: 32, background: "#25D366", boxShadow: "0 6px 0 #0f8a43, " + SOMBRA, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${sp(tw - T.cierre - 0.3, 1.08) * (1 + 0.03 * Math.sin(tw * 7))})` }}>
          <span style={{ position: "static", font: `700 22px ${DISP}`, color: "#fff", letterSpacing: 1 }}>Escribime por WhatsApp</span>
        </div>
      ) : null}
      {negro ? <div style={{ inset: 0, background: "#0E121C" }} /> : null}
    </>
  );

  // ---------- sonido ----------
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump", vol: 0.55 }, { en: T.w2, sfx: "slam", vol: 0.45 },
    ...ks.slice(2).map((k) => ({ en: k.t - 0.05, sfx: "whoosh", vol: 0.35 })),
    ...bips(0.3, T.a2, 92, 0.15),
    ...[0.25, 0.5, 0.75].map((x) => ({ en: T.a2 + x, sfx: "tic", vol: 0.4 })),
    { en: T.a3 + 0.1, sfx: "caja", vol: 0.4 }, ...[1.0, d("a3") * 0.36, d("a3") * 0.48, d("a3") * 0.6].map((x) => ({ en: T.a3 + x, sfx: "tic", vol: 0.45 })), { en: T.a3 + d("a3") * 0.6, sfx: "coins", vol: 0.35 },
    { en: T.a4 + 0.2, sfx: "papel", vol: 0.45 }, { en: T.a4 + d("a4") * 0.32, sfx: "sello", vol: 0.6 }, { en: T.a4 + d("a4") * 0.5, sfx: "tijera", vol: 0.45 }, { en: T.a4 + d("a4") * 0.5 + 0.5, sfx: "thump", vol: 0.45 },
    { en: T.a5, sfx: "piano_grave", vol: 0.5 }, { en: T.a6 + 0.1, sfx: "marcador", vol: 0.4 },
    { en: cierreP, sfx: "metal", vol: 0.55 }, { en: cierreP + 0.3, sfx: "flatline", vol: 0.45 },
    { en: T.revive - 0.9, sfx: "desfibrilador", vol: 0.55 }, { en: abre, sfx: "metal", vol: 0.4 }, { en: T.app, sfx: "click", vol: 0.4 },
    { en: T.cierre, sfx: "ding", vol: 0.4 }, ...(ad ? [] : [0.5, 0.8, 1.1].map((x) => ({ en: T.cierre + x, sfx: "marcador", vol: 0.35 }))),
  ].filter((s) => s.en >= 0);
  const musica = (
    <>
      <Voces carpeta="tt-06" T={T} ids={ids} fps={fps} />
      <Pulso fps={fps} fin={total} silencios={[[T.a5 - 0.05, T.a6], [cierreP, T.revive]]} vol={0.08} />
    </>
  );

  const cam = negro || loop ? { z: 1, rot: 0, tx: 0, ty: 0, blur: 0 } : { ...camaraBeats(tw, [0.02, T.w2, T.a3 + d("a3") * 0.6, T.a4 + d("a4") * 0.32, T.revive], [], 0.35), z: 1, rot: 0 };
  const hs = loop ? 0 : temblor(t, [[T.w2, 6], [T.a4 + d("a4") * 0.32, 5], [T.revive, 10]]);
  let wf = 0;
  if (!loop) [[T.revive, 0.8]].forEach(([a, f]) => { const dd = t - a; if (dd >= 0 && dd < 0.18) wf += f * (1 - dd / 0.18); });
  void h;

  return <Marco g={g} voz={null} pal={[]} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={loop ? [] : sonidos} ocultos={[]} fondo={fondo} frente={null} sobre={musica} />;
};
