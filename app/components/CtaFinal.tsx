export function CtaFinal() {
  return (
    <section className="mx-auto max-w-[1160px] px-5 pb-20">
      <div className="flex flex-col items-center gap-5 rounded-[32px] bg-verde bg-[radial-gradient(rgba(255,255,255,0.07)_1.2px,transparent_1.2px)] px-6 py-14 text-center text-white [background-size:20px_20px] sm:px-8">
        <h2 className="max-w-[720px] font-display text-[clamp(28px,4vw,48px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-balance">Dejá de adivinar. Tu negocio te está hablando.</h2>
        <p className="max-w-[520px] text-lg leading-[1.6] text-salvia2">Calculá tu número del día en 30 segundos y anotate como socio fundador.</p>
        <a href="#calculadora" className="rounded-xl bg-ambar px-[26px] py-4 text-[17px] font-bold text-tinta hover:brightness-95">Calcular mi número</a>
      </div>
    </section>
  );
}
