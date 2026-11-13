import { z } from "zod";

export const RUBROS = ["kiosco", "almacen", "dietetica"] as const;
export type Rubro = (typeof RUBROS)[number];

/**
 * Deja el WhatsApp como 549 + 10 dígitos (código de área + número, sin 0 ni 15).
 * Acepta "3756 15 123456", "03756-123456", "+54 9 3756 123456", "5493756123456".
 * Devuelve null si no se puede armar un número argentino de celular.
 */
export function normalizarWhatsapp(crudo: string): string | null {
  let d = String(crudo).replace(/\D/g, "");
  if (d.startsWith("549")) d = d.slice(3);
  else if (d.startsWith("54")) d = d.slice(2);
  d = d.replace(/^0+/, "");
  // "15" después del código de área (2, 3 o 4 dígitos): 3756 15 123456 → 3756123456
  if (d.length === 12) {
    for (const area of [4, 3, 2]) {
      if (d.slice(area, area + 2) === "15" && d.length - 2 === 10) {
        d = d.slice(0, area) + d.slice(area + 2);
        break;
      }
    }
  }
  if (!/^[1-9]\d{9}$/.test(d)) return null;
  return "549" + d;
}

const texto = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

export const anotarseSchema = z.object({
  nombre: z.string().trim().min(2, "Escribí tu nombre.").max(80, "El nombre es demasiado largo."),
  whatsapp: z.string().refine((v) => normalizarWhatsapp(v) !== null, "Revisá el WhatsApp: tiene que ser un celular con código de área, por ejemplo 3756 15 123456."),
  rubro: z.enum(RUBROS, "Elegí si tu negocio es un kiosco, un almacén o una dietética."),
  ciudad: texto(80),
  numero_del_dia: z.number().finite().min(0).max(1_000_000_000).optional(),
  utm_source: texto(80),
  utm_content: texto(120),
  // campo escondido: las personas lo dejan vacío, los robots lo completan
  web: z.string().max(200).optional(),
});
export type Anotarse = z.infer<typeof anotarseSchema>;

export const bajaSchema = z.object({
  whatsapp: z.string().refine((v) => normalizarWhatsapp(v) !== null, "Revisá el WhatsApp: tiene que ser el mismo con el que te anotaste."),
});

export const LUGARES_FUNDADORES = 100;
