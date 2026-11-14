"use server";

import { CLAVE_MINIMA, traducirError } from "@/lib/acceso";
import type { Resultado } from "@/lib/resultado";
import { supabaseServidor } from "@/lib/supabase/servidor";

// La sesión del link de "cambiar contraseña" la abre el servidor (/auth/callback): el cambio se hace con esa misma sesión.
// Si viene el código del mail (t), se valida acá mismo y en el mismo paso se cambia la contraseña.
export async function cambiarClave(clave: unknown, codigo?: unknown): Promise<Resultado> {
  if (typeof clave !== "string" || clave.length < CLAVE_MINIMA) return { ok: false, mensaje: `La contraseña tiene que tener al menos ${CLAVE_MINIMA} caracteres.` };
  if (clave.length > 72) return { ok: false, mensaje: "La contraseña es muy larga (máximo 72 caracteres)." };
  try {
    const supabase = await supabaseServidor();
    if (typeof codigo === "string" && codigo) {
      const { error: errLink } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: codigo });
      if (errLink) {
        console.error("[nueva-clave] link:", errLink.message);
        return { ok: false, mensaje: "El link venció o ya se usó. Pedí uno nuevo desde «Me olvidé la contraseña»." };
      }
    }
    const { error } = await supabase.auth.updateUser({ password: clave });
    if (error) console.error("[nueva-clave] cambio:", error.message);
    return error ? { ok: false, mensaje: traducirError(error) } : { ok: true };
  } catch (e) {
    return { ok: false, mensaje: traducirError(e as Error) };
  }
}
