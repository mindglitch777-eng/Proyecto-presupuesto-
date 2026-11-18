// Graba la pantalla real de En Claro haciendo el cierre del video V8-01 (360 px, datos de ejemplo en memoria).
// Servidor: ENCLARO_MODO_PRUEBA=1 ENCLARO_DEMO=v8-01 npx next start -p 3100
// Uso: node scripts/grabar-v8-01.cjs <carpeta-de-salida>   → deja cuadros/ (pantallas a 1080 px de ancho), cuadros.txt (para ffmpeg) y tiempos.json
// Se graba con el screencast de Chrome a resolución real (×3): la grabación de video de Playwright sale a 360 px y se ve borrosa.
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const BASE = process.env.BASE || "http://127.0.0.1:3100";
const SAL = path.resolve(process.argv[2] || "grabacion");
const FRASE = "Vendí 150 mil, 75 mil con QR, y 8 mil de fiado que no vuelve";

(async () => {
  fs.mkdirSync(SAL, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, locale: "es-AR" });
  await ctx.addCookies([{ name: "enclaro_prueba", value: "1", url: BASE }]);
  // el robot no tiene micrófono: se usa "escribilo como lo dirías" (la misma frase que se diría)
  await ctx.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; });
  const page = await ctx.newPage();
  fs.mkdirSync(path.join(SAL, "cuadros"), { recursive: true });
  const cuadros = [];
  const cdp = await ctx.newCDPSession(page);
  cdp.on("Page.screencastFrame", async (f) => {
    const n = cuadros.length;
    fs.writeFileSync(path.join(SAL, "cuadros", `c${String(n).padStart(4, "0")}.jpg`), Buffer.from(f.data, "base64"));
    cuadros.push(f.metadata.timestamp);
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  const t0 = Date.now();
  const marcas = {};
  const marca = (n) => { marcas[n] = (Date.now() - t0) / 1000; };
  await page.request.post(BASE + "/prueba/reiniciar");
  await page.goto(BASE + "/app/cierre", { waitUntil: "networkidle" });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 2340, everyNthFrame: 1 });
  const tInicio = Date.now() / 1000;
  marca("cierre");
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "Hablar" }).click();
  marca("hablar");
  const caja = page.getByLabel("Escribilo como lo dirías");
  await caja.click();
  await caja.pressSequentially(FRASE, { delay: 38 });
  marca("escrito");
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Entender" }).click();
  await page.getByText("Esto es lo que entendí").waitFor();
  marca("entendio");
  const campos = { ventas: await page.locator("#ventas").inputValue(), tarjeta: await page.locator("#tarjeta").inputValue(), otros: await page.locator("#gasto-otros").inputValue().catch(() => "?") };
  await page.waitForTimeout(900);
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Guardar cierre" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Guardar cierre" }).click();
  await page.getByText("Ganancia de hoy").waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  marca("resultado");
  const texto = await page.locator("main").innerText();
  await page.waitForTimeout(2600);
  marca("fin");
  await cdp.send("Page.stopScreencast");
  await ctx.close();
  await b.close();
  // lista para ffmpeg: cada cuadro dura hasta que llega el siguiente (Chrome solo manda cuadros cuando cambia algo)
  const fin = tInicio + (marcas.fin - marcas.cierre);
  const lineas = cuadros.map((ts, i) => `file 'cuadros/c${String(i).padStart(4, "0")}.jpg'\nduration ${Math.max(0.001, (cuadros[i + 1] ?? fin) - ts).toFixed(3)}`);
  lineas.push(`file 'cuadros/c${String(cuadros.length - 1).padStart(4, "0")}.jpg'`);
  fs.writeFileSync(path.join(SAL, "cuadros.txt"), lineas.join("\n") + "\n");
  fs.writeFileSync(path.join(SAL, "tiempos.json"), JSON.stringify({ marcas, campos, resultado: texto.slice(0, 400) }, null, 1));
  console.log(JSON.stringify({ marcas, campos }, null, 1));
  if (!/Ganancia de hoy\s*\$23\.500/.test(texto)) { console.error("El cierre no dio $23.500:\n" + texto.slice(0, 400)); process.exit(1); }
  console.log("OK: el cierre dio $23.500");
})().catch((e) => { console.error(e); process.exit(1); });
