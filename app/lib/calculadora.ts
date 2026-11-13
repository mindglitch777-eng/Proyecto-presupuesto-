// Liviano a propósito: lo usa la landing (sin zod ni nada pesado).
/** Lo que dejó la calculadora de la landing (para precargar los gastos fijos). */
export const CLAVE_CALCULADORA = "enclaro_calculadora";
export type DeLaCalculadora = { alquiler: number; luz: number; sueldos: number };
export function leerCalculadora(texto: string | null): DeLaCalculadora | null {
  try {
    const v = JSON.parse(texto ?? "null");
    if (!v || typeof v !== "object") return null;
    const n = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 && x < 1e9 ? Math.round(x) : 0);
    return { alquiler: n(v.alquiler), luz: n(v.luz), sueldos: n(v.sueldos) };
  } catch {
    return null;
  }
}
