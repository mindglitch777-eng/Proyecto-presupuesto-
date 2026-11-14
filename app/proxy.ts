import { NextResponse, type NextRequest } from "next/server";
import { destino } from "@/lib/acceso";
import { leerSesion } from "@/lib/supabase/sesion";
import { ConfigFaltante } from "@/lib/supabase/config";
import { aDireccionOficial, irA } from "@/lib/redirigir";

// Solo corre en la app (no en la landing): renueva la sesión y manda a cada persona donde corresponde.
export async function proxy(request: NextRequest) {
  // Pruebas automáticas (solo si el servidor arrancó con ENCLARO_MODO_PRUEBA=1, nunca en Netlify)
  if (process.env.ENCLARO_MODO_PRUEBA === "1" && request.cookies.get("enclaro_prueba")?.value === "1") return NextResponse.next();
  // Una sola dirección para todo el sitio (si está configurada): la sesión no se pierde entre www. y sin www.
  const oficial = aDireccionOficial(request);
  if (oficial) return oficial;
  try {
    const { response, claims } = await leerSesion(request);
    // El acceso se decide en el momento en cada pantalla (la base); acá solo importa si hay sesión,
    // porque el estado del token puede estar viejo y causar idas y vueltas entre /app y /suscribirme.
    const ir = destino(request.nextUrl.pathname, Boolean(claims?.sub), null);
    if (!ir) return response;
    const redireccion = irA(request, ir, 307);
    response.cookies.getAll().forEach((c) => redireccion.cookies.set(c));
    return redireccion;
  } catch (e) {
    if (e instanceof ConfigFaltante) return NextResponse.next(); // la página muestra el aviso
    throw e;
  }
}

export const config = { matcher: ["/app/:path*", "/app", "/suscribirme", "/entrar", "/registrarme", "/recuperar", "/nueva-clave", "/auth/:path*"] };
