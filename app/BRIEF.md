# BRIEF — App y landing de En Claro

> Para Claude Code. Fuente única para construir la landing y la app. Reemplaza al "Brief maestro v2" (documento)
> e incorpora las decisiones posteriores: cobro **solo por Mercado Pago** (sin efectivo), funciones de la estrategia
> (voz, foto de factura, carteles, fiado inteligente, número del día) y lanzamiento con socios fundadores.
> Si algo de este brief es técnicamente incorrecto o hay una forma claramente mejor, decilo en el plan antes de construir.

> **Referencia visual:** `app/prototipo/` (Main = landing, App = pantallas). Respetá colores, fuentes, textos y orden; los montos son de ejemplo.

## 1. Producto

En Claro no es un sistema de gestión ni un punto de venta: es la capa de claridad sobre el mostrador. Le dice al dueño
de un kiosco, almacén o dietética lo que su cuaderno no le dice:

- cuánto le quedó de verdad al cerrar el día, y su **número del día** (lo que tiene que vender para no perder)
- qué producto le deja plata (no el que más vende) y a cuánto vender cuando aumenta el proveedor
- a quién cobrarle los fiados, y cuándo
- qué plata tiene dormida en el depósito

**Promesa:** "Te hago las cuentas que tu cuaderno no te hace." · **Tagline:** "Dejá de adivinar. Tu negocio te está hablando."

**Público:** dueño-operador en Argentina, 30 a 65 años, sin conocimientos técnicos, usa el celular con una mano detrás del mostrador.
La IA va por dentro: **nunca** aparece la palabra "IA" ni "inteligencia artificial" en la interfaz.

**Fuera del MVP:** facturación electrónica, ARCA, lector de códigos de barras, stock por cada venta, multiusuario.

## 2. Stack

| Pieza | Elección |
|---|---|
| Web y app | Next.js (App Router) + TypeScript en `app/`, instalable como PWA |
| Hosting | Netlify (deploy previews por cada push) |
| Base de datos y auth | Supabase (Postgres + Auth + RLS), migraciones en `app/supabase/migrations/` |
| Pagos | Mercado Pago: Suscripciones (preapproval) + Checkout Pro como respaldo |
| Webhook | Route handler `/api/webhooks/mercadopago` |
| Tareas programadas | `pg_cron` + `pg_net` en Supabase |
| Emails | Resend |
| Voz y fotos | Claude por API, modelo más económico (Haiku); límites por usuario y por día; costo por llamada guardado |
| Estilos | Tailwind, mobile-first, fuentes locales (las de `videos/public/fuentes`) |
| Validación y tests | Zod · Vitest (lógica) · Playwright (flujos, viewport 360 px) |

Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN`,
`MP_WEBHOOK_SECRET`, `MP_PLAN_ID`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `ADMIN_EMAIL`, `APP_URL`.
Ninguna clave en el código: todo en variables de Netlify y secretos de GitHub.

## 3. Landing (fase 0: va primero, ya hay videos apuntando al link del perfil)

Ruta `/`. Una sola página, carga en menos de 2 s en 4G, sin scripts de terceros salvo analítica sin cookies
(Netlify Analytics o Plausible). Imagen Open Graph para WhatsApp. Misma identidad que los videos: verde oscuro #0B2418–#1B4332,
amarillo #FFB703 para el dato clave, rojo solo para pérdidas, toldo rayado verde y blanco como firma (ver `marca/`).

**Estructura y texto:**

1. **Hero** — píldora "KIOSQUEROS Y ALMACENEROS". H1: **"Vendés un montón. ¿Pero sabés si te quedó plata?"**
   Subtítulo: "En Claro te hace las cuentas que tu cuaderno no te hace: cuánto te quedó, a quién cobrarle y a cuánto vender. En 5 minutos por día, desde el celular."
   CTA: **"Calculá tu número del día gratis"** (baja a la calculadora). Debajo, el kiosco ilustrado con la persiana a media altura.
2. **Calculadora "Tu número del día"** (el gancho de los videos, funciona sin registrarse) — tres campos con teclado numérico:
   alquiler, luz y servicios, sueldos (mensuales) + margen promedio aproximado (default 30%, editable con un deslizador).
   Resultado gigante: **"Cada día tenés que cubrir $X antes de ganar un peso"** (fijos ÷ días del mes) y
   **"Para no perder, tenés que vender $Y por día"** (fijos diarios ÷ margen). Animación de número que rueda.
   Debajo: "¿Querés que En Claro te diga todos los días si lo pasaste?" → formulario de lista de espera.
3. **Los tres dolores** (tarjetas con ícono dibujado, no emoji):
   - "Vendí mucho pero no sé si me quedó algo." → Le hablás al celular al cerrar y te dice cuánto te quedó de verdad.
   - "Tengo $180.000 en la calle y me da vergüenza cobrar." → Te avisa a quién cobrarle el día que cobra y le manda el mensaje por WhatsApp.
   - "El proveedor aumentó y no cambié los precios." → Sacás foto a la factura y te dice a cuánto vender. Y te imprime los carteles.
4. **Cómo funciona** — tres pasos con captura real de la app: "Hablale" · "Sacale foto a la factura" · "Mirá tu número".
5. **Precio** — "Socio fundador: **$7.900 por mes** para siempre. Solo para los primeros 100." Contador real de lugares que quedan
   (sale de la base). Debajo, tachado no: "Después, $12.900 por mes." "14 días gratis, sin tarjeta." "Pagás con Mercado Pago: tarjeta o el saldo de tu cuenta. Cancelás cuando quieras."
   **Garantía:** "Si en el primer mes pago no recuperaste lo que pagaste, te devolvemos la plata."
6. **Preguntas** (4): ¿Necesito computadora? No. · ¿Tengo que cargar cada venta? No, el total del día una vez. · ¿Qué pasa con mis datos si dejo de pagar? Quedan guardados. · ¿Factura? No, En Claro no factura ni reemplaza tu caja.
7. **Footer** — Términos · Privacidad · **Darme de baja** · WhatsApp de contacto (número visible como texto, además del link `wa.me`) · "Hecho en Santo Tomé, Corrientes" · Dale Web.

**Lista de espera mientras la app no está lista** (tabla `waitlist`: nombre, WhatsApp, rubro, ciudad, número del día calculado,
`utm_source`, `utm_content`, fecha). Al anotarse: "¡Listo! Sos el socio fundador N° X. Te escribimos por WhatsApp cuando abramos."
Cuando la app esté lista, el mismo CTA pasa a "Probalo 14 días gratis" y va al registro.

**UTM:** cada video usa `?utm_source=tiktok&utm_content=<id-del-video>`. Guardarlo en `localStorage` al entrar y adjuntarlo a la lista
de espera y al registro. El admin muestra registros por video.

## 4. Las funciones de la app

Regla: cada carga se hace en menos de 30 segundos con el pulgar. Todo en voseo, sin jerga.

### 4.1 Cierre del día (con voz)

- Configuración única: gastos fijos mensuales (alquiler, luz, sueldos, otros).
- **Cierre por voz** (botón principal): micrófono grande; el navegador transcribe con Web Speech API (`es-AR`); Claude ordena el texto
  en `{ventas, gastos:[{categoria, monto}], productosMovidos:[...]}`; pantalla de confirmación editable antes de guardar.
  Si el navegador no tiene reconocimiento de voz, se puede grabar un audio y transcribirlo en el servidor; si nada funciona, formulario manual.
- Formulario manual: total vendido y gastos del día (Proveedor, Flete, Vuelto, Otros). Un cierre por día; se edita el de días anteriores.
- "¿Qué se movió hoy?": chips de productos (los más usados primero + buscador). Alimenta la plata dormida.
- Resultado: **"Hoy te quedaron $X libres"** = ventas − gastos del día − fijos ÷ días del mes. Al lado: **tu número del día** y si lo pasaste (barra que se llena).
- Promedio de 7 días con la nota: "Los días que le pagás al proveedor te da más bajo. Mirá el promedio de la semana."
- Historial de 30 días: barras verdes (positivo) y amarillas (negativo).

### 4.2 Ranking de margen y precios

- Producto: nombre, precio, costo, stock aproximado, fecha de última actualización de precio.
- Margen % = (precio − costo) ÷ precio. Tabla ordenada por margen; rojo bajo 15% (editable).
- Al cambiar un costo: "Para seguir ganando 30%, vendelo a $X" — un toque lo aplica (redondeo a $10 o $50, configurable).
- **Foto de la factura:** foto → Claude (visión) lee productos y costos → cruce con la lista (coincidencia aproximada de nombres, el usuario confirma)
  → "7 productos aumentaron. Para mantener tu ganancia, vendelos a estos precios" → un toque aplica todo. También sirve para el onboarding.
- **Carteles:** después de cambiar precios, generar carteles listos (A4 con varios productos o tarjetitas de góndola) como **imagen PNG**
  para compartir por WhatsApp o imprimir desde el celular, con "hecho con En Claro" discreto. Además, una imagen para el estado de WhatsApp.
- Indicador gris "precio sin revisar hace más de 30 días".

### 4.3 Fiado inteligente

- Cliente: nombre, teléfono (opcional), **día del mes en que cobra** (opcional), nota.
- Movimientos "Me fió" y "Me pagó", con pagos parciales; saldo = suma.
- **Semáforo:** verde (deuda más vieja ≤ 15 días), amarillo (> 15), rojo (> 30 días o 2 recordatorios sin pago) con la sugerencia "No le fíes más hasta que pague".
- Arriba: "Te deben $X en total · el más viejo hace N días".
- "Recordar": texto "Hola [nombre], te recuerdo el saldo pendiente de $[saldo] del [fecha]. Cuando puedas, avisame. Gracias."
  Con teléfono abre `https://wa.me/549...?text=`; sin teléfono, `https://wa.me/?text=` y lo copia. Sin API oficial de WhatsApp.
- El día que cobra un cliente con deuda, aparece arriba en el resumen: "Hoy cobra Marta: recordale $18.000".
- Guarda la fecha del último recordatorio ("Le recordaste hace 3 días").

### 4.4 Plata dormida

- Última venta de cada producto desde los chips del cierre (o botón "Vendí hoy" en la ficha).
- Productos sin ventas en 30 días (editable). Total: "Tenés $X inmovilizados" = Σ costo × stock (al lado: "si lo vendieras: $Y").
- Acciones: "No reponer", "Liquidar" (sugiere costo + 5%), "Está bien así" (oculta 30 días). Confirmar stock al elegir.

### 4.5 Pantalla principal ("Tu día")

Orden: número del día y si lo pasaste → "Hoy te quedaron" (o botón grande "Hacé tu cierre") → quién cobra hoy → productos con precio viejo →
plata dormida. Cada bloque con su acción en un toque.

## 5. Base de datos

Un usuario = un negocio. Montos `numeric(14,2)`. Todas las tablas de datos con `business_id` y RLS.

| Tabla | Columnas clave |
|---|---|
| `businesses` | id, owner_id (único), name, rubro (kiosco · almacen · dietetica), ciudad, margin_alert_pct (15), dormant_days (30), price_rounding, onboarding_completed_at, utm_source, utm_content |
| `fixed_costs` | id, business_id, concept, monthly_amount |
| `daily_closes` | id, business_id, date (único por negocio), sales_total, source (voz · manual) |
| `close_expenses` | id, close_id, category (proveedor · flete · vuelto · otros), concept, amount |
| `products` | id, business_id, name, price, cost, stock, price_updated_at, last_sold_at, dormant_action, dormant_snoozed_until, archived_at |
| `product_sale_days` | product_id, date (PK compuesta); trigger que actualiza `last_sold_at` |
| `price_changes` | id, product_id, old_cost, new_cost, old_price, new_price, source (factura · manual), created_at |
| `customers` | id, business_id, name, phone, pay_day (1–31), note, last_reminded_at, reminders_unpaid |
| `credit_movements` | id, customer_id, business_id, type (fio · pago), amount, date, note · vista `customer_balances` |
| `ai_calls` | id, business_id, kind (voz · factura), tokens_in, tokens_out, cost_usd, created_at |
| `subscriptions` | id, user_id (único), status (trial · active · past_due · expired · cancelled), plan (fundador · mensual · anual), price, billing_method (mp_suscripcion · mp_pago_unico · manual), trial_ends_at, current_period_end, mp_preapproval_id, mp_payer_id, blocked_at, timestamps |
| `subscription_events` | id, user_id, from_status, to_status, reason, created_at (trigger sobre `subscriptions`) |
| `payments` | id, user_id, mp_payment_id (único), amount, status, paid_at, raw jsonb |
| `waitlist` | id, name, whatsapp, rubro, ciudad, numero_del_dia, utm_source, utm_content, founder_number, created_at |

Límites de IA: 3 lecturas de factura y 10 cierres por voz por día y por negocio (constantes editables). Si se pasan: "Por hoy llegaste al límite, cargalo a mano".

## 6. Acceso y suscripciones

- **Auth:** Supabase Auth con email + contraseña y magic link, plantillas en español.
- **Barrera real:** función SQL `public.has_access()` (`security definer`, `stable`, `search_path = ''`) que mira `subscriptions` en el momento:
  trial vigente, o `active`/`past_due` con `current_period_end + 3 días > now()`, y `blocked_at is null`.
  Todas las políticas RLS de datos usan `(select public.has_access())`.
- **Interfaz:** Custom Access Token Hook que agrega `account_status` al JWT para que el middleware redirija a `/suscribirme`. No es seguridad.
- **Alta:** trigger sobre `auth.users` crea `businesses` y `subscriptions` (trial de 14 días).
- **Cron diario 03:00 (Argentina):** pasa a `expired` trials vencidos y `past_due` con más de 3 días (para que el admin esté al día).
- **Vencido:** ve su resumen en solo lectura ("Tu prueba terminó. Tus datos están guardados.") + botón de suscribirse (vista `resumen_bloqueado`).

## 7. Pagos (solo Mercado Pago, sin efectivo)

| Camino | Medios | Implementación |
|---|---|---|
| A · Suscripción automática (principal) | Tarjeta o saldo de Mercado Pago | Preapproval mensual. Fundador $7.900 (los primeros 100, precio congelado), después $12.900. Si se suscribe durante el trial, el primer cobro arranca al vencer el trial. |
| B · Pago mes a mes (link chico) | Tarjeta o saldo | Checkout Pro con `excluded_payment_types` = `ticket`, `atm`. Suma 30 días. Email 3 días antes con el link. |
| Anual | Igual que B | Checkout Pro por 12 meses con 20% off. Suma 365 días. |
| Manual (admin) | — | "Marcar como pagado" suma 30 días. |

**Webhook:** valida `x-signature` con `MP_WEBHOOK_SECRET` (401 si falla) · responde 200 rápido · tópicos `subscription_preapproval`,
`subscription_authorized_payment`, `payment` · consulta siempre el recurso real a la API · `payments.mp_payment_id` único (idempotente) ·
aprobado → `active` + nuevo período; rechazado → `past_due`; cancelado → `cancelled` con acceso hasta fin del período ·
`external_reference = user_id`.

**Verificar en la documentación vigente antes de codear** (no asumir): alta de preapproval sin tarjeta previa, `start_date` futuro y
dinero en cuenta habilitado para suscripciones en Argentina. Proponer el flujo en el plan.

**Emails (Resend):** bienvenida · día 10 con el resumen real del negocio y la oferta anual · día 13 "tu prueba termina mañana" · recibo de cada pago.
**Aumentos:** aviso con 30 días; nunca a socios fundadores.

## 8. Onboarding (menos de 5 minutos hasta el "wow")

1. **Tu negocio:** nombre, rubro (tres botones grandes), ciudad.
2. **Tus gastos fijos del mes:** alquiler, luz, sueldos, otros (pueden quedar en cero). Si vino de la calculadora, precargados.
3. **Tus productos:** "Sacale foto a una factura de tu proveedor" (carga varios de una) o cargar 5 a mano con chips de nombres típicos por rubro (solo nombres, nunca precios inventados).

**Pantalla "wow":** "Cada día tenés que cubrir $X antes de ganar un peso" + "Para no perder, vendé $Y" + ranking de margen de sus productos
("Tu [producto] te deja $Y por unidad; tu [producto] apenas $Z"). Botón: "Hacé tu primer cierre hoy a la noche". Secundario: recordatorio diario a las 21 h (`.ics`).

## 9. Admin (`/admin`, solo `ADMIN_EMAIL`, service role solo en servidor)

Lista de usuarios (negocio, rubro, ciudad, estado, plan, próximo cobro, último cierre, `utm_content`) · contadores por estado ·
**activación** (% que terminó el onboarding, % con 3+ cierres en el trial) · **lista de espera** con exportar a CSV y botón "abrir WhatsApp" por fila ·
socios fundadores ocupados/100 · registros y pagos por video (`utm_content`) · MRR · churn del mes (de `subscription_events`) ·
LTV ("Pocos datos" con menos de 20 activos) · costo de IA del mes y por usuario ·
acciones: extender trial 7 días, marcar pagado, bloquear (cada una con motivo en `subscription_events`).

## 10. Legal

Botón "Darme de baja" visible en la landing y en Ajustes (cancela el preapproval, muestra número de trámite y manda email) ·
política de privacidad (qué se guarda, para qué, no se vende, cómo pedir el borrado, el comerciante es responsable del permiso de sus clientes
para anotarlos) · "Borrar mi cuenta y todos mis datos" en Ajustes · términos y privacidad como **borrador** con aviso visible de revisión legal ·
nota para el dueño: consultar con un contador cómo facturar las suscripciones antes del primer cobro.

## 11. Diseño y textos

Voseo · cero jerga ("resumen", "tu día", "entrar", nunca "dashboard", "métricas", "login", "IA") · número principal de cada pantalla de 40 px o más,
formato `$23.400` · botones de 48 px o más, acción principal abajo · `inputmode="numeric"` en toda plata · 360 px de ancho y conexión lenta ·
estados vacíos que enseñan ("Todavía no cargaste fiados. Cuando alguien te lleve algo sin pagar, anotalo acá.") · errores simples
("No se pudo guardar. Revisá tu conexión y probá de nuevo.") · fechas relativas ("hace 41 días") · contraste AA.

## 12. Fases (una por sesión, cada una con su "Listo cuando")

0. **Landing + calculadora + lista de espera** (sección 3). Netlify publicando `app/` desde `main`.
   *Listo cuando:* la landing está online, la calculadora da el número correcto (tests), anotarse guarda en `waitlist` con UTM y muestra el N° de socio fundador, Lighthouse móvil ≥ 90.
1. **Fundaciones de la app:** migraciones de todo el esquema, `has_access()`, RLS, triggers, token hook, auth en español, PWA.
   *Listo cuando:* un test prueba que A no ve datos de B y que un trial vencido recibe cero filas.
2. **Onboarding y bloqueo** (sección 8 y vencidos en solo lectura, cron).
   *Listo cuando:* un registro nuevo llega al "wow" en menos de 5 minutos desde el celular.
3. **Funciones núcleo:** cierre (manual + voz), ranking y precio sugerido, fiado inteligente, plata dormida, pantalla "Tu día".
   *Listo cuando:* cada carga tarda menos de 30 s cronometrada y la voz entiende las 5 frases de prueba de `app/tests/voz.json`.
4. **Foto de factura y carteles.**
   *Listo cuando:* 3 facturas de prueba (`app/tests/facturas/`, imágenes de ejemplo) se leen con al menos 90% de productos bien cruzados y se generan los carteles.
5. **Pagos y emails** (sección 7), botón de baja.
   *Listo cuando:* en el entorno de pruebas de Mercado Pago, aprobado, rechazado y cancelado dejan el estado correcto y una notificación repetida no duplica nada.
6. **Admin, legal y pulido:** pruebas de punta a punta (trial, activo, vencido) en 360 px; la landing pasa de lista de espera a registro.

Commit y push al terminar cada fase; actualizar el estado en el `CLAUDE.md` de la raíz.
