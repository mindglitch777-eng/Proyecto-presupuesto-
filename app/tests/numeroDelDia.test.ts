import { describe, expect, it } from "vitest";
import { numeroDelDia } from "@/lib/numeroDelDia";
import { conPuntos, pesos, soloDigitos } from "@/lib/formato";

describe("número del día", () => {
  it("con los valores del prototipo: $36.333 por día y $121.111 para vender", () => {
    const r = numeroDelDia({ alquiler: 450_000, luz: 140_000, sueldos: 500_000 }, 30);
    expect(r.fijos).toBe(1_090_000);
    expect(pesos(r.diario)).toBe("$36.333");
    expect(pesos(r.vender)).toBe("$121.111");
  });

  it("a menos margen, hay que vender más", () => {
    const g = { alquiler: 300_000, luz: 60_000, sueldos: 0 };
    expect(numeroDelDia(g, 20).vender).toBeGreaterThan(numeroDelDia(g, 40).vender);
    expect(Math.round(numeroDelDia(g, 20).vender)).toBe(60_000); // 360.000 ÷ 30 = 12.000 ÷ 0,20
  });

  it("sin gastos fijos da cero", () => {
    const r = numeroDelDia({ alquiler: 0, luz: 0, sueldos: 0 }, 30);
    expect(r.diario).toBe(0);
    expect(r.vender).toBe(0);
  });

  it("ignora montos negativos o inválidos y acota el margen entre 10 y 60", () => {
    const r = numeroDelDia({ alquiler: -5, luz: Number.NaN, sueldos: 30_000 }, 500);
    expect(r.fijos).toBe(30_000);
    expect(r.margen).toBe(60);
    expect(numeroDelDia({ alquiler: 30_000, luz: 0, sueldos: 0 }, 0).margen).toBe(10);
  });
});

describe("formato", () => {
  it("pesos usa puntos de mil", () => {
    expect(pesos(23400)).toBe("$23.400");
    expect(pesos(0)).toBe("$0");
    expect(pesos(1234567.6)).toBe("$1.234.568");
  });
  it("soloDigitos y conPuntos", () => {
    expect(soloDigitos("1.250.000 pesos")).toBe(1_250_000);
    expect(soloDigitos("abc")).toBe(0);
    expect(conPuntos("450000")).toBe("450.000");
    expect(conPuntos("")).toBe("");
  });
});
