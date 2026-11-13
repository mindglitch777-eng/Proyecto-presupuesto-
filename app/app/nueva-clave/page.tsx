import type { Metadata } from "next";
import { FormClave } from "@/components/auth/FormClave";
import { MarcoAuth, SinConexion } from "@/components/auth/Marco";
import { ConfigFaltante, configPublica } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Nueva contraseña · En Claro", robots: { index: false } };

export default function NuevaClave() {
  try {
    configPublica();
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    throw e;
  }
  return (
    <MarcoAuth titulo="Elegí tu contraseña nueva" bajada="Tiene que tener al menos 8 caracteres.">
      <FormClave modo="nueva" />
    </MarcoAuth>
  );
}
