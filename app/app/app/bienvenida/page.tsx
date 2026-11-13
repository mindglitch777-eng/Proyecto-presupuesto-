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
    <Bienvenida
      inicial={{ nombre: negocio?.name ?? "", rubro: negocio?.rubro ?? null, ciudad: negocio?.ciudad ?? "" }}
      acciones={{ guardarNegocio, guardarFijos, guardarProductos, terminar }}
      urlApp={url}
    />
  );
}
