import type { Metadata } from "next";
import { MarcoAuth, SinConexion } from "@/components/auth/Marco";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { ConfigFaltante } from "@/lib/supabase/config";
import { pesos } from "@/lib/formato";

export const metadata: Metadata = { title: "Suscribirme · En Claro", robots: { index: false } };
export const dynamic = "force-dynamic";

type Resumen = { negocio: string; gastos_fijos_mes: number; cierres: number; ultimo_cierre: string | null; productos: number; fiados_pendientes: number };

// Vencido: ve su resumen en solo lectura. El botón de pago se habilita en la fase de pagos.
export default async function Suscribirme() {
  let r: Resumen | null = null;
  try {
    const supabase = await supabaseServidor();
    const { data } = await supabase.from("resumen_bloqueado").select("*").maybeSingle();
    r = data as Resumen | null;
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    throw e;
  }
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
      <p role="note" className="rounded-xl border border-ambar/50 bg-crema px-4 py-3 text-[15px] text-oro2">Estamos terminando de habilitar el pago con Mercado Pago. Te avisamos apenas esté.</p>
      <form action="/auth/salir" method="post"><button type="submit" className="min-h-[48px] w-full cursor-pointer rounded-xl border border-linea2 bg-white px-6 py-3 text-base font-semibold text-tinta hover:bg-suave">Salir</button></form>
    </MarcoAuth>
  );
}
