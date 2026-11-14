import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { rutaSegura } from "@/lib/acceso";
import { irA } from "@/lib/redirigir";
import { supabaseServidor } from "@/lib/supabase/servidor";

// Adonde llegan los links de los mails (confirmar cuenta, entrar con un link, cambiar contraseña).
// Acepta el formato con token_hash (funciona aunque abras el mail en otra app del celular) y el código clásico.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const siguiente = rutaSegura(q.get("siguiente") ?? q.get("next"));
  try {
    const supabase = await supabaseServidor();
    const tokenHash = q.get("token_hash");
    const tipo = q.get("type") as EmailOtpType | null;
    const code = q.get("code");
    // Cambiar contraseña: el link no se gasta acá (los antivirus del mail abren los links solos). Se valida recién
    // cuando la persona guarda la contraseña nueva, en el mismo paso que el cambio.
    if (tokenHash && tipo === "recovery") return irA(`/nueva-clave?t=${encodeURIComponent(tokenHash)}`);
    let error = null;
    if (tokenHash && tipo) ({ error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash }));
    else if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
    else error = new Error("sin código");
    if (!error) return irA(tipo === "recovery" ? "/nueva-clave" : siguiente);
  } catch {
    // cae al aviso de abajo
  }
  return irA("/entrar?error=1");
}
