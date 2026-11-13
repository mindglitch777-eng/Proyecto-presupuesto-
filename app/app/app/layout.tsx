import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { ConfigFaltante } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Control en el momento (el token puede tener hasta una hora): sin sesión → entrar; sin acceso → suscribirme.
// La base igual no devuelve datos a quien no tiene acceso; esto es para mostrar la pantalla correcta.
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  let destino: string | null = null;
  try {
    const supabase = await supabaseServidor();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) destino = "/entrar?siguiente=%2Fapp";
    else {
      const { data: estado } = await supabase.rpc("mi_estado");
      if (estado && !["trial", "active", "past_due"].includes(String(estado))) destino = "/suscribirme";
    }
  } catch (e) {
    if (!(e instanceof ConfigFaltante)) throw e;
  }
  if (destino) redirect(destino);
  return <>{children}</>;
}
