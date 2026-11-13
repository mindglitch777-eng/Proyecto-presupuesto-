import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { I, clamp, eIn, eOut, rnd, spring, win } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V5_02, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import { Kiosco } from "../components/Kiosco";
import { TextoCinetico } from "../escenas/Dolor";
import { Pildora, proyectar, useFuentesListas } from "../v3/ElDueno";
import type { VideoProps } from "../Video";
import { BotonProbalo, Celular, ControlCamaraRoll, GanchoGigante, LogoEnClaro, Marco, W, camaraBeats, camaraClaves, lineasDeVoz, temblor, type Clave } from "./comun";
import { Caja, type ModoDisplay } from "./ModelosCaja";
import { Objeto } from "./ModelosBasura";

// V5-02 "Confesiones de una caja registradora": la caja es la narradora (molde "Objeto que habla").
// El misterio es cuánto te quedó de verdad: queda tapado con "$?.???" hasta que la voz lo dice. Todo atado a las palabras de Tomás.

const g = GUION_V5_02;
type V3 = [number, number, number];
const VENDIO = 120000, MERC = 66000, FIJOS = 36333, FIADO = 8000, QUEDO = VENDIO - MERC - FIJOS - FIADO; // 9.667

function tiempos(pal: Palabra[]) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  return {
    l, e,
    camp: w(1, "campanita", l[1] + 1.2), vendiste: w(1, "vendiste", l[1] + 2.2), ciento: w(1, "ciento", l[1] + 2.8), lindo: w(1, "lindo", e[1] - 0.5),
    mira: w(2, "mirá", l[2] + 0.8), sale: w(2, "sale", l[2] + 1.6),
    merc: w(3, "mercadería", l[3]), sesenta: w(3, "sesenta", l[3] + 1.0), alq: w(3, "alquiler", l[3] + 2.2), treinta: w(3, "treinta", l[3] + 4.0), fiado: w(3, "fiado", l[3] + 4.8), ocho: w(3, "ocho", l[3] + 5.6),
    se: w(4, "sé", l[4] + 0.4), nunca: w(4, "nunca", l[4] + 2.0),
    quedaron: w(5, "quedaron", l[5]), nueve: w(5, "nueve", l[5] + 0.5), creias: w(5, "creías", l[5] + 3.0),
    celular: w(6, "celular", l[6] + 1.3), cuenta: w(6, "cuenta", l[6] + 2.8),
    camp2: w(7, "campanita", l[7]), cuanto: w(7, "cuánto", l[7] + 1.5), comentalo: w(7, "comentalo", e[7] - 0.6),
  };
}
type T = ReturnType<typeof tiempos>;

const salidas = (t: number, T_: T) => ({
  merc: MERC * I(t, T_.sesenta + 0.1, T_.sesenta + 0.6, 0, 1, eOut),
  fijos: FIJOS * I(t, T_.treinta + 0.1, T_.treinta + 0.6, 0, 1, eOut),
  fiado: FIADO * I(t, T_.ocho + 0.1, T_.ocho + 0.6, 0, 1, eOut),
});

type Billete = { t0: number; from: V3; to: V3; spin: number };
function billetes(T_: T): Billete[] {
  const out: Billete[] = [];
  const grupo = (t0: number, lado: number, n: number, seed: number) => {
    for (let k = 0; k < n; k++) out.push({ t0: t0 + k * 0.08, from: [(rnd(seed + k) - 0.5) * 0.8, 0.8, 2.2], to: [lado * (4.2 + rnd(seed + k + 9) * 1.2), 5 + rnd(seed + k + 4) * 2, 3.2], spin: 1 + rnd(seed + k) });
  };
  grupo(T_.merc + 0.9, -1, 6, 1);
  grupo(T_.alq + 1.2, 1, 6, 20);
  grupo(T_.fiado + 0.9, -1, 4, 40);
  // los que salen cuando abre el cajón al vender
  for (let k = 0; k < 5; k++) out.push({ t0: T_.vendiste + k * 0.07, from: [(rnd(60 + k) - 0.5) * 0.8, 0.8, 2.2], to: [(k % 2 ? 1 : -1) * 1.6, 3.6 + rnd(k) * 1.5, 2.6], spin: 1 + rnd(k + 70) });
  return out;
}

function claves(T_: T, dur: number): Clave[] {
  const c = (t: number, pos: V3, target: V3, fov: number, roll = 0): Clave => ({ t, pos, target, fov, roll });
  const ini = c(0, [0.5, 3.1, 6.4], [0, 1.9, 0], 50);
  return [
    ini,
    c(1.8, [0.2, 2.9, 5.6], [0, 1.85, 0], 50),
    c(T_.l[1] - 0.2, [0.2, 2.9, 5.5], [0, 1.8, 0], 50),
    c(T_.l[1] + 0.35, [-2.1, 2.5, 5.2], [-0.2, 1.4, 0], 50, 0.06),
    c(T_.vendiste, [0.5, 2.7, 4.6], [0, 1.4, 0.3], 47),
    c(T_.l[2] + 0.1, [1.7, 1.0, 5.8], [0, 1.0, 0.4], 52, -0.07),
    c(T_.l[3] + 0.1, [0, 2.6, 6.6], [0, 1.1, 0.6], 54),
    c(T_.e[3], [0.1, 2.6, 6.4], [0, 1.1, 0.5], 54),
    c(T_.l[4] + 0.2, [0, 1.65, 3.7], [0, 1.55, 0], 42),
    c(T_.e[4] + 0.2, [0, 1.7, 3.5], [0, 1.55, 0], 41),
    c(T_.l[5] + 0.3, [0, 1.75, 3.1], [0, 1.55, 0], 40),
    c(T_.e[5], [0, 1.8, 3.4], [0, 1.5, 0], 42),
    c(T_.l[6] + 0.3, [-1.1, 2.0, 7.4], [0.9, 1.4, 0], 50),
    c(T_.l[7] - 0.2, [-0.2, 2.0, 6.8], [0.3, 1.2, 0], 50),
    c(dur - 0.9, ini.pos, ini.target, ini.fov),
    c(dur + 1, ini.pos, ini.target, ini.fov),
  ];
}

function displayDe(t: number, T_: T) {
  const salida = salidas(t, T_);
  const val = clamp(I(t, T_.vendiste, T_.ciento + 0.5, 0, VENDIO, eOut) - salida.merc - salida.fijos - salida.fiado, 0, VENDIO);
  let modo: ModoDisplay = "ojos", texto = "";
  if (t >= T_.vendiste && t < T_.l[4]) { modo = "num"; texto = ars(val); }
  else if (t >= T_.l[4] && t < T_.quedaron) modo = "triste";
  else if (t >= T_.quedaron && t < T_.camp2) { modo = "num"; texto = ars(QUEDO); }
  else if (t >= T_.camp2) modo = "feliz";
  const colorLcd = modo === "num" ? (t >= T_.quedaron ? "#FF4D5A" : val > 60000 ? "#7CFFB0" : val > 20000 ? "#FFB703" : "#FF4D5A") : "#7CFFB0";
  const ciclo = (t % 2.4) / 2.4;
  const parpadeo = ciclo > 0.93 ? Math.sin(((ciclo - 0.93) / 0.07) * Math.PI) : 0;
  const mira: [number, number] = [Math.sin(t * 1.3) * 0.5, Math.sin(t * 0.9) * 0.3];
  return { modo, texto, colorLcd, parpadeo, mira };
}

const Escena3D: React.FC<{ t: number; T_: T; bs: Billete[]; dur: number; listo: boolean }> = ({ t, T_, bs, dur, listo }) => {
  const c = camaraClaves(t, claves(T_, dur));
  c.pos = [c.pos[0] + Math.sin(t * 0.8) * 0.07, c.pos[1] + Math.sin(t * 1.2) * 0.05, c.pos[2]];
  const d = displayDe(t, T_);
  const salida = salidas(t, T_);
  const cajon = I(t, T_.vendiste - 0.2, T_.vendiste + 0.4, 0, 1, eOut) * (1 - I(t, T_.l[4] - 0.15, T_.l[4] + 0.1, 0, 1, eIn));
  const llena = I(t, T_.vendiste, T_.vendiste + 0.7, 0, 1, eOut);
  const restante = clamp(llena - (salida.merc + salida.fijos + salida.fiado) / VENDIO, 0, 1);
  const paso = (a: number) => eOut(clamp((t - a) / 0.4, 0, 1));
  const lineas = paso(T_.camp + 0.2) + paso(T_.ciento + 0.3) + paso(T_.sesenta) + paso(T_.treinta) + paso(T_.ocho) + paso(T_.se) + paso(T_.quedaron);
  const ticket = lineas > 0.01 ? (46 * lineas + 12) / 700 + (lineas > 6.9 ? 0.03 : 0) : 0;
  const ring = (a: number) => (t > a ? Math.exp(-6 * (t - a)) * Math.sin((t - a) * 60) : 0);
  const campana = ring(T_.camp) + ring(T_.camp2) + ring(T_.quedaron) * 0.5;
  const salto = [T_.camp, T_.camp2, T_.vendiste, T_.quedaron].reduce((s, a) => s + (t > a ? Math.exp(-9 * (t - a)) * Math.abs(Math.sin((t - a) * 18)) : 0), 0);
  const latido = t > T_.l[4] && t < T_.quedaron ? Math.abs(Math.sin((t - T_.l[4]) * 5)) ** 6 : 0;
  return (
    <>
      <ControlCamaraRoll c={c} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#ffe9c4", "#3a2412", 0.6]} />
      <directionalLight position={[3, 8, 8]} intensity={2.3} color="#fff0d0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-4} />
      <pointLight position={[0, 3, 4]} intensity={20 + latido * 30} distance={12} color={latido > 0.3 ? "#ff6a78" : "#ffd9a0"} />
      <Caja cajon={cajon} ticket={ticket} campana={campana} salto={salto} modo={d.modo} texto={d.texto} mira={d.mira} parpadeo={d.parpadeo} colorLcd={d.colorLcd} restante={restante} listo={listo} />
      {bs.map((b, i) => {
        const u = (t - b.t0) / 0.9;
        if (u < 0 || u > 1) return null;
        const k = u * u * (3 - 2 * u);
        const p: V3 = [b.from[0] + (b.to[0] - b.from[0]) * k, b.from[1] + (b.to[1] - b.from[1]) * k + Math.sin(Math.PI * u) * 1.4, b.from[2] + (b.to[2] - b.from[2]) * k];
        return <Objeto key={i} kind={3} p={p} rot={[b.spin * u * 5, b.spin * u * 3, b.spin * u * 4]} s={1.1} />;
      })}
    </>
  );
};

// ---------- capas 2D ----------
const Fondo2D: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ inset: 0 }}>
    <div style={{ inset: 0, background: "radial-gradient(circle at 50% 35%,#4a3320,#120a05 78%)" }} />
    <div style={{ left: 0, top: 120, width: 360, height: 420, filter: "blur(6px) brightness(.6)", opacity: 0.9 }}>
      <Kiosco t={t} persiana={0} luz={1} productosQueFaltan={0} />
    </div>
  </div>
);

const Contador: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.l[1] - 0.2, T_.e[5] + 0.3, 0.25, 0.3);
  if (o <= 0) return null;
  const rev = t >= T_.quedaron;
  const v = I(t, T_.quedaron + 0.1, T_.nueve + 0.5, 0, QUEDO, eOut);
  const sg = Math.min(1.12, spring(t - (T_.quedaron + 0.1), 12, 0.45));
  const k = win(t, T_.quedaron - 0.1, T_.e[5] + 0.2, 0.2, 0.3);
  return (
    <div style={{ left: 16, right: 16, top: 62, opacity: o, transform: `scale(${1 + 0.1 * k}) translateX(${rev ? 0 : Math.sin(t * 40) * 1.2}px)`, transformOrigin: "50% 0" }}>
      <div style={{ position: "relative", padding: "8px 12px 10px", borderRadius: 16, background: "#14110dee", border: `2px solid ${rev ? "#FF4D5A" : "#FFB703"}`, boxShadow: `0 10px 30px #000a, 0 0 ${rev ? 34 : 14}px ${rev ? "#FF4D5A77" : "#FFB70044"}`, textAlign: "center" }}>
        <div style={{ position: "static", font: `800 11px ${BODY}`, letterSpacing: ".14em", color: "#ffffffbb" }}>LO QUE TE QUEDÓ HOY</div>
        <div style={{ position: "static", font: `800 42px/1.05 ${DISP}`, color: rev ? "#FF4D5A" : "#FFB703", fontVariantNumeric: "tabular-nums", transform: `scale(${rev ? sg : 1})`, textShadow: "0 3px 0 #000" }}>{rev ? ars(v) : "$?.???"}</div>
        {rev ? <div style={{ position: "static", font: `400 13px ${BODY}`, color: "#ffffffaa", fontStyle: "italic" }}>ejemplo</div> : null}
      </div>
    </div>
  );
};

const Chips: React.FC<{ t: number; T_: T; c: ReturnType<typeof camaraClaves> }> = ({ t, T_, c }) => {
  const lista: [number, string, string, string][] = [
    [T_.vendiste, "VENDISTE", "+" + ars(VENDIO), "#34d399"],
    [T_.sesenta, "MERCADERÍA", "−" + ars(MERC), "#FF4D5A"],
    [T_.treinta, "ALQUILER + LUZ + SUELDO", "−" + ars(FIJOS), "#FF4D5A"],
    [T_.ocho, "FIADO QUE NO VUELVE", "−" + ars(FIADO), "#FF4D5A"],
  ];
  void c;
  return (
    <>
      {lista.map(([a, n, m, col], i) => {
        const fin = i === 0 ? T_.l[3] - 0.1 : T_.l[4] - 0.1;
        const o = win(t, a - 0.15, fin, 0.12, 0.25);
        if (o <= 0) return null;
        const s = Math.min(1.08, spring(t - (a - 0.15), 15, 0.5));
        const top = i === 0 ? 150 : 150 + (i - 1) * 48;
        return (
          <div key={i} style={{ left: 16, right: 16, top, opacity: o, transform: `translateX(${(1 - Math.min(1, s)) * 160}px) scale(${0.9 + 0.1 * s})`, transformOrigin: "0 50%" }}>
            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", borderRadius: 12, background: "#14110df0", border: `2px solid ${col}`, boxShadow: "0 6px 0 #0008" }}>
              <span style={{ position: "static", font: `800 ${n.length > 14 ? 11 : 13}px ${BODY}`, letterSpacing: ".06em", color: "#fff" }}>{n}</span>
              <span style={{ position: "static", font: `900 22px ${DISP}`, color: col, fontVariantNumeric: "tabular-nums" }}>{m}</span>
            </div>
          </div>
        );
      })}
    </>
  );
};

const Comparacion: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.creias - 0.2, T_.e[5] + 0.1, 0.15, 0.25);
  if (o <= 0) return null;
  const base = 450, max = 220;
  const hA = max * I(t, T_.creias, T_.creias + 0.5, 0, 1, eOut);
  const hB = Math.max(5, max * (QUEDO / VENDIO)) * I(t, T_.creias + 0.45, T_.creias + 0.8, 0, 1, eOut);
  const sB = Math.min(1.15, spring(t - (T_.creias + 0.45), 15, 0.4));
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 20, right: 20, top: 190, height: 290, borderRadius: 18, background: "#0d0a07cc", border: "2px solid #ffffff22" }} />
      <div style={{ left: 56, width: 100, top: base - hA, height: hA, borderRadius: "10px 10px 0 0", background: "linear-gradient(#9aa3a8,#6b7378)" }} />
      <div style={{ left: 56, width: 100, top: base - hA - 28, textAlign: "center", font: `900 20px ${DISP}`, color: "#cfd4d6", opacity: hA > 30 ? 1 : 0 }}>{ars(VENDIO)}</div>
      <div style={{ left: 56, width: 100, top: base + 6, textAlign: "center", font: `800 11px ${BODY}`, letterSpacing: ".08em", color: "#ffffffcc" }}>VOS CREÍAS</div>
      <div style={{ left: 204, width: 100, top: base - hB, height: hB, borderRadius: "8px 8px 0 0", background: "#FF4D5A", boxShadow: "0 0 24px #FF4D5A99" }} />
      <div style={{ left: 204, width: 100, top: base - hB - 32, textAlign: "center", font: `900 24px ${DISP}`, color: "#FF4D5A", transform: `scale(${sB})`, opacity: hB > 4 ? 1 : 0, textShadow: "0 3px 0 #000" }}>{ars(QUEDO)}</div>
      <div style={{ left: 204, width: 100, top: base + 6, textAlign: "center", font: `800 11px ${BODY}`, letterSpacing: ".08em", color: "#ffffffcc" }}>LO REAL</div>
    </div>
  );
};

const Truco: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.l[6] - 0.1, T_.l[7] + 0.05, 0.1, 0.3);
  if (o <= 0) return null;
  const sp = spring(t - (T_.celular - 0.5), 11, 0.55);
  const hablo = win(t, T_.celular - 0.2, T_.cuenta, 0.1, 0.15);
  const res = Math.min(1, I(t, T_.cuenta - 0.1, T_.cuenta + 0.3, 0, 1));
  const q = I(t, T_.cuenta + 0.1, T_.cuenta + 0.7, 0, QUEDO, eOut);
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 150, top: 120, width: 190, height: 400, transform: "scale(0.82)", transformOrigin: "0 0" }}>
        <Celular t={t} sp={sp} left={0} top={0}>
          <div style={{ left: 14, top: 32, font: `700 13px ${DISP}`, color: "#fff" }}>Cierre de hoy</div>
          <div style={{ left: 10, right: 10, top: 58, height: 84, borderRadius: 14, background: "#143723", border: "1px solid #2f6a4b", opacity: hablo }}>
            <div style={{ left: 10, top: 8, font: `600 9px ${BODY}`, color: "#9DB8A8", letterSpacing: ".08em" }}>ESCUCHANDO…</div>
            {Array.from({ length: 16 }, (_, i) => <i key={i} style={{ left: 12 + i * 9, bottom: 12, width: 5, height: 6 + 26 * Math.abs(Math.sin(t * 9 + i * 0.9)), borderRadius: 3, background: "#FFB703" }} />)}
          </div>
          <div style={{ left: 10, right: 10, top: 150, opacity: res }}>
            {[["Entró", "+" + ars(VENDIO), "#5FD39A"], ["Salió", "−" + ars(MERC + FIJOS + FIADO), "#FF4D5A"]].map(([a, b, col], i) => (
              <div key={i} style={{ left: 0, right: 0, top: i * 40, height: 34, borderRadius: 10, background: "#143723", border: "1px solid #2f6a4b", padding: "7px 10px" }}>
                <span style={{ position: "static", font: `600 11px ${BODY}`, color: "#cfe3d6" }}>{a}</span>
                <span style={{ right: 10, top: 8, font: `800 14px ${DISP}`, color: col }}>{b}</span>
              </div>
            ))}
            <div style={{ left: 0, right: 0, top: 90, padding: 12, borderRadius: 14, background: "#143723", border: "1px solid #2f6a4b" }}>
              <div style={{ position: "static", font: `600 10px ${BODY}`, color: "#9DB8A8", textTransform: "uppercase", letterSpacing: ".08em" }}>Hoy te quedaron</div>
              <div style={{ position: "static", font: `700 32px/1.1 ${DISP}`, color: "#FFB703", fontVariantNumeric: "tabular-nums" }}>{ars(q)}</div>
              <div style={{ position: "static", font: `600 10px ${BODY}`, color: "#5FD39A" }}>ejemplo</div>
            </div>
          </div>
        </Celular>
      </div>
      <TextoCinetico t={t} desde={T_.celular - 0.1} paso={0.08} texto="Hablás y listo." amarillas={[2]} style={{ left: 16, right: 10, top: 66, font: `800 30px/1.05 ${DISP}`, color: "#fff", textShadow: "0 4px 0 #000" }} />
    </div>
  );
};

const Cierre: React.FC<{ t: number; T_: T }> = ({ t, T_ }) => {
  const o = win(t, T_.l[7] - 0.15, 9999, 0.2, 0.01);
  if (o <= 0) return null;
  const sb = spring(t - (T_.comentalo - 0.1), 16, 0.4);
  return (
    <div style={{ inset: 0, opacity: o }}>
      <div style={{ left: 0, right: 0, top: 0, height: 230, background: "linear-gradient(#000d,transparent)" }} />
      <LogoEnClaro style={{ position: "absolute", left: 18, top: 62, opacity: Math.min(1, spring(t - T_.l[7], 12, 0.5)) }} />
      <TextoCinetico t={t} desde={T_.cuanto - 0.1} paso={0.09} texto="¿Cuánto creés" amarillas={[]} style={{ left: 18, right: 10, top: 112, font: `700 32px/1.05 ${DISP}`, color: "#fff", textShadow: "0 4px 0 #000" }} />
      <TextoCinetico t={t} desde={T_.cuanto + 0.5} paso={0.09} texto="que te quedó hoy?" amarillas={[2]} style={{ left: 18, right: 10, top: 148, font: `800 36px/1.05 ${DISP}`, color: "#fff", textShadow: "0 4px 0 #000" }} />
      <Pildora texto="COMENTALO" style={{ left: 18, top: 204, transform: `scale(${sb})`, transformOrigin: "0 50%", fontSize: 18 }} />
      <BotonProbalo s={sb} top={566} />
    </div>
  );
};

export const CajaRegistradora: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const listo = useFuentesListas();
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T_ = tiempos(pal);
  const bs = billetes(T_);
  const cam3 = camaraClaves(t, claves(T_, dur));

  const hs = temblor(t, [[0.05, 10], [T_.vendiste, 7], [T_.sesenta, 8], [T_.treinta, 8], [T_.ocho, 8], [T_.quedaron, 18], [T_.l[4], 5]]);
  let wf = t < 0.1 ? 0.3 : 0, red = 0;
  { const d = t - T_.quedaron; if (d >= 0) { wf += Math.max(0, 1 - d / 0.2) * 0.55; red += Math.max(0, 1 - d / 0.5); } }
  const beats = [0.45, 1.2, T_.camp, T_.vendiste, T_.ciento, T_.mira, T_.sale, T_.sesenta, T_.treinta, T_.ocho, T_.se, T_.nunca, T_.quedaron, T_.nueve, T_.creias, T_.celular, T_.cuenta, T_.camp2, T_.cuanto, T_.comentalo];
  const cam = camaraBeats(t, beats, [T_.l[1], T_.l[2], T_.l[3], T_.l[4], T_.l[5], T_.l[6], T_.l[7]]);

  const sonidos = [
    { en: 0.05, sfx: "slam" }, { en: 0.0, sfx: "whoosh" }, { en: 0.4, sfx: "ding", vol: 0.35 },
    ...[T_.l[1], T_.l[2], T_.l[3], T_.l[4], T_.l[6], T_.l[7]].map((a) => ({ en: a - 0.12, sfx: "whoosh" })),
    { en: T_.camp, sfx: "ding" }, { en: T_.camp + 0.35, sfx: "ding", vol: 0.3 },
    { en: T_.vendiste - 0.2, sfx: "cajon" }, { en: T_.vendiste, sfx: "caja" }, { en: T_.ciento, sfx: "coins" },
    ...[T_.camp + 0.2, T_.ciento + 0.3, T_.sesenta, T_.treinta, T_.ocho, T_.se, T_.quedaron].map((a) => ({ en: a, sfx: "papel", vol: 0.35 })),
    ...bs.map((b) => ({ en: b.t0 + 0.05, sfx: "whoosh", vol: 0.18 })),
    { en: T_.sesenta, sfx: "slam", vol: 0.4 }, { en: T_.treinta, sfx: "slam", vol: 0.4 }, { en: T_.ocho, sfx: "slam", vol: 0.4 },
    { en: T_.l[4] - 0.15, sfx: "cajon" },
    ...[0, 1, 2, 3].map((k) => ({ en: T_.l[4] + 0.1 + k * 0.6, sfx: "heart", vol: 0.45 })),
    { en: T_.quedaron - 0.6, sfx: "riser" }, { en: T_.quedaron, sfx: "slam" }, { en: T_.quedaron + 0.05, sfx: "boveda" },
    { en: T_.creias + 0.45, sfx: "thump" }, { en: T_.celular - 0.35, sfx: "whoosh" }, { en: T_.cuenta + 0.1, sfx: "caja" },
    { en: T_.camp2, sfx: "ding" }, { en: T_.comentalo, sfx: "ding", vol: 0.45 },
  ];

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={red} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, T_.e[0] + 0.1], [T_.quedaron - 0.1, T_.nueve + 0.9], [T_.comentalo - 0.1, 999]]}
      fondo={<Fondo2D t={t} />}
      tres={<Escena3D t={t} T_={T_} bs={bs} dur={dur} listo={listo} />}
      frente={
        <>
          <GanchoGigante t={t} lineas={[...g.ganchos[0].lineas]} hasta={T_.e[0]} top={112} />
          {t < T_.l[1] + 0.6 ? <Pildora texto="KIOSQUERO:" style={{ left: 18, top: 62, transform: "rotate(-3deg)", opacity: win(t, -1, T_.l[1] + 0.5, 0.01, 0.4) }} /> : null}
          <Contador t={t} T_={T_} />
          <Chips t={t} T_={T_} c={cam3} />
          <Comparacion t={t} T_={T_} />
          <Truco t={t} T_={T_} />
          <Cierre t={t} T_={T_} />
        </>
      }
    />
  );
};

void eIn;
void proyectar;
