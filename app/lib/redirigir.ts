import { NextResponse, type NextRequest } from "next/server";

/**
 * Manda al navegador a otra pantalla de la app SIN cambiar de dirección (P-07 en PROBLEMAS.md).
 *
 * Por qué existe: la dirección del pedido que ve el servidor puede ser la interna (por ejemplo "localhost" en vez
 * de la que escribió la persona, o sin "www."). El navegador guarda la sesión a nombre de la dirección en la que
 * está: si lo mandamos a otra, la sesión "desaparece". Acá la dirección se arma con la que usó el navegador
 * (cabeceras host / x-forwarded-host), y Next exige que sea completa (con una relativa, el proxy da error 500).
 * Prohibido armar redirecciones con la dirección del pedido: lo controla tests/redirecciones.test.ts.
 */
export function irA(request: NextRequest, ruta: string, estado: 303 | 307 | 308 = 303): NextResponse {
  if (!ruta.startsWith("/") || ruta.startsWith("//") || ruta.includes("\\")) throw new Error(`irA solo acepta rutas de la app: ${ruta}`);
  return NextResponse.redirect(new URL(ruta, origenDelNavegador(request)), estado);
}

/** La dirección que escribió la persona (no la interna del servidor). */
export function origenDelNavegador(request: NextRequest): string {
  const primero = (v: string | null) => (v ?? "").split(",")[0].trim();
  const host = primero(request.headers.get("x-forwarded-host")) || primero(request.headers.get("host")) || request.nextUrl.host;
  const proto = primero(request.headers.get("x-forwarded-proto")) || request.nextUrl.protocol.replace(":", "");
  return `${proto === "https" ? "https" : "http"}://${host}`;
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
