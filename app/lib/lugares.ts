import { LUGARES_FUNDADORES } from "@/lib/listaEspera";

/** Lugares de socio fundador que quedan (lo cuenta la base), o null si no hay base configurada o no responde. */
export async function lugaresQueQuedan(): Promise<number | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !clave) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/lugares_fundadores`, {
      method: "POST",
      headers: { apikey: clave, ...(clave.startsWith("sb_") ? {} : { Authorization: `Bearer ${clave}` }), "Content-Type": "application/json" },
      body: "{}",
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const n = Number(await res.json());
    return Number.isFinite(n) ? Math.max(0, Math.min(LUGARES_FUNDADORES, n)) : null;
  } catch {
    return null;
  }
}
