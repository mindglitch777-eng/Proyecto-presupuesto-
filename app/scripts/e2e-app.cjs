// Fase 3 a 360 px con datos de ejemplo en memoria (servidor con ENCLARO_MODO_PRUEBA=1). Cronometra cada carga (< 30 s).
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const BASE = process.env.BASE || "http://127.0.0.1:3100";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, locale: "es-AR" });
  await ctx.addCookies([{ name: "enclaro_prueba", value: "1", url: BASE }]);
  // sin reconocimiento de voz en el robot: se usa "escribilo como lo dirías"
  await ctx.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; });
  const page = await ctx.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(String(e)));
  const ok = (t) => console.log("✓", t);
  const sinScroll = async (n) => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 360), "scroll horizontal en " + n);
  const crono = async (nombre, fn) => { const t0 = Date.now(); await fn(); const s = (Date.now() - t0) / 1000; assert.ok(s < 30, `${nombre} tardó ${s} s`); ok(`${nombre} (${s.toFixed(1)} s)`); };
  const reinicio = await page.request.post(BASE + "/prueba/reiniciar"); assert.equal(reinicio.status(), 200);

  // Tu día sin cierre: número del día y botón grande
  await page.goto(BASE + "/app", { waitUntil: "networkidle" });
  await page.getByText("Tu número del día").first().waitFor();
  await page.getByRole("link", { name: /Hacé tu cierre de hoy/ }).waitFor();
  await page.getByText("Hoy cobra Doña Marta").waitFor();
  await page.getByText(/precios para revisar/).waitFor();
  await page.getByText(/dormidos/).waitFor();
  await sinScroll("/app");
  await page.screenshot({ path: "capturas/app-dia-antes.png", fullPage: true });
  ok("Tu día: número del día, hacé tu cierre, hoy cobra Marta, precios viejos y plata dormida");

  // Cierre dicho (escrito como lo diría)
  await crono("cierre por voz (escrito)", async () => {
    await page.getByRole("link", { name: /Hacé tu cierre de hoy/ }).click();
    await page.getByRole("button", { name: "Hablar" }).click();
    await page.getByLabel("Escribilo como lo dirías").fill("Vendí 186.000, ochenta mil fueron por QR, pagué 92 mil de mercadería y 8 mil de flete, se movió la gaseosa y el alfajor");
    await page.getByRole("button", { name: "Entender" }).click();
    await page.getByText("Esto es lo que entendí").waitFor();
    assert.equal(await page.locator("#ventas").inputValue(), "186.000");
    assert.equal(await page.locator("#tarjeta").inputValue(), "80.000");
    assert.equal(await page.locator("#gasto-proveedor").inputValue(), "92.000");
    assert.equal(await page.locator("#gasto-flete").inputValue(), "8.000");
    assert.equal(await page.getByRole("button", { name: "✓ Gaseosa 500" }).getAttribute("aria-pressed"), "true");
    await page.getByText("Te cobran 6%: $4.800 de comisión.").waitFor();
    await sinScroll("/app/cierre");
    await page.screenshot({ path: "capturas/app-cierre-confirmar.png", fullPage: true });
    await page.getByRole("button", { name: "Guardar cierre" }).click();
    await page.getByText("Ganancia de hoy").waitFor();
  });
  // a la caja: 186.000 − 92.000 − 8.000 − 4.800 = 81.200; la ganancia descuenta el costo con el margen, no el pago al proveedor
  assert.match(await page.locator("main").innerText(), /Entró a la caja: \$81\.200/);
  await page.screenshot({ path: "capturas/app-cierre-listo.png" });
  ok("resultado: ganancia del día y $81.200 que entraron a la caja");

  await page.getByRole("link", { name: "Ver tu día" }).click();
  await page.getByText("Ganancia de hoy").waitFor();
  assert.match(await page.locator("main").innerText(), /Entró a la caja: \$81\.200/);
  await page.screenshot({ path: "capturas/app-dia-despues.png", fullPage: true });
  ok("Tu día muestra el cierre guardado y la barra del número del día");

  // Cierre a mano
  await crono("cierre a mano", async () => {
    await page.goto(BASE + "/app/cierre", { waitUntil: "networkidle" });
    await page.locator("#ventas").fill("200000");
    await page.locator("#gasto-vuelto").fill("3000");
    await page.getByRole("button", { name: "Guardar cierre" }).click();
    await page.getByText("Ganancia de hoy").waitFor();
  });

  // Fiados: recordar, me pagó, cliente nuevo y me fió
  await page.goto(BASE + "/app/fiados", { waitUntil: "networkidle" });
  await page.getByText("Te deben en total").waitFor();
  assert.match(await page.locator("main").innerText(), /\$39\.700/); // 18.000 + 5.500 + 4.200 + 12.000
  await page.getByText("No le fíes más hasta que pague.").first().waitFor();
  await sinScroll("/app/fiados");
  await page.screenshot({ path: "capturas/app-fiados.png", fullPage: true });
  await page.getByRole("button", { name: /Doña Marta/ }).click();
  const wa = await page.getByRole("link", { name: "Recordale por WhatsApp" }).getAttribute("href");
  assert.match(wa, /^https:\/\/wa\.me\/5493756123456\?text=Hola%20Do%C3%B1a%20Marta%2C%20te%20recuerdo%20el%20saldo%20pendiente%20de%20%2418\.000/);
  ok("recordatorio por WhatsApp con el mensaje y el número de Marta");
  await crono("cobrar un fiado", async () => {
    await page.getByRole("button", { name: "Me pagó" }).click();
    await page.getByLabel("¿Cuánto te pagó?").fill("8000");
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForFunction(() => /\$31\.700/.test(document.querySelector("main")?.textContent ?? ""));
  });
  await crono("anotar un fiado a un cliente nuevo", async () => {
    await page.getByRole("button", { name: "Agregar cliente" }).click();
    await page.getByLabel("Nombre").fill("Pedro");
    await page.getByRole("button", { name: "Guardar cliente" }).click();
    await page.getByRole("button", { name: /Pedro/ }).click();
    await page.getByRole("button", { name: "Me fió" }).click();
    await page.getByLabel("¿Cuánto se llevó?").fill("2500");
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForFunction(() => /\$34\.200/.test(document.querySelector("main")?.textContent ?? ""));
  });
  await page.getByRole("tab", { name: "Cobran hoy" }).click();
  await page.getByText("Doña Marta").waitFor();
  ok("fiados: total, semáforo, cobrar, cliente nuevo y filtro 'cobran hoy'");

  // Precios: costo nuevo → precio sugerido
  await page.goto(BASE + "/app/precios", { waitUntil: "networkidle" });
  await page.getByText("Lo que te deja cada producto").waitFor();
  await page.getByText("precio sin revisar").first().waitFor();
  await sinScroll("/app/precios");
  await page.screenshot({ path: "capturas/app-precios.png", fullPage: true });
  await crono("actualizar un costo y aplicar el precio sugerido", async () => {
    await page.getByRole("button", { name: /^Gaseosa 500/ }).click();
    await page.locator("#costo").fill("1620");
    await page.getByText(/Para seguir ganando 31%/).waitFor(); // la gaseosa dejaba 30,6%
    await page.getByRole("button", { name: "Usar ese precio" }).click();
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.getByText("Listo, guardado.").waitFor();
  });
  // 1.620 ÷ (1 − 0,31 − 0,06) = 2.571,4 → $2.580
  assert.match(await page.locator("main").innerText(), /\$2\.580/);
  ok("precio sugerido con comisión: $2.580");

  // Depósito: liquidar
  await page.goto(BASE + "/app/deposito", { waitUntil: "networkidle" });
  await page.getByText("Plata inmovilizada en el depósito").waitFor();
  assert.match(await page.locator("main").innerText(), /Turrones surtidos/);
  await sinScroll("/app/deposito");
  await page.screenshot({ path: "capturas/app-deposito.png", fullPage: true });
  await crono("liquidar un producto dormido", async () => {
    await page.locator("li", { hasText: "Turrones surtidos" }).getByRole("button", { name: "Liquidar" }).click();
    await page.getByText(/Vendelo a \$1\.030/).waitFor(); // 980 + 5% = 1.029 → 1.030
    await page.locator("li", { hasText: "Turrones surtidos" }).getByRole("button", { name: "Liquidar" }).click();
    await page.getByText(/ahora sale \$1\.030/).waitFor();
  });
  ok("depósito: plata dormida y liquidar a costo + 5%");

  // Ajustes
  await page.goto(BASE + "/app/ajustes", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Ajustes" }).waitFor();
  await sinScroll("/app/ajustes");
  await page.getByLabel("Comisión por cobrar con tarjeta o QR").fill("4,5");
  await page.getByRole("button", { name: "Guardar ajustes" }).click();
  await page.getByText("Listo, guardado.").waitFor();
  ok("ajustes: comisión 4,5% guardada");

  assert.deepEqual(errores, [], errores.join(" | "));
  ok("sin errores de JavaScript");
  await b.close();
  console.log("\nTODO OK");
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
