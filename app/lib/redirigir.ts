import { NextResponse, type NextRequest } from "next/server";

/**
 * Manda al navegador a otra pantalla de la app SIN cambiar de dirección.
 *
 * Por qué existe: armar la dirección con request.url puede devolver la dirección interna del servidor
 * (por ejemplo "localhost" en vez de la que escribió la persona, o sin "www."). El navegador guarda la
 * sesión a nombre de la dirección en la que está: si lo mandamos a otra, la sesión "desaparece".
 * Con una dirección relativa ("/app"), el navegador se queda siempre en la misma.
 * Prohibido armar redirecciones con la dirección del pedido: lo controla tests/redirecciones.test.ts.
 */
export function irA(ruta: string, estado: 303 | 307 | 308 = 303): NextResponse {
  if (!ruta.startsWith("/") || ruta.startsWith("//")) throw new Error(`irA solo acepta rutas de la app: ${ruta}`);
  return new NextResponse(null, { status: estado, headers: { Location: ruta } });
}

/**
 * Si está cargada HOST_CANONICO (por ejemplo "enclaro.com.ar"), quien entre por otra dirección del mismo
 * sitio (www., la de Netlify) pasa a la oficial antes de entrar, así la sesión vive siempre en una sola.
 * Sin la variable no hace nada (pruebas, vistas previas de Netlify).
 */
export function aDireccionOficial(request: NextRequest): NextResponse | null {
  const oficial = process.env.HOST_CANONICO?.trim().toLowerCase();
  if (!oficial) return null;
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim().toLowerCase();
  if (!host || host === oficial) return null;
  const destino = `https://${oficial}${request.nextUrl.pathname}${request.nextUrl.search}`;
  return NextResponse.redirect(destino, 308);
}
