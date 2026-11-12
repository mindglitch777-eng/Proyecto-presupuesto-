# En Claro — instrucciones para Claude Code

En Claro es una app para dueños de kioscos, almacenes y dietéticas de Argentina: les dice cuánto les quedó de verdad,
qué producto les deja plata, a quién cobrarle los fiados y qué plata tienen dormida. Precio: $12.900/mes, 14 días gratis,
cobro solo por Mercado Pago.

## Cómo trabaja el dueño del proyecto

- Trabaja **solo desde el celular**, sin computadora. Todo se construye y se renderiza en este repositorio y en GitHub Actions.
- Cualquier paso manual (Supabase, Mercado Pago, Netlify, secretos de GitHub) se le da como **lista corta y numerada**,
  que se pueda hacer desde el navegador del teléfono.
- Una tarea grande por sesión. Al terminar: commit claro y push. Nunca dejes trabajo sin commitear.
- Todo el producto, los textos y los videos van en **español argentino con voseo**, sin jerga técnica.
- **Los videos se le entregan como MP4 directo en el chat** (`SendUserFile`), nunca como .zip ni artifacts de Actions
  (le resultan incómodos). Todo va en **la misma rama de trabajo**, sin ramas extra: el workflow arma el video y deja el MP4
  en `videos/salida/` de esa rama; hacé `git pull` y mandalo con `SendUserFile`. La matriz de `videos.yml` tiene solo el video
  en producción (los entregados quedan comentados): reemplazá la entrada por la del video nuevo.
  La matriz tiene solo el video en producción (los 9 ya entregados están en `videos/salida/`).
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

## Voz de los videos (decisión del dueño)

Todos los videos usan la voz argentina **es-AR-TomasNeural** (Tomás), generada con `videos/scripts/voz.py`
en GitHub Actions. Reemplaza a la voz del creador que menciona la sección 1 del brief.

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

1. Leé **solo**: secciones 0, 4, 6 y 11 de `videos/referencia/CREATIVE_BRIEF.md`, y en `videos/guiones/IDEAS_V4.md` la estructura de loop abierto y el guion NN (los guiones 3D de `IDEAS_V3.md` ya hechos son referencia de código: `videos/CLAUDE.md`). Nada más.
2. Reutilizá los componentes que ya existen en `videos/src/components`. Creá solo los que falten.
3. Plan de 10 líneas como máximo y arrancás sin esperar aprobación.
4. Escribí cada archivo completo de una vez. No releas lo que acabás de escribir. Nada de búsquedas amplias en el repo.
5. Dependencias nuevas: un solo `npm install` al principio.
6. Verificá con `npx tsc --noEmit` y 3 imágenes de control (`npx remotion still`: cuadro 0, el del gancho y el del giro). El MP4 lo renderiza GitHub Actions.
7. Commit, push y un resumen de 3 líneas: qué hiciste y si hay algo que hacer desde el celular.

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
- [ ] Videos: guiones de `IDEAS_V3.md` (hechos: 01 `Video01-ElDueno`, 02 `Video02-Banco`, 03 `Video03-SeHunde`).
- [ ] Videos: **V5-01 "Confesiones de un cuaderno de fiados"** (`videos/guiones/V5-01-CONFESIONES-CUADERNO.md`, aprobado, prioridad). Para producirlo: leé ese archivo en vez del guion de IDEAS_V4.
- [ ] Videos: guiones 01 a 08 de `videos/guiones/IDEAS_V4.md`.
- [ ] Videos v4 (`videos/guiones/IDEAS_V4.md`): hecho 01 `Video-v4-01-NumeroTapado`; faltan 02 a 08.
- [ ] Videos V5 "Objeto que habla" (`videos/guiones/V5-01-CONFESIONES-CUADERNO.md`): hecho V5-01 `Video-v5-01-Confesiones`; serie: heladera, góndola, caja registradora.
- [ ] App fase 0: landing + calculadora "tu número del día" + lista de espera (socios fundadores).
- [ ] App fase 1: fundaciones (esquema, RLS, `has_access()`, auth, PWA).
- [ ] App fase 2: onboarding y bloqueo.
- [ ] App fase 3: cierre con voz, ranking, fiado inteligente, plata dormida.
- [ ] App fase 4: foto de factura y carteles.
- [ ] App fase 5: pagos con Mercado Pago y emails.
- [ ] App fase 6: admin, legal y pulido.
