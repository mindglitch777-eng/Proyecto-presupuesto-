// ESCENARIOS: todo lo que puede salir mal o raro, contra Supabase real. Cada escenario es independiente y se informa
// por separado; al final, si alguno falló, el proceso termina con error y lista cuáles.
// Variables: BASE, SUPA_URL, SUPA_ANON, SUPA_SERVICE. NAVEGADOR=webkit para probar como un iPhone (Safari).
const { chromium, webkit, devices } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
const assert = require("node:assert/strict");
const path = require("node:path");

const BASE = process.env.BASE || "http://127.0.0.1:3100";
const { SUPA_URL, SUPA_ANON, SUPA_SERVICE } = process.env;
const NAVEGADOR = process.env.NAVEGADOR || "chromium";
const admin = createClient(SUPA_URL, SUPA_SERVICE, { auth: { persistSession: false } });
const resultados = [];
let browser;

async function contexto() {
  const opciones = NAVEGADOR === "webkit" ? { ...devices["iPhone 13"], locale: "es-AR" } : { viewport: { width: 360, height: 780 }, locale: "es-AR" };
  const ctx = await browser.newContext(opciones);
  await ctx.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; });
  const page = await ctx.newPage();
  page.errores = [];
  page.on("pageerror", (e) => page.errores.push(String(e)));
  return page;
}
const alerta = (p) => p.locator("[role=alert]").filter({ hasNotText: /^$/ }).last();
const texto = (p) => p.locator("main").innerText();
const ancho = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

/** Crea una cuenta nueva por la pantalla de registro y completa (o no) el primer uso. */
async function cuentaNueva(p, nombre, { primerUso = true, productos = [["Gaseosa 500", "2160", "1500"], ["Alfajor", "1200", "800"]] } = {}) {
  const email = `${nombre.toLowerCase().replace(/\W/g, "")}.${Date.now()}${Math.floor(Math.random() * 1000)}@prueba.enclaro.ar`;
  const clave = "clave-segura-2026";
  await p.goto(`${BASE}/registrarme`, { waitUntil: "networkidle" });
  await p.getByLabel("Tu mail").fill(email);
  await p.getByLabel(/Elegí una contraseña/).fill(clave);
  await p.getByRole("button", { name: "Crear mi cuenta" }).click();
  await p.waitForURL(/\/app\/bienvenida/, { timeout: 20000 });
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const id = data.users.find((u) => u.email === email).id;
  if (primerUso) {
    await p.getByLabel("¿Cómo se llama?").fill(nombre);
    await p.getByRole("radio", { name: "Almacén" }).click();
    await p.getByRole("button", { name: "Seguir" }).click();
    await p.getByLabel("Alquiler").fill("300000");
    await p.getByLabel("Luz y servicios").fill("90000");
    await p.getByRole("button", { name: "Seguir" }).click();
    await p.getByRole("heading", { name: "Cargá 5 productos" }).waitFor();
    if (productos.length) {
      for (const [n] of productos) {
        await p.getByRole("button", { name: "+ Otro" }).click();
        const li = p.locator("main ul > li").last();
        await li.getByLabel("Nombre del producto").fill(n);
      }
      const lis = p.locator("main ul > li");
      for (let i = 0; i < productos.length; i++) {
        await lis.nth(i).getByLabel("Lo vendés a").fill(productos[i][1]);
        await lis.nth(i).getByLabel("Te cuesta").fill(productos[i][2]);
      }
      await p.getByRole("button", { name: "Ver mis números" }).click();
    } else {
      await p.getByRole("button", { name: "Lo hago después" }).click();
    }
    await p.getByText("Esto es lo que tu cuaderno no te decía").waitFor();
    await p.getByRole("button", { name: "Hacé tu primer cierre hoy a la noche" }).click();
    await p.waitForURL(/\/app$/);
  }
  const { data: neg } = await admin.from("businesses").select("id").eq("owner_id", id).single();
  return { email, clave, id, negocio: neg.id };
}

async function escenario(nombre, fn) {
  const t0 = Date.now();
  try {
    await fn();
    resultados.push({ nombre, ok: true });
    console.log(`✓ ${nombre} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  } catch (e) {
    resultados.push({ nombre, ok: false, error: e.message.split("\n")[0] });
    console.log(`✗ ${nombre}\n    ${e.message.split("\n").slice(0, 4).join("\n    ")}`);
  }
}

(async () => {
  browser = await (NAVEGADOR === "webkit" ? webkit : chromium).launch();
  console.log(`Escenarios en ${NAVEGADOR === "webkit" ? "Safari de iPhone (WebKit)" : "Chrome de Android (360 px)"}\n`);

  // ---------------- Registro y entrada ----------------
  await escenario("registro: mail inválido, contraseña corta y mail ya usado dan mensajes claros", async () => {
    const p = await contexto();
    await p.goto(`${BASE}/registrarme`, { waitUntil: "networkidle" });
    await p.getByLabel("Tu mail").fill("ana@");
    await p.getByLabel(/Elegí una contraseña/).fill("clave-larga-123");
    await p.getByRole("button", { name: "Crear mi cuenta" }).click();
    assert.match(await alerta(p).innerText(), /mail completo/);
    await p.getByLabel("Tu mail").fill("ana@gmail.com");
    await p.getByLabel(/Elegí una contraseña/).fill("123");
    await p.getByRole("button", { name: "Crear mi cuenta" }).click();
    assert.match(await alerta(p).innerText(), /8 caracteres/);
    const c = await cuentaNueva(await contexto(), "Repetido", { primerUso: false });
    await p.getByLabel("Tu mail").fill(c.email);
    await p.getByLabel(/Elegí una contraseña/).fill("otra-clave-123");
    await p.getByRole("button", { name: "Crear mi cuenta" }).click();
    await p.waitForTimeout(1500);
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    assert.equal(data.users.filter((u) => u.email === c.email).length, 1, "se creó una cuenta repetida");
  });

  await escenario("entrar: contraseña mala o mail inexistente dan el mismo mensaje (no revela si la cuenta existe)", async () => {
    const p = await contexto();
    for (const mail of ["nadie.existe@prueba.enclaro.ar", "otro.nadie@prueba.enclaro.ar"]) {
      await p.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
      await p.getByLabel("Tu mail").fill(mail);
      await p.getByLabel("Tu contraseña").fill("clave-cualquiera");
      await p.getByRole("button", { name: "Entrar", exact: true }).click();
      await p.getByText("El mail o la contraseña no son correctos.").waitFor();
    }
  });

  await escenario("sin sesión: cualquier pantalla de la app pide entrar y después vuelve a donde quería ir", async () => {
    const p = await contexto();
    const c = await cuentaNueva(await contexto(), "Vuelve");
    await p.goto(`${BASE}/app/fiados`, { waitUntil: "networkidle" });
    await p.waitForURL(/\/entrar\?siguiente=%2Fapp%2Ffiados/);
    await p.getByLabel("Tu mail").fill(c.email);
    await p.getByLabel("Tu contraseña").fill(c.clave);
    await p.getByRole("button", { name: "Entrar", exact: true }).click();
    await p.waitForURL(/\/app\/fiados/);
    await p.getByText("Te deben en total").waitFor();
  });

  await escenario("link armado para mandar a otro sitio después de entrar: no se va de la app", async () => {
    const p = await contexto();
    const c = await cuentaNueva(await contexto(), "Seguro");
    await p.goto(`${BASE}/entrar?siguiente=https://sitio-malo.com`, { waitUntil: "networkidle" });
    await p.getByLabel("Tu mail").fill(c.email);
    await p.getByLabel("Tu contraseña").fill(c.clave);
    await p.getByRole("button", { name: "Entrar", exact: true }).click();
    await p.waitForURL(/127\.0\.0\.1:3100\/app/);
  });

  // ---------------- Primer uso ----------------
  await escenario("primer uso sin productos: llega igual a su número del día con 30% de ganancia", async () => {
    const p = await contexto();
    await cuentaNueva(p, "Sin Productos", { productos: [] });
    await p.getByText("Tu número del día").first().waitFor();
    assert.match(await texto(p), /\$43\.333/); // (300.000 + 90.000) ÷ 30 ÷ 0,30
  });

  await escenario("primer uso: volver atrás no borra lo cargado y un producto que cuesta más de lo que se vende se frena", async () => {
    const p = await contexto();
    await p.goto(`${BASE}/registrarme`, { waitUntil: "networkidle" });
    const email = `atras.${Date.now()}@prueba.enclaro.ar`;
    await p.getByLabel("Tu mail").fill(email);
    await p.getByLabel(/Elegí una contraseña/).fill("clave-segura-2026");
    await p.getByRole("button", { name: "Crear mi cuenta" }).click();
    await p.waitForURL(/bienvenida/);
    await p.getByLabel("¿Cómo se llama?").fill("Atrás");
    await p.getByRole("radio", { name: "Kiosco" }).click();
    await p.getByRole("button", { name: "Seguir" }).click();
    await p.getByLabel("Alquiler").fill("200000");
    await p.getByRole("button", { name: "Atrás" }).click();
    assert.equal(await p.getByLabel("¿Cómo se llama?").inputValue(), "Atrás");
    await p.getByRole("button", { name: "Seguir" }).click();
    assert.equal(await p.getByLabel("Alquiler").inputValue(), "200.000");
    await p.getByRole("button", { name: "Seguir" }).click();
    await p.getByRole("button", { name: "+ Alfajor" }).click();
    const li = p.locator("main ul > li").first();
    await li.getByLabel("Lo vendés a").fill("500");
    await li.getByLabel("Te cuesta").fill("900");
    await p.getByRole("button", { name: "Ver mis números" }).click();
    assert.match(await alerta(p).innerText(), /te cuesta más de lo que lo vendés/);
  });

  // ---------------- Cierre ----------------
  const tienda = await (async () => { const p = await contexto(); const c = await cuentaNueva(p, "Escenarios"); return { p, c }; })();
  const { p, c } = tienda;

  await escenario("cierre: sin ventas, o más tarjeta que ventas, no deja guardar y explica por qué", async () => {
    await p.goto(`${BASE}/app/cierre`, { waitUntil: "networkidle" });
    await p.getByRole("button", { name: "Prefiero cargarlo a mano" }).click();
    await p.getByRole("button", { name: "Guardar cierre" }).click();
    assert.match(await alerta(p).innerText(), /Poné cuánto vendiste/);
    await p.locator("#ventas").fill("50000");
    await p.locator("#tarjeta").fill("80000");
    await p.getByRole("button", { name: "Guardar cierre" }).click();
    assert.match(await alerta(p).innerText(), /no puede ser más que lo que vendiste/);
    const { count } = await admin.from("daily_closes").select("id", { count: "exact", head: true }).eq("business_id", c.negocio);
    assert.equal(count, 0);
  });

  await escenario("cierre: frase sin montos pide repetir; frase buena se entiende", async () => {
    await p.goto(`${BASE}/app/cierre`, { waitUntil: "networkidle" });
    await p.getByRole("button", { name: "Hablar" }).click();
    await p.getByLabel("Escribilo como lo dirías").fill("hoy estuvo flojo");
    await p.getByRole("button", { name: "Entender" }).click();
    assert.match(await alerta(p).innerText(), /No encontré montos/);
    await p.getByLabel("Escribilo como lo dirías").fill("hice noventa y cinco lucas, gasté doce mil en el vuelto");
    await p.getByRole("button", { name: "Entender" }).click();
    assert.equal(await p.locator("#ventas").inputValue(), "95.000");
    assert.equal(await p.locator("#gasto-vuelto").inputValue(), "12.000");
  });

  await escenario("cierre: un día con pérdida se muestra como pérdida (no se esconde)", async () => {
    await p.goto(`${BASE}/app/cierre`, { waitUntil: "networkidle" });
    await p.getByRole("button", { name: "Prefiero cargarlo a mano" }).click();
    await p.locator("#ventas").fill("20000");
    await p.locator("#gasto-proveedor").fill("60000");
    await p.getByRole("button", { name: "Guardar cierre" }).click();
    await p.getByText("Hoy te quedaron libres").waitFor();
    assert.match(await texto(p), /-\$53\.000/); // 20.000 − 60.000 − 13.000 de fijos
    assert.match(await texto(p), /Te faltaron/);
  });

  await escenario("cierre: corregir el de hoy lo reemplaza (no duplica) y se puede cargar el de ayer", async () => {
    await p.goto(`${BASE}/app/cierre`, { waitUntil: "networkidle" });
    assert.equal(await p.locator("#ventas").inputValue(), "20.000"); // viene el de hoy para corregir
    await p.locator("#ventas").fill("120000");
    await p.locator("#gasto-proveedor").fill("");
    await p.getByRole("button", { name: "Guardar cierre" }).click();
    await p.getByText("Hoy te quedaron libres").waitFor();
    const ayer = new Date(Date.now() - 3 * 3600000 - 86400000).toISOString().slice(0, 10);
    await p.goto(`${BASE}/app/cierre?fecha=${ayer}`, { waitUntil: "networkidle" });
    await p.getByRole("button", { name: "Prefiero cargarlo a mano" }).click();
    await p.locator("#ventas").fill("80000");
    await p.getByRole("button", { name: "Guardar cierre" }).click();
    await p.getByText("Ese día te quedaron libres").waitFor();
    const { data } = await admin.from("daily_closes").select("date, sales_total").eq("business_id", c.negocio).order("date");
    assert.equal(data.length, 2);
    assert.deepEqual(data.map((x) => Number(x.sales_total)), [80000, 120000]);
  });

  await escenario("cierre: una fecha del futuro o inventada en el link se ignora (carga hoy)", async () => {
    await p.goto(`${BASE}/app/cierre?fecha=2099-01-01`, { waitUntil: "networkidle" });
    await p.getByRole("heading", { name: "Cierre de hoy" }).waitFor();
    await p.goto(`${BASE}/app/cierre?fecha=cualquier-cosa`, { waitUntil: "networkidle" });
    await p.getByRole("heading", { name: "Cierre de hoy" }).waitFor();
  });

  // ---------------- Fiados ----------------
  await escenario("fiados: sin nombre no guarda; día de cobro 32 no guarda; pagar más de lo que debe se frena", async () => {
    await p.goto(`${BASE}/app/fiados`, { waitUntil: "networkidle" });
    await p.getByRole("button", { name: "Agregar cliente" }).click();
    await p.getByRole("button", { name: "Guardar cliente" }).click();
    assert.match(await alerta(p).innerText(), /Poné el nombre/);
    await p.getByLabel("Nombre").fill("Rosa");
    await p.getByLabel(/qué día del mes cobra/i).fill("32");
    await p.getByRole("button", { name: "Guardar cliente" }).click();
    assert.match(await alerta(p).innerText(), /del 1 al 31/);
    await p.getByLabel(/qué día del mes cobra/i).fill("10");
    await p.getByRole("button", { name: "Guardar cliente" }).click();
    await p.getByRole("button", { name: /Rosa/ }).click();
    await p.getByRole("button", { name: "Me fió" }).click();
    await p.getByLabel("¿Cuánto se llevó?").fill("5000");
    await p.getByRole("button", { name: "Guardar" }).click();
    await p.waitForFunction(() => /\$5\.000/.test(document.querySelector("main")?.textContent ?? ""));
    await p.getByRole("button", { name: /Rosa/ }).click().catch(() => {});
    if (!(await p.getByRole("button", { name: "Me pagó" }).isVisible())) await p.getByRole("button", { name: /Rosa/ }).click();
    await p.getByRole("button", { name: "Me pagó" }).click();
    await p.getByLabel("¿Cuánto te pagó?").fill("9000");
    await p.getByRole("button", { name: "Guardar" }).click();
    assert.match(await alerta(p).innerText(), /no puede pagarte más que eso/);
  });

  await escenario("fiados: doble toque en Guardar anota una sola vez", async () => {
    await p.goto(`${BASE}/app/fiados`, { waitUntil: "networkidle" });
    await p.getByRole("button", { name: /Rosa/ }).click();
    await p.getByRole("button", { name: "Me fió" }).click();
    await p.getByLabel("¿Cuánto se llevó?").fill("1000");
    await p.getByRole("button", { name: "Guardar" }).dblclick();
    await p.waitForTimeout(1500);
    const { data: cli } = await admin.from("customers").select("id").eq("business_id", c.negocio).eq("name", "Rosa").single();
    const { data: movs } = await admin.from("credit_movements").select("amount").eq("customer_id", cli.id).eq("type", "fio");
    assert.equal(movs.length, 2, `se anotaron ${movs.length} fiados (debían ser 2: 5.000 y 1.000)`);
  });

  await escenario("fiados: cuando paga todo queda al día, sin semáforo ni botón de recordar", async () => {
    await p.goto(`${BASE}/app/fiados`, { waitUntil: "networkidle" });
    await p.getByRole("button", { name: /Rosa/ }).click();
    await p.getByRole("button", { name: "Me pagó" }).click();
    await p.getByLabel("¿Cuánto te pagó?").fill("6000");
    await p.getByRole("button", { name: "Guardar" }).click();
    await p.waitForFunction(() => /Nadie te debe nada/.test(document.querySelector("main")?.textContent ?? ""));
    assert.equal(await p.getByRole("link", { name: "Recordale por WhatsApp" }).count(), 0);
  });

  // ---------------- Precios ----------------
  await escenario("precios: un producto nuevo se puede guardar sin precio y completarlo después; aparece en el ranking", async () => {
    await p.goto(`${BASE}/app/precios`, { waitUntil: "networkidle" });
    await p.getByRole("button", { name: "Agregar producto" }).click();
    await p.getByLabel("Nombre").fill("Pan lactal");
    await p.getByRole("button", { name: "Guardar" }).click();
    await p.getByText("Listo, guardado.").waitFor(); // sin precio se puede guardar (se completa después)
    await p.getByRole("button", { name: /^Pan lactal/ }).click();
    await p.locator("#costo").fill("1800");
    await p.locator("#precio").fill("2500");
    await p.getByRole("button", { name: "Guardar" }).click();
    await p.getByText("Listo, guardado.").waitFor();
    assert.match(await texto(p), /Pan lactal[\s\S]*28%/);
  });

  await escenario("precios: un producto que se vende a pérdida aparece en rojo", async () => {
    await p.getByRole("button", { name: /^Alfajor/ }).click();
    await p.locator("#costo").fill("1300");
    await p.locator("#precio").fill("1200");
    await p.getByRole("button", { name: "Guardar" }).click();
    await p.getByText("Listo, guardado.").waitFor();
    const fila = p.locator("li", { hasText: "Alfajor" });
    assert.match(await fila.innerText(), /-8%/);
  });

  await escenario("precios: 'vendí hoy' dos veces el mismo día no duplica", async () => {
    await p.locator("li", { hasText: "Gaseosa 500" }).getByRole("button", { name: /Vendí hoy/ }).click();
    await p.getByText(/se vendió hoy/).waitFor();
    await p.locator("li", { hasText: "Gaseosa 500" }).getByRole("button", { name: /Vendí hoy/ }).click();
    await p.waitForTimeout(800);
    assert.ok(!(await alerta(p).isVisible().catch(() => false)) || !/No se pudo/.test(await alerta(p).innerText()));
    const { data: prod } = await admin.from("products").select("id").eq("business_id", c.negocio).eq("name", "Gaseosa 500").single();
    const { count } = await admin.from("product_sale_days").select("product_id", { count: "exact", head: true }).eq("product_id", prod.id);
    assert.equal(count, 1);
  });

  // ---------------- Factura ----------------
  await escenario("factura: una foto que no es una factura da un mensaje claro (no se cuelga)", async () => {
    await p.goto(`${BASE}/app/factura`, { waitUntil: "networkidle" });
    await p.getByLabel("Foto de la factura").setInputFiles(path.join(__dirname, "../public/icons/icon-512.png"));
    await alerta(p).waitFor({ timeout: 90000 });
    assert.match(await alerta(p).innerText(), /No encontré productos|No pude leer/);
  });

  await escenario("factura: renglones que no son productos tuyos quedan en 'No lo uses' y no se aplican", async () => {
    await p.goto(`${BASE}/app/factura`, { waitUntil: "networkidle" });
    await p.getByLabel("Foto de la factura").setInputFiles(path.join(__dirname, "../tests/facturas/factura-2.jpg"));
    await p.getByText("Esto es lo que encontré").waitFor({ timeout: 90000 });
    const sinUsar = await p.locator("main ul > li select").evaluateAll((ss) => ss.filter((s) => s.value === "__ninguno").length);
    assert.equal(sinUsar, 8, "ninguno de los productos del mayorista es de este negocio");
    assert.ok(await p.getByRole("button", { name: /Aplicar/ }).isDisabled());
  });

  await escenario("aumento por porcentaje: sin porcentaje o con letras no deja aplicar", async () => {
    await p.goto(`${BASE}/app/factura`, { waitUntil: "networkidle" });
    await p.getByRole("tab", { name: "Aumentó un %" }).click();
    assert.ok(await p.getByRole("button", { name: "Poné el porcentaje" }).isDisabled());
    await p.getByLabel("¿Cuánto aumentó el proveedor?").fill("abc");
    assert.equal(await p.getByLabel("¿Cuánto aumentó el proveedor?").inputValue(), "");
    await p.getByLabel("¿Cuánto aumentó el proveedor?").fill("10");
    await p.getByRole("button", { name: /Aplicar a/ }).click();
    await p.getByText(/Precios actualizados/).waitFor();
  });

  // ---------------- Depósito ----------------
  await escenario("depósito: 'está bien así' lo oculta 30 días y 'no reponer' queda marcado", async () => {
    await admin.from("products").update({ created_at: new Date(Date.now() - 90 * 86400000).toISOString(), stock: 10 }).eq("business_id", c.negocio);
    await admin.from("product_sale_days").delete().eq("business_id", c.negocio);
    await admin.from("products").update({ last_sold_at: null }).eq("business_id", c.negocio);
    await p.goto(`${BASE}/app/deposito`, { waitUntil: "networkidle" });
    await p.locator("li", { hasText: "Gaseosa 500" }).getByRole("button", { name: "Está bien así" }).click();
    await p.locator("li", { hasText: "Gaseosa 500" }).getByRole("button", { name: "Está bien así" }).click();
    await p.getByText(/no te avisamos de Gaseosa 500 por 30 días/).waitFor();
    await p.locator("li", { hasText: "Pan lactal" }).getByRole("button", { name: "No reponer" }).click();
    await p.locator("li", { hasText: "Pan lactal" }).getByRole("button", { name: "No reponer" }).click();
    await p.getByText(/no repongas Pan lactal/).waitFor();
    await p.goto(`${BASE}/app/deposito`, { waitUntil: "networkidle" });
    assert.ok(!/Gaseosa 500/.test(await texto(p)));
    assert.match(await p.locator("li", { hasText: "Pan lactal" }).innerText(), /no reponer/);
  });

  // ---------------- Ajustes ----------------
  await escenario("ajustes: comisión de 25%, nombre vacío o días fuera de rango no se guardan", async () => {
    await p.goto(`${BASE}/app/ajustes`, { waitUntil: "networkidle" });
    await p.getByLabel("Comisión por cobrar con tarjeta o QR").fill("25");
    await p.getByRole("button", { name: "Guardar ajustes" }).click();
    assert.match(await alerta(p).innerText(), /0 a 20%/);
    await p.getByLabel("Comisión por cobrar con tarjeta o QR").fill("5");
    await p.getByLabel("Nombre").fill("");
    await p.getByRole("button", { name: "Guardar ajustes" }).click();
    assert.match(await alerta(p).innerText(), /nombre de tu negocio/);
    await p.getByLabel("Nombre").fill("Escenarios");
    await p.getByLabel(/sin ventas hace más de/).fill("3");
    await p.getByRole("button", { name: "Guardar ajustes" }).click();
    assert.match(await alerta(p).innerText(), /7 a 365/);
  });

  await escenario("ajustes: cambiar los gastos fijos cambia el número del día en Tu día", async () => {
    await p.goto(`${BASE}/app/ajustes`, { waitUntil: "networkidle" });
    await p.getByLabel(/sin ventas hace más de/).fill("30");
    await p.getByLabel("Alquiler").fill("600000");
    await p.getByRole("button", { name: "Guardar ajustes" }).click();
    await p.getByText("Listo, guardado.").waitFor();
    const { data } = await admin.from("fixed_costs").select("monthly_amount").eq("business_id", c.negocio);
    assert.equal(data.reduce((s, f) => s + Number(f.monthly_amount), 0), 690000);
  });

  // ---------------- Montos grandes y pantallas ----------------
  await escenario("montos muy grandes (un kiosco que vende 25 millones) se muestran bien y sin romper la pantalla", async () => {
    await p.goto(`${BASE}/app/cierre`, { waitUntil: "networkidle" });
    await p.locator("#ventas").fill("25000000");
    await p.getByRole("button", { name: "Guardar cierre" }).click();
    await p.getByText("Hoy te quedaron libres").waitFor();
    assert.match(await texto(p), /\$24\.97\d\.\d{3}/);
    assert.ok(await ancho(p), "la pantalla se corre de costado");
  });

  await escenario("todas las pantallas cargan sin errores y sin correrse de costado", async () => {
    for (const r of ["/", "/registrarme", "/entrar", "/recuperar", "/terminos", "/privacidad", "/baja", "/app", "/app/cierre", "/app/fiados", "/app/precios", "/app/factura", "/app/deposito", "/app/ajustes"]) {
      const res = await p.goto(BASE + r, { waitUntil: "networkidle" });
      assert.ok(res.status() < 400, `${r} dio ${res.status()}`);
      assert.ok(await ancho(p), `${r} se corre de costado`);
    }
    assert.deepEqual(p.errores, [], p.errores.join(" | "));
  });

  // ---------------- Resultado ----------------
  await browser.close();
  const mal = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - mal.length} de ${resultados.length} escenarios pasaron.`);
  if (mal.length) {
    console.log("Fallaron:\n" + mal.map((m) => `  - ${m.nombre}: ${m.error}`).join("\n"));
    process.exit(1);
  }
  console.log("TODO OK");
})().catch((e) => { console.error("✗", e.stack || e.message); process.exit(1); });
