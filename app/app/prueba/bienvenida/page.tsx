import { notFound } from "next/navigation";
import { Bienvenida } from "@/components/app/Bienvenida";
import { guardarFijos, guardarNegocio, guardarProductos, terminar } from "./acciones";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

// Pantalla de prueba del primer uso (sin base de datos). Solo existe con ENCLARO_MODO_PRUEBA=1; en la web publicada da 404.
export default function PruebaBienvenida() {
  if (process.env.ENCLARO_MODO_PRUEBA !== "1") notFound();
  return <Bienvenida inicial={{ nombre: "Mi negocio", rubro: null, ciudad: "" }} acciones={{ guardarNegocio, guardarFijos, guardarProductos, terminar }} urlApp="https://enclaro.netlify.app/app" />;
}
