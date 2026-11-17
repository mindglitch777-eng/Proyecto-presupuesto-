import type { Metadata } from "next";
import { MarcoAuth } from "@/components/auth/Marco";

export const metadata: Metadata = { title: "Contraseña olvidada · En Claro", robots: { index: false } };

// Decisión del dueño: las contraseñas no se recuperan (no hay mails). Se avisa al crear la cuenta y acá.
export default function Recuperar() {
  return (
    <MarcoAuth titulo="Las contraseñas no se pueden recuperar" bajada="Por seguridad, En Claro no muestra ni cambia contraseñas por mail.">
      <p className="text-[16px] leading-[1.6] text-g1">Si te olvidaste la tuya, creá una cuenta nueva con otro mail. Cuando la crees, anotá la contraseña en un lugar seguro: tocá «Ver» para revisar que esté bien escrita.</p>
      <a href="/registrarme" className="min-h-[52px] w-full rounded-xl bg-verde px-6 py-4 text-center text-[17px] font-semibold text-white">Crear una cuenta nueva</a>
      <a href="/entrar" className="min-h-[48px] w-full rounded-xl border border-linea2 bg-white px-6 py-3 text-center text-base font-semibold text-tinta">Volver a entrar</a>
    </MarcoAuth>
  );
}
