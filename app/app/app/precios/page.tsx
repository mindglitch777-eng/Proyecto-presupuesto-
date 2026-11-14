import type { Metadata } from "next";
import { Pantalla } from "@/components/app/Pantalla";
import { Precios } from "@/components/app/Precios";
import { SinConexion } from "@/components/auth/Marco";
import { obtenerDatos } from "@/lib/datos";
import { ConfigFaltante } from "@/lib/supabase/config";
import { hoyArgentina } from "@/lib/fechas";
import { guardarProducto, vendiHoy } from "../acciones";

export const metadata: Metadata = { title: "Precios · En Claro", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PaginaPrecios() {
  let d;
  try {
    const datos = await obtenerDatos();
    const [negocio, productos] = await Promise.all([datos.negocio(), datos.productos()]);
    d = { negocio, productos };
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    throw e;
  }
  return (
    <Pantalla seccion="precios" negocio={d.negocio.nombre}>
      <Precios productos={d.productos} hoy={hoyArgentina()} alertaPct={d.negocio.alertaPct} comisionPct={d.negocio.comisionPct} redondeo={d.negocio.redondeo} acciones={{ guardarProducto, vendiHoy }} arriba={
        <a href="/app/factura" className="flex items-center gap-4 rounded-2xl bg-verde p-5 text-white">
          <span className="flex size-12 flex-none items-center justify-center rounded-full bg-ambar text-tinta"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg></span>
          <span><strong className="block text-[17px]">Sacale foto a la factura</strong><span className="text-[14px] text-salvia2">Te digo a cuánto vender lo que aumentó</span></span>
        </a>
      } />
    </Pantalla>
  );
}
