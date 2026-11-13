import { createBrowserClient } from "@supabase/ssr";
import { configPublica } from "./config";

/** Cliente para el navegador (usa la clave pública y la sesión de la persona). */
export function supabaseNavegador() {
  const { url, clave } = configPublica();
  return createBrowserClient(url, clave);
}
