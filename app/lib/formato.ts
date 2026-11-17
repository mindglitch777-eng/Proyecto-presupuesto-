// Puntos de mil hechos a mano (no con Intl): cada navegador trae su versión de las reglas de idioma y algunos escriben
// "1500" y otros "1.500". Si el servidor y el celular no escriben igual, la página da error al cargarse (pasó en Safari).
const nf = { format: (n: number) => String(Math.trunc(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".") };

/** $23.400 */
export const pesos = (n: number) => (Math.round(n) < 0 ? "-$" : "$") + nf.format(Math.abs(Math.round(n)));

/** "1.250.000" → 1250000. Ignora todo lo que no sea un dígito. */
export const soloDigitos = (v: string) => Number(String(v).replace(/\D/g, "")) || 0;

/** Escribe con puntos de mil mientras la persona tipea: "450000" → "450.000". */
export const conPuntos = (v: string) => {
  const n = soloDigitos(v);
  return n ? nf.format(n) : "";
};
