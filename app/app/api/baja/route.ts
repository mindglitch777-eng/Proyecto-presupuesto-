import { NextResponse } from "next/server";
import { bajaSchema, normalizarWhatsapp } from "@/lib/listaEspera";
import { ConfigFaltante, rpc } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: "No entendimos lo que mandaste. Probá de nuevo." }, { status: 400 });
  }
  const r = bajaSchema.safeParse(cuerpo);
  if (!r.success) return NextResponse.json({ error: r.error.issues[0]?.message ?? "Revisá el WhatsApp." }, { status: 400 });

  try {
    const tramite = await rpc<string | null>("baja_lista_espera", { p_whatsapp: normalizarWhatsapp(r.data.whatsapp) });
    return NextResponse.json({ ok: true, tramite });
  } catch (e) {
    console.error("[baja]", e instanceof Error ? e.message : e);
    const config = e instanceof ConfigFaltante;
    return NextResponse.json({ error: "No pudimos procesar la baja. Probá de nuevo en un rato o escribinos por WhatsApp.", config }, { status: config ? 503 : 500 });
  }
}
