"use client";

import { useState } from "react";
import { CLAVE_MINIMA, emailValido, rutaSegura, traducirError } from "@/lib/acceso";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { Alerta, botonPrincipal, entrada } from "./Marco";
import { CampoClave } from "./CampoClave";

type Estado = { fase: "listo" } | { fase: "enviando" } | { fase: "error"; mensaje: string };

export function FormEntrar({ siguiente }: { siguiente?: string }) {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState<Estado>({ fase: "listo" });
  const destino = rutaSegura(siguiente);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValido(email)) return setEstado({ fase: "error", mensaje: "Escribí tu mail completo, por ejemplo nombre@gmail.com." });
    if (clave.length < CLAVE_MINIMA) return setEstado({ fase: "error", mensaje: `La contraseña tiene al menos ${CLAVE_MINIMA} caracteres.` });
    setEstado({ fase: "enviando" });
    try {
      const { error } = await supabaseNavegador().auth.signInWithPassword({ email: email.trim(), password: clave });
      if (error) return setEstado({ fase: "error", mensaje: traducirError(error) });
      window.location.assign(destino);
    } catch (err) {
      setEstado({ fase: "error", mensaje: traducirError(err as Error) });
    }
  }

  const ocupado = estado.fase === "enviando";
  return (
    <form onSubmit={entrar} className="flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-2 text-[15px] font-semibold text-g1">
        Tu mail
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" autoCapitalize="none" className={entrada} />
      </label>
      <CampoClave etiqueta="Tu contraseña" valor={clave} onChange={setClave} />
      {estado.fase === "error" ? <Alerta>{estado.mensaje}</Alerta> : null}
      <button type="submit" disabled={ocupado} className={botonPrincipal}>{ocupado ? "Un segundo…" : "Entrar"}</button>
      <p className="flex flex-col gap-2 text-center text-[15px] text-g1">
        <span className="text-[14px] text-g2">Las contraseñas no se pueden recuperar. Si te la olvidaste, tenés que crear una cuenta nueva.</span>
        <span>¿No tenés cuenta? <a href="/registrarme" className="font-semibold text-hoja">Crear mi cuenta</a></span>
      </p>
    </form>
  );
}
