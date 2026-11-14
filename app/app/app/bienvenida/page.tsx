import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bienvenida } from "@/components/app/Bienvenida";
import { SinConexion } from "@/components/auth/Marco";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { ConfigFaltante } from "@/lib/supabase/config";
import type { Rubro } from "@/lib/onboarding";
import { guardarFijos, guardarNegocio, guardarProductos, terminar } from "./acciones";

export const metadata: Metadata = { title: "Bienvenido · En Claro", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PaginaBienvenida() {
  let negocio: { name: string; rubro: Rubro | null; ciudad: string | null; onboarding_completed_at: string | null } | null = null;
  try {
    const supabase = await supabaseServidor();
    const { data } = await supabase.from("businesses").select("name, rubro, ciudad, onboarding_completed_at").maybeSingle();
    negocio = data;
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    throw e;
  }
  if (negocio?.onboarding_completed_at) redirect("/app");
  const url = (process.env.APP_URL || process.env.URL || "https://enclaro.netlify.app") + "/app";
  return (
    <>
    <Bienvenida
      inicial={{ nombre: negocio?.name ?? "", rubro: negocio?.rubro ?? null, ciudad: negocio?.ciudad ?? "" }}
      acciones={{ guardarNegocio, guardarFijos, guardarProductos, terminar }}
      urlApp={url}
    />
    {/* Quien se registró a medias tiene que poder salir. pb-36: que no lo tape la barra fija de "Seguir" (P-13). */}
    <form action="/auth/salir" method="post" className="mx-auto max-w-md px-4 pb-36 text-center">
      <button type="submit" className="min-h-[48px] cursor-pointer px-4 text-[15px] font-semibold text-g1 underline">Salir de mi cuenta</button>
    </form>
    </>
  );
}
