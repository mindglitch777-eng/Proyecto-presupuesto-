import type { Metadata } from "next";
import { Pantalla } from "@/components/app/Pantalla";
import { Ajustes } from "@/components/app/Ajustes";
import { SinConexion } from "@/components/auth/Marco";
import { obtenerDatos } from "@/lib/datos";
import { ConfigFaltante } from "@/lib/supabase/config";
import { guardarAjustes } from "../acciones";

export const metadata: Metadata = { title: "Ajustes · En Claro", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PaginaAjustes() {
  let d;
  try {
    const datos = await obtenerDatos();
    const [negocio, fijos] = await Promise.all([datos.negocio(), datos.fijos()]);
    d = { negocio, fijos };
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    throw e;
  }
  const n = d.negocio;
  return (
    <Pantalla seccion="dia" negocio={n.nombre}>
      <Ajustes inicial={{ nombre: n.nombre, ciudad: n.ciudad, comisionPct: n.comisionPct, alertaPct: n.alertaPct, diasDormida: n.diasDormida, redondeo: n.redondeo, fijos: d.fijos }} guardar={guardarAjustes} />
      <form action="/auth/salir" method="post"><button type="submit" className="min-h-[48px] w-full cursor-pointer rounded-xl border border-linea2 bg-white px-6 text-base font-semibold text-tinta">Salir de mi cuenta</button></form>
    </Pantalla>
  );
}
