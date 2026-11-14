import path from "node:path";
import { describe, expect, it } from "vitest";
import { createWorker } from "tesseract.js";
import datos from "./facturas/facturas.json";
import { conAumento, cruzar, leerLineas, numeroAr, parecidoNombres } from "@/lib/factura";

// "Listo cuando": 3 facturas de prueba se leen con al menos 90% de productos bien cruzados (producto y costo).
// Usa el mismo lector gratuito que corre en el celular (Tesseract), con el idioma castellano local.
describe("foto de factura (lector gratuito, sin IA)", () => {
  it("las 3 facturas de ejemplo: ≥ 90% de productos bien cruzados con su costo", async () => {
    const worker = await createWorker("spa", 1, { langPath: path.resolve("node_modules/@tesseract.js-data/spa/4.0.0_best_int"), gzip: true, cachePath: path.resolve("node_modules/.cache/tesseract") });
    try {
      for (const f of datos.facturas) {
        const { data } = await worker.recognize(path.resolve("tests/facturas", f.archivo));
        const cruces = cruzar(leerLineas(data.text), datos.productos);
        const esperados = f.renglones.map(([, desc, , costo]) => ({ desc: String(desc), costo: Number(costo) }));
        let bien = 0;
        esperados.forEach((e, i) => {
          const c = cruces.find((x) => x.costo === e.costo);
          const correcto = datos.productos[datos.facturas.indexOf(f) * 8 + i].id;
          if (c && c.productoId === correcto) bien++;
        });
        const pct = (bien / esperados.length) * 100;
        console.log(`${f.archivo}: ${bien}/${esperados.length} (${pct}%)`);
        expect(pct).toBeGreaterThanOrEqual(90);
      }
    } finally {
      await worker.terminate();
    }
  }, 180_000);
});

describe("lectura de renglones", () => {
  it("números argentinos", () => {
    expect(numeroAr("1.890,00")).toBe(1890);
    expect(numeroAr("820,5")).toBe(820.5);
    expect(numeroAr("31.500")).toBe(31500);
    expect(numeroAr("abc")).toBeNull();
  });
  it("código, descripción, cantidad, precio e importe", () => {
    const l = leerLineas("101 COCA COLA 2.25 LTS X6 6 2.890,00 17.340,00\nTOTAL $ 123.120,00\nCUIT 30-71234567-8");
    expect(l).toEqual([{ descripcion: "COCA COLA 2.25 LTS X6", cantidad: 6, costo: 2890 }]);
  });
  it("sin columna de importe: toma el precio", () => {
    expect(leerLineas("YERBA PLAYADITO 1KG $3.150,00")[0]).toMatchObject({ descripcion: "YERBA PLAYADITO 1KG", costo: 3150 });
  });
  it("cantidad e importe (sin precio por unidad): divide", () => {
    expect(leerLineas("ALFAJOR TRIPLE 24 12480")[0]).toMatchObject({ cantidad: 24, costo: 520 });
  });
});

describe("cruce de nombres", () => {
  it("reconoce el mismo producto escrito distinto", () => {
    expect(parecidoNombres("COCA COLA 2.25 LTS X6", "Coca Cola 2,25 L")).toBeGreaterThan(0.6);
    expect(parecidoNombres("ACEITE NATURA 1.51", "Aceite Natura 1,5 L")).toBeGreaterThan(0.5);
    expect(parecidoNombres("COCA COLA 2.25 LTS", "Yerba Playadito 1 kg")).toBeLessThan(0.3);
  });
  it("cada producto se usa una sola vez y lo que no se parece queda sin cruzar", () => {
    const r = cruzar([{ descripcion: "COCA COLA 2.25", cantidad: 6, costo: 2890 }, { descripcion: "TORNILLOS 3/8", cantidad: 1, costo: 50 }], [{ id: "c", nombre: "Coca Cola 2,25 L" }]);
    expect(r.map((x) => x.productoId)).toEqual(["c", null]);
  });
  it("aumento por porcentaje", () => {
    expect(conAumento(1500, 8)).toBe(1620);
  });
});
