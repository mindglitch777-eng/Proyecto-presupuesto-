import React from "react";
import { Composition, staticFile, type CalculateMetadataFunction } from "remotion";
import { Video, videoSchema, type VideoProps } from "./Video";
import { GUIONES, GUION_V3_01, GUION_V3_02, GUION_V3_03, GUION_V4_01, GUION_V5_01, GUION_V3_06, GUION_V4_02, GUION_V5_02, duracionVideo } from "./lib/guion";
import { ElDueno } from "./v3/ElDueno";
import { ElBanco } from "./v3/ElBanco";
import { SeHunde } from "./v3/SeHunde";
import { NumeroTapado } from "./v4/NumeroTapado";
import { Confesiones } from "./v5/Confesiones";
import { Basura } from "./v6/Basura";
import { TresErrores } from "./v6/TresErrores";
import { CajaRegistradora } from "./v6/CajaRegistradora";

const FPS = 30;
const LETRAS = ["A", "B", "C", "D"];

/** Si ya se generó la voz para este gancho, la usa con sus tiempos por palabra; si no, usa los de respaldo. */
const calcular: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  const base = `voces/${props.guion}.gancho-${props.gancho}`;
  try {
    const r = await fetch(staticFile(`${base}.json`));
    if (!r.ok) throw new Error(String(r.status));
    const data = (await r.json()) as { palabras: VideoProps["palabras"] };
    const d = (data as { duracionSeg?: number }).duracionSeg;
    // si la voz trae su duración (modo "encadenar"), el video dura lo que dura la voz
    return { props: { ...props, voz: `${base}.mp3`, palabras: data.palabras }, ...(d ? { durationInFrames: Math.round(d * FPS) } : {}) };
  } catch {
    console.log(`[voz] no hay ${base}.json: se usan los tiempos de respaldo y sin voz`);
    return { props: { ...props, voz: null, palabras: null } };
  }
};

export const Root: React.FC = () => (
  <>
    {GUIONES.flatMap((g) =>
      g.ganchos.map((_, i) => (
        <Composition
          key={g.id + i}
          id={i === 0 ? "LaPersiana" : `LaPersiana-gancho${LETRAS[i]}`}
          component={Video}
          schema={videoSchema}
          durationInFrames={Math.round(duracionVideo(g) * FPS)}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={{ guion: g.id, gancho: i, voz: null, palabras: null }}
          calculateMetadata={calcular}
        />
      )),
    )}
    <Composition
      id="Video01-ElDueno"
      component={ElDueno}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V3_01.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V3_01.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video02-Banco"
      component={ElBanco}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V3_02.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V3_02.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video03-SeHunde"
      component={SeHunde}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V3_03.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V3_03.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v4-01-NumeroTapado"
      component={NumeroTapado}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V4_01.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V4_01.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v5-01-Confesiones"
      component={Confesiones}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V5_01.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V5_01.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v3-06-Basura"
      component={Basura}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V3_06.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V3_06.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v4-02-TresErrores"
      component={TresErrores}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V4_02.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V4_02.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v5-02-Caja"
      component={CajaRegistradora}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V5_02.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V5_02.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
  </>
);
