const preguntas = [
  ["¿Necesito computadora?", "No. Todo se hace desde el celular, y lo podés tener como una app más en la pantalla."],
  ["¿Tengo que cargar cada venta?", "No. Cargás el total del día una sola vez, al cerrar. Hablando o escribiendo."],
  ["¿Qué pasa con mis datos si dejo de pagar?", "Quedan guardados. Si volvés, está todo como lo dejaste. Y si querés, los borrás con un botón."],
  ["¿Me hace las facturas?", "No. En Claro no factura ni reemplaza tu caja: te dice cuánto ganás y qué hacer."],
];

export function Preguntas() {
  return (
    <section className="mx-auto flex max-w-[820px] flex-col gap-3 px-5 py-20">
      <h2 className="mb-4 text-center font-display text-[clamp(26px,3.4vw,40px)] font-extrabold tracking-[-0.03em]">Preguntas frecuentes</h2>
      {preguntas.map(([p, r]) => (
        <details key={p} className="rounded-2xl border border-linea bg-white">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-[22px] py-5 text-[17px] font-semibold">
            {p}
            <span className="mas text-2xl text-hoja transition-transform" aria-hidden="true">+</span>
          </summary>
          <p className="px-[22px] pb-5 text-base leading-[1.6] text-g2">{r}</p>
        </details>
      ))}
    </section>
  );
}
