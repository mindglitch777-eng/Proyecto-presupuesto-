import type { Metadata } from "next";
import { FormEntrar } from "@/components/auth/FormEntrar";
import { MarcoAuth, SinConexion } from "@/components/auth/Marco";
import { ConfigFaltante, configPublica } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Entrar · En Claro", robots: { index: false } };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ siguiente?: string; error?: string }> }) {
  try {
    configPublica();
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    throw e;
  }
  const { siguiente, error } = await searchParams;
  return (
    <MarcoAuth titulo="Entrar a tu negocio" bajada={error ? "El link que usaste venció o ya se usó. Entrá con tu mail y contraseña, o pedí uno nuevo." : "Con tu mail y tu contraseña."}>
      <FormEntrar siguiente={siguiente} />
    </MarcoAuth>
  );
}
