import { describe, expect, it } from "vitest";
import { anotarseSchema, bajaSchema, normalizarWhatsapp } from "@/lib/listaEspera";

describe("normalizarWhatsapp", () => {
  it.each([
    ["3756 15 123456", "5493756123456"],
    ["03756-123456", "5493756123456"],
    ["+54 9 3756 123456", "5493756123456"],
    ["5493756123456", "5493756123456"],
    ["011 15 4567 8901", "5491145678901"],
    ["(11) 4567-8901", "5491145678901"],
  ])("%s → %s", (entrada, salida) => {
    expect(normalizarWhatsapp(entrada)).toBe(salida);
  });

  it.each(["", "123", "abcdefghij", "12345678901234567", "0000000000"])("rechaza %s", (x) => {
    expect(normalizarWhatsapp(x)).toBeNull();
  });
});

describe("anotarseSchema", () => {
  const ok = { nombre: "Marta Gómez", whatsapp: "3756 15 123456", rubro: "kiosco", numero_del_dia: 121111 };

  it("acepta un alta válida y recorta los espacios", () => {
    const r = anotarseSchema.safeParse({ ...ok, nombre: "  Marta Gómez ", ciudad: " Santo Tomé ", utm_source: "tiktok", utm_content: "v5-01" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.nombre).toBe("Marta Gómez");
      expect(r.data.ciudad).toBe("Santo Tomé");
    }
  });

  it("pide nombre, WhatsApp válido y rubro con mensajes en voseo", () => {
    const sinNombre = anotarseSchema.safeParse({ ...ok, nombre: "" });
    expect(sinNombre.success).toBe(false);
    if (!sinNombre.success) expect(sinNombre.error.issues[0].message).toBe("Escribí tu nombre.");
    expect(anotarseSchema.safeParse({ ...ok, whatsapp: "123" }).success).toBe(false);
    expect(anotarseSchema.safeParse({ ...ok, rubro: "ferreteria" }).success).toBe(false);
  });

  it("deja en undefined los textos vacíos y rechaza números absurdos", () => {
    const r = anotarseSchema.safeParse({ ...ok, ciudad: "   ", utm_source: "" });
    expect(r.success && r.data.ciudad).toBeUndefined();
    expect(anotarseSchema.safeParse({ ...ok, numero_del_dia: -1 }).success).toBe(false);
  });

  it("bajaSchema pide un WhatsApp válido", () => {
    expect(bajaSchema.safeParse({ whatsapp: "3756 15 123456" }).success).toBe(true);
    expect(bajaSchema.safeParse({ whatsapp: "hola" }).success).toBe(false);
  });
});
