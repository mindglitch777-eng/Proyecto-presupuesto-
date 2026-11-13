import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ConfigFaltante } from "./config";

/** Cliente con la clave de servicio: SOLO en el servidor, para lo que la persona no puede escribir (costos de IA, pagos). */
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new ConfigFaltante("NEXT_PUBLIC_SUPABASE_URL");
  if (!clave) throw new ConfigFaltante("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}
