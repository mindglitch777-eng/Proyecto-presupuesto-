import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarcoAuth, SinConexion } from "@/components/auth/Marco";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { ConfigFaltante } from "@/lib/supabase/config";
import { pesos } from "@/lib/formato";

export const metadata: Metadata = { title: "Suscribirme · En Claro", robots: { index: false } };
export const dynamic = "force-dynamic";

type Resumen = { negocio: string; gastos_fijos_mes: number; cierres: number; ultimo_cierre: string | null; productos: number; fiados_pendientes: number };

// Vencido: ve su resumen en solo lectura y cómo seguir (link de pago o WhatsApp). El cobro automático llega en la fase de pagos.
export default async function Suscribirme() {
  let r: Resumen | null = null;
  let tieneAcceso = false;
  let plan: { plan: string; price: number } | null = null;
  try {
    const supabase = await supabaseServidor();
    const [{ data }, { data: estado }, { data: sus }] = await Promise.all([supabase.from("resumen_bloqueado").select("*").maybeSingle(), supabase.rpc("mi_estado"), supabase.from("subscriptions").select("plan, price").maybeSingle()]);
    plan = sus as { plan: string; price: number } | null;
    if (["trial", "active", "past_due"].includes(String(estado))) tieneAcceso = true;
    r = data as Resumen | null;
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    throw e;
  }
  if (tieneAcceso) redirect("/app");
  // Mientras no esté el cobro automático (fase 5): link de pago de Mercado Pago (si está cargado) y WhatsApp del dueño.
  // Cada plan tiene su link: fundador $12.900 (NEXT_PUBLIC_LINK_PAGO_FUNDADOR) y normal $19.900 (NEXT_PUBLIC_LINK_PAGO).
  const crudo = plan?.plan === "fundador" ? process.env.NEXT_PUBLIC_LINK_PAGO_FUNDADOR : process.env.NEXT_PUBLIC_LINK_PAGO;
  const linkPago = /^https:\/\//.test(crudo ?? "") ? crudo! : null;
  const wpp = (process.env.NEXT_PUBLIC_WHATSAPP ?? "").replace(/\D/g, "");
  return (
    <MarcoAuth titulo="Tu prueba terminó" bajada="Tus datos están guardados. Cuando te suscribas, seguís donde dejaste.">
      {r ? (
        <dl className="grid grid-cols-2 gap-3 text-[15px]">
          {[
            ["Negocio", r.negocio],
            ["Gastos fijos del mes", pesos(Number(r.gastos_fijos_mes))],
            ["Cierres cargados", String(r.cierres)],
            ["Productos", String(r.productos)],
            ["Te deben", pesos(Number(r.fiados_pendientes))],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-linea bg-white px-4 py-3"><dt className="text-g2">{k}</dt><dd className="font-display text-xl font-bold text-tinta">{v}</dd></div>
          ))}
        </dl>
      ) : null}
      <div className="flex flex-col gap-3">
        <p className="text-[16px] leading-[1.5] text-g1">{plan?.plan === "fundador" ? <>Sos socio fundador: <strong>$12.900 por mes</strong>, para siempre.</> : <>Tu plan: <strong>{pesos(Number(plan?.price ?? 19900))} por mes</strong>.</>}</p>
        {linkPago ? (
          <a href={linkPago} target="_blank" rel="noopener noreferrer" className="min-h-[52px] w-full rounded-xl bg-verde px-6 py-4 text-center text-[17px] font-semibold text-white">Pagar con Mercado Pago</a>
        ) : null}
        {wpp ? (
          <a href={`https://wa.me/${wpp}?text=${encodeURIComponent(`Hola, se terminó mi prueba de En Claro${r?.negocio ? ` (${r.negocio})` : ""} y quiero seguir usándola.`)}`} target="_blank" rel="noopener noreferrer"
            className={`min-h-[52px] w-full rounded-xl px-6 py-4 text-center text-[17px] font-semibold ${linkPago ? "border border-linea2 bg-white text-tinta" : "bg-verde text-white"}`}>
            {linkPago ? "¿Dudas? Escribinos por WhatsApp" : "Quiero seguir: escribinos por WhatsApp"}
          </a>
        ) : null}
        <p className="text-[14px] text-g2">{linkPago ? "Apenas se acredite el pago, te habilitamos la cuenta y seguís donde dejaste." : "Te pasamos el link de pago de Mercado Pago y te habilitamos la cuenta al toque."}</p>
      </div>
      <form action="/auth/salir" method="post"><button type="submit" className="min-h-[48px] w-full cursor-pointer rounded-xl border border-linea2 bg-white px-6 py-3 text-base font-semibold text-tinta hover:bg-suave">Salir</button></form>
    </MarcoAuth>
  );
}
