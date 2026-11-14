import type { Metadata } from "next";
import { Pantalla } from "@/components/app/Pantalla";
import { Fiados } from "@/components/app/Fiados";
import { SinConexion } from "@/components/auth/Marco";
import { obtenerDatos } from "@/lib/datos";
import { ConfigFaltante } from "@/lib/supabase/config";
import { hoyArgentina } from "@/lib/fechas";
import { guardarCliente, movimiento, recordado } from "../acciones";

export const metadata: Metadata = { title: "Fiados · En Claro", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PaginaFiados({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const ver = (await searchParams).ver;
  let d;
  try {
    const datos = await obtenerDatos();
    const [negocio, clientes] = await Promise.all([datos.negocio(), datos.clientes()]);
    d = { negocio, clientes };
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    throw e;
  }
  return (
    <Pantalla seccion="fiados" negocio={d.negocio.nombre}>
      <Fiados clientes={d.clientes} hoy={hoyArgentina()} filtroInicial={ver === "cobran" ? "cobran" : ver === "atrasados" ? "atrasados" : "todos"} acciones={{ guardarCliente, movimiento, recordado }} />
    </Pantalla>
  );
}
