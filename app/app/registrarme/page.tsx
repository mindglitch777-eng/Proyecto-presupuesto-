import type { Metadata } from "next";
import { FormRegistro } from "@/components/auth/FormRegistro";
import { MarcoAuth, SinConexion } from "@/components/auth/Marco";
import { ConfigFaltante, configPublica } from "@/lib/supabase/config";
import { UtmCapture } from "@/components/UtmCapture";

export const metadata: Metadata = { title: "Crear mi cuenta · En Claro", robots: { index: false } };

export default function Registrarme() {
  try {
    configPublica();
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    throw e;
  }
  return (
    <MarcoAuth titulo="Empezá tus 14 días gratis" bajada="Sin tarjeta. En 5 minutos tenés tu número del día.">
      <UtmCapture />
      <FormRegistro />
    </MarcoAuth>
  );
}
