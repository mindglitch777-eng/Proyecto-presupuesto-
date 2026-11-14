import { NextResponse } from "next/server";
import { reiniciarMemoria } from "@/lib/datos/memoria";

// Solo para las pruebas automáticas: vuelve los datos de ejemplo a cero. En la web publicada da 404.
export async function POST() {
  if (process.env.ENCLARO_MODO_PRUEBA !== "1") return new NextResponse(null, { status: 404 });
  reiniciarMemoria();
  return NextResponse.json({ ok: true });
}
