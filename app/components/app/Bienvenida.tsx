"use client";

import { useEffect, useState } from "react";
import { CHIPS, NOMBRES_RUBRO, ganancia, leerCalculadora, CLAVE_CALCULADORA, recordatorioIcs, wow, type Producto, type Rubro } from "@/lib/onboarding";
import { conPuntos, pesos, soloDigitos } from "@/lib/formato";
import type { AccionesBienvenida } from "@/lib/resultado";
import { Alerta, botonPrincipal, botonSecundario, entrada } from "../auth/Marco";
import { Logo } from "../Iconos";

type Inicial = { nombre: string; rubro: Rubro | null; ciudad: string };
type Fila = { id: number; nombre: string; precio: string; costo: string };

const RUBROS: Rubro[] = ["kiosco", "almacen", "dietetica"];
const etiqueta = "flex flex-col gap-2 text-[15px] font-semibold text-g1";

function Plata({ etiquetaTexto, valor, onChange, ayuda }: { etiquetaTexto: string; valor: string; onChange: (v: string) => void; ayuda?: string }) {
  return (
    <label className={etiqueta}>
      {etiquetaTexto}
      <span className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[17px] font-semibold text-g3">$</span>
        <input inputMode="numeric" value={valor} onChange={(e) => onChange(conPuntos(e.target.value))} placeholder="0" className={`${entrada} pl-9`} />
      </span>
      {ayuda ? <span className="text-[13px] font-normal text-g2">{ayuda}</span> : null}
    </label>
  );
}

export function Bienvenida({ inicial, acciones, urlApp }: { inicial: Inicial; acciones: AccionesBienvenida; urlApp: string }) {
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // Paso 1
  const [nombre, setNombre] = useState(inicial.nombre === "Mi negocio" ? "" : inicial.nombre);
  const [rubro, setRubro] = useState<Rubro | null>(inicial.rubro);
  const [ciudad, setCiudad] = useState(inicial.ciudad);
  // Paso 2
  const [alquiler, setAlquiler] = useState("");
  const [luz, setLuz] = useState("");
  const [sueldos, setSueldos] = useState("");
  const [otros, setOtros] = useState("");
  const [comision, setComision] = useState("");
  const [deCalculadora, setDeCalculadora] = useState(false);
  // Paso 3
  const [filas, setFilas] = useState<Fila[]>([]);
  const [siguienteId, setSiguienteId] = useState(1);

  useEffect(() => {
    let guardado: string | null = null;
    try {
      guardado = localStorage.getItem(CLAVE_CALCULADORA);
    } catch {
      /* sin almacenamiento */
    }
    const c = leerCalculadora(guardado);
    if (c && (c.alquiler || c.luz || c.sueldos)) {
      setAlquiler(conPuntos(String(c.alquiler)));
      setLuz(conPuntos(String(c.luz)));
      setSueldos(conPuntos(String(c.sueldos)));
      setDeCalculadora(true);
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [paso]);

  const fijos = { alquiler: soloDigitos(alquiler), luz: soloDigitos(luz), sueldos: soloDigitos(sueldos), otros: soloDigitos(otros), comision: comision.trim() === "" ? null : Number(comision.replace(",", ".")) };
  const productos: Producto[] = filas.filter((f) => f.nombre.trim() && soloDigitos(f.precio) > 0).map((f) => ({ nombre: f.nombre.trim(), precio: soloDigitos(f.precio), costo: soloDigitos(f.costo) }));

  async function correr(accion: () => Promise<{ ok: true } | { ok: false; mensaje: string }>, siguiente: () => void) {
    setError(null);
    setOcupado(true);
    try {
      const r = await accion();
      if (r.ok) siguiente();
      else setError(r.mensaje);
    } catch {
      setError("No se pudo guardar. Revisá tu conexión y probá de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  function agregar(n: string) {
    if (filas.length >= 20) return;
    setFilas((f) => [...f, { id: siguienteId, nombre: n, precio: "", costo: "" }]);
    setSiguienteId((i) => i + 1);
  }
  const cambiar = (id: number, campo: keyof Omit<Fila, "id">, valor: string) => setFilas((fs) => fs.map((f) => (f.id === id ? { ...f, [campo]: campo === "nombre" ? valor : conPuntos(valor) } : f)));
  const quitar = (id: number) => setFilas((fs) => fs.filter((f) => f.id !== id));

  function guardarPaso3(saltear: boolean) {
    const incompletas = filas.filter((f) => f.nombre.trim() && (soloDigitos(f.precio) === 0 || f.costo.trim() === ""));
    if (!saltear && incompletas.length) return setError(`Completá a cuánto vendés y cuánto te cuesta: ${incompletas[0].nombre}.`);
    if (!saltear && productos.some((p) => p.costo > p.precio)) {
      const p = productos.find((x) => x.costo > x.precio)!;
      return setError(`${p.nombre}: te cuesta más de lo que lo vendés. Revisá los números.`);
    }
    return correr(() => acciones.guardarProductos(saltear ? [] : productos), () => setPaso(4));
  }

  function bajarRecordatorio() {
    const blob = new Blob([recordatorioIcs(urlApp)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "recordatorio-en-claro.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const w = wow(fijos, productos);
  const pasos = ["Tu negocio", "Tus gastos", "Tus productos"];

  return (
    <>
      <div className="toldo" aria-hidden="true" />
      <main className="mx-auto flex min-h-[calc(100vh-10px)] max-w-[480px] flex-col gap-6 px-5 pt-6 pb-28">
        <header className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5"><Logo size={30} /><span className="font-display text-lg font-extrabold">En Claro</span></span>
          {paso < 4 ? <span className="text-[14px] font-semibold text-g2">Paso {paso} de 3</span> : null}
        </header>
        {paso < 4 ? (
          <ol className="grid grid-cols-3 gap-2" aria-label="Pasos">
            {pasos.map((p, i) => (
              <li key={p} className="flex flex-col gap-1.5">
                <span className={`h-1.5 rounded-full ${i + 1 <= paso ? "bg-hoja" : "bg-linea2"}`} />
                <span className={`text-[12px] ${i + 1 === paso ? "font-bold text-tinta" : "text-g2"}`}>{p}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {paso === 1 ? (
          <section className="flex flex-col gap-5">
            <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em]">Contanos de tu negocio</h1>
            <label className={etiqueta}>
              ¿Cómo se llama?
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} placeholder="Kiosco Don Pedro" autoComplete="organization" className={entrada} />
            </label>
            <div className="flex flex-col gap-2">
              <span id="rubro" className="text-[15px] font-semibold text-g1">¿Qué es?</span>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="rubro">
                {RUBROS.map((r) => (
                  <button key={r} type="button" role="radio" aria-checked={rubro === r} onClick={() => setRubro(r)}
                    className={`min-h-[64px] cursor-pointer rounded-xl border px-2 text-[16px] font-bold ${rubro === r ? "border-verde bg-verde text-white" : "border-linea2 bg-white text-tinta hover:bg-suave"}`}>
                    {NOMBRES_RUBRO[r]}
                  </button>
                ))}
              </div>
            </div>
            <label className={etiqueta}>
              <span>¿En qué ciudad? <span className="font-normal text-g2">(si querés)</span></span>
              <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} maxLength={120} autoComplete="address-level2" className={entrada} />
            </label>
          </section>
        ) : null}

        {paso === 2 ? (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em]">Tus gastos fijos del mes</h1>
              <p className="text-base leading-[1.6] text-g1">Lo que pagás todos los meses, vendas o no. Si alguno no lo tenés, dejalo en cero.</p>
              {deCalculadora ? <Alerta tipo="ok">Trajimos los números que pusiste en la calculadora. Revisalos.</Alerta> : null}
            </div>
            <Plata etiquetaTexto="Alquiler" valor={alquiler} onChange={setAlquiler} />
            <Plata etiquetaTexto="Luz y servicios" valor={luz} onChange={setLuz} />
            <Plata etiquetaTexto="Sueldos" valor={sueldos} onChange={setSueldos} ayuda="Si trabajás solo, poné lo que te querés pagar a vos." />
            <Plata etiquetaTexto="Otros" valor={otros} onChange={setOtros} ayuda="Contador, internet, monotributo…" />
            <label className={etiqueta}>
              <span>¿Cuánto te cobran por cobrar con tarjeta o QR? <span className="font-normal text-g2">(si sabés)</span></span>
              <span className="relative">
                <input inputMode="decimal" value={comision} onChange={(e) => setComision(e.target.value.replace(/[^\d.,]/g, "").slice(0, 5))} placeholder="Por ejemplo 6" className={`${entrada} pr-10`} />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[17px] font-semibold text-g3">%</span>
              </span>
              <span className="text-[13px] font-normal text-g2">Lo mirás en tu app de cobro. Si no sabés, dejalo vacío y lo cargás después.</span>
            </label>
          </section>
        ) : null}

        {paso === 3 ? (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em]">Cargá 5 productos</h1>
              <p className="text-base leading-[1.6] text-g1">Tocá los que vendés y poné a cuánto lo vendés y cuánto te cuesta. Con eso te decimos cuál te deja plata.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(rubro ? CHIPS[rubro] : CHIPS.kiosco).filter((c) => !filas.some((f) => f.nombre === c)).map((c) => (
                <button key={c} type="button" onClick={() => agregar(c)} className="min-h-[44px] cursor-pointer rounded-full border border-linea2 bg-white px-4 text-[15px] font-semibold text-tinta hover:bg-suave">+ {c}</button>
              ))}
              <button type="button" onClick={() => agregar("")} className="min-h-[44px] cursor-pointer rounded-full border border-dashed border-hoja px-4 text-[15px] font-semibold text-hoja">+ Otro</button>
            </div>
            {filas.length === 0 ? (
              <p className="rounded-xl border border-dashed border-linea2 bg-white px-4 py-5 text-center text-[15px] text-g2">Todavía no elegiste ninguno. Tocá arriba los que vendés.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {filas.map((f) => {
                  const p = { precio: soloDigitos(f.precio), costo: soloDigitos(f.costo) };
                  return (
                    <li key={f.id} className="flex flex-col gap-3 rounded-2xl border border-linea bg-white p-4">
                      <div className="flex items-center gap-2">
                        <input aria-label="Nombre del producto" value={f.nombre} onChange={(e) => cambiar(f.id, "nombre", e.target.value)} placeholder="Nombre" maxLength={120} className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-transparent px-1 text-[17px] font-bold text-tinta focus:border-linea2" />
                        <button type="button" onClick={() => quitar(f.id)} aria-label={`Quitar ${f.nombre || "producto"}`} className="min-h-[44px] min-w-[44px] cursor-pointer rounded-lg text-[22px] text-g2 hover:bg-suave">×</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Plata etiquetaTexto="Lo vendés a" valor={f.precio} onChange={(v) => cambiar(f.id, "precio", v)} />
                        <Plata etiquetaTexto="Te cuesta" valor={f.costo} onChange={(v) => cambiar(f.id, "costo", v)} />
                      </div>
                      {p.precio > 0 && f.costo.trim() !== "" ? (
                        <p className={`text-[14px] font-semibold ${p.costo > p.precio ? "text-rojo" : "text-hoja"}`}>
                          {p.costo > p.precio ? "Te cuesta más de lo que lo vendés" : `Te deja ${pesos(ganancia(p))} por unidad`}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}

        {paso === 4 ? (
          <section className="flex flex-col gap-5" aria-live="polite">
            <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em]">Listo, {nombre.trim() || "ya está"}. Esto es lo que tu cuaderno no te decía:</h1>
            <div className="flex flex-col gap-5 rounded-[24px] bg-verde p-6 text-white">
              <div>
                <p className="text-[15px] text-salvia2">Cada día tenés que cubrir</p>
                <p className="font-display text-[44px] leading-none font-extrabold tracking-[-0.03em]">{pesos(w.diario)}</p>
                <p className="mt-1 text-[15px] text-salvia2">antes de ganar un peso.</p>
              </div>
              <div className="h-px bg-white/15" />
              <div>
                <p className="text-[15px] text-salvia2">Para no perder, vendé</p>
                <p className="font-display text-[44px] leading-none font-extrabold tracking-[-0.03em] text-ambar">{pesos(w.vender)}</p>
                <p className="mt-1 text-[15px] text-salvia2">por día. Ese es tu número del día.</p>
              </div>
            </div>
            {w.mejor ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-linea bg-white p-5">
                <h2 className="font-display text-xl font-bold">Lo que te deja cada producto</h2>
                <p className="text-[16px] leading-[1.55] text-g1">
                  Tu <strong className="text-tinta">{w.mejor.nombre}</strong> te deja <strong className="text-hoja">{pesos(ganancia(w.mejor))}</strong> por unidad
                  {w.peor ? <>; tu <strong className="text-tinta">{w.peor.nombre}</strong>, apenas <strong className="text-rojo">{pesos(ganancia(w.peor))}</strong></> : null}.
                </p>
                <ol className="flex flex-col gap-2">
                  {w.ranking.map((p, i) => {
                    const max = Math.max(1, ganancia(w.ranking[0]));
                    return (
                      <li key={p.nombre + i} className="flex flex-col gap-1">
                        <span className="flex justify-between gap-3 text-[15px]"><span className="min-w-0 truncate">{p.nombre}</span><strong>{pesos(ganancia(p))}</strong></span>
                        <span className="h-2 rounded-full bg-suave"><span className="block h-full rounded-full bg-hoja" style={{ width: `${Math.max(3, (Math.max(0, ganancia(p)) / max) * 100)}%` }} /></span>
                      </li>
                    );
                  })}
                </ol>
                <p className="text-[13px] text-g2">Con tus productos, en promedio te queda el {Math.round(w.margen)}% de lo que vendés.</p>
              </div>
            ) : (
              <p className="rounded-xl border border-linea bg-white px-4 py-3 text-[15px] text-g1">Cuando cargues tus productos, acá vas a ver cuál te deja más plata. Por ahora usamos un 30% de ganancia promedio.</p>
            )}
          </section>
        ) : null}

        {error ? <Alerta>{error}</Alerta> : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-linea bg-papel/95 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-[480px] flex-col gap-2">
          {paso === 1 ? (
            <button type="button" disabled={ocupado} className={botonPrincipal}
              onClick={() => (!rubro ? setError("Elegí si es kiosco, almacén o dietética.") : correr(() => acciones.guardarNegocio({ nombre, rubro, ciudad }), () => setPaso(2)))}>
              {ocupado ? "Guardando…" : "Seguir"}
            </button>
          ) : null}
          {paso === 2 ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => { setError(null); setPaso(1); }} className={`${botonSecundario} w-auto px-5`}>Atrás</button>
              <button type="button" disabled={ocupado} className={botonPrincipal} onClick={() => correr(() => acciones.guardarFijos(fijos), () => setPaso(3))}>{ocupado ? "Guardando…" : "Seguir"}</button>
            </div>
          ) : null}
          {paso === 3 ? (
            <>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setError(null); setPaso(2); }} className={`${botonSecundario} w-auto px-5`}>Atrás</button>
                <button type="button" disabled={ocupado} className={botonPrincipal} onClick={() => guardarPaso3(false)}>{ocupado ? "Guardando…" : productos.length ? "Ver mis números" : "Seguir"}</button>
              </div>
              {filas.length === 0 ? <button type="button" onClick={() => guardarPaso3(true)} className="min-h-[44px] cursor-pointer text-[15px] font-semibold text-g1 underline">Lo hago después</button> : null}
            </>
          ) : null}
          {paso === 4 ? (
            <>
              <button type="button" disabled={ocupado} className={botonPrincipal} onClick={() => correr(acciones.terminar, () => window.location.assign("/app"))}>{ocupado ? "Un segundo…" : "Hacé tu primer cierre hoy a la noche"}</button>
              <button type="button" onClick={bajarRecordatorio} className={botonSecundario}>Recordámelo todos los días a las 21 h</button>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
