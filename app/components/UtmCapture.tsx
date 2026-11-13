"use client";

import { useEffect } from "react";

const CLAVE = "enclaro_utm";
export type Utm = { source?: string; content?: string };

/** Lo que vino en el link del video (?utm_source=tiktok&utm_content=v5-01), guardado en el navegador. */
export function leerUtm(): Utm {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? "{}") as Utm;
  } catch {
    return {};
  }
}

/** Al entrar, guarda el utm del link (si viene). No muestra nada. */
export function UtmCapture() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const source = p.get("utm_source")?.slice(0, 80);
      const content = p.get("utm_content")?.slice(0, 120);
      if (source || content) localStorage.setItem(CLAVE, JSON.stringify({ source, content }));
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  }, []);
  return null;
}
