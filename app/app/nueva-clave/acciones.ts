"use server";

import { CLAVE_MINIMA, traducirError } from "@/lib/acceso";
import type { Resultado } from "@/lib/resultado";
import { supabaseServidor } from "@/lib/supabase/servidor";

// La sesión del link de "cambiar contraseña" la abre el servidor (/auth/callback): el cambio se hace con esa misma sesión.
export async function cambiarClave(clave: unknown): Promise<Resultado> {
  if (typeof clave !== "string" || clave.length < CLAVE_MINIMA) return { ok: false, mensaje: `La contraseña tiene que tener al menos ${CLAVE_MINIMA} caracteres.` };
  if (clave.length > 72) return { ok: false, mensaje: "La contraseña es muy larga (máximo 72 caracteres)." };
  try {
    const supabase = await supabaseServidor();
    const { error } = await supabase.auth.updateUser({ password: clave });
    return error ? { ok: false, mensaje: traducirError(error) } : { ok: true };
  } catch (e) {
    return { ok: false, mensaje: traducirError(e as Error) };
  }
}
