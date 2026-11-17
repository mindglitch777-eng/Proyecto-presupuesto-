"use client";

import { useState } from "react";
import { entrada } from "./Marco";

/** Contraseña con botón para verla: así la persona confirma lo que escribió (las contraseñas no se pueden recuperar). */
export function CampoClave({ etiqueta, valor, onChange, nueva, ayuda }: { etiqueta: string; valor: string; onChange: (v: string) => void; nueva?: boolean; ayuda?: React.ReactNode }) {
  const [ver, setVer] = useState(false);
  return (
    <div className="flex flex-col gap-2 text-[15px] font-semibold text-g1">
      <label htmlFor={nueva ? "clave-nueva" : "clave"}>{etiqueta}</label>
      <span className="relative">
        <input id={nueva ? "clave-nueva" : "clave"} type={ver ? "text" : "password"} value={valor} onChange={(e) => onChange(e.target.value)} autoComplete={nueva ? "new-password" : "current-password"} autoCapitalize="none" autoCorrect="off" spellCheck={false} className={`${entrada} pr-20`} />
        <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={ver}
          className="absolute top-1/2 right-2 min-h-[40px] -translate-y-1/2 cursor-pointer rounded-lg px-3 text-[14px] font-semibold text-hoja hover:bg-suave">
          {ver ? "Ocultar" : "Ver"}
        </button>
      </span>
      {ayuda ? <span className="text-[13px] font-normal text-g2">{ayuda}</span> : null}
    </div>
  );
}
