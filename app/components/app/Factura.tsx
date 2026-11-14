"use client";

import { useState, useRef } from "react";
import { conAumento, cruzar, leerLineas } from "@/lib/factura";
import { margenDe, precioSugerido } from "@/lib/margen";
import { conPuntos, pesos, soloDigitos } from "@/lib/formato";
import type { Resultado } from "@/lib/resultado";
import { Alerta, botonPrincipal, botonSecundario, entrada } from "../auth/Marco";
import { Carteles } from "./Carteles";

type Producto = { id: string; nombre: string; precio: number | null; costo: number | null };
type Fila = { clave: number; descripcion: string; cantidad: number | null; costo: string; destino: string; precio: string };
const NUEVO = "__nuevo", NINGUNO = "__ninguno";

/** Achica la foto (las de celular son enormes) para que se lea más rápido. */
async function prepararFoto(archivo: File): Promise<HTMLCanvasElement> {
  const img = await createImageBitmap(archivo);
  const escala = Math.min(1, 1800 / Math.max(img.width, img.height));
  const cv = document.createElement("canvas");
  cv.width = Math.round(img.width * escala);
  cv.height = Math.round(img.height * escala);
  cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
  return cv;
}

const titulo = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

export function Factura({ productos, comisionPct, redondeo, negocio, aplicar }: { productos: Producto[]; comisionPct: number | null; redondeo: number; negocio: string; aplicar: (d: unknown) => Promise<Resultado> }) {
  const [modo, setModo] = useState<"foto" | "porcentaje">("foto");
  const [leyendo, setLeyendo] = useState<number | null>(null);
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [pct, setPct] = useState("");
  const [elegidos, setElegidos] = useState<string[]>(productos.filter((p) => p.costo).map((p) => p.id));
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const enCurso = useRef(false); // evita guardar dos veces con un doble toque
  const [listos, setListos] = useState<{ nombre: string; precio: number }[] | null>(null);
  const porId = new Map(productos.map((p) => [p.id, p]));

  const sugerir = (p: Producto | undefined, costo: number) => {
    const m = p ? margenDe(p.precio, p.costo) : null;
    return precioSugerido(costo, m !== null && m > 0 ? Math.round(m) : 30, comisionPct, redondeo) ?? costo;
  };

  async function leerFoto(archivo: File | undefined) {
    if (!archivo) return;
    setError(null);
    setFilas(null);
    setLeyendo(0);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("spa", 1, {
        workerPath: "/lector/worker.min.js", corePath: "/lector/", langPath: "/lector", gzip: true,
        logger: (m: { status: string; progress: number }) => { if (m.status === "recognizing text") setLeyendo(Math.round(m.progress * 100)); },
      });
      const { data } = await worker.recognize(await prepararFoto(archivo));
      await worker.terminate();
      const cruces = cruzar(leerLineas(data.text), productos);
      if (!cruces.length) {
        setError("No encontré productos con precio en la foto. Sacala de nuevo con buena luz y la factura derecha, o usá «El proveedor aumentó».");
        return;
      }
      setFilas(cruces.map((c, i) => ({ clave: i, descripcion: c.descripcion, cantidad: c.cantidad, costo: conPuntos(String(c.costo)), destino: c.productoId ?? NINGUNO, precio: conPuntos(String(sugerir(c.productoId ? porId.get(c.productoId) : undefined, c.costo))) })));
    } catch {
      setError("No pude leer la foto. Probá de nuevo con más luz, o usá «El proveedor aumentó».");
    } finally {
      setLeyendo(null);
    }
  }

  const cambiarFila = (clave: number, campos: Partial<Fila>) => setFilas((fs) => fs!.map((f) => {
    if (f.clave !== clave) return f;
    const n = { ...f, ...campos };
    if (campos.destino !== undefined || campos.costo !== undefined) n.precio = conPuntos(String(sugerir(porId.get(n.destino), soloDigitos(n.costo))));
    return n;
  }));

  async function guardar(cambios: { id: string; costo: number; precio: number }[], nuevos: { nombre: string; costo: number; precio: number; stock: number | null }[]) {
    setError(null);
    if (enCurso.current) return;
    enCurso.current = true;
    setOcupado(true);
    try {
      const r = await aplicar({ cambios, nuevos });
      if (r.ok) setListos([...cambios.map((c) => ({ nombre: porId.get(c.id)!.nombre, precio: c.precio })), ...nuevos.map((n) => ({ nombre: n.nombre, precio: n.precio }))]);
      else setError(r.mensaje);
    } catch {
      setError("No se pudo guardar. Revisá tu conexión y probá de nuevo.");
    } finally {
      enCurso.current = false;
      setOcupado(false);
    }
  }

  if (listos) {
    return (
      <section className="flex flex-col gap-5">
        <Alerta tipo="ok">Precios actualizados: {listos.length === 1 ? "1 producto" : `${listos.length} productos`}.</Alerta>
        <Carteles items={listos} negocio={negocio} />
        <a href="/app/precios" className={`${botonSecundario} text-center leading-[24px]`}>Volver a precios</a>
      </section>
    );
  }

  const usadas = (filas ?? []).filter((f) => f.destino !== NINGUNO && soloDigitos(f.costo) > 0 && soloDigitos(f.precio) > 0);
  const aumentaron = usadas.filter((f) => f.destino !== NUEVO && soloDigitos(f.costo) > (porId.get(f.destino)?.costo ?? 0)).length;
  const pctNum = Number(pct.replace(",", "."));
  const vistaPct = pctNum > 0 && pctNum <= 300 ? productos.filter((p) => elegidos.includes(p.id) && p.costo).map((p) => { const costo = conAumento(p.costo!, pctNum); return { p, costo, precio: sugerir(p, costo) }; }) : [];

  return (
    <section className="flex flex-col gap-5">
      <h1 className="font-display text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em]">Precios nuevos del proveedor</h1>
      <div className="grid grid-cols-2 gap-2" role="tablist">
        {([["foto", "Foto de la factura"], ["porcentaje", "Aumentó un %"]] as const).map(([m, t]) => (
          <button key={m} type="button" role="tab" aria-selected={modo === m} onClick={() => { setModo(m); setError(null); }} className={`min-h-[48px] cursor-pointer rounded-xl border text-[15px] font-semibold ${modo === m ? "border-verde bg-verde text-white" : "border-linea2 bg-white"}`}>{t}</button>
        ))}
      </div>
      {error ? <Alerta>{error}</Alerta> : null}

      {modo === "foto" ? (
        <>
          {!filas && leyendo === null ? (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-[24px] bg-verde px-6 py-8 text-center text-white">
              <span className="flex size-[96px] items-center justify-center rounded-full bg-ambar text-tinta">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
              </span>
              <span className="font-display text-[22px] font-bold">Sacale foto a la factura</span>
              <span className="max-w-[300px] text-[15px] leading-[1.5] text-salvia2">Derecha, con buena luz y que se vean los precios. Te digo a cuánto vender lo que aumentó.</span>
              <input type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Foto de la factura" onChange={(e) => void leerFoto(e.target.files?.[0])} />
            </label>
          ) : null}
          {leyendo !== null ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-linea bg-white p-5" aria-live="polite">
              <p className="text-[17px] font-semibold">Leyendo la factura… {leyendo}%</p>
              <div className="h-3 overflow-hidden rounded-full bg-suave"><div className="h-full rounded-full bg-hoja transition-[width]" style={{ width: `${Math.max(4, leyendo)}%` }} /></div>
              <p className="text-[14px] text-g2">La primera vez tarda un poco más (el celular baja el lector una sola vez).</p>
            </div>
          ) : null}
          {filas ? (
            <>
              <p className="rounded-xl border border-hoja/30 bg-menta px-4 py-3 text-[15px] text-verde">Esto es lo que encontré. Revisá que cada renglón sea el producto correcto.</p>
              <ul className="flex flex-col gap-3">
                {filas.map((f) => {
                  const p = porId.get(f.destino);
                  const costo = soloDigitos(f.costo);
                  return (
                    <li key={f.clave} className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 ${f.destino === NINGUNO ? "border-linea opacity-70" : "border-linea2"}`}>
                      <p className="text-[13px] font-semibold tracking-wide text-g2">EN LA FACTURA: {f.descripcion}{f.cantidad ? ` · ${f.cantidad} u.` : ""}</p>
                      <label className="flex flex-col gap-1 text-[14px] font-semibold text-g1">Es tu producto
                        <select value={f.destino} onChange={(e) => cambiarFila(f.clave, { destino: e.target.value })} className={entrada}>
                          <option value={NINGUNO}>No lo uses</option>
                          <option value={NUEVO}>Es un producto nuevo</option>
                          {productos.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                        </select>
                      </label>
                      {f.destino !== NINGUNO ? (
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col gap-1 text-[14px] font-semibold text-g1">Te cuesta<input inputMode="numeric" value={f.costo} onChange={(e) => cambiarFila(f.clave, { costo: conPuntos(e.target.value) })} className={entrada} /></label>
                          <label className="flex flex-col gap-1 text-[14px] font-semibold text-g1">Vendelo a<input inputMode="numeric" value={f.precio} onChange={(e) => setFilas((fs) => fs!.map((x) => (x.clave === f.clave ? { ...x, precio: conPuntos(e.target.value) } : x)))} className={entrada} /></label>
                        </div>
                      ) : null}
                      {p?.costo != null && f.destino !== NINGUNO ? (
                        <p className={`text-[14px] font-semibold ${costo > p.costo ? "text-rojo" : "text-hoja"}`}>
                          {costo > p.costo ? `Aumentó ${pesos(costo - p.costo)} (${Math.round(((costo - p.costo) / p.costo) * 100)}%)` : costo < p.costo ? "Bajó" : "Sin cambios"} · antes lo vendías a {p.precio ? pesos(p.precio) : "—"}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-col gap-2 rounded-2xl bg-crema p-5">
                <p className="font-display text-[20px] font-bold text-tinta">{aumentaron === 1 ? "1 producto aumentó" : `${aumentaron} productos aumentaron`}</p>
                <p className="text-[15px] text-oro2">Para seguir ganando lo mismo{comisionPct ? " (ya con la comisión de cobro)" : ""}, vendelos a los precios de arriba.</p>
              </div>
              <button type="button" disabled={ocupado || !usadas.length} className={botonPrincipal}
                onClick={() => void guardar(
                  usadas.filter((f) => f.destino !== NUEVO).map((f) => ({ id: f.destino, costo: soloDigitos(f.costo), precio: soloDigitos(f.precio) })),
                  usadas.filter((f) => f.destino === NUEVO).map((f) => ({ nombre: titulo(f.descripcion).slice(0, 120), costo: soloDigitos(f.costo), precio: soloDigitos(f.precio), stock: f.cantidad })),
                )}>
                {ocupado ? "Guardando…" : `Aplicar ${usadas.length === 1 ? "1 precio" : `los ${usadas.length} precios`}`}
              </button>
              <button type="button" onClick={() => setFilas(null)} className={botonSecundario}>Sacar otra foto</button>
            </>
          ) : null}
        </>
      ) : (
        <>
          <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1">
            ¿Cuánto aumentó el proveedor?
            <span className="relative"><input inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value.replace(/[^\d.,]/g, "").slice(0, 5))} placeholder="Por ejemplo 8" className={`${entrada} pr-10`} /><span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-g3">%</span></span>
          </label>
          <fieldset className="flex flex-col gap-2 rounded-2xl border border-linea bg-white p-4">
            <legend className="px-1 text-[15px] font-semibold text-g1">¿A qué productos?</legend>
            <div className="flex gap-2">
              <button type="button" onClick={() => setElegidos(productos.filter((p) => p.costo).map((p) => p.id))} className="min-h-[40px] cursor-pointer rounded-lg border border-linea2 px-3 text-[14px] font-semibold">Todos</button>
              <button type="button" onClick={() => setElegidos([])} className="min-h-[40px] cursor-pointer rounded-lg border border-linea2 px-3 text-[14px] font-semibold">Ninguno</button>
            </div>
            {productos.filter((p) => p.costo).map((p) => {
              const v = vistaPct.find((x) => x.p.id === p.id);
              return (
                <label key={p.id} className="flex min-h-[48px] items-center gap-3 border-t border-linea py-2 text-[15px]">
                  <input type="checkbox" checked={elegidos.includes(p.id)} onChange={(e) => setElegidos((l) => (e.target.checked ? [...l, p.id] : l.filter((x) => x !== p.id)))} className="size-5 accent-[#0e3b2a]" />
                  <span className="min-w-0 flex-1 truncate">{p.nombre}</span>
                  {v ? <strong className="text-hoja">{pesos(v.precio)}</strong> : <span className="text-g2">{p.precio ? pesos(p.precio) : ""}</span>}
                </label>
              );
            })}
          </fieldset>
          {vistaPct.length ? <p className="rounded-xl bg-crema px-4 py-3 text-[15px] text-oro2">Con {pct}% de aumento, para seguir ganando lo mismo{comisionPct ? " (ya con la comisión)" : ""}, vendelos a los precios en verde.</p> : null}
          <button type="button" disabled={ocupado || !vistaPct.length} className={botonPrincipal} onClick={() => void guardar(vistaPct.map((x) => ({ id: x.p.id, costo: x.costo, precio: x.precio })), [])}>
            {ocupado ? "Guardando…" : vistaPct.length ? `Aplicar a ${vistaPct.length === 1 ? "1 producto" : `${vistaPct.length} productos`}` : "Poné el porcentaje"}
          </button>
        </>
      )}
    </section>
  );
}
