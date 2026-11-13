"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { obtenerDatos } from "@/lib/datos";
import { ERROR_GUARDAR, primerError, type Resultado } from "@/lib/resultado";
import { hoyArgentina, sumarDias } from "@/lib/fechas";

// Todo lo que se guarda desde la app. Valida en el servidor y guarda con la sesión de la persona (RLS).
const plata = z.number({ message: "Revisá el monto." }).int("Usá pesos enteros.").min(0, "Revisá el monto.").max(1_000_000_000, "Ese monto es demasiado grande.");
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Revisá la fecha.");
const id = z.string().min(1).max(64);

async function correr(fn: () => Promise<void>): Promise<Resultado> {
  try {
    await fn();
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch {
    return { ok: false, mensaje: ERROR_GUARDAR };
  }
}

const cierreSchema = z
  .object({
    fecha,
    ventas: plata.refine((v) => v > 0, "Poné cuánto vendiste."),
    tarjeta: plata,
    gastos: z.array(z.object({ categoria: z.enum(["proveedor", "flete", "vuelto", "otros"]), monto: plata })).max(20),
    productos: z.array(id).max(200),
    fuente: z.enum(["voz", "manual"]),
  })
  .refine((c) => c.tarjeta <= c.ventas, { message: "Lo que cobraste con tarjeta o QR no puede ser más que lo que vendiste." })
  .refine((c) => c.fecha <= hoyArgentina() && c.fecha >= sumarDias(hoyArgentina(), -60), { message: "Podés cargar o corregir cierres de los últimos 60 días." });

export async function guardarCierre(datos: unknown): Promise<Resultado> {
  const v = cierreSchema.safeParse(datos);
  if (!v.success) return { ok: false, mensaje: primerError(v.error) };
  return correr(async () => (await obtenerDatos()).guardarCierre(v.data));
}

const productoSchema = z
  .object({ id: id.optional(), nombre: z.string().trim().min(1, "Poné el nombre.").max(120), precio: plata.nullable(), costo: plata.nullable(), stock: z.number().int().min(0).max(1_000_000).nullable() })
  .refine((p) => p.precio === null || p.precio > 0, { message: "Poné a cuánto lo vendés." });

export async function guardarProducto(datos: unknown): Promise<Resultado> {
  const v = productoSchema.safeParse(datos);
  if (!v.success) return { ok: false, mensaje: primerError(v.error) };
  return correr(async () => void (await (await obtenerDatos()).guardarProducto(v.data, "manual")));
}

export async function vendiHoy(productoId: unknown): Promise<Resultado> {
  const v = id.safeParse(productoId);
  if (!v.success) return { ok: false, mensaje: "Revisá el producto." };
  return correr(async () => (await obtenerDatos()).vendiHoy(v.data, hoyArgentina()));
}

const dormidoSchema = z.object({ id, accion: z.enum(["no_reponer", "liquidar", "mantener"]), stock: z.number().int().min(0).max(1_000_000).nullable(), precio: plata.nullable() });
export async function accionDormido(datos: unknown): Promise<Resultado> {
  const v = dormidoSchema.safeParse(datos);
  if (!v.success) return { ok: false, mensaje: primerError(v.error) };
  const hasta = v.data.accion === "mantener" ? sumarDias(hoyArgentina(), 30) : null;
  return correr(async () => (await obtenerDatos()).accionDormido(v.data.id, v.data.accion, v.data.stock, v.data.accion === "liquidar" ? v.data.precio : null, hasta));
}

const clienteSchema = z.object({
  id: id.optional(),
  nombre: z.string().trim().min(1, "Poné el nombre.").max(120),
  telefono: z.string().trim().max(30).nullable().transform((t) => t || null),
  diaCobro: z.number().int().min(1, "El día de cobro va del 1 al 31.").max(31, "El día de cobro va del 1 al 31.").nullable(),
  nota: z.string().trim().max(500).nullable().transform((t) => t || null),
});
export async function guardarCliente(datos: unknown): Promise<Resultado> {
  const v = clienteSchema.safeParse(datos);
  if (!v.success) return { ok: false, mensaje: primerError(v.error) };
  return correr(async () => void (await (await obtenerDatos()).guardarCliente(v.data)));
}

const movSchema = z.object({ clienteId: id, tipo: z.enum(["fio", "pago"]), monto: plata.refine((m) => m > 0, "Poné el monto."), nota: z.string().trim().max(300).nullable() });
export async function movimiento(datos: unknown): Promise<Resultado> {
  const v = movSchema.safeParse(datos);
  if (!v.success) return { ok: false, mensaje: primerError(v.error) };
  return correr(async () => (await obtenerDatos()).movimiento(v.data.clienteId, v.data.tipo, v.data.monto, hoyArgentina(), v.data.nota || null));
}

export async function recordado(clienteId: unknown): Promise<Resultado> {
  const v = id.safeParse(clienteId);
  if (!v.success) return { ok: false, mensaje: "Revisá el cliente." };
  return correr(async () => (await obtenerDatos()).recordado(v.data));
}
