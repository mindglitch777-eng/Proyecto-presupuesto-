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

## Estructura

- `videos/` — fábrica de videos verticales con Remotion.
  - `videos/referencia/CREATIVE_BRIEF.md` — la biblia creativa. **Leela completa antes de tocar cualquier video.**
  - `videos/referencia/animatic.html` — el aviso "La persiana" funcionando en el navegador. Su `render(t)` calcula
    cada elemento desde el tiempo, igual que `useCurrentFrame()`: portalo a Remotion sin adivinar.
- `app/` — (todavía no existe) el MVP de En Claro en Next.js + Supabase + Mercado Pago + Netlify.

## Reglas de oro de los videos (no negociables)

1. Cuadro 0 = kiosco + amenaza: se reconoce al instante que es para dueños de kiosco o almacén.
2. Los primeros 0,3 s entran con toda la fuerza: voz potente, palabras que caen gigantes, golpe, temblor, destello.
3. Nunca quieto: algo pasa como máximo cada 0,7 s.
4. Todo lo que se ve, suena, según el contexto.
5. Al menos una comparación visual fuerte por video.

Si un video rompe una de estas reglas, no está terminado.

## Estado

- [x] Videos: aviso "La persiana" en Remotion con voz `es-AR-TomasNeural` (detalle y pendientes en `videos/CLAUDE.md`).
- [ ] App: MVP de En Claro (brief pendiente de subir a `app/BRIEF.md`).
