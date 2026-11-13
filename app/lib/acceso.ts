// Reglas de acceso para la interfaz (no son seguridad: la barrera real es has_access() en la base).
// El estado sale del token (claim account_status, que agrega el hook de Supabase).

export type Estado = "trial" | "active" | "past_due" | "expired" | "cancelled" | "blocked" | "none";
const CON_ACCESO: Estado[] = ["trial", "active", "past_due"];
const SIN_ACCESO: Estado[] = ["expired", "cancelled", "blocked"];

/** Estado del token. Devuelve null si el token no trae el dato (el hook todavía no está activado). */
export function estadoDeClaims(claims: Record<string, unknown> | null | undefined): Estado | null {
  const e = claims?.account_status;
  return typeof e === "string" && [...CON_ACCESO, ...SIN_ACCESO, "none"].includes(e) ? (e as Estado) : null;
}

/** Solo rutas internas: evita que un link armado mande a otro sitio después de entrar. */
export function rutaSegura(ruta: string | null | undefined, porDefecto = "/app"): string {
  if (!ruta || !ruta.startsWith("/") || ruta.startsWith("//") || ruta.includes("\\") || /[\r\n]/.test(ruta)) return porDefecto;
  return ruta;
}

/** A dónde mandar a esta persona según dónde quiere ir. null = que siga. */
export function destino(ruta: string, sesion: boolean, estado: Estado | null): string | null {
  const privada = ruta === "/app" || ruta.startsWith("/app/");
  const entrada = ruta === "/entrar" || ruta === "/registrarme";
  const tieneAcceso = estado === null || CON_ACCESO.includes(estado);
  if (privada) {
    if (!sesion) return `/entrar?siguiente=${encodeURIComponent(ruta)}`;
    if (!tieneAcceso) return "/suscribirme";
    return null;
  }
  if (ruta === "/suscribirme") {
    if (!sesion) return "/entrar?siguiente=%2Fsuscribirme";
    return tieneAcceso ? "/app" : null;
  }
  if (entrada && sesion) return tieneAcceso ? "/app" : "/suscribirme";
  return null;
}

/** Mensajes de error de Supabase Auth en lenguaje simple. */
export function traducirError(error: { message?: string; code?: string } | null | undefined): string {
  const m = (error?.message ?? "").toLowerCase();
  const c = (error?.code ?? "").toLowerCase();
  if (c === "invalid_credentials" || m.includes("invalid login credentials")) return "El mail o la contraseña no son correctos.";
  if (c === "email_not_confirmed" || m.includes("email not confirmed")) return "Todavía no confirmaste tu mail. Revisá tu casilla y la carpeta de spam.";
  if (c === "user_already_exists" || m.includes("already registered")) return "Ya hay una cuenta con ese mail. Probá entrar.";
  if (c === "weak_password" || m.includes("at least") || m.includes("weak")) return "La contraseña tiene que tener al menos 8 caracteres.";
  if (c.includes("rate_limit") || m.includes("rate limit") || m.includes("security purposes")) return "Pediste muchos mails seguidos. Esperá unos minutos y probá de nuevo.";
  if (c === "same_password" || m.includes("different from the old")) return "La contraseña nueva tiene que ser distinta de la anterior.";
  if (m.includes("session missing")) return "El link venció. Pedí uno nuevo desde «Me olvidé la contraseña».";
  if (m.includes("failed to fetch") || m.includes("network") || m.includes("fetch failed")) return "No se pudo conectar. Revisá tu conexión y probá de nuevo.";
  if (m.includes("expired") || m.includes("invalid") && m.includes("token")) return "El link venció o ya se usó. Pedí uno nuevo.";
  return "No se pudo completar. Probá de nuevo en un rato.";
}

export const emailValido = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
export const CLAVE_MINIMA = 8;
