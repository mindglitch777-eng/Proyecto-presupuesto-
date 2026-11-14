import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Pantalla } from "@/components/app/Pantalla";
import { Factura } from "@/components/app/Factura";
import { SinConexion } from "@/components/auth/Marco";
import { obtenerDatos, SinAcceso } from "@/lib/datos";
import { ConfigFaltante } from "@/lib/supabase/config";
import { aplicarPrecios } from "../acciones";

export const metadata: Metadata = { title: "Factura · En Claro", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PaginaFactura() {
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
    <Pantalla seccion="precios" negocio={d.negocio.nombre}>
      <Factura productos={d.productos.map((p) => ({ id: p.id, nombre: p.nombre, precio: p.precio, costo: p.costo }))} comisionPct={d.negocio.comisionPct} redondeo={d.negocio.redondeo} negocio={d.negocio.nombre} aplicar={aplicarPrecios} />
    </Pantalla>
  );
}
