"use client";

import { PantallaError } from "@/components/errores/PantallaError";

export default function ErrorDePantalla({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PantallaError error={error} reintentar={reset} />;
}
