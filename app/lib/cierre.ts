// Cuentas del cierre del día.
import { DIAS_DEL_MES, MARGEN_INICIAL, MARGEN_MAX, MARGEN_MIN } from "./numeroDelDia";
import { sumarDias } from "./fechas";

export type CategoriaGasto = "proveedor" | "flete" | "vuelto" | "otros" | "comision";
export const CATEGORIAS: { id: Exclude<CategoriaGasto, "comision">; nombre: string }[] = [
  { id: "proveedor", nombre: "Proveedor" },
  { id: "flete", nombre: "Flete" },
  { id: "vuelto", nombre: "Vuelto" },
  { id: "otros", nombre: "Otros" },
];
export type Gasto = { categoria: CategoriaGasto; monto: number };
export type CierreGuardado = { fecha: string; ventas: number; tarjeta: number; gastos: Gasto[] };

export const comisionDe = (tarjeta: number, pct: number | null) => (pct && tarjeta > 0 ? Math.round((tarjeta * pct) / 100) : 0);

/** Lo que tenés que vender por día para no perder (fijos del día ÷ margen). */
export function numeroDelDiaDe(fijosMes: number, margenPct: number | null) {
  const m = Math.min(MARGEN_MAX, Math.max(MARGEN_MIN, margenPct ?? MARGEN_INICIAL));
  const fijosDia = Math.max(0, fijosMes) / DIAS_DEL_MES;
  return { fijosDia, vender: fijosDia / (m / 100), margen: m };
}

/**
 * "Hoy te quedaron $X libres" = ventas − gastos del día − comisiones de cobro − fijos ÷ 30.
 * `gastos` puede traer ya la comisión (cierre guardado) o no (cierre por guardar: se calcula con `comisionPct`).
 */
export function resultadoDelDia(p: { ventas: number; tarjeta: number; gastos: Gasto[]; comisionPct: number | null; fijosMes: number; margenPct: number | null }) {
  const yaTieneComision = p.gastos.some((g) => g.categoria === "comision");
  const comision = yaTieneComision ? p.gastos.filter((g) => g.categoria === "comision").reduce((s, g) => s + g.monto, 0) : comisionDe(p.tarjeta, p.comisionPct);
  const gastosSinComision = p.gastos.filter((g) => g.categoria !== "comision").reduce((s, g) => s + g.monto, 0);
  const { fijosDia, vender, margen } = numeroDelDiaDe(p.fijosMes, p.margenPct);
  const libres = p.ventas - gastosSinComision - comision - fijosDia;
  return { comision, gastos: gastosSinComision + comision, fijosDia, libres, vender, margen, pasaste: p.ventas >= vender, progreso: vender > 0 ? Math.min(1, p.ventas / vender) : 1 };
}

/** Los últimos 7 días terminando hoy, con lo que quedó libre cada uno (null si no hubo cierre). */
export function ultimos7(cierres: CierreGuardado[], hoy: string, fijosMes: number, margenPct: number | null) {
  return Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(hoy, i - 6);
    const c = cierres.find((x) => x.fecha === fecha);
    return { fecha, libres: c ? resultadoDelDia({ ...c, comisionPct: null, fijosMes, margenPct }).libres : null };
  });
}

export function promedio(valores: (number | null)[]) {
  const v = valores.filter((x): x is number => x !== null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
}
