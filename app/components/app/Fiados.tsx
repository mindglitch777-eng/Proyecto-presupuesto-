"use client";

import { useState } from "react";
import { cobraHoy, deudaMasVieja, linkWhatsapp, mensajeRecordatorio, saldo, semaforo, type Semaforo } from "@/lib/fiado";
import { haceCuanto } from "@/lib/fechas";
import { pesos, soloDigitos } from "@/lib/formato";
import type { Cliente } from "@/lib/datos/tipos";
import type { Resultado } from "@/lib/resultado";
import { Alerta, botonPrincipal, botonSecundario, entrada } from "../auth/Marco";
import { Plata } from "./Campos";

type Acciones = { guardarCliente: (d: unknown) => Promise<Resultado>; movimiento: (d: unknown) => Promise<Resultado>; recordado: (id: unknown) => Promise<Resultado> };
type Filtro = "todos" | "cobran" | "atrasados";
const COLOR: Record<Semaforo, string> = { verde: "bg-hoja", amarillo: "bg-mostaza", rojo: "bg-rojo" };
const ORDEN: Record<Semaforo, number> = { rojo: 0, amarillo: 1, verde: 2 };

export function Fiados({ clientes, hoy, filtroInicial, acciones }: { clientes: Cliente[]; hoy: string; filtroInicial: Filtro; acciones: Acciones }) {
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [modo, setModo] = useState<"fio" | "pago" | null>(null);
  const [monto, setMonto] = useState("");
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState({ nombre: "", telefono: "", diaCobro: "", nota: "" });
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const lista = clientes
    .map((c) => ({ ...c, saldo: saldo(c.movimientos), sem: semaforo(c.movimientos, c.recordatoriosSinPago, hoy), vieja: deudaMasVieja(c.movimientos), cobra: cobraHoy(c.diaCobro, hoy) }))
    .sort((a, b) => (b.saldo > 0 ? 1 : 0) - (a.saldo > 0 ? 1 : 0) || ORDEN[a.sem.color] - ORDEN[b.sem.color] || b.saldo - a.saldo);
  const conDeuda = lista.filter((c) => c.saldo > 0);
  const total = conDeuda.reduce((s, c) => s + c.saldo, 0);
  const masVieja = Math.max(0, ...conDeuda.map((c) => c.sem.dias ?? 0));
  const vistos = lista.filter((c) => (filtro === "cobran" ? c.cobra && c.saldo > 0 : filtro === "atrasados" ? c.saldo > 0 && c.sem.color !== "verde" : true));

  async function correr(fn: () => Promise<Resultado>, despues?: () => void) {
    setError(null);
    setOcupado(true);
    try {
      const r = await fn();
      if (r.ok) despues?.();
      else setError(r.mensaje);
    } catch {
      setError("No se pudo guardar. Revisá tu conexión y probá de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 rounded-[24px] bg-verde p-6 text-white">
        <p className="text-[15px] text-salvia2">Te deben en total</p>
        <p className="font-display text-[44px] leading-none font-extrabold tracking-[-0.03em]">{pesos(total)}</p>
        <p className="mt-1 text-[14px] text-salvia2">{conDeuda.length ? `${conDeuda.length === 1 ? "1 cliente" : `${conDeuda.length} clientes`} · la deuda más vieja es de hace ${masVieja} días` : "Nadie te debe nada."}</p>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Filtrar">
        {([["todos", "Todos"], ["cobran", "Cobran hoy"], ["atrasados", "Atrasados"]] as [Filtro, string][]).map(([f, t]) => (
          <button key={f} type="button" role="tab" aria-selected={filtro === f} onClick={() => setFiltro(f)} className={`min-h-[44px] flex-1 cursor-pointer rounded-full border text-[15px] font-semibold ${filtro === f ? "border-verde bg-verde text-white" : "border-linea2 bg-white text-tinta"}`}>{t}</button>
        ))}
      </div>

      {error ? <Alerta>{error}</Alerta> : null}

      {clientes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-linea2 bg-white px-5 py-6 text-center text-[16px] leading-[1.55] text-g1">Todavía no cargaste fiados. Cuando alguien te lleve algo sin pagar, anotalo acá.</p>
      ) : vistos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-linea2 bg-white px-5 py-6 text-center text-[16px] text-g1">{filtro === "cobran" ? "Hoy no cobra nadie que te deba." : "No hay atrasados. Bien ahí."}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {vistos.map((c) => {
            const texto = mensajeRecordatorio(c.nombre, c.saldo, c.vieja ?? hoy);
            const abiertoAca = abierto === c.id;
            return (
              <li key={c.id} className="rounded-2xl border border-linea bg-white">
                <button type="button" onClick={() => { setAbierto(abiertoAca ? null : c.id); setModo(null); setMonto(""); setError(null); }} aria-expanded={abiertoAca} className="flex w-full cursor-pointer items-center gap-3 p-4 text-left">
                  <span className="relative flex size-11 flex-none items-center justify-center rounded-full bg-suave font-display text-[18px] font-bold">
                    {c.nombre.trim().charAt(0).toUpperCase()}
                    {c.saldo > 0 ? <span className={`absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-white ${COLOR[c.sem.color]}`} aria-hidden="true" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-[17px]">{c.nombre}</strong>
                    <span className="block text-[14px] text-g2">
                      {c.saldo > 0 ? `Debe desde ${haceCuanto(c.vieja, hoy)}` : "Al día"}
                      {c.cobra && c.saldo > 0 ? " · cobra hoy" : ""}
                      {c.ultimoRecordatorio ? ` · le recordaste ${haceCuanto(c.ultimoRecordatorio.slice(0, 10), hoy)}` : ""}
                    </span>
                  </span>
                  <strong className={`text-[18px] ${c.sem.color === "rojo" && c.saldo > 0 ? "text-rojo" : "text-tinta"}`}>{pesos(c.saldo)}</strong>
                </button>
                {c.saldo > 0 && c.sem.color === "rojo" ? <p className="mx-4 mb-3 rounded-lg bg-[#fef3f2] px-3 py-2 text-[14px] font-semibold text-[#b42318]">No le fíes más hasta que pague.</p> : null}
                {abiertoAca ? (
                  <div className="flex flex-col gap-3 border-t border-linea p-4">
                    {modo ? (
                      <>
                        <Plata etiqueta={modo === "fio" ? "¿Cuánto se llevó?" : "¿Cuánto te pagó?"} valor={monto} onChange={setMonto} autoFocus id={`monto-${c.id}`} />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setModo(null)} className={`${botonSecundario} w-auto px-5`}>Cancelar</button>
                          <button type="button" disabled={ocupado} className={botonPrincipal}
                            onClick={() => correr(() => acciones.movimiento({ clienteId: c.id, tipo: modo, monto: soloDigitos(monto), nota: null }), () => { setModo(null); setMonto(""); })}>
                            {ocupado ? "Guardando…" : "Guardar"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setModo("fio")} className={botonSecundario}>Me fió</button>
                        <button type="button" onClick={() => setModo("pago")} className={botonSecundario}>Me pagó</button>
                        {c.saldo > 0 ? (
                          <a href={linkWhatsapp(c.telefono, texto)} target="_blank" rel="noopener" onClick={() => { void acciones.recordado(c.id); try { if (!c.telefono) void navigator.clipboard?.writeText(texto); } catch { /* sin portapapeles */ } }}
                            className="col-span-2 flex min-h-[52px] items-center justify-center rounded-xl bg-[#1f8f4e] px-4 text-[17px] font-semibold text-white">
                            Recordale por WhatsApp
                          </a>
                        ) : null}
                      </div>
                    )}
                    {c.nota ? <p className="text-[14px] text-g2">Nota: {c.nota}</p> : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {nuevo ? (
        <form className="flex flex-col gap-4 rounded-2xl border border-linea bg-white p-5" onSubmit={(e) => { e.preventDefault(); void correr(() => acciones.guardarCliente({ nombre: form.nombre, telefono: form.telefono || null, diaCobro: form.diaCobro ? Number(form.diaCobro) : null, nota: form.nota || null }), () => { setNuevo(false); setForm({ nombre: "", telefono: "", diaCobro: "", nota: "" }); }); }}>
          <h2 className="font-display text-[20px] font-bold">Cliente nuevo</h2>
          <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1">Nombre<input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} maxLength={120} className={entrada} /></label>
          <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1"><span>WhatsApp <span className="font-normal text-g2">(si querés)</span></span><input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} inputMode="tel" maxLength={30} className={entrada} /></label>
          <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1"><span>¿Qué día del mes cobra? <span className="font-normal text-g2">(si sabés)</span></span><input value={form.diaCobro} onChange={(e) => setForm({ ...form, diaCobro: e.target.value.replace(/\D/g, "").slice(0, 2) })} inputMode="numeric" placeholder="Por ejemplo 10" className={entrada} /></label>
          <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1"><span>Nota <span className="font-normal text-g2">(si querés)</span></span><input value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} maxLength={300} className={entrada} /></label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setNuevo(false)} className={`${botonSecundario} w-auto px-5`}>Cancelar</button>
            <button type="submit" disabled={ocupado} className={botonPrincipal}>{ocupado ? "Guardando…" : "Guardar cliente"}</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setNuevo(true)} className={botonPrincipal}>Agregar cliente</button>
      )}
      <p className="text-[13px] leading-[1.5] text-g2">El mensaje de WhatsApp lo mandás vos desde tu teléfono. Antes de anotar a alguien, pedile permiso para guardar sus datos.</p>
    </section>
  );
}
