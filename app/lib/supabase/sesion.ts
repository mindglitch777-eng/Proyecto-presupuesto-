import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { configPublica } from "./config";

/** Renueva la sesión en cada pedido y devuelve lo que dice el token (verificado). */
export async function leerSesion(request: NextRequest) {
  const { url, clave } = configPublica();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, clave, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(lista) {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data, error } = await supabase.auth.getClaims();
  if (!data?.claims && request.cookies.getAll().some((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))) {
    // Hay sesión guardada pero no se pudo leer: queda anotado para encontrar la causa (sin datos de la persona).
    const { data: s } = await supabase.auth.getSession();
    console.error(`[sesion] ${request.nextUrl.pathname}: hay cookie pero no hay sesión válida (${error?.message ?? "sin error"}; getSession: ${s.session ? "con sesión" : "vacía"})`);
  }
  return { response, claims: (data?.claims as Record<string, unknown> | undefined) ?? null };
}
