const fmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
/** $22.400 con formato argentino. */
export const ars = (n: number) => "$" + fmt.format(Math.round(n));
