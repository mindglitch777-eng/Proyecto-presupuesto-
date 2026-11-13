import type { Metadata } from "next";
import { PaginaLegal, h2 } from "@/components/PaginaLegal";

export const metadata: Metadata = { title: "Términos · En Claro" };

export default function Terminos() {
  return (
    <PaginaLegal titulo="Términos de uso">
      <p>En Claro es una herramienta para que dueños de kioscos, almacenes y dietéticas entiendan mejor sus números. No es un sistema de facturación, no reemplaza tu caja ni tu contador.</p>
      <h2 className={h2}>La lista de espera</h2>
      <p>Al anotarte nos dejás tu nombre, tu WhatsApp y los datos del negocio que cargues. Te escribimos cuando abramos y, si sos de los primeros 100, te reservamos el precio de socio fundador. Anotarte no te obliga a nada ni tiene costo.</p>
      <h2 className={h2}>Los números de la calculadora</h2>
      <p>El número del día es una cuenta orientativa que se hace con lo que vos ponés. No es una promesa de ganancia ni un consejo contable.</p>
      <h2 className={h2}>Cuando abramos</h2>
      <p>Las condiciones del servicio pago (precio, garantía de 30 días, cancelación con un botón y pago por Mercado Pago) se publican acá antes del primer cobro.</p>
      <h2 className={h2}>Contacto y baja</h2>
      <p>Podés salir de la lista cuando quieras desde <a className="font-semibold text-hoja underline" href="/baja">Darme de baja</a>.</p>
    </PaginaLegal>
  );
}
