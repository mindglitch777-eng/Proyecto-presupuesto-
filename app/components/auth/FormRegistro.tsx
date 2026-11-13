"use client";

import { useState } from "react";
import { CLAVE_MINIMA, emailValido, traducirError } from "@/lib/acceso";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { leerUtm } from "../UtmCapture";
import { Alerta, botonPrincipal, entrada } from "./Marco";

type Estado = { fase: "listo" } | { fase: "enviando" } | { fase: "error"; mensaje: string } | { fase: "confirmar" };

export function FormRegistro() {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState<Estado>({ fase: "listo" });

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValido(email)) return setEstado({ fase: "error", mensaje: "Escribí tu mail completo, por ejemplo nombre@gmail.com." });
    if (clave.length < CLAVE_MINIMA) return setEstado({ fase: "error", mensaje: `La contraseña tiene que tener al menos ${CLAVE_MINIMA} caracteres.` });
    setEstado({ fase: "enviando" });
    const utm = leerUtm();
    try {
      const { data, error } = await supabaseNavegador().auth.signUp({
        email: email.trim(),
        password: clave,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { utm_source: utm.source ?? null, utm_content: utm.content ?? null },
        },
      });
      if (error) return setEstado({ fase: "error", mensaje: traducirError(error) });
      if (data.session) return window.location.assign("/app");
      setEstado({ fase: "confirmar" });
    } catch (err) {
      setEstado({ fase: "error", mensaje: traducirError(err as Error) });
    }
  }

  if (estado.fase === "confirmar") {
    return (
      <div className="flex flex-col gap-4">
        <Alerta tipo="ok">Te mandamos un mail a <strong>{email.trim()}</strong>. Tocá el link que trae para confirmar tu cuenta y empezar tus 14 días gratis.</Alerta>
        <p className="text-[15px] text-g1">Si no lo ves, mirá la carpeta de spam. A veces tarda un minuto.</p>
      </div>
    );
  }
  const ocupado = estado.fase === "enviando";
  return (
    <form onSubmit={crear} className="flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1">
        Tu mail
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" autoCapitalize="none" className={entrada} />
      </label>
      <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1">
        Elegí una contraseña
        <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="new-password" className={entrada} />
        <span className="text-[13px] font-normal text-g2">Al menos {CLAVE_MINIMA} caracteres.</span>
      </label>
      {estado.fase === "error" ? <Alerta>{estado.mensaje}</Alerta> : null}
      <button type="submit" disabled={ocupado} className={botonPrincipal}>{ocupado ? "Un segundo…" : "Crear mi cuenta"}</button>
      <p className="text-center text-[13px] leading-[1.5] text-g2">
        Al crear tu cuenta aceptás los <a href="/terminos" className="underline">términos</a> y la <a href="/privacidad" className="underline">política de privacidad</a>.
      </p>
      <p className="text-center text-[15px] text-g1">¿Ya tenés cuenta? <a href="/entrar" className="font-semibold text-hoja">Entrar</a></p>
    </form>
  );
}
