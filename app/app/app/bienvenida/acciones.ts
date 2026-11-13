"use server";

import { fijosSchema, negocioSchema, productosSchema } from "@/lib/onboarding";
import { ERROR_GUARDAR, primerError, type Resultado } from "@/lib/resultado";
import { supabaseServidor } from "@/lib/supabase/servidor";

// Guardan cada paso del primer uso con la sesión de la persona: la RLS de la base decide qué puede tocar.

async function negocio() {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.from("businesses").select("id, onboarding_completed_at").maybeSingle();
  if (error || !data) throw new Error("sin negocio");
  return { supabase, id: data.id as string, terminado: Boolean(data.onboarding_completed_at) };
}

export async function guardarNegocio(datos: unknown): Promise<Resultado> {
  const v = negocioSchema.safeParse(datos);
  if (!v.success) return { ok: false, mensaje: primerError(v.error) };
  try {
    const { supabase, id } = await negocio();
    const { error } = await supabase.from("businesses").update({ name: v.data.nombre, rubro: v.data.rubro, ciudad: v.data.ciudad }).eq("id", id);
    return error ? { ok: false, mensaje: ERROR_GUARDAR } : { ok: true };
  } catch {
    return { ok: false, mensaje: ERROR_GUARDAR };
  }
}

const CONCEPTOS = [["alquiler", "Alquiler"], ["luz", "Luz y servicios"], ["sueldos", "Sueldos"], ["otros", "Otros"]] as const;

export async function guardarFijos(datos: unknown): Promise<Resultado> {
  const v = fijosSchema.safeParse(datos);
  if (!v.success) return { ok: false, mensaje: primerError(v.error) };
  try {
    const { supabase, id } = await negocio();
    const borrar = await supabase.from("fixed_costs").delete().eq("business_id", id);
    if (borrar.error) return { ok: false, mensaje: ERROR_GUARDAR };
    const filas = CONCEPTOS.map(([k, concept]) => ({ business_id: id, concept, monthly_amount: v.data[k] }));
    const [a, b] = await Promise.all([
      supabase.from("fixed_costs").insert(filas),
      supabase.from("businesses").update({ card_fee_pct: v.data.comision }).eq("id", id),
    ]);
    return a.error || b.error ? { ok: false, mensaje: ERROR_GUARDAR } : { ok: true };
  } catch {
    return { ok: false, mensaje: ERROR_GUARDAR };
  }
}

export async function guardarProductos(datos: unknown): Promise<Resultado> {
  const v = productosSchema.safeParse(datos);
  if (!v.success) return { ok: false, mensaje: primerError(v.error) };
  try {
    const { supabase, id, terminado } = await negocio();
    // Durante el primer uso, volver a guardar reemplaza la lista (por si volvió atrás y la cambió).
    if (!terminado) {
      const borrar = await supabase.from("products").delete().eq("business_id", id);
      if (borrar.error) return { ok: false, mensaje: ERROR_GUARDAR };
    }
    if (!v.data.length) return { ok: true };
    const ahora = new Date().toISOString();
    const { error } = await supabase.from("products").insert(v.data.map((p) => ({ business_id: id, name: p.nombre, price: p.precio, cost: p.costo, price_updated_at: ahora })));
    return error ? { ok: false, mensaje: ERROR_GUARDAR } : { ok: true };
  } catch {
    return { ok: false, mensaje: ERROR_GUARDAR };
  }
}

export async function terminar(): Promise<Resultado> {
  try {
    const { supabase, id } = await negocio();
    const { error } = await supabase.from("businesses").update({ onboarding_completed_at: new Date().toISOString() }).eq("id", id).is("onboarding_completed_at", null);
    return error ? { ok: false, mensaje: ERROR_GUARDAR } : { ok: true };
  } catch {
    return { ok: false, mensaje: ERROR_GUARDAR };
  }
}
