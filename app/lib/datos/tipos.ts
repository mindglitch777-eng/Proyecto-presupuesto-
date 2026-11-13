import type { CierreGuardado, Gasto } from "../cierre";
import type { ProductoMargen } from "../margen";
import type { Movimiento } from "../fiado";
import type { Rubro } from "../listaEspera";

export type Negocio = { id: string; primerUsoTerminado: boolean; nombre: string; rubro: Rubro | null; ciudad: string | null; comisionPct: number | null; alertaPct: number; diasDormida: number; redondeo: number };
export type Cliente = { id: string; nombre: string; telefono: string | null; diaCobro: number | null; nota: string | null; ultimoRecordatorio: string | null; recordatoriosSinPago: number; movimientos: (Movimiento & { id: string; nota: string | null })[] };
export type NuevoCierre = { fecha: string; ventas: number; tarjeta: number; gastos: Gasto[]; productos: string[]; fuente: "voz" | "manual" };
export type ProductoEditado = { id?: string; nombre: string; precio: number | null; costo: number | null; stock: number | null };
export type AccionDormido = "no_reponer" | "liquidar" | "mantener";

/** Todo lo que las pantallas leen y guardan. Hay una versión con Supabase (la real) y una en memoria (para las pruebas). */
export interface Datos {
  negocio(): Promise<Negocio>;
  fijosMes(): Promise<number>;
  cierres(desde: string): Promise<CierreGuardado[]>;
  movidosEn(fecha: string): Promise<string[]>;
  guardarCierre(c: NuevoCierre): Promise<void>;
  productos(): Promise<ProductoMargen[]>;
  usoDeProductos(desde: string): Promise<Record<string, number>>;
  guardarProducto(p: ProductoEditado, origen: "manual" | "factura"): Promise<string>;
  vendiHoy(id: string, fecha: string): Promise<void>;
  accionDormido(id: string, accion: AccionDormido, stock: number | null, precio: number | null, hasta: string | null): Promise<void>;
  clientes(): Promise<Cliente[]>;
  guardarCliente(c: { id?: string; nombre: string; telefono: string | null; diaCobro: number | null; nota: string | null }): Promise<string>;
  movimiento(clienteId: string, tipo: "fio" | "pago", monto: number, fecha: string, nota: string | null): Promise<void>;
  recordado(clienteId: string): Promise<void>;
}
