/**
 * El "número del día": lo que tiene que vender un negocio para no perder.
 *  - diario: gastos fijos del mes ÷ 30 (lo que hay que cubrir cada día antes de ganar un peso)
 *  - vender: diario ÷ margen (cuánto hay que vender por día para cubrir esos gastos con el margen que deja la mercadería)
 * Siempre se divide por 30 y no por los días reales del mes, para que el número no cambie de un mes al otro.
 */
export const DIAS_DEL_MES = 30;
export const MARGEN_MIN = 10;
export const MARGEN_MAX = 60;
export const MARGEN_INICIAL = 30;

export type GastosFijos = { alquiler: number; luz: number; sueldos: number };

export function numeroDelDia(gastos: GastosFijos, margenPct: number) {
  const positivo = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const fijos = positivo(gastos.alquiler) + positivo(gastos.luz) + positivo(gastos.sueldos);
  const margen = Math.min(MARGEN_MAX, Math.max(MARGEN_MIN, Number.isFinite(margenPct) ? margenPct : MARGEN_INICIAL));
  const diario = fijos / DIAS_DEL_MES;
  const vender = diario / (margen / 100);
  return { fijos, diario, vender, margen };
}
