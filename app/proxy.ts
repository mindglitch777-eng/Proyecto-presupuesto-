import { NextResponse, type NextRequest } from "next/server";
import { destino, estadoDeClaims } from "@/lib/acceso";
import { leerSesion } from "@/lib/supabase/sesion";
import { ConfigFaltante } from "@/lib/supabase/config";

// Solo corre en la app (no en la landing): renueva la sesión y manda a cada persona donde corresponde.
export async function proxy(request: NextRequest) {
  try {
    const { response, claims } = await leerSesion(request);
    const ir = destino(request.nextUrl.pathname, Boolean(claims?.sub), estadoDeClaims(claims));
    if (!ir) return response;
    const redireccion = NextResponse.redirect(new URL(ir, request.url));
    response.cookies.getAll().forEach((c) => redireccion.cookies.set(c));
    return redireccion;
  } catch (e) {
    if (e instanceof ConfigFaltante) return NextResponse.next(); // la página muestra el aviso
    throw e;
  }
}

export const config = { matcher: ["/app/:path*", "/app", "/suscribirme", "/entrar", "/registrarme"] };
