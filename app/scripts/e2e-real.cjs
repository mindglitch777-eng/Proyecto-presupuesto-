// PRUEBA COMPLETA contra un Supabase real (npx supabase start en GitHub Actions) y la app armada (next start).
// Hace lo mismo que haría un dueño desde el celular (360 px) y además intenta romper la seguridad con un segundo usuario.
// Variables: BASE (app), SUPA_URL, SUPA_ANON, SUPA_SERVICE (claves del Supabase local), MAIL_URL (casilla de prueba).
const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
const assert = require("node:assert/strict");
const path = require("node:path");

const BASE = process.env.BASE || "http://127.0.0.1:3100";
const { SUPA_URL, SUPA_ANON, SUPA_SERVICE, MAIL_URL } = process.env;
for (const [k, v] of Object.entries({ SUPA_URL, SUPA_ANON, SUPA_SERVICE, MAIL_URL })) if (!v) throw new Error(`Falta ${k}`);

const admin = createClient(SUPA_URL, SUPA_SERVICE, { auth: { persistSession: false } });
const A = { email: `ana.${Date.now()}@prueba.enclaro.ar`, clave: "kiosco-ana-2026" };
const B = { email: `beto.${Date.now()}@prueba.enclaro.ar`, clave: "almacen-beto-2026" };
const ok = (t) => console.log("✓", t);
const errores = [];

async function nuevaPagina(browser) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 1, locale: "es-AR" });
  await ctx.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errores.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/status of 4\d\d/.test(m.text()) && errores.push("consola: " + m.text()));
  return page;
}
const sinScroll = async (page, donde) => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 360), "scroll horizontal en " + donde);
const texto = (page) => page.locator("main").innerText();
// Diagnóstico: qué sesión tiene guardada el navegador y qué dice Supabase de ella (sin mostrar los tokens).
async function sesionDe(page) {
  const cs = (await page.context().cookies()).filter((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name)).sort((a, b) => a.name.localeCompare(b.name));
  if (!cs.length) return "sin cookie de sesión";
  let crudo = cs.map((c) => c.value).join("");
  if (crudo.startsWith("base64-")) crudo = Buffer.from(crudo.slice(7), "base64url").toString();
  let s;
  try { s = JSON.parse(crudo); } catch { return `cookies ${cs.map((c) => c.name).join(",")} ilegibles`; }
  const claims = JSON.parse(Buffer.from(s.access_token.split(".")[1], "base64url").toString());
  const { error } = await createClient(SUPA_URL, SUPA_ANON, { auth: { persistSession: false } }).auth.getUser(s.access_token);
  return `cookies ${cs.map((c) => `${c.name}[path=${c.path} dominio=${c.domain} secure=${c.secure} sameSite=${c.sameSite} vence=${c.expires === -1 ? "al cerrar" : Math.round(c.expires - Date.now() / 1000) + "s"}]`).join(",")}; sesión ${String(claims.session_id).slice(0, 8)} amr=${(claims.amr || []).map((a) => a.method).join("+")} vence en ${claims.exp - Math.floor(Date.now() / 1000)} s; Supabase: ${error ? error.message : "válida"}`;
}
// Para los mensajes de error: en qué pantalla quedó y qué decía (sin colgarse si la pantalla no tiene <main>).
const donde = async (page) => `${page.url()} «${(await page.locator("body").innerText({ timeout: 3000 }).catch(() => "")).replace(/\s+/g, " ").slice(0, 400)}»`;

/** Busca el último mail para `para` en la casilla de prueba (Mailpit o Inbucket) y devuelve su HTML. */
async function ultimoMail(para) {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${MAIL_URL}/api/v1/search?query=${encodeURIComponent(`to:"${para}"`)}`);
      if (r.ok) {
        const j = await r.json();
        const m = (j.messages ?? [])[0];
        if (m) return (await (await fetch(`${MAIL_URL}/api/v1/message/${m.ID}`)).json()).HTML;
      } else {
        const caja = para.split("@")[0];
        const lista = await (await fetch(`${MAIL_URL}/api/v1/mailbox/${caja}`)).json();
        if (lista.length) return (await (await fetch(`${MAIL_URL}/api/v1/mailbox/${caja}/${lista[lista.length - 1].id}`)).json()).body.html;
      }
    } catch { /* todavía no llegó */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("No llegó el mail a " + para);
}

(async () => {
  const browser = await chromium.launch();

  // ---------- 1. Landing y lista de espera (base real) ----------
  const p = await nuevaPagina(browser);
  await p.goto(`${BASE}/?utm_source=tiktok&utm_content=v6-01`, { waitUntil: "networkidle" });
  await p.getByLabel("Alquiler del mes").fill("300000");
  await p.getByLabel("Tu nombre").fill("Ana");
  await p.getByLabel("Tu WhatsApp").fill("3756 15 111222");
  await p.getByRole("radio", { name: "Kiosco" }).click();
  await p.getByRole("button", { name: "Quiero ser socio fundador" }).click();
  await p.getByRole("status").getByText(/socio fundador N° \d+/).waitFor();
  const { data: anotada } = await admin.from("waitlist").select("name, utm_source, utm_content, founder_number").eq("whatsapp", "5493756111222").single();
  assert.equal(anotada.utm_content, "v6-01");
  ok(`lista de espera: Ana guardada en la base como socia fundadora N° ${anotada.founder_number}, con el video de origen`);
  await p.goto(`${BASE}/baja`, { waitUntil: "networkidle" });
  await p.getByLabel("Tu WhatsApp").fill("3756 15 111222");
  await p.getByRole("button", { name: "Borrar mis datos" }).click();
  await p.getByText(/Tu número de trámite es/).waitFor();
  const { count: quedan } = await admin.from("waitlist").select("id", { count: "exact", head: true }).eq("whatsapp", "5493756111222");
  assert.equal(quedan, 0);
  ok("baja: el dato se borró de verdad de la base");

  // ---------- 2. Registro y primer uso ----------
  await p.goto(`${BASE}/registrarme`, { waitUntil: "networkidle" });
  await p.getByLabel("Tu mail").fill(A.email);
  await p.getByLabel(/Elegí una contraseña/).fill(A.clave);
  await p.getByRole("button", { name: "Crear mi cuenta" }).click();
  await p.waitForURL(/\/app\/bienvenida/, { timeout: 20000 });
  ok("registro: cuenta creada y directo al primer uso");
  const { data: usuarioA } = await admin.auth.admin.listUsers();
  const idA = usuarioA.users.find((u) => u.email === A.email).id;
  const { data: subA } = await admin.from("subscriptions").select("status, trial_ends_at, price").eq("user_id", idA).single();
  assert.equal(subA.status, "trial");
  assert.equal(Number(subA.price), 19900);
  ok("la base creó la prueba de 14 días a $19.900");

  await p.getByLabel("¿Cómo se llama?").fill("Kiosco de Ana");
  await p.getByRole("radio", { name: "Kiosco" }).click();
  await p.getByRole("button", { name: "Seguir" }).click();
  await p.getByRole("heading", { name: "Tus gastos fijos del mes" }).waitFor();
  assert.equal(await p.getByLabel("Alquiler").inputValue(), "300.000"); // vino de la calculadora
  await p.getByLabel("Luz y servicios").fill("140000");
  await p.getByLabel("Sueldos").fill("500000");
  await p.getByLabel(/tarjeta o QR/).fill("6");
  await p.getByRole("button", { name: "Seguir" }).click();
  await p.getByRole("heading", { name: "Cargá 5 productos" }).waitFor();
  const prods = [["Gaseosa 500", "2160", "1500"], ["Alfajor", "1200", "800"], ["Caramelos sueltos", "100", "60"]];
  for (const [n] of prods) await p.getByRole("button", { name: `+ ${n}` }).click();
  const tarjetas = p.locator("main ul > li");
  for (let i = 0; i < prods.length; i++) {
    await tarjetas.nth(i).getByLabel("Lo vendés a").fill(prods[i][1]);
    await tarjetas.nth(i).getByLabel("Te cuesta").fill(prods[i][2]);
  }
  await p.getByRole("button", { name: "Ver mis números" }).click();
  await p.getByText("Esto es lo que tu cuaderno no te decía").waitFor();
  assert.match(await texto(p), /\$31\.333/); // (300.000 + 140.000 + 500.000) ÷ 30
  await p.getByRole("button", { name: "Hacé tu primer cierre hoy a la noche" }).click();
  await p.waitForURL(/\/app$/);
  await p.getByRole("link", { name: /Hacé tu cierre de hoy/ }).waitFor();
  const { data: negA } = await admin.from("businesses").select("id, name, rubro, card_fee_pct, onboarding_completed_at").eq("owner_id", idA).single();
  assert.equal(negA.name, "Kiosco de Ana");
  assert.ok(negA.onboarding_completed_at);
  ok("primer uso guardado en la base y llega a Tu día");

  // ---------- 3. Cierre ----------
  await p.getByRole("link", { name: /Hacé tu cierre de hoy/ }).click();
  await p.getByRole("button", { name: "Hablar" }).click();
  await p.getByLabel("Escribilo como lo dirías").fill("Vendí 186.000, ochenta mil fueron por QR, pagué 92 mil de mercadería y 8 mil de flete, se movió la gaseosa");
  await p.getByRole("button", { name: "Entender" }).click();
  await p.getByText("Esto es lo que entendí").waitFor();
  await p.getByRole("button", { name: "Guardar cierre" }).click();
  await p.getByText("Hoy te quedaron libres").waitFor();
  // 186.000 − 92.000 − 8.000 − 4.800 − 31.333 = 49.867
  assert.match(await texto(p), /\$49\.867/);
  const { data: cierre } = await admin.from("daily_closes").select("sales_total, card_sales, source, close_expenses(category, amount)").eq("business_id", negA.id).single();
  assert.equal(Number(cierre.sales_total), 186000);
  assert.equal(cierre.close_expenses.find((g) => g.category === "comision").amount, 4800);
  ok("cierre guardado en la base: ventas, QR, comisión de $4.800 y hoy te quedaron $49.867");

  // ---------- 4. Fiados ----------
  await p.goto(`${BASE}/app/fiados`, { waitUntil: "networkidle" });
  await p.getByText("Todavía no cargaste fiados").waitFor();
  await p.getByRole("button", { name: "Agregar cliente" }).click();
  await p.getByLabel("Nombre").fill("Marta");
  await p.getByLabel(/WhatsApp/).fill("3756 15 123456");
  await p.getByRole("button", { name: "Guardar cliente" }).click();
  await p.getByRole("button", { name: /Marta/ }).click();
  await p.getByRole("button", { name: "Me fió" }).click();
  await p.getByLabel("¿Cuánto se llevó?").fill("18000");
  await p.getByRole("button", { name: "Guardar" }).click();
  await p.waitForFunction(() => /\$18\.000/.test(document.querySelector("main")?.textContent ?? ""));
  const wa = await p.getByRole("link", { name: "Recordale por WhatsApp" }).getAttribute("href").catch(async () => {
    await p.getByRole("button", { name: /Marta/ }).click();
    return p.getByRole("link", { name: "Recordale por WhatsApp" }).getAttribute("href");
  });
  assert.match(wa, /^https:\/\/wa\.me\/5493756123456\?text=Hola%20Marta/);
  await p.getByRole("button", { name: "Me pagó" }).click();
  await p.getByLabel("¿Cuánto te pagó?").fill("5000");
  await p.getByRole("button", { name: "Guardar" }).click();
  await p.waitForFunction(() => /\$13\.000/.test(document.querySelector("main")?.textContent ?? ""));
  ok("fiados en la base: Marta debe $13.000 y el recordatorio de WhatsApp sale armado");

  // ---------- 5. Precios ----------
  await p.goto(`${BASE}/app/precios`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /^Alfajor/ }).click();
  await p.locator("#costo").fill("900");
  await p.getByRole("button", { name: "Usar ese precio" }).click();
  await p.getByRole("button", { name: "Guardar" }).click();
  await p.getByText("Listo, guardado.").waitFor();
  const { data: alfajor } = await admin.from("products").select("id, cost, price").eq("business_id", negA.id).eq("name", "Alfajor").single();
  assert.equal(Number(alfajor.cost), 900);
  const { count: cambios } = await admin.from("price_changes").select("id", { count: "exact", head: true }).eq("product_id", alfajor.id);
  assert.equal(cambios, 1);
  ok(`precios: costo nuevo y precio sugerido ($${Number(alfajor.price).toLocaleString("es-AR")}) guardados, con su historial`);

  // ---------- 6. Foto de factura y carteles ----------
  await p.goto(`${BASE}/app/factura`, { waitUntil: "networkidle" });
  await p.getByLabel("Foto de la factura").setInputFiles(path.join(__dirname, "../tests/facturas/factura-1.jpg"));
  await p.getByText("Esto es lo que encontré").waitFor({ timeout: 120000 });
  await p.locator("main ul > li").first().getByLabel("Es tu producto").selectOption({ label: "Gaseosa 500" });
  await p.getByRole("button", { name: /^Aplicar/ }).click();
  await p.getByText(/Precios actualizados/).waitFor();
  await p.getByRole("img", { name: "Cartel 1" }).waitFor();
  const { data: gaseosa } = await admin.from("products").select("cost").eq("business_id", negA.id).eq("name", "Gaseosa 500").single();
  assert.equal(Number(gaseosa.cost), 2890);
  ok("factura: la foto se leyó en el navegador, el costo nuevo ($2.890) quedó en la base y salieron los carteles");

  // ---------- 7. Depósito (plata dormida) ----------
  await admin.from("products").update({ created_at: new Date(Date.now() - 60 * 86400000).toISOString(), stock: 300 }).eq("business_id", negA.id).eq("name", "Caramelos sueltos");
  await p.goto(`${BASE}/app/deposito`, { waitUntil: "networkidle" });
  await p.locator("li", { hasText: "Caramelos sueltos" }).getByRole("button", { name: "Liquidar" }).click();
  await p.locator("li", { hasText: "Caramelos sueltos" }).getByRole("button", { name: "Liquidar" }).click();
  await p.getByText(/ahora sale/).waitFor();
  const { data: caramelo } = await admin.from("products").select("price, dormant_action").eq("business_id", negA.id).eq("name", "Caramelos sueltos").single();
  assert.equal(caramelo.dormant_action, "liquidar");
  assert.equal(Number(caramelo.price), 70); // 60 + 5% = 63 → redondeo a $10 = 70
  ok("depósito: producto dormido liquidado a costo + 5% en la base");

  // ---------- 8. Ajustes y Tu día ----------
  await p.goto(`${BASE}/app/ajustes`, { waitUntil: "networkidle" });
  await p.getByLabel("Comisión por cobrar con tarjeta o QR").fill("4,5");
  await p.getByRole("button", { name: "Guardar ajustes" }).click();
  await p.getByText("Listo, guardado.").waitFor();
  const { data: neg2 } = await admin.from("businesses").select("card_fee_pct").eq("id", negA.id).single();
  assert.equal(Number(neg2.card_fee_pct), 4.5);
  await p.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await p.getByText("Hoy te quedaron libres").waitFor();
  for (const ruta of ["/app", "/app/cierre", "/app/fiados", "/app/precios", "/app/deposito", "/app/ajustes", "/app/factura"]) {
    await p.goto(BASE + ruta, { waitUntil: "networkidle" });
    await sinScroll(p, ruta);
  }
  ok("ajustes guardados y todas las pantallas sin scroll horizontal a 360 px");

  // ---------- 9. Seguridad: un segundo usuario no ve ni toca nada de Ana ----------
  const anon = createClient(SUPA_URL, SUPA_ANON, { auth: { persistSession: false } });
  const { error: errAlta } = await anon.auth.signUp({ email: B.email, password: B.clave });
  assert.ifError(errAlta);
  const beto = createClient(SUPA_URL, SUPA_ANON, { auth: { persistSession: false } });
  const { error: errEntrar } = await beto.auth.signInWithPassword({ email: B.email, password: B.clave });
  assert.ifError(errEntrar);
  const { data: vistos } = await beto.from("products").select("id");
  assert.equal(vistos.length, 0, "Beto ve productos ajenos");
  const { data: negociosVistos } = await beto.from("businesses").select("id, name");
  assert.equal(negociosVistos.length, 1);
  assert.notEqual(negociosVistos[0].id, negA.id);
  for (const t of ["daily_closes", "close_expenses", "customers", "credit_movements", "fixed_costs", "price_changes"]) {
    const { data } = await beto.from(t).select("*");
    assert.equal(data.length, 0, `Beto ve ${t} de Ana`);
  }
  const { error: intruso } = await beto.from("fixed_costs").insert({ business_id: negA.id, concept: "intruso", monthly_amount: 1 });
  assert.ok(intruso, "Beto pudo escribir en el negocio de Ana");
  await beto.from("products").update({ price: 1 }).eq("id", alfajor.id);
  const { data: alfajor2 } = await admin.from("products").select("price").eq("id", alfajor.id).single();
  assert.equal(Number(alfajor2.price), Number(alfajor.price), "Beto cambió un precio de Ana");
  const { data: subB } = await beto.from("subscriptions").update({ status: "active", current_period_end: "2099-01-01" }).select();
  assert.ok(!subB || subB.length === 0, "Beto se activó la suscripción solo");
  const { error: errLista } = await beto.from("waitlist").select("*");
  assert.ok(errLista, "Beto lee la lista de espera");
  const { data: sinSesion, error: errAnon } = await anon.from("products").select("id");
  assert.ok(errAnon || sinSesion.length === 0, "sin sesión se leen productos");
  ok("seguridad: el segundo usuario no ve, no escribe y no cambia nada de Ana; nadie se activa solo; sin sesión no se lee nada");

  // ---------- 10. Prueba vencida: solo lectura ----------
  await admin.from("subscriptions").update({ trial_ends_at: new Date(Date.now() - 3600000).toISOString() }).eq("user_id", idA);
  await p.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await p.waitForURL(/\/suscribirme/);
  await p.getByRole("heading", { name: "Tu prueba terminó" }).waitFor();
  assert.match(await texto(p), /Kiosco de Ana/);
  assert.match(await texto(p), /\$13\.000/); // lo que le deben, guardado
  const ana = createClient(SUPA_URL, SUPA_ANON, { auth: { persistSession: false } });
  await ana.auth.signInWithPassword({ email: A.email, password: A.clave });
  const { data: anaVencida } = await ana.from("products").select("id");
  assert.equal(anaVencida.length, 0, "con la prueba vencida todavía ve productos");
  const { data: claims } = await ana.auth.getClaims();
  assert.equal(claims.claims.account_status, "expired");
  ok("vencida: va a 'Tu prueba terminó' con su resumen guardado, la base no le da datos y el token dice expired");

  // ---------- 11. Recuperar la contraseña con el mail real ----------
  const p2 = await nuevaPagina(browser);
  await p2.goto(`${BASE}/recuperar`, { waitUntil: "networkidle" });
  await p2.getByLabel("Tu mail").fill(B.email);
  await p2.getByRole("button", { name: "Mandarme el link" }).click();
  await p2.getByText(/te mandamos un link/).waitFor();
  const html = await ultimoMail(B.email);
  assert.match(html, /Elegí una contraseña nueva/);
  const link = html.match(/href="([^"]*\/auth\/callback[^"]*)"/)[1].replace(/&amp;/g, "&");
  await p2.goto(link, { waitUntil: "networkidle" });
  await p2.waitForURL(/\/nueva-clave/);
  // P-07: el link del mail no puede mandarte a otra dirección del sitio (ahí la sesión se pierde)
  assert.equal(new URL(p2.url()).host, new URL(link).host, `el link del mail llevó a otra dirección: ${p2.url()}`);
  await p2.getByLabel("Tu contraseña nueva").fill("clave-nueva-beto-1");
  await p2.getByRole("button", { name: "Guardar contraseña" }).click();
  await p2.locator("form [role=alert], form [role=status]").first().waitFor();
  const respuesta = await p2.locator("form [role=alert], form [role=status]").first().innerText();
  const cookies = (await p2.context().cookies()).map((c) => `${c.name} (httpOnly=${c.httpOnly})`).join(", ");
  assert.match(respuesta, /Listo, cambiaste tu contraseña\./, `al guardar la contraseña nueva la pantalla dijo: «${respuesta}» · cookies: ${cookies}`);
  await p2.waitForURL(/\/app\/bienvenida/).catch(async () => {
    throw new Error(`después de cambiar la contraseña quedó en ${await donde(p2)}`);
  });
  const sesionTrasCambio = await sesionDe(p2);
  console.log("  · sesión de Beto después de cambiar la contraseña: " + sesionTrasCambio);
  await p2.goto(`${BASE}/app/ajustes`, { waitUntil: "networkidle" });
  assert.match(p2.url(), /\/app\/ajustes/, `recién cambiada la contraseña, /app/ajustes llevó a ${await donde(p2)} · ${await sesionDe(p2)}`);
  const otra = createClient(SUPA_URL, SUPA_ANON, { auth: { persistSession: false } });
  const { error: errNueva } = await otra.auth.signInWithPassword({ email: B.email, password: "clave-nueva-beto-1" });
  assert.ifError(errNueva);
  const p3 = await nuevaPagina(browser);
  await p3.goto(link, { waitUntil: "networkidle" });
  await p3.waitForURL(/\/nueva-clave/);
  await p3.getByLabel("Tu contraseña nueva").fill("otra-clave-de-beto-2");
  await p3.getByRole("button", { name: "Guardar contraseña" }).click();
  await p3.getByText(/El link venció o ya se usó/).waitFor();
  const { error: errVieja } = await otra.auth.signInWithPassword({ email: B.email, password: "otra-clave-de-beto-2" });
  assert.ok(errVieja, "un link ya usado cambió la contraseña otra vez");
  ok("recuperar contraseña: llegó el mail en español, el link funciona, la contraseña nueva entra y el link no sirve dos veces");

  // ---------- 12. Salir y volver a entrar ----------
  // Beto no terminó el primer uso: tiene que poder salir desde la bienvenida.
  await p2.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await p2.waitForURL(/\/app\/bienvenida/, { timeout: 10000 }).catch(async () => { throw new Error(`al abrir /app quedó en ${await donde(p2)} · antes: ${sesionTrasCambio} · ahora: ${await sesionDe(p2)}`); });
  await p2.getByRole("button", { name: "Salir de mi cuenta" }).click({ timeout: 10000 }).catch(async () => { throw new Error(`no aparece «Salir de mi cuenta» en ${await donde(p2)}`); });
  await p2.waitForURL((u) => u.pathname === "/" && u.host === new URL(BASE).host, { timeout: 10000 }).catch(async () => { throw new Error(`después de salir quedó en ${await donde(p2)}`); });
  await p2.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await p2.waitForURL(/\/entrar/);
  await p2.getByLabel("Tu mail").fill(B.email);
  await p2.getByLabel("Tu contraseña").fill("clave-mala-123");
  await p2.getByRole("button", { name: "Entrar", exact: true }).click();
  await p2.getByText("El mail o la contraseña no son correctos.").waitFor();
  await p2.getByLabel("Tu contraseña").fill("clave-nueva-beto-1");
  await p2.getByRole("button", { name: "Entrar", exact: true }).click();
  await p2.waitForURL(/\/app\/bienvenida/);
  ok("salir (aun a mitad del primer uso), contraseña mala con mensaje claro, y entrar de nuevo (Beto va a su primer uso)");

  assert.deepEqual(errores, [], "errores en el navegador: " + errores.join(" | "));
  ok("sin errores en el navegador en todo el recorrido");
  await browser.close();
  console.log("\nTODO OK: la app funciona de punta a punta con Supabase real.");
})().catch((e) => {
  console.error("✗", e.stack || e.message);
  process.exit(1);
});
