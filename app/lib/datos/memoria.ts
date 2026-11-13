import { hoyArgentina, sumarDias } from "../fechas";
import type { CierreGuardado } from "../cierre";
import { comisionDe } from "../cierre";
import type { ProductoMargen } from "../margen";
import type { Cliente, Datos, Negocio } from "./tipos";

// Datos de ejemplo en memoria, SOLO para las pruebas automáticas (ENCLARO_MODO_PRUEBA=1 + cookie). Nunca en la web publicada.

type Estado = { negocio: Negocio; fijos: number; cierres: CierreGuardado[]; movidos: { id: string; fecha: string }[]; productos: ProductoMargen[]; clientes: Cliente[]; cambios: number; sec: number };

function semilla(): Estado {
  const hoy = hoyArgentina();
  const d = (n: number) => sumarDias(hoy, -n);
  const p = (id: string, nombre: string, precio: number, costo: number, stock: number, actualizado: string, ultimaVenta: string | null): ProductoMargen => ({ id, nombre, precio, costo, stock, precioActualizado: actualizado, ultimaVenta, creado: d(120), accionDormido: null, dormidoHasta: null });
  const dia = Number(hoy.slice(8, 10));
  return {
    negocio: { id: "n1", primerUsoTerminado: true, nombre: "Kiosco Don Pedro", rubro: "kiosco", ciudad: "Santo Tomé", comisionPct: 6, alertaPct: 15, diasDormida: 30, redondeo: 10 },
    fijos: 1_090_000,
    cierres: [
      { fecha: d(6), ventas: 168000, tarjeta: 60000, gastos: [{ categoria: "proveedor", monto: 95000 }, { categoria: "comision", monto: 3600 }] },
      { fecha: d(5), ventas: 152000, tarjeta: 40000, gastos: [{ categoria: "flete", monto: 6000 }, { categoria: "comision", monto: 2400 }] },
      { fecha: d(4), ventas: 171000, tarjeta: 70000, gastos: [{ categoria: "otros", monto: 9000 }, { categoria: "comision", monto: 4200 }] },
      { fecha: d(3), ventas: 149000, tarjeta: 30000, gastos: [{ categoria: "comision", monto: 1800 }] },
      { fecha: d(2), ventas: 190000, tarjeta: 90000, gastos: [{ categoria: "proveedor", monto: 60000 }, { categoria: "comision", monto: 5400 }] },
      { fecha: d(1), ventas: 182000, tarjeta: 50000, gastos: [{ categoria: "vuelto", monto: 4000 }, { categoria: "comision", monto: 3000 }] },
    ],
    movidos: [{ id: "p1", fecha: d(1) }, { id: "p2", fecha: d(1) }, { id: "p3", fecha: d(2) }, { id: "p1", fecha: d(3) }],
    productos: [
      p("p1", "Gaseosa 500", 2160, 1500, 48, d(5), d(1)),
      p("p2", "Alfajor triple", 1200, 800, 60, d(10), d(1)),
      p("p3", "Cigarrillos", 4500, 3900, 40, d(45), d(2)),
      p("p4", "Caramelos sueltos", 100, 60, 400, d(60), d(1)),
      p("p5", "Turrones surtidos", 1400, 980, 70, d(80), d(94)),
      p("p6", "Yerba 500 g", 3200, 2800, 4, d(40), d(71)),
      p("p7", "Galletitas rellenas", 1500, 1120, 15, d(20), d(63)),
      p("p8", "Agua 500", 1000, 600, 30, d(3), d(4)),
    ],
    clientes: [
      { id: "c1", nombre: "Doña Marta", telefono: "3756 15 123456", diaCobro: dia, nota: null, ultimoRecordatorio: null, recordatoriosSinPago: 0, movimientos: [{ id: "m1", tipo: "fio", monto: 18000, fecha: d(41), nota: null }] },
      { id: "c2", nombre: "Juan", telefono: null, diaCobro: null, nota: "El de la moto roja", ultimoRecordatorio: d(3), recordatoriosSinPago: 1, movimientos: [{ id: "m2", tipo: "fio", monto: 7500, fecha: d(22), nota: null }, { id: "m3", tipo: "pago", monto: 2000, fecha: d(10), nota: null }] },
      { id: "c3", nombre: "Rosa", telefono: "3756 15 654321", diaCobro: 5, nota: null, ultimoRecordatorio: null, recordatoriosSinPago: 0, movimientos: [{ id: "m4", tipo: "fio", monto: 4200, fecha: d(4), nota: null }] },
      { id: "c4", nombre: "Carlos", telefono: null, diaCobro: null, nota: null, ultimoRecordatorio: d(20), recordatoriosSinPago: 2, movimientos: [{ id: "m5", tipo: "fio", monto: 12000, fecha: d(25), nota: null }] },
    ],
    cambios: 0,
    sec: 100,
  };
}

const g = globalThis as unknown as { __enclaroMemoria?: Estado };
const estado = () => (g.__enclaroMemoria ??= semilla());
export const reiniciarMemoria = () => { g.__enclaroMemoria = semilla(); };
const nuevoId = (pre: string) => `${pre}${++estado().sec}`;

export function datosMemoria(): Datos {
  return {
    async negocio() { return estado().negocio; },
    async fijosMes() { return estado().fijos; },
    async cierres(desde) { return estado().cierres.filter((c) => c.fecha >= desde).sort((a, b) => a.fecha.localeCompare(b.fecha)); },
    async movidosEn(fecha) { return estado().movidos.filter((m) => m.fecha === fecha).map((m) => m.id); },
    async guardarCierre(c) {
      const e = estado();
      if (c.tarjeta > c.ventas) throw new Error("tarjeta > ventas");
      const gastos = c.gastos.filter((x) => x.categoria !== "comision" && x.monto > 0);
      const com = comisionDe(c.tarjeta, e.negocio.comisionPct);
      if (com) gastos.push({ categoria: "comision", monto: com });
      e.cierres = [...e.cierres.filter((x) => x.fecha !== c.fecha), { fecha: c.fecha, ventas: c.ventas, tarjeta: c.tarjeta, gastos }];
      for (const id of c.productos) {
        if (!e.movidos.some((m) => m.id === id && m.fecha === c.fecha)) e.movidos.push({ id, fecha: c.fecha });
        const p = e.productos.find((x) => x.id === id);
        if (p && (!p.ultimaVenta || p.ultimaVenta < c.fecha)) p.ultimaVenta = c.fecha;
      }
    },
    async productos() { return [...estado().productos].sort((a, b) => a.nombre.localeCompare(b.nombre)); },
    async usoDeProductos(desde) {
      return estado().movidos.filter((m) => m.fecha >= desde).reduce<Record<string, number>>((m, r) => ((m[r.id] = (m[r.id] ?? 0) + 1), m), {});
    },
    async guardarProducto(p) {
      const e = estado();
      const ahora = new Date().toISOString();
      if (!p.id) {
        const id = nuevoId("p");
        e.productos.push({ id, nombre: p.nombre, precio: p.precio, costo: p.costo, stock: p.stock, precioActualizado: ahora, ultimaVenta: null, creado: ahora, accionDormido: null, dormidoHasta: null });
        return id;
      }
      const x = e.productos.find((y) => y.id === p.id);
      if (x) {
        if (x.precio !== p.precio || x.costo !== p.costo) { x.precioActualizado = ahora; e.cambios++; }
        Object.assign(x, { nombre: p.nombre, precio: p.precio, costo: p.costo, stock: p.stock });
      }
      return p.id;
    },
    async vendiHoy(id, fecha) {
      const e = estado();
      if (!e.movidos.some((m) => m.id === id && m.fecha === fecha)) e.movidos.push({ id, fecha });
      const p = e.productos.find((x) => x.id === id);
      if (p) p.ultimaVenta = fecha;
    },
    async accionDormido(id, accion, stock, precio, hasta) {
      const p = estado().productos.find((x) => x.id === id);
      if (!p) return;
      p.accionDormido = accion;
      p.dormidoHasta = hasta;
      if (stock !== null) p.stock = stock;
      if (precio !== null) { p.precio = precio; p.precioActualizado = new Date().toISOString(); }
    },
    async clientes() { return [...estado().clientes].sort((a, b) => a.nombre.localeCompare(b.nombre)); },
    async guardarCliente(c) {
      const e = estado();
      if (c.id) {
        const x = e.clientes.find((y) => y.id === c.id);
        if (x) Object.assign(x, { nombre: c.nombre, telefono: c.telefono, diaCobro: c.diaCobro, nota: c.nota });
        return c.id;
      }
      const id = nuevoId("c");
      e.clientes.push({ id, nombre: c.nombre, telefono: c.telefono, diaCobro: c.diaCobro, nota: c.nota, ultimoRecordatorio: null, recordatoriosSinPago: 0, movimientos: [] });
      return id;
    },
    async movimiento(clienteId, tipo, monto, fecha, nota) {
      const c = estado().clientes.find((x) => x.id === clienteId);
      if (!c) throw new Error("sin cliente");
      c.movimientos.push({ id: nuevoId("m"), tipo, monto, fecha, nota });
      if (tipo === "pago") c.recordatoriosSinPago = 0;
    },
    async recordado(clienteId) {
      const c = estado().clientes.find((x) => x.id === clienteId);
      if (c) { c.ultimoRecordatorio = new Date().toISOString(); c.recordatoriosSinPago++; }
    },
  };
}
