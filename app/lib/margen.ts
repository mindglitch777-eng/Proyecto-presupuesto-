// Ranking de margen y precio sugerido.
import { diasEntre } from "./fechas";

export type ProductoMargen = { id: string; nombre: string; precio: number | null; costo: number | null; stock: number | null; precioActualizado: string | null; ultimaVenta: string | null; creado: string; accionDormido: string | null; dormidoHasta: string | null };

export const margenDe = (precio: number | null, costo: number | null) => (precio && precio > 0 && costo !== null ? ((precio - costo) / precio) * 100 : null);

/** Redondea hacia arriba al múltiplo (10 o 50 pesos, configurable). */
export const redondearArriba = (n: number, paso: number) => Math.ceil(n / Math.max(1, paso)) * Math.max(1, paso);

/**
 * "Para seguir ganando 30%, vendelo a $X": precio que deja ese margen después de pagar la comisión de cobro.
 * precio = costo ÷ (1 − margen − comisión). null si el margen pedido es imposible.
 */
export function precioSugerido(costo: number, margenObjetivoPct: number, comisionPct: number | null, redondeo: number) {
  const den = 1 - margenObjetivoPct / 100 - (comisionPct ?? 0) / 100;
  if (costo <= 0 || den <= 0.05) return null;
  return redondearArriba(costo / den, redondeo);
}

/** ¿Hace más de 30 días que no revisa el precio? */
export const precioViejo = (p: Pick<ProductoMargen, "precioActualizado" | "creado">, hoy: string) => diasEntre((p.precioActualizado ?? p.creado).slice(0, 10), hoy) > 30;

/** Tabla ordenada de mayor a menor margen; marca en rojo los que quedan por debajo de la alerta (15% por defecto). */
export function ranking(productos: ProductoMargen[], alertaPct: number) {
  return productos
    .map((p) => ({ ...p, margen: margenDe(p.precio, p.costo) }))
    .sort((a, b) => (b.margen ?? -Infinity) - (a.margen ?? -Infinity))
    .map((p) => ({ ...p, bajo: p.margen !== null && p.margen < alertaPct }));
}
