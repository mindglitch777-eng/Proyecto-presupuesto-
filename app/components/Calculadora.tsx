"use client";

import { useEffect, useRef, useState } from "react";
import { CLAVE_CALCULADORA } from "@/lib/calculadora";
import { MARGEN_INICIAL, MARGEN_MAX, MARGEN_MIN, numeroDelDia } from "@/lib/numeroDelDia";
import { conPuntos, pesos, soloDigitos } from "@/lib/formato";
import { LUGARES_FUNDADORES, RUBROS, type Rubro } from "@/lib/listaEspera";
import { leerUtm } from "./UtmCapture";

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
  const [rubro, setRubro] = useState<Rubro>("kiosco");
  const [video, setVideo] = useState<string | undefined>();
  useEffect(() => setVideo(leerUtm().content), []);

  // El número sale de NEXT_PUBLIC_WHATSAPP (solo dígitos, con 549 adelante). Se escribe literal para que Next lo incluya.
  const numeroWpp = (process.env.NEXT_PUBLIC_WHATSAPP ?? "").replace(/\D/g, "");
  const nombreLimpio = nombre.trim().slice(0, 60);
  const mensaje = [
    "Hola, estoy interesado en En Claro.",
    nombreLimpio ? `Me llamo ${nombreLimpio} y tengo ${rubro === "almacen" ? "un almacén" : rubro === "dietetica" ? "una dietética" : "un kiosco"}.` : `Tengo ${rubro === "almacen" ? "un almacén" : rubro === "dietetica" ? "una dietética" : "un kiosco"}.`,
    `Mi número del día me dio ${pesos(r.vender)}.`,
    "Quiero la aplicación.",
    video ? `(Vi el video ${video})` : "",
  ].filter(Boolean).join(" ");
  const linkWpp = numeroWpp ? `https://wa.me/${numeroWpp}?text=${encodeURIComponent(mensaje)}` : null;

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
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-2xl font-bold tracking-[-0.02em]">¿Querés que En Claro te diga todos los días si lo pasaste?</h3>
              <p className="text-base leading-[1.55] text-g2">Escribinos por WhatsApp y te damos acceso. Los primeros {LUGARES_FUNDADORES} son socios fundadores.</p>
            </div>
            <label className="flex max-w-[460px] flex-col gap-2 text-sm font-semibold text-g1">
              Tu nombre <span className="font-normal text-g3">(si querés)</span>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" maxLength={60} className={entrada} />
            </label>
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
            {linkWpp ? (
              <a href={linkWpp} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-[52px] items-center gap-2.5 self-start rounded-xl bg-[#1f8a4c] px-6 py-4 text-[17px] font-semibold text-white no-underline shadow-[0_8px_24px_-8px_rgba(14,59,42,0.55)] hover:brightness-110">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3a.4.4 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>
                Pedí la app por WhatsApp
              </a>
            ) : (
              <p className="text-[15px] text-g2">Muy pronto vas a poder pedirla por WhatsApp desde acá.</p>
            )}
            <p className="text-[13px] text-g3">Se abre WhatsApp con el mensaje ya escrito. Solo tocás enviar.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
