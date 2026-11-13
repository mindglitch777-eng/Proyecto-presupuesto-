import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Pantalla, tarjeta, tituloSeccion } from "@/components/app/Pantalla";
import { SinConexion } from "@/components/auth/Marco";
import { obtenerDatos } from "@/lib/datos";
import { ConfigFaltante } from "@/lib/supabase/config";
import { promedio, resultadoDelDia, ultimos7, numeroDelDiaDe } from "@/lib/cierre";
import { margenDe, precioViejo } from "@/lib/margen";
import { cobraHoy, saldo } from "@/lib/fiado";
import { dormidos } from "@/lib/dormida";
import { diaCorto, hoyArgentina, sumarDias } from "@/lib/fechas";
import { pesos } from "@/lib/formato";

export const metadata: Metadata = { title: "Tu día · En Claro", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TuDia() {
  let d;
  try {
    const datos = await obtenerDatos();
    const hoy = hoyArgentina();
    const [negocio, fijosMes, cierres, productos, clientes] = await Promise.all([datos.negocio(), datos.fijosMes(), datos.cierres(sumarDias(hoy, -6)), datos.productos(), datos.clientes()]);
    d = { negocio, fijosMes, cierres, productos, clientes, hoy };
  } catch (e) {
    if (e instanceof ConfigFaltante) return <SinConexion />;
    throw e;
  }
  const { negocio, fijosMes, cierres, productos, clientes, hoy } = d;
  if (!negocio.primerUsoTerminado) redirect("/app/bienvenida");

  const margenes = productos.map((p) => margenDe(p.precio, p.costo)).filter((m): m is number => m !== null);
  const margen = margenes.length ? margenes.reduce((s, m) => s + m, 0) / margenes.length : null;
  const { vender } = numeroDelDiaDe(fijosMes, margen);
  const deHoy = cierres.find((c) => c.fecha === hoy);
  const r = deHoy ? resultadoDelDia({ ...deHoy, comisionPct: negocio.comisionPct, fijosMes, margenPct: margen }) : null;
  const semana = ultimos7(cierres, hoy, fijosMes, margen);
  const prom = promedio(semana.map((x) => x.libres));
  const maxAbs = Math.max(1, ...semana.map((x) => Math.abs(x.libres ?? 0)));
  const cobran = clientes.filter((c) => cobraHoy(c.diaCobro, hoy) && saldo(c.movimientos) > 0);
  const viejos = productos.filter((p) => p.precio !== null && precioViejo(p, hoy));
  const dormida = dormidos(productos, negocio.diasDormida, hoy);
  const hayNegativo = semana.some((x) => x.libres !== null && x.libres < 0);

  return (
    <Pantalla seccion="dia" negocio={negocio.nombre}>
      <section className="flex flex-col gap-4 rounded-[24px] bg-verde p-6 text-white">
        {r ? (
          <>
            <div>
              <p className="text-[15px] text-salvia2">Hoy te quedaron libres</p>
              <p className={`font-display text-[46px] leading-none font-extrabold tracking-[-0.03em] ${r.libres < 0 ? "text-rosa" : "text-white"}`}>{pesos(r.libres)}</p>
              <p className="mt-2 text-[14px] text-salvia2">Vendiste {pesos(deHoy!.ventas)} · gastos {pesos(r.gastos)} · fijos del día {pesos(r.fijosDia)}</p>
            </div>
            {prom !== null ? <p className="text-[14px] text-salvia2">{r.libres >= prom ? "Mejor" : "Peor"} que tu promedio de la semana ({pesos(prom)}).</p> : null}
          </>
        ) : (
          <>
            <div>
              <p className="text-[15px] text-salvia2">Tu número del día</p>
              <p className="font-display text-[46px] leading-none font-extrabold tracking-[-0.03em] text-ambar">{pesos(vender)}</p>
              <p className="mt-2 text-[14px] text-salvia2">Lo que tenés que vender hoy para no perder.</p>
            </div>
            <a href="/app/cierre" className="flex min-h-[56px] flex-col items-center justify-center rounded-xl bg-ambar px-5 py-3 text-center text-tinta">
              <span className="text-[17px] font-bold">Hacé tu cierre de hoy</span>
              <span className="text-[13px]">Hablale al celular · 30 segundos</span>
            </a>
          </>
        )}
        {r ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[14px] text-salvia2"><span>Tu número del día</span><strong className="text-white">{pesos(vender)}</strong></div>
            <div className="h-3 overflow-hidden rounded-full bg-white/15" role="img" aria-label={r.pasaste ? "Pasaste tu número del día" : `Llegaste al ${Math.round(r.progreso * 100)}% de tu número del día`}>
              <div className={`h-full rounded-full ${r.pasaste ? "bg-ambar" : "bg-salvia"}`} style={{ width: `${Math.max(4, r.progreso * 100)}%` }} />
            </div>
            <p className="text-[14px] font-semibold">{r.pasaste ? "Lo pasaste. Hoy ganaste plata." : `Te faltaron ${pesos(vender - deHoy!.ventas)} para no perder.`}</p>
          </div>
        ) : null}
      </section>

      <section className={tarjeta} aria-labelledby="semana">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="semana" className={tituloSeccion}>Últimos 7 días</h2>
          {prom !== null ? <span className="text-[14px] text-g2">Promedio <strong className="text-tinta">{pesos(prom)}</strong></span> : null}
        </div>
        <div className="mt-4 grid h-[120px] grid-cols-7 items-center gap-2">
          {semana.map((x) => (
            <div key={x.fecha} className="flex h-full flex-col items-center justify-center gap-1">
              <div className="flex h-[48px] w-full items-end justify-center">{x.libres !== null && x.libres >= 0 ? <span className="w-full rounded-t-md bg-hoja" style={{ height: `${Math.max(6, (x.libres / maxAbs) * 48)}px` }} /> : null}</div>
              <div className="h-px w-full bg-linea2" />
              <div className="flex h-[48px] w-full items-start justify-center">{x.libres !== null && x.libres < 0 ? <span className="w-full rounded-b-md bg-ambar" style={{ height: `${Math.max(6, (-x.libres / maxAbs) * 48)}px` }} /> : null}</div>
              <span className={`text-[11px] ${x.fecha === hoy ? "font-bold text-tinta" : "text-g2"}`}>{x.fecha === hoy ? "hoy" : diaCorto(x.fecha)}</span>
            </div>
          ))}
        </div>
        {hayNegativo ? <p className="mt-3 text-[14px] leading-[1.5] text-g1">Los días que le pagás al proveedor te da más bajo. Mirá el promedio de la semana.</p> : null}
      </section>

      {cobran.map((c) => (
        <a key={c.id} href="/app/fiados?ver=cobran" className={`${tarjeta} flex items-center justify-between gap-3 border-ambar/60 bg-crema`}>
          <span><strong className="block text-[17px]">Hoy cobra {c.nombre}</strong><span className="text-[15px] text-oro2">Recordale {pesos(saldo(c.movimientos))}</span></span>
          <span aria-hidden="true" className="text-[22px] text-oro2">›</span>
        </a>
      ))}

      {viejos.length ? (
        <a href="/app/precios" className={`${tarjeta} flex items-center justify-between gap-3`}>
          <span><strong className="block text-[17px]">{viejos.length === 1 ? "1 precio para revisar" : `${viejos.length} precios para revisar`}</strong><span className="text-[14px] text-g2">Sin revisar hace más de 30 días</span></span>
          <span aria-hidden="true" className="text-[22px] text-g2">›</span>
        </a>
      ) : null}

      {dormida.lista.length ? (
        <a href="/app/deposito" className={`${tarjeta} flex items-center justify-between gap-3`}>
          <span><strong className="block text-[17px]">{pesos(dormida.inmovilizado)} dormidos</strong><span className="text-[14px] text-g2">{dormida.lista.length === 1 ? "1 producto" : `${dormida.lista.length} productos`} sin ventas en {negocio.diasDormida} días</span></span>
          <span aria-hidden="true" className="text-[22px] text-g2">›</span>
        </a>
      ) : null}
    </Pantalla>
  );
}
