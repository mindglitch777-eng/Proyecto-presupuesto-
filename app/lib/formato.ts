const nf = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/** $23.400 */
export const pesos = (n: number) => "$" + nf.format(Math.round(n));

/** "1.250.000" → 1250000. Ignora todo lo que no sea un dígito. */
export const soloDigitos = (v: string) => Number(String(v).replace(/\D/g, "")) || 0;

/** Escribe con puntos de mil mientras la persona tipea: "450000" → "450.000". */
export const conPuntos = (v: string) => {
  const n = soloDigitos(v);
  return n ? nf.format(n) : "";
};
