import "server-only";

/** Falta una variable de entorno: el mensaje dice cuál y dónde cargarla. */
export class ConfigFaltante extends Error {}

function config() {
  // SUPABASE_URL se lee al ejecutar; NEXT_PUBLIC_SUPABASE_URL (la del brief) también sirve.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const faltan = [!url && "NEXT_PUBLIC_SUPABASE_URL", !key && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean);
  if (faltan.length || !url || !key) {
    throw new ConfigFaltante(`Falta configurar ${faltan.join(" y ")}. Cargalas en Netlify: Site configuration → Environment variables (valores en Supabase → Project Settings → API).`);
  }
  return { url: url.replace(/\/$/, ""), key };
}

/**
 * Llama a una función SQL de Supabase (PostgREST /rpc) con la clave de servidor.
 * Solo se usa desde el servidor: la clave nunca llega al navegador.
 */
export async function rpc<T>(nombre: string, args: Record<string, unknown>, opciones: { revalidate?: number } = {}): Promise<T> {
  const { url, key } = config();
  const res = await fetch(`${url}/rest/v1/rpc/${nombre}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    ...(opciones.revalidate ? { next: { revalidate: opciones.revalidate } } : { cache: "no-store" as const }),
  });
  if (!res.ok) throw new Error(`Supabase respondió ${res.status} en ${nombre}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}
