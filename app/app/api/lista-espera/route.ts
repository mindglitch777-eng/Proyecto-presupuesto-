import { NextResponse } from "next/server";
import { anotarseSchema, normalizarWhatsapp } from "@/lib/listaEspera";
import { ConfigFaltante, rpc } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MENSAJE_GENERICO = "No pudimos guardar tu lugar. Revisá tu conexión y probá de nuevo en un rato.";

export async function POST(req: Request) {
  let cuerpo: unknown;
  try {
    const texto = await req.text();
    if (texto.length > 4000) return NextResponse.json({ error: "El pedido es demasiado grande." }, { status: 413 });
    cuerpo = JSON.parse(texto);
  } catch {
    return NextResponse.json({ error: "No entendimos lo que mandaste. Probá de nuevo." }, { status: 400 });
  }

  const r = anotarseSchema.safeParse(cuerpo);
  if (!r.success) {
    return NextResponse.json({ error: r.error.issues[0]?.message ?? "Revisá los datos." }, { status: 400 });
  }
  const d = r.data;

  // Robots: el campo escondido viene lleno. Respondemos "ok" sin guardar nada.
  if (d.web) return NextResponse.json({ ok: true, numero: 0, yaEstaba: false });

  try {
    const filas = await rpc<{ numero: number; ya_estaba: boolean }[]>("anotarse_lista_espera", {
      p_name: d.nombre,
      p_whatsapp: normalizarWhatsapp(d.whatsapp),
      p_rubro: d.rubro,
      p_ciudad: d.ciudad ?? null,
      p_numero_del_dia: d.numero_del_dia ?? null,
      p_utm_source: d.utm_source ?? null,
      p_utm_content: d.utm_content ?? null,
    });
    const fila = filas[0];
    if (!fila) throw new Error("La función anotarse_lista_espera no devolvió ninguna fila.");
    return NextResponse.json({ ok: true, numero: fila.numero, yaEstaba: fila.ya_estaba });
  } catch (e) {
    console.error("[lista-espera]", e instanceof Error ? e.message : e);
    const config = e instanceof ConfigFaltante;
    return NextResponse.json({ error: MENSAJE_GENERICO, config }, { status: config ? 503 : 500 });
  }
}
