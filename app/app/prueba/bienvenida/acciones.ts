"use server";

import { fijosSchema, negocioSchema, productosSchema } from "@/lib/onboarding";
import { primerError, type Resultado } from "@/lib/resultado";

// Solo para las pruebas automáticas (ENCLARO_MODO_PRUEBA=1): valida igual que las acciones reales, sin base de datos.
const activo = () => process.env.ENCLARO_MODO_PRUEBA === "1";
const fuera: Resultado = { ok: false, mensaje: "No disponible." };

export async function guardarNegocio(d: unknown): Promise<Resultado> {
  if (!activo()) return fuera;
  const v = negocioSchema.safeParse(d);
  return v.success ? { ok: true } : { ok: false, mensaje: primerError(v.error) };
}
export async function guardarFijos(d: unknown): Promise<Resultado> {
  if (!activo()) return fuera;
  const v = fijosSchema.safeParse(d);
  return v.success ? { ok: true } : { ok: false, mensaje: primerError(v.error) };
}
export async function guardarProductos(d: unknown): Promise<Resultado> {
  if (!activo()) return fuera;
  const v = productosSchema.safeParse(d);
  return v.success ? { ok: true } : { ok: false, mensaje: primerError(v.error) };
}
export async function terminar(): Promise<Resultado> {
  return activo() ? { ok: true } : fuera;
}
