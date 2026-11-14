"use client";

import { useState } from "react";
import { margenDe, precioSugerido, precioViejo, ranking, type ProductoMargen } from "@/lib/margen";
import { conPuntos, pesos, soloDigitos } from "@/lib/formato";
import type { Resultado } from "@/lib/resultado";
import { Alerta, botonPrincipal, botonSecundario, entrada } from "../auth/Marco";
import { Plata } from "./Campos";

type Acciones = { guardarProducto: (d: unknown) => Promise<Resultado>; vendiHoy: (id: unknown) => Promise<Resultado> };
type Edicion = { id?: string; nombre: string; precio: string; costo: string; stock: string; margenAntes: number | null; costoAntes: number | null };

export function Precios({ productos, hoy, alertaPct, comisionPct, redondeo, acciones, arriba }: { productos: ProductoMargen[]; hoy: string; alertaPct: number; comisionPct: number | null; redondeo: number; acciones: Acciones; arriba?: React.ReactNode }) {
  const [ed, setEd] = useState<Edicion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const filas = ranking(productos, alertaPct);

  const abrir = (p?: ProductoMargen) =>
    setEd(p ? { id: p.id, nombre: p.nombre, precio: p.precio ? conPuntos(String(p.precio)) : "", costo: p.costo !== null ? conPuntos(String(p.costo)) : "", stock: p.stock !== null ? String(p.stock) : "", margenAntes: margenDe(p.precio, p.costo), costoAntes: p.costo } : { nombre: "", precio: "", costo: "", stock: "", margenAntes: null, costoAntes: null });

  async function correr(fn: () => Promise<Resultado>, mensaje: string) {
    setError(null);
    setOk(null);
    setOcupado(true);
    try {
      const r = await fn();
      if (r.ok) { setEd(null); setOk(mensaje); }
      else setError(r.mensaje);
    } catch {
      setError("No se pudo guardar. Revisá tu conexión y probá de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  const costoNuevo = ed ? soloDigitos(ed.costo) : 0;
  const objetivo = ed?.margenAntes !== null && ed?.margenAntes !== undefined && ed.margenAntes > 0 ? Math.round(ed.margenAntes) : 30;
  const sugerido = ed && costoNuevo > 0 && (ed.costoAntes === null || costoNuevo !== ed.costoAntes || !soloDigitos(ed.precio)) ? precioSugerido(costoNuevo, objetivo, comisionPct, redondeo) : null;

  return (
    <section className="flex flex-col gap-5">
      {arriba}
      {ok ? <Alerta tipo="ok">{ok}</Alerta> : null}
      {error ? <Alerta>{error}</Alerta> : null}

      {ed ? (
        <form className="flex flex-col gap-4 rounded-2xl border-2 border-verde bg-white p-5" onSubmit={(e) => { e.preventDefault(); void correr(() => acciones.guardarProducto({ id: ed.id, nombre: ed.nombre, precio: soloDigitos(ed.precio) || null, costo: ed.costo.trim() === "" ? null : soloDigitos(ed.costo), stock: ed.stock.trim() === "" ? null : Number(ed.stock) }), "Listo, guardado."); }}>
          <h2 className="font-display text-[20px] font-bold">{ed.id ? ed.nombre || "Producto" : "Producto nuevo"}</h2>
          {!ed.id ? <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1">Nombre<input value={ed.nombre} onChange={(e) => setEd({ ...ed, nombre: e.target.value })} maxLength={120} className={entrada} /></label> : null}
          <div className="grid grid-cols-2 gap-3">
            <Plata etiqueta="Te cuesta" valor={ed.costo} onChange={(v) => setEd({ ...ed, costo: v })} id="costo" />
            <Plata etiqueta="Lo vendés a" valor={ed.precio} onChange={(v) => setEd({ ...ed, precio: v })} id="precio" />
          </div>
          {sugerido ? (
            <div className="flex flex-col gap-2 rounded-xl bg-crema p-4">
              <p className="text-[15px] text-oro2">Para seguir ganando {objetivo}%{comisionPct ? " (ya con la comisión de cobro)" : ""}, vendelo a</p>
              <p className="font-display text-[34px] leading-none font-extrabold text-tinta">{pesos(sugerido)}</p>
              <button type="button" onClick={() => setEd({ ...ed, precio: conPuntos(String(sugerido)) })} className={botonSecundario}>Usar ese precio</button>
            </div>
          ) : null}
          {soloDigitos(ed.precio) > 0 && ed.costo.trim() !== "" ? <p className="text-[15px] text-g1">Te deja <strong>{pesos(soloDigitos(ed.precio) - costoNuevo)}</strong> por unidad ({Math.round(margenDe(soloDigitos(ed.precio), costoNuevo) ?? 0)}%).</p> : null}
          <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1"><span>¿Cuántos tenés? <span className="font-normal text-g2">(más o menos)</span></span><input value={ed.stock} onChange={(e) => setEd({ ...ed, stock: e.target.value.replace(/\D/g, "").slice(0, 7) })} inputMode="numeric" className={entrada} /></label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEd(null)} className={`${botonSecundario} w-auto px-5`}>Cancelar</button>
            <button type="submit" disabled={ocupado} className={botonPrincipal}>{ocupado ? "Guardando…" : "Guardar"}</button>
          </div>
        </form>
      ) : null}

      <div className="rounded-2xl border border-linea bg-white">
        <h2 className="px-5 pt-5 font-display text-[20px] font-bold">Lo que te deja cada producto</h2>
        <p className="px-5 pt-1 text-[14px] text-g2">Ordenados de más a menos ganancia. En rojo, los que te dejan menos de {alertaPct}%.</p>
        {filas.length === 0 ? (
          <p className="p-5 text-[16px] text-g1">Todavía no cargaste productos. Agregá los que más vendés para saber cuál te deja plata.</p>
        ) : (
          <ul className="mt-3 divide-y divide-linea">
            {filas.map((p) => {
              const viejo = p.precio !== null && precioViejo(p, hoy);
              return (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <button type="button" onClick={() => abrir(p)} className="flex min-h-[48px] min-w-0 flex-1 cursor-pointer flex-col items-start text-left">
                    <span className="truncate text-[16px] font-semibold">{p.nombre}</span>
                    <span className="text-[13px] text-g2">
                      {p.precio !== null ? `${pesos(p.precio)}` : "Sin precio"}{p.costo !== null && p.precio !== null ? ` · te deja ${pesos(p.precio - p.costo)}` : ""}
                      {viejo ? <span className="ml-1 rounded bg-suave px-1.5 py-0.5 text-[12px] font-semibold text-g1">precio sin revisar</span> : null}
                    </span>
                  </button>
                  <span className={`min-w-[52px] rounded-full px-2.5 py-1 text-center text-[14px] font-bold ${p.margen === null ? "bg-suave text-g2" : p.bajo ? "bg-[#fef3f2] text-rojo" : "bg-menta text-hoja"}`}>{p.margen === null ? "—" : `${Math.round(p.margen)}%`}</span>
                  <button type="button" onClick={() => void correr(() => acciones.vendiHoy(p.id), `Anotado: ${p.nombre} se vendió hoy.`)} className="min-h-[44px] cursor-pointer rounded-lg border border-linea2 px-2 text-[13px] font-semibold text-g1" aria-label={`Vendí hoy ${p.nombre}`}>Vendí hoy</button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {!ed ? <button type="button" onClick={() => abrir()} className={botonPrincipal}>Agregar producto</button> : null}
    </section>
  );
}
