"use client";

import { useEffect } from "react";
import { MarcoAuth, botonPrincipal, botonSecundario } from "@/components/auth/Marco";

const CLAVE_RECARGA = "enclaro_recargado";

/** Después de cada actualización, un celular con la app vieja abierta pide archivos que ya no existen. */
export function esArchivoViejo(error: Error) {
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(`${error.name} ${error.message}`);
}

/**
 * Pantalla para cuando algo falla de golpe (P-08 en PROBLEMAS.md). Nunca muestra el error técnico en inglés:
 * explica, deja reintentar, y da un código corto para pedir ayuda por WhatsApp.
 * Si el problema es "app vieja después de una actualización", recarga sola una vez (sin loop).
 */
export function PantallaError({ error, reintentar }: { error: Error & { digest?: string }; reintentar?: () => void }) {
  const codigo = (error.digest ?? "").slice(0, 10) || "sin-codigo";
  useEffect(() => {
    console.error("[pantalla-error]", codigo, error.name, error.message);
    try {
      if (esArchivoViejo(error) && !sessionStorage.getItem(CLAVE_RECARGA)) {
        sessionStorage.setItem(CLAVE_RECARGA, "1");
        window.location.reload();
        return;
      }
      sessionStorage.removeItem(CLAVE_RECARGA);
    } catch {
      // sin sessionStorage (modo privado): se muestra la pantalla igual
    }
  }, [error, codigo]);
  const wpp = (process.env.NEXT_PUBLIC_WHATSAPP ?? "").replace(/\D/g, "");
  const texto = encodeURIComponent(`Hola, la app En Claro me mostró un error (código ${codigo}).`);
  return (
    <MarcoAuth titulo="Algo no anduvo" bajada="No se perdió nada de lo que ya guardaste. Probá de nuevo; si sigue, avisanos y lo arreglamos.">
      <div className="flex flex-col gap-3">
        <button type="button" className={botonPrincipal} onClick={() => (reintentar ? reintentar() : window.location.reload())}>Probar de nuevo</button>
        <a href="/app" className={`${botonSecundario} text-center no-underline`}>Ir a Tu día</a>
        {wpp ? <a href={`https://wa.me/${wpp}?text=${texto}`} className="text-center text-[15px] font-semibold text-hoja">Avisar por WhatsApp</a> : null}
        <p className="text-center text-[13px] text-g2">Código del error: {codigo}</p>
      </div>
    </MarcoAuth>
  );
}
