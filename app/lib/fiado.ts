// Fiado inteligente: saldo, deuda más vieja, semáforo, recordatorio por WhatsApp y "hoy cobra".
import { normalizarWhatsapp } from "./listaEspera";
import { pesos } from "./formato";
import { ddmm, diasEntre } from "./fechas";

export type Movimiento = { tipo: "fio" | "pago"; monto: number; fecha: string };
export type Semaforo = "verde" | "amarillo" | "rojo";

export const saldo = (movs: Movimiento[]) => movs.reduce((s, m) => s + (m.tipo === "fio" ? m.monto : -m.monto), 0);

/** Fecha del fiado más viejo que todavía no está pagado (los pagos cancelan primero lo más viejo). */
export function deudaMasVieja(movs: Movimiento[]): string | null {
  const ordenados = [...movs].sort((a, b) => a.fecha.localeCompare(b.fecha));
  let pagado = ordenados.filter((m) => m.tipo === "pago").reduce((s, m) => s + m.monto, 0);
  for (const m of ordenados.filter((x) => x.tipo === "fio")) {
    if (pagado >= m.monto) pagado -= m.monto;
    else return m.fecha;
  }
  return null;
}

/** Verde: lo más viejo tiene 15 días o menos. Amarillo: más de 15. Rojo: más de 30 o 2 recordatorios sin pago. */
export function semaforo(movs: Movimiento[], recordatoriosSinPago: number, hoy: string): { color: Semaforo; dias: number | null } {
  const vieja = deudaMasVieja(movs);
  if (!vieja || saldo(movs) <= 0) return { color: "verde", dias: null };
  const dias = diasEntre(vieja, hoy);
  if (dias > 30 || recordatoriosSinPago >= 2) return { color: "rojo", dias };
  return { color: dias > 15 ? "amarillo" : "verde", dias };
}

export const mensajeRecordatorio = (nombre: string, monto: number, fecha: string) =>
  `Hola ${nombre}, te recuerdo el saldo pendiente de ${pesos(monto)} del ${ddmm(fecha)}. Cuando puedas, avisame. Gracias.`;

/** Con teléfono abre el chat de esa persona; sin teléfono, WhatsApp elige a quién mandarlo. */
export function linkWhatsapp(telefono: string | null | undefined, texto: string) {
  const n = telefono ? normalizarWhatsapp(telefono) : null;
  return `https://wa.me/${n ?? ""}?text=${encodeURIComponent(texto)}`;
}

/** ¿Hoy cobra? (si cobra el 31 y el mes tiene 30 días, cobra el último día). */
export function cobraHoy(diaDeCobro: number | null, hoy: string) {
  if (!diaDeCobro) return false;
  const [a, m, d] = hoy.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return d === Math.min(diaDeCobro, ultimo);
}
