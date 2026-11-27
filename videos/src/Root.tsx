import React from "react";
import { Composition, staticFile, type CalculateMetadataFunction } from "remotion";
import { Video, videoSchema, type VideoProps } from "./Video";
import { GUIONES, GUION_V3_01, GUION_V3_02, GUION_V3_03, GUION_V4_01, GUION_V5_01, GUION_V3_06, GUION_V4_02, GUION_V5_02, GUION_V7_01, GUION_V8_01, GUION_V8_02, GUION_V8_03, GUION_V8_04, GUION_V8_05, GUION_V8_06, GUION_V8_07, GUION_V8_08, GUION_V8_09, GUION_V8_10, GUION_V8_11, GUION_V8_12, GUION_V8_13, GUION_V8_14, GUION_V9_03, GUION_P1, GUION_P2, GUION_P3, GUION_P4, GUION_P5, GUION_FB_01, GUION_FB_02, GUION_FB_03, GUION_TT_02, duracionVideo } from "./lib/guion";
import { ElDueno } from "./v3/ElDueno";
import { ElBanco } from "./v3/ElBanco";
import { SeHunde } from "./v3/SeHunde";
import { NumeroTapado } from "./v4/NumeroTapado";
import { Confesiones } from "./v5/Confesiones";
import { Basura } from "./v6/Basura";
import { TresErrores } from "./v6/TresErrores";
import { CajaRegistradora } from "./v6/CajaRegistradora";
import { RecordDeVentas } from "./v7/RecordDeVentas";
import { CuantoLeQueda } from "./v8/CuantoLeQueda";
import { ElCuaderno } from "./v8/ElCuaderno";
import { LaCajaMiente } from "./v8/LaCajaMiente";
import { CualTeHacePerder } from "./v8/CualTeHacePerder";
import { LaTorre } from "./v8/LaTorre";
import { RayosX } from "./v8/RayosX";
import { ElTicket } from "./v8/ElTicket";
import { CuentaRegresiva } from "./v8/CuentaRegresiva";
import { MismoKiosco } from "./v8/MismoKiosco";
import { KioscoCerrado } from "./v8/KioscoCerrado";
import { PorHora } from "./v8/PorHora";
import { VenderMas } from "./v8/VenderMas";
import { Taximetro } from "./v8/Taximetro";
import { TrabajasGratis } from "./v8/TrabajasGratis";
import { PlataEncerrada } from "./v9/PlataEncerrada";
import { CajaMiente } from "./piloto/CajaMiente";
import { VendesNoCobras } from "./vnc/VendesNoCobras";
import { Regalando } from "./rg/Regalando";
import { DemoFb01, DemoFb02, DemoFb03 } from "./fb/DemoFB";
import { DondeEstaLaPlata } from "./tt/DondeEstaLaPlata";
import { PovFiado, DUR_TT03 } from "./tt/PovFiado";
import { JuegoCuantoQueda, DUR_TT04 } from "./tt/JuegoCuantoQueda";
import { Kiosco2016, DUR_TT05 } from "./tt/Kiosco2016";
import { MatandoKiosco, durTT06 } from "./tt/MatandoKiosco";
import { MatandoExplicado } from "./tt/MatandoExplicado";
import { DondeEstaTuPlata, durTT08 } from "./tt/DondeEstaTuPlata";
import { MejorCliente, durTT07 } from "./tt/MejorCliente";
import { Muestrario, DURACION_M, FPS_M } from "./muestrario/Muestrario";
import { TrabajasParaPagar } from "./piloto/TrabajasParaPagar";
import { PlataEnLaCalle } from "./piloto/PlataEnLaCalle";

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
    <Composition
      id="Video-v7-01-Record"
      component={RecordDeVentas}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V7_01.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V7_01.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-01-CuantoLeQueda"
      component={CuantoLeQueda}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_01.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_01.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-02-ElCuaderno"
      component={ElCuaderno}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_02.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_02.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-03-LaCajaMiente"
      component={LaCajaMiente}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_03.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_03.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-04-CualTeHacePerder"
      component={CualTeHacePerder}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_04.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_04.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-05-LaTorre"
      component={LaTorre}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_05.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_05.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-06-RayosX"
      component={RayosX}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_06.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_06.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-07-ElTicket"
      component={ElTicket}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_07.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_07.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-08-CuentaRegresiva"
      component={CuentaRegresiva}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_08.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_08.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-09-MismoKiosco"
      component={MismoKiosco}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_09.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_09.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-10-KioscoCerrado"
      component={KioscoCerrado}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_10.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_10.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-11-PorHora"
      component={PorHora}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_11.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_11.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-12-VenderMas"
      component={VenderMas}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_12.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_12.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-13-Taximetro"
      component={Taximetro}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_13.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_13.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-tt-06-Matando"
      component={MatandoKiosco}
      durationInFrames={Math.round(durTT06(false) * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: "tt-06", gancho: 0, voz: null, palabras: null, ad: false }}
    />
    <Composition
      id="Video-tt-06-Matando-Anuncio"
      component={MatandoKiosco}
      durationInFrames={Math.round(durTT06(true) * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: "tt-06", gancho: 0, voz: null, palabras: null, ad: true }}
    />
    <Composition
      id="Video-tt-08-Plata"
      component={DondeEstaTuPlata}
      durationInFrames={Math.round(durTT08("plata", "meta") * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: "tt-08", gancho: 0, voz: null, palabras: null, variante: "plata" as const, canal: "meta" as const }}
    />
    <Composition
      id="Video-tt-08-Plata-TikTok"
      component={DondeEstaTuPlata}
      durationInFrames={Math.round(durTT08("plata", "tiktok") * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: "tt-08", gancho: 0, voz: null, palabras: null, variante: "plata" as const, canal: "tiktok" as const }}
    />
    <Composition
      id="Video-tt-09-Fiado"
      component={DondeEstaTuPlata}
      durationInFrames={Math.round(durTT08("fiado", "meta") * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: "tt-08", gancho: 0, voz: null, palabras: null, variante: "fiado" as const, canal: "meta" as const }}
    />
    <Composition
      id="Video-tt-10-Cerraste"
      component={DondeEstaTuPlata}
      durationInFrames={Math.round(durTT08("cerraste", "meta") * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: "tt-08", gancho: 0, voz: null, palabras: null, variante: "cerraste" as const, canal: "meta" as const }}
    />
    <Composition
      id="Video-tt-06b-Explicado"
      component={MatandoExplicado}
      durationInFrames={Math.round(durTT06(false) * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: "tt-06", gancho: 0, voz: null, palabras: null, ad: false }}
    />
    <Composition
      id="Video-tt-06b-Explicado-Anuncio"
      component={MatandoExplicado}
      durationInFrames={Math.round(durTT06(true) * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: "tt-06", gancho: 0, voz: null, palabras: null, ad: true }}
    />
    <Composition
      id="Video-tt-07-MejorCliente"
      component={MejorCliente}
      durationInFrames={Math.round(durTT07(false) * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: "tt-07", gancho: 0, voz: null, palabras: null, ad: false }}
    />
    <Composition
      id="Video-tt-07-MejorCliente-Anuncio"
      component={MejorCliente}
      durationInFrames={Math.round(durTT07(true) * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: "tt-07", gancho: 0, voz: null, palabras: null, ad: true }}
    />
    <Composition
      id="Video-tt-05-2016vs2026"
      component={Kiosco2016}
      schema={videoSchema}
      durationInFrames={Math.round(DUR_TT05 * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: "tt-05", gancho: 0, voz: null, palabras: null }}
    />
    <Composition
      id="Video-tt-04-CuantoLeQueda"
      component={JuegoCuantoQueda}
      schema={videoSchema}
      durationInFrames={Math.round(DUR_TT04 * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: "tt-04", gancho: 0, voz: null, palabras: null }}
    />
    <Composition
      id="Video-tt-03-PovFiado"
      component={PovFiado}
      schema={videoSchema}
      durationInFrames={Math.round(DUR_TT03 * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: "tt-03-pov-fiado", gancho: 0, voz: null, palabras: null }}
    />
    <Composition
      id="Video-tt-02-DondeEstaLaPlata"
      component={DondeEstaLaPlata}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_TT_02.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_TT_02.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v8-14-TrabajasGratis"
      component={TrabajasGratis}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V8_14.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V8_14.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-v9-03-PlataEncerrada"
      component={PlataEncerrada}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_V9_03.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_V9_03.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Piloto-1-LaCajaMiente"
      component={CajaMiente}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_P1.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_P1.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Piloto-2-TrabajasParaPagar"
      component={TrabajasParaPagar}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_P2.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_P2.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Piloto-3-PlataEnLaCalle"
      component={PlataEnLaCalle}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_P3.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_P3.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-VendesNoCobras"
      component={VendesNoCobras}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_P4.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_P4.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-RegalandoGanancia"
      component={Regalando}
      schema={videoSchema}
      durationInFrames={Math.round(GUION_P5.duracionSeg * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_P5.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
      <Composition id="Muestrario-Estilos" component={Muestrario} durationInFrames={DURACION_M * FPS_M} fps={FPS_M} width={1080} height={1920} />
      <Composition
      id="Video-fb-01-Voz"
      component={DemoFb01}
      schema={videoSchema}
      durationInFrames={Math.round(duracionVideo(GUION_FB_01) * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_FB_01.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-fb-02-CargarTodo"
      component={DemoFb02}
      schema={videoSchema}
      durationInFrames={Math.round(duracionVideo(GUION_FB_02) * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_FB_02.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
    <Composition
      id="Video-fb-03-Factura"
      component={DemoFb03}
      schema={videoSchema}
      durationInFrames={Math.round(duracionVideo(GUION_FB_03) * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ guion: GUION_FB_03.id, gancho: 0, voz: null, palabras: null }}
      calculateMetadata={calcular}
    />
  </>
);
