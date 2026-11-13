// Primer uso a 360 px: de la calculadora al "wow". Necesita la app con ENCLARO_MODO_PRUEBA=1 en :3100.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const BASE = process.env.BASE || "http://127.0.0.1:3100";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, locale: "es-AR", acceptDownloads: true });
  const page = await ctx.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(String(e)));
  const ok = (t) => console.log("✓", t);
  const sinScroll = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 360), "scroll horizontal");
  const inicio = Date.now();
  let toques = 0;
  const toca = async (loc) => { toques++; await loc.click(); };

  // La persona usó la calculadora de la landing con sus números
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByLabel("Alquiler del mes").fill("300000");
  await page.waitForTimeout(300);

  await page.goto(BASE + "/prueba/bienvenida", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Contanos de tu negocio" }).waitFor();
  await sinScroll();
  await page.screenshot({ path: "capturas/bienvenida-1.png" });
  // sin rubro no avanza
  await page.getByLabel("¿Cómo se llama?").fill("Kiosco Don Pedro");
  await toca(page.getByRole("button", { name: "Seguir" }));
  await page.getByRole("alert").filter({ hasText: "Elegí si es kiosco" }).waitFor();
  await toca(page.getByRole("radio", { name: "Kiosco" }));
  await page.getByLabel(/¿En qué ciudad\?/).fill("Santo Tomé");
  await toca(page.getByRole("button", { name: "Seguir" }));
  ok("paso 1: nombre, rubro (obligatorio) y ciudad");

  await page.getByRole("heading", { name: "Tus gastos fijos del mes" }).waitFor();
  assert.equal(await page.getByLabel("Alquiler").inputValue(), "300.000");
  await page.getByText("Trajimos los números que pusiste en la calculadora").waitFor();
  ok("paso 2: trae los números de la calculadora (alquiler 300.000)");
  await page.getByLabel("Otros").fill("100000");
  assert.equal(await page.getByLabel("Otros").inputValue(), "100.000");
  await page.getByLabel(/tarjeta o QR/).fill("6");
  await sinScroll();
  await page.screenshot({ path: "capturas/bienvenida-2.png" });
  await toca(page.getByRole("button", { name: "Seguir" }));

  await page.getByRole("heading", { name: "Cargá 5 productos" }).waitFor();
  await page.getByText("Todavía no elegiste ninguno").waitFor();
  const productos = [["Gaseosa 500", "2160", "1500"], ["Alfajor", "1200", "800"], ["Caramelos sueltos", "100", "60"], ["Cigarrillos", "4500", "3900"], ["Agua 500", "1000", "600"]];
  for (const [n] of productos) await toca(page.getByRole("button", { name: `+ ${n}` }));
  const tarjetas = page.locator("main ul > li");
  assert.equal(await tarjetas.count(), 5);
  for (let i = 0; i < productos.length; i++) {
    await tarjetas.nth(i).getByLabel("Lo vendés a").fill(productos[i][1]);
    await tarjetas.nth(i).getByLabel("Te cuesta").fill(productos[i][2]);
  }
  await tarjetas.nth(0).getByText("Te deja $660 por unidad").waitFor();
  // un costo más alto que el precio se avisa
  await tarjetas.nth(4).getByLabel("Te cuesta").fill("1500");
  await tarjetas.nth(4).getByText("Te cuesta más de lo que lo vendés").waitFor();
  await toca(page.getByRole("button", { name: "Ver mis números" }));
  await page.getByRole("alert").filter({ hasText: "Agua 500: te cuesta más" }).waitFor();
  await tarjetas.nth(4).getByLabel("Te cuesta").fill("600");
  await sinScroll();
  await page.screenshot({ path: "capturas/bienvenida-3.png", fullPage: true });
  ok("paso 3: chips del rubro, ganancia por unidad y aviso si el costo supera el precio");
  await toca(page.getByRole("button", { name: "Ver mis números" }));

  await page.getByText("Esto es lo que tu cuaderno no te decía").waitFor();
  const texto = await page.locator("main").innerText();
  // fijos: 300.000 + 140.000 + 500.000 + 100.000 = 1.040.000 → 34.667 por día
  assert.match(texto, /\$34\.667/);
  assert.match(texto, /Tu Gaseosa 500 te deja \$660 por unidad; tu Caramelos sueltos, apenas \$40/);
  await sinScroll();
  await page.screenshot({ path: "capturas/bienvenida-wow.png", fullPage: true });
  ok("wow: cubrir $34.667 por día, número del día y ranking de lo que deja cada producto");

  const [descarga] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Recordámelo/ }).click()]);
  assert.equal(descarga.suggestedFilename(), "recordatorio-en-claro.ics");
  ok("recordatorio diario a las 21 h (.ics)");

  const segundos = Math.round((Date.now() - inicio) / 1000);
  console.log(`  ${toques} toques de botones; el robot tardó ${segundos} s`);
  assert.deepEqual(errores, [], errores.join(" | "));
  ok("sin errores de JavaScript");
  await b.close();
  console.log("\nTODO OK");
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
