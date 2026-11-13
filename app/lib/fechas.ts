// Fechas en hora de Argentina (UTC−3, sin horario de verano), como "AAAA-MM-DD".
export function hoyArgentina(ahora = new Date()) {
  return new Date(ahora.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
}
export function sumarDias(fecha: string, dias: number) {
  const d = new Date(fecha + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
export function diasEntre(desde: string, hasta: string) {
  return Math.round((Date.parse(hasta + "T12:00:00Z") - Date.parse(desde + "T12:00:00Z")) / 86_400_000);
}
/** "hoy", "ayer", "hace 41 días" */
export function haceCuanto(fecha: string | null | undefined, hoy: string) {
  if (!fecha) return "nunca";
  const d = diasEntre(fecha.slice(0, 10), hoy);
  return d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`;
}
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export const diaCorto = (fecha: string) => DIAS[new Date(fecha + "T12:00:00Z").getUTCDay()];
export const ddmm = (fecha: string) => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
