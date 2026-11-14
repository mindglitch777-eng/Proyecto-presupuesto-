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
      <Precios productos={d.productos} hoy={hoyArgentina()} alertaPct={d.negocio.alertaPct} comisionPct={d.negocio.comisionPct} redondeo={d.negocio.redondeo} acciones={{ guardarProducto, vendiHoy }} />
    </Pantalla>
  );
}
