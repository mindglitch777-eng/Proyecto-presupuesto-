"use client";

import { useState } from "react";
import { CLAVE_MINIMA, emailValido, traducirError } from "@/lib/acceso";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { Alerta, botonPrincipal, entrada } from "./Marco";

type Estado = { fase: "listo" } | { fase: "enviando" } | { fase: "error"; mensaje: string } | { fase: "ok"; mensaje: string };

/** modo "pedir": manda el mail para cambiar la contraseña. modo "nueva": guarda la contraseña nueva (ya con sesión). */
export function FormClave({ modo }: { modo: "pedir" | "nueva" }) {
  const [valor, setValor] = useState("");
  const [estado, setEstado] = useState<Estado>({ fase: "listo" });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (modo === "pedir" && !emailValido(valor)) return setEstado({ fase: "error", mensaje: "Escribí tu mail completo, por ejemplo nombre@gmail.com." });
    if (modo === "nueva" && valor.length < CLAVE_MINIMA) return setEstado({ fase: "error", mensaje: `La contraseña tiene que tener al menos ${CLAVE_MINIMA} caracteres.` });
    setEstado({ fase: "enviando" });
    try {
      const sb = supabaseNavegador();
      if (modo === "pedir") {
        const { error } = await sb.auth.resetPasswordForEmail(valor.trim(), { redirectTo: `${window.location.origin}/auth/callback?siguiente=${encodeURIComponent("/nueva-clave")}` });
        if (error) return setEstado({ fase: "error", mensaje: traducirError(error) });
        return setEstado({ fase: "ok", mensaje: "Listo. Si ese mail tiene cuenta, te mandamos un link para elegir una contraseña nueva." });
      }
      const { error } = await sb.auth.updateUser({ password: valor });
      if (error) return setEstado({ fase: "error", mensaje: traducirError(error) });
      setEstado({ fase: "ok", mensaje: "Listo, cambiaste tu contraseña." });
      setTimeout(() => window.location.assign("/app"), 1200);
    } catch (err) {
      setEstado({ fase: "error", mensaje: traducirError(err as Error) });
    }
  }

  const ocupado = estado.fase === "enviando";
  return (
    <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1">
        {modo === "pedir" ? "Tu mail" : "Tu contraseña nueva"}
        <input
          type={modo === "pedir" ? "email" : "password"}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          autoComplete={modo === "pedir" ? "email" : "new-password"}
          inputMode={modo === "pedir" ? "email" : undefined}
          autoCapitalize="none"
          className={entrada}
        />
      </label>
      {estado.fase === "error" ? <Alerta>{estado.mensaje}</Alerta> : null}
      {estado.fase === "ok" ? <Alerta tipo="ok">{estado.mensaje}</Alerta> : null}
      <button type="submit" disabled={ocupado} className={botonPrincipal}>{ocupado ? "Un segundo…" : modo === "pedir" ? "Mandarme el link" : "Guardar contraseña"}</button>
      {modo === "pedir" ? <p className="text-center text-[15px] text-g1"><a href="/entrar" className="font-semibold text-hoja">Volver a entrar</a></p> : null}
    </form>
  );
}
