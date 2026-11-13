import { describe, expect, it } from "vitest";
import datos from "./voz.json";
import { entenderCierre, montos, productosMencionados } from "@/lib/voz";

const aMapa = (g: { categoria: string; monto: number }[]) => Object.fromEntries(g.map((x) => [x.categoria, x.monto]));

describe("las 5 frases de prueba (tests/voz.json)", () => {
  for (const f of datos.frases) {
    it(f.texto, () => {
      const r = entenderCierre(f.texto, datos.productos);
      expect(r.ventas).toBe(f.esperado.ventas);
      expect(r.tarjeta).toBe(f.esperado.tarjeta);
      expect(aMapa(r.gastos)).toEqual(f.esperado.gastos);
      expect(r.productos).toEqual(f.esperado.productos);
    });
  }
});

describe("números en castellano", () => {
  const n = (s: string) => montos(s.split(" ")).map((m) => m.valor);
  it("palabras", () => {
    expect(n("ciento veinte mil")).toEqual([120000]);
    expect(n("treinta y seis mil trescientos treinta y tres")).toEqual([36333]);
    expect(n("doscientos mil")).toEqual([200000]);
    expect(n("mil quinientos")).toEqual([1500]);
    expect(n("dos millones")).toEqual([2000000]);
  });
  it("lucas y palos", () => {
    expect(n("ochenta lucas")).toEqual([80000]);
    expect(n("un palo")).toEqual([1000000]);
    expect(n("un palo doscientos")).toEqual([1200000]);
  });
  it("dígitos", () => {
    expect(n("186.000")).toEqual([186000]);
    expect(n("92 mil")).toEqual([92000]);
    expect(n("120k")).toEqual([120000]);
  });
  it("un artículo no es un monto", () => {
    expect(n("un alfajor")).toEqual([]);
  });
});

describe("casos sueltos", () => {
  it("sin palabra clave, el primer monto son las ventas y el resto otros gastos", () => {
    const r = entenderCierre("ciento cincuenta mil, veinte mil");
    expect(r.ventas).toBe(150000);
    expect(aMapa(r.gastos)).toEqual({ otros: 20000 });
  });
  it("lo cobrado con tarjeta nunca supera lo vendido", () => {
    expect(entenderCierre("vendí cien mil, doscientos mil con tarjeta").tarjeta).toBe(100000);
  });
  it("texto vacío", () => {
    expect(entenderCierre("")).toEqual({ ventas: 0, tarjeta: 0, gastos: [], productos: [] });
  });
  it("productos: sin falsos positivos con palabras cortas", () => {
    expect(productosMencionados("pagué a los proveedores", ["Pan lactal", "Yerba 1 kg"])).toEqual([]);
    expect(productosMencionados("se vendieron alfajores", ["Alfajor triple"])).toEqual(["Alfajor triple"]);
  });
});
