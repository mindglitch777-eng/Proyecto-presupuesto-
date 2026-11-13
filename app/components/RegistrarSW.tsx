"use client";

import { useEffect } from "react";

/** Registra el service worker solo en la web publicada (no en desarrollo). */
export function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  return null;
}
