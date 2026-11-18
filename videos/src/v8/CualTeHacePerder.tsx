import React from "react";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, rnd } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V8_04, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { AppGrabada, Cartel, Fondo, Foto, Numero, Probalo, Rotulo, aPantalla, entra, latido, ritmo, sp, valorPasos } from "./comun";
import { C, Producto } from "./iconos";

// V8-04 "¿Cuál de estos 4 te hace perder plata?" (videos/guiones/V8-04-CUAL-TE-HACE-PERDER.md). Juego de 4 cartas que se dan vuelta.
// Productos genéricos dibujados, sin marcas. Montos de ejemplo.

const g = GUION_V8_04;
type Tipo = "alfajor" | "gaseosa" | "yerba" | "galletitas";
const CARTAS: { tipo: Tipo; venta: number; costo: number; res: number }[] = [
  { tipo: "alfajor", venta: 1200, costo: 1450, res: -250 },
  { tipo: "gaseosa", venta: 2250, costo: 1600, res: 650 },
  { tipo: "yerba", venta: 3900, costo: 4300, res: -400 },
  { tipo: "galletitas", venta: 1100, costo: 1050, res: 6 },
];
const POR_MES = (20 * 250 + 8 * 400) * 30; // $246.000
// grabación real de la app (app/scripts/grabar-v8.cjs v8-04 → public/tomas/v8-04/app.json)
const APP = { foto: 1.047, leido: 1.948, yerba: 4.992, fin: 7.594 };
// Silencios medidos en la toma de voz (silencedetect): "¿Y por mes?" arranca en 27,82 s y "Doscientos…" en 28,71 s.
const MEDIDO = { dur: 45.588, pormes: 27.82, doscientos: 28.71 };

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  const medido = Math.abs(dur - MEDIDO.dur) < 0.05;
  const T = {
    l, e, dur,
    cual: w(0, "cuál", 3.2),
    elegi: [w(1, "elegí", l[1]), w(1, "uno", l[1] + 0.4), w(1, "ya", l[1] + 1), w(1, "dale", l[1] + 1.5)],
    alfajor: w(2, "alfajor", l[2] + 1.1), reponerlo: w(2, "reponerlo", l[2] + 3.8), cincuenta: w(2, "cincuenta", e[2] - 0.6),
    gaseosa: w(3, "gaseosa", l[3] + 0.2), deja: w(3, "deja", l[3] + 2),
    yerba: w(4, "yerba", l[4] + 0.2), cuatrocientos: w(4, "cuatrocientos", l[4] + 0.6),
    ojo: w(5, "ojo", l[5] + 0.2),
    seis: w(6, "seis", l[6] + 0.4), seis2: w(6, "seis.", l[6] + 1.1), comision: w(6, "comisión", l[6] + 2.6), regalarla: w(6, "regalarla", e[6] - 0.6),
    pormes: medido ? MEDIDO.pormes : l[7],
    doscientos: medido ? MEDIDO.doscientos : l[8],
    mil: w(8, "mil", l[8] + 1.6) + (medido ? 0.35 : 0), vendiendo: w(8, "vendiendo", e[8] - 0.6),
    foto: w(9, "foto", l[9] + 0.6), factura: w(9, "factura", l[9] + 1), aumento: w(9, "aumentó", l[9] + 3.9), vender: w(9, "vender", e[9] - 0.5),
    habias: w(10, "habías", l[10] + 0.2), probalo: w(10, "probalo", l[10] + 2.3),
    LOOP: dur - 0.27,
    app0: 0, rate: 1,
  };
  // la foto llega al celular justo después de "factura" y "Aumentó $750 (21%)" aparece cuando la voz dice "aumentó"
  const tFoto = T.factura + 0.15;
  T.rate = clamp((APP.yerba - APP.foto) / Math.max(0.5, T.aumento - tFoto), 0.8, 2);
  T.app0 = tFoto - APP.foto / T.rate;
  return T;
}
type T = ReturnType<typeof tiempos>;
const flips = (T: T) => [T.reponerlo, T.deja - 0.1, T.cuatrocientos - 0.1, T.seis - 0.08];

type Esc = "gancho" | "elegi" | "juego" | "pormes" | "revela" | "truco" | "cierre";
function escena(t: number, T: T): Esc {
  if (t >= T.LOOP) return "gancho";
  const { l } = T;
  if (t < l[1] - 0.05) return "gancho";
  if (t < l[2] - 0.05) return "elegi";
  if (t < T.regalarla + 0.6 && t < T.pormes - 0.55) return "juego";
  if (t < T.doscientos - 0.03) return "pormes";
  if (t < l[9] - 0.05) return "revela";
  if (t < l[10] - 0.05) return "truco";
  return "cierre";
}

const POS = [[22, 156], [188, 156], [22, 314], [188, 314]];
const W_C = 150, H_C = 148;

/** Una carta: frente con el producto y el precio de venta; atrás, lo que deja cada uno. */
const Carta: React.FC<{ t: number; i: number; giro: number; foco: number; dim: number; rojo: number; verde: number; temblor?: number; left?: number; top?: number; escala?: number }> = ({ t, i, giro, foco, dim, rojo, verde, temblor: tb = 0, left, top, escala = 1 }) => {
  const c = CARTAS[i];
  const [x, y] = POS[i];
  const ang = giro * 180;
  const borde = verde > 0.5 ? C.hoja : rojo > 0.5 ? C.rojo : foco > 0 && giro < 0.5 ? C.ambar : C.tinta;
  const cara: React.CSSProperties = { inset: 0, borderRadius: 16, border: `4px solid ${borde}`, boxShadow: `0 6px 0 ${C.tinta}`, backfaceVisibility: "hidden", overflow: "hidden" };
  const pierde = c.res < 0 || c.res < 50;
  return (
    <div style={{ left: left ?? x, top: top ?? y, width: W_C, height: H_C, perspective: 700, opacity: 1 - dim * 0.5, transform: `scale(${escala * (1 + 0.08 * foco) * (1 + 0.02 * Math.sin(t * 2.2 + i))}) translateX(${tb * Math.sin(t * 50) * 3}px) rotate(${tb * Math.sin(t * 37) * 2 + (i % 2 ? 1 : -1) * 1.2}deg)` }}>
      <div style={{ inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${ang}deg)` }}>
        <div style={{ ...cara, background: "#fff" }}>
          <div style={{ left: 0, right: 0, top: 10, display: "flex", justifyContent: "center" }}><Producto tipo={c.tipo} w={78} /></div>
          <div style={{ left: 0, right: 0, top: 96, textAlign: "center", font: `800 32px ${DISP}`, color: C.tinta, letterSpacing: "-.02em" }}>{ars(c.venta)}</div>
          <div style={{ left: 8, top: 6, width: 26, height: 26, borderRadius: 8, background: C.verde, textAlign: "center", font: `800 16px/26px ${DISP}`, color: C.ambar }}>{i + 1}</div>
        </div>
        <div style={{ ...cara, background: verde > 0.5 ? "#e7f3eb" : pierde ? "#fdecea" : "#e7f3eb", transform: "rotateY(180deg)" }}>
          <div style={{ left: 0, right: 0, top: 12, textAlign: "center", font: `700 15px ${BODY}`, color: C.tinta }}>reponerlo: {ars(c.costo)}</div>
          <div style={{ left: 0, right: 0, top: 44, textAlign: "center", font: `800 ${c.res === 6 ? 26 : 40}px ${DISP}`, color: verde > 0.5 || !pierde ? C.hoja : C.rojo, letterSpacing: "-.03em" }}>{c.res > 0 ? "+" : "−"}{ars(Math.abs(c.res))}</div>
          <div style={{ left: 0, right: 0, top: 98, textAlign: "center", font: `800 16px ${BODY}`, color: pierde ? C.rojo : C.hoja }}>{c.res === 6 ? "¡6 PESOS!" : pierde ? "POR CADA UNO" : "✓ TE DEJA"}</div>
          {verde > 0 ? <div style={{ inset: 0, background: `${C.hoja}e6`, opacity: verde, display: "flex", alignItems: "center", justifyContent: "center", font: `800 54px ${DISP}`, color: "#fff" }}><span style={{ position: "static" }}>✓</span></div> : null}
        </div>
      </div>
    </div>
  );
};

/** Mostrador del kiosco (base de las cartas). */
const Mostrador: React.FC = () => (
  <>
    <div style={{ left: -10, right: -10, top: 470, height: 200, background: "linear-gradient(#8a5a3c, #6b4a2b)", borderTop: `5px solid ${C.tinta}` }} />
    <div style={{ left: -10, right: -10, top: 470, height: 14, background: "repeating-linear-gradient(90deg, #16794a 0 26px, #fff4dc 26px 52px)" }} />
  </>
);

/** Moneda que se cae del borde de la carta 4 (los 6 pesos). */
const Moneda: React.FC<{ t: number; desde: number }> = ({ t, desde }) => {
  const d = t - desde;
  if (d < 0 || d > 1.4) return null;
  return (
    <div style={{ left: 300 + d * 30, top: 380 + d * d * 260, transform: `rotate(${d * 500}deg) scaleX(${Math.cos(d * 14)})`, opacity: 1 - d / 1.4 }}>
      <div style={{ width: 26, height: 26, borderRadius: 13, background: C.mostaza, border: `3px solid ${C.tinta}`, textAlign: "center", font: `800 13px/20px ${DISP}`, color: C.tinta }}>$</div>
    </div>
  );
};

/** Pila de lo que se vendió "regalando" plata en el mes. */
const Pila: React.FC<{ t: number; desde: number }> = ({ t, desde }) => (
  <>
    {Array.from({ length: 14 }, (_, i) => {
      const a = desde + i * 0.08;
      if (t < a) return null;
      const p = entra((t - a) / 0.3);
      const col = i % 5, fila = Math.floor(i / 5);
      return (
        <div key={i} style={{ left: 30 + col * 62 + (fila % 2) * 30, top: 400 - fila * 40 - (1 - p) * 200, transform: `rotate(${(rnd(i) - 0.5) * 30}deg)` }}>
          <Producto tipo={i % 3 === 2 ? "yerba" : "alfajor"} w={58} />
        </div>
      );
    })}
  </>
);

export const CualTeHacePerder: React.FC<VideoProps> = ({ voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, 0);
  const T = tiempos(pal, dur);
  const esc = escena(t, T);
  const loop = t >= T.LOOP;
  const tw = loop ? 0 : t;
  const { l, e } = T;
  const F = flips(T);
  const finMus = T.regalarla + 0.6;
  const tFin = (s: number) => T.app0 + s / T.rate;

  const beats = [0.03, T.cual, ...T.elegi, T.alfajor, ...F.map((a) => a + 0.35), T.ojo, T.seis2, T.regalarla, T.pormes, T.doscientos, T.mil, T.factura, T.aumento, T.vender, T.probalo];
  const cortes = [l[1], l[2], T.pormes - 0.5, T.doscientos, l[9], l[10]];
  const zoomOjo = esc === "juego" && t > l[5] && t < F[3] ? clamp((t - l[5]) / Math.max(0.5, F[3] - l[5]), 0, 1) : 0;
  const base = camaraBeats(tw, loop ? [] : ritmo(pal, beats, [[finMus, T.pormes - 0.02], [T.LOOP - 0.4, 999]]), loop ? [] : cortes, 0.7);
  const cam: Cam2D = zoomOjo > 0 ? { ...base, z: base.z + 0.25 * zoomOjo, tx: base.tx - 60 * zoomOjo, ty: base.ty - 70 * zoomOjo } : base;
  const hs = loop ? 0 : temblor(t, [[0.03, 8], ...F.map((a) => [a + 0.35, 5] as [number, number]), [T.regalarla, 7], [T.mil, 12]]);
  let wf = 0, red = 0;
  if (!loop) {
    [[T.doscientos, 0.35], [T.mil, 0.35]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });
    if (esc === "revela") red = 0.1;
  }

  // ---------- sonido ----------
  const verdes = [0, 1, 2, 3].map((i) => T.vender - 0.6 + i * 0.28);
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, ...[0.02, 0.1, 0.18, 0.26].map((a) => ({ en: a, sfx: "click", vol: 0.55 })), { en: 0, sfx: "calle", vol: 0.35 },
    ...T.elegi.map((a) => ({ en: a, sfx: "tic", vol: 0.7 })),
    ...cortes.map((a) => ({ en: a - 0.1, sfx: "whoosh", vol: 0.3 })),
    ...F.map((a) => ({ en: a, sfx: "hoja", vol: 0.55 })),
    { en: F[0] + 0.4, sfx: "sello", vol: 0.6 }, { en: F[1] + 0.4, sfx: "ding", vol: 0.45 }, { en: F[2] + 0.4, sfx: "sello", vol: 0.6 },
    ...Array.from({ length: Math.max(0, Math.floor((F[3] - T.ojo) / 0.5)) }, (_, i) => ({ en: T.ojo + i * Math.max(0.3, 0.5 - i * 0.04), sfx: "heart", vol: 0.5 })),
    { en: T.seis2, sfx: "coins", vol: 0.5 }, { en: T.regalarla, sfx: "thump", vol: 0.55 }, { en: T.regalarla + 0.05, sfx: "buzz", vol: 0.4 },
    { en: T.doscientos, sfx: "thump", vol: 0.5 }, { en: T.mil, sfx: "slam", vol: 0.5 }, { en: T.mil + 0.02, sfx: "thump", vol: 0.6 }, { en: T.mil + 0.1, sfx: "caja", vol: 0.4 },
    { en: T.foto - 0.1, sfx: "click", vol: 0.5 }, { en: T.factura + 0.15, sfx: "whoosh", vol: 0.4 }, { en: tFin(APP.leido), sfx: "ding", vol: 0.4 }, { en: T.aumento, sfx: "marcador", vol: 0.45 },
    ...verdes.map((a) => ({ en: a, sfx: "ding", vol: 0.4 })),
    { en: T.probalo, sfx: "click", vol: 0.5 }, { en: T.LOOP - 0.12, sfx: "whoosh", vol: 0.35 }, { en: T.LOOP, sfx: "thump", vol: 0.45 },
  ].filter((s) => !(s.en > T.regalarla + 0.65 && s.en < T.pormes - 0.05));

  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(finMus * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.12 * Math.min(1, Math.max(0, finMus * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(T.doscientos * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(T.doscientos * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.12 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  // estado de cada carta en el juego
  const enfocada = t < T.alfajor - 0.1 ? -1 : t < l[3] - 0.05 ? 0 : t < l[4] - 0.05 ? 1 : t < l[5] - 0.05 ? 2 : t < T.regalarla ? 3 : -1;
  const cartas = (tt: number, juego: boolean, recorre = -1) =>
    CARTAS.map((c, i) => {
      const giro = juego ? entra((tt - F[i]) / 0.35) : 0;
      const rojo = juego && (c.res < 50 ? tt > T.regalarla : false) ? 1 : 0;
      return <Carta key={i} t={tt} i={i} giro={giro} foco={(juego && enfocada === i) || recorre === i ? 1 : 0} dim={juego && enfocada >= 0 && enfocada !== i ? 1 : 0} rojo={rojo} verde={0} temblor={juego && i === 3 && tt > T.ojo && tt < F[3] ? 0.5 + zoomOjo : 0} />;
    });

  const yerbaApp = aPantalla(8, 64, 344, 112);

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={red} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, e[0] + 0.1], [finMus - 0.05, T.pormes - 0.05], [T.LOOP - 0.01, 999]]}
      fondo={<Fondo t={t} modo={esc === "pormes" || esc === "revela" ? "negro" : esc === "truco" ? "verde" : "papel"} />}
      frente={
        <>
          {esc === "gancho" || esc === "elegi" || esc === "juego" || esc === "cierre" ? <Mostrador /> : null}

          {esc === "gancho" ? (
            <>
              {cartas(loop ? 0 : t, false, !loop && t > 0.5 && t < l[1] - 0.3 ? Math.floor((t - 0.5) / 0.42) % 4 : -1).map((c, i) => {
                const tg = loop ? 0 : t;
                const s = Math.min(1.08, 0.7 + sp(tg + 0.12 - i * 0.08, 1.08, 16, 0.45) * 0.3);
                return <div key={i} style={{ inset: 0, transform: `scale(${s})`, transformOrigin: `${POS[i][0] + 75}px ${POS[i][1] + 74}px` }}>{c}</div>;
              })}
              <Cartel texto="¿CUÁL TE HACE PERDER PLATA?" top={86} size={21} s={Math.min(1.08, 0.8 + sp((loop ? 0 : t) + 0.1) * 0.2) * latido(loop ? 0 : t, 0.62, 0.04)} rot={-2 + Math.sin((loop ? 0 : t) * 4.4) * 1.4} />
            </>
          ) : null}

          {esc === "elegi" ? (
            <>
              {cartas(t, false)}
              <Cartel texto="ELEGÍ UNO" top={86} fondo={C.verde} color={C.ambar} size={26} s={sp(t - l[1], 1.06) * latido(t, 0.5, 0.05)} />
              {(() => {
                const n = t < T.elegi[1] ? null : t < T.elegi[2] ? 3 : t < T.elegi[3] ? 2 : 1;
                const desde = n === 3 ? T.elegi[1] : n === 2 ? T.elegi[2] : T.elegi[3];
                if (!n) return null;
                const s = sp(t - desde, 1.2, 18, 0.4);
                return <div style={{ left: 130, top: 246, width: 100, height: 100, borderRadius: 50, background: C.rojo, border: `5px solid ${C.tinta}`, textAlign: "center", font: `800 64px/90px ${DISP}`, color: "#fff", transform: `scale(${s})`, boxShadow: `0 6px 0 ${C.tinta}` }}>{n}</div>;
              })()}
            </>
          ) : null}

          {esc === "juego" ? (
            <>
              {cartas(t, true)}
              {t > T.regalarla - 0.05 ? <Cartel texto="3 DE 4" top={252} size={44} s={sp(t - T.regalarla, 1.2, 18, 0.4)} rot={-6} /> : null}
              {t < T.regalarla - 0.05 && enfocada >= 0 ? (
                <Rotulo t={t} desde={enfocada === 0 ? T.alfajor : enfocada === 1 ? T.gaseosa : enfocada === 2 ? T.yerba : T.ojo} texto={["el alfajor", "la gaseosa", "la yerba", "ojo con la última…"][enfocada]} top={100} color={C.verde} size={19} />
              ) : null}
              <Moneda t={t} desde={T.seis2} />
            </>
          ) : null}

          {esc === "pormes" ? (
            <>
              {CARTAS.map((_, i) => {
                const p = entra((t - (T.pormes - 0.55) - i * 0.06) / 0.35);
                return <div key={i} style={{ inset: 0, transform: `translate(${(105 - POS[i][0]) * p}px, ${(330 - POS[i][1]) * p + i * -4}px) rotate(${(i - 1.5) * 4 * p}deg) scale(${1 - 0.25 * p})`, transformOrigin: `${POS[i][0] + 75}px ${POS[i][1] + 74}px`, opacity: 0.85 }}><Carta t={t} i={i} giro={1} foco={0} dim={0} rojo={i !== 1 ? 1 : 0} verde={0} /></div>;
              })}
              <Numero t={t} v={0} tapado top={150} size={66} color="#ff6b5e" />
              <Rotulo t={t} desde={T.pormes} texto="¿Y POR MES?" top={236} />
            </>
          ) : null}

          {esc === "revela" ? (
            <>
              <div style={{ inset: 0, background: `radial-gradient(circle at 50% 30%, ${C.rojo}33 0%, transparent 55%)`, opacity: 0.6 + 0.4 * Math.abs(Math.sin(t * 5)) }} />
              <div style={{ inset: 0, transform: `scale(${latido(t - T.mil, 0.6, 0.06)})`, transformOrigin: "50% 30%" }}>
                <Numero t={t} v={valorPasos(t, 0, [{ en: T.doscientos, a: POR_MES }], Math.max(0.4, T.mil - T.doscientos))} pasos={[{ en: T.doscientos, a: POR_MES }]} dur={Math.max(0.4, T.mil - T.doscientos)} top={134} size={60} color="#ff6b5e" />
              </div>
              <Rotulo t={t} desde={T.mil} texto="por mes, vendiendo (ejemplo)" top={218} />
              <Pila t={t} desde={T.mil + 0.2} />
            </>
          ) : null}

          {esc === "truco" ? (
            <>
              <div style={{ left: 0, right: 0, top: 66, textAlign: "center", transform: `scale(${sp(t - l[9], 1.06)})` }}>
                <span style={{ position: "static", font: `800 22px/1.1 ${DISP}`, color: "#fff" }}>En Claro <span style={{ position: "static", color: C.ambar }}>lee la factura</span></span>
              </div>
              {/* fila de las 4 cartas chiquitas que pasan de rojo a verde cuando la app dice a cuánto vender */}
              <div style={{ left: 0, right: 0, top: 96, height: 40 }}>
                {CARTAS.map((c, i) => {
                  const v = entra((t - verdes[i]) / 0.2);
                  const roja = c.res < 50;
                  return (
                    <div key={i} style={{ left: 66 + i * 60, top: 0, width: 46, height: 40, borderRadius: 8, background: "#fff", border: `3px solid ${v > 0.5 || !roja ? C.hoja : C.rojo}`, transform: `scale(${1 + 0.25 * Math.sin(Math.PI * clamp((t - verdes[i]) / 0.3, 0, 1))})` }}>
                      <div style={{ left: 7, top: 2 }}><Producto tipo={c.tipo} w={28} /></div>
                    </div>
                  );
                })}
              </div>
              <AppGrabada t={t} carpeta="tomas/v8-04" app0={T.app0} rate={T.rate} durGrab={APP.fin} entrada={l[9] - 0.05} top={146}
                zoom={1 + 0.14 * entra((t - T.aumento + 0.2) / 0.3)} zoomY="18%" aros={[{ desde: T.aumento, ...yerbaApp, color: C.rojo }]} />
              {t > T.foto - 0.1 && t < T.factura + 0.5 ? (
                <div style={{ inset: 0, transform: `translate(${-60 * entra((t - T.factura) / 0.4)}px, ${80 * entra((t - T.factura) / 0.4)}px) scale(${1 - 0.6 * entra((t - T.factura) / 0.4)})`, opacity: 1 - entra((t - T.factura - 0.2) / 0.3), transformOrigin: "180px 320px" }}>
                  <Foto t={t} desde={T.foto - 0.1} src="tomas/v8-04/factura.jpg" left={70} top={170} w={220} h={290} rot={-4} />
                </div>
              ) : null}
            </>
          ) : null}

          {esc === "cierre" ? (
            <>
              {cartas(t, false, t > l[10] + 0.2 && t < T.LOOP - 0.5 ? Math.floor((t - l[10] - 0.2) / 0.42) % 4 : -1)}
              {t >= T.probalo - 0.1 ? <Probalo s={sp(t - (T.probalo - 0.1), 1.05, 15, 0.45) * latido(t - T.probalo, 0.6, 0.05)} top={88} /> : <Cartel texto="¿CUÁL HABÍAS ELEGIDO?" top={86} fondo={C.verde} color={C.ambar} size={22} s={sp(t - l[10], 1.06)} rot={-2 + Math.sin(t * 4) * 1.2} />}
            </>
          ) : null}
        </>
      }
      sobre={musica}
    />
  );
};
