import type { MetadataRoute } from "next";

// App instalable (PWA): se agrega a la pantalla de inicio y abre sin la barra del navegador.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "En Claro",
    short_name: "En Claro",
    description: "Las cuentas que tu cuaderno no te hace.",
    lang: "es-AR",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f8f5",
    theme_color: "#0e3b2a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
