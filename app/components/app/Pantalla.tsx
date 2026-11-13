import { Logo } from "../Iconos";

export type Seccion = "dia" | "cierre" | "fiados" | "precios" | "deposito";
const NAV: { id: Seccion; href: string; texto: string; icono: React.ReactNode }[] = [
  { id: "dia", href: "/app", texto: "Tu día", icono: <path d="M4 11.5 12 5l8 6.5V20H4z" /> },
  { id: "cierre", href: "/app/cierre", texto: "Cierre", icono: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></> },
  { id: "fiados", href: "/app/fiados", texto: "Fiados", icono: <><path d="M5 4h11l3 3v13H5z" /><path d="M8.5 10h7M8.5 14h5" /></> },
  { id: "precios", href: "/app/precios", texto: "Precios", icono: <><path d="M3.5 12.5 12 4h8v8l-8.5 8.5z" /><circle cx="16" cy="8" r="1.4" /></> },
  { id: "deposito", href: "/app/deposito", texto: "Depósito", icono: <><path d="M3 9 12 4l9 5v11H3z" /><path d="M8 20v-6h8v6" /></> },
];

/** Marco de las pantallas de la app: arriba el negocio, abajo la barra para moverse con el pulgar. */
export function Pantalla({ seccion, negocio, children }: { seccion: Seccion; negocio: string; children: React.ReactNode }) {
  return (
    <>
      <div className="toldo" aria-hidden="true" />
      <header className="mx-auto flex max-w-[520px] items-center justify-between gap-3 px-5 pt-4">
        <span className="flex min-w-0 items-center gap-2.5"><Logo size={28} /><span className="truncate font-display text-[17px] font-extrabold">{negocio}</span></span>
        <a href="/app/ajustes" className="min-h-[44px] min-w-[44px] rounded-xl px-2 text-[14px] leading-[44px] font-semibold text-g1">Ajustes</a>
      </header>
      <main className="mx-auto flex max-w-[520px] flex-col gap-5 px-5 pt-3 pb-32">{children}</main>
      <nav aria-label="Secciones" className="fixed inset-x-0 bottom-0 z-20 border-t border-linea bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid max-w-[520px] grid-cols-5">
          {NAV.map((n) => (
            <li key={n.id}>
              <a href={n.href} aria-current={n.id === seccion ? "page" : undefined} className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[12px] font-semibold ${n.id === seccion ? "text-verde" : "text-g2"}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={n.id === seccion ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{n.icono}</svg>
                {n.texto}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export const tarjeta = "rounded-2xl border border-linea bg-white p-5";
export const tituloSeccion = "font-display text-[20px] font-bold text-tinta";
