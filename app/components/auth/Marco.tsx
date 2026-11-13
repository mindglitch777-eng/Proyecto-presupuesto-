import { Logo } from "../Iconos";

export const entrada = "min-h-[50px] w-full rounded-xl border border-linea2 bg-white px-4 py-3.5 text-[17px] font-medium text-tinta";
export const botonPrincipal = "min-h-[52px] w-full cursor-pointer rounded-xl bg-verde px-6 py-4 text-[17px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(14,59,42,0.55)] hover:bg-hoja disabled:cursor-wait disabled:opacity-70";
export const botonSecundario = "min-h-[48px] w-full cursor-pointer rounded-xl border border-linea2 bg-white px-6 py-3 text-base font-semibold text-tinta hover:bg-suave disabled:cursor-wait disabled:opacity-70";

/** Marco común de las pantallas de entrar, registrarse y recuperar la contraseña. */
export function MarcoAuth({ titulo, bajada, children }: { titulo: string; bajada?: string; children: React.ReactNode }) {
  return (
    <>
      <div className="toldo" aria-hidden="true" />
      <main className="mx-auto flex min-h-[calc(100vh-10px)] max-w-[440px] flex-col gap-6 px-5 py-8">
        <a href="/" className="flex items-center gap-2.5 text-tinta no-underline">
          <Logo size={32} />
          <span className="font-display text-xl font-extrabold">En Claro</span>
        </a>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] text-tinta">{titulo}</h1>
          {bajada ? <p className="text-base leading-[1.6] text-g1">{bajada}</p> : null}
        </div>
        {children}
      </main>
    </>
  );
}

/** Aviso cuando todavía no se cargaron las variables de Supabase. */
export function SinConexion() {
  return (
    <MarcoAuth titulo="Todavía no está lista la conexión" bajada="Falta terminar de configurar la base de datos. Cuando esté, esta pantalla funciona sola.">
      <p role="note" className="rounded-xl border border-ambar/50 bg-crema px-4 py-3 text-[15px] text-oro2">
        Para quien configura: falta cargar <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en Netlify.
      </p>
    </MarcoAuth>
  );
}

export function Alerta({ children, tipo = "error" }: { children: React.ReactNode; tipo?: "error" | "ok" }) {
  return tipo === "error" ? (
    <p role="alert" className="rounded-xl border border-rojo/30 bg-[#fef3f2] px-4 py-3 text-[15px] text-[#b42318]">{children}</p>
  ) : (
    <p role="status" className="rounded-xl border border-hoja/30 bg-menta px-4 py-3 text-[15px] text-verde">{children}</p>
  );
}
