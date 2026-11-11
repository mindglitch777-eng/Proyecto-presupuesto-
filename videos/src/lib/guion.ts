import { z } from "zod";
import guion01 from "../../guiones/01-la-persiana.json";

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
  voz: z.any(),
  ganchos: z.array(z.object({ lineas: z.tuple([z.string(), z.string(), z.string()]), voz: z.string() })),
  lineas: z.array(lineaSchema),
  cuenta: z.object({
    vendes: z.number(),
    gastos: z.array(z.tuple([z.number(), z.number(), z.string(), z.string()])),
    te_quedan: z.number(),
    por_hora: z.number(),
  }),
  fuente: z.string(),
  sonidos: z.array(z.object({ en: z.number(), sfx: z.string() })),
});

export type Guion = z.infer<typeof guionSchema>;
export type Linea = z.infer<typeof lineaSchema>;
export const GUIONES: Guion[] = [guionSchema.parse(guion01)];

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
    w.forEach((x, i) => out.push({ texto: x, desde: l.desde + i * per, hasta: l.desde + (i + 1) * per, linea: n }));
  });
  return out;
}
