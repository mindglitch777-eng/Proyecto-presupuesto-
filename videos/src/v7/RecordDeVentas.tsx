import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { I, clamp, eIO, eOut, rnd, spring, win } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V7_01, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import { Kiosco3D, Muneco, Piso } from "../v3/Modelos3D";
import { proyectar, useFuentesListas } from "../v3/ElDueno";
import { Caja } from "../v6/ModelosCaja";
import { Objeto } from "../v6/ModelosBasura";
import type { VideoProps } from "../Video";
import { BotonProbalo, Celular, ControlCamaraRoll, LogoEnClaro, Marco, W, camaraBeats, camaraClaves, lineasDeVoz, temblor, type Cam2D, type Clave } from "../v6/comun";
import { Congelado, Escudo, FinFalso, RebobinadoVHS, VidrioRoto, entra, remapear, sale, type Choque } from "./rompe";

// V7-01 "Récord de ventas" (serie Rompe-esquemas). Guion: videos/guiones/V7-01-RECORD-DE-VENTAS.md.
// Todo se dibuja desde un "tiempo de imagen" `tv` que normalmente es el tiempo real, pero se congela ("Pará"),
// rebobina y va en cámara lenta ("Volvé dos segundos") y repite el mes con En Claro: se ven los cuadros anteriores de verdad.

const g = GUION_V7_01;
type V3 = [number, number, number];
const VENDIDO = 1240000; // lo que creés que ganaste a fin de mes (ejemplo)
const SACO = 180000;
const GOLPES = [
  { u: 0.2, monto: 9000, quien: "tijera" as const, texto: "AUMENTO", ang: -0.75 },
  { u: 0.42, monto: 14000, quien: "cuaderno" as const, texto: "FIADO", ang: -2.25 },
  { u: 0.8, monto: 6000, quien: "aspiradora" as const, texto: "COMISIÓN", ang: -1.55 },
];
const U_MANO = 0.625; // instante del mes en que la mano saca el fajo
const CAJA: V3 = [0, 1.1, 1.6];
const CS = 0.72; // escala de la caja registradora
const DUENO: V3 = [2.6, 0, -0.9];
const firmado = (n: number) => (n < 0 ? "−" : "") + ars(Math.abs(n));

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  const T = {
    l, e, dur,
    cerrar: w(0, "cerrar", e[0] - 0.45),
    alguien: w(2, "alguien", l[2]), ciento: w(2, "ciento", l[2] + 0.45), saludaste: w(2, "saludaste", l[2] + 1.25),
    prov: w(3, "proveedor", l[3] + 0.1), vecina: w(3, "vecina", l[3] + 0.7), chico: w(3, "chico", l[3] + 1.2),
    para: w(4, "pará", l[4]), viste: w(4, "viste", l[4] + 0.4),
    volve: w(5, "volvé", l[5]), segundos: w(5, "segundos", l[5] + 0.35),
    falta: w(6, "falta", l[6]), peor: w(6, "peor", l[6] + 0.4),
    mano: w(7, "mano", l[7] + 0.15), tuya: w(7, "tuya", l[7] + 0.75), alquiler: w(7, "alquiler", l[7] + 1.5), mercaderia: w(7, "mercadería", e[7] - 0.5),
    vendiste: w(8, "vendiste", l[8]), viejo: w(8, "viejo", l[8] + 1.1), cuanto: w(8, "cuanto", l[8] + 1.5), perdes: w(8, "perdés", e[8] - 0.35),
    mismo: w(9, "mismo", l[9]), claro: w(9, "claro", e[9] - 0.3),
    cinco: w(10, "cinco", l[10]), probalo: w(10, "probalo", l[10] + 0.9),
    // derivados
    M0: 0, M1: 0, D: 0, F: 0, R0: 0, R1: 0, FIN0: 0, TR0: 0, TR1: 0, TRR: 0, LOOP: 0,
  };
  T.M0 = l[1] - 0.1; // arranca el mes
  T.M1 = T.alguien - 0.05; // punch a la caja vacía
  T.D = T.M1 - T.M0;
  T.F = T.para - 0.03; // congelado
  T.R0 = T.volve; // rebobina
  T.R1 = T.volve + 0.6; // cámara lenta
  T.FIN0 = Math.max(T.R1 + 0.9, T.falta - 0.62); // final falso (silencio)
  T.TR0 = T.mismo; // el truco: rebobina al día 1
  T.TRR = T.TR0 + 0.45; // y repite el mes
  T.TR1 = Math.min(T.TRR + T.D / 1.15, T.cinco - 0.1);
  T.LOOP = dur - 0.27; // último cuadro = cuadro 0
  return T;
}
type T = ReturnType<typeof tiempos>;

type Esc = "gancho" | "mes" | "punch" | "ruleta" | "fin" | "rojo" | "tuya" | "comp" | "final";
type Vista = { esc: Esc; tv: number; enClaro: boolean; vhs: null | { modo: "atras" | "lento"; k: number }; congelado: boolean };

/** Qué se ve en el tiempo real `t`: la escena y su tiempo de imagen. */
function vista(t: number, T: T): Vista {
  const porImagen = (tv: number, extra: Partial<Vista> = {}): Vista => {
    let esc: Esc = "gancho";
    if (tv >= T.M0) esc = "mes";
    if (tv >= T.M1) esc = "punch";
    if (tv >= T.l[3] - 0.05) esc = "ruleta";
    return { esc, tv, enClaro: false, vhs: null, congelado: false, ...extra };
  };
  if (t >= T.LOOP) return porImagen(0);
  if (t < T.F) return porImagen(t);
  if (t < T.R0) return porImagen(T.F, { congelado: true });
  const lentoDesde = T.M0 + (U_MANO - 0.1) * T.D;
  if (t < T.R1) return porImagen(remapear(t, T.R0, T.R1, T.F, lentoDesde, eIO), { vhs: { modo: "atras", k: 1 } });
  if (t < T.FIN0) return porImagen(Math.min(T.M1 - 0.06, lentoDesde + (t - T.R1) * 0.4), { vhs: { modo: "lento", k: 0.75 } });
  if (t < T.falta - 0.02) return { esc: "fin", tv: t, enClaro: false, vhs: null, congelado: false };
  if (t < T.l[7] - 0.05) return { esc: "rojo", tv: t, enClaro: false, vhs: null, congelado: false };
  if (t < T.l[8] - 0.05) return { esc: "tuya", tv: t, enClaro: false, vhs: null, congelado: false };
  if (t < T.TR0) return { esc: "comp", tv: t, enClaro: false, vhs: null, congelado: false };
  if (t < T.TRR) return { esc: "mes", tv: remapear(t, T.TR0, T.TRR, T.M1 - 0.05, T.M0, eIO), enClaro: false, vhs: { modo: "atras", k: 1 }, congelado: false };
  if (t < T.TR1) return { esc: "mes", tv: Math.min(T.M1 - 0.06, T.M0 + (t - T.TRR) * 1.15), enClaro: true, vhs: null, congelado: false };
  return { esc: "final", tv: t, enClaro: true, vhs: null, congelado: false };
}

/** Progreso del mes (0..1) para un tiempo de imagen. */
const mesU = (tv: number, T: T) => clamp((tv - T.M0) / T.D, 0, 1);

/** La mano que entra por el costado: 0 afuera → 1 en el cajón. `fajo`: ya agarró la plata. */
function manoDe(u: number) {
  if (u < 0.55 || u > 0.7) return { k: 0, fajo: false };
  if (u < 0.61) return { k: entra((u - 0.55) / 0.06), fajo: false };
  if (u < 0.64) return { k: 1, fajo: true };
  return { k: 1 - eOut((u - 0.64) / 0.06), fajo: true };
}

/** Lo que creés que ganaste y lo que de verdad te queda, en un punto del mes. */
function cuentas(u: number, enClaro: boolean) {
  const verde = VENDIDO * u;
  if (enClaro) return { verde, queda: verde * 0.3 };
  let queda = verde * 0.15;
  GOLPES.forEach((gp) => { if (u >= gp.u + 0.04) queda -= gp.monto; });
  if (u >= 0.64) queda -= SACO;
  return { verde, queda };
}

// ---------- cámara 3D ----------
const c = (t: number, pos: V3, target: V3, fov: number, roll = 0): Clave => ({ t, pos, target, fov, roll });
const CAM0 = c(0, [0.5, 4.3, 12.6], [0, 3.0, -0.5], 50);
function camara3D(v: Vista, t: number, T: T) {
  if (v.esc === "final" || v.enClaro) {
    const base = camaraClaves(v.tv, [c(0, [-1.1, 3.4, 9.8], [-1.6, 2.2, 0], 52), c(30, [-1.3, 3.4, 9.6], [-1.6, 2.2, 0], 52)]);
    if (v.esc === "final") return camaraClaves(t, [c(T.TR1 - 0.1, [-1.3, 3.4, 9.6], [-1.6, 2.2, 0], 52), c(T.TR1 + 0.5, [0.2, 3.2, 8.0], [0, 2.3, 0.4], 50), c(T.LOOP - 0.25, [0.5, 3.3, 8.5], [0, 2.5, 0.1], 52), c(T.LOOP, CAM0.pos, CAM0.target, CAM0.fov)]);
    return base;
  }
  if (v.esc === "rojo" || v.esc === "tuya" || v.esc === "fin" || v.esc === "comp") {
    return camaraClaves(t, [
      c(T.falta - 0.05, [0.6, 3.6, 9.4], [0, 2.4, 0], 54, 0.05),
      c(T.l[7] - 0.05, [0.3, 3.3, 8.2], [0, 2.3, 0.4], 52),
      c(T.l[7] + 0.1, [1.6, 2.3, 5.4], [0.9, 1.6, 2.6], 44, -0.04),
      c(T.tuya - 0.15, [2.3, 2.6, 4.6], [2.2, 2.1, 0.6], 42),
      c(T.tuya + 0.05, [3.4, 3.2, 4.6], [DUENO[0] - 0.4, 2.4, DUENO[2]], 44, 0.03),
      c(T.l[8], [3.1, 3.3, 5.0], [DUENO[0] - 0.6, 2.3, DUENO[2]], 46),
    ]);
  }
  return camaraClaves(v.tv, [
    CAM0,
    c(T.M0 - 0.1, [0.4, 4.1, 11.6], [0, 2.9, -0.3], 50),
    c(T.M0 + 0.15, [-0.8, 3.7, 10.6], [0, 2.5, 0], 50, 0.03),
    c(T.M1 - 0.12, [0.6, 3.6, 9.8], [0, 2.4, 0.2], 50, -0.02),
    c(T.M1 + 0.06, [0.25, 3.3, 6.0], [0, 1.6, 2.9], 44),
    c(T.l[3], [0.1, 3.2, 5.7], [0, 1.6, 3.0], 44, 0.02),
    c(T.para + 1, [0.1, 3.2, 5.7], [0, 1.6, 3.0], 44, 0.02),
  ]);
}

// ---------- escena 3D ----------
type Billete = { t0: number; to: V3; spin: number };
const billetes: Billete[] = Array.from({ length: 17 }, (_, i) => ({ t0: (i + 0.3) / 17, to: [(rnd(i) - 0.5) * 6, 4.6 + rnd(i + 3) * 1.6, 3.4 + rnd(i + 7)], spin: 1 + rnd(i + 9) }));

const Escena3D: React.FC<{ v: Vista; t: number; T: T; cam: ReturnType<typeof camaraClaves>; listo: boolean }> = ({ v, t, T, cam, listo }) => {
  const u = mesU(v.tv, T);
  const enMes = v.esc === "mes";
  const vacia = v.esc === "punch" || v.esc === "ruleta" || v.esc === "rojo" || v.esc === "tuya";
  const cajon = v.esc === "gancho" ? 0.15 : enMes ? 0.55 + 0.1 * Math.sin(v.tv * 7) : vacia ? 1 : 0.85;
  const { verde, queda } = cuentas(u, v.enClaro);
  const restante = v.esc === "gancho" ? 1 : enMes ? clamp(0.25 + queda / 220000, 0, 1) : vacia ? 0 : 1;
  const rojo = v.esc === "rojo" || v.esc === "tuya";
  const texto = v.esc === "gancho" ? "RÉCORD" : enMes ? ars(verde) : vacia ? "$0" : "OK";
  const colorLcd = v.esc === "gancho" ? "#7CFFB0" : enMes ? "#7CFFB0" : vacia ? "#FF4D5A" : "#7CFFB0";
  const salto = [0.05, T.cerrar, T.M1].reduce((s, a) => s + (v.tv > a ? Math.exp(-9 * (v.tv - a)) * Math.abs(Math.sin((v.tv - a) * 18)) : 0), 0);
  const brazo = v.esc === "tuya" ? I(t, T.l[7], T.mano + 0.2, 0, 1.35, eOut) * (1 - I(t, T.alquiler, T.alquiler + 0.3, 0, 0.6, eOut)) : 0;
  const latido = rojo ? Math.abs(Math.sin(t * 5)) ** 4 : 0;
  return (
    <>
      <ControlCamaraRoll c={cam} />
      <ambientLight intensity={rojo ? 0.25 : 0.55} />
      <hemisphereLight args={[rojo ? "#ff9a9a" : "#ffe9c4", "#3a2412", rojo ? 0.35 : 0.6]} />
      <directionalLight position={[3, 9, 8]} intensity={rojo ? 1.0 : 2.3} color={rojo ? "#ff8080" : "#fff0d0"} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-4} />
      <pointLight position={[0, 3.6, 5]} intensity={rojo ? 40 + latido * 50 : 22} distance={14} color={rojo ? "#ff3344" : "#ffd9a0"} />
      <Piso />
      <group position={[0, 0, -3.6]} scale={1.3}>
        <Kiosco3D persiana={0} luz={rojo ? 0.2 : 1} fuentesListas={listo} />
      </group>
      <mesh position={[0, 0.5, CAJA[2] + 0.2]} castShadow receiveShadow>
        <boxGeometry args={[9, 1.0, 4]} />
        <meshStandardMaterial color="#5e3d22" roughness={0.85} />
      </mesh>
      <group scale={2.0} position={DUENO}>
        <Muneco tipo="kiosquero" pose={{ brazoD: brazo, brazoI: 0.15 }} position={[0, 0, 0]} rotY={-0.45} />
      </group>
      <group position={CAJA} scale={CS}>
        <Caja cajon={cajon} ticket={0} campana={0} salto={salto} modo="num" texto={texto} mira={[0, 0]} parpadeo={0} colorLcd={colorLcd} restante={restante} listo={listo} />
      </group>
      {enMes && !v.enClaro
        ? billetes.map((b, i) => {
            const k = (u - b.t0) / 0.12;
            if (k < 0 || k > 1) return null;
            const s = k * k * (3 - 2 * k);
            const from: V3 = [CAJA[0], CAJA[1] + 0.6 * CS, CAJA[2] + 2.2 * CS];
            const p: V3 = [from[0] + (b.to[0] - from[0]) * s, from[1] + (b.to[1] - from[1]) * s + Math.sin(Math.PI * k) * 1.2, from[2] + (b.to[2] - from[2]) * s];
            return <Objeto key={i} kind={3} p={p} rot={[b.spin * k * 5, b.spin * k * 3, b.spin * k * 4]} s={1.1} />;
          })
        : null}
    </>
  );
};

// ---------- capas 2D ----------
const Fondo2D: React.FC = () => <div style={{ inset: 0, background: "linear-gradient(#9fd3f0,#e9d9b8 70%)" }} />;

const Confeti: React.FC<{ t: number }> = ({ t }) => (
  <>
    {Array.from({ length: 34 }, (_, i) => {
      const x = rnd(i) * 360, y = 70 + rnd(i + 50) * 420;
      const col = ["#FFB703", "#34d399", "#FF4D5A", "#3A86FF", "#fff"][i % 5];
      return <div key={i} style={{ left: x + Math.sin(t * 2 + i) * 1.5, top: y + Math.cos(t * 1.7 + i) * 1.5, width: 6 + (i % 3) * 3, height: 3 + (i % 2) * 3, background: col, transform: `rotate(${rnd(i + 9) * 180 + t * 8}deg)`, borderRadius: 1, boxShadow: "0 1px 0 #0004" }} />;
    })}
  </>
);

/** Cuadro 0 y el cierre del loop: textos del gancho, cinta "RÉCORD" y sello. */
const Gancho2D: React.FC<{ tv: number; T: T; cam: ReturnType<typeof camaraClaves> }> = ({ tv, T, cam }) => {
  const o = tv < T.M0 ? 1 - sale(clamp((tv - (T.M0 - 0.12)) / 0.12, 0, 1)) : 0;
  if (o <= 0) return null;
  const golpe = 1 + 0.22 * Math.exp(-9 * tv) * Math.cos(tv * 26);
  const pc = proyectar(cam, [0, CAJA[1] + 1.9 * CS, CAJA[2] - 0.2 * CS]);
  const ds = tv - T.cerrar;
  const sello = ds < 0 ? 0 : ds < 0.1 ? 2.4 - 1.4 * entra(ds / 0.1) : 1 + 0.06 * Math.exp(-10 * (ds - 0.1)) * Math.sin((ds - 0.1) * 40);
  return (
    <div style={{ inset: 0, opacity: o }}>
      <Confeti t={tv} />
      <div style={{ left: pc.x - 230, top: pc.y - 26, width: 460, height: 40, transform: "rotate(-11deg)", background: "repeating-linear-gradient(90deg,#FFB703 0 70px,#ffd24d 70px 140px)", boxShadow: "0 6px 14px #0007", borderTop: "2px solid #000", borderBottom: "2px solid #000" }}>
        <div style={{ left: 0, right: 0, top: 6, textAlign: "center", font: `900 22px/1 ${DISP}`, color: "#111", letterSpacing: ".12em", whiteSpace: "nowrap" }}>RÉCORD · RÉCORD · RÉCORD · RÉCORD</div>
      </div>
      <div style={{ left: 0, right: 0, top: 0, height: 250, background: "linear-gradient(#000c,#0006 70%,transparent)" }} />
      <div style={{ left: 0, right: 0, top: 92, textAlign: "center", font: `900 40px/1 ${DISP}`, color: "#fff", textShadow: "0 4px 0 #000", transform: `scale(${golpe})` }}>VENDISTE UN</div>
      <div style={{ left: 0, right: 0, top: 132, textAlign: "center", font: `900 72px/1 ${DISP}`, color: "#34d399", letterSpacing: "-.02em", textShadow: "0 5px 0 #000, 0 0 30px #34d39988", transform: `scale(${golpe * 1.02}) rotate(-2deg)` }}>RÉCORD</div>
      {sello > 0 ? (
        <div style={{ left: 30, right: 30, top: 214, transform: `scale(${sello}) rotate(-7deg)`, opacity: Math.min(1, ds / 0.04) }}>
          <div style={{ position: "relative", border: "4px solid #FF2B3A", borderRadius: 10, padding: "6px 4px", textAlign: "center", background: "#ff2b3a22", boxShadow: "0 0 24px #FF2B3A66" }}>
            <span style={{ position: "static", font: `900 25px/1.05 ${DISP}`, color: "#FF2B3A", letterSpacing: ".02em", textShadow: "0 2px 0 #000" }}>Y POR ESO VAS A CERRAR</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const Calendario: React.FC<{ u: number }> = ({ u }) => {
  const dia = Math.min(17, 1 + Math.floor(u * 17));
  const f = u * 17 - Math.floor(u * 17);
  const hoja = (d: number, extra: React.CSSProperties) => (
    <div style={{ left: 0, top: 0, width: 92, height: 100, borderRadius: 10, background: "#fff", boxShadow: "0 6px 0 #0006", overflow: "hidden", ...extra }}>
      <div style={{ left: 0, right: 0, top: 0, height: 26, background: "#E63946", textAlign: "center", font: `800 13px/26px ${BODY}`, color: "#fff", letterSpacing: ".1em" }}>DÍA</div>
      <div style={{ left: 0, right: 0, top: 26, height: 74, textAlign: "center", font: `900 56px/74px ${DISP}`, color: "#111", fontVariantNumeric: "tabular-nums" }}>{d}</div>
    </div>
  );
  return (
    <div style={{ left: 18, top: 96, width: 92, height: 100, perspective: 400 }}>
      {hoja(dia, {})}
      {dia < 17 && u < 1 && f < 0.5 ? hoja(Math.max(1, dia - 1), { transformOrigin: "50% 0", transform: `rotateX(${f * 2 * 120}deg) translateY(${-f * 60}px)`, opacity: 1 - f * 2 }) : null}
    </div>
  );
};

const Contadores: React.FC<{ u: number; enClaro: boolean; top?: number; left?: number; escala?: number }> = ({ u, enClaro, top = 96, left = 120, escala = 1 }) => {
  const { verde, queda } = cuentas(u, enClaro);
  return (
    <div style={{ left, width: 182, top, height: 120, transform: `scale(${escala})`, transformOrigin: "0 0" }}>
      <div style={{ left: 0, right: 0, top: 0, padding: "6px 10px", borderRadius: 12, background: "#0d1a12ee", border: "2px solid #34d399" }}>
        <div style={{ position: "static", font: `800 9px ${BODY}`, letterSpacing: ".1em", color: "#bdf5d8" }}>LO QUE CREÉS QUE GANASTE</div>
        <div style={{ position: "static", font: `900 27px/1.05 ${DISP}`, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>{ars(verde)}</div>
      </div>
      <div style={{ left: 0, top: 62, padding: "4px 8px", borderRadius: 10, background: "#1a0d0dee", border: `2px solid ${enClaro ? "#34d399" : "#FF4D5A"}`, transform: `scale(${enClaro ? 1.12 : 0.92})`, transformOrigin: "0 0" }}>
        <div style={{ position: "static", font: `800 8px ${BODY}`, letterSpacing: ".1em", color: "#ffd0d4" }}>LO QUE TE QUEDA</div>
        <div style={{ position: "static", font: `900 17px/1.1 ${DISP}`, color: enClaro ? "#34d399" : queda < 0 ? "#FF4D5A" : "#ff9aa2", fontVariantNumeric: "tabular-nums" }}>{firmado(queda)}</div>
      </div>
      <div style={{ left: 120, top: 70, font: `italic 400 10px ${BODY}`, color: "#ffffffaa" }}>(ejemplo)</div>
    </div>
  );
};

/** Personajes que le pegan a la caja: tijera, mano saliendo de un cuaderno y aspiradora. */
const Personaje: React.FC<{ quien: "tijera" | "cuaderno" | "aspiradora"; t: number }> = ({ quien, t }) => {
  if (quien === "tijera") {
    const a = 18 * Math.abs(Math.sin(t * 22));
    return (
      <div style={{ left: -30, top: -30, width: 60, height: 60 }}>
        <div style={{ left: 28, top: 2, width: 6, height: 40, borderRadius: 3, background: "#cfd6dc", transformOrigin: "3px 30px", transform: `rotate(${-a}deg)` }} />
        <div style={{ left: 28, top: 2, width: 6, height: 40, borderRadius: 3, background: "#aeb6bd", transformOrigin: "3px 30px", transform: `rotate(${a}deg)` }} />
        <div style={{ left: 14, top: 38, width: 16, height: 16, borderRadius: "50%", border: "4px solid #E63946" }} />
        <div style={{ left: 32, top: 38, width: 16, height: 16, borderRadius: "50%", border: "4px solid #E63946" }} />
      </div>
    );
  }
  if (quien === "cuaderno") {
    return (
      <div style={{ left: -34, top: -30, width: 68, height: 60 }}>
        <div style={{ left: 0, top: 20, width: 56, height: 40, borderRadius: 4, background: "#2C4A8C", border: "2px solid #0f2350" }} />
        <div style={{ left: 4, top: 24, width: 48, height: 32, background: "repeating-linear-gradient(#f7f3e6 0 6px,#b9c6e8 6px 7px)" }} />
        <div style={{ left: 24, top: -4, width: 16, height: 32, borderRadius: 8, background: "#e8b48a", transform: `rotate(${20 + 10 * Math.sin(t * 15)}deg)`, transformOrigin: "50% 100%" }} />
      </div>
    );
  }
  return (
    <div style={{ left: -34, top: -26, width: 70, height: 52 }}>
      <div style={{ left: 22, top: 6, width: 44, height: 30, borderRadius: 14, background: "#8E44AD", boxShadow: "inset 0 -6px 0 #0004" }} />
      <div style={{ left: 0, top: 20, width: 30, height: 8, borderRadius: 4, background: "#555", transform: `rotate(${-10 + 6 * Math.sin(t * 30)}deg)` }} />
      <div style={{ left: 26, top: 34, width: 10, height: 10, borderRadius: "50%", background: "#222" }} />
      <div style={{ left: 52, top: 34, width: 10, height: 10, borderRadius: "50%", background: "#222" }} />
    </div>
  );
};

/** Mes: golpes de los personajes (o rebotes contra el escudo), la mano escondida y los números rojos. */
const Mes2D: React.FC<{ v: Vista; T: T; cam: ReturnType<typeof camaraClaves>; t: number }> = ({ v, T, cam, t }) => {
  if (v.esc !== "mes") return null;
  const u = mesU(v.tv, T);
  const caja = proyectar(cam, [0, CAJA[1] + 1.2 * CS, CAJA[2] + 0.8 * CS]);
  const cajon = proyectar(cam, [0.4 * CS, CAJA[1] + 0.5 * CS, CAJA[2] + 2.2 * CS]);
  const R = 92;
  const mano = manoDe(u);
  return (
    <div style={{ inset: 0 }}>
      {v.enClaro || (v.vhs?.modo === "atras" && t >= T.TR0) ? null : <><Calendario u={u} /><Contadores u={u} enClaro={v.enClaro} /></>}
      {GOLPES.map((gp, i) => {
        const d = (u - gp.u) / 0.06; // llega en 0..1
        if (d < -1 || d > 2.2) return null;
        const desdeX = i === 1 ? -60 : 420, desdeY = 260 + i * 60;
        let x: number, y: number;
        const borde = { x: caja.x + Math.cos(gp.ang) * R, y: caja.y - 10 + Math.sin(gp.ang) * R };
        if (v.enClaro) {
          // llega desde afuera en su ángulo, choca con el escudo y rebota
          const lejos = { x: borde.x + Math.cos(gp.ang) * 320, y: borde.y + Math.sin(gp.ang) * 320 };
          const k = d < 1 ? entra(clamp(d, 0, 1)) : 1 - (d - 1) * 1.6;
          x = lejos.x + (borde.x - lejos.x) * k;
          y = lejos.y + (borde.y - lejos.y) * k + (d > 1 ? (d - 1) * (d - 1) * 200 : 0);
        } else {
          const k = entra(clamp(d, 0, 1));
          x = desdeX + (caja.x - desdeX) * k;
          y = desdeY + (caja.y - desdeY) * k;
          if (d >= 1) { x = caja.x + Math.sin(d * 40) * 4; y = caja.y; }
        }
        const op = d < 0 ? 0 : 1 - clamp((d - 1.5) / 0.6, 0, 1);
        const num = !v.enClaro && d >= 1 ? clamp(d - 1, 0, 1.2) : -1;
        return (
          <React.Fragment key={i}>
            <div style={{ left: x, top: y, opacity: op, transform: `rotate(${v.enClaro && d >= 1 ? (d - 1) * 500 : 0}deg) scale(1.3)` }}>
              <Personaje quien={gp.quien} t={v.tv} />
            </div>
            {num >= 0 ? (
              <div style={{ left: caja.x - 80, width: 160, top: caja.y - 90 - num * 40, textAlign: "center", opacity: 1 - clamp((num - 0.8) / 0.4, 0, 1), transform: `scale(${Math.min(1.15, spring(num * 0.3, 16, 0.4))})` }}>
                <span style={{ position: "static", font: `900 26px ${DISP}`, color: "#FF4D5A", textShadow: "0 3px 0 #000" }}>−{ars(gp.monto)}</span>
                <div style={{ position: "static", font: `800 10px ${BODY}`, color: "#fff", letterSpacing: ".1em" }}>{gp.texto}</div>
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
      {mano.k > 0 ? <Mano desde={{ x: 400, y: cajon.y - 40 }} hasta={cajon} k={v.enClaro ? Math.min(mano.k, 0.62) : mano.k} fajo={!v.enClaro && mano.fajo} /> : null}
      {v.vhs?.modo === "lento" && mano.k > 0.05 ? <CirculoMarcador x={cajon.x + (400 - cajon.x) * (1 - mano.k) * 0.6} y={cajon.y - 14} t={t} /> : null}
    </div>
  );
};

/** El brazo del dueño (manga celeste, como su camisa) que entra por el costado y saca el fajo. */
const Mano: React.FC<{ desde: { x: number; y: number }; hasta: { x: number; y: number }; k: number; fajo: boolean }> = ({ desde, hasta, k, fajo }) => {
  const x = desde.x + (hasta.x - desde.x) * k, y = desde.y + (hasta.y - desde.y) * k;
  const ang = Math.atan2(y - desde.y, x - desde.x);
  const largo = Math.hypot(x - desde.x, y - desde.y) + 40;
  return (
    <div style={{ left: x, top: y }}>
      <div style={{ left: 0, top: -13, width: largo, height: 26, borderRadius: 12, background: "#9cc3e8", boxShadow: "inset 0 -5px 0 #6f97bd", transformOrigin: "0 50%", transform: `rotate(${ang * (180 / Math.PI) + 180}deg)` }} />
      <div style={{ left: -18, top: -16, width: 34, height: 30, borderRadius: 14, background: "#e8b48a", boxShadow: "inset -4px -4px 0 #c99366" }} />
      {fajo ? (
        <div style={{ left: -30, top: -6, width: 44, height: 22, transform: "rotate(-14deg)" }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ left: i * 2, top: -i * 3, width: 44, height: 20, borderRadius: 3, background: "#4fae72", border: "1.5px solid #2c6e45" }} />)}
          <div style={{ left: 18, top: -6, width: 8, height: 22, background: "#FFB703" }} />
        </div>
      ) : null}
    </div>
  );
};

const CirculoMarcador: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  const r = 46 + 3 * Math.sin(t * 12);
  return (
    <svg width={360} height={640} style={{ left: 0, top: 0 }}>
      <ellipse cx={x} cy={y} rx={r * 1.25} ry={r} fill="none" stroke="#FF2B3A" strokeWidth={6} strokeLinecap="round" strokeDasharray="6 0" transform={`rotate(-8 ${x} ${y})`} style={{ filter: "drop-shadow(0 2px 0 #000)" }} />
    </svg>
  );
};

const Punch2D: React.FC<{ v: Vista; T: T }> = ({ v, T }) => {
  if (v.esc !== "punch") return null;
  const tv = v.tv;
  const sp = Math.min(1.15, spring(tv - (T.M1 + 0.02), 15, 0.4));
  const ss = Math.min(1.12, spring(tv - (T.saludaste - 0.05), 15, 0.42));
  return (
    <div style={{ inset: 0 }}>
      <div style={{ left: 0, right: 0, top: 0, height: 260, background: "linear-gradient(#000d,#0007 70%,transparent)" }} />
      <div style={{ left: 0, right: 0, top: 96, textAlign: "center", transform: `scale(${sp})` }}>
        <span style={{ position: "static", font: `900 60px/1 ${DISP}`, color: "#FF2B3A", textShadow: "0 5px 0 #000, 0 0 30px #FF2B3A88", fontVariantNumeric: "tabular-nums" }}>−{ars(SACO)}</span>
        <div style={{ position: "static", font: `italic 500 13px ${BODY}`, color: "#ffffffcc" }}>(ejemplo)</div>
      </div>
      {tv >= T.saludaste - 0.05 ? (
        <div style={{ left: 0, right: 0, top: 186, textAlign: "center", transform: `scale(${ss}) rotate(-3deg)`, opacity: Math.min(1, ss * 1.3) }}>
          <span style={{ position: "static", display: "inline-block", padding: "6px 14px", background: "#FFB703", color: "#111", font: `900 30px/1 ${DISP}`, borderRadius: 8, boxShadow: "0 5px 0 #000" }}>LO SALUDASTE HOY</span>
        </div>
      ) : null}
    </div>
  );
};

/** Ruleta de sospechosos: tres siluetas que se tachan y una con "?" que queda girando. */
const SOSPECHOSOS = ["EL PROVEEDOR", "LA VECINA", "EL CHICO DE LA CAJA", "¿?"];
const Silueta: React.FC<{ i: number }> = ({ i }) => (
  <div style={{ left: 0, top: 0, width: 200, height: 150 }}>
    <div style={{ left: 74, top: 14, width: 52, height: 52, borderRadius: "50%", background: i === 3 ? "#FF4D5A" : "#1d2730" }} />
    <div style={{ left: 50, top: 70, width: 100, height: 80, borderRadius: "40px 40px 6px 6px", background: i === 3 ? "#FF4D5A" : "#1d2730" }} />
    {i === 0 ? <div style={{ left: 120, top: 92, width: 54, height: 42, background: "#a87347", border: "2px solid #6a4426" }} /> : null}
    {i === 0 || i === 2 ? <div style={{ left: 68, top: 8, width: 64, height: 18, borderRadius: "14px 14px 2px 2px", background: i === 0 ? "#2A9D8F" : "#E63946" }} /> : null}
    {i === 1 ? <><div style={{ left: 66, top: 8, width: 20, height: 20, borderRadius: "50%", background: "#d0a0c0" }} /><div style={{ left: 112, top: 8, width: 20, height: 20, borderRadius: "50%", background: "#d0a0c0" }} /><div style={{ left: 20, top: 96, width: 40, height: 44, borderRadius: 8, background: "#F4A261" }} /></> : null}
    {i === 3 ? <div style={{ left: 74, top: 14, width: 52, height: 52, textAlign: "center", font: `900 42px/52px ${DISP}`, color: "#fff" }}>?</div> : null}
  </div>
);
const Ruleta2D: React.FC<{ v: Vista; T: T }> = ({ v, T }) => {
  if (v.esc !== "ruleta") return null;
  const tv = v.tv;
  const marcas = [T.prov, T.vecina, T.chico];
  // posición del rodillo: gira rápido y frena en cada sospechoso cuando la voz lo nombra
  let pos = (tv - T.l[3]) * 11;
  marcas.forEach((m, k) => {
    if (tv >= m - 0.12 && tv < m + 0.35) pos = k + 4 * (k + 1) + entra((tv - (m - 0.12)) / 0.12) * 0 + 0.0;
  });
  const enMarca = marcas.findIndex((m) => tv >= m - 0.12 && tv < m + 0.35);
  if (enMarca < 0) {
    const ultima = marcas.filter((m) => tv >= m + 0.35).length;
    pos = 4 * ultima + ultima + (tv - (ultima ? marcas[ultima - 1] + 0.35 : T.l[3])) * 13 + 0.5;
  }
  const idx = Math.floor(pos), frac = pos - idx;
  const sym = (n: number) => ((n % 4) + 4) % 4;
  return (
    <div style={{ inset: 0 }}>
      <div style={{ inset: 0, background: "#000b" }} />
      <div style={{ left: 0, right: 0, top: 96, textAlign: "center", font: `900 26px ${DISP}`, color: "#fff", textShadow: "0 3px 0 #000" }}>¿QUIÉN FUE?</div>
      <div style={{ left: 70, top: 140, width: 220, height: 200, borderRadius: 16, background: "#e9e4d8", border: "5px solid #FFB703", overflow: "hidden", boxShadow: "0 0 40px #FFB70055" }}>
        {[-1, 0, 1].map((k) => (
          <div key={k} style={{ left: 10, top: (k - (enMarca >= 0 ? 0 : frac)) * 200 + 14, width: 200, height: 200, filter: enMarca >= 0 ? undefined : "blur(1.5px)" }}>
            <Silueta i={enMarca >= 0 ? enMarca : sym(idx + k)} />
            <div style={{ left: 0, right: 0, top: 152, textAlign: "center", font: `900 15px ${DISP}`, color: "#111" }}>{SOSPECHOSOS[enMarca >= 0 ? enMarca : sym(idx + k)]}</div>
          </div>
        ))}
        {enMarca >= 0 ? (
          <svg width={220} height={200} style={{ left: 0, top: 0 }}>
            <line x1={20} y1={30} x2={200} y2={170} stroke="#FF2B3A" strokeWidth={12} strokeLinecap="round" strokeDasharray={240} strokeDashoffset={240 * (1 - entra((tv - marcas[enMarca]) / 0.12))} />
            <line x1={200} y1={30} x2={20} y2={170} stroke="#FF2B3A" strokeWidth={12} strokeLinecap="round" strokeDasharray={240} strokeDashoffset={240 * (1 - entra((tv - marcas[enMarca] - 0.08) / 0.12))} />
          </svg>
        ) : null}
      </div>
      <div style={{ left: 30, right: 70, top: 358, display: "flex", gap: 8, justifyContent: "center" }}>
        {marcas.map((m, k) =>
          tv >= m + 0.2 ? (
            <span key={k} style={{ position: "relative", padding: "3px 6px", borderRadius: 6, background: "#ffffff22", font: `800 10px ${BODY}`, color: "#fff", textDecoration: "line-through", textDecorationColor: "#FF2B3A", textDecorationThickness: 3 }}>{SOSPECHOSOS[k]}</span>
          ) : null,
        )}
      </div>
    </div>
  );
};

/** "?" rojo clavado en la esquina desde "lo saludaste" hasta la respuesta, cuando se cae. */
const Pregunta: React.FC<{ t: number; v: Vista; T: T }> = ({ t, v, T }) => {
  const visible = (v.esc === "punch" && v.tv >= T.saludaste) || v.esc === "ruleta" || v.esc === "rojo" || (v.esc === "tuya" && t < T.tuya + 0.8) || (v.vhs !== null && t < T.FIN0);
  if (!visible || v.esc === "fin") return null;
  const cae = Math.max(0, t - T.tuya);
  const s = Math.min(1.1, spring(t - T.saludaste, 16, 0.4));
  return (
    <div style={{ left: 22, top: 392 + cae * cae * 900, width: 50, height: 60, transform: `rotate(${Math.sin(t * 3) * 6 + cae * 400}deg) scale(${v.esc === "punch" ? s : 1})`, opacity: 1 - clamp((cae - 0.5) / 0.3, 0, 1) }}>
      <div style={{ left: 0, top: 0, width: 50, height: 60, textAlign: "center", font: `900 58px/60px ${DISP}`, color: "#FF2B3A", textShadow: "0 4px 0 #000, 0 0 20px #FF2B3A99" }}>?</div>
    </div>
  );
};

const Tuya2D: React.FC<{ t: number; v: Vista; T: T }> = ({ t, v, T }) => {
  if (v.esc !== "tuya" && v.esc !== "rojo") return null;
  if (v.esc === "rojo") return <div style={{ inset: 0, background: "radial-gradient(circle at 50% 45%, transparent 40%, #5a000088)" }} />;
  const s = Math.min(1.15, spring(t - (T.tuya - 0.04), 14, 0.38));
  const sobre = t >= T.alquiler - 0.25;
  const ks = entra((t - (T.alquiler - 0.25)) / 0.25);
  const tapa = clamp((t - (T.alquiler + 0.15)) / 0.15, 0, 1);
  return (
    <div style={{ inset: 0 }}>
      <div style={{ left: 0, right: 0, top: 0, height: 240, background: "linear-gradient(#000c,transparent)" }} />
      {t >= T.tuya - 0.04 ? (
        <div style={{ left: 0, right: 0, top: 92, textAlign: "center", transform: `scale(${s})`, opacity: Math.min(1, s * 1.4) }}>
          <div style={{ position: "static", font: `900 42px/1 ${DISP}`, color: "#fff", textShadow: "0 4px 0 #000" }}>ES TU</div>
          <div style={{ position: "static", font: `900 78px/0.95 ${DISP}`, color: "#FF2B3A", textShadow: "0 5px 0 #000, 0 0 30px #FF2B3A88" }}>MANO</div>
        </div>
      ) : null}
      {sobre ? (
        <div style={{ left: 28, top: 330, width: 150, height: 100, transform: `translateY(${(1 - ks) * 200}px) rotate(-6deg)` }}>
          <div style={{ left: 0, top: 0, width: 150, height: 96, borderRadius: 6, background: "#f2e6c9", border: "2px solid #b39a63", boxShadow: "0 8px 0 #0007" }} />
          <div style={{ left: 30 + (1 - tapa) * 40, top: 30 - (1 - tapa) * 60, width: 60, height: 30, borderRadius: 3, background: "#4fae72", border: "1.5px solid #2c6e45", opacity: 1 - tapa }} />
          <div style={{ left: 0, top: 0, width: 150, height: 52, background: "#e6d6b0", clipPath: "polygon(0 0,100% 0,50% 100%)", transformOrigin: "50% 0", transform: `rotateX(${(1 - tapa) * 170}deg)` }} />
          <div style={{ left: 0, right: 0, top: 58, textAlign: "center", font: `900 20px ${DISP}`, color: "#8a1c1c", letterSpacing: ".08em" }}>ALQUILER</div>
        </div>
      ) : null}
    </div>
  );
};

/** Comparación: lo que vendiste crece; lo que te queda se derrite. Dos líneas que se cruzan en una X. */
const Comparacion: React.FC<{ t: number; v: Vista; T: T }> = ({ t, v, T }) => {
  if (v.esc !== "comp") return null;
  const a = T.l[8];
  const k = clamp((t - a) / Math.max(0.6, T.TR0 - a - 0.2), 0, 1);
  const n = Math.round(2 + k * 12);
  const derrite = clamp((t - (T.viejo - 0.1)) / 1.2, 0, 1);
  const x = clamp((t - (T.perdes - 0.1)) / 0.12, 0, 1);
  return (
    <div style={{ inset: 0 }}>
      <div style={{ left: 0, top: 0, width: 180, bottom: 0, background: "linear-gradient(#0c2a1c,#06140d)" }} />
      <div style={{ left: 180, top: 0, right: 0, bottom: 0, background: "linear-gradient(#2a0c10,#14060a)" }} />
      <div style={{ left: 178, top: 0, width: 4, bottom: 0, background: "#fff" }} />
      <div style={{ left: 8, width: 164, top: 96, textAlign: "center", font: `900 15px ${DISP}`, color: "#34d399" }}>LO QUE VENDISTE</div>
      <div style={{ left: 188, width: 164, top: 96, textAlign: "center", font: `900 15px ${DISP}`, color: "#FF4D5A" }}>LO QUE TE QUEDA</div>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} style={{ left: 50 + (i % 2) * 4, top: 470 - i * 22, width: 80, height: 18, borderRadius: 3, background: "#4fae72", border: "1.5px solid #2c6e45", boxShadow: "0 2px 0 #0005", transform: `rotate(${(rnd(i) - 0.5) * 6}deg)` }} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const h = Math.max(0, 18 * (1 - derrite * (1 + i * 0.12)));
        return (
          <React.Fragment key={i}>
            <div style={{ left: 230 + (i % 2) * 4, top: 470 - i * 22 * (1 - derrite * 0.6) + (18 - h), width: 80 - derrite * 20, height: h, borderRadius: 3, background: "#4fae72", border: "1.5px solid #2c6e45", opacity: h > 1 ? 1 : 0 }} />
            {derrite > 0.1 && i % 3 === 0 ? <div style={{ left: 240 + i * 4, top: 488 + ((t * 120 + i * 30) % 60), width: 6, height: 12, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: "#4fae72" }} /> : null}
          </React.Fragment>
        );
      })}
      <div style={{ left: 196, top: 488, width: 140, height: 10, borderRadius: 5, background: "#4fae7255", transform: `scaleX(${derrite})` }} />
      <svg width={360} height={640} style={{ left: 0, top: 0 }}>
        <line x1={30} y1={440} x2={30 + 300 * Math.min(1, k * 1.4)} y2={440 - 260 * Math.min(1, k * 1.4)} stroke="#34d399" strokeWidth={6} strokeLinecap="round" />
        <line x1={30} y1={180} x2={30 + 300 * Math.min(1, k * 1.4)} y2={180 + 260 * Math.min(1, k * 1.4)} stroke="#FF4D5A" strokeWidth={6} strokeLinecap="round" />
      </svg>
      {x > 0 ? (
        <div style={{ left: 120, top: 250, width: 120, height: 120, transform: `scale(${2 - entra(x)})`, opacity: Math.min(1, x * 2) }}>
          <div style={{ left: 52, top: -10, width: 18, height: 140, borderRadius: 8, background: "#FF2B3A", transform: "rotate(45deg)", boxShadow: "0 0 24px #FF2B3A" }} />
          <div style={{ left: 52, top: -10, width: 18, height: 140, borderRadius: 8, background: "#FF2B3A", transform: "rotate(-45deg)", boxShadow: "0 0 24px #FF2B3A" }} />
        </div>
      ) : null}
      <div style={{ left: 0, right: 0, top: 120, textAlign: "center", font: `italic 400 10px ${BODY}`, color: "#ffffff99" }}>(ejemplo)</div>
    </div>
  );
};

/** El truco: celular con En Claro (55% del alto) y su escudo que frena todo. */
const Truco2D: React.FC<{ t: number; v: Vista; T: T; cam: ReturnType<typeof camaraClaves> }> = ({ t, v, T, cam }) => {
  const enTruco = (v.esc === "mes" && (v.enClaro || (v.vhs && t >= T.TR0))) || v.esc === "final";
  if (!enTruco) return null;
  const sp = Math.min(1.06, spring(t - (T.TR0 + 0.2), 11, 0.55));
  const caja = proyectar(cam, [0, CAJA[1] + 1.2 * CS, CAJA[2] + 0.8 * CS]);
  const aT = (u: number) => T.TRR + (u * T.D) / 1.15; // tiempo real en que la repetición llega a `u`
  const choques: Choque[] = GOLPES.map((gp) => ({ en: aT(gp.u + 0.06), ang: gp.ang, texto: "BLOQUEADO" }));
  choques.push({ en: aT(0.6), ang: -0.3, texto: "FRENADA" });
  const filas: [number, string, string, string][] = [
    [aT(0.3), "Precio sugerido", "+12%", "#FFB703"],
    [aT(0.52), "Cobrar fiados: Marta", ars(14000), "#5FD39A"],
    [aT(0.85), "Hoy te quedaron", ars(41300), "#FFB703"],
  ];
  const lluvia = v.esc === "final" || t > aT(0.7);
  return (
    <div style={{ inset: 0 }}>
      <Escudo t={t} desde={T.TRR - 0.05} hasta={v.esc === "final" ? T.TR1 + 0.6 : 9999} cx={caja.x} cy={caja.y - 10} r={92} choques={choques} />
      {lluvia
        ? Array.from({ length: 22 }, (_, i) => {
            const t0 = aT(0.7) + rnd(i) * 1.2;
            const d = t - t0;
            if (d < 0 || d > 0.8) return null;
            const x = caja.x - 90 + rnd(i + 30) * 180, y = -20 + d * d * 900;
            return <div key={i} style={{ left: x, top: Math.min(y, caja.y + 30), width: 22, height: 11, borderRadius: 2, background: i % 3 ? "#4fae72" : "#ffcf4a", border: "1px solid #0004", transform: `rotate(${d * 600 + i * 40}deg)`, opacity: y > caja.y + 30 ? 0 : 1 }} />;
          })
        : null}
      <div style={{ left: 8, top: 132, width: 190, height: 400, transform: `translateY(${I(t, T.TR1 + 0.15, T.TR1 + 0.45, 0, 620, sale)}px) scale(0.93)`, transformOrigin: "0 0" }}>
        <Celular t={t} sp={sp} left={0} top={0}>
          <div style={{ left: 14, top: 30 }}><LogoEnClaro style={{ position: "relative", transform: "scale(0.55)", transformOrigin: "0 0" }} /></div>
          <div style={{ left: 12, top: 62, font: `700 11px ${BODY}`, color: "#9DB8A8", letterSpacing: ".08em" }}>TU MES, EN CLARO</div>
          {filas.map(([a, txt, val, col], i) => {
            const s = Math.min(1.05, spring(t - a, 15, 0.5));
            if (t < a) return null;
            return (
              <div key={i} style={{ left: 10, right: 10, top: 86 + i * 78, height: 68, borderRadius: 14, background: "#143723", border: `1.5px solid ${col}`, padding: "8px 10px", transform: `translateX(${(1 - Math.min(1, s)) * 120}px) scale(${0.9 + 0.1 * s})` }}>
                <div style={{ position: "static", font: `600 11px ${BODY}`, color: "#cfe3d6" }}>{txt}</div>
                <div style={{ position: "static", font: `800 ${i === 2 ? 26 : 22}px/1.15 ${DISP}`, color: col, fontVariantNumeric: "tabular-nums" }}>{val}</div>
                {i === 2 ? <div style={{ position: "static", font: `italic 500 9px ${BODY}`, color: "#9DB8A8" }}>(ejemplo)</div> : null}
              </div>
            );
          })}
        </Celular>
      </div>
      {v.esc === "mes" && v.enClaro ? <Contadores u={mesU(v.tv, T)} enClaro top={92} left={196} escala={0.78} /> : null}
    </div>
  );
};

const Final2D: React.FC<{ t: number; v: Vista; T: T }> = ({ t, v, T }) => {
  if (v.esc !== "final") return null;
  const sb = Math.min(1.05, spring(t - (T.probalo - 0.1), 15, 0.45));
  return (
    <div style={{ inset: 0 }}>
      <div style={{ left: 0, right: 0, top: 0, height: 230, background: "linear-gradient(#000c,transparent)" }} />
      <div style={{ left: 20, top: 92, font: `900 26px/1.05 ${DISP}`, color: "#fff", textShadow: "0 4px 0 #000", transform: `scale(${Math.min(1.08, spring(t - (T.cinco - 0.05), 14, 0.45))})`, transformOrigin: "0 50%" }}>
        <span style={{ position: "static", color: "#FFB703" }}>5 minutos</span> por noche
      </div>
      <div style={{ left: 16, top: 134, font: `600 15px ${BODY}`, color: "#fff", textShadow: "0 2px 0 #000", opacity: Math.min(1, (t - T.cinco) * 3) }}>Caja llena. Mes en claro.</div>
      {t >= T.probalo - 0.1 ? <BotonProbalo s={sb} top={430} /> : null}
    </div>
  );
};

export const RecordDeVentas: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const listo = useFuentesListas();
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, dur);
  const v = vista(t, T);
  const cam3 = camara3D(v, t, T);
  const tw = t >= T.LOOP ? 0 : t; // el último cuadro repite el cuadro 0
  cam3.pos = [cam3.pos[0] + Math.sin(tw * 0.8) * 0.05, cam3.pos[1] + Math.sin(tw * 1.2) * 0.04, cam3.pos[2]];

  const quieto = v.congelado || v.vhs !== null || v.esc === "fin";
  const beats = [0.05, T.cerrar, T.M1, T.saludaste, T.prov, T.vecina, T.chico, T.tuya, T.alquiler, T.vendiste, T.viejo, T.perdes, T.claro, T.cinco, T.probalo];
  const cam: Cam2D = quieto ? { z: 1.04, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, beats, [T.M0, T.M1, T.l[3], T.falta, T.l[7], T.l[8], T.TRR, T.TR1]);
  if (v.vhs?.modo === "atras") cam.tx += Math.sin(t * 90) * 2;

  const golpesMes = v.esc === "mes" && !v.enClaro && !v.vhs ? GOLPES.map((gp) => [T.M0 + (gp.u + 0.06) * T.D, 5] as [number, number]) : [];
  const hs = quieto || t >= T.LOOP ? 0 : temblor(t, [[0.03, 10], [T.cerrar, 16], [T.M1, 12], [T.falta, 18], [T.tuya, 14], [T.perdes, 12], ...golpesMes]);
  let wf = 0, red = 0;
  [[T.cerrar, 0.5], [T.M1, 0.35], [T.falta, 0.6], [T.tuya, 0.5], [T.perdes, 0.4], [T.TRR, 0.3]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });
  if (v.esc === "rojo" || v.esc === "tuya") red = 0.55 + 0.25 * Math.abs(Math.sin(t * 5));
  if (v.esc === "punch" || v.esc === "ruleta") red = 0.15;
  if (t >= T.LOOP) { wf = 0; red = 0; }

  // ---------- sonido (en tiempo real) ----------
  const aT = (uu: number) => T.TRR + (uu * T.D) / 1.15;
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, { en: 0.02, sfx: "slam", vol: 0.45 }, { en: 0.03, sfx: "coins", vol: 0.35 },
    { en: T.cerrar - 0.02, sfx: "sello" }, { en: T.cerrar, sfx: "glitch", vol: 0.3 },
    ...Array.from({ length: 17 }, (_, i) => ({ en: T.M0 + (i / 17) * T.D, sfx: i % 2 ? "hoja" : "papel", vol: 0.25 + i * 0.012 })),
    ...Array.from({ length: 6 }, (_, i) => ({ en: T.M0 + ((i * 3 + 1) / 17) * T.D, sfx: "caja", vol: 0.22 })),
    { en: T.M0 + 0.2 * T.D, sfx: "tijera" }, { en: T.M0 + 0.42 * T.D, sfx: "papel_arrancado", vol: 0.45 }, { en: T.M0 + 0.8 * T.D, sfx: "aspiradora" },
    ...GOLPES.map((gp) => ({ en: T.M0 + (gp.u + 0.06) * T.D, sfx: "thump", vol: 0.35 })),
    { en: T.M1 - 0.08, sfx: "whoosh" }, { en: T.M1, sfx: "slam" },
    ...Array.from({ length: Math.max(0, Math.floor((T.F - T.saludaste) / 0.55)) }, (_, i) => ({ en: T.saludaste + i * 0.55, sfx: "heart", vol: 0.5 })),
    { en: T.l[3] - 0.08, sfx: "whoosh", vol: 0.4 },
    ...Array.from({ length: 14 }, (_, i) => ({ en: T.l[3] + i * 0.11, sfx: "tic", vol: 0.5 })),
    { en: T.prov + 0.02, sfx: "marcador" }, { en: T.vecina + 0.02, sfx: "marcador" }, { en: T.chico + 0.02, sfx: "marcador" },
    { en: T.F, sfx: "rayon" },
    { en: T.R0 - 0.05, sfx: "rebobinado" },
    { en: T.R1 + ((U_MANO - 0.06 - (U_MANO - 0.1)) * T.D) / 0.4, sfx: "thump", vol: 0.7 },
    { en: T.falta - 0.03, sfx: "vidrio" }, { en: T.falta, sfx: "slam", vol: 0.45 },
    { en: T.mano, sfx: "heart", vol: 0.5 }, { en: T.tuya - 0.02, sfx: "thump" }, { en: T.tuya, sfx: "slam", vol: 0.4 }, { en: T.tuya + 0.05, sfx: "tic", vol: 0.5 },
    { en: T.alquiler, sfx: "papel", vol: 0.5 }, { en: T.alquiler + 0.18, sfx: "cajon", vol: 0.35 },
    { en: T.l[8] - 0.08, sfx: "whoosh" }, { en: T.l[8] + 0.1, sfx: "caja", vol: 0.4 }, { en: T.viejo, sfx: "agua", vol: 0.4 }, { en: T.perdes, sfx: "slam" },
    { en: T.TR0 - 0.03, sfx: "rebobinado", vol: 0.45 }, { en: T.TRR - 0.05, sfx: "riser", vol: 0.35 },
    ...GOLPES.map((gp) => ({ en: aT(gp.u + 0.06), sfx: "escudo" })),
    { en: aT(0.6), sfx: "lock", vol: 0.6 }, { en: aT(0.3), sfx: "ding", vol: 0.3 }, { en: aT(0.52), sfx: "ding", vol: 0.3 },
    { en: aT(0.72), sfx: "coins" }, { en: aT(0.85), sfx: "caja" },
    { en: T.probalo, sfx: "ding", vol: 0.4 }, { en: T.LOOP - 0.12, sfx: "whoosh", vol: 0.4 }, { en: T.LOOP, sfx: "thump" },
  ];
  // silencio real antes de revelar (FIN): nada suena entre FIN0 y "falta"
  const conSilencio = sonidos.filter((s) => !(s.en >= T.FIN0 - 0.05 && s.en < T.falta - 0.05));

  const credits = ["Un kiosco del barrio", "Producción: el alquiler", "Con la participación de los fiados", "Música: la caja registradora"];

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={red} frame={frame} t={t} sonidos={conSilencio}
      ocultos={[[-1, T.e[0] + 0.1], [T.FIN0 - 0.05, T.falta + 0.15], [T.tuya - 0.05, T.tuya + 0.9], [T.cinco - 0.05, 999]]}
      fondo={<Fondo2D />}
      tres={<Escena3D v={v} t={t} T={T} cam={cam3} listo={listo} />}
      tresOpacidad={v.esc === "comp" || v.esc === "fin" ? 0 : 1}
      frente={
        <>
          <Gancho2D tv={v.esc === "gancho" ? v.tv : 99} T={T} cam={cam3} />
          <Mes2D v={v} T={T} cam={cam3} t={t} />
          <Punch2D v={v} T={T} />
          <Ruleta2D v={v} T={T} />
          <Tuya2D t={t} v={v} T={T} />
          <Comparacion t={t} v={v} T={T} />
          <Truco2D t={t} v={v} T={T} cam={cam3} />
          <Final2D t={t} v={v} T={T} />
        </>
      }
      sobre={
        <>
          <Pregunta t={t} v={v} T={T} />
          <Congelado t={t} desde={T.F} hasta={T.R0} />
          {v.vhs ? <RebobinadoVHS t={t} k={v.vhs.k} modo={v.vhs.modo} /> : null}
          <FinFalso t={t} desde={T.FIN0} hasta={T.falta - 0.02} creditos={credits} />
          <VidrioRoto t={t} desde={T.falta - 0.02} cx={180} cy={290} />
        </>
      }
    />
  );
};

