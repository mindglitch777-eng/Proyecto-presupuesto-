import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Pantalla } from "@/components/app/Pantalla";
import { Cierre } from "@/components/app/Cierre";
import { SinConexion } from "@/components/auth/Marco";
import { obtenerDatos, SinAcceso } from "@/lib/datos";
import { ConfigFaltante } from "@/lib/supabase/config";
import { margenDe } from "@/lib/margen";
import { hoyArgentina, sumarDias } from "@/lib/fechas";
import { guardarCierre } from "../acciones";

export const metadata: Metadata = { title: "Cierre · En Claro", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PaginaCierre({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const hoy = hoyArgentina();
  const pedida = (await searchParams).fecha;
  const fecha = pedida && /^\d{4}-\d{2}-\d{2}$/.test(pedida) && pedida <= hoy && pedida >= sumarDias(hoy, -60) ? pedida : hoy;
  let d;
  try {
    const datos = await obtenerDatos();
    const [negocio, fijosMes, productos, uso, cierres, movidos] = await Promise.all([datos.negocio(), datos.fijosMes(), datos.productos(), datos.usoDeProductos(sumarDias(hoy, -30)), datos.cierres(fecha), datos.movidosEn(fecha)]);
    d = { negocio, fijosMes, productos, uso, cierre: cierres.find((c) => c.fecha === fecha) ?? null, movidos };
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    if (e instanceof SinAcceso) redirect("/suscribirme");
    throw e;
  }
  const margenes = d.productos.map((p) => margenDe(p.precio, p.costo)).filter((m): m is number => m !== null);
  const productos = [...d.productos].sort((a, b) => (d.uso[b.id] ?? 0) - (d.uso[a.id] ?? 0) || a.nombre.localeCompare(b.nombre)).map((p) => ({ id: p.id, nombre: p.nombre }));
  return (
    <Pantalla seccion="cierre" negocio={d.negocio.nombre}>
      <Cierre
        key={fecha}
        fecha={fecha}
        hoy={hoy}
        productos={productos}
        comisionPct={d.negocio.comisionPct}
        fijosMes={d.fijosMes}
        margen={margenes.length ? margenes.reduce((s, m) => s + m, 0) / margenes.length : null}
        previo={d.cierre ? { ventas: d.cierre.ventas, tarjeta: d.cierre.tarjeta, gastos: d.cierre.gastos, productos: d.movidos } : null}
        guardar={guardarCierre}
      />
    </Pantalla>
  );
}
