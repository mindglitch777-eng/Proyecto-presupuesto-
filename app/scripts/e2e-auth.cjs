// Prueba de las pantallas de entrada a 360 px (sin Supabase real: revisa textos, validaciones, redirecciones y que no haya scroll horizontal).
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const BASE = process.env.BASE || "http://127.0.0.1:3100";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, locale: "es-AR" });
  const page = await ctx.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(String(e)));
  const ok = (t) => console.log("✓", t);
  const sinScroll = async (n) => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 360), "scroll horizontal en " + n);

  for (const [ruta, h1] of [["/entrar", "Entrar a tu negocio"], ["/registrarme", "Empezá tus 14 días gratis"], ["/recuperar", "¿Te olvidaste la contraseña?"], ["/offline", "Sin conexión"]]) {
    await page.goto(BASE + ruta, { waitUntil: "networkidle" });
    await page.getByRole("heading", { level: 1, name: h1 }).waitFor();
    await sinScroll(ruta);
    await page.screenshot({ path: `capturas/auth${ruta.replace("/", "-")}.png` });
    ok(`${ruta} se ve a 360 px`);
  }

  // /app y /suscribirme sin sesión mandan a entrar
  for (const ruta of ["/app", "/app/cierre", "/suscribirme"]) {
    await page.goto(BASE + ruta, { waitUntil: "networkidle" });
    assert.match(page.url(), /\/entrar\?siguiente=/);
  }
  ok("sin sesión, /app y /suscribirme mandan a /entrar");
  await page.goto(BASE + "/app", { waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).searchParams.get("siguiente"), "/app");
  ok("guarda a dónde quería ir");

  // validaciones de entrar
  await page.goto(BASE + "/entrar", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.locator("form [role=alert]").waitFor();
  assert.match(await page.locator("form [role=alert]").innerText(), /Escribí tu mail completo/);
  await page.getByLabel("Tu mail").fill("ana@gmail.com");
  await page.getByLabel("Tu contraseña").fill("123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForFunction(() => /8 caracteres/.test(document.querySelector("form [role=alert]")?.textContent ?? ""));
  ok("entrar valida mail y contraseña en voseo");
  // con datos válidos pero sin servidor real: mensaje amable, nunca texto técnico
  await page.getByLabel("Tu contraseña").fill("unaclave123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForFunction(() => /(No se pudo|no son correctos|conexión)/.test(document.querySelector("form [role=alert]")?.textContent ?? ""), null, { timeout: 15000 });
  const msg = await page.locator("form [role=alert]").innerText();
  assert.ok(!/fetch|TypeError|supabase|undefined/i.test(msg), "mensaje técnico: " + msg);
  ok("error de conexión → «" + msg + "»");
  await page.screenshot({ path: "capturas/auth-entrar-error.png" });

  // registrarme: validaciones
  await page.goto(BASE + "/registrarme", { waitUntil: "networkidle" });
  await page.getByLabel("Tu mail").fill("ana@gmail.com");
  await page.getByLabel(/Elegí una contraseña/).fill("corta");
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await page.waitForFunction(() => /8 caracteres/.test(document.querySelector("form [role=alert]")?.textContent ?? ""));
  ok("registrarme pide 8 caracteres");

  // service worker y manifest
  const man = await (await page.request.get(BASE + "/manifest.webmanifest")).json();
  assert.equal(man.display, "standalone");
  assert.equal(man.start_url, "/app");
  assert.ok(man.icons.some((i) => i.purpose === "maskable"));
  for (const i of man.icons) assert.equal((await page.request.get(BASE + i.src)).status(), 200);
  assert.equal((await page.request.get(BASE + "/sw.js")).status(), 200);
  ok("manifest instalable, íconos y service worker");

  // la landing no se rompe
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Quiero ser socio fundador" }).waitFor();
  ok("la landing sigue funcionando");
  assert.deepEqual(errores, [], errores.join(" | "));
  ok("sin errores de JavaScript");
  await b.close();
  console.log("\nTODO OK");
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
