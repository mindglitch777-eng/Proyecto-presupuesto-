import { describe, expect, it } from "vitest";
import { entenderCierre } from "@/lib/voz";

// Muchas formas reales de contar el cierre. Cada una tiene que dar los mismos números que entendería una persona.
const g = (t: string, productos: string[] = []) => {
  const r = entenderCierre(t, productos);
  return { ventas: r.ventas, tarjeta: r.tarjeta, gastos: Object.fromEntries(r.gastos.map((x) => [x.categoria, x.monto])), productos: r.productos };
};

describe("escenarios de voz: montos", () => {
  const casos: [string, number][] = [
    ["hoy hice ciento cuarenta y cinco mil quinientos", 145500],
    ["vendí $150.000", 150000],
    ["vendí 150.000,50", 150001],
    ["vendí 1.250.000", 1250000],
    ["vendí un millón doscientos mil", 1200000],
    ["vendí dos millones", 2000000],
    ["vendí noventa y ocho lucas", 98000],
    ["vendí 98 mil y pico", 98000],
    ["entraron trescientos mil pesos", 300000],
    ["recaudé 87.500", 87500],
    ["la caja dio 64 mil", 64000],
    ["Vendí 120k", 120000],
    ["VENDÍ CIENTO VEINTE MIL", 120000],
    ["vendi ciento veinte mil (sin tilde)", 120000],
  ];
  for (const [t, v] of casos) it(t, () => expect(g(t).ventas).toBe(v));
});

describe("escenarios de voz: gastos y cobros", () => {
  it("varios medios de pago se suman", () => {
    expect(g("vendí 120 mil, 30 mil con débito y 20 mil con QR")).toMatchObject({ ventas: 120000, tarjeta: 50000 });
  });
  it("mercado pago y transferencia cuentan como cobro con tarjeta o QR", () => {
    expect(g("vendí 200 mil, 50 por mercado pago, 10 mil por transferencia").tarjeta).toBe(60000);
  });
  it("nafta y envíos son flete", () => {
    expect(g("vendí 200 mil. gasté 15 mil en nafta").gastos).toEqual({ flete: 15000 });
  });
  it("le di plata al de la gaseosa: proveedor", () => {
    expect(g("vendí 150 mil y le di 40 mil al de la gaseosa").gastos).toEqual({ proveedor: 40000 });
  });
  it("pagar la luz cae en otros", () => {
    expect(g("vendí 90 mil, pagué la luz 12 mil").gastos).toEqual({ otros: 12000 });
  });
  it("el mismo tipo de gasto dos veces se suma", () => {
    expect(g("vendí 300 mil, pagué 50 mil al proveedor de bebidas y 30 mil al proveedor de golosinas").gastos).toEqual({ proveedor: 80000 });
  });
  it("el orden no importa: primero el gasto y después la venta", () => {
    expect(g("le pagué 20 mil al proveedor y vendí 110 mil")).toMatchObject({ ventas: 110000, gastos: { proveedor: 20000 } });
  });
  it("frases sin montos no inventan nada", () => {
    expect(g("hoy fue un día tranquilo")).toEqual({ ventas: 0, tarjeta: 0, gastos: {}, productos: [] });
  });
  it("productos con nombres compuestos y plurales", () => {
    expect(g("vendí 50 mil, se movieron las galletitas y los caramelos", ["Galletitas Oreo", "Caramelos Media Hora", "Yerba 1 kg"]).productos).toEqual(["Galletitas Oreo", "Caramelos Media Hora"]);
  });
});
