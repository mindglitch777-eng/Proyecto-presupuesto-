import { Escudo, Tilde } from "./Iconos";
import { LUGARES_FUNDADORES } from "@/lib/listaEspera";

const incluye = ["14 días gratis, sin tarjeta", "Todas las funciones, sin límites raros", "Pagás con Mercado Pago: tarjeta o saldo", "Cancelás cuando quieras, con un botón"];

/** `lugares` sale de la base (null si todavía no hay base configurada: no inventamos un número). */
export function Precio({ lugares }: { lugares: number | null }) {
  const ocupados = lugares === null ? 0 : LUGARES_FUNDADORES - lugares;
  return (
    <section id="precio" className="scroll-mt-16 bg-suave">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-12 px-5 py-20">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
          <span className="text-[13px] font-bold tracking-[0.08em] text-hoja">PRECIO</span>
          <h2 className="font-display text-[clamp(28px,3.8vw,44px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-balance">Si no te ahorra más de lo que cuesta, no lo pagues.</h2>
          <div className="flex items-start gap-3.5 rounded-2xl border border-linea bg-white p-[18px]">
            <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-menta"><Escudo /></span>
            <span className="text-base leading-[1.55] text-g1"><strong className="text-tinta">Garantía de 30 días.</strong> Si en el primer mes pago no recuperaste lo que pagaste, te devolvemos la plata.</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5 rounded-[28px] border border-linea bg-white p-6 shadow-[0_24px_60px_-32px_rgba(15,31,23,0.35)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <strong className="font-display text-lg">Socio fundador</strong>
            <span className="rounded-full bg-crema px-2.5 py-[5px] text-xs font-bold text-oro2">Solo los primeros {LUGARES_FUNDADORES}</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-[60px] font-extrabold leading-none tracking-[-0.04em]">$7.900</span>
            <span className="text-base text-g2">/ mes, para siempre</span>
          </div>
          <span className="-mt-2.5 text-[15px] text-g2">Después, $12.900 por mes.</span>
          <div className="h-px bg-linea" />
          <ul className="flex flex-col gap-3 text-base text-g1">
            {incluye.map((t) => (
              <li key={t} className="flex items-center gap-2.5"><Tilde size={18} />{t}</li>
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            <div className="h-2 overflow-hidden rounded-full bg-suave" role="img" aria-label={lugares === null ? "Lugares limitados" : `Quedan ${lugares} de ${LUGARES_FUNDADORES} lugares`}>
              <div className="h-full rounded-full bg-ambar" style={{ width: `${Math.max(2, ocupados)}%` }} />
            </div>
            <span className="text-[13px] text-g2">{lugares === null ? `Lugares limitados: solo los primeros ${LUGARES_FUNDADORES}` : `Quedan ${lugares} de ${LUGARES_FUNDADORES} lugares`}</span>
          </div>
          <a href="#calculadora" className="rounded-xl bg-verde px-[22px] py-4 text-center text-[17px] font-semibold text-white hover:bg-hoja">Quiero mi lugar</a>
        </div>
      </div>
    </section>
  );
}
