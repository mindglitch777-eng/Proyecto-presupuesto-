import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CierreGuardado, CategoriaGasto } from "../cierre";
import type { ProductoMargen } from "../margen";
import type { Cliente, Datos, Negocio } from "./tipos";

// Datos reales: cada consulta va con la sesión de la persona, así que la RLS de la base decide qué ve y qué toca.
function hecho(r: { error: { message: string } | null }) {
  if (r.error) throw new Error(r.error.message);
}
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
function ok<T>(r: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (r.error) throw new Error(r.error.message);
  if (r.data === null || r.data === undefined) throw new Error("sin datos");
  return r.data as NonNullable<T>;
}

export function datosSupabase(sb: SupabaseClient): Datos {
  let cacheNegocio: Negocio | null = null;
  const negocio = async (): Promise<Negocio> => {
    if (cacheNegocio) return cacheNegocio;
    const b = ok(await sb.from("businesses").select("id, name, rubro, ciudad, card_fee_pct, margin_alert_pct, dormant_days, price_rounding, onboarding_completed_at").single());
    cacheNegocio = { id: b.id, primerUsoTerminado: Boolean(b.onboarding_completed_at), nombre: b.name, rubro: b.rubro, ciudad: b.ciudad, comisionPct: num(b.card_fee_pct), alertaPct: Number(b.margin_alert_pct), diasDormida: b.dormant_days, redondeo: b.price_rounding };
    return cacheNegocio;
  };
  const filaProducto = (p: Record<string, unknown>): ProductoMargen => ({
    id: String(p.id), nombre: String(p.name), precio: num(p.price), costo: num(p.cost), stock: num(p.stock),
    precioActualizado: (p.price_updated_at as string) ?? null, ultimaVenta: (p.last_sold_at as string) ?? null, creado: String(p.created_at),
    accionDormido: (p.dormant_action as string) ?? null, dormidoHasta: (p.dormant_snoozed_until as string) ?? null,
  });
  return {
    negocio,
    async fijosMes() {
      const filas = ok(await sb.from("fixed_costs").select("monthly_amount"));
      return filas.reduce((s, f) => s + Number(f.monthly_amount), 0);
    },
    async cierres(desde) {
      const filas = ok(await sb.from("daily_closes").select("date, sales_total, card_sales, close_expenses(category, amount)").gte("date", desde).order("date"));
      return filas.map((c): CierreGuardado => ({
        fecha: c.date, ventas: Number(c.sales_total), tarjeta: Number(c.card_sales),
        gastos: (c.close_expenses as { category: CategoriaGasto; amount: number }[]).map((g) => ({ categoria: g.category, monto: Number(g.amount) })),
      }));
    },
    async movidosEn(fecha) {
      return ok(await sb.from("product_sale_days").select("product_id").eq("date", fecha)).map((r) => r.product_id);
    },
    async guardarCierre(c) {
      ok(await sb.rpc("guardar_cierre", { p_fecha: c.fecha, p_ventas: c.ventas, p_tarjeta: c.tarjeta, p_gastos: c.gastos.filter((g) => g.categoria !== "comision"), p_productos: c.productos, p_fuente: c.fuente }));
    },
    async productos() {
      const filas = ok(await sb.from("products").select("id, name, price, cost, stock, price_updated_at, last_sold_at, created_at, dormant_action, dormant_snoozed_until").is("archived_at", null).order("name"));
      return filas.map(filaProducto);
    },
    async usoDeProductos(desde) {
      const filas = ok(await sb.from("product_sale_days").select("product_id").gte("date", desde));
      return filas.reduce<Record<string, number>>((m, r) => ((m[r.product_id] = (m[r.product_id] ?? 0) + 1), m), {});
    },
    async guardarProducto(p, origen) {
      const { id: negocioId } = await negocio();
      const ahora = new Date().toISOString();
      if (!p.id) {
        const r = ok(await sb.from("products").insert({ business_id: negocioId, name: p.nombre, price: p.precio, cost: p.costo, stock: p.stock, price_updated_at: ahora }).select("id").single());
        return r.id as string;
      }
      const antes = ok(await sb.from("products").select("price, cost").eq("id", p.id).single());
      const cambioPrecio = num(antes.price) !== p.precio || num(antes.cost) !== p.costo;
      hecho(await sb.from("products").update({ name: p.nombre, price: p.precio, cost: p.costo, stock: p.stock, ...(cambioPrecio ? { price_updated_at: ahora } : {}) }).eq("id", p.id));
      if (cambioPrecio) {
        hecho(await sb.from("price_changes").insert({ business_id: negocioId, product_id: p.id, old_cost: antes.cost, new_cost: p.costo, old_price: antes.price, new_price: p.precio, source: origen }));
      }
      return p.id;
    },
    async vendiHoy(id, fecha) {
      const { id: negocioId } = await negocio();
      const r = await sb.from("product_sale_days").insert({ product_id: id, business_id: negocioId, date: fecha });
      if (r.error && r.error.code !== "23505") throw new Error(r.error.message); // ya estaba anotado ese día
    },
    async accionDormido(id, accion, stock, precio, hasta) {
      hecho(await sb.from("products").update({ dormant_action: accion, dormant_snoozed_until: hasta, ...(stock !== null ? { stock } : {}), ...(precio !== null ? { price: precio, price_updated_at: new Date().toISOString() } : {}) }).eq("id", id));
    },
    async clientes() {
      const filas = ok(await sb.from("customers").select("id, name, phone, pay_day, note, last_reminded_at, reminders_unpaid, credit_movements(id, type, amount, date, note)").order("name"));
      return filas.map((c): Cliente => ({
        id: c.id, nombre: c.name, telefono: c.phone, diaCobro: c.pay_day, nota: c.note, ultimoRecordatorio: c.last_reminded_at, recordatoriosSinPago: c.reminders_unpaid,
        movimientos: (c.credit_movements as { id: string; type: "fio" | "pago"; amount: number; date: string; note: string | null }[]).map((m) => ({ id: m.id, tipo: m.type, monto: Number(m.amount), fecha: m.date, nota: m.note })),
      }));
    },
    async guardarCliente(c) {
      const { id: negocioId } = await negocio();
      const fila = { name: c.nombre, phone: c.telefono, pay_day: c.diaCobro, note: c.nota };
      if (c.id) {
        hecho(await sb.from("customers").update(fila).eq("id", c.id));
        return c.id;
      }
      return (ok(await sb.from("customers").insert({ ...fila, business_id: negocioId }).select("id").single()).id as string);
    },
    async movimiento(clienteId, tipo, monto, fecha, nota) {
      const { id: negocioId } = await negocio();
      hecho(await sb.from("credit_movements").insert({ business_id: negocioId, customer_id: clienteId, type: tipo, amount: monto, date: fecha, note: nota }));
      if (tipo === "pago") hecho(await sb.from("customers").update({ reminders_unpaid: 0 }).eq("id", clienteId));
    },
    async recordado(clienteId) {
      const c = ok(await sb.from("customers").select("reminders_unpaid").eq("id", clienteId).single());
      hecho(await sb.from("customers").update({ last_reminded_at: new Date().toISOString(), reminders_unpaid: (c.reminders_unpaid ?? 0) + 1 }).eq("id", clienteId));
    },
  };
}
