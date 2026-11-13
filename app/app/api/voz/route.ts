import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { entenderCierre } from "@/lib/voz";
import { LIMITE_VOZ_POR_DIA, entenderConClaude } from "@/lib/ia";
import { obtenerDatos, modoPrueba } from "@/lib/datos";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hoyArgentina } from "@/lib/fechas";

// Recibe lo que la persona dijo (texto ya transcripto por el navegador) y devuelve el cierre ordenado para confirmar.
const pedido = z.object({ texto: z.string().trim().min(1).max(1500) });

export async function POST(request: NextRequest) {
  const cuerpo = await request.json().catch(() => null);
  const v = pedido.safeParse(cuerpo);
  if (!v.success) return NextResponse.json({ ok: false, mensaje: "No te escuché bien. Probá de nuevo o escribilo." }, { status: 400 });

  const prueba = await modoPrueba();
  if (!prueba) {
    const { data } = await (await supabaseServidor()).auth.getClaims().catch(() => ({ data: null }));
    if (!data?.claims?.sub) return NextResponse.json({ ok: false, mensaje: "Entrá de nuevo a tu cuenta." }, { status: 401 });
  }
  const datos = await obtenerDatos();
  const [negocio, productos] = await Promise.all([datos.negocio(), datos.productos()]);
  const nombres = productos.map((p) => p.nombre);
  const local = entenderCierre(v.data.texto, nombres);
  const aIds = (ns: string[]) => productos.filter((p) => ns.includes(p.nombre)).map((p) => p.id);

  // Claude solo si hay clave y no se pasó del límite del día; si no, alcanza con el lector propio.
  if (!prueba && process.env.ANTHROPIC_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = supabaseAdmin();
      const desde = new Date(Date.parse(hoyArgentina() + "T03:00:00Z")).toISOString();
      const { count } = await admin.from("ai_calls").select("id", { count: "exact", head: true }).eq("business_id", negocio.id).eq("kind", "voz").gte("created_at", desde);
      if ((count ?? 0) < LIMITE_VOZ_POR_DIA) {
        const ia = await entenderConClaude(v.data.texto, nombres);
        if (ia) {
          await admin.from("ai_calls").insert({ business_id: negocio.id, kind: "voz", tokens_in: ia.tokensEntrada, tokens_out: ia.tokensSalida, cost_usd: ia.costoUsd });
          return NextResponse.json({ ok: true, cierre: { ...ia.cierre, productos: aIds(ia.cierre.productos) } });
        }
      }
    } catch {
      // si falla, sigue con el lector propio
    }
  }
  return NextResponse.json({ ok: true, cierre: { ...local, productos: aIds(local.productos) } });
}
