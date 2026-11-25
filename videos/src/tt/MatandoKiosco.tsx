import React from "react";
import { OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/anim";
import { BODY } from "../lib/fuentes";
import { guionSchema } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Celular, Marco, camaraBeats, temblor, type Cam2D } from "../v6/comun";
import { entra, sp } from "../v8/comun";
import dialogo from "../../public/voces/tt-06/dialogo.json";
import { AMARILLO, BLANCO, Chip, Contador, CtaWhatsApp, Flash, Fondo, Golpe, Monitor, NEGRO, Pulso, ROJO, Sub, Tacha, Voces, bips, lineaDeVoz } from "./motion";

// TT-06 "Estás matando a tu kiosco" (videos/guiones/TT-06-MATANDO-KIOSCO.md). Motion graphics 2D: tipografía cinética,
// glitch y un monitor cardíaco que baja con cada "forma" hasta la línea plana; desfibrilador = la app. Voz: Charon (gurú de negocios).
// Dos versiones: TikTok (comentá el número) y anuncio (gancho para Meta + "Escribime por WhatsApp").

const g = guionSchema.parse({ id: "tt-06", titulo: "Estás matando a tu kiosco", duracionSeg: 30, voz: null, ganchos: [{ lineas: ["", "", ""], voz: "" }], lineas: [], sonidos: [] });
const FR = dialogo.frases as Record<string, { dur: number }>;
const TXT: Record<string, string> = {
  a1: "Estás matando a tu kiosco.", a1ad: "Así se están muriendo los kioscos.", a2: "Y lo hacés de 3 formas. Contá cuántas hacés vos.",
  a3: "Tres: contás la caja y creés que ganaste. Lo que entró no es lo que te quedó.", a4: "Dos: el proveedor te aumentó, y vos seguís cobrando el precio viejo.",
  a5: "Y la uno… es la que te mata.", a6: "No saber cuánto te quedó. Así se funden sin darse cuenta.", a7: "Le hablás 20 segundos al celular y sabés el número todas las noches.",
  a8ad: "Escribime por WhatsApp y te muestro cómo.",
};

export function armar(ad: boolean) {
  const ids = [ad ? "a1ad" : "a1", "a2", "a3", "a4", "a5", "a6", "a7", ...(ad ? ["a8ad"] : [])];
  const { T, fin, d } = lineaDeVoz(FR, ids, { a5: 0.25, a6: 0.7, a7: 0.25 });
  const h = ad ? "a1ad" : "a1";
  const X = {
    ...T,
    w1: -0.12, w2: T[h] + d(h) * 0.3, w3: T[h] + d(h) * 0.62,
    plano: T.a6 + d("a6") * 0.35, negro: T.a6 + d("a6") + 0.05, revive: T.a7 - 0.05,
    app: T.a7 + 0.35, cierre: ad ? T.a8ad - 0.1 : T.a7 + d("a7") + 0.25,
  };
  const total = ad ? fin + 1.4 : X.cierre + 2.6;
  return { T: X as Record<string, number>, h, ids, d, total };
}
export const durTT06 = (ad: boolean) => armar(ad).total;

export const MatandoKiosco: React.FC<VideoProps & { ad?: boolean }> = ({ ad = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { T, h, ids, d, total } = armar(ad);
  const LOOP = total - 0.27;
  const loop = !ad && t >= LOOP;
  const tw = loop ? 0 : t;
  const freeze = tw >= T.a5 - 0.05 && tw < T.a6 - 0.05;
  const negro = tw >= T.negro && tw < T.revive;
  const pulso = tw < T.a3 ? 92 : tw < T.a4 ? 74 : tw < T.a6 ? 118 : tw >= T.revive ? 84 : 118;

  // ---------- escenas ----------
  let fondo: React.ReactNode, frente: React.ReactNode = null;
  if (tw < T.a3 - 0.05) {
    fondo = <><Fondo t={tw} color={NEGRO} /><Monitor t={tw} pulso={pulso} top={420} /></>;
    frente = tw < T.a2 - 0.05 ? (
      ad ? (
        <>
          <Golpe t={tw} desde={T.w1} texto="así se están" top={120} size={40} />
          <Golpe t={tw} desde={T.w2} texto="muriendo" top={182} size={58} color={ROJO} glitch />
          <Golpe t={tw} desde={T.w3} texto="los kioscos" top={276} size={50} fondo={AMARILLO} color={NEGRO} rot={-3} />
        </>
      ) : (
        <>
          <Golpe t={tw} desde={T.w1} texto="estás" top={110} size={54} />
          <Golpe t={tw} desde={T.w2} texto="matando" top={172} size={76} color={ROJO} glitch />
          <Golpe t={tw} desde={T.w3} texto="a tu kiosco" top={282} size={52} fondo={AMARILLO} color={NEGRO} rot={-3} />
        </>
      )
    ) : (
      <>
        <Golpe t={tw} desde={T.a2 + 0.05} texto={String(Math.min(3, 1 + Math.floor(clamp((tw - T.a2) / 0.5, 0, 1) * 2.99)))} top={90} size={190} color={AMARILLO} />
        <Golpe t={tw} desde={T.a2 + 0.45} texto="formas" top={290} size={56} />
        <Chip t={tw} desde={T.a2 + d("a2") * 0.55} texto="¿CUÁNTAS HACÉS VOS?" top={360} fondo={ROJO} color={BLANCO} />
      </>
    );
  } else if (tw < T.a4 - 0.05) {
    const k = T.a3 + d("a3") * 0.45;
    fondo = <><Fondo t={tw} color={AMARILLO} /><div style={{ left: 0, top: 470, width: 360, height: 120, background: NEGRO, opacity: 0.9 }} /><Monitor t={tw} pulso={pulso} top={475} alto={100} /></>;
    frente = (
      <>
        <Chip t={tw} desde={T.a3} texto="FORMA #3" top={40} fondo={NEGRO} color={AMARILLO} size={22} />
        <Golpe t={tw} desde={T.a3 + 0.1} texto="contás la caja" top={96} size={40} color={NEGRO} />
        <Golpe t={tw} desde={T.a3 + 0.45} texto="= ganancia" top={156} size={58} color={NEGRO} />
        <Tacha t={tw} desde={k - 0.1} top={182} ancho={300} />
        <Contador t={tw} desde={k} de={300000} a={90000} dur={1.1} top={250} size={78} color={NEGRO} />
        <Chip t={tw} desde={k + 1.1} texto="LO QUE ENTRÓ ≠ LO QUE TE QUEDÓ" top={350} fondo={ROJO} color={BLANCO} size={16} />
      </>
    );
  } else if (tw < T.a5 - 0.05 || freeze) {
    const rompe = T.a4 + d("a4") * 0.62;
    const hielo = 1 - entra((tw - rompe) / 0.25);
    fondo = <><Fondo t={tw} color={ROJO} /><div style={{ left: 0, top: 470, width: 360, height: 120, background: NEGRO, opacity: 0.9 }} /><Monitor t={tw} pulso={pulso} top={475} alto={100} /></>;
    frente = (
      <>
        <Chip t={tw} desde={T.a4} texto="FORMA #2" top={40} fondo={NEGRO} color={AMARILLO} size={22} />
        <Golpe t={tw} desde={T.a4 + 0.1} texto="precio viejo" top={110} size={66} color={BLANCO} />
        {tw >= T.a4 + 0.3 && hielo > 0 ? <div style={{ left: 30, right: 30, top: 100, height: 90, borderRadius: 10, background: "linear-gradient(135deg, #dff6ffcc, #9fd8ffaa, #ffffffcc)", opacity: hielo * 0.85, transform: `scale(${1 + (1 - hielo) * 0.3})` }} /> : null}
        {tw >= rompe ? Array.from({ length: 14 }, (_, i) => {
          const k = clamp((tw - rompe) / 0.7, 0, 1);
          return <div key={i} style={{ left: 40 + (i % 7) * 42 + (i % 2 ? 1 : -1) * k * 60, top: 110 + Math.floor(i / 7) * 40 + k * (120 + i * 8), width: 30, height: 22, background: "#dff6ff", opacity: 1 - k, transform: `rotate(${k * 300 * (i % 2 ? 1 : -1)}deg)` }} />;
        }) : null}
        <Golpe t={tw} desde={rompe + 0.15} texto="+7%" top={230} size={110} color={AMARILLO} glitch rot={-6} />
        <Chip t={tw} desde={rompe + 0.5} texto="EL PROVEEDOR YA TE AUMENTÓ" top={360} fondo={NEGRO} color={BLANCO} size={16} />
        {freeze ? (
          <>
            <div style={{ inset: 0, background: "#000", opacity: 0.96 }} />
            <Golpe t={tw} desde={T.a5 + 0.05} texto="la #1" top={170} size={90} color={AMARILLO} />
            <Golpe t={tw} desde={T.a5 + d("a5") * 0.55} texto="te mata" top={270} size={80} color={ROJO} glitch />
          </>
        ) : null}
      </>
    );
  } else if (tw < T.revive) {
    fondo = <><Fondo t={tw} color={NEGRO} rayas={false} /><Monitor t={tw} pulso={pulso} top={420} plano={T.plano} /></>;
    frente = (
      <>
        <Chip t={tw} desde={T.a6} texto="FORMA #1" top={40} fondo={ROJO} color={BLANCO} size={22} />
        <Golpe t={tw} desde={T.a6 + 0.05} texto="no sabés" top={110} size={70} tiembla={2} />
        <Golpe t={tw} desde={T.a6 + 0.3} texto="cuánto" top={190} size={70} tiembla={2} />
        <Golpe t={tw} desde={T.a6 + 0.55} texto="te quedó" top={270} size={70} color={ROJO} glitch tiembla={2} />
        {negro ? <div style={{ inset: 0, background: "#000" }} /> : null}
      </>
    );
  } else if (tw < T.cierre) {
    fondo = (
      <>
        <Fondo t={tw} color={NEGRO} />
        <Monitor t={tw} pulso={pulso} top={40} alto={80} />
        <Celular t={tw} sp={sp(tw - T.app, 1.04, 13, 0.55)} left={85} top={150}>
          <Sequence from={Math.round(T.app * fps)} layout="none">
            <OffthreadVideo src={staticFile("tomas/fb-01/app.mp4")} startFrom={Math.round(9.6 * 30)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} />
          </Sequence>
        </Celular>
      </>
    );
    frente = (
      <>
        <Golpe t={tw} desde={T.revive + 0.2} texto="20 segundos" top={118} size={30} fondo={AMARILLO} color={NEGRO} rot={-4} />
      </>
    );
  } else {
    fondo = <><Fondo t={tw} color={ad ? NEGRO : ROJO} /><Monitor t={tw} pulso={84} top={ad ? 40 : 470} alto={ad ? 80 : 110} /></>;
    frente = ad ? (
      <>
        <Golpe t={tw} desde={T.cierre} texto="¿cuánto te" top={150} size={52} />
        <Golpe t={tw} desde={T.cierre + 0.2} texto="quedó hoy?" top={210} size={52} color={AMARILLO} />
        <CtaWhatsApp t={tw} desde={T.cierre + 0.5} />
      </>
    ) : (
      <>
        <Golpe t={tw} desde={T.cierre} texto="¿cuántas hacés?" top={120} size={38} />
        <Golpe t={tw} desde={T.cierre + 0.25} texto="comentá el número" top={196} size={32} fondo={NEGRO} color={AMARILLO} rot={-2} />
        <Chip t={tw} desde={T.cierre + 0.8} texto="Mandáselo al que hace las 3" top={290} />
        <div style={{ left: 0, right: 0, top: 600, textAlign: "center", font: `800 13px ${BODY}`, color: BLANCO }}>En Claro · link en el perfil</div>
      </>
    );
  }

  const hablando = ids.find((id) => tw >= T[id] && tw < T[id] + d(id) + 0.1);
  const mostrarSub = hablando && !loop && tw >= T.a2 - 0.05 && !(tw >= T.cierre && ad);

  // ---------- sonido ----------
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: T.w1, sfx: "thump", vol: 0.6 }, { en: T.w2, sfx: "slam", vol: 0.6 }, { en: T.w2 + 0.02, sfx: "glitch", vol: 0.45 }, { en: T.w3, sfx: "thump", vol: 0.5 },
    ...bips(0.3, T.a3, 92, 0.22), ...bips(T.a3, T.a4, 74, 0.22), ...bips(T.a4, T.a5, 118, 0.28), ...bips(T.a6, T.plano, 118, 0.3),
    { en: T.plano, sfx: "flatline", vol: 0.55 },
    { en: T.a2, sfx: "whoosh", vol: 0.4 }, ...[0, 0.25].map((x) => ({ en: T.a2 + x, sfx: "tic", vol: 0.4 })),
    { en: T.a3 - 0.1, sfx: "whoosh", vol: 0.45 }, { en: T.a3 + d("a3") * 0.45 - 0.1, sfx: "rayon", vol: 0.45 }, { en: T.a3 + d("a3") * 0.45, sfx: "coins", vol: 0.4 },
    { en: T.a4 - 0.1, sfx: "whoosh", vol: 0.45 }, { en: T.a4 + d("a4") * 0.62, sfx: "vidrio", vol: 0.6 }, { en: T.a4 + d("a4") * 0.62 + 0.15, sfx: "slam", vol: 0.5 },
    { en: T.a5, sfx: "rebobinado", vol: 0.5 }, { en: T.a5 + d("a5") * 0.55, sfx: "piano_grave", vol: 0.55 },
    { en: T.a6, sfx: "thump", vol: 0.5 }, { en: T.a6 + 0.55, sfx: "glitch", vol: 0.4 },
    { en: T.revive - 0.9, sfx: "desfibrilador", vol: 0.6 }, { en: T.revive, sfx: "slam", vol: 0.55 }, ...bips(T.revive + 0.2, T.cierre, 84, 0.2),
    { en: T.app, sfx: "click", vol: 0.4 }, { en: T.cierre, sfx: "whoosh", vol: 0.45 }, { en: T.cierre + 0.05, sfx: "slam", vol: 0.45 },
  ].filter((s) => s.en >= 0);
  const musica = (
    <>
      <Voces carpeta="tt-06" T={T} ids={ids} fps={fps} />
      <Pulso fps={fps} fin={total} silencios={[[T.a5 - 0.05, T.a6], [T.plano, T.revive]]} vol={0.09} />
    </>
  );

  const beats = [0.02, T.w2, T.w3, T.a2, T.a2 + 0.45, T.a3, T.a3 + 0.45, T.a3 + d("a3") * 0.45, T.a4, T.a4 + d("a4") * 0.62, T.a6, T.a6 + 0.3, T.a6 + 0.55, T.revive, T.app, T.cierre];
  const cam: Cam2D = freeze ? { z: 1.05, rot: -2, tx: 0, ty: 0, blur: 0 } : negro ? { z: 1, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : beats, loop ? [] : [T.a3 - 0.05, T.a4 - 0.05, T.a6 - 0.05, T.revive, T.cierre], 1);
  const hs = loop ? 0 : temblor(t, [[T.w2, 16], [T.w3, 8], [T.a4 + d("a4") * 0.62, 12], [T.a6 + 0.55, 10], [T.revive, 18], [T.cierre, 8]]);
  let wf = 0;
  if (!loop) [[0.02, 0.2], [T.w2, 0.35], [T.revive, 0.9], [T.cierre, 0.25]].forEach(([a, f]) => { const dd = t - a; if (dd >= 0 && dd < 0.15) wf += f * (1 - dd / 0.15); });

  return (
    <Marco
      g={g} voz={null} pal={[]} cam={cam} hs={hs} wf={wf} red={0} frame={frame} t={t} sonidos={loop ? [] : sonidos} ocultos={[]}
      fondo={fondo}
      frente={<>{frente}<Flash t={tw} en={T.revive} /><>{mostrarSub ? <Sub texto={TXT[hablando as string]} top={600 - 40} /> : null}</></>}
      sobre={musica}
      filtro={freeze ? "saturate(0.15) contrast(1.15)" : undefined}
    />
  );
};
