import type { Metadata } from "next";
import { FormClave } from "@/components/auth/FormClave";
import { MarcoAuth, SinConexion } from "@/components/auth/Marco";
import { ConfigFaltante, configPublica } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Recuperar contraseña · En Claro", robots: { index: false } };

export default function Recuperar() {
  try {
    configPublica();
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    throw e;
  }
  return (
    <MarcoAuth titulo="¿Te olvidaste la contraseña?" bajada="Escribí tu mail y te mandamos un link para elegir una nueva.">
      <FormClave modo="pedir" />
    </MarcoAuth>
  );
}
