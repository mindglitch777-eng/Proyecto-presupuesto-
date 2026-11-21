import { hoyArgentina, sumarDias } from "../fechas";
import type { CierreGuardado } from "../cierre";
import { comisionDe } from "../cierre";
import type { ProductoMargen } from "../margen";
import type { Cliente, Datos, ItemCierre, Negocio } from "./tipos";

// Datos de ejemplo en memoria, SOLO para las pruebas automáticas (ENCLARO_MODO_PRUEBA=1 + cookie). Nunca en la web publicada.

type Estado = { vendido?: Record<string, ItemCierre[]>; negocio: Negocio; fijos: number; listaFijos: { concepto: string; monto: number }[]; cierres: CierreGuardado[]; movidos: { id: string; fecha: string }[]; productos: ProductoMargen[]; clientes: Cliente[]; cambios: number; sec: number };

function semilla(): Estado {
  const hoy = hoyArgentina();
  const d = (n: number) => sumarDias(hoy, -n);
  const p = (id: string, nombre: string, precio: number, costo: number, stock: number, actualizado: string, ultimaVenta: string | null): ProductoMargen => ({ id, nombre, precio, costo, stock, precioActualizado: actualizado, ultimaVenta, creado: d(120), accionDormido: null, dormidoHasta: null });
  const dia = Number(hoy.slice(8, 10));
  return {
    negocio: { id: "n1", primerUsoTerminado: true, nombre: "Kiosco Don Pedro", rubro: "kiosco", ciudad: "Santo Tomé", comisionPct: 6, alertaPct: 15, diasDormida: 30, redondeo: 10 },
    fijos: 1_090_000,
    listaFijos: [{ concepto: "Alquiler", monto: 450_000 }, { concepto: "Luz y servicios", monto: 140_000 }, { concepto: "Sueldos", monto: 500_000 }, { concepto: "Otros", monto: 0 }],
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

/**
 * Negocio de ejemplo del video V8-01 (solo con ENCLARO_DEMO=v8-01, para grabar la pantalla): la cuenta del guion da justo $23.500.
 * Vende $150.000 · gana 35% en promedio ($52.500) − comisión 4% de $75.000 por QR ($3.000) − fiado que no vuelve ($8.000)
 * − alquiler y luz del día ($540.000 ÷ 30 = $18.000) = $23.500.
 */
function semillaVideoV8(): Estado {
  const e = semilla();
  e.negocio = { ...e.negocio, nombre: "Kiosco de barrio", comisionPct: 4 };
  e.listaFijos = [{ concepto: "Alquiler", monto: 390_000 }, { concepto: "Luz", monto: 150_000 }];
  e.fijos = 540_000;
  e.productos = e.productos.map((p) => ({ ...p, costo: p.precio === null ? p.costo : Math.round(p.precio * 0.65) }));
  return e;
}
/** V8-02 (solo con ENCLARO_DEMO=v8-02): cuaderno de fiados que suma $380.000; Marta es la que más debe ($62.000, en rojo). */
function semillaVideoV8_02(): Estado {
  const e = semillaVideoV8();
  const hoy = hoyArgentina();
  const lista: [string, number, number, number][] = [
    // nombre, monto, días de la deuda más vieja, recordatorios sin pago
    ["Marta", 62000, 41, 2], ["Carlos", 54000, 36, 1], ["Juan", 48000, 24, 1], ["Rosa", 41500, 19, 0], ["Beto", 39000, 33, 0],
    ["Nélida", 36500, 12, 0], ["Hugo", 33000, 9, 0], ["Sandra", 29000, 17, 0], ["Pocho", 21000, 6, 0], ["Graciela", 16000, 4, 0],
  ];
  e.clientes = lista.map(([nombre, monto, dias, rec], i) => ({
    id: `c${i + 1}`, nombre, telefono: "3756 15 " + String(400000 + i * 1111), diaCobro: null, nota: null,
    ultimoRecordatorio: rec ? sumarDias(hoy, -3) : null, recordatoriosSinPago: rec,
    movimientos: [{ id: `m${i + 1}`, tipo: "fio" as const, monto, fecha: sumarDias(hoy, -dias), nota: null }],
  }));
  return e;
}

/**
 * V8-03 (solo con ENCLARO_DEMO=v8-03): hoy entró $210.000 ($90.000 por QR, 4% = $3.600), pagó $140.000 al proveedor,
 * la mercadería deja 1/3 ($70.000) y los fijos son $1.089.000 al mes ($36.300 por día) → ganancia de hoy $30.100.
 * En el depósito hay $95.000 dormidos (a costo) en productos que no se venden hace meses.
 */
function semillaVideoV8_03(): Estado {
  const e = semilla();
  const hoy = hoyArgentina();
  const d = (n: number) => sumarDias(hoy, -n);
  e.negocio = { ...e.negocio, nombre: "Kiosco de barrio", comisionPct: 4 };
  e.listaFijos = [{ concepto: "Alquiler", monto: 450_000 }, { concepto: "Luz y servicios", monto: 139_000 }, { concepto: "Sueldos", monto: 500_000 }];
  e.fijos = 1_089_000;
  const p = (id: string, nombre: string, precio: number, stock: number, ultimaVenta: string): ProductoMargen => ({ id, nombre, precio, costo: (precio * 2) / 3, stock, precioActualizado: d(5), ultimaVenta, creado: d(150), accionDormido: null, dormidoHasta: null });
  e.productos = [
    p("p1", "Gaseosa 500", 2160, 48, d(0)), p("p2", "Alfajor triple", 1200, 60, d(0)), p("p3", "Cigarrillos", 4500, 40, d(0)),
    p("p4", "Agua 500", 990, 30, d(0)), p("p5", "Caramelos sueltos", 99, 400, d(0)),
    p("p6", "Turrones surtidos", 1500, 40, d(96)), p("p7", "Yerba orgánica 1 kg", 4500, 10, d(84)),
    p("p8", "Galletitas importadas", 2250, 10, d(71)), p("p9", "Pilas recargables", 1500, 10, d(120)),
  ];
  e.cierres = [...e.cierres.slice(1), { fecha: hoy, ventas: 210000, tarjeta: 90000, gastos: [{ categoria: "proveedor", monto: 140000 }, { categoria: "comision", monto: 3600 }] }];
  e.movidos = e.productos.slice(0, 5).map((x) => ({ id: x.id, fecha: hoy }));
  e.clientes = [];
  return e;
}

/**
 * V8-04 (solo con ENCLARO_DEMO=v8-04): 4 productos con el costo viejo. La factura nueva (tests/facturas/factura-v8-04.jpg)
 * trae alfajor $1.450, gaseosa $1.600, yerba $4.300 (aumentó 21%) y galletitas $1.050.
 */
function semillaVideoV8_04(): Estado {
  const e = semilla();
  const hoy = hoyArgentina();
  const d = (n: number) => sumarDias(hoy, -n);
  e.negocio = { ...e.negocio, nombre: "Kiosco de barrio", comisionPct: 4 };
  const p = (id: string, nombre: string, precio: number, costo: number): ProductoMargen => ({ id, nombre, precio, costo, stock: 30, precioActualizado: d(50), ultimaVenta: d(0), creado: d(150), accionDormido: null, dormidoHasta: null });
  e.productos = [p("p1", "Alfajor triple", 1200, 1000), p("p2", "Gaseosa 1,5 L", 2250, 1320), p("p3", "Yerba 1 kg", 3900, 3550), p("p4", "Galletitas dulces", 1100, 870)];
  e.movidos = [];
  return e;
}

/** V8-05 (ENCLARO_DEMO=v8-05): el negocio del V8-01 con el cierre de hoy ya hecho → ganancia de hoy $23.500 (× 360 = $8.460.000 al año). */
function semillaVideoV8_05(): Estado {
  const e = semillaVideoV8();
  const hoy = hoyArgentina();
  e.cierres = [...e.cierres.slice(1), { fecha: hoy, ventas: 150000, tarjeta: 75000, gastos: [{ categoria: "otros", monto: 8000 }, { categoria: "comision", monto: 3000 }] }];
  e.clientes = [];
  // sin avisos que distraigan: precios al día y todo vendiéndose
  e.productos = e.productos.map((x) => ({ ...x, precioActualizado: sumarDias(hoy, -3), ultimaVenta: hoy }));
  return e;
}

/**
 * V8-06 (ENCLARO_DEMO=v8-06): $400.000 dormidos en el depósito (a costo): golosinas $120.000 (la más cara), limpieza $100.000,
 * bebidas $94.000 y galletitas que vencen en 40 días $86.000. Mismo negocio del V8-01 (le quedan $23.500 por día → 17 días).
 */
function semillaVideoV8_06(): Estado {
  const e = semillaVideoV8_05();
  const hoy = hoyArgentina();
  const d = (n: number) => sumarDias(hoy, -n);
  const dormido = (id: string, nombre: string, precio: number, costo: number, stock: number, dias: number): ProductoMargen => ({ id, nombre, precio, costo, stock, precioActualizado: d(20), ultimaVenta: d(dias), creado: d(200), accionDormido: null, dormidoHasta: null });
  e.productos = [
    ...e.productos.filter((x) => ["p1", "p2", "p3", "p4", "p8"].includes(x.id)).map((x) => ({ ...x, ultimaVenta: hoy })),
    dormido("d1", "Golosinas surtidas", 920, 600, 200, 64),
    dormido("d2", "Artículos de limpieza", 3080, 2000, 50, 58),
    dormido("d3", "Bebidas 2,25 L", 1810, 1175, 80, 47),
    dormido("d4", "Galletitas (vencen en 40 días)", 2650, 1720, 50, 39),
  ];
  return e;
}

/** V8-07 (ENCLARO_DEMO=v8-07): Tu día con las fugas del ticket: precios viejos (alfajor, gaseosa, yerba, galletitas) y el fiado de Marta ($14.000, cobra hoy). */
function semillaVideoV8_07(): Estado {
  const e = semillaVideoV8_05();
  const hoy = hoyArgentina();
  const d = (n: number) => sumarDias(hoy, -n);
  const viejo = (id: string, nombre: string, precio: number, costo: number): ProductoMargen => ({ id, nombre, precio, costo, stock: 30, precioActualizado: d(52), ultimaVenta: hoy, creado: d(150), accionDormido: null, dormidoHasta: null });
  e.productos = [
    ...e.productos.filter((x) => ["p1", "p3", "p4", "p8"].includes(x.id)).map((x) => ({ ...x, precioActualizado: d(3), ultimaVenta: hoy })),
    viejo("v1", "Alfajor triple", 1200, 780), viejo("v2", "Gaseosa 1,5 L", 2200, 1430), viejo("v3", "Yerba 1 kg", 3900, 2535), viejo("v4", "Galletitas dulces", 1100, 715),
  ];
  e.clientes = [{ id: "c1", nombre: "Marta", telefono: "3756 15 400000", diaCobro: Number(hoy.slice(8, 10)), nota: null, ultimoRecordatorio: null, recordatoriosSinPago: 0, movimientos: [{ id: "m1", tipo: "fio", monto: 14000, fecha: d(20), nota: null }] }];
  return e;
}

/** V8-08 (ENCLARO_DEMO=v8-08): el negocio del V8-01 sin cierre hoy; el cierre por voz da $23.500. */
const semillaVideoV8_08 = () => semillaVideoV8();

/**
 * V8-09 (ENCLARO_DEMO=v8-09): el kiosco que sí hace su cierre. Vende $150.000 ($75.000 por QR, 4% = $3.000), la mercadería deja 40%
 * y los fijos son $519.000 al mes ($17.300 por día) → ganancia de hoy $39.700. Marta debe en rojo; el alfajor tiene precio para revisar.
 */
function semillaVideoV8_09(): Estado {
  const e = semillaVideoV8();
  const hoy = hoyArgentina();
  e.listaFijos = [{ concepto: "Alquiler", monto: 390_000 }, { concepto: "Luz", monto: 129_000 }];
  e.fijos = 519_000;
  e.productos = e.productos.map((x) => ({ ...x, costo: x.precio === null ? x.costo : Math.round(x.precio * 0.6), precioActualizado: sumarDias(hoy, -3), ultimaVenta: hoy }));
  e.cierres = [...e.cierres.slice(1), { fecha: hoy, ventas: 150000, tarjeta: 75000, gastos: [{ categoria: "comision", monto: 3000 }] }];
  e.clientes = [
    { id: "c1", nombre: "Marta", telefono: "3756 15 400000", diaCobro: null, nota: null, ultimoRecordatorio: sumarDias(hoy, -3), recordatoriosSinPago: 2, movimientos: [{ id: "m1", tipo: "fio", monto: 62000, fecha: sumarDias(hoy, -41), nota: null }] },
    { id: "c2", nombre: "Carlos", telefono: null, diaCobro: null, nota: null, ultimoRecordatorio: null, recordatoriosSinPago: 0, movimientos: [{ id: "m2", tipo: "fio", monto: 9500, fecha: sumarDias(hoy, -6), nota: null }] },
  ];
  return e;
}

/** V8-10 (ENCLARO_DEMO=v8-10): Tu día con $23.500, Marta en rojo en Fiados y el proveedor que aumentó 20%. */
function semillaVideoV8_10(): Estado {
  const e = semillaVideoV8_05();
  const hoy = hoyArgentina();
  e.clientes = [
    { id: "c1", nombre: "Marta", telefono: "3756 15 400000", diaCobro: null, nota: null, ultimoRecordatorio: sumarDias(hoy, -3), recordatoriosSinPago: 2, movimientos: [{ id: "m1", tipo: "fio", monto: 62000, fecha: sumarDias(hoy, -41), nota: null }] },
    { id: "c2", nombre: "Juan", telefono: null, diaCobro: null, nota: null, ultimoRecordatorio: null, recordatoriosSinPago: 0, movimientos: [{ id: "m2", tipo: "fio", monto: 48000, fecha: sumarDias(hoy, -24), nota: null }] },
  ];
  return e;
}

/** V8-11 (ENCLARO_DEMO=v8-11): Tu día con $23.500, el alfajor con precio para revisar y Marta en rojo. */
const semillaVideoV8_11 = () => semillaVideoV8_10();
// V8-13 y V8-14 usan el mismo kiosco de ejemplo ($23.500 por día, 13 horas): Tu día → precio sugerido → Fiados.

/**
 * V8-12 (ENCLARO_DEMO=v8-12): productos con márgenes muy distintos para que el ranking muestre qué deja plata y qué no
 * (cigarrillos y yerba casi no dejan; caramelos, agua y alfajor sí).
 */
function semillaVideoV8_12(): Estado {
  const e = semilla();
  const hoy = hoyArgentina();
  e.negocio = { ...e.negocio, nombre: "Kiosco de barrio", comisionPct: 4 };
  e.productos = e.productos.map((x) => ({ ...x, precioActualizado: sumarDias(hoy, -3), ultimaVenta: hoy }));
  e.clientes = [];
  return e;
}

/**
 * V9-03 (ENCLARO_DEMO=v9-03): "Tenés plata encerrada en tu depósito". Mercadería total $1.200.000 (costo × stock);
 * sin ventas hace meses $360.000 (vino, shampoo, galletitas, turrones) = 3 alquileres de $120.000.
 */
function semillaVideoV9_03(): Estado {
  const e = semilla();
  const hoy = hoyArgentina();
  const d = (n: number) => sumarDias(hoy, -n);
  const p = (id: string, nombre: string, precio: number, costo: number, stock: number, ultimaVenta: string) => ({ id, nombre, precio, costo, stock, precioActualizado: d(3), ultimaVenta, creado: d(150), accionDormido: null, dormidoHasta: null });
  e.negocio = { ...e.negocio, nombre: "Kiosco de barrio", comisionPct: 4 };
  e.productos = [
    p("p1", "Vino tinto 750", 6000, 4000, 30, d(95)),
    p("p2", "Shampoo 400 ml", 3900, 2700, 36, d(82)),
    p("p3", "Galletitas rellenas", 1500, 1120, 75, d(71)),
    p("p4", "Turrones surtidos", 1400, 980, 60, d(94)),
    p("p5", "Cigarrillos", 4500, 3900, 60, d(1)),
    p("p6", "Gaseosa 500", 2160, 1500, 120, d(1)),
    p("p7", "Yerba 500 g", 3600, 2800, 60, d(2)),
    p("p8", "Alfajor triple", 1200, 800, 150, d(1)),
    p("p9", "Agua 500", 1000, 600, 95, d(1)),
    p("p10", "Leche larga vida", 1400, 950, 60, d(1)),
    p("p11", "Caramelos sueltos", 100, 60, 400, d(1)),
  ];
  return e;
}

/**
 * Prueba piloto (ENCLARO_DEMO=p1 | p2 | p3). Productos con 30% de margen promedio.
 * p1 "La caja miente": vendió $180.000, pagó $126.000 de reposición y $22.000 de gastos → entró a la caja $32.000;
 *    fijos $540.000/mes ($18.000 por día) → ganancia de hoy $14.000.
 * p2 "Trabajás para pagar": fijos $900.000/mes ($30.000 por día); vendió $90.000 (le dejan $27.000), comisión $2.000 → quedan
 *    $25.000 para cubrir los $30.000 → ganancia de hoy −$5.000.
 * p3 "Tu plata está en la calle": le deben $96.000 entre 5 clientes.
 */
function semillaPiloto(cual: "p1" | "p2" | "p3"): Estado {
  const e = semilla();
  const hoy = hoyArgentina();
  e.negocio = { ...e.negocio, nombre: "Kiosco de barrio", comisionPct: 4 };
  e.productos = e.productos.map((x) => ({ ...x, costo: x.precio === null ? x.costo : x.precio * 0.7, precioActualizado: sumarDias(hoy, -3), ultimaVenta: hoy }));
  e.movidos = e.productos.map((x) => ({ id: x.id, fecha: hoy }));
  if (cual === "p1") {
    e.listaFijos = [{ concepto: "Alquiler", monto: 390_000 }, { concepto: "Luz", monto: 150_000 }];
    e.fijos = 540_000;
    e.cierres = [...e.cierres.slice(1), { fecha: hoy, ventas: 180000, tarjeta: 0, gastos: [{ categoria: "proveedor", monto: 126000 }, { categoria: "otros", monto: 22000 }] }];
    e.clientes = [];
  } else if (cual === "p2") {
    e.listaFijos = [{ concepto: "Alquiler", monto: 450_000 }, { concepto: "Luz y servicios", monto: 150_000 }, { concepto: "Sueldos", monto: 300_000 }];
    e.fijos = 900_000;
    e.cierres = [...e.cierres.slice(1), { fecha: hoy, ventas: 90000, tarjeta: 50000, gastos: [{ categoria: "comision", monto: 2000 }] }];
    e.clientes = [];
  } else {
    const lista: [string, number, number][] = [["Marta", 32000, 34], ["Juan", 24000, 21], ["Rosa", 18000, 15], ["Carlos", 14000, 9], ["Beto", 8000, 5]];
    e.clientes = lista.map(([nombre, monto, dias], i) => ({
      id: `c${i + 1}`, nombre, telefono: "3756 15 " + String(400000 + i * 1111), diaCobro: null, nota: null, ultimoRecordatorio: null, recordatoriosSinPago: 0,
      movimientos: [{ id: `m${i + 1}`, tipo: "fio" as const, monto, fecha: sumarDias(hoy, -dias), nota: null }],
    }));
  }
  return e;
}

/** "¡Estás regalando tu ganancia!" (ENCLARO_DEMO=p5): el alfajor costaba $800 y se vende a $1.000 (te deja $200); llega a $950 → te deja $50. */
function semillaP5(): Estado {
  const e = semilla();
  const hoy = hoyArgentina();
  e.negocio = { ...e.negocio, nombre: "Kiosco de barrio", comisionPct: null };
  e.productos = e.productos.map((x) => (x.id === "p2" ? { ...x, nombre: "Alfajor triple", precio: 1000, costo: 800, precioActualizado: sumarDias(hoy, -40), ultimaVenta: hoy } : { ...x, ultimaVenta: hoy }));
  e.clientes = [];
  return e;
}

/**
 * V9-04 (ENCLARO_DEMO=v9-04) "Tu caja tiene hambre": entran $120.000; la mercadería cuesta el 55% ($66.000), fijos $1.090.000/mes
 * ($36.333 por día: alquiler y luz) y $8.000 de comisiones → ganancia de hoy $9.667.
 */
function semillaV9_04(): Estado {
  const e = semilla();
  const hoy = hoyArgentina();
  e.negocio = { ...e.negocio, nombre: "Kiosco de barrio", comisionPct: 4 };
  e.listaFijos = [{ concepto: "Alquiler", monto: 700_000 }, { concepto: "Luz y servicios", monto: 390_000 }];
  e.fijos = 1_090_000;
  e.productos = e.productos.map((x) => ({ ...x, costo: x.precio === null ? x.costo : x.precio * 0.55, precioActualizado: sumarDias(hoy, -3), ultimaVenta: hoy }));
  e.movidos = e.productos.map((x) => ({ id: x.id, fecha: hoy }));
  e.cierres = [...e.cierres.slice(1), { fecha: hoy, ventas: 120000, tarjeta: 0, gastos: [{ categoria: "comision", monto: 8000 }] }];
  e.clientes = [];
  return e;
}

/**
 * Demos de Facebook (ENCLARO_DEMO=fb-01 | fb-02 | fb-03), grabación de pantalla "de celular".
 * fb-01: el kiosco del V8-01 sin cierre hoy; se cierra por voz con la frase 1 de tests/voz.json
 *        (vende $120.000, deja 35% = $42.000 − flete $5.000 − fijos del día $18.000 → ganancia $19.000).
 * fb-02: mismo kiosco con Marta en rojo en Fiados y el alfajor para revisar; se cierra por voz con la frase 4 de tests/voz.json
 *        ($230.000, $100.000 con tarjeta 4% = $4.000; deja $80.500 − $4.000 − $18.000 → ganancia $58.500).
 * fb-03: la factura del V8-04 (4 productos con el costo viejo).
 */
const semillaFb01 = () => semillaVideoV8();
function semillaFb02(): Estado {
  const e = semillaVideoV8_10();
  const hoy = hoyArgentina();
  e.cierres = e.cierres.filter((c) => c.fecha !== hoy);
  return e;
}
const semillaFb03 = () => semillaVideoV8_04();

const SEMILLAS: Record<string, () => Estado> = { "fb-01": semillaFb01, "fb-02": semillaFb02, "fb-03": semillaFb03, "v8-01": semillaVideoV8, "v8-02": semillaVideoV8_02, "v8-03": semillaVideoV8_03, "v8-04": semillaVideoV8_04, "v8-05": semillaVideoV8_05, "v8-06": semillaVideoV8_06, "v8-07": semillaVideoV8_07, "v8-08": semillaVideoV8_08, "v8-09": semillaVideoV8_09, "v8-10": semillaVideoV8_10, "v8-11": semillaVideoV8_11, "v8-12": semillaVideoV8_12, "v8-13": semillaVideoV8_11, "v8-14": semillaVideoV8_11, "v9-03": semillaVideoV9_03, p1: () => semillaPiloto("p1"), p2: () => semillaPiloto("p2"), p3: () => semillaPiloto("p3"), p5: semillaP5, "v9-04": semillaV9_04 };
const semillaActual = () => (SEMILLAS[process.env.ENCLARO_DEMO ?? ""] ?? semilla)();

const g = globalThis as unknown as { __enclaroMemoria?: Estado };
const estado = () => (g.__enclaroMemoria ??= semillaActual());
export const reiniciarMemoria = () => { g.__enclaroMemoria = semillaActual(); };
const nuevoId = (pre: string) => `${pre}${++estado().sec}`;

export function datosMemoria(): Datos {
  return {
    async negocio() { return estado().negocio; },
    async fijosMes() { return estado().fijos; },
    async fijos() { return estado().listaFijos; },
    async guardarAjustes(a) {
      const e = estado();
      Object.assign(e.negocio, { nombre: a.nombre, ciudad: a.ciudad, comisionPct: a.comisionPct, alertaPct: a.alertaPct, diasDormida: a.diasDormida, redondeo: a.redondeo });
      e.listaFijos = a.fijos;
      e.fijos = a.fijos.reduce((s, f) => s + f.monto, 0);
    },
    async cierres(desde) { return estado().cierres.filter((c) => c.fecha >= desde).sort((a, b) => a.fecha.localeCompare(b.fecha)); },
    async movidosEn(fecha) { return estado().movidos.filter((m) => m.fecha === fecha).map((m) => m.id); },
    async vendidoEn(fecha) { return estado().vendido?.[fecha] ?? []; },
    async vendidoDesde(desde) { return Object.entries(estado().vendido ?? {}).filter(([f]) => f >= desde).flatMap(([, l]) => l); },
    async guardarCierre(c) {
      const e = estado();
      if (c.items) {
        // corregir el cierre devuelve al stock lo que se había descontado
        for (const it of e.vendido?.[c.fecha] ?? []) {
          const p = it.productoId ? e.productos.find((x) => x.id === it.productoId) : undefined;
          if (p && p.stock !== null && it.descontar) p.stock += it.descontar;
        }
        const guardados: ItemCierre[] = c.items.map((it) => {
          const p = it.productoId ? e.productos.find((x) => x.id === it.productoId) : undefined;
          const quitar = p && p.stock !== null && it.descontar ? Math.min(p.stock, it.descontar) : 0;
          if (p && p.stock !== null) p.stock -= quitar;
          return { ...it, descontar: quitar };
        });
        e.vendido = { ...(e.vendido ?? {}), [c.fecha]: guardados };
      }
      if (c.tarjeta > c.ventas) throw new Error("tarjeta > ventas");
      const gastos = c.gastos.filter((x) => x.categoria !== "comision" && x.monto > 0);
      const com = comisionDe(c.tarjeta, e.negocio.comisionPct);
      if (com) gastos.push({ categoria: "comision", monto: com });
      e.cierres = [...e.cierres.filter((x) => x.fecha !== c.fecha), { fecha: c.fecha, ventas: c.ventas, tarjeta: c.tarjeta, gastos }];
      for (const it of c.items ?? []) if (it.productoId && !c.productos.includes(it.productoId)) c.productos.push(it.productoId);
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
    async nuevoCosto(id, costo, precio) {
      const p = estado().productos.find((x) => x.id === id);
      if (!p) throw new Error("sin producto");
      Object.assign(p, { costo, precio, precioActualizado: new Date().toISOString() });
      estado().cambios++;
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
