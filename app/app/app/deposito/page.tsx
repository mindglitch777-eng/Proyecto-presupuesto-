import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Pantalla } from "@/components/app/Pantalla";
import { Deposito } from "@/components/app/Deposito";
import { SinConexion } from "@/components/auth/Marco";
import { obtenerDatos, SinAcceso } from "@/lib/datos";
import { ConfigFaltante } from "@/lib/supabase/config";
import { hoyArgentina } from "@/lib/fechas";
import { accionDormido } from "../acciones";

export const metadata: Metadata = { title: "Depósito · En Claro", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PaginaDeposito() {
  let d;
  try {
    const datos = await obtenerDatos();
    const [negocio, productos] = await Promise.all([datos.negocio(), datos.productos()]);
    d = { negocio, productos };
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    if (e instanceof SinAcceso) redirect("/suscribirme");
    throw e;
  }
  return (
    <Pantalla seccion="deposito" negocio={d.negocio.nombre}>
      <Deposito productos={d.productos} hoy={hoyArgentina()} dias={d.negocio.diasDormida} redondeo={d.negocio.redondeo} accion={accionDormido} />
    </Pantalla>
  );
}
