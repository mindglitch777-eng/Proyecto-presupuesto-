// Graba la pantalla real de En Claro para los videos V8-02, V8-03 y V8-04 (360 px, datos de ejemplo en memoria).
// Servidor: ENCLARO_MODO_PRUEBA=1 ENCLARO_DEMO=v8-0N npx next start -p 3100
// Uso: node scripts/grabar-v8.cjs v8-02 <carpeta-de-salida>  → cuadros/ (1080 px de ancho), cuadros.txt (para ffmpeg) y tiempos.json
// Mismo método que grabar-v8-01.cjs: screencast de Chrome a resolución real (la grabación de Playwright sale a 360 px y borrosa).
// Los tiempos de tiempos.json son segundos del video que sale (con los cortes ya aplicados).
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const BASE = process.env.BASE || "http://127.0.0.1:3100";
const DEMO = process.argv[2];
const SAL = path.resolve(process.argv[3] || `grabacion-${DEMO}`);
const texto = (page) => page.locator("main").innerText();
const exigir = (cond, msg) => { if (!cond) throw new Error(msg); };

// Cada recorrido recibe la página y `marca(nombre)`; `corte(desde, hasta)` saca un tramo de espera (ej.: mientras se lee la foto).
const RECORRIDOS = {
  async "v8-02"(page, marca) {
    await page.goto(BASE + "/app/fiados", { waitUntil: "networkidle" });
    marca("lista");
    exigir(/Te deben en total\s*\$380\.000/.test(await texto(page)), "El total de fiados no da $380.000");
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /Marta/ }).click();
    await page.getByText("Mensaje listo").waitFor();
    marca("mensaje");
    await page.waitForTimeout(2600);
    await page.getByRole("button", { name: "Me pagó" }).click();
    const monto = page.getByLabel("¿Cuánto te pagó?");
    await monto.pressSequentially("62000", { delay: 70 });
    await page.waitForTimeout(250);
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForFunction(() => /\$318\.000/.test(document.querySelector("main")?.textContent ?? ""));
    marca("pago");
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await page.waitForTimeout(2200);
    marca("fin");
  },
  async "v8-03"(page, marca) {
    await page.goto(BASE + "/app", { waitUntil: "networkidle" });
    marca("dia");
    const t = await texto(page);
    exigir(/Ganancia de hoy\s*\$30\.100/.test(t), "La ganancia de hoy no da $30.100:\n" + t.slice(0, 300));
    exigir(/\$95\.000 dormidos/.test(t), "La plata dormida no da $95.000");
    await page.waitForTimeout(2200);
    const tarjeta = page.getByRole("link", { name: /\$95\.000 dormidos/ });
    for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 110); await page.waitForTimeout(70); }
    await tarjeta.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    marca("tarjeta");
    await page.waitForTimeout(700);
    await tarjeta.click();
    await page.getByText("Plata inmovilizada en el depósito").waitFor();
    marca("deposito");
    exigir(/\$95\.000/.test(await texto(page)), "El depósito no muestra $95.000");
    await page.waitForTimeout(1800);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(1500);
    marca("fin");
  },
  async "v8-04"(page, marca, corte) {
    await page.goto(BASE + "/app/factura", { waitUntil: "networkidle" });
    marca("factura");
    await page.waitForTimeout(1000);
    await page.getByLabel("Foto de la factura").setInputFiles(path.join(__dirname, "../tests/facturas/factura-v8-04.jpg"));
    marca("foto");
    await page.waitForTimeout(900);
    const a = marca("leyendo");
    await page.getByText("Esto es lo que encontré").waitFor({ timeout: 120000 });
    const b = marca("leido");
    corte(a, b - 0.25); // la lectura tarda varios segundos: en el video se ve el principio y el final
    const t = await texto(page);
    for (const r of ["Aumentó $750 (21%)", "Aumentó $450 (45%)"]) exigir(t.includes(r), `Falta "${r}" en la factura leída:\n` + t.slice(0, 600));
    await page.waitForTimeout(1300);
    const yerba = page.locator("main ul > li", { hasText: "Aumentó $750" });
    for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 90); await page.waitForTimeout(60); }
    await yerba.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy({ top: 120, behavior: "smooth" }));
    await page.waitForTimeout(600);
    marca("yerba");
    await page.waitForTimeout(2600);
    marca("fin");
  },
};

(async () => {
  exigir(RECORRIDOS[DEMO], `Demo desconocida: ${DEMO} (v8-02, v8-03 o v8-04)`);
  fs.rmSync(SAL, { recursive: true, force: true });
  fs.mkdirSync(path.join(SAL, "cuadros"), { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, locale: "es-AR" });
  await ctx.addCookies([{ name: "enclaro_prueba", value: "1", url: BASE }]);
  const page = await ctx.newPage();
  const cuadros = [];
  const cdp = await ctx.newCDPSession(page);
  cdp.on("Page.screencastFrame", async (f) => {
    const n = cuadros.length;
    fs.writeFileSync(path.join(SAL, "cuadros", `c${String(n).padStart(4, "0")}.jpg`), Buffer.from(f.data, "base64"));
    cuadros.push(f.metadata.timestamp);
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await page.request.post(BASE + "/prueba/reiniciar");
  // pantalla en blanco del mismo color mientras carga la primera página
  await page.goto(BASE + "/app/ajustes", { waitUntil: "networkidle" });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 2340, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  const marcas = {}, cortes = [];
  const marca = (n) => (marcas[n] = Date.now() / 1000 - t0);
  await RECORRIDOS[DEMO](page, marca, (a, c) => cortes.push([a, c]));
  await cdp.send("Page.stopScreencast");
  await ctx.close();
  await b.close();

  // El video empieza en la primera marca (la pantalla ya cargada). Se sacan los cortes.
  const inicio = Object.values(marcas)[0];
  const fin = marcas.fin;
  const quitado = (s) => cortes.reduce((q, [a, c]) => q + Math.max(0, Math.min(s, c) - a), 0);
  const aVideo = (s) => s - inicio - quitado(s);
  const rel = cuadros.map((ts) => ts - t0);
  // cuadro visible en cada instante: el último que llegó antes (Chrome solo manda cuadros cuando cambia algo)
  const lineas = [];
  let primero = rel.findLastIndex((s) => s <= inicio);
  if (primero < 0) primero = 0;
  const usar = [primero, ...rel.map((s, i) => i).filter((i) => rel[i] > inicio && rel[i] < fin && !cortes.some(([a, c]) => rel[i] > a && rel[i] < c))];
  usar.forEach((i, k) => {
    const desde = Math.max(aVideo(Math.max(rel[i], inicio)), 0);
    const hasta = k + 1 < usar.length ? aVideo(rel[usar[k + 1]]) : aVideo(fin);
    lineas.push(`file 'cuadros/c${String(i).padStart(4, "0")}.jpg'\nduration ${Math.max(0.001, hasta - desde).toFixed(3)}`);
  });
  lineas.push(lineas[lineas.length - 1].split("\n")[0]);
  fs.writeFileSync(path.join(SAL, "cuadros.txt"), lineas.join("\n") + "\n");
  const enVideo = Object.fromEntries(Object.entries(marcas).map(([k, v]) => [k, +aVideo(v).toFixed(3)]));
  fs.writeFileSync(path.join(SAL, "tiempos.json"), JSON.stringify({ demo: DEMO, marcas: enVideo, cortes }, null, 1));
  console.log(JSON.stringify(enVideo, null, 1), `\nOK: ${DEMO} grabado (${usar.length} cuadros)`);
})().catch((e) => { console.error(e); process.exit(1); });
