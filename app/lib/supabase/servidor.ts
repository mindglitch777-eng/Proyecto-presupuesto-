import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { configPublica } from "./config";

/** Cliente para el servidor con la sesión de la persona (la RLS de la base decide qué ve). */
export async function supabaseServidor() {
  const { url, clave } = configPublica();
  const jar = await cookies();
  return createServerClient(url, clave, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(lista) {
        try {
          lista.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Desde una página no se pueden escribir cookies; el proxy ya renovó la sesión.
        }
      },
    },
  });
}
