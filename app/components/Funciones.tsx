import { Camara, Caja, Microfono, Persona } from "./Iconos";

const tarjeta = "flex flex-col gap-5 rounded-3xl border border-linea bg-white p-7";
const icono = "flex size-11 items-center justify-center rounded-xl";
const titulo = "mt-1 font-display text-[22px] font-bold tracking-[-0.01em]";
const texto = "text-base leading-[1.55] text-g2";

export function Funciones() {
  return (
    <section id="funciones" className="mx-auto flex max-w-[1160px] scroll-mt-20 flex-col gap-9 px-5 pb-20 pt-14">
      <div className="flex max-w-[680px] flex-col gap-3">
        <span className="text-[13px] font-bold tracking-[0.08em] text-hoja">QUÉ HACE</span>
        <h2 className="font-display text-[clamp(28px,3.8vw,44px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-balance">Lo que el cuaderno no te dice, En Claro te lo dice.</h2>
      </div>
      <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
        <article className={tarjeta}>
          <div className="flex flex-col gap-2">
            <span className={`${icono} bg-menta`}><Microfono /></span>
            <h3 className={titulo}>Cerrás el día hablando</h3>
            <p className={texto}>Le contás al celular cuánto vendiste y qué pagaste. Te dice cuánto te quedó de verdad.</p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl bg-papel p-4">
            <span className="self-start rounded-[14px_14px_14px_4px] border border-linea bg-white px-3 py-2.5 text-sm leading-[1.45] text-g1">“Vendí 186 mil, le pagué 92 al proveedor y 8 de flete.”</span>
            <div className="flex items-baseline justify-between gap-3"><span className="text-sm text-g2">Te quedaron libres</span><strong className="font-display text-[26px] text-hoja">$40.667</strong></div>
          </div>
        </article>

        <article className={tarjeta}>
          <div className="flex flex-col gap-2">
            <span className={`${icono} bg-menta`}><Persona /></span>
            <h3 className={titulo}>Cobrás los fiados sin vergüenza</h3>
            <p className={texto}>Te avisa quién cobra hoy y le manda el recordatorio por WhatsApp con un toque.</p>
          </div>
          <ul className="flex flex-col rounded-2xl bg-papel px-4 py-2">
            {[["bg-hoja", "Marta · cobra hoy", "$18.000"], ["bg-mostaza", "Juan · hace 22 días", "$7.500"], ["bg-rojo", "El de la moto · 41 días", "$45.000"]].map(([c, n, m], i) => (
              <li key={n} className={`flex items-center gap-2.5 py-[9px] text-[15px] ${i < 2 ? "border-b border-linea" : ""}`}>
                <span className={`size-[9px] rounded-full ${c}`} />
                <span className="flex-1">{n}</span>
                <strong>{m}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className={tarjeta}>
          <div className="flex flex-col gap-2">
            <span className={`${icono} bg-crema`}><Camara /></span>
            <h3 className={titulo}>Precios al día con una foto</h3>
            <p className={texto}>Le sacás foto a la factura del proveedor y te dice a cuánto vender. Y te arma los carteles.</p>
          </div>
          <ul className="flex flex-col rounded-2xl bg-papel px-4 py-2">
            {[["Yerba 1 kg", "$4.900", "$6.150"], ["Gaseosa 2,25 L", "$3.200", "$3.750"], ["Galletitas dulces", "$1.500", "$2.000"]].map(([n, a, b], i) => (
              <li key={n} className={`flex items-center gap-2.5 py-[9px] text-[15px] ${i < 2 ? "border-b border-linea" : ""}`}>
                <span className="flex-1">{n}</span>
                <span className="text-sm text-g3 line-through">{a}</span>
                <strong className="text-hoja">{b}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="flex flex-col gap-5 rounded-3xl bg-verde p-7 text-white">
          <div className="flex flex-col gap-2">
            <span className={`${icono} bg-white/10`}><Caja /></span>
            <h3 className={titulo}>Encontrás la plata dormida</h3>
            <p className="text-base leading-[1.55] text-salvia2">Lo que está en el depósito sin venderse hace un mes, sumado. Y qué hacer con eso.</p>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
            <span className="text-sm text-salvia2">Tenés inmovilizados</span>
            <strong className="font-display text-[34px] tracking-[-0.02em] text-ambar">$64.300</strong>
            <span className="text-[13px] text-salvia">en 3 productos · ejemplo</span>
          </div>
        </article>
      </div>
    </section>
  );
}
