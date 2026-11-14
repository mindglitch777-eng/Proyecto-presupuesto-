// Fase 4 a 360 px: foto de factura (lector gratis en el navegador), aumento por %, y carteles. Servidor con ENCLARO_MODO_PRUEBA=1.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const BASE = process.env.BASE || "http://127.0.0.1:3100";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, locale: "es-AR" });
  await ctx.addCookies([{ name: "enclaro_prueba", value: "1", url: BASE }]);
  const page = await ctx.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(String(e)));
  const ok = (t) => console.log("✓", t);
  await page.request.post(BASE + "/prueba/reiniciar");

  await page.goto(BASE + "/app/precios", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Sacale foto a la factura/ }).click();
  await page.getByRole("heading", { name: "Precios nuevos del proveedor" }).waitFor();
  await page.screenshot({ path: "capturas/factura-inicio.png" });

  const t0 = Date.now();
  await page.getByLabel("Foto de la factura").setInputFiles(path.join(__dirname, "../tests/facturas/factura-1.jpg"));
  await page.getByText("Esto es lo que encontré").waitFor({ timeout: 120000 });
  const seg = (Date.now() - t0) / 1000;
  const renglones = await page.locator("main ul > li").count();
  assert.equal(renglones, 8, "debía encontrar los 8 renglones");
  ok(`la foto se leyó en el navegador en ${seg.toFixed(1)} s: 8 renglones`);
  assert.match(await page.locator("main ul > li").first().innerText(), /COCA COLA 2\.25 LTS X6/);
  // ninguno coincide con los productos de ejemplo: el primero lo asigno a la gaseosa y el segundo como producto nuevo
  const primero = page.locator("main ul > li").nth(0), segundo = page.locator("main ul > li").nth(1);
  await primero.getByLabel("Es tu producto").selectOption({ label: "Gaseosa 500" });
  assert.equal(await primero.getByLabel("Te cuesta").inputValue(), "2.890");
  await primero.getByText(/Aumentó \$1\.390/).waitFor(); // antes costaba 1.500
  // la gaseosa dejaba 30,6% → 31% y 6% de comisión: 2.890 ÷ 0,63 = 4.587 → $4.590
  assert.equal(await primero.getByLabel("Vendelo a").inputValue(), "4.590");
  await segundo.getByLabel("Es tu producto").selectOption({ label: "Es un producto nuevo" });
  await page.screenshot({ path: "capturas/factura-renglones.png", fullPage: true });
  await page.getByRole("button", { name: "Aplicar los 2 precios" }).click();
  await page.getByText("Precios actualizados: 2 productos.").waitFor();
  await page.getByRole("img", { name: "Cartel 1" }).waitFor();
  await page.screenshot({ path: "capturas/factura-carteles.png", fullPage: true });
  ok("aplicar: gaseosa a $4.590 y Sprite como producto nuevo; carteles listos");
  const href = await page.getByRole("link", { name: "Descargar" }).getAttribute("href");
  assert.match(href, /^blob:/);
  await page.getByRole("radio", { name: "Estado de WhatsApp" }).click();
  await page.getByRole("img", { name: "Cartel 1" }).waitFor();
  const cartel = await page.getByRole("img", { name: "Cartel 1" }).evaluate((i) => ({ w: i.naturalWidth, h: i.naturalHeight }));
  assert.deepEqual(cartel, { w: 1080, h: 1920 });
  // guardo el cartel para mirarlo
  const png = await page.evaluate(async () => { const u = document.querySelector('img[alt="Cartel 1"]').src; const bl = await (await fetch(u)).blob(); return Array.from(new Uint8Array(await bl.arrayBuffer())); });
  require("node:fs").writeFileSync("capturas/cartel-estado.png", Buffer.from(png));
  ok("cartel para el estado de WhatsApp: 1080 × 1920");

  await page.goto(BASE + "/app/precios", { waitUntil: "networkidle" });
  assert.match(await page.locator("main").innerText(), /\$4\.590/);
  assert.match(await page.locator("main").innerText(), /Sprite 1\.5 Lt/);
  ok("en Precios ya figuran el precio nuevo y el producto nuevo");

  // El proveedor aumentó 8% (solo alfajor)
  await page.goto(BASE + "/app/factura", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Aumentó un %" }).click();
  await page.getByLabel("¿Cuánto aumentó el proveedor?").fill("8");
  await page.getByRole("button", { name: "Ninguno" }).click();
  await page.getByLabel("Alfajor triple").check();
  // alfajor: costo 800 → 864; margen 33% + 6% comisión: 864 ÷ 0,61 = 1.416 → $1.420
  await page.getByText("$1.420").waitFor();
  await page.screenshot({ path: "capturas/factura-porcentaje.png", fullPage: true });
  await page.getByRole("button", { name: "Aplicar a 1 producto" }).click();
  await page.getByText("Precios actualizados: 1 producto.").waitFor();
  ok("el proveedor aumentó 8%: alfajor a $1.420");

  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 360));
  assert.deepEqual(errores, [], errores.join(" | "));
  ok("sin errores de JavaScript ni scroll horizontal");
  await b.close();
  console.log("\nTODO OK");
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
