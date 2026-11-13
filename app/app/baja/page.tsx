import type { Metadata } from "next";
import { PaginaLegal } from "@/components/PaginaLegal";
import { FormularioBaja } from "@/components/FormularioBaja";

export const metadata: Metadata = { title: "Darme de baja · En Claro" };

export default function Baja() {
  return (
    <PaginaLegal titulo="Darme de baja">
      <p>Poné el WhatsApp con el que te anotaste y borramos tus datos de la lista de espera. Te damos un número de trámite.</p>
      <FormularioBaja />
    </PaginaLegal>
  );
}
