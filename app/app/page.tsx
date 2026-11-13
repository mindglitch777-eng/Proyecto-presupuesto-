import { lugaresQueQuedan } from "@/lib/lugares";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Funciones } from "@/components/Funciones";
import { Calculadora } from "@/components/Calculadora";
import { ComoFunciona } from "@/components/ComoFunciona";
import { Precio } from "@/components/Precio";
import { Preguntas } from "@/components/Preguntas";
import { CtaFinal } from "@/components/CtaFinal";
import { Footer } from "@/components/Footer";
import { UtmCapture } from "@/components/UtmCapture";

// El contador de lugares se vuelve a pedir a la base como máximo una vez por minuto.
export const revalidate = 60;

export default async function Inicio() {
  const lugares = await lugaresQueQuedan();
  return (
    <>
      <UtmCapture />
      <div className="toldo" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <Funciones />
        <Calculadora />
        <ComoFunciona />
        <Precio lugares={lugares} />
        <Preguntas />
        <CtaFinal />
      </main>
      <Footer />
    </>
  );
}
