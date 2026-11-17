import type { Metadata } from "next";
import { FormRegistro } from "@/components/auth/FormRegistro";
import { MarcoAuth, SinConexion } from "@/components/auth/Marco";
import { ConfigFaltante, configPublica } from "@/lib/supabase/config";
import { lugaresQueQuedan } from "@/lib/lugares";
import { LUGARES_FUNDADORES } from "@/lib/listaEspera";

export const metadata: Metadata = {
  title: "Socios fundadores · En Claro",
  description: `Los primeros ${LUGARES_FUNDADORES} pagan $12.900 por mes para siempre. 14 días gratis.`,
};
// El contador se vuelve a pedir a la base cada 30 segundos como máximo.
export const revalidate = 30;

// Link para mandar a los interesados: los primeros 100 que se registran por acá quedan como fundadores ($12.900 para siempre).
// El cupo lo controla la base al crear la cuenta; esta página solo muestra cuántos quedan.
export default async function Fundadores() {
  try {
    configPublica();
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    throw e;
  }
  const quedan = await lugaresQueQuedan();
  const lleno = quedan === 0;
  const ocupados = quedan === null ? null : LUGARES_FUNDADORES - quedan;
  if (lleno) {
    return (
      <MarcoAuth titulo="Se ocuparon los 100 lugares de fundador" bajada="Gracias por el interés. Igual podés probar En Claro 14 días gratis.">
        <p className="text-[16px] leading-[1.6] text-g1">Desde ahora el precio es <strong>$19.900 por mes</strong>, y los primeros 14 días no pagás nada.</p>
        <a href="/registrarme" className="min-h-[52px] w-full rounded-xl bg-verde px-6 py-4 text-center text-[17px] font-semibold text-white">Probalo 14 días gratis</a>
      </MarcoAuth>
    );
  }
  return (
    <MarcoAuth titulo="Socio fundador de En Claro" bajada={`Los primeros ${LUGARES_FUNDADORES} pagan $12.900 por mes para siempre (después, $19.900). Y empezás con 14 días gratis, sin tarjeta.`}>
      <div className="flex flex-col gap-2 rounded-2xl border border-ambar/50 bg-crema px-4 py-4" role="status">
        <p className="font-display text-[22px] font-extrabold text-tinta">{quedan === null ? `Solo ${LUGARES_FUNDADORES} lugares` : `Quedan ${quedan} de ${LUGARES_FUNDADORES} lugares`}</p>
        <div className="h-2 overflow-hidden rounded-full bg-white" aria-hidden="true"><div className="h-full rounded-full bg-ambar" style={{ width: `${Math.max(3, ((ocupados ?? 0) / LUGARES_FUNDADORES) * 100)}%` }} /></div>
        <p className="text-[14px] text-oro2">El precio de fundador te queda para siempre, aunque después suba.</p>
      </div>
      <FormRegistro fundador />
    </MarcoAuth>
  );
}
