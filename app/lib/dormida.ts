// Plata dormida: productos sin ventas hace más de N días.
import type { ProductoMargen } from "./margen";
import { redondearArriba } from "./margen";
import { diasEntre } from "./fechas";

export function dormidos(productos: ProductoMargen[], diasLimite: number, hoy: string) {
  const lista = productos
    .filter((p) => !(p.dormidoHasta && p.dormidoHasta > hoy))
    .map((p) => ({ ...p, dias: diasEntre((p.ultimaVenta ?? p.creado).slice(0, 10), hoy) }))
    .filter((p) => p.dias > diasLimite)
    .sort((a, b) => (b.costo ?? 0) * (b.stock ?? 0) - (a.costo ?? 0) * (a.stock ?? 0));
  const inmovilizado = lista.reduce((s, p) => s + (p.costo ?? 0) * Math.max(0, p.stock ?? 0), 0);
  const siLoVendieras = lista.reduce((s, p) => s + (p.precio ?? 0) * Math.max(0, p.stock ?? 0), 0);
  return { lista, inmovilizado, siLoVendieras };
}

/** "Liquidar": sugiere vender a costo + 5%. */
export const precioLiquidar = (costo: number, redondeo: number) => redondearArriba(costo * 1.05, redondeo);
