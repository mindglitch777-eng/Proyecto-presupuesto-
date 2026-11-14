import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { aDireccionOficial, irA } from "@/lib/redirigir";

// Problema P-07 (ver PROBLEMAS.md): una redirección armada con request.url mandaba al navegador a otra dirección
// del mismo sitio (localhost / sin www.) y la sesión "desaparecía". Esta prueba impide que vuelva a escribirse.
function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const r = join(dir, n);
    if (statSync(r).isDirectory()) return n === "node_modules" || n.startsWith(".") ? [] : archivos(r);
    return /\.(ts|tsx)$/.test(n) ? [r] : [];
  });
}

describe("redirecciones: el navegador nunca cambia de dirección", () => {
  const codigo = [...archivos("app"), ...archivos("lib"), ...archivos("components"), "proxy.ts"];

  it("ningún archivo arma redirecciones con request.url", () => {
    const culpables = codigo.filter((f) => /new URL\([^)]*request\.url/.test(readFileSync(f, "utf8")));
    expect(culpables, "usá irA() de lib/redirigir.ts").toEqual([]);
  });

  it("ningún archivo usa NextResponse.redirect con una dirección armada (salvo la dirección oficial)", () => {
    const culpables = codigo.filter((f) => f !== join("lib", "redirigir.ts") && /NextResponse\.redirect\(/.test(readFileSync(f, "utf8")));
    expect(culpables, "usá irA() de lib/redirigir.ts").toEqual([]);
  });

  const pedidoDe = (url: string, cabeceras: Record<string, string>) => new NextRequest(url, { headers: cabeceras });

  it("irA usa la dirección que escribió la persona, no la interna del servidor", () => {
    // El servidor se cree "localhost", pero el navegador entró por 127.0.0.1 (lo que pasaba en la prueba real)
    const r = irA(pedidoDe("http://localhost:3100/auth/callback", { host: "127.0.0.1:3100" }), "/nueva-clave?t=abc");
    expect(r.headers.get("location")).toBe("http://127.0.0.1:3100/nueva-clave?t=abc");
    expect(r.status).toBe(303);
    // Netlify: la dirección real viene en x-forwarded-host / x-forwarded-proto
    const n = irA(pedidoDe("http://interno:8080/app", { host: "interno:8080", "x-forwarded-host": "enclaro.com.ar", "x-forwarded-proto": "https" }), "/entrar", 307);
    expect(n.headers.get("location")).toBe("https://enclaro.com.ar/entrar");
  });

  it("irA siempre da una dirección completa (con una relativa, el proxy de Next da error 500)", () => {
    expect(irA(pedidoDe("http://localhost:3100/app", { host: "localhost:3100" }), "/app").headers.get("location")).toMatch(/^https?:\/\//);
  });

  it("irA no acepta mandar a sitios de afuera", () => {
    const req = pedidoDe("http://localhost:3100/", { host: "localhost:3100" });
    expect(() => irA(req, "//sitio-malo.com")).toThrow();
    expect(() => irA(req, "https://sitio-malo.com")).toThrow();
    expect(() => irA(req, "/\\sitio-malo.com")).toThrow();
  });
});

describe("dirección oficial (HOST_CANONICO)", () => {
  afterEach(() => { delete process.env.HOST_CANONICO; });
  const pedido = (url: string, host: string) => new NextRequest(url, { headers: { host } });

  it("sin la variable no hace nada", () => {
    expect(aDireccionOficial(pedido("https://www.enclaro.com.ar/app", "www.enclaro.com.ar"))).toBeNull();
  });
  it("con www. o la dirección de Netlify pasa a la oficial, conservando la pantalla", () => {
    process.env.HOST_CANONICO = "enclaro.com.ar";
    const r = aDireccionOficial(pedido("https://www.enclaro.com.ar/app/fiados?x=1", "www.enclaro.com.ar"));
    expect(r?.status).toBe(308);
    expect(r?.headers.get("location")).toBe("https://enclaro.com.ar/app/fiados?x=1");
    expect(aDireccionOficial(pedido("https://enclaro.netlify.app/entrar", "enclaro.netlify.app"))?.headers.get("location")).toBe("https://enclaro.com.ar/entrar");
  });
  it("en la dirección oficial no hace nada", () => {
    process.env.HOST_CANONICO = "enclaro.com.ar";
    expect(aDireccionOficial(pedido("https://enclaro.com.ar/app", "enclaro.com.ar"))).toBeNull();
  });
});
