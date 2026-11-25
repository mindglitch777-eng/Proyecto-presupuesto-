import React from "react";
import { OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { guionSchema } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Celular, Marco, camaraBeats, temblor, type Cam2D } from "../v6/comun";
import { entra, sp } from "../v8/comun";
import dialogo from "../../public/voces/tt-07/dialogo.json";
import { AMARILLO, BLANCO, Chip, Contador, CtaWhatsApp, Flash, Fondo, Golpe, NEGRO, Pulso, ROJO, Sub, Voces, lineaDeVoz } from "./motion";

// TT-07 "Tu mejor cliente te está fundiendo" (videos/guiones/TT-07-MEJOR-CLIENTE.md). Motion graphics 2D: carnet "cliente del mes"
// que se parte, expediente con 3 casillas tapadas (compra / debe / paga), "adiviná cuánto pagó" con cuenta regresiva, $0,
// la plata que se va, Fiados real. Voz: Charon (gurú de negocios); lo que dice el cliente va en globos, sin voz.

const g = guionSchema.parse({ id: "tt-07", titulo: "Tu mejor cliente te está fundiendo", duracionSeg: 30, voz: null, ganchos: [{ lineas: ["", "", ""], voz: "" }], lineas: [], sonidos: [] });
const FR = dialogo.frases as Record<string, { dur: number }>;
const TXT: Record<string, string> = {
  b1: "Tu mejor cliente te está fundiendo.", b1ad: "Este cliente funde kioscos todos los días.", b2: "El que más viene. El más simpático. Mirá su ficha.",
  b3: "Compra todos los días. Y debe… $180.000.", b4: "¿Adivinás cuánto pagó este mes?", b5: "Cero.",
  b6: "$180.000. Con tu plata. Y vos le seguís fiando.", b7: "La app te dice quién te debe y le manda el recordatorio por vos.", b8ad: "Escribime por WhatsApp y te muestro cómo.",
};

function armar(ad: boolean) {
  const ids = [ad ? "b1ad" : "b1", "b2", "b3", "b4", "b5", "b6", "b7", ...(ad ? ["b8ad"] : [])];
  const { T, fin, d } = lineaDeVoz(FR, ids, { b4: 1.6, b5: 0.35, b7: 0.25 });
  const h = ad ? "b1ad" : "b1";
  const X = {
    ...T,
    parte: T[h] + d(h) * 0.5, compra: T.b3 + 0.05, debe: T.b3 + d("b3") * 0.55,
    cuenta: T.b4 + d("b4"), app: T.b7 + 0.1, cierre: ad ? T.b8ad - 0.1 : T.b7 + d("b7") + 0.25,
  };
  const total = ad ? fin + 1.4 : X.cierre + 2.6;
  return { T: X as Record<string, number>, h, ids, d, total };
}
export const durTT07 = (ad: boolean) => armar(ad).total;

/** Carnet del cliente (personaje genérico). `parte` 0..1 lo rompe al medio. */
const Carnet: React.FC<{ t: number; parte: number }> = ({ t, parte }) => {
  const mitad = (lado: number) => (
    <div style={{ left: 40, top: 110, width: 280, height: 300, clipPath: lado < 0 ? "polygon(0 0, 52% 0, 46% 100%, 0 100%)" : "polygon(52% 0, 100% 0, 100% 100%, 46% 100%)", transform: `translateX(${lado * parte * 50}px) rotate(${lado * parte * 8}deg)` }}>
      <div style={{ inset: 0, borderRadius: 18, background: BLANCO, boxShadow: "0 14px 0 #0006" }} />
      <div style={{ left: 0, right: 0, top: 0, height: 48, borderRadius: "18px 18px 0 0", background: AMARILLO, font: `900 20px/48px ${DISP}`, color: NEGRO, textAlign: "center" }}>★ CLIENTE DEL MES ★</div>
      <svg width="140" height="150" viewBox="0 0 140 150" style={{ left: 70, top: 64 }}>
        <rect x="0" y="0" width="140" height="150" rx="10" fill="#e9eef3" />
        <path d="M20 150 Q24 104 70 98 Q116 104 120 150 Z" fill="#3b6fd8" />
        <circle cx="70" cy="62" r="34" fill="#e6b08c" />
        <path d="M36 54 Q40 24 70 24 Q102 24 104 52 Q86 40 36 54Z" fill="#222" />
        <circle cx="58" cy="62" r="4" fill="#111" /><circle cx="82" cy="62" r="4" fill="#111" />
        <path d="M54 78 Q70 92 86 78" stroke="#5a2410" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
      <div style={{ left: 0, right: 0, top: 226, textAlign: "center", font: `900 24px ${DISP}`, color: NEGRO }}>"EL DE SIEMPRE"</div>
      <div style={{ left: 0, right: 0, top: 260, textAlign: "center", font: `700 14px ${BODY}`, color: "#555" }}>viene todos los días · re simpático</div>
    </div>
  );
  return <div style={{ inset: 0, transform: `translateY(${Math.sin(t * 2) * 3}px)` }}>{mitad(-1)}{mitad(1)}</div>;
};

/** Ficha tipo expediente con 3 casillas tapadas. */
const Ficha: React.FC<{ t: number; T: Record<string, number> }> = ({ t, T }) => {
  const fila = (y: number, rotulo: string, abierta: number, contenido: React.ReactNode, late = false) => (
    <div style={{ left: 24, right: 24, top: y, height: 82 }}>
      <div style={{ inset: 0, borderRadius: 12, background: "#f4f1e8", border: "3px solid #222" }} />
      <div style={{ left: 14, top: 10, font: `900 15px ${BODY}`, color: "#666", letterSpacing: ".08em" }}>{rotulo}</div>
      <div style={{ left: 14, right: 14, top: 30 }}>{contenido}</div>
      <div style={{ left: 8, right: 8, top: 26, height: 48, background: "repeating-linear-gradient(-45deg, #111 0 14px, #2a2a2a 14px 28px)", borderRadius: 6, transformOrigin: "100% 0", transform: `rotate(${abierta * 18}deg) translateX(${abierta * 360}px)`, opacity: 1 - abierta * 0.3, boxShadow: late ? `0 0 ${12 + 10 * Math.sin(t * 10)}px ${AMARILLO}` : "none" }} />
    </div>
  );
  const vDebe = Math.round(180000 * entra((t - T.debe) / 1.0) / 1000) * 1000;
  return (
    <>
      <div style={{ left: 24, top: 96, padding: "4px 12px", border: `4px solid ${ROJO}`, borderRadius: 6, transform: "rotate(-6deg)", font: `900 26px ${DISP}`, color: ROJO, background: "#fff" }}>EXPEDIENTE</div>
      {fila(160, "COMPRA", entra((t - T.compra) / 0.3), <span style={{ position: "static", font: `900 32px ${DISP}`, color: "#1b8a3a" }}>TODOS LOS DÍAS ✓</span>)}
      {fila(256, "DEBE", entra((t - T.debe + 0.1) / 0.3), <span style={{ position: "static", font: `900 38px ${DISP}`, color: ROJO, fontVariantNumeric: "tabular-nums" }}>${vDebe.toLocaleString("es-AR")}</span>)}
      {fila(352, "PAGÓ ESTE MES", entra((t - T.b5) / 0.15), <span style={{ position: "static", font: `900 40px ${DISP}`, color: ROJO }}>$0</span>, t >= T.b4 && t < T.b5)}
    </>
  );
};

/** Globo de lo que dice el cliente (sin voz). */
const Globo: React.FC<{ t: number; desde: number; hasta: number; texto: string; top: number; izq?: boolean }> = ({ t, desde, hasta, texto, top, izq = true }) => {
  if (t < desde || t > hasta) return null;
  return (
    <div style={{ left: izq ? 18 : 90, right: izq ? 90 : 18, top, transform: `scale(${sp(t - desde, 1.15)}) rotate(${izq ? -3 : 3}deg)`, transformOrigin: izq ? "0 100%" : "100% 100%" }}>
      <span style={{ position: "static", display: "inline-block", padding: "10px 14px", borderRadius: 18, background: BLANCO, border: `3px solid ${NEGRO}`, boxShadow: "0 5px 0 #0007", font: `900 20px/1.15 ${DISP}`, color: NEGRO }}>{texto}</span>
    </div>
  );
};

export const MejorCliente: React.FC<VideoProps & { ad?: boolean }> = ({ ad = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { T, h, ids, d, total } = armar(ad);
  const LOOP = total - 0.27;
  const loop = !ad && t >= LOOP;
  const tw = loop ? 0 : t;

  let fondo: React.ReactNode, frente: React.ReactNode = null;
  if (tw < T.b2 - 0.05) {
    fondo = <><Fondo t={tw} color={NEGRO} /><Carnet t={tw} parte={entra((tw - T.parte) / 0.25)} /></>;
    frente = ad ? (
      <>
        <Golpe t={tw} desde={T.parte} texto="este cliente" top={430} size={46} />
        <Golpe t={tw} desde={T.parte + 0.25} texto="funde kioscos" top={486} size={56} color={ROJO} glitch fondo={NEGRO} />
      </>
    ) : (
      <>
        <Golpe t={tw} desde={T[h] + 0.05} texto="tu mejor cliente" top={66} size={30} />
        <Golpe t={tw} desde={T.parte} texto="te está" top={430} size={46} />
        <Golpe t={tw} desde={T.parte + 0.2} texto="fundiendo" top={486} size={72} color={ROJO} glitch fondo={NEGRO} />
      </>
    );
  } else if (tw < T.b6 - 0.05) {
    fondo = <Fondo t={tw} color={tw >= T.b5 ? ROJO : AMARILLO} />;
    frente = (
      <>
        <Ficha t={tw} T={T} />
        <Globo t={tw} desde={T.compra + 0.3} hasta={T.b4 - 0.1} texto="¡Anotámelo, que el viernes paso!" top={466} />
        {tw >= T.b4 && tw < T.b5 ? (
          <>
            <Golpe t={tw} desde={T.b4 + 0.05} texto="adiviná cuánto pagó" top={34} size={30} fondo={NEGRO} color={AMARILLO} />
            <div style={{ left: 0, right: 0, top: 478, textAlign: "center", font: `900 90px ${DISP}`, color: NEGRO, transform: `scale(${1 + 0.25 * (1 - (((tw - T.cuenta) % 0.5 + 0.5) % 0.5) / 0.5)})`, opacity: tw >= T.cuenta ? 1 : 0 }}>{Math.max(1, 3 - Math.floor(Math.max(0, tw - T.cuenta) / 0.5))}</div>
            <Chip t={tw} desde={T.b4 + d("b4") * 0.5} texto="PENSALO ANTES QUE SE DESTAPE" top={446} fondo={BLANCO} />
          </>
        ) : null}
        {tw >= T.b5 ? (
          <>
            <Golpe t={tw} desde={T.b5} texto="$0" top={440} size={130} color={BLANCO} glitch rot={-5} />
            <Globo t={tw} desde={T.b5 + 0.35} hasta={T.b6} texto="¡El viernes te paso!" top={30} izq={false} />
          </>
        ) : null}
      </>
    );
  } else if (tw < T.app) {
    const cosas = ["LA LUZ", "LA MERCADERÍA", "EL ALQUILER"];
    fondo = <Fondo t={tw} color={NEGRO} />;
    frente = (
      <>
        <Contador t={tw} desde={T.b6} de={180000} a={180000} dur={0.1} top={70} size={74} color={ROJO} />
        {cosas.map((c, i) => {
          const a = T.b6 + 0.5 + i * 0.45;
          if (tw < a) return null;
          const k = clamp((tw - a - 0.5) / 0.8, 0, 1);
          return <div key={c} style={{ left: 0, right: 0, top: 190 + i * 64 - k * 300, textAlign: "center", opacity: 1 - k, transform: `scale(${sp(tw - a, 1.12)}) rotate(${(i - 1) * 4 + k * 30}deg)` }}><span style={{ position: "static", display: "inline-block", padding: "6px 14px", borderRadius: 10, background: BLANCO, color: NEGRO, font: `900 26px ${DISP}` }}>{c}</span></div>;
        })}
        <Golpe t={tw} desde={T.b6 + d("b6") * 0.5} texto="con tu plata" top={410} size={52} color={AMARILLO} />
        <Golpe t={tw} desde={T.b6 + d("b6") * 0.7} texto="él bien. vos no." top={470} size={40} fondo={ROJO} />
      </>
    );
  } else if (tw < T.cierre) {
    fondo = (
      <>
        <Fondo t={tw} color={AMARILLO} />
        <Celular t={tw} sp={sp(tw - T.app, 1.04, 13, 0.55)} left={85} top={130}>
          <Sequence from={Math.round(T.app * fps)} layout="none">
            <OffthreadVideo src={staticFile("tomas/v8-02/app.mp4")} playbackRate={1.4} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} />
          </Sequence>
        </Celular>
      </>
    );
    frente = <Golpe t={tw} desde={T.app + 0.15} texto="quién te debe + whatsapp" top={70} size={24} fondo={NEGRO} color={AMARILLO} rot={-3} />;
  } else {
    fondo = <Fondo t={tw} color={ad ? NEGRO : ROJO} />;
    frente = ad ? (
      <>
        <Golpe t={tw} desde={T.cierre} texto="¿cuánto te" top={150} size={52} />
        <Golpe t={tw} desde={T.cierre + 0.2} texto="deben a vos?" top={210} size={52} color={AMARILLO} />
        <CtaWhatsApp t={tw} desde={T.cierre + 0.5} />
      </>
    ) : (
      <>
        <Golpe t={tw} desde={T.cierre} texto="etiquetá a tu" top={120} size={44} />
        <Golpe t={tw} desde={T.cierre + 0.2} texto="'mejor cliente'" top={176} size={50} fondo={AMARILLO} color={NEGRO} rot={-3} />
        <Chip t={tw} desde={T.cierre + 0.8} texto="¿Cuánto te debe el tuyo? 👇" top={290} />
        <div style={{ left: 0, right: 0, top: 600, textAlign: "center", font: `800 13px ${BODY}`, color: BLANCO }}>En Claro · link en el perfil</div>
      </>
    );
  }

  const hablando = ids.find((id) => tw >= T[id] && tw < T[id] + d(id) + 0.1);
  const mostrarSub = hablando && !loop && tw >= T.b2 - 0.05 && tw < T.b4 - 0.05 || (hablando && tw >= T.b6 - 0.05 && tw < T.app);

  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0.02, sfx: "ding", vol: 0.4 }, { en: T.parte, sfx: "vidrio", vol: 0.55 }, { en: T.parte + 0.02, sfx: "slam", vol: 0.6 }, { en: T.parte + 0.2, sfx: "glitch", vol: 0.4 },
    { en: T.b2 - 0.1, sfx: "whoosh", vol: 0.45 }, { en: T.b2 + 0.2, sfx: "sello", vol: 0.5 },
    { en: T.compra, sfx: "cinta", vol: 0.5 }, { en: T.compra + 0.15, sfx: "caja", vol: 0.45 }, { en: T.compra + 0.3, sfx: "papel", vol: 0.3 },
    { en: T.debe - 0.1, sfx: "cinta", vol: 0.5 }, ...Array.from({ length: 8 }, (_, i) => ({ en: T.debe + i * 0.12, sfx: "tic", vol: 0.3 })), { en: T.debe + 1, sfx: "thump", vol: 0.55 },
    { en: T.b4, sfx: "riser", vol: 0.4 }, ...[0, 0.5, 1].map((x) => ({ en: T.cuenta + x, sfx: "heart", vol: 0.5 })),
    { en: T.b5, sfx: "buzz", vol: 0.6 }, { en: T.b5 + 0.02, sfx: "slam", vol: 0.6 }, { en: T.b5 + 0.35, sfx: "papel", vol: 0.3 },
    { en: T.b6 - 0.1, sfx: "whoosh", vol: 0.45 }, ...[0, 1, 2].map((i) => ({ en: T.b6 + 0.5 + i * 0.45, sfx: "coins", vol: 0.4 })), { en: T.b6 + d("b6") * 0.7, sfx: "thump", vol: 0.5 },
    { en: T.app, sfx: "whoosh", vol: 0.4 }, { en: T.app + 0.4, sfx: "click", vol: 0.4 }, { en: T.app + 1.6, sfx: "ding", vol: 0.45 },
    { en: T.cierre, sfx: "whoosh", vol: 0.45 }, { en: T.cierre + 0.05, sfx: "slam", vol: 0.45 },
  ];
  const musica = (
    <>
      <Voces carpeta="tt-07" T={T} ids={ids} fps={fps} />
      <Pulso fps={fps} fin={total} silencios={[[T.cuenta, T.b5 + 0.4]]} vol={0.09} />
    </>
  );

  const beats = [0.02, T.parte, T.parte + 0.2, T.b2, T.b2 + 0.2, T.compra, T.debe, T.debe + 1, T.b4, T.b5, T.b6, T.b6 + 0.5, T.b6 + 0.95, T.b6 + 1.4, T.app, T.cierre];
  const cam: Cam2D = camaraBeats(tw, loop ? [] : beats, loop ? [] : [T.b2 - 0.05, T.b6 - 0.05, T.app, T.cierre], 1);
  const hs = loop ? 0 : temblor(t, [[T.parte, 16], [T.debe + 1, 8], [T.b5, 20], [T.cierre, 8]]);
  let wf = 0;
  if (!loop) [[0.02, 0.2], [T.parte, 0.4], [T.b5, 0.5], [T.cierre, 0.25]].forEach(([a, f]) => { const dd = t - a; if (dd >= 0 && dd < 0.15) wf += f * (1 - dd / 0.15); });

  return (
    <Marco
      g={g} voz={null} pal={[]} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={loop ? [] : sonidos} ocultos={[]}
      fondo={fondo}
      frente={<>{frente}<Flash t={tw} en={T.b5} fuerza={0.6} />{mostrarSub ? <Sub texto={TXT[hablando as string]} top={560} /> : null}</>}
      sobre={musica}
    />
  );
};
