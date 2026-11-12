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
- **Los videos se le entregan como MP4 directo en el chat** (`SendUserFile`), nunca como .zip ni como artifacts de Actions
  (le resultan incómodos). El workflow deja los MP4 sueltos en la rama `videos-listos` (una sola confirmación que se pisa):
  `git fetch origin videos-listos` y `git show origin/videos-listos:<archivo>.mp4 > /ruta/archivo.mp4` para mandarlos.

## Estructura

- `videos/` — fábrica de videos verticales con Remotion.
  - `videos/referencia/CREATIVE_BRIEF.md` — la biblia creativa. **Leela completa antes de tocar cualquier video.**
  - `videos/referencia/animatic.html` — el aviso "La persiana" funcionando en el navegador. Su `render(t)` calcula
    cada elemento desde el tiempo, igual que `useCurrentFrame()`: portalo a Remotion sin adivinar.
- `app/` — (todavía no existe) el MVP de En Claro en Next.js + Supabase + Mercado Pago + Netlify.

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

## Estado

- [x] Videos: aviso "La persiana" en Remotion con voz `es-AR-TomasNeural` (detalle y pendientes en `videos/CLAUDE.md`).
- [ ] Videos: guiones de `IDEAS_V3.md` (hechos: 01 `Video01-ElDueno`, 02 `Video02-Banco`, 03 `Video03-SeHunde`).
- [ ] Videos: **V5-01 "Confesiones de un cuaderno de fiados"** (`videos/guiones/V5-01-CONFESIONES-CUADERNO.md`, aprobado, prioridad). Para producirlo: leé ese archivo en vez del guion de IDEAS_V4.
- [ ] Videos: guiones 01 a 08 de `videos/guiones/IDEAS_V4.md`.
- [ ] Videos v4 (`videos/guiones/IDEAS_V4.md`): hecho 01 `Video-v4-01-NumeroTapado`; faltan 02 a 08.
- [ ] App: MVP de En Claro (brief pendiente de subir a `app/BRIEF.md`).
