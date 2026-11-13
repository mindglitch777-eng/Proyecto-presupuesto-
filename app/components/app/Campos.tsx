"use client";

import { conPuntos } from "@/lib/formato";
import { entrada } from "../auth/Marco";

/** Campo de plata con teclado numérico y puntos de mil mientras se escribe. */
export function Plata({ etiqueta, valor, onChange, ayuda, autoFocus, id }: { etiqueta: string; valor: string; onChange: (v: string) => void; ayuda?: string; autoFocus?: boolean; id?: string }) {
  return (
    <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1" htmlFor={id}>
      {etiqueta}
      <span className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[17px] font-semibold text-g3">$</span>
        <input id={id} inputMode="numeric" autoFocus={autoFocus} value={valor} onChange={(e) => onChange(conPuntos(e.target.value))} placeholder="0" className={`${entrada} pl-9`} />
      </span>
      {ayuda ? <span className="text-[13px] font-normal text-g2">{ayuda}</span> : null}
    </label>
  );
}
