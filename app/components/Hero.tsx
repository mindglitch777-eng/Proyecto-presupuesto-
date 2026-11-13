import { Caja, Subida, Tilde } from "./Iconos";

const dias = [63, 100, 37, 9, 52, 73, 79];

export function Hero() {
  return (
    <section className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-14 px-5 pb-14 pt-12 sm:pt-16">
      <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-6">
        <span className="inline-flex items-center gap-2 self-start rounded-full border border-linea bg-white py-[7px] pl-2 pr-3.5 text-sm font-semibold text-g1 shadow-[0_1px_2px_rgba(15,31,23,0.05)]">
          <span className="rounded-full bg-menta px-2 py-[3px] text-xs font-bold text-hoja">Nuevo</span>
          Para kioscos, almacenes y dietéticas
        </span>
        <h1 className="font-display text-[clamp(38px,5.6vw,66px)] font-extrabold leading-[1.04] tracking-[-0.035em] text-balance">
          Vendés un montón. <span className="text-hoja">¿Pero sabés si te quedó plata?</span>
        </h1>
        <p className="max-w-[540px] text-[19px] leading-[1.6] text-g2">
          En Claro te hace las cuentas que tu cuaderno no te hace: cuánto te quedó, a quién cobrarle y a cuánto vender. En 5 minutos por día, desde el celular.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="#calculadora" className="rounded-xl bg-verde px-6 py-4 text-[17px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(14,59,42,0.55)] hover:bg-hoja">Calculá tu número del día gratis</a>
          <a href="#funciones" className="rounded-xl border border-linea2 bg-white px-[22px] py-4 text-[17px] font-semibold text-tinta hover:border-hoja">Ver cómo funciona</a>
        </div>
        <ul className="flex flex-wrap gap-x-[22px] gap-y-2 text-sm text-g2">
          {["14 días gratis", "Sin tarjeta", "Cancelás cuando quieras"].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5"><Tilde />{t}</li>
          ))}
        </ul>
      </div>

      {/* Teléfono con la pantalla "Tu día" (montos de ejemplo) */}
      <div className="relative flex min-w-0 flex-[1_1_360px] justify-center py-5" aria-hidden="true">
        <div className="absolute inset-x-0 bottom-0 top-10 rounded-[40px] bg-menta bg-[radial-gradient(#cfe3d6_1.2px,transparent_1.2px)] [background-size:18px_18px]" />
        <div className="relative w-[290px] max-w-full rounded-[46px] bg-tinta p-2.5 shadow-[0_40px_80px_-24px_rgba(15,31,23,0.45)]">
          <div className="flex flex-col gap-2.5 overflow-hidden rounded-[37px] bg-papel px-3.5 pb-5 pt-[18px]">
            <div className="-mt-2 h-[22px] w-[84px] self-center rounded-full bg-tinta" />
            <div className="flex items-center justify-between">
              <span className="font-display text-[17px] font-extrabold">Tu día</span>
              <span className="rounded-full border border-linea bg-white px-[7px] py-[3px] text-[10px] font-semibold text-g2">Ejemplo</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-[20px] bg-verde p-4 text-white">
              <span className="text-[11px] font-medium text-salvia">Hoy te quedaron libres</span>
              <span className="font-display text-[32px] font-extrabold tracking-[-0.02em]">$40.667</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-full rounded-full bg-ambar" /></div>
              <span className="text-[11px] text-[#d7e6dc]">Pasaste tu número del día por $64.889</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-2xl border border-linea bg-white p-3">
              <span className="text-[11px] font-semibold text-g2">Últimos 7 días</span>
              <div className="flex h-[54px] items-end gap-1.5">
                {dias.map((h, i) => (
                  <div key={i} style={{ height: `${h}%` }} className={`flex-1 rounded ${i === 3 ? "bg-rosa" : i === 6 ? "bg-hoja" : "bg-menta2"}`} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border border-linea bg-white px-3 py-2.5">
              <span className="flex size-[30px] flex-none items-center justify-center rounded-[10px] bg-crema"><Subida /></span>
              <span className="text-xs leading-[1.35]"><strong>3 precios</strong> para actualizar</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border border-linea bg-white px-3 py-2.5">
              <span className="flex size-[30px] flex-none items-center justify-center rounded-[10px] bg-[#f0f2ef]"><Caja size={16} color="#4F6057" sw={2.2} /></span>
              <span className="text-xs leading-[1.35]"><strong>$64.300</strong> dormidos en el depósito</span>
            </div>
          </div>
        </div>
        <div className="absolute left-0 top-24 flex items-center gap-2.5 rounded-2xl border border-linea bg-white px-3.5 py-3 shadow-[0_16px_40px_-12px_rgba(15,31,23,0.25)]">
          <span className="size-2.5 rounded-full bg-hoja" />
          <span className="flex flex-col gap-px"><span className="text-[11px] text-g2">Hoy cobra Marta</span><strong className="text-[15px]">Recordale $18.000</strong></span>
        </div>
        <div className="absolute bottom-[70px] right-0 flex flex-col gap-0.5 rounded-2xl border border-linea bg-white px-3.5 py-3 shadow-[0_16px_40px_-12px_rgba(15,31,23,0.25)]">
          <span className="text-[11px] text-g2">Yerba 1 kg · vendela a</span>
          <span className="flex items-baseline gap-2"><span className="text-[13px] text-g3 line-through">$4.900</span><strong className="font-display text-xl text-hoja">$6.150</strong></span>
        </div>
      </div>
    </section>
  );
}
