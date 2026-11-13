"use client";

import { useState } from "react";

export function FormularioBaja() {
  const [wpp, setWpp] = useState("");
  const [estado, setEstado] = useState<{ fase: "libre" | "enviando" } | { fase: "error"; mensaje: string } | { fase: "listo"; tramite: string | null }>({ fase: "libre" });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado({ fase: "enviando" });
    try {
      const res = await fetch("/api/baja", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ whatsapp: wpp }) });
      const j = await res.json().catch(() => ({}));
      setEstado(res.ok ? { fase: "listo", tramite: j.tramite ?? null } : { fase: "error", mensaje: j.error ?? "No pudimos procesar la baja. Probá de nuevo en un rato." });
    } catch {
      setEstado({ fase: "error", mensaje: "No pudimos procesar la baja. Revisá tu conexión y probá de nuevo." });
    }
  }

  if (estado.fase === "listo") {
    return (
      <div role="status" className="rounded-2xl border border-linea bg-white p-6">
        {estado.tramite ? (
          <>
            <strong className="font-display text-xl text-tinta">Listo: borramos tus datos.</strong>
            <p className="mt-2">Tu número de trámite es <strong className="text-tinta">{estado.tramite}</strong>. Guardalo por si lo necesitás.</p>
          </>
        ) : (
          <>
            <strong className="font-display text-xl text-tinta">No encontramos ese número.</strong>
            <p className="mt-2">Puede que ya te hayas dado de baja o que te hayas anotado con otro WhatsApp. Probá con el otro.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4 rounded-2xl border border-linea bg-white p-6" noValidate>
      <label className="flex flex-col gap-2 text-sm font-semibold text-g1">
        Tu WhatsApp
        <input value={wpp} onChange={(e) => setWpp(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="3756 15 123456" required className="min-h-[50px] w-full rounded-xl border border-linea2 bg-white px-4 py-3.5 text-[17px] font-medium text-tinta" />
      </label>
      {estado.fase === "error" ? <p role="alert" className="rounded-xl border border-rojo/30 bg-[#fef3f2] px-4 py-3 text-[15px] text-[#b42318]">{estado.mensaje}</p> : null}
      <button type="submit" disabled={estado.fase === "enviando"} className="min-h-[52px] cursor-pointer self-start rounded-xl bg-verde px-6 py-4 text-[17px] font-semibold text-white hover:bg-hoja disabled:cursor-wait disabled:opacity-70">
        {estado.fase === "enviando" ? "Procesando…" : "Borrar mis datos"}
      </button>
    </form>
  );
}
