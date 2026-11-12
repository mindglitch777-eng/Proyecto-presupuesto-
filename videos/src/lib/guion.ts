import { z } from "zod";
import guion01 from "../../guiones/01-la-persiana.json";
import guionV3_01 from "../../guiones/v3-01-el-dueno.json";
import guionV3_02 from "../../guiones/v3-02-el-banco.json";
import guionV3_03 from "../../guiones/v3-03-se-hunde.json";
import guionV4_01 from "../../guiones/v4-01-numero-tapado.json";

export const lineaSchema = z.object({
  desde: z.number(),
  hasta: z.number(),
  texto: z.string(),
  subtitulo: z.string().optional(),
  gigante: z.boolean().optional(),
  gancho: z.boolean().optional(),
});

export const guionSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  duracionSeg: z.number(),
  /** tramos del animatic que se estiran para que entre la voz: [desde, hasta, factor] en segundos del animatic */
  tramos: z.array(z.tuple([z.number(), z.number(), z.number()])).default([]),
  voz: z.any(),
  ganchos: z.array(z.object({ lineas: z.tuple([z.string(), z.string(), z.string()]), voz: z.string() })),
  lineas: z.array(lineaSchema),
  cuenta: z.optional(z.object({
    vendes: z.number(),
    gastos: z.array(z.tuple([z.number(), z.number(), z.string(), z.string()])),
    te_quedan: z.number(),
    por_hora: z.number(),
  })),
  fuente: z.string().optional(),
  sonidos: z.array(z.object({ en: z.number(), sfx: z.string() })),
});

export type Guion = z.infer<typeof guionSchema>;
export type Linea = z.infer<typeof lineaSchema>;
export const GUIONES: Guion[] = [guionSchema.parse(guion01)];
export const GUION_V3_01: Guion = guionSchema.parse(guionV3_01);
export const GUION_V3_02: Guion = guionSchema.parse(guionV3_02);
export const GUION_V3_03: Guion = guionSchema.parse(guionV3_03);
export const GUION_V4_01: Guion = guionSchema.parse(guionV4_01);

/** Una palabra con su tiempo, en segundos (sale de voces/<id>.gancho-N.json o del respaldo). */
export type Palabra = { texto: string; desde: number; hasta: number; linea: number };

/** Texto de la línea i para un gancho dado (la línea "GANCHO" se reemplaza por la voz del gancho). */
export const textoLinea = (g: Guion, l: Linea, gancho: number) => (l.texto === "GANCHO" ? g.ganchos[gancho].voz : l.subtitulo ?? l.texto);

/** Sin voz generada: reparte las palabras de cada línea en su tiempo, como el animatic. */
export function palabrasDeRespaldo(g: Guion, gancho: number): Palabra[] {
  const out: Palabra[] = [];
  g.lineas.forEach((l, n) => {
    const w = textoLinea(g, l, gancho).split(" ");
    const per = (l.hasta - l.desde) / w.length;
    w.forEach((x, i) => out.push({ texto: x, desde: aVideo(g, l.desde + i * per), hasta: aVideo(g, l.desde + (i + 1) * per), linea: n }));
  });
  return out;
}

/**
 * Reloj del video. Las escenas se escriben en segundos del animatic (32 s); algunos tramos se estiran
 * para que la voz real entre sin apurarse. aVideo: animatic → video. aAnimatic: video → animatic.
 */
export function aVideo(g: Guion, a: number) {
  let v = a;
  for (const [d, h, f] of g.tramos) v += (Math.min(Math.max(a, d), h) - d) * (f - 1);
  return v;
}
export function aAnimatic(g: Guion, v: number) {
  let a = v;
  // recorre los tramos en orden: antes de cada uno el reloj corre igual, adentro va más lento
  let corrido = 0;
  for (const [d, h, f] of g.tramos) {
    const ini = d + corrido, fin = ini + (h - d) * f;
    if (v < ini) return v - corrido;
    if (v < fin) return d + (v - ini) / f;
    corrido += (h - d) * (f - 1);
  }
  a = v - corrido;
  return a;
}
export const duracionVideo = (g: Guion) => aVideo(g, g.duracionSeg);

/** Segundo del video en que la voz dice una palabra (de la línea `linea`, empieza con `prefijo`); si no está, `def`. */
export function tPalabra(pal: Palabra[], linea: number, prefijo: string, def: number) {
  const limpia = (s: string) => s.toLowerCase().replace(/[¡!¿?.,…:;"]/g, "");
  const w = pal.find((p) => p.linea === linea && limpia(p.texto).startsWith(limpia(prefijo)));
  return w ? w.desde : def;
}
