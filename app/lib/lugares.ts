import { rpc } from "@/lib/supabase";
import { LUGARES_FUNDADORES } from "@/lib/listaEspera";

/** Lugares de socio fundador que quedan, o null si todavía no hay base configurada. */
export async function lugaresQueQuedan(): Promise<number | null> {
  try {
    const n = await rpc<number>("lugares_fundadores", {}, { revalidate: 60 });
    return Math.max(0, Math.min(LUGARES_FUNDADORES, Number(n)));
  } catch {
    return null;
  }
}
