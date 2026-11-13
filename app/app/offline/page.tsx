import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sin conexión · En Claro", robots: { index: false } };

export default function SinConexionPagina() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[440px] flex-col justify-center gap-4 px-5 py-8">
      <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em]">Sin conexión</h1>
      <p className="text-base leading-[1.6] text-g1">No hay internet en este momento. Revisá tu conexión y probá de nuevo: tus datos están guardados.</p>
      <a href="/app" className="min-h-[52px] rounded-xl bg-verde px-6 py-4 text-center text-[17px] font-semibold text-white">Probar de nuevo</a>
    </main>
  );
}
