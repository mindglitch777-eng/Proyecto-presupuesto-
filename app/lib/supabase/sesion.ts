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
  const { data } = await supabase.auth.getClaims();
  return { response, claims: (data?.claims as Record<string, unknown> | undefined) ?? null };
}
