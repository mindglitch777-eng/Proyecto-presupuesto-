import { Logo } from "./Iconos";

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-linea bg-papel/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-4 px-5 py-3.5">
        <a href="#" className="flex items-center gap-2.5 text-tinta no-underline" aria-label="En Claro, inicio">
          <Logo />
          <span className="font-display text-xl font-extrabold tracking-[-0.02em]">En Claro</span>
        </a>
        <nav className="flex items-center gap-6 text-[15px] font-medium" aria-label="Principal">
          <a href="#funciones" className="hidden text-g1 hover:text-hoja sm:inline">Qué hace</a>
          <a href="#precio" className="hidden text-g1 hover:text-hoja sm:inline">Precio</a>
          <a href="#calculadora" className="rounded-[10px] bg-verde px-4 py-2.5 font-semibold text-white hover:bg-hoja">Probalo gratis</a>
        </nav>
      </div>
    </header>
  );
}
