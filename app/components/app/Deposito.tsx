"use client";

import { useState } from "react";
import { dormidos, precioLiquidar } from "@/lib/dormida";
import type { ProductoMargen } from "@/lib/margen";
import { pesos } from "@/lib/formato";
import type { Resultado } from "@/lib/resultado";
import { Alerta, botonPrincipal, botonSecundario, entrada } from "../auth/Marco";

type Accion = "no_reponer" | "liquidar" | "mantener";
const TEXTO: Record<Accion, string> = { no_reponer: "No reponer", liquidar: "Liquidar", mantener: "Está bien así" };

export function Deposito({ productos, hoy, dias, redondeo, accion }: { productos: ProductoMargen[]; hoy: string; dias: number; redondeo: number; accion: (d: unknown) => Promise<Resultado> }) {
  const r = dormidos(productos, dias, hoy);
  const [abierto, setAbierto] = useState<{ id: string; accion: Accion; stock: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function confirmar(p: ProductoMargen) {
    if (!abierto) return;
    setError(null);
    setOcupado(true);
    try {
      const res = await accion({ id: p.id, accion: abierto.accion, stock: abierto.stock.trim() === "" ? null : Number(abierto.stock), precio: abierto.accion === "liquidar" && p.costo ? precioLiquidar(p.costo, redondeo) : null });
      if (res.ok) {
        setOk(abierto.accion === "liquidar" ? `Listo: ${p.nombre} ahora sale ${pesos(precioLiquidar(p.costo ?? 0, redondeo))}.` : abierto.accion === "no_reponer" ? `Listo: no repongas ${p.nombre}.` : `Listo: no te avisamos de ${p.nombre} por 30 días.`);
        setAbierto(null);
      } else setError(res.mensaje);
    } catch {
      setError("No se pudo guardar. Revisá tu conexión y probá de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 rounded-[24px] bg-verde p-6 text-white">
        <p className="text-[15px] text-salvia2">Plata inmovilizada en el depósito</p>
        <p className="font-display text-[44px] leading-none font-extrabold tracking-[-0.03em] text-ambar">{pesos(r.inmovilizado)}</p>
        <p className="mt-1 text-[14px] text-salvia2">{r.lista.length ? `Si lo vendieras todo: ${pesos(r.siLoVendieras)}` : "No tenés productos dormidos."}</p>
      </div>
      {ok ? <Alerta tipo="ok">{ok}</Alerta> : null}
      {error ? <Alerta>{error}</Alerta> : null}
      <h2 className="font-display text-[20px] font-bold">Productos sin ventas hace más de {dias} días</h2>
      {r.lista.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-linea2 bg-white px-5 py-6 text-center text-[16px] leading-[1.55] text-g1">Todo se está moviendo. Para que esto funcione, marcá en cada cierre qué se vendió.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {r.lista.map((p) => {
            const aca = abierto?.id === p.id;
            return (
              <li key={p.id} className="flex flex-col gap-3 rounded-2xl border border-linea bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <strong className="block text-[17px]">{p.nombre}</strong>
                    <span className="text-[14px] text-g2">Sin ventas hace {p.dias} días · {p.stock ?? 0} en el depósito{p.accionDormido === "no_reponer" ? " · no reponer" : ""}</span>
                  </span>
                  <strong className="text-[17px]">{pesos((p.costo ?? 0) * (p.stock ?? 0))}</strong>
                </div>
                {aca ? (
                  <div className="flex flex-col gap-3 rounded-xl bg-suave p-3">
                    {abierto.accion === "liquidar" && p.costo ? <p className="text-[15px] text-g1">Vendelo a <strong>{pesos(precioLiquidar(p.costo, redondeo))}</strong> (lo que te costó + 5%) para recuperar la plata.</p> : null}
                    <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1">¿Cuántos te quedan?<input value={abierto.stock} onChange={(e) => setAbierto({ ...abierto, stock: e.target.value.replace(/\D/g, "").slice(0, 7) })} inputMode="numeric" className={entrada} /></label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setAbierto(null)} className={`${botonSecundario} w-auto px-4`}>Cancelar</button>
                      <button type="button" disabled={ocupado} onClick={() => void confirmar(p)} className={botonPrincipal}>{ocupado ? "Guardando…" : TEXTO[abierto.accion]}</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {(["no_reponer", "liquidar", "mantener"] as Accion[]).map((a) => (
                      <button key={a} type="button" onClick={() => setAbierto({ id: p.id, accion: a, stock: p.stock !== null ? String(p.stock) : "" })} className="min-h-[48px] cursor-pointer rounded-xl border border-linea2 bg-white px-1 text-[14px] font-semibold text-tinta">{TEXTO[a]}</button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
