// Prueba de punta a punta a 360 px (celular chico). Necesita la app en :3100 y el mock de Supabase en :54321.
// Uso: node scripts/e2e.cjs     (usa el Playwright instalado en la máquina)
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const BASE = process.env.BASE || "http://127.0.0.1:3100";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, locale: "es-AR" });
  const page = await ctx.newPage();
  const errores = [];
  page.on("console", (m) => m.type() === "error" && !/status of 400/.test(m.text()) && errores.push(m.text())); // los 400 son las pruebas de datos inválidos
  page.on("pageerror", (e) => errores.push(String(e)));
  const paso = (t) => console.log("✓", t);

  await page.goto(`${BASE}/?utm_source=tiktok&utm_content=v5-01`, { waitUntil: "networkidle" });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 360), "no debe haber scroll horizontal a 360 px");
  paso("sin scroll horizontal a 360 px");

  // La calculadora arranca con los valores de ejemplo del prototipo
  let verde = await page.locator("#calculadora").innerText();
  assert.match(verde, /\$36\.333/);
  assert.match(verde, /\$121\.111/);
  paso("ejemplo: cubrir $36.333 por día, vender $121.111");

  // Cambiar el alquiler: los puntos de mil se escriben solos y el número rueda
  const alquiler = page.getByLabel("Alquiler del mes");
  await alquiler.fill("300000");
  assert.equal(await alquiler.inputValue(), "300.000");
  await page.waitForTimeout(900);
  verde = await page.locator("#calculadora").innerText();
  assert.match(verde, /\$31\.333/);
  assert.match(verde, /\$104\.444/);
  paso("alquiler 300.000 → $31.333 y $104.444");

  // Deslizador de margen al 20%
  await page.locator('input[type="range"]').fill("20");
  await page.waitForTimeout(900);
  verde = await page.locator("#calculadora").innerText();
  assert.match(verde, /\$156\.667/);
  assert.match(verde, /20%/);
  paso("margen 20% → vender $156.667");

  await page.screenshot({ path: "capturas/01-arriba.png" });
  await page.locator("#calculadora").scrollIntoViewIfNeeded();
  await page.locator("#calculadora").screenshot({ path: "capturas/02-calculadora.png" });

  // Pedir la app por WhatsApp: el mensaje sale armado con nombre, rubro, número del día y video de origen
  const boton = page.getByRole("link", { name: /Pedí la app por WhatsApp/ });
  const texto = async () => decodeURIComponent((await boton.getAttribute("href")).split("?text=")[1]);
  assert.match(await boton.getAttribute("href"), /^https:\/\/wa\.me\/\d+\?text=/);
  assert.match(await texto(), /^Hola, estoy interesado en En Claro\. Tengo un kiosco\. Mi número del día me dio \$156\.667\. Quiero la aplicación\. \(Vi el video v5-01\)$/);
  paso("sin nombre: «Tengo un kiosco… me dio $156.667»");
  await page.getByLabel(/Tu nombre/).fill("Marta Gómez");
  await page.getByRole("radio", { name: "Almacén" }).click();
  assert.match(await texto(), /Me llamo Marta Gómez y tengo un almacén\. Mi número del día me dio \$156\.667/);
  paso("con nombre y rubro: «Me llamo Marta Gómez y tengo un almacén»");
  await page.goto(`${BASE}/?utm_source=tiktok&utm_content=v6-02`, { waitUntil: "networkidle" });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => decodeURIComponent(document.querySelector("a[href^='https://wa.me']")?.getAttribute("href") ?? "").includes("(Vi el video v6-02)"));
  paso("el video de origen queda guardado aunque vuelva a entrar sin el link");
  assert.equal(await page.getByRole("button", { name: "Quiero ser socio fundador" }).count(), 0);

  // Preguntas frecuentes se abren
  await page.locator("summary", { hasText: "¿Necesito computadora?" }).click();
  await page.getByText("Todo se hace desde el celular").waitFor();
  paso("preguntas frecuentes se abren");

  // Baja (para quien se anotó en la lista de espera antes del cambio al botón de WhatsApp)
  const alta = await page.request.post(`${BASE}/api/lista-espera`, { data: { nombre: "Marta Gómez", whatsapp: "3756 15 123456", rubro: "kiosco", ciudad: "", numero_del_dia: 1, web: "" } });
  assert.equal(alta.status(), 200);
  await page.goto(`${BASE}/baja`, { waitUntil: "networkidle" });
  await page.getByLabel("Tu WhatsApp").fill("3756 15 123456");
  await page.getByRole("button", { name: "Borrar mis datos" }).click();
  await page.getByText(/Tu número de trámite es/).waitFor();
  paso("baja → número de trámite");
  await page.getByText(/Tu número de trámite es/).screenshot({ path: "capturas/04-baja.png" });
  await page.goto(`${BASE}/baja`, { waitUntil: "networkidle" });
  await page.getByLabel("Tu WhatsApp").fill("3756 15 123456");
  await page.getByRole("button", { name: "Borrar mis datos" }).click();
  await page.getByText("No encontramos ese número.").waitFor();
  paso("baja repetida → «No encontramos ese número»");

  // Páginas legales con el aviso de borrador
  for (const ruta of ["/terminos", "/privacidad"]) {
    await page.goto(`${BASE}${ruta}`, { waitUntil: "networkidle" });
    await page.getByRole("note").getByText("Borrador.").waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 360));
  }
  paso("términos y privacidad con aviso de borrador");

  // Pie de página con WhatsApp visible como texto
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  assert.match(await page.locator("footer").innerText(), /\+54 9 3756 123456/);
  paso("pie: WhatsApp visible como texto");

  // Pantalla completa para revisar el diseño
  await page.screenshot({ path: "capturas/00-completa.png", fullPage: true });

  assert.deepEqual(errores, [], "no debe haber errores en la consola: " + errores.join(" | "));
  paso("sin errores en la consola");
  await browser.close();
  console.log("\nTODO OK");
})().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
