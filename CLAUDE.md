# En Claro — instrucciones para Claude Code

En Claro es una app para dueños de kioscos, almacenes y dietéticas de Argentina: les dice cuánto les quedó de verdad,
qué producto les deja plata, a quién cobrarle los fiados y qué plata tienen dormida. Precio: $19.900/mes ($12.900 para siempre para los primeros 100 socios fundadores), 14 días gratis,
cobro solo por Mercado Pago.

## Cómo trabaja el dueño del proyecto

- Trabaja **solo desde el celular**, sin computadora. Todo se construye y se renderiza en este repositorio y en GitHub Actions.
- Cualquier paso manual (Supabase, Mercado Pago, Netlify, secretos de GitHub) se le da como **lista corta y numerada**,
  que se pueda hacer desde el navegador del teléfono.
- Una tarea grande por sesión. Al terminar: commit claro y push. Nunca dejes trabajo sin commitear.
- Todo el producto, los textos y los videos van en **español argentino con voseo**, sin jerga técnica.
- **Los videos se le entregan como MP4 directo en el chat** (`SendUserFile`), nunca como .zip ni artifacts de Actions
  (le resultan incómodos). Todo va en **la misma rama de trabajo**, sin ramas extra: el workflow arma el video y deja el MP4
  en `videos/salida/` de esa rama; hacé `git pull` y mandalo con `SendUserFile`. `videos.yml` arma solo el video en producción:
  para cambiarlo tocá `NOMBRE`, `ID` y `CONTROL` arriba del archivo. El render se reparte en 10 máquinas a la vez (cada una hace
  una parte de los cuadros, `scripts/cuadros.cjs`) y el job `unir` las junta sin recomprimir: tarda ~4-5 min en vez de 10-20.
  Por eso todo tiene que ser determinista (cada cuadro sale solo de `useCurrentFrame()`, nada que dependa del cuadro anterior).
- Página con todos los videos para bajar: https://claude.ai/artifact/D2yvc4fKGKJHRoN7DDW1gV (los MP4 son assets de esa página; para sumar uno, subirlo con `Artifact` `asset: true` y agregarlo a `VIDEOS`).
  Los assets tienen tope de 20 MiB: los videos con mucha cámara pesan 34–76 MB, así que para la página se comprimen en 2 pasadas
  a ~3,5 Mbps (`ffmpeg -b:v 3500k -pass 1/2`, ~18 MB). La página ya tiene la versión rápida del V5-01 (la lenta se sacó).

## Estructura

- `videos/` — fábrica de videos verticales con Remotion.
  - `videos/referencia/CREATIVE_BRIEF.md` — la biblia creativa. **Leela completa antes de tocar cualquier video.**
  - `videos/referencia/animatic.html` — el aviso "La persiana" funcionando en el navegador. Su `render(t)` calcula
    cada elemento desde el tiempo, igual que `useCurrentFrame()`: portalo a Remotion sin adivinar.
- `app/` — landing y MVP de En Claro en Next.js + Supabase + Mercado Pago + Netlify. `app/BRIEF.md` es la fuente única.
- `marca/` — foto de perfil y portada (colores y toldo que usa la landing).

## ⚠️ Estándar de calidad de los videos (obligatorio desde el 17/11/2026)

Decisión del dueño: los videos 100% hechos con código no atrapan. **Antes de escribir un guion o producir un video, leé
`videos/referencia/ESTANDAR-CALIDAD.md` completo** y cumplilo: presupuesto US$0 con permiso de uso comercial, formato probado
primero (`FORMATOS-VIRALES.md`), persona y emoción en vez de metáforas, imagen filmada de verdad (búsqueda automática desde GitHub Actions en Wikimedia Commons y Pixabay; el dueño no filma) + pantalla
real de la app, código solo como capa gráfica, voz con emoción (Gemini TTS gratis o Tomás) a velocidad natural (**prohibido acelerar la voz**), máximo 2 textos a la vez y
control de calidad con puntaje ≥ 8 en cada punto antes de entregar. Lo que no cumple, no se entrega. Los guiones V6 y V7 pendientes
quedan en pausa: se rehacen con este estándar antes de producirse.

## Voz de los videos

Presupuesto US$0: **Gemini TTS** (plan gratis de Google AI Studio, clave `GEMINI_API_KEY` en secretos de GitHub), dirigida con instrucciones de actuación,
velocidad natural. Respaldo: **es-AR-TomasNeural** (Tomás) con `videos/scripts/voz.py`, también sin acelerar. ElevenLabs gratis no sirve (no permite uso comercial).

## Skills de video

En `.claude/skills/` hay skills instaladas: oficiales de Remotion (`remotion-best-practices`, `remotion-create`, `remotion-render`, `remotion-captions`, `remotion-multimedia`, etc.) y de motion design / video corto (`short-form-video`, `caption-animation`, `beat-sync-editing`, `animation-principles`, `motion-art-direction`, `shot-composition`, `ad-creative-video`...). También HyperFrames de HeyGen (`hyperframes`, `hyperframes-cli`, `media-use`, `reverse-any-video`, `style-sampling`, `remotion-to-hyperframes`). Cargá solo las que la tarea necesite; las reglas de este archivo y del CREATIVE_BRIEF mandan sobre cualquier skill.

## Reglas de oro de los videos (no negociables)

1. Cuadro 0 = kiosco + amenaza: se reconoce al instante que es para dueños de kiosco o almacén.
2. Los primeros 0,3 s entran con toda la fuerza: voz potente, palabras que caen gigantes, golpe, temblor, destello.
3. Nunca quieto: algo pasa como máximo cada 0,7 s.
4. Todo lo que se ve, suena, según el contexto.
5. Al menos una comparación visual fuerte por video.
6. **Loop abierto:** el gancho promete algo que solo se revela al final, el misterio queda a la vista todo el video, hay un re-gancho a mitad y la app resuelve eso mismo como un truco. Ver la tabla de `videos/guiones/IDEAS_V4.md`.

Si un video rompe una de estas reglas, no está terminado.

## Cómo producir un video (y ahorrar tokens)

Cuando te pidan "producí el video NN":

0. Leé `videos/referencia/ESTANDAR-CALIDAD.md` y cumplilo en todo; manda sobre los pasos de abajo.
1. Leé **solo**: secciones 0, 4, 6 y 11 de `videos/referencia/CREATIVE_BRIEF.md`, y en `videos/guiones/IDEAS_V4.md` la estructura de loop abierto y el guion NN (los guiones 3D de `IDEAS_V3.md` ya hechos son referencia de código: `videos/CLAUDE.md`). Nada más.
2. Reutilizá los componentes que ya existen en `videos/src/components`. Creá solo los que falten.
3. Plan de 10 líneas como máximo y arrancás sin esperar aprobación.
4. Escribí cada archivo completo de una vez. No releas lo que acabás de escribir. Nada de búsquedas amplias en el repo.
5. Dependencias nuevas: un solo `npm install` al principio.
6. Verificá con `npx tsc --noEmit` y 3 imágenes de control (`npx remotion still`: cuadro 0, el del gancho y el del giro). El MP4 lo renderiza GitHub Actions.
7. Commit, push y un resumen de 3 líneas: qué hiciste y si hay algo que hacer desde el celular.

Antes de entregar, siempre el control de calidad de la sección 6 del estándar.

Criterio creativo: si algo del guion puede ser más loco, más impactante o más claro en el primer segundo, hacelo. 3D con `@remotion/three` y modelos hechos en código, todo determinista.

## Cómo construir una fase de la app (y ahorrar tokens)

Cuando te pidan "construí la fase N de la app":

1. Leé **solo** `app/BRIEF.md` (la sección de esa fase y las que nombra) y el código de `app/` que vayas a tocar.
2. Plan de 10 líneas como máximo y arrancás sin esperar aprobación. Si algo de Mercado Pago o Supabase depende de la documentación vigente, verificalo con una búsqueda antes de codear.
3. Escribí cada archivo completo de una vez. Dependencias: un solo `npm install` al principio.
4. Verificá con `npm run build`, los tests de la fase y una captura a 360 px de cada pantalla nueva (Playwright).
5. Commit, push y un resumen de 3 líneas + la **lista numerada de pasos desde el celular** (variables en Netlify, SQL en Supabase, etc.), si los hay.
6. Marcá la fase en el Estado de abajo.

Claves y secretos: nunca en el código. Si falta una variable, el código falla con un mensaje claro y vos le decís al dueño dónde cargarla.

## Estado

- [x] Videos: aviso "La persiana" en Remotion con voz `es-AR-TomasNeural` (detalle y pendientes en `videos/CLAUDE.md`).
- [ ] Videos: guiones de `IDEAS_V3.md` (hechos: 01 `Video01-ElDueno`, 02 `Video02-Banco`, 03 `Video03-SeHunde`, 06 `Video-v3-06-Basura`; faltan 04, 05, 07, 08).
- [ ] Videos: **V5-01 "Confesiones de un cuaderno de fiados"** (`videos/guiones/V5-01-CONFESIONES-CUADERNO.md`, aprobado, prioridad). Para producirlo: leé ese archivo en vez del guion de IDEAS_V4.
- [ ] Videos: guiones 01 a 08 de `videos/guiones/IDEAS_V4.md`.
- [ ] Videos v4 (`videos/guiones/IDEAS_V4.md`): hechos 01 `Video-v4-01-NumeroTapado` y 02 `Video-v4-02-TresErrores`; faltan 03 a 08 (el 08 es la parte 2 del 02).
- [ ] Videos V5 "Objeto que habla" (`videos/guiones/V5-01-CONFESIONES-CUADERNO.md`): hechos V5-01 `Video-v5-01-Confesiones` y V5-02 `Video-v5-02-Caja` (caja registradora); faltan heladera y góndola.
- [ ] Videos V7 "Rompe-esquemas" (`videos/guiones/V7-0N-*.md` + `videos/referencia/DIRECCION-V7.md`): hecho V7-01 `Video-v7-01-Record` ("Récord de ventas"; rompe-patrones en `videos/src/v7/rompe.tsx`); faltan V7-02 y V7-03.
- [x] Videos V8 (estándar de calidad nuevo): **V8-01 "¿Cuánto le queda de verdad a un kiosco?"** `Video-v8-01-CuantoLeQueda` (`videos/src/v8/`): explicador financiero, voz Orus de Gemini (`videos/scripts/voz_gemini.py`, tiempos con faster-whisper), pantalla real de la app (`app/scripts/grabar-v8-01.cjs`, `ENCLARO_DEMO=v8-01`). Créditos: `videos/salida/v8-01-creditos.txt`.
- [ ] Videos V6 "Expediente" (policial): **V6-01 "Autopsia de un kiosco"** (`videos/guiones/V6-01-AUTOPSIA-KIOSCO.md`) y **V6-02 "El ladrón que la cámara no ve"** (`videos/guiones/V6-02-LADRON-INVISIBLE.md`). Se anuncian entre sí: publicar en días seguidos. Para producirlos: leé ese archivo en vez del guion de IDEAS_V4.
- [ ] Videos V7 "Rompe-esquemas" (22 s, preguntas encadenadas, final falso, rebobinado, el video te habla): **V7-01 "Récord de ventas"**, **V7-02 "Los 3 kiosqueros"**, **V7-03 "El juego que no se puede ganar"** (`videos/guiones/V7-0N-*.md`). Para producirlos: leé ese archivo + `videos/referencia/DIRECCION-V7.md` en vez del guion de IDEAS_V4. Componentes nuevos en `src/v7/rompe.tsx`.
- [ ] Videos V8 que siguen (mismo sistema que el V8-01, uno por sesión y en este orden): **V8-02 "El cuaderno de los $380.000"** (`videos/guiones/V8-02-EL-CUADERNO.md`), **V8-03 "La caja llena miente"** (`V8-03-LA-CAJA-MIENTE.md`), **V8-04 "¿Cuál de estos 4 te hace perder plata?"** (`V8-04-CUAL-TE-HACE-PERDER.md`). Reutilizá `src/v8/`, `scripts/voz_gemini.py` y el grabador de la app (demo nueva por video: `ENCLARO_DEMO=v8-0N`).
- [x] App fase 0: landing + calculadora "tu número del día" + lista de espera (socios fundadores). Hecha en `app/` (Lighthouse móvil 93/96/100/100; falta cargar Supabase y Netlify, ver pasos).
- [x] App fase 1: fundaciones. Hecha en `app/`: esquema completo, `has_access()`, RLS, triggers, token hook (`app/supabase/migrations/20261114000000_esquema_y_acceso.sql`), auth en español (`/entrar`, `/registrarme`, `/recuperar`), PWA. 40 pruebas de seguridad de la base (`npm run test:db`, también en Actions). Falta cargar en Supabase y Netlify (ver pasos).
- [x] App fase 2: primer uso y bloqueo. `/app/bienvenida` (negocio → gastos fijos + comisión de cobro → 5 productos → "wow" con número del día, ranking y recordatorio .ics), precarga desde la calculadora, control de acceso en el momento (`app/app/layout.tsx`), vencimiento automático con pg_cron (`20261115000000_onboarding_y_vencidos.sql`). Prueba de punta a punta en `/prueba/bienvenida` (solo con `ENCLARO_MODO_PRUEBA=1`).
- [x] App fase 3: **sin IA ni servicios pagos** (decisión del dueño). Cierre por voz (reconocimiento del navegador + lector propio `lib/voz.ts`, entiende las 5 frases de `app/tests/voz.json`) o a mano, con tarjeta/QR y comisión (`guardar_cierre`, migración `20261116000000`); Tu día; Fiados con semáforo y recordatorio por WhatsApp; Precios con ranking y precio sugerido; Depósito (plata dormida); Ajustes. Datos por `lib/datos` (Supabase o memoria solo para pruebas). Recorrido a 360 px: `scripts/e2e-app.cjs` con `ENCLARO_MODO_PRUEBA=1`, cada carga < 1 s.
- [x] App fase 4: foto de factura y carteles, **gratis**. `/app/factura`: la foto se lee en el celular con Tesseract (servido desde `public/lector`, lo copia `scripts/copiar-lector.cjs` antes de cada build), `lib/factura.ts` saca renglones y cruza con la lista (100% en las 3 facturas de `app/tests/facturas/`); también "el proveedor aumentó X%". Carteles PNG (hoja A4 y estado de WhatsApp) en `lib/carteles.ts`. Prueba en navegador: `scripts/e2e-factura.cjs`.
- [x] App: pruebas completas contra Supabase real en GitHub Actions (recorrido de 2 usuarios + 26 escenarios en Chrome de Android y Safari de iPhone, también todas las noches). Problemas encontrados, causas, arreglos y qué hacer si vuelven: `app/PROBLEMAS.md` (todo error nuevo entra ahí con su prueba). Informe: https://claude.ai/artifact/3757SvLftn3ZRyv4wnvQvC
- [x] App: cierre entiende lo vendido por rubro/producto (plata o unidades, `lib/rubros.ts`, tabla `close_sales`) y descuenta stock; Tu día muestra lo más vendido y "te quedan pocos". Número principal = **ganancia** (ventas × margen − comisiones − otros gastos − fijos), aparte "entró a la caja". Informe de pruebas: Claude Docs "En Claro · Informe de pruebas".
- [x] App: **las contraseñas no se recuperan** (decisión del dueño): aviso al registrarse, botón «Ver», sin "me olvidé" ni link por mail; `/recuperar` solo explica.
- [x] App: link de socios fundadores `/fundadores` (cupo de 100 controlado por la base: `cupo_fundadores()`, `lugares_fundadores()` público, alta con `fundador: "si"` → plan fundador $12.900; lleno → $19.900). Migración `20261117020000`.
- [ ] App fase 5: pagos con Mercado Pago (sin mails: el dueño no quiere recuperación de cuentas). Mientras tanto, `/suscribirme` muestra el link de pago de Mercado Pago según el plan (`NEXT_PUBLIC_LINK_PAGO_FUNDADOR` $12.900 y `NEXT_PUBLIC_LINK_PAGO` $19.900, cargados en Netlify) y WhatsApp. Cuando alguien paga, el dueño pasa el mail y se habilita el mes por SQL (`subscriptions`: status active, current_period_end +30 días).
- [ ] App fase 6: admin, legal y pulido.
