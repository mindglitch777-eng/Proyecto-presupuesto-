const pasos = [
  ["Cargás tu negocio", "Tus gastos fijos y una foto de la última factura del proveedor. Menos de 5 minutos."],
  ["Cerrás hablando", "A la noche le contás cuánto vendiste y qué pagaste. Sin planillas, sin cargar cada venta."],
  ["Mirás tu número", "Cuánto te quedó, quién te debe, qué precio actualizar y qué plata tenés dormida."],
];

export function ComoFunciona() {
  return (
    <section className="mx-auto flex max-w-[1160px] flex-col gap-9 px-5 py-20">
      <div className="flex max-w-[680px] flex-col gap-3">
        <span className="text-[13px] font-bold tracking-[0.08em] text-hoja">CÓMO FUNCIONA</span>
        <h2 className="font-display text-[clamp(28px,3.8vw,44px)] font-extrabold leading-[1.1] tracking-[-0.03em]">5 minutos por día. Nada más.</h2>
      </div>
      <ol className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
        {pasos.map(([t, d], i) => (
          <li key={t} className="flex flex-col gap-3 rounded-[20px] border border-linea bg-white p-6">
            <span className="flex size-10 items-center justify-center rounded-full bg-verde font-display font-extrabold text-ambar">{i + 1}</span>
            <strong className="font-display text-xl">{t}</strong>
            <span className="text-base leading-[1.55] text-g2">{d}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
