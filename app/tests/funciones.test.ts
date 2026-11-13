import { describe, expect, it } from "vitest";
import { comisionDe, numeroDelDiaDe, promedio, resultadoDelDia, ultimos7 } from "@/lib/cierre";
import { margenDe, precioSugerido, precioViejo, ranking, type ProductoMargen } from "@/lib/margen";
import { cobraHoy, deudaMasVieja, linkWhatsapp, mensajeRecordatorio, saldo, semaforo } from "@/lib/fiado";
import { dormidos, precioLiquidar } from "@/lib/dormida";
import { diasEntre, haceCuanto, hoyArgentina, sumarDias } from "@/lib/fechas";

const prod = (o: Partial<ProductoMargen>): ProductoMargen => ({ id: "x", nombre: "X", precio: 1000, costo: 700, stock: 10, precioActualizado: "2026-11-01", ultimaVenta: null, creado: "2026-09-01", accionDormido: null, dormidoHasta: null, ...o });

describe("cierre del día", () => {
  it("hoy te quedaron libres = ventas − gastos − comisión − fijos ÷ 30", () => {
    const r = resultadoDelDia({ ventas: 186000, tarjeta: 80000, gastos: [{ categoria: "proveedor", monto: 92000 }, { categoria: "flete", monto: 8000 }], comisionPct: 6, fijosMes: 1090000, margenPct: 30 });
    expect(r.comision).toBe(4800);
    expect(Math.round(r.fijosDia)).toBe(36333);
    expect(Math.round(r.libres)).toBe(186000 - 92000 - 8000 - 4800 - 36333);
    expect(Math.round(r.vender)).toBe(121111);
    expect(r.pasaste).toBe(true);
  });
  it("si el cierre guardado ya trae la comisión, no la cuenta dos veces", () => {
    const r = resultadoDelDia({ ventas: 100000, tarjeta: 50000, gastos: [{ categoria: "comision", monto: 3000 }], comisionPct: 6, fijosMes: 0, margenPct: 30 });
    expect(r.comision).toBe(3000);
    expect(r.libres).toBe(97000);
  });
  it("sin comisión cargada no se inventa", () => expect(comisionDe(80000, null)).toBe(0));
  it("número del día con el margen del negocio, entre 10% y 60%", () => {
    expect(Math.round(numeroDelDiaDe(900000, 40).vender)).toBe(75000);
    expect(numeroDelDiaDe(900000, 90).margen).toBe(60);
  });
  it("últimos 7 días y promedio", () => {
    const d = ultimos7([{ fecha: "2026-11-13", ventas: 50000, tarjeta: 0, gastos: [] }, { fecha: "2026-11-10", ventas: 10000, tarjeta: 0, gastos: [] }], "2026-11-13", 300000, 30);
    expect(d.map((x) => x.fecha)).toEqual(["2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"]);
    expect(d[6].libres).toBe(40000);
    expect(d[3].libres).toBe(0);
    expect(d[0].libres).toBeNull();
    expect(promedio(d.map((x) => x.libres))).toBe(20000);
    expect(promedio([null, null])).toBeNull();
  });
});

describe("margen y precios", () => {
  it("margen %", () => {
    expect(margenDe(2000, 1500)).toBe(25);
    expect(margenDe(null, 10)).toBeNull();
  });
  it("precio sugerido: deja el margen después de la comisión y redondea para arriba", () => {
    // 1.620 ÷ (1 − 0,30) = 2.314,3 → $2.320 (redondeo 10)
    expect(precioSugerido(1620, 30, null, 10)).toBe(2320);
    // con 6% de comisión: 1.620 ÷ 0,64 = 2.531,25 → $2.550 (redondeo 50)
    expect(precioSugerido(1620, 30, 6, 50)).toBe(2550);
    expect(precioSugerido(1000, 97, 5, 10)).toBeNull();
  });
  it("precio sin revisar hace más de 30 días", () => {
    expect(precioViejo({ precioActualizado: "2026-10-01T10:00:00Z", creado: "2026-01-01" }, "2026-11-13")).toBe(true);
    expect(precioViejo({ precioActualizado: "2026-11-01", creado: "2026-01-01" }, "2026-11-13")).toBe(false);
  });
  it("ranking de mayor a menor margen, en rojo bajo 15%", () => {
    const r = ranking([prod({ id: "a", precio: 1000, costo: 900 }), prod({ id: "b", precio: 1000, costo: 500 }), prod({ id: "c", precio: null })], 15);
    expect(r.map((p) => p.id)).toEqual(["b", "a", "c"]);
    expect(r.find((p) => p.id === "a")?.bajo).toBe(true);
    expect(r.find((p) => p.id === "b")?.bajo).toBe(false);
  });
});

describe("fiado inteligente", () => {
  const movs = [
    { tipo: "fio" as const, monto: 10000, fecha: "2026-09-20" },
    { tipo: "fio" as const, monto: 8000, fecha: "2026-10-20" },
    { tipo: "pago" as const, monto: 10000, fecha: "2026-11-01" },
  ];
  it("saldo y deuda más vieja (los pagos cancelan lo más viejo)", () => {
    expect(saldo(movs)).toBe(8000);
    expect(deudaMasVieja(movs)).toBe("2026-10-20");
  });
  it("semáforo", () => {
    expect(semaforo(movs, 0, "2026-11-01").color).toBe("verde");
    expect(semaforo(movs, 0, "2026-11-10").color).toBe("amarillo");
    expect(semaforo(movs, 0, "2026-11-25").color).toBe("rojo");
    expect(semaforo(movs, 2, "2026-10-25").color).toBe("rojo");
    expect(semaforo([...movs, { tipo: "pago", monto: 8000, fecha: "2026-11-02" }], 3, "2026-12-30")).toEqual({ color: "verde", dias: null });
  });
  it("recordatorio en voseo y link de WhatsApp", () => {
    const t = mensajeRecordatorio("Marta", 18000, "2026-10-03");
    expect(t).toBe("Hola Marta, te recuerdo el saldo pendiente de $18.000 del 03/10. Cuando puedas, avisame. Gracias.");
    expect(linkWhatsapp("3756 15 123456", "hola")).toBe("https://wa.me/5493756123456?text=hola");
    expect(linkWhatsapp(null, "hola que tal")).toBe("https://wa.me/?text=hola%20que%20tal");
  });
  it("hoy cobra (también el 31 en meses de 30 días)", () => {
    expect(cobraHoy(10, "2026-11-10")).toBe(true);
    expect(cobraHoy(31, "2026-11-30")).toBe(true);
    expect(cobraHoy(31, "2026-12-30")).toBe(false);
    expect(cobraHoy(null, "2026-11-10")).toBe(false);
  });
});

describe("plata dormida", () => {
  it("sin ventas hace más de 30 días, ordenados por plata inmovilizada", () => {
    const r = dormidos([
      prod({ id: "vendido", ultimaVenta: "2026-11-10" }),
      prod({ id: "dormido-chico", ultimaVenta: "2026-09-01", costo: 100, stock: 5 }),
      prod({ id: "dormido-grande", ultimaVenta: null, creado: "2026-08-01", costo: 3000, stock: 10, precio: 4000 }),
      prod({ id: "pausado", ultimaVenta: "2026-08-01", dormidoHasta: "2026-12-01" }),
    ], 30, "2026-11-13");
    expect(r.lista.map((p) => p.id)).toEqual(["dormido-grande", "dormido-chico"]);
    expect(r.inmovilizado).toBe(30000 + 500);
    expect(r.siLoVendieras).toBe(40000 + 5000);
  });
  it("liquidar = costo + 5%", () => expect(precioLiquidar(1000, 10)).toBe(1050));
});

describe("fechas", () => {
  it("hoy en Argentina", () => {
    expect(hoyArgentina(new Date("2026-11-14T02:00:00Z"))).toBe("2026-11-13");
    expect(hoyArgentina(new Date("2026-11-14T04:00:00Z"))).toBe("2026-11-14");
  });
  it("sumar y restar días, y 'hace cuánto'", () => {
    expect(sumarDias("2026-12-30", 3)).toBe("2027-01-02");
    expect(diasEntre("2026-10-03", "2026-11-13")).toBe(41);
    expect(haceCuanto("2026-10-03", "2026-11-13")).toBe("hace 41 días");
    expect(haceCuanto("2026-11-12", "2026-11-13")).toBe("ayer");
  });
});
