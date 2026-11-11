import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { estado } from "./lib/estado";
import { GUIONES, aAnimatic, aVideo, palabrasDeRespaldo, type Palabra } from "./lib/guion";
import { BODY } from "./lib/fuentes";
import { Fondo, Grano, LuzDestello, Vineta } from "./components/Capas";
import { Subtitulos } from "./components/Subtitulos";
import { Calle, Mira, Polvo, TextoGancho } from "./escenas/Gancho";
import { Cuaderno, Ejemplo, FundidoSuperior, GrillaDeCierres, Herida, KioscoPrincipal, RestaEnCascada } from "./escenas/Dolor";
import { CartelImpreso, Celular3D, EstoSi, InterfazExplotada, TitulosSolucion } from "./escenas/Solucion";
import { Cierre, TarjetaPrecio } from "./escenas/Final";

export const videoSchema = z.object({
  guion: z.string(),
  gancho: z.number().int().min(0).max(3),
  voz: z.string().nullable(),
  palabras: z.array(z.object({ texto: z.string(), desde: z.number(), hasta: z.number(), linea: z.number() })).nullable(),
});
export type VideoProps = z.infer<typeof videoSchema>;

/** Volumen de los efectos: −6 dB por debajo de la voz. */
const SFX_VOL = 0.5;

export const Video: React.FC<VideoProps> = ({ guion, gancho, voz, palabras }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const g = GUIONES.find((x) => x.id === guion)!;
  const tv = frame / fps; // segundos del video
  const t = aAnimatic(g, tv); // segundos del animatic: con esto se dibuja todo
  const e = estado(t, g);
  const pal: Palabra[] = palabras ?? palabrasDeRespaldo(g, gancho);

  return (
    <AbsoluteFill style={{ background: "#050f0a" }}>
      <style>{`.stage *{position:absolute;box-sizing:border-box} .stage{font-family:${BODY};color:#fff}`}</style>
      {/* lienzo lógico de 360 × 640 como el animatic, escalado ×3 → 1080 × 1920 */}
      <div className="stage" style={{ position: "absolute", left: 0, top: 0, width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0", overflow: "hidden" }}>
        <Fondo t={t} />
        <Calle t={t} g={g} hs={e.hs} />
        <KioscoPrincipal t={t} g={g} p={e.p} shake={e.shake} lights={e.lights} />
        <FundidoSuperior t={t} />
        <TextoGancho t={t} g={g} gancho={gancho} hs={e.hs} />
        <Mira t={t} />
        <GrillaDeCierres t={t} g={g} />
        <RestaEnCascada t={t} g={g} p={e.p} shake={e.shake} />
        <Ejemplo t={t} />
        <Herida t={t} />
        <Cuaderno t={t} />
        <TitulosSolucion t={t} />
        <Celular3D t={t} />
        <InterfazExplotada t={t} />
        <EstoSi t={t} />
        <CartelImpreso t={t} />
        <TarjetaPrecio t={t} />
        <Cierre t={t} />
        <Grano frame={frame} />
        <Vineta />
        <LuzDestello t={t} red={e.red} wf={e.wf} />
        <Polvo t={t} />
        <Subtitulos t={t} tv={tv} g={g} palabras={pal} />
      </div>

      {voz ? <Html5Audio src={staticFile(voz)} /> : null}
      {g.sonidos.map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(aVideo(g, s.en) * fps))} durationInFrames={Math.round(1.5 * fps)} layout="none">
          <Html5Audio src={staticFile(`sfx/${s.sfx}.wav`)} volume={SFX_VOL} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
