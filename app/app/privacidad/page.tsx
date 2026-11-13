import type { Metadata } from "next";
import { PaginaLegal, h2 } from "@/components/PaginaLegal";

export const metadata: Metadata = { title: "Privacidad · En Claro" };

export default function Privacidad() {
  return (
    <PaginaLegal titulo="Política de privacidad">
      <h2 className={h2}>Qué guardamos</h2>
      <p>Cuando te anotás en la lista de espera guardamos tu nombre, tu número de WhatsApp, el rubro de tu negocio, tu ciudad si nos la dijiste, el número del día que calculaste y, si venís de un video, cuál fue (para saber qué videos sirven). Nada más.</p>
      <h2 className={h2}>Para qué lo usamos</h2>
      <p>Para escribirte por WhatsApp cuando abramos y para reservarte tu lugar de socio fundador. No usamos tus datos para otra cosa.</p>
      <h2 className={h2}>No los vendemos</h2>
      <p>No vendemos ni compartimos tus datos con terceros para publicidad. La página no usa cookies de seguimiento ni scripts de terceros.</p>
      <h2 className={h2}>Cómo pedir que los borremos</h2>
      <p>Entrá a <a className="font-semibold text-hoja underline" href="/baja">Darme de baja</a> y poné tu WhatsApp: se borran tus datos al instante y te damos un número de trámite. También podés pedirlo por WhatsApp.</p>
      <h2 className={h2}>Cuando abramos la app</h2>
      <p>Vamos a guardar los datos de tu negocio (ventas, gastos, productos y fiados) solo para mostrártelos a vos. Si anotás a tus clientes, sos responsable de tener su permiso. Podrás borrar tu cuenta y todos tus datos desde Ajustes.</p>
    </PaginaLegal>
  );
}
