"use client";

import { useState } from "react";
import { conPuntos, soloDigitos } from "@/lib/formato";
import type { Ajustes as TAjustes } from "@/lib/datos/tipos";
import type { Resultado } from "@/lib/resultado";
import { Alerta, botonPrincipal, botonSecundario, entrada } from "../auth/Marco";
import { Plata } from "./Campos";

const etiqueta = "flex flex-col gap-2 text-[15px] font-semibold text-g1";

export function Ajustes({ inicial, guardar }: { inicial: TAjustes; guardar: (d: unknown) => Promise<Resultado> }) {
  const [nombre, setNombre] = useState(inicial.nombre);
  const [ciudad, setCiudad] = useState(inicial.ciudad ?? "");
  const [comision, setComision] = useState(inicial.comisionPct !== null ? String(inicial.comisionPct).replace(".", ",") : "");
  const [alerta, setAlerta] = useState(String(inicial.alertaPct));
  const [dias, setDias] = useState(String(inicial.diasDormida));
  const [redondeo, setRedondeo] = useState(inicial.redondeo);
  const [fijos, setFijos] = useState(inicial.fijos.map((f) => ({ concepto: f.concepto, monto: conPuntos(String(f.monto)) })));
  const [estado, setEstado] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado(null);
    setOcupado(true);
    try {
      const r = await guardar({
        nombre, ciudad: ciudad || null,
        comisionPct: comision.trim() === "" ? null : Number(comision.replace(",", ".")),
        alertaPct: Number(alerta) || 0, diasDormida: Number(dias) || 30, redondeo,
        fijos: fijos.map((f) => ({ concepto: f.concepto, monto: soloDigitos(f.monto) })),
      });
      setEstado(r.ok ? { tipo: "ok", texto: "Listo, guardado." } : { tipo: "error", texto: r.mensaje });
    } catch {
      setEstado({ tipo: "error", texto: "No se pudo guardar. Revisá tu conexión y probá de nuevo." });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-6">
      <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em]">Ajustes</h1>
      <fieldset className="flex flex-col gap-4 rounded-2xl border border-linea bg-white p-5">
        <legend className="px-1 font-display text-[18px] font-bold">Tu negocio</legend>
        <label className={etiqueta}>Nombre<input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} className={entrada} /></label>
        <label className={etiqueta}>Ciudad<input value={ciudad} onChange={(e) => setCiudad(e.target.value)} maxLength={120} className={entrada} /></label>
      </fieldset>
      <fieldset className="flex flex-col gap-4 rounded-2xl border border-linea bg-white p-5">
        <legend className="px-1 font-display text-[18px] font-bold">Gastos fijos del mes</legend>
        {fijos.map((f, i) => (
          <Plata key={i} etiqueta={f.concepto || "Otro gasto"} valor={f.monto} onChange={(v) => setFijos(fijos.map((x, j) => (j === i ? { ...x, monto: v } : x)))} id={`fijo-${i}`} />
        ))}
        <button type="button" onClick={() => setFijos([...fijos, { concepto: `Otro gasto ${fijos.length + 1}`, monto: "" }])} className={botonSecundario}>Agregar otro gasto</button>
      </fieldset>
      <fieldset className="flex flex-col gap-4 rounded-2xl border border-linea bg-white p-5">
        <legend className="px-1 font-display text-[18px] font-bold">Cobros y precios</legend>
        <label className={etiqueta}>
          <span>Comisión por cobrar con tarjeta o QR</span>
          <span className="relative"><input inputMode="decimal" value={comision} onChange={(e) => setComision(e.target.value.replace(/[^\d.,]/g, "").slice(0, 5))} placeholder="Por ejemplo 6" className={`${entrada} pr-10`} /><span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-g3">%</span></span>
        </label>
        <label className={etiqueta}>
          <span>Avisarme si un producto deja menos de</span>
          <span className="relative"><input inputMode="numeric" value={alerta} onChange={(e) => setAlerta(e.target.value.replace(/\D/g, "").slice(0, 3))} className={`${entrada} pr-10`} /><span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-g3">%</span></span>
        </label>
        <div className="flex flex-col gap-2">
          <span id="redondeo" className="text-[15px] font-semibold text-g1">Redondear los precios sugeridos a</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="redondeo">
            {[10, 50, 100].map((r) => (
              <button key={r} type="button" role="radio" aria-checked={redondeo === r} onClick={() => setRedondeo(r)} className={`min-h-[48px] cursor-pointer rounded-xl border font-bold ${redondeo === r ? "border-verde bg-verde text-white" : "border-linea2 bg-white"}`}>${r}</button>
            ))}
          </div>
        </div>
        <label className={etiqueta}>
          <span>Avisarme de productos sin ventas hace más de</span>
          <span className="relative"><input inputMode="numeric" value={dias} onChange={(e) => setDias(e.target.value.replace(/\D/g, "").slice(0, 3))} className={`${entrada} pr-14`} /><span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-g3">días</span></span>
        </label>
      </fieldset>
      {estado ? <Alerta tipo={estado.tipo}>{estado.texto}</Alerta> : null}
      <button type="submit" disabled={ocupado} className={botonPrincipal}>{ocupado ? "Guardando…" : "Guardar ajustes"}</button>
    </form>
  );
}
