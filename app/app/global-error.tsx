"use client";

import "./globals.css";
import { PantallaError } from "@/components/errores/PantallaError";

// Si falla hasta el armazón de la página, igual se muestra en español.
export default function ErrorGeneral({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="es-AR">
      <body>
        <PantallaError error={error} />
      </body>
    </html>
  );
}
