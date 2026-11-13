import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Iconos";
import { SinConexion } from "@/components/auth/Marco";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { ConfigFaltante } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Tu día · En Claro", robots: { index: false } };
export const dynamic = "force-dynamic";

const dias = (hasta: string | null) => (hasta ? Math.max(0, Math.ceil((new Date(hasta).getTime() - Date.now()) / 86_400_000)) : null);

export default async function Inicio() {
  let negocio: { name: string; ciudad: string | null; onboarding_completed_at: string | null } | null = null;
  let restan: number | null = null;
  try {
    const supabase = await supabaseServidor();
    const [{ data: b }, { data: s }] = await Promise.all([
      supabase.from("businesses").select("name, ciudad, onboarding_completed_at").maybeSingle(),
      supabase.from("subscriptions").select("status, trial_ends_at").maybeSingle(),
    ]);
    negocio = b;
    restan = s?.status === "trial" ? dias(s.trial_ends_at) : null;
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    throw e;
  }
  if (negocio && !negocio.onboarding_completed_at) redirect("/app/bienvenida");
  return (
    <>
      <div className="toldo" aria-hidden="true" />
      <main className="mx-auto flex max-w-[520px] flex-col gap-6 px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2.5"><Logo size={30} /><span className="font-display text-lg font-extrabold">En Claro</span></span>
          <form action="/auth/salir" method="post"><button type="submit" className="min-h-[44px] cursor-pointer rounded-xl px-3 text-[15px] font-semibold text-g1 hover:text-hoja">Salir</button></form>
        </header>
        <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em]">Hola, {negocio?.name ?? "bienvenido"}</h1>
        {restan !== null ? (
          <p className="rounded-xl border border-hoja/30 bg-menta px-4 py-3 text-[15px] text-verde">
            Tu prueba gratis termina {restan === 0 ? "hoy" : restan === 1 ? "mañana" : `en ${restan} días`}.
          </p>
        ) : null}
        <section className="rounded-2xl border border-linea bg-white p-5 text-[17px] leading-[1.6] text-g1">
          <h2 className="font-display text-xl font-bold text-tinta">Estamos armando tu día</h2>
          <p className="mt-2">Acá vas a ver cuánto te quedó, qué producto te deja plata y a quién cobrarle. Ya tenés tu cuenta lista.</p>
        </section>
      </main>
    </>
  );
}
