/** El número de WhatsApp sale de NEXT_PUBLIC_WHATSAPP (solo dígitos, con código de país). Si falta, no se muestra. */
function formatearWhatsapp(d: string) {
  const m = d.match(/^549(\d{2,4})(\d{6,8})$/);
  return m ? `+54 9 ${m[1]} ${m[2]}` : `+${d}`;
}

export function Footer() {
  const wpp = (process.env.NEXT_PUBLIC_WHATSAPP ?? "").replace(/\D/g, "");
  return (
    <footer className="border-t border-linea">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-x-7 gap-y-4 px-5 py-8 text-sm text-g2">
        <span className="flex flex-wrap items-center gap-x-2"><strong className="font-display text-tinta">En Claro</strong>· Hecho en Santo Tomé, Corrientes · Dale Web</span>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Información">
          <a href="/terminos" className="text-g1 hover:text-hoja">Términos</a>
          <a href="/privacidad" className="text-g1 hover:text-hoja">Privacidad</a>
          <a href="/baja" className="text-g1 hover:text-hoja">Darme de baja</a>
          {wpp ? (
            <span>WhatsApp: <a href={`https://wa.me/${wpp}`} className="text-g1 hover:text-hoja">{formatearWhatsapp(wpp)}</a></span>
          ) : null}
        </nav>
      </div>
    </footer>
  );
}
