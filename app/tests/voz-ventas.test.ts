import { describe, expect, it } from "vitest";
import { entenderCierre } from "@/lib/voz";

// Qué se vendió: por plata ("250 mil de carne") o por cantidad ("10 cocas"). Cada ítem: [rubro, monto, unidades].
type It = [string, number | null, number | null];
type Caso = { t: string; ventas: number; items: It[]; gastos?: Record<string, number>; tarjeta?: number; productos?: string[]; conProducto?: string[] };

const CATALOGO = ["Coca Cola 2,25 L", "Alfajor triple", "Yerba 1 kg", "Pan lactal", "Cerveza Quilmes 1 L", "Marlboro box 20"];

const leer = (t: string, productos: string[] = []) => {
  const r = entenderCierre(t, productos);
  const gastos = Object.fromEntries(r.gastos.map((g) => [g.categoria, g.monto]));
  return { ventas: r.ventas, tarjeta: r.tarjeta, gastos, items: r.items.map((i): It => [i.rubro, i.monto, i.unidades]), conProducto: r.items.map((i) => i.producto).filter(Boolean) };
};

const casos: Record<string, Caso[]> = {
  "por plata y rubro": [
    { t: "vendí 250.000 de carne, 20.000 en cerveza y 15.000 en cigarrillos", ventas: 285000, items: [["carniceria", 250000, null], ["alcohol", 20000, null], ["cigarrillos", 15000, null]] },
    { t: "vendí 250 mil de carne, 20 en cerveza y 15 en cigarrillos", ventas: 285000, items: [["carniceria", 250000, null], ["alcohol", 20000, null], ["cigarrillos", 15000, null]] },
    { t: "Hoy hice 80 mil de almacén, 45 mil de carnicería y 30 mil de verdulería", ventas: 155000, items: [["almacen", 80000, null], ["carniceria", 45000, null], ["verduleria", 30000, null]] },
    { t: "vendí 300 mil, 250 de carne y 20 de cerveza", ventas: 300000, items: [["carniceria", 250000, null], ["alcohol", 20000, null]] },
    { t: "de carne 120 mil, de fiambre 40 mil y de pan 15 mil", ventas: 175000, items: [["carniceria", 120000, null], ["fiambreria", 40000, null], ["panaderia", 15000, null]] },
    { t: "vendí 60 mil en gaseosas, 25 mil en golosinas y 18 mil en cargas de la SUBE", ventas: 103000, items: [["bebidas", 60000, null], ["golosinas", 25000, null], ["cargas", 18000, null]] },
    { t: "vendí 40 mil de helados y 12 mil de hielo", ventas: 52000, items: [["helados", 40000, null], ["hielo", 12000, null]] },
    { t: "vendí 35 mil de frutos secos, 20 de semillas y 15 de productos sin tacc", ventas: 70000, items: [["dietetica", 35000, null], ["dietetica", 20000, null], ["dietetica", 15000, null]] },
    { t: "vendí 50 mil de lácteos y 30 mil de fiambres", ventas: 80000, items: [["lacteos", 50000, null], ["fiambreria", 30000, null]] },
    { t: "vendí 22 mil de artículos de limpieza y 18 mil de perfumería", ventas: 40000, items: [["limpieza", 22000, null], ["perfumeria", 18000, null]] },
    { t: "250 mil de carne en efectivo y 20 mil de cerveza con tarjeta", ventas: 270000, tarjeta: 20000, items: [["carniceria", 250000, null], ["alcohol", 20000, null]] },
  ],
  "por cantidad": [
    { t: "vendí 10 cocas y 5 alfajores", ventas: 0, items: [["bebidas", null, 10], ["golosinas", null, 5]] },
    { t: "vendí dos cervezas y tres atados de cigarrillos", ventas: 0, items: [["alcohol", null, 2], ["cigarrillos", null, 3]] },
    { t: "vendí 3 kilos de carne y una docena de huevos", ventas: 0, items: [["carniceria", null, 3], ["huevos", null, 12]] },
    { t: "vendí 150 mil, entre eso 10 cocas y 4 yerbas", ventas: 150000, items: [["bebidas", null, 10], ["almacen", null, 4]] },
    { t: "hoy vendí 120 mil y salieron 20 alfajores", ventas: 120000, items: [["golosinas", null, 20]] },
    { t: "vendí una coca y un alfajor", ventas: 0, items: [["bebidas", null, 1], ["golosinas", null, 1]] },
    { t: "vendí media docena de huevos", ventas: 0, items: [["huevos", null, 6]] },
  ],
  "con los productos del negocio": [
    { t: "vendí 10 cocas, 5 alfajores y 2 quilmes", ventas: 0, items: [["bebidas", null, 10], ["golosinas", null, 5], ["alcohol", null, 2]], productos: CATALOGO, conProducto: ["Coca Cola 2,25 L", "Alfajor triple", "Cerveza Quilmes 1 L"] },
    { t: "vendí 30 mil de yerba", ventas: 30000, items: [["almacen", 30000, null]], productos: CATALOGO, conProducto: ["Yerba 1 kg"] },
  ],
  "pagar mercadería no es venta": [
    { t: "vendí 200 mil, le pagué 30 mil a la panadería", ventas: 200000, items: [], gastos: { proveedor: 30000 } },
    { t: "vendí 200 mil y compré 50 mil de carne", ventas: 200000, items: [], gastos: { proveedor: 50000 } },
    { t: "vendí 200 mil, pagué 40 mil de gaseosas", ventas: 200000, items: [], gastos: { proveedor: 40000 } },
    { t: "vendí 200 mil, le di 40 mil al de la cerveza", ventas: 200000, items: [], gastos: { proveedor: 40000 } },
    { t: "vendí 180 mil de carne y le pagué 100 mil al frigorífico", ventas: 180000, items: [["carniceria", 180000, null]], gastos: { proveedor: 100000 } },
    { t: "vendí 90 mil, pagué 8 mil de agua", ventas: 90000, items: [], gastos: { otros: 8000 } },
  ],
  "sin inventar artículos": [
    { t: "vendí 150 mil", ventas: 150000, items: [] },
    { t: "vino el proveedor y le pagué 50 mil, vendí 150 mil", ventas: 150000, items: [], gastos: { proveedor: 50000 } },
    { t: "vendí 150 mil a las 9 de la noche", ventas: 150000, items: [] },
    { t: "vendí 150 mil, 60 con QR", ventas: 150000, tarjeta: 60000, items: [] },
  ],
  "frases nuevas (no usadas para ajustar el lector)": [
    { t: "hoy vendí 90 mil de bebidas, 40 de almacén y 25 de golosinas", ventas: 155000, items: [["bebidas", 90000, null], ["almacen", 40000, null], ["golosinas", 25000, null]] },
    { t: "vendí 12 cervezas, 6 cocas y 2 fernet", ventas: 0, items: [["alcohol", null, 12], ["bebidas", null, 6], ["alcohol", null, 2]] },
    { t: "vendí 180 mil, de eso 100 de carne", ventas: 180000, items: [["carniceria", 100000, null]] },
    { t: "vendimos 70 mil en cigarrillos y 30 mil en cargas virtuales", ventas: 100000, items: [["cigarrillos", 70000, null], ["cargas", 30000, null]] },
    { t: "salieron 4 kilos de asado y 2 kilos de chorizo", ventas: 0, items: [["carniceria", null, 4], ["carniceria", null, 2]] },
    { t: "vendí 45 mil de pan y facturas", ventas: 45000, items: [["panaderia", 45000, null]] },
    { t: "vendí 200 mil, le pagué 60 mil al de los lácteos y 20 mil de pan", ventas: 200000, items: [], gastos: { proveedor: 80000 } },
    { t: "vendí 25 mil en helados y le compré 10 mil de hielo al proveedor", ventas: 25000, items: [["helados", 25000, null]], gastos: { proveedor: 10000 } },
    { t: "vendí 3 maples de huevos y 10 litros de leche", ventas: 0, items: [["huevos", null, 3], ["lacteos", null, 10]] },
    { t: "en verdulería hice 55 mil", ventas: 55000, items: [["verduleria", 55000, null]] },
  ],
};

for (const [grupo, lista] of Object.entries(casos)) {
  describe(`lo vendido: ${grupo}`, () => {
    for (const c of lista) {
      it(c.t, () => {
        const r = leer(c.t, c.productos);
        expect(r.ventas).toBe(c.ventas);
        expect(r.items).toEqual(c.items);
        expect(r.gastos).toEqual(c.gastos ?? {});
        expect(r.tarjeta).toBe(c.tarjeta ?? 0);
        if (c.conProducto) expect(r.conProducto).toEqual(c.conProducto);
      });
    }
  });
}
