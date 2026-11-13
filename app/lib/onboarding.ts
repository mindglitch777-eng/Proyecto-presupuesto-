// Lógica del primer uso (onboarding): sin dependencias del navegador ni de la base, para poder probarla.
import { z } from "zod";
import { MARGEN_INICIAL, numeroDelDia } from "./numeroDelDia";
import type { Rubro } from "./listaEspera";
export type { Rubro };

/** Nombres típicos por rubro para cargar rápido con un toque. Solo nombres: nunca precios inventados. */
export const NOMBRES_RUBRO: Record<Rubro, string> = { kiosco: "Kiosco", almacen: "Almacén", dietetica: "Dietética" };

export const CHIPS: Record<Rubro, string[]> = {
  kiosco: ["Gaseosa 500", "Alfajor", "Cigarrillos", "Caramelos sueltos", "Chicles", "Agua 500", "Galletitas", "Papas fritas", "Energizante", "Cerveza lata"],
  almacen: ["Yerba 1 kg", "Azúcar 1 kg", "Fideos", "Aceite 1,5 L", "Leche", "Pan", "Arroz 1 kg", "Harina", "Huevos (docena)", "Gaseosa 2,25 L"],
  dietetica: ["Almendras 100 g", "Nueces 100 g", "Avena 500 g", "Granola", "Mix de frutos secos", "Pasas de uva", "Semillas de chía", "Harina integral", "Miel", "Barritas de cereal"],
};

/** Datos del paso 1. */
export const negocioSchema = z.object({
  nombre: z.string().trim().min(2, "Escribí el nombre de tu negocio.").max(120, "El nombre es muy largo."),
  rubro: z.enum(["kiosco", "almacen", "dietetica"], { message: "Elegí qué tipo de negocio tenés." }),
  ciudad: z.string().trim().max(120).optional().transform((v) => v || null),
});

const plata = z.number({ message: "Revisá el monto." }).int().min(0, "Revisá el monto.").max(1_000_000_000, "Ese monto es demasiado grande.");

/** Datos del paso 2. Pueden quedar en cero. */
export const fijosSchema = z.object({
  alquiler: plata,
  luz: plata,
  sueldos: plata,
  otros: plata,
  comision: z.number().min(0, "La comisión va de 0 a 20%.").max(20, "La comisión va de 0 a 20%.").nullable(),
});

/** Un producto del paso 3: precio de venta y costo, por unidad. */
export const productoSchema = z
  .object({
    nombre: z.string().trim().min(1).max(120),
    precio: z.number().int().positive("Poné a cuánto lo vendés."),
    costo: z.number().int().min(0, "Poné cuánto te cuesta."),
  })
  .refine((p) => p.costo <= p.precio * 3, { message: "Revisá el costo: es mucho más alto que el precio." });

export const productosSchema = z.array(productoSchema).max(20);

export type Producto = z.infer<typeof productoSchema>;
export type Fijos = z.infer<typeof fijosSchema>;

/** Margen % = (precio − costo) ÷ precio. */
export const margenPct = (p: Pick<Producto, "precio" | "costo">) => (p.precio > 0 ? ((p.precio - p.costo) / p.precio) * 100 : 0);
export const ganancia = (p: Pick<Producto, "precio" | "costo">) => p.precio - p.costo;

/** Margen promedio de los productos cargados (si no cargó ninguno, el 30% de la calculadora). */
export function margenPromedio(productos: Pick<Producto, "precio" | "costo">[]) {
  const validos = productos.filter((p) => p.precio > 0);
  if (!validos.length) return MARGEN_INICIAL;
  return validos.reduce((s, p) => s + margenPct(p), 0) / validos.length;
}

/** Lo que muestra la pantalla "wow". */
export function wow(fijos: Fijos, productos: Producto[]) {
  const r = numeroDelDia({ alquiler: fijos.alquiler, luz: fijos.luz, sueldos: fijos.sueldos + fijos.otros }, margenPromedio(productos));
  const ranking = [...productos].sort((a, b) => ganancia(b) - ganancia(a));
  const mejor = ranking[0] ?? null;
  const peor = ranking.length > 1 ? ranking[ranking.length - 1] : null;
  return { diario: r.diario, vender: r.vender, margen: r.margen, fijos: r.fijos, ranking, mejor, peor };
}

/** Recordatorio diario a las 21 h, en hora de Argentina, como archivo de calendario (.ics). */
export function recordatorioIcs(url: string, desde = new Date()) {
  const d = new Date(desde.getTime() - 3 * 3600_000); // fecha en Argentina (UTC−3)
  const dia = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const sello = desde.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//En Claro//Cierre del día//ES",
    "BEGIN:VEVENT",
    `UID:cierre-${dia}@enclaro`,
    `DTSTAMP:${sello}`,
    `DTSTART;TZID=America/Argentina/Buenos_Aires:${dia}T210000`,
    "DURATION:PT10M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:Hacé tu cierre en En Claro",
    `DESCRIPTION:Son 5 minutos: ${url}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "TRIGGER:PT0M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Hacé tu cierre en En Claro",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export { CLAVE_CALCULADORA, leerCalculadora, type DeLaCalculadora } from "./calculadora";
