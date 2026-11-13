import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { rutaSegura } from "@/lib/acceso";
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
    let error = null;
    if (tokenHash && tipo) ({ error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash }));
    else if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
    else error = new Error("sin código");
    if (!error) return NextResponse.redirect(new URL(tipo === "recovery" ? "/nueva-clave" : siguiente, request.url));
  } catch {
    // cae al aviso de abajo
  }
  return NextResponse.redirect(new URL("/entrar?error=1", request.url));
}
