import { describe, expect, it } from "vitest";
import { CHIPS, fijosSchema, ganancia, leerCalculadora, margenPct, margenPromedio, negocioSchema, productoSchema, recordatorioIcs, wow } from "@/lib/onboarding";

const fijos = { alquiler: 450000, luz: 140000, sueldos: 400000, otros: 100000, comision: null };

describe("wow (la pantalla del primer uso)", () => {
  it("sin productos usa 30%: cubrir $36.333 y vender $121.111 por día", () => {
    const w = wow(fijos, []);
    expect(Math.round(w.diario)).toBe(36333);
    expect(Math.round(w.vender)).toBe(121111);
    expect(w.mejor).toBeNull();
  });
  it("con productos usa su margen promedio y arma el ranking por lo que deja cada uno", () => {
    const productos = [
      { nombre: "Caramelos sueltos", precio: 100, costo: 60 },
      { nombre: "Gaseosa 500", precio: 2160, costo: 1500 },
      { nombre: "Alfajor", precio: 1200, costo: 800 },
    ];
    const w = wow(fijos, productos);
    expect(w.mejor?.nombre).toBe("Gaseosa 500");
    expect(w.peor?.nombre).toBe("Caramelos sueltos");
    expect(w.ranking.map((p) => p.nombre)).toEqual(["Gaseosa 500", "Alfajor", "Caramelos sueltos"]);
    // margen promedio = (40% + 30,6% + 33,3%) / 3 ≈ 34,6%
    expect(w.margen).toBeCloseTo(34.64, 1);
    const promedio = (40 + (660 / 2160) * 100 + (400 / 1200) * 100) / 3;
    expect(Math.round(w.vender)).toBe(Math.round(1090000 / 30 / (promedio / 100)));
  });
  it("un solo producto no tiene 'peor'", () => {
    expect(wow(fijos, [{ nombre: "Pan", precio: 1000, costo: 700 }]).peor).toBeNull();
  });
});

describe("cuentas por producto", () => {
  it("margen y ganancia por unidad", () => {
    expect(margenPct({ precio: 2000, costo: 1500 })).toBe(25);
    expect(ganancia({ precio: 2000, costo: 1500 })).toBe(500);
    expect(margenPct({ precio: 0, costo: 10 })).toBe(0);
  });
  it("el margen promedio queda entre 10% y 60% al calcular el número del día", () => {
    expect(wow(fijos, [{ nombre: "Regalo", precio: 100, costo: 0 }]).margen).toBe(60);
    expect(wow(fijos, [{ nombre: "Al costo", precio: 100, costo: 99 }]).margen).toBe(10);
    expect(margenPromedio([])).toBe(30);
  });
});

describe("validaciones en voseo", () => {
  it("negocio", () => {
    expect(negocioSchema.safeParse({ nombre: "Kiosco Ana", rubro: "kiosco", ciudad: "" }).success).toBe(true);
    const r = negocioSchema.safeParse({ nombre: "K", rubro: "ferreteria" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("Escribí el nombre de tu negocio.");
    expect(negocioSchema.safeParse({ nombre: "Kiosco Ana", rubro: "ferreteria" }).error?.issues[0].message).toBe("Elegí qué tipo de negocio tenés.");
  });
  it("gastos fijos: en cero se puede; negativos o comisión de 50% no", () => {
    expect(fijosSchema.safeParse({ alquiler: 0, luz: 0, sueldos: 0, otros: 0, comision: null }).success).toBe(true);
    expect(fijosSchema.safeParse({ ...fijos, luz: -1 }).success).toBe(false);
    expect(fijosSchema.safeParse({ ...fijos, comision: 50 }).error?.issues[0].message).toBe("La comisión va de 0 a 20%.");
  });
  it("producto: precio obligatorio y costo razonable", () => {
    expect(productoSchema.safeParse({ nombre: "Pan", precio: 1000, costo: 700 }).success).toBe(true);
    expect(productoSchema.safeParse({ nombre: "Pan", precio: 0, costo: 700 }).success).toBe(false);
    expect(productoSchema.safeParse({ nombre: "Pan", precio: 100, costo: 5000 }).success).toBe(false);
  });
});

describe("chips por rubro", () => {
  it("hay nombres para los tres rubros y nunca precios", () => {
    for (const lista of Object.values(CHIPS)) {
      expect(lista.length).toBeGreaterThanOrEqual(5);
      for (const n of lista) expect(n).not.toMatch(/\$/);
    }
  });
});

describe("recordatorio .ics", () => {
  it("todos los días a las 21 h de Argentina, con el link", () => {
    const ics = recordatorioIcs("https://enclaro.netlify.app/app", new Date("2026-11-14T01:30:00Z")); // 13/11 22:30 en Argentina
    expect(ics).toContain("DTSTART;TZID=America/Argentina/Buenos_Aires:20261113T210000");
    expect(ics).toContain("RRULE:FREQ=DAILY");
    expect(ics).toContain("https://enclaro.netlify.app/app");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
});

describe("leerCalculadora", () => {
  it("lee lo que guardó la calculadora y descarta basura", () => {
    expect(leerCalculadora('{"alquiler":300000,"luz":140000,"sueldos":500000}')).toEqual({ alquiler: 300000, luz: 140000, sueldos: 500000 });
    expect(leerCalculadora('{"alquiler":-5,"luz":"x"}')).toEqual({ alquiler: 0, luz: 0, sueldos: 0 });
    expect(leerCalculadora("no es json")).toBeNull();
    expect(leerCalculadora(null)).toBeNull();
  });
});
