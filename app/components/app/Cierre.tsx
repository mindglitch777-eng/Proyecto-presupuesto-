"use client";

import { useEffect, useRef, useState } from "react";
import { entenderCierre } from "@/lib/voz";
import { CATEGORIAS, comisionDe, resultadoDelDia, type Gasto } from "@/lib/cierre";
import { conPuntos, pesos, soloDigitos } from "@/lib/formato";
import type { Resultado } from "@/lib/resultado";
import { Alerta, botonPrincipal, botonSecundario, entrada } from "../auth/Marco";
import { Plata } from "./Campos";

type Producto = { id: string; nombre: string };
type Previo = { ventas: number; tarjeta: number; gastos: Gasto[]; productos: string[] } | null;
type Fase = "elegir" | "escuchando" | "escribir" | "confirmar" | "listo";

type Reconocedor = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; abort(): void; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null };
type ConstructorReconocedor = new () => Reconocedor;

const vacio = () => ({ proveedor: "", flete: "", vuelto: "", otros: "" });

export function Cierre(p: { fecha: string; hoy: string; productos: Producto[]; comisionPct: number | null; fijosMes: number; margen: number | null; previo: Previo; guardar: (d: unknown) => Promise<Resultado> }) {
  const [fase, setFase] = useState<Fase>(p.previo ? "confirmar" : "elegir");
  const [texto, setTexto] = useState("");
  const [parcial, setParcial] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const enCurso = useRef(false); // evita guardar dos veces con un doble toque
  const [fuente, setFuente] = useState<"voz" | "manual">("manual");
  const [ventas, setVentas] = useState(p.previo ? conPuntos(String(p.previo.ventas)) : "");
  const [tarjeta, setTarjeta] = useState(p.previo?.tarjeta ? conPuntos(String(p.previo.tarjeta)) : "");
  const [gastos, setGastos] = useState<Record<string, string>>(() => {
    const g = vacio() as Record<string, string>;
    for (const x of p.previo?.gastos ?? []) if (x.categoria !== "comision") g[x.categoria] = conPuntos(String(x.monto));
    return g;
  });
  const [movidos, setMovidos] = useState<string[]>(p.previo?.productos ?? []);
  const [busca, setBusca] = useState("");
  const [hayVoz, setHayVoz] = useState(true);
  const rec = useRef<Reconocedor | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: ConstructorReconocedor; webkitSpeechRecognition?: ConstructorReconocedor };
    setHayVoz(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => rec.current?.abort();
  }, []);

  function aplicar(frase: string, origen: "voz" | "manual") {
    const r = entenderCierre(frase, p.productos.map((x) => x.nombre));
    if (!r.ventas && !r.gastos.length) {
      setError(`No encontré montos en lo que dijiste${frase.trim() ? ` (escuché: «${frase.trim().slice(0, 160)}»)` : ""}. Probá de nuevo, por ejemplo: «vendí ciento veinte mil, le pagué sesenta mil al proveedor».`);
      setFase(origen === "voz" && hayVoz ? "elegir" : "escribir");
      return;
    }
    setError(null);
    setFuente(origen);
    setVentas(r.ventas ? conPuntos(String(r.ventas)) : "");
    setTarjeta(r.tarjeta ? conPuntos(String(r.tarjeta)) : "");
    const g = vacio() as Record<string, string>;
    for (const x of r.gastos) g[x.categoria] = conPuntos(String(x.monto));
    setGastos(g);
    const ids = p.productos.filter((x) => r.productos.includes(x.nombre)).map((x) => x.id);
    setMovidos((m) => Array.from(new Set([...m, ...ids])));
    setFase("confirmar");
  }

  function escuchar() {
    setError(null);
    const w = window as unknown as { SpeechRecognition?: ConstructorReconocedor; webkitSpeechRecognition?: ConstructorReconocedor };
    const C = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!C) return setFase("escribir");
    const r = new C();
    r.lang = "es-AR";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      // Se rearma todo el texto en cada evento (no se va sumando): Chrome de Android a veces repite
      // frases ya entregadas o manda cada frase acumulada ("vendí", "vendí 120 mil", …), y eso duplicaba montos.
      const finales: string[] = [];
      let tmp = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        const tx = res[0].transcript.trim();
        if (!tx) continue;
        if (res.isFinal) {
          const ultima = finales[finales.length - 1];
          if (ultima && tx.startsWith(ultima)) finales[finales.length - 1] = tx;
          else if (!(ultima && ultima.endsWith(tx))) finales.push(tx);
        } else tmp = tx;
      }
      setTexto(finales.join(" "));
      setParcial(tmp);
    };
    r.onerror = (e) => {
      setError(e.error === "not-allowed" || e.error === "service-not-allowed" ? "El celular no dejó usar el micrófono. Podés escribirlo." : "No te escuché bien. Probá de nuevo o escribilo.");
      setFase("escribir");
    };
    rec.current = r;
    setTexto("");
    setParcial("");
    setFase("escuchando");
    r.start();
  }

  function terminarDeHablar() {
    rec.current?.stop();
    const frase = `${texto} ${parcial}`.trim();
    if (!frase) {
      setError("No escuché nada. Tocá el micrófono y hablá cerca del celular.");
      return setFase("elegir");
    }
    setTexto(frase);
    aplicar(frase, "voz");
  }

  const nVentas = soloDigitos(ventas), nTarjeta = soloDigitos(tarjeta);
  const listaGastos: Gasto[] = CATEGORIAS.map((c) => ({ categoria: c.id, monto: soloDigitos(gastos[c.id] ?? "") })).filter((g) => g.monto > 0);
  const resultado = resultadoDelDia({ ventas: nVentas, tarjeta: nTarjeta, gastos: listaGastos, comisionPct: p.comisionPct, fijosMes: p.fijosMes, margenPct: p.margen });

  async function guardar() {
    setError(null);
    if (!nVentas) return setError("Poné cuánto vendiste.");
    if (nTarjeta > nVentas) return setError("Lo que cobraste con tarjeta o QR no puede ser más que lo que vendiste.");
    if (enCurso.current) return;
    enCurso.current = true;
    setOcupado(true);
    try {
      const r = await p.guardar({ fecha: p.fecha, ventas: nVentas, tarjeta: nTarjeta, gastos: listaGastos, productos: movidos, fuente });
      if (r.ok) setFase("listo");
      else setError(r.mensaje);
    } catch {
      setError("No se pudo guardar. Revisá tu conexión y probá de nuevo.");
    } finally {
      enCurso.current = false;
      setOcupado(false);
    }
  }

  const filtrados = p.productos.filter((x) => !busca.trim() || x.nombre.toLowerCase().includes(busca.trim().toLowerCase()));
  const visibles = busca.trim() ? filtrados : filtrados.slice(0, 12);
  const esHoy = p.fecha === p.hoy;

  if (fase === "listo") {
    return (
      <section className="flex flex-col gap-5" aria-live="polite">
        <div className="flex flex-col gap-4 rounded-[24px] bg-verde p-6 text-white">
          <p className="text-[15px] text-salvia2">{esHoy ? "Hoy te quedaron libres" : "Ese día te quedaron libres"}</p>
          <p className={`font-display text-[46px] leading-none font-extrabold tracking-[-0.03em] ${resultado.libres < 0 ? "text-rosa" : ""}`}>{pesos(resultado.libres)}</p>
          <p className="text-[14px] text-salvia2">Vendiste {pesos(nVentas)} · gastos {pesos(resultado.gastos)} · fijos del día {pesos(resultado.fijosDia)}</p>
          <div className="h-3 overflow-hidden rounded-full bg-white/15"><div className={`h-full rounded-full ${resultado.pasaste ? "bg-ambar" : "bg-salvia"}`} style={{ width: `${Math.max(4, resultado.progreso * 100)}%` }} /></div>
          <p className="text-[15px] font-semibold">{resultado.pasaste ? `Pasaste tu número del día (${pesos(resultado.vender)}).` : `Te faltaron ${pesos(resultado.vender - nVentas)} para tu número del día.`}</p>
        </div>
        <a href="/app" className={`${botonPrincipal} text-center`}>Ver tu día</a>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em]">{esHoy ? "Cierre de hoy" : "Cierre del día"}</h1>
        <label className="text-[14px] text-g1">
          <span className="sr-only">Fecha del cierre</span>
          <input type="date" value={p.fecha} max={p.hoy} onChange={(e) => e.target.value && window.location.assign(`/app/cierre?fecha=${e.target.value}`)} className="min-h-[44px] rounded-xl border border-linea2 bg-white px-3 text-[15px]" />
        </label>
      </div>

      {fase === "elegir" ? (
        <div className="flex flex-col items-center gap-4 rounded-[24px] bg-verde px-6 py-8 text-center text-white">
          <button type="button" onClick={hayVoz ? escuchar : () => setFase("escribir")} aria-label="Hablar" className="flex size-[120px] cursor-pointer items-center justify-center rounded-full bg-ambar text-tinta shadow-[0_0_0_10px_rgba(245,165,36,0.18)]">
            <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>
          </button>
          <p className="font-display text-[22px] font-bold">{hayVoz ? "Tocá y contame cómo te fue" : "Contame cómo te fue"}</p>
          <p className="max-w-[320px] text-[15px] leading-[1.5] text-salvia2">Decí cuánto vendiste y qué pagaste, como se lo contarías a alguien. Por ejemplo: «vendí ciento veinte mil, ochenta con QR, le pagué sesenta al proveedor».</p>
          <button type="button" onClick={() => setFase("confirmar")} className="min-h-[44px] cursor-pointer text-[15px] font-semibold underline">Prefiero cargarlo a mano</button>
        </div>
      ) : null}

      {fase === "escuchando" ? (
        <div className="flex flex-col items-center gap-4 rounded-[24px] bg-verde px-6 py-8 text-center text-white" aria-live="polite">
          <span className="relative flex size-[110px] items-center justify-center rounded-full bg-ambar text-tinta">
            <span className="absolute inset-0 animate-ping rounded-full bg-ambar/40 motion-reduce:animate-none" />
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>
          </span>
          <p className="font-display text-[20px] font-bold">Te escucho…</p>
          <p className="min-h-[48px] text-[17px] leading-[1.5]">{texto}<span className="text-salvia2">{parcial}</span></p>
          <button type="button" onClick={terminarDeHablar} className="min-h-[52px] w-full cursor-pointer rounded-xl bg-ambar px-6 text-[17px] font-bold text-tinta">Listo</button>
        </div>
      ) : null}

      {fase === "escribir" ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1">
            Escribilo como lo dirías
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} maxLength={1500} placeholder="vendí 120 mil, 80 mil con QR, le pagué 60 mil al proveedor y 5 mil de flete" className={`${entrada} min-h-[110px]`} />
          </label>
          <button type="button" onClick={() => aplicar(texto, "manual")} className={botonPrincipal}>Entender</button>
          <button type="button" onClick={() => setFase("confirmar")} className={botonSecundario}>Cargarlo a mano</button>
        </div>
      ) : null}

      {fase === "confirmar" ? (
        <div className="flex flex-col gap-5">
          {fuente === "voz" || texto ? <p className="rounded-xl border border-hoja/30 bg-menta px-4 py-3 text-[15px] text-verde">Esto es lo que entendí. Revisalo y corregí lo que haga falta.</p> : null}
          <Plata etiqueta="Vendiste" valor={ventas} onChange={setVentas} id="ventas" />
          <Plata etiqueta="De eso, con tarjeta o QR" valor={tarjeta} onChange={setTarjeta} id="tarjeta" ayuda={p.comisionPct ? `Te cobran ${String(p.comisionPct).replace(".", ",")}%: ${pesos(comisionDe(nTarjeta, p.comisionPct))} de comisión.` : "Cargá tu comisión en Ajustes para descontarla."} />
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-display text-[18px] font-bold">Lo que pagaste hoy</legend>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIAS.map((c) => <Plata key={c.id} etiqueta={c.nombre} valor={gastos[c.id] ?? ""} onChange={(v) => setGastos((g) => ({ ...g, [c.id]: v }))} id={`gasto-${c.id}`} />)}
            </div>
          </fieldset>
          {p.productos.length ? (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 font-display text-[18px] font-bold">¿Qué se movió hoy?</legend>
              <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar producto" aria-label="Buscar producto" className={entrada} />
              <div className="flex flex-wrap gap-2">
                {visibles.map((x) => {
                  const on = movidos.includes(x.id);
                  return (
                    <button key={x.id} type="button" aria-pressed={on} onClick={() => setMovidos((m) => (on ? m.filter((y) => y !== x.id) : [...m, x.id]))}
                      className={`min-h-[44px] cursor-pointer rounded-full border px-4 text-[15px] font-semibold ${on ? "border-verde bg-verde text-white" : "border-linea2 bg-white text-tinta"}`}>
                      {on ? "✓ " : ""}{x.nombre}
                    </button>
                  );
                })}
              </div>
              <p className="text-[13px] text-g2">Con esto te avisamos qué productos no se mueven.</p>
            </fieldset>
          ) : null}
          {nVentas ? (
            <p className="rounded-xl bg-suave px-4 py-3 text-[15px] text-g1">
              Te quedarían <strong className={resultado.libres < 0 ? "text-rojo" : "text-hoja"}>{pesos(resultado.libres)}</strong> libres.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <Alerta>{error}</Alerta> : null}

      {fase === "confirmar" ? (
        <div className="fixed inset-x-0 bottom-[60px] z-10 border-t border-linea bg-papel/95 px-5 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-[520px] gap-2">
            {hayVoz && !p.previo ? <button type="button" onClick={escuchar} className={`${botonSecundario} w-auto px-4`} aria-label="Volver a hablar"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg></button> : null}
            <button type="button" disabled={ocupado} onClick={guardar} className={botonPrincipal}>{ocupado ? "Guardando…" : "Guardar cierre"}</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
