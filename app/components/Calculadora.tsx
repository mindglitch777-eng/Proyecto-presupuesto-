"use client";

import { useEffect, useRef, useState } from "react";
import { CLAVE_CALCULADORA } from "@/lib/calculadora";
import { MARGEN_INICIAL, MARGEN_MAX, MARGEN_MIN, numeroDelDia } from "@/lib/numeroDelDia";
import { conPuntos, pesos, soloDigitos } from "@/lib/formato";
import { LUGARES_FUNDADORES, RUBROS, type Rubro } from "@/lib/listaEspera";
import { leerUtm } from "./UtmCapture";
import { Tilde } from "./Iconos";

/** Hace "rodar" un número hasta su nuevo valor (sin animación si la persona pidió menos movimiento). */
function useRueda(valor: number) {
  const [mostrado, setMostrado] = useState(valor);
  const actual = useRef(valor);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      actual.current = valor;
      setMostrado(valor);
      return;
    }
    const desde = actual.current;
    const t0 = performance.now();
    let raf = 0;
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / 500);
      const v = desde + (valor - desde) * (1 - Math.pow(1 - p, 3));
      actual.current = v;
      setMostrado(v);
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor]);
  return mostrado;
}

const ETIQUETAS: Record<Rubro, string> = { kiosco: "Kiosco", almacen: "Almacén", dietetica: "Dietética" };

type Estado = { fase: "libre" } | { fase: "enviando" } | { fase: "error"; mensaje: string } | { fase: "listo"; numero: number; yaEstaba: boolean; nombre: string };

function Campo({ etiqueta, valor, onCambio, signo }: { etiqueta: string; valor: string; onCambio: (v: string) => void; signo?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-g1">
      {etiqueta}
      <span className="flex items-center gap-2 rounded-xl border border-linea2 bg-papel px-4 focus-within:border-hoja">
        {signo ? <span className="text-lg font-semibold text-g3" aria-hidden="true">{signo}</span> : null}
        <input inputMode="numeric" autoComplete="off" value={valor} onChange={(e) => onCambio(conPuntos(e.target.value))} className="min-w-0 flex-1 bg-transparent py-3.5 text-xl font-semibold text-tinta outline-none" />
      </span>
    </label>
  );
}

export function Calculadora() {
  // Los valores que se ven al entrar son de ejemplo (los mismos del prototipo).
  const [alquiler, setAlquiler] = useState("450.000");
  const [luz, setLuz] = useState("140.000");
  const [sueldos, setSueldos] = useState("500.000");
  const [margen, setMargen] = useState(MARGEN_INICIAL);
  const r = numeroDelDia({ alquiler: soloDigitos(alquiler), luz: soloDigitos(luz), sueldos: soloDigitos(sueldos) }, margen);
  const diario = useRueda(r.diario);
  const vender = useRueda(r.vender);

  // Si la persona cambió los números (no los de ejemplo), se guardan para precargarlos al crear su cuenta.
  const primeraVez = useRef(true);
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    try {
      localStorage.setItem(CLAVE_CALCULADORA, JSON.stringify({ alquiler: soloDigitos(alquiler), luz: soloDigitos(luz), sueldos: soloDigitos(sueldos) }));
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  }, [alquiler, luz, sueldos]);

  const [nombre, setNombre] = useState("");
  const [wpp, setWpp] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [rubro, setRubro] = useState<Rubro>("kiosco");
  const [web, setWeb] = useState("");
  const [estado, setEstado] = useState<Estado>({ fase: "libre" });

  async function anotarse(e: React.FormEvent) {
    e.preventDefault();
    if (estado.fase === "enviando") return;
    setEstado({ fase: "enviando" });
    const utm = leerUtm();
    try {
      const res = await fetch("/api/lista-espera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, whatsapp: wpp, rubro, ciudad, numero_del_dia: Math.round(r.vender), utm_source: utm.source, utm_content: utm.content, web }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEstado({ fase: "error", mensaje: j.error ?? "No pudimos guardar tu lugar. Revisá tu conexión y probá de nuevo." });
        return;
      }
      setEstado({ fase: "listo", numero: j.numero, yaEstaba: j.yaEstaba, nombre: nombre.trim().split(" ")[0] || "socio" });
    } catch {
      setEstado({ fase: "error", mensaje: "No pudimos guardar tu lugar. Revisá tu conexión y probá de nuevo." });
    }
  }

  const entrada = "min-h-[50px] w-full rounded-xl border border-linea2 bg-white px-4 py-3.5 text-[17px] font-medium text-tinta";

  return (
    <section id="calculadora" className="scroll-mt-16 border-y border-linea bg-white">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-9 px-5 py-20">
        <div className="flex max-w-[680px] flex-col gap-3">
          <span className="text-[13px] font-bold tracking-[0.08em] text-hoja">GRATIS · SIN REGISTRARTE</span>
          <h2 className="font-display text-[clamp(28px,3.8vw,44px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-balance">¿Cuánto tenés que vender por día para no perder?</h2>
          <p className="text-lg leading-[1.6] text-g2">Poné tus gastos fijos del mes. Los que ves son de ejemplo.</p>
        </div>

        <div className="flex flex-wrap overflow-hidden rounded-[28px] border border-linea shadow-[0_24px_60px_-32px_rgba(15,31,23,0.35)]">
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5 bg-white p-6 sm:p-8">
            <Campo etiqueta="Alquiler del mes" valor={alquiler} onCambio={setAlquiler} signo="$" />
            <Campo etiqueta="Luz y servicios" valor={luz} onCambio={setLuz} signo="$" />
            <Campo etiqueta="Sueldos" valor={sueldos} onCambio={setSueldos} signo="$" />
            <label className="flex flex-col gap-2.5 text-sm font-semibold text-g1">
              <span className="flex justify-between gap-3">
                <span>Cuánto le ganás en promedio a lo que vendés</span>
                <span className="text-base text-tinta">{margen}%</span>
              </span>
              <input type="range" min={MARGEN_MIN} max={MARGEN_MAX} step={1} value={margen} onChange={(e) => setMargen(Number(e.target.value))} className="min-h-7 w-full" />
            </label>
          </div>
          <div className="flex min-w-0 flex-[1_1_380px] flex-col justify-center gap-[22px] bg-verde p-6 text-white sm:p-8" aria-live="polite">
            <div className="flex flex-col gap-1.5">
              <span className="text-[15px] text-salvia">Cada día tenés que cubrir</span>
              <span className="font-display text-[clamp(34px,4.6vw,52px)] font-extrabold leading-none tracking-[-0.03em]">{pesos(diario)}</span>
              <span className="text-[15px] text-salvia">antes de ganar un peso.</span>
            </div>
            <div className="h-px bg-white/15" />
            <div className="flex flex-col gap-1.5">
              <span className="text-[15px] text-salvia">Para no perder, tenés que vender</span>
              <span className="font-display text-[clamp(40px,6vw,72px)] font-extrabold leading-none tracking-[-0.035em] text-ambar">{pesos(vender)}</span>
              <span className="text-[15px] text-salvia">por día. Ese es tu número del día.</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-linea bg-papel p-6 sm:p-8">
          {estado.fase !== "listo" ? (
            <form onSubmit={anotarse} className="flex flex-col gap-5" noValidate>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-display text-2xl font-bold tracking-[-0.02em]">¿Querés que te avise todos los días si lo pasaste?</h3>
                <p className="text-base leading-[1.55] text-g2">Anotate y te escribimos por WhatsApp cuando abramos. Los primeros {LUGARES_FUNDADORES} son socios fundadores.</p>
              </div>
              <div className="flex flex-wrap gap-3.5">
                <label className="flex min-w-[220px] flex-[1_1_220px] flex-col gap-2 text-sm font-semibold text-g1">
                  Tu nombre
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" maxLength={80} required className={entrada} />
                </label>
                <label className="flex min-w-[220px] flex-[1_1_220px] flex-col gap-2 text-sm font-semibold text-g1">
                  Tu WhatsApp
                  <input value={wpp} onChange={(e) => setWpp(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="3756 15 123456" required className={entrada} />
                </label>
                <label className="flex min-w-[220px] flex-[1_1_220px] flex-col gap-2 text-sm font-semibold text-g1">
                  Tu ciudad <span className="font-normal text-g3">(si querés)</span>
                  <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} autoComplete="address-level2" maxLength={80} className={entrada} />
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-g1" id="rubro-etiqueta">Tu negocio es un</span>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="rubro-etiqueta">
                  {RUBROS.map((id) => (
                    <button key={id} type="button" role="radio" aria-checked={rubro === id} onClick={() => setRubro(id)}
                      className={`min-h-[46px] cursor-pointer rounded-full border px-[18px] py-[11px] text-[15px] font-semibold ${rubro === id ? "border-verde bg-verde text-white" : "border-linea2 bg-white text-tinta hover:border-hoja"}`}>
                      {ETIQUETAS[id]}
                    </button>
                  ))}
                </div>
              </div>
              {/* Campo escondido para robots */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>No completar<input tabIndex={-1} autoComplete="off" value={web} onChange={(e) => setWeb(e.target.value)} /></label>
              </div>
              {estado.fase === "error" ? <p role="alert" className="rounded-xl border border-rojo/30 bg-[#fef3f2] px-4 py-3 text-[15px] text-[#b42318]">{estado.mensaje}</p> : null}
              <button type="submit" disabled={estado.fase === "enviando"} className="min-h-[52px] cursor-pointer self-start rounded-xl bg-verde px-6 py-4 text-[17px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(14,59,42,0.55)] hover:bg-hoja disabled:cursor-wait disabled:opacity-70">
                {estado.fase === "enviando" ? "Guardando tu lugar…" : "Quiero ser socio fundador"}
              </button>
            </form>
          ) : (
            <div className="flex items-start gap-4" role="status">
              <span className="flex size-12 flex-none items-center justify-center rounded-full bg-hoja"><Tilde size={24} className="[&_path]:stroke-white" /></span>
              <div className="flex flex-col gap-1.5">
                {estado.numero > LUGARES_FUNDADORES ? (
                  <>
                    <strong className="font-display text-[22px]">¡Listo, {estado.nombre}! Estás en la lista N° {estado.numero}.</strong>
                    <p className="text-base leading-[1.55] text-g2">Los {LUGARES_FUNDADORES} lugares de socio fundador ya se ocuparon, pero te escribimos por WhatsApp apenas abramos.</p>
                  </>
                ) : (
                  <>
                    <strong className="font-display text-[22px]">{estado.yaEstaba ? `¡${estado.nombre}, ya estabas anotado!` : `¡Listo, ${estado.nombre}!`} Sos el socio fundador N° {estado.numero}.</strong>
                    <p className="text-base leading-[1.55] text-g2">Te escribimos por WhatsApp cuando abramos, con tu número del día ya cargado: <strong className="text-tinta">{pesos(r.vender)}</strong>.</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
