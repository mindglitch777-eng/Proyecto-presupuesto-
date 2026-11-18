import React from "react";
import { Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, rnd } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { GUION_V8_02, palabrasDeRespaldo, type Palabra } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, W, camaraBeats, lineasDeVoz, temblor, type Cam2D } from "../v6/comun";
import { AppGrabada, Cartel, Etiqueta, Fondo, Foto, Numero, Probalo, Rotulo, aPantalla, entra, latido, sp, valorPasos } from "./comun";
import { Burbuja, C, Clienta, Cuaderno, CuadernoCerrado, Kiosco, Recibo } from "./iconos";

// V8-02 "El cuaderno de los $380.000" (videos/guiones/V8-02-EL-CUADERNO.md). Explicador financiero: el número DEUDA es el protagonista.
// Máximo 2 textos a la vez + subtítulo (en la ráfaga de excusas el subtítulo se esconde: las burbujas ya dicen lo mismo).

const g = GUION_V8_02;
const RENGLONES: [string, string][] = [["Marta", "$62.000"], ["Carlos", "$54.000"], ["Juan", "$48.000"], ["Rosa", "$41.500"], ["Beto", "$39.000"], ["Nélida", "$36.500"], ["Hugo", "$33.000"], ["Sandra", "$29.000"], ["Pocho", "$21.000"]];
const EXCUSAS = ["Te lo traigo el viernes", "Se me rompió el celular", "Pasa mi hermano"];
const DEUDAS = [48000, 96500, 155000];
const TOTAL = 380000;
// grabación real de la app (app/scripts/grabar-v8.cjs v8-02 → public/tomas/v8-02/app.json)
const APP = { mensaje: 1.594, pago: 4.966, fin: 7.573 };
const RATE = 1.2;
// Silencio medido en la toma de voz (silencedetect): la palabra "Trescientos" arranca en 16,53 s (whisper la marca 0,4 s antes).
const REVELA_MEDIDO: [number, number] = [39.25, 16.53];

function tiempos(pal: Palabra[], dur: number) {
  const { l, e } = lineasDeVoz(g, pal);
  const w = W(g, pal);
  const T = {
    l, e, dur,
    exc: [w(1, "te", l[1]), w(1, "se", l[1] + 1.5), w(1, "pasa", l[1] + 3.3)],
    mas: w(3, "más", l[3] + 0.9), viene: w(3, "viene", l[3] + 1.1), todos: w(3, "todos", l[3] + 2), lleno: w(3, "lleno", e[3] - 0.4),
    revela: Math.abs(dur - REVELA_MEDIDO[0]) < 0.05 ? REVELA_MEDIDO[1] : l[4],
    mil: w(4, "mil", e[4] - 0.4),
    alquiler: w(5, "alquiler", l[5] + 1), fiado: w(5, "fiado", e[5] - 0.5),
    rojo: w(6, "rojo", l[6] + 2), cobrar: w(6, "cobrar", l[6] + 3), mensaje: w(6, "mensaje", l[6] + 5.4), whatsapp: w(6, "whatsapp", e[6] - 0.5),
    cuanto: l[7], contalo: w(7, "contalo", l[7] + 2.2), probalo: w(7, "probalo", l[7] + 3.8),
    LOOP: dur - 0.27,
    app0: 0,
  };
  T.app0 = T.mensaje - APP.mensaje / RATE;
  return T;
}
type T = ReturnType<typeof tiempos>;
const enApp = (T: T, s: number) => T.app0 + s / RATE;

type Esc = "gancho" | "excusas" | "debe" | "viene" | "silencio" | "revela" | "alquiler" | "truco" | "cierre";
function escena(t: number, T: T): Esc {
  if (t >= T.LOOP) return "gancho";
  const { l } = T;
  if (t < l[1] - 0.05) return "gancho";
  if (t < l[2] - 0.05) return "excusas";
  if (t < T.mas - 0.05) return "debe";
  if (t < T.lleno + 0.35) return "viene";
  if (t < T.revela - 0.03) return "silencio";
  if (t < l[5] - 0.05) return "revela";
  if (t < l[6] - 0.05) return "alquiler";
  if (t < T.contalo - 0.1) return "truco";
  return "cierre";
}

/** DEUDA arriba: sube con cada excusa. */
const pasosDeuda = (T: T) => DEUDAS.map((a, i) => ({ en: T.exc[i] + 0.15, a }));

/** Cuadro 0 (y el último): de noche, el kiosco atrás y el cuaderno que se abre de golpe; "$???.???" latiendo. */
const Gancho: React.FC<{ tg: number }> = ({ tg }) => {
  const abre = entra(tg / 0.28);
  const golpe = (1 + 0.14 * Math.exp(-7 * tg) * Math.cos(tg * 22)) * latido(tg, 0.62, 0.04);
  return (
    <div style={{ inset: 0 }}>
      <div style={{ left: 30, top: 226, filter: "brightness(0.8) saturate(0.9)", transform: `scale(${1 + tg * 0.02})`, transformOrigin: "50% 100%" }}><Kiosco w={300} t={tg} /></div>
      <div style={{ left: 0, right: 0, top: 226, height: 290, background: "radial-gradient(circle at 50% 40%, #ffd76a22, transparent 70%)" }} />
      <div style={{ left: 58, top: 372, transform: `scale(${(1.02 + tg * 0.03) * golpe}) rotate(${-4 + Math.sin(tg * 1.7) * 0.8}deg)`, transformOrigin: "50% 60%" }}>
        <Cuaderno w={244} t={tg} renglones={RENGLONES.slice(1)} />
        {/* la tapa gira sobre el lomo y deja ver las hojas */}
        <div style={{ left: 116, top: -5, transform: `perspective(700px) rotateY(${-abre * 178}deg)`, transformOrigin: "6px 50%", opacity: abre > 0.55 ? 0 : 1 }}>
          <CuadernoCerrado w={128} />
        </div>
      </div>
      <Cartel texto="TU CUADERNO DE FIADOS" top={92} fondo={C.verde} color={C.ambar} size={24} s={Math.min(1.08, 0.8 + sp(tg + 0.1) * 0.2) * latido(tg + 0.2, 0.62, 0.03)} rot={-2 + Math.sin(tg * 4) * 1.2} />
      <Numero t={tg} v={0} tapado top={150} size={70} color={C.rojo} />
    </div>
  );
};

/** La lista del cuaderno con el renglón de arriba tapado con corrector (`raspado` 0 → 1 lo destapa). */
const Lista: React.FC<{ t: number; raspado: number; top: number; escala?: number }> = ({ t, raspado, top, escala = 1 }) => (
  <div style={{ left: 20, top, transform: `scale(${escala}) rotate(${-1.5 + Math.sin(t * 1.2) * 0.6}deg)`, transformOrigin: "50% 0" }}>
    <Cuaderno w={320} t={t} renglones={RENGLONES} tachado={raspado} />
    {/* virutas del corrector cuando se raspa */}
    {raspado > 0 && raspado < 1
      ? Array.from({ length: 8 }, (_, i) => {
          const d = (raspado * 6 + i * 0.13) % 1;
          return <div key={i} style={{ left: 60 + raspado * 220 + rnd(i) * 30, top: 22 + d * 40, width: 6, height: 4, borderRadius: 2, background: "#fff", border: "1px solid #c9c9c4", opacity: 1 - d }} />;
        })
      : null}
  </div>
);

export const ElCuaderno: React.FC<VideoProps> = ({ voz, palabras }) => {
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
  const tPago = enApp(T, APP.pago);

  const beats = [0.03, ...T.exc, T.mas, T.viene, T.todos, T.revela, T.mil, T.alquiler, T.fiado, T.rojo, T.mensaje, tPago, T.probalo];
  const cortes = [l[1], l[2], T.mas, T.revela, l[5], l[6], T.contalo];
  const enSilencio = esc === "silencio";
  const cam: Cam2D = enSilencio ? { z: 1.03 + (t - T.lleno) * 0.08, rot: 0, tx: 0, ty: 0, blur: 0 } : camaraBeats(tw, loop ? [] : beats, loop ? [] : cortes, 0.75);
  const hs = loop ? 0 : temblor(t, [[0.03, 9], ...T.exc.map((a) => [a + 0.15, 4] as [number, number]), [T.mil, 12], [T.fiado, 7]]);
  let wf = 0, red = 0;
  if (!loop) {
    [[T.revela, 0.35], [T.mil, 0.4]].forEach(([a, f]) => { const d = t - a; if (d >= 0 && d < 0.15) wf += f * (1 - d / 0.15); });
    if (esc === "revela") red = 0.1;
  }

  // ---------- sonido ----------
  const visitas = Array.from({ length: 9 }, (_, i) => T.todos + 2.0 * (1 - Math.pow(0.8, i)) * 1.9);
  const sonidos: { en: number; sfx: string; vol?: number }[] = [
    { en: 0, sfx: "thump" }, { en: 0, sfx: "hoja", vol: 0.6 }, { en: 0, sfx: "calle", vol: 0.4 },
    ...T.exc.flatMap((a) => [{ en: a - 0.02, sfx: "tic", vol: 0.7 }, { en: a + 0.55, sfx: "click", vol: 0.5 }]),
    ...cortes.map((a) => ({ en: a - 0.1, sfx: "whoosh", vol: 0.3 })),
    { en: l[2], sfx: "heart", vol: 0.55 }, { en: l[2] + 0.6, sfx: "heart", vol: 0.55 }, { en: l[2] + 0.02, sfx: "papel", vol: 0.4 },
    { en: T.mas - 0.05, sfx: "papel_arrancado", vol: 0.5 },
    ...visitas.map((a) => ({ en: a, sfx: "ding", vol: 0.28 })),
    { en: T.revela, sfx: "thump", vol: 0.5 }, { en: T.mil, sfx: "slam", vol: 0.5 }, { en: T.mil + 0.02, sfx: "thump", vol: 0.6 },
    ...Array.from({ length: Math.max(0, Math.floor((l[5] - T.mil - 0.3) / 0.6)) }, (_, i) => ({ en: T.mil + 0.45 + i * 0.6, sfx: "heart", vol: 0.5 })),
    { en: l[5] + 0.1, sfx: "riser", vol: 0.3 }, { en: T.alquiler + 0.5, sfx: "thump", vol: 0.5 }, { en: T.fiado - 0.02, sfx: "sello", vol: 0.6 },
    { en: T.rojo, sfx: "marcador", vol: 0.45 }, { en: enApp(T, APP.mensaje) - 0.3, sfx: "click", vol: 0.5 }, { en: T.mensaje + 0.1, sfx: "ding", vol: 0.4 },
    { en: tPago - 0.2, sfx: "click", vol: 0.45 }, { en: tPago, sfx: "ding", vol: 0.5 }, { en: tPago + 0.15, sfx: "coins", vol: 0.35 },
    { en: T.contalo - 0.1, sfx: "hoja", vol: 0.5 }, { en: T.probalo, sfx: "click", vol: 0.5 },
    { en: T.LOOP - 0.12, sfx: "whoosh", vol: 0.35 }, { en: T.LOOP, sfx: "thump", vol: 0.45 },
  ].filter((s) => !(s.en > T.lleno + 0.4 && s.en < T.revela - 0.05));

  const musica = (
    <>
      <Sequence from={0} durationInFrames={Math.max(1, Math.round((T.lleno + 0.4) * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.12 * Math.min(1, Math.max(0, (T.lleno + 0.4) * fps - f) / 4)} />
      </Sequence>
      <Sequence from={Math.round(l[5] * fps)} durationInFrames={Math.max(1, durationInFrames - Math.round(l[5] * fps))} layout="none">
        <Html5Audio src={staticFile("sfx/pulso.wav")} volume={(f) => 0.12 * Math.min(1, f / 6)} />
      </Sequence>
    </>
  );

  const deuda = valorPasos(t, 0, pasosDeuda(T));
  const raspado = clamp((t - T.mas) / Math.max(0.3, T.viene - T.mas + 0.15), 0, 1);
  const fondoModo = esc === "gancho" ? "noche" : esc === "silencio" || esc === "revela" ? "negro" : esc === "truco" ? "verde" : "papel";
  // posiciones en la pantalla del celular (px CSS de la grabación → pantalla)
  const filaMarta = aPantalla(12, 330, 336, 176);
  const mensaje = aPantalla(12, 576, 336, 110);
  const totalApp = aPantalla(12, 78, 336, 172);

  return (
    <Marco
      g={g} voz={voz} pal={pal} cam={cam} hs={hs} wf={wf} red={red} frame={frame} t={t} sonidos={sonidos}
      ocultos={[[-1, e[0] + 0.1], [l[1] - 0.1, l[2] - 0.05], [T.lleno + 0.3, T.revela + 0.05], [l[5] - 0.05, l[6] - 0.05], [T.LOOP - 0.01, 999]]}
      fondo={<Fondo t={t} modo={fondoModo} />}
      frente={
        <>
          {esc === "gancho" ? <Gancho tg={loop ? 0 : t} /> : null}

          {esc === "excusas" ? (
            <>
              <Etiqueta texto="DEUDA" top={84} fondo={C.rojo} />
              <Numero t={t} v={deuda} pasos={pasosDeuda(T)} top={112} size={62} color={C.rojo} />
              {EXCUSAS.map((x, i) => {
                const a = T.exc[i];
                if (t < a - 0.05) return null;
                const s = sp(t - a, 1.08, 16, 0.48);
                const edad = T.exc.filter((b) => t >= b - 0.05).length - 1 - i; // 0 = la última
                if (edad > 1) return null;
                const lado = i % 2 ? 1 : -1;
                return (
                  <div key={i} style={{ left: i % 2 ? 84 : 26, top: 214 + (edad === 0 ? 92 : 0) + Math.sin(t * 2.4 + i) * 2, opacity: (edad === 0 ? 1 : 0.42) * Math.min(1, s * 1.4), transform: `translateX(${(1 - Math.min(1, s)) * lado * 300}px) scale(${(edad === 0 ? 1 : 0.86) * (0.9 + 0.1 * s)}) rotate(${lado * -1.5}deg)` }}>
                    <Burbuja texto={x} mia={i === 1} ancho={250} />
                  </div>
                );
              })}
              <Foto t={t} desde={l[1] + 0.05} src="tomas/v8-01/recorte-cuaderno.jpg" left={36} top={384} w={170} h={92} rot={-3} />
              <div style={{ left: 214, top: 414, transform: `rotate(5deg) translateY(${Math.cos(t * 1.4) * 3}px)`, font: `700 15px ${BODY}`, color: C.tinta, opacity: 0.75 }}>(ejemplo)</div>
            </>
          ) : null}

          {esc === "debe" ? (
            <>
              <Cartel texto="¿Y LA QUE MÁS DEBE?" top={86} s={sp(t - l[2], 1.06) * latido(t - l[2], 0.5, 0.06)} rot={Math.sin(t * 5) * 1.5} size={26} />
              <Lista t={t} raspado={0} top={168} />
              <div style={{ left: 18, top: 176, font: `800 40px ${DISP}`, color: C.rojo, transform: `rotate(-12deg) scale(${latido(t, 0.5, 0.12)})` }}>?</div>
            </>
          ) : null}

          {esc === "viene" ? (
            t < T.todos - 0.05 ? (
              <>
                <Rotulo t={t} desde={T.viene} texto="Marta · $62.000 (ejemplo)" top={94} size={20} />
                <Lista t={t} raspado={raspado} top={168} />
                {t > T.viene ? <div style={{ left: 30, top: 172, width: 300, height: 34, borderRadius: 10, border: `3px solid ${C.rojo}`, opacity: entra((t - T.viene) / 0.2), transform: `rotate(-2deg) scale(${latido(t - T.viene, 0.5, 0.04)})` }} /> : null}
              </>
            ) : (
              <>
                <Rotulo t={t} desde={T.todos - 0.05} texto="Marta · $62.000 (ejemplo)" top={94} size={20} />
                {(() => {
                  const n = Math.min(26, Math.floor(26 * clamp((t - T.todos) / Math.max(0.5, T.lleno - T.todos), 0, 1)));
                  return (
                    <>
                      <Etiqueta texto="VISITAS ESTE MES" top={142} fondo={C.verde} />
                      <div style={{ left: 0, right: 0, top: 170, textAlign: "center", font: `800 64px/1 ${DISP}`, color: C.verde, transform: `scale(${latido(t, 0.3, 0.06)})` }}>{n}</div>
                    </>
                  );
                })()}
                <div style={{ left: 40, top: 262 }}><Kiosco w={280} t={t} /></div>
                {/* Marta entra y sale una y otra vez, cada vez más rápido */}
                {(() => {
                  const k = clamp((t - T.todos) / Math.max(0.5, T.lleno + 0.35 - T.todos), 0, 1);
                  const ciclo = (k * 4.5) % 1;
                  return (
                    <div style={{ left: 230 + ciclo * 20, top: 340 + ciclo * 10, opacity: ciclo < 0.85 ? 1 : (1 - ciclo) / 0.15, transform: `scale(${1 - ciclo * 0.35})`, transformOrigin: "50% 100%" }}>
                      <Clienta w={74} paso={t * 16} />
                    </div>
                  );
                })()}
              </>
            )
          ) : null}

          {esc === "silencio" ? <Numero t={t} v={0} tapado top={262} size={66} color={C.rosa} /> : null}

          {esc === "revela" ? (
            <>
              <div style={{ inset: 0, background: `radial-gradient(circle at 50% 44%, ${C.rojo}33 0%, transparent 55%)`, opacity: 0.6 + 0.4 * Math.abs(Math.sin(t * 5)) }} />
              <div style={{ inset: 0, transform: `scale(${latido(t - T.mil, 0.6, 0.06)})`, transformOrigin: "50% 45%" }}>
                <Numero t={t} v={valorPasos(t, 0, [{ en: T.revela, a: TOTAL }], Math.max(0.4, T.mil - T.revela + 0.1))} pasos={[{ en: T.revela, a: TOTAL }]} dur={Math.max(0.4, T.mil - T.revela + 0.1)} top={256} size={66} color="#ff6b5e" />
              </div>
              <Rotulo t={t} desde={T.mil + 0.1} texto="fiado en el cuaderno (ejemplo)" top={348} />
              <div style={{ left: 142, top: 150, opacity: 0.9, transform: `rotate(-6deg) scale(${sp(t - T.revela, 1.05) * 0.95})` }}><CuadernoCerrado w={76} /></div>
            </>
          ) : null}

          {esc === "alquiler" ? <Comparacion t={t} T={T} /> : null}

          {esc === "truco" ? (
            <>
              <div style={{ left: 0, right: 0, top: 70, textAlign: "center", transform: `scale(${sp(t - l[6], 1.06)})` }}>
                <span style={{ position: "static", font: `800 15px ${BODY}`, color: "#ffffffcc", letterSpacing: ".06em" }}>TE DEBEN</span>
              </div>
              <Numero t={t} v={valorPasos(t, TOTAL, [{ en: tPago, a: TOTAL - 62000 }])} pasos={[{ en: tPago, a: TOTAL - 62000 }]} top={88} size={34} color={t > tPago ? "#7cf2a8" : "#fff"} />
              <AppGrabada t={t} carpeta="tomas/v8-02" app0={T.app0} rate={RATE} durGrab={APP.fin} entrada={l[6] - 0.05} top={136}
                zoom={1 + 0.12 * entra((t - T.rojo) / 0.3) - 0.12 * entra((t - tPago + 0.3) / 0.3)} zoomY="45%"
                aros={[
                  { desde: T.rojo, hasta: T.mensaje - 0.15, ...filaMarta, color: C.rojo },
                  { desde: T.mensaje + 0.05, hasta: tPago - 0.3, ...mensaje },
                  { desde: tPago, ...totalApp, color: "#7cf2a8" },
                ]} />
            </>
          ) : null}

          {esc === "cierre" ? (
            <>
              <div style={{ left: 20, top: 250, transform: `scale(${1.02 + (t - T.contalo) * 0.03}) rotate(-3deg)`, transformOrigin: "50% 60%" }}>
                <Cuaderno w={320} t={t} renglones={RENGLONES.slice(1)} />
              </div>
              <Numero t={t} v={0} tapado top={128} size={66} color={C.rojo} />
              {t >= T.probalo - 0.1 ? <Probalo s={sp(t - (T.probalo - 0.1), 1.05, 15, 0.45) * latido(t - T.probalo, 0.6, 0.05)} top={206} /> : <Cartel texto="¿CUÁNTO TENÉS VOS?" top={212} fondo={C.verde} color={C.ambar} size={24} s={sp(t - T.contalo, 1.06)} rot={-2 + Math.sin(t * 4) * 1.2} />}
            </>
          ) : null}
        </>
      }
      sobre={musica}
    />
  );
};

/** Pantalla partida: lo que está fiado contra un mes de alquiler (la barra llega al 84%). */
const Comparacion: React.FC<{ t: number; T: T }> = ({ t, T }) => {
  const a = T.l[5];
  const sA = sp(t - a, 1.06), sB = sp(t - a - 0.12, 1.1, 14, 0.42);
  const barra = 0.84 * entra((t - T.alquiler) / 0.6);
  const sello = t > T.fiado ? sp(t - T.fiado, 1.15, 18, 0.4) : 0;
  return (
    <div style={{ inset: 0 }}>
      <Cartel texto="CASI UN MES DE ALQUILER" top={74} fondo={C.verde} color={C.ambar} size={22} s={sp(t - a - 0.05, 1.05)} rot={-1.5 + Math.sin(t * 3) * 0.8} />
      <div style={{ left: 14, top: 140, width: 158, height: 300, borderRadius: 20, background: "#fff", border: `3px solid ${C.rojo}`, boxShadow: `0 6px 0 ${C.tinta}`, transform: `translateX(${(1 - Math.min(1, sA)) * -200}px)` }}>
        <div style={{ left: 0, right: 0, top: 18, textAlign: "center", font: `800 16px ${BODY}`, color: C.tinta }}>EN EL CUADERNO</div>
        <div style={{ left: 40, top: 50, transform: `rotate(-5deg) translateY(${Math.sin(t * 2) * 2}px)` }}><CuadernoCerrado w={78} /></div>
        <div style={{ left: 0, right: 0, top: 168, textAlign: "center", font: `800 36px ${DISP}`, color: C.rojo, letterSpacing: "-.03em" }}>{ars(TOTAL)}</div>
        {sello > 0 ? <div style={{ left: 22, top: 216, padding: "4px 14px", border: `4px solid ${C.rojo}`, borderRadius: 10, font: `800 28px ${DISP}`, color: C.rojo, transform: `rotate(-12deg) scale(${2.2 - 1.2 * Math.min(1, sello)})`, opacity: Math.min(1, sello * 1.5) }}>FIADO</div> : null}
      </div>
      <div style={{ left: 186, top: 140, width: 160, height: 300, borderRadius: 20, background: "#e7f3eb", border: `3px solid ${C.hoja}`, boxShadow: `0 6px 0 ${C.tinta}`, transform: `translateX(${(1 - Math.min(1, sB)) * 220}px) scale(${latido(t - a, 0.6, 0.03)})` }}>
        <div style={{ left: 0, right: 0, top: 18, textAlign: "center", font: `800 16px ${BODY}`, color: C.verde }}>ALQUILER</div>
        <div style={{ left: 30, top: 44 }}><Recibo w={100} p={barra} /></div>
        <div style={{ left: 0, right: 0, top: 190, textAlign: "center", font: `800 30px ${DISP}`, color: C.verde, letterSpacing: "-.03em" }}>{ars(450000)}</div>
        <div style={{ left: 0, right: 0, top: 232, textAlign: "center", font: `800 34px ${DISP}`, color: C.rojo }}>{Math.round(barra * 100)}%</div>
      </div>
    </div>
  );
};
