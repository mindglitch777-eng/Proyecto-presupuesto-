import { Logo } from "./Iconos";

/** Marco común de Términos y Privacidad: borrador con aviso visible de revisión legal. */
export function PaginaLegal({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <>
      <div className="toldo" aria-hidden="true" />
      <header className="border-b border-linea bg-papel">
        <div className="mx-auto flex max-w-[820px] items-center justify-between gap-4 px-5 py-3.5">
          <a href="/" className="flex items-center gap-2.5 text-tinta no-underline"><Logo size={30} /><span className="font-display text-lg font-extrabold">En Claro</span></a>
          <a href="/" className="text-[15px] font-medium text-g1 hover:text-hoja">Volver al inicio</a>
        </div>
      </header>
      <main className="mx-auto flex max-w-[820px] flex-col gap-5 px-5 py-12 text-base leading-[1.7] text-g1">
        <p role="note" className="rounded-xl border border-ambar/50 bg-crema px-4 py-3 text-[15px] text-oro2">
          <strong>Borrador.</strong> Este texto todavía no fue revisado por un abogado. Puede cambiar antes de que abramos.
        </p>
        <h1 className="font-display text-[clamp(30px,4vw,42px)] font-extrabold tracking-[-0.03em] text-tinta">{titulo}</h1>
        {children}
      </main>
    </>
  );
}

export const h2 = "mt-4 font-display text-[22px] font-bold text-tinta";
