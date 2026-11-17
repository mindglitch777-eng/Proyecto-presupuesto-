# V8-01 · "¿Cuánto le queda de verdad a un kiosco?" (≈30 s)

> Primer video con el **estándar nuevo** (`videos/referencia/ESTANDAR-CALIDAD.md`, leelo entero antes) y el formato **F1** de
> `videos/referencia/FORMATOS-VIRALES.md` ("cuánto gana un…", género viral en toda Latinoamérica).
> Montos con "(ejemplo)". Sin marcas visibles. Nada de muñecos 3D ni metáforas: imagen real + números.

## Idea

Un kiosco que vende $150.000 por día. La gente adivina cuánto le queda. Se va restando sobre imágenes reales: mercadería, alquiler y luz,
fiado que no vuelve, comisión del QR. Le quedan $23.500… y el dueño cree que gana más del doble. En Claro le hace esa cuenta sola cada noche.

**Cuenta (ejemplo):** 150.000 − 97.500 (mercadería, 65%) − 18.000 (alquiler y luz del día) − 8.000 (fiado que no vuelve) − 3.000 (4% de comisión sobre $75.000 cobrados con QR) = **$23.500**.

## Imagen (todo real, sin filmar nada el dueño)

Script nuevo `videos/scripts/tomas.py` en GitHub Actions: busca en la **API de Wikimedia Commons** (sin clave) y, si está `PIXABAY_API_KEY`, en Pixabay.
Solo licencias que permitan uso comercial (dominio público, CC0, CC BY, CC BY-SA); las que piden crédito van a `videos/salida/v8-01-creditos.txt`.
Commons tiene sobre todo **fotos**: está bien. Cada foto se usa con movimiento de cámara (empuje lento, paneo, pequeño temblor de mano) y nunca quieta más de 0,7 s.

Búsquedas (en este orden, guardar las 3 mejores de cada una en `videos/public/tomas/v8-01/`):
1. `kiosco Buenos Aires` · `kiosk Argentina` · `kiosco golosinas` (fachada con golosinas y rejas: es el cuadro 0)
2. `almacén de barrio Argentina` · `góndola almacén` (mercadería)
3. `persiana metálica local` · `medidor de luz` (alquiler y luz)
4. `cuaderno anotaciones` · `libreta manuscrita` (fiado)
5. `billetes pesos argentinos` · `caja registradora` (la plata)
6. `código QR pago comercio` (comisión)

Claude mira una hoja de contacto de lo bajado y elige. Si una búsqueda no trae nada usable, se reemplaza por otra palabra clave (no por un dibujo).
**Pantalla de la app:** grabada de la app real (`app/`, `ENCLARO_MODO_PRUEBA=1`, Playwright a 360 px) mostrando el cierre del día con estos mismos números.

## Voz

**Gemini TTS** (`GEMINI_API_KEY`, modelo de voz del plan gratis), voz masculina adulta. Instrucción de actuación para todo el texto:
"Hablá como un kiosquero argentino de 50 años, voseando, tono de charla entre colegas, un poco indignado, ritmo natural, sin apurarte."
Antes de producir: generar la línea del gancho con **3 voces distintas** y dejar los 3 MP3 en `videos/salida/v8-01-pruebas-voz/` para que el dueño elija.
Si Gemini falla o suena con acento neutro/mexicano marcado, respaldo `es-AR-TomasNeural` **sin acelerar**. Prohibido acelerar cualquier voz.

## Guion

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2 | "Este kiosco vende ciento cincuenta mil por día." | **Cuadro 0:** foto real de un kiosco de barrio (golosinas, rejas), empuje lento. Texto grande desde el cuadro 0: **"VENDE $150.000 POR DÍA"** y abajo **"¿CUÁNTO LE QUEDA?"**. | Golpe seco + ambiente de calle |
| 2–4 | "¿Cuánto le queda? Decilo en los comentarios antes del final." | Tres opciones grandes que entran una por una: **A $80.000 · B $50.000 · C $23.500** (orden mezclado en pantalla para no regalar la respuesta). | Tres "clic" de botón |
| 4–8 | "Primero, la mercadería. Noventa y siete mil quinientos." | Corte a góndola/almacén real. El número **$150.000** arriba baja rodando dígito por dígito a **$52.500**. Rótulo chico: "mercadería". | Caja registradora + golpe al terminar el conteo |
| 8–11 | "Alquiler y luz del día: dieciocho mil." | Corte a persiana metálica / medidor. El número baja a **$34.500**. | Persiana + golpe |
| 11–13 | "Y ya descartaste la A." | **Re-gancho:** la opción A se tacha con un trazo rojo y vuela. | Tachón + "buzzer" corto |
| 13–17 | "El fiado que no vuelve: ocho mil. La comisión del QR: tres mil." | Corte a cuaderno manuscrito (sin nombres reales legibles), después a cartel de QR. Dos bajas rápidas: **$26.500** → **$23.500**. | Hoja de cuaderno + golpe · pitido de cobro + golpe |
| 17–18 | (silencio 0,5 s) | Pantalla con la foto del kiosco oscurecida, solo el número en el centro. | Silencio total |
| 18–21 | "Le quedan veintitrés mil quinientos. Y él cree que gana cincuenta." | **Revelación + comparación:** pantalla partida: **"LO QUE CREE: $50.000"** (verde) contra **"LO QUE LE QUEDA: $23.500"** (rojo, más grande). La B se tacha. | Golpe grave |
| 21–27 | "Esta cuenta, En Claro te la hace sola. Decís lo que vendiste esta noche y te dice cuánto te quedó de verdad." | **El truco:** pantalla real de En Claro (≥55% del alto, con marco de celular) haciendo el cierre: aparece "Hoy te quedaron $23.500 (ejemplo)" y la lista de dónde se fue. | "Ding" por cada renglón |
| 27–30 | "¿Cuánto habías dicho vos? Probalo catorce días gratis, link en el perfil." | Vuelve el kiosco del cuadro 0 con "¿CUÁNTO LE QUEDA?" y "Probalo gratis · link en el perfil". Último cuadro = cuadro 0. | Golpe que empalma con el inicio |

## Capa gráfica (código, Remotion o HyperFrames)

- Máximo 2 textos a la vez + subtítulos palabra por palabra (los de siempre, 1–3 palabras).
- El número principal arriba, grande (≥ 140 px en 1080), con conteo de dígitos y "clac" al terminar.
- Fotos: recorte a 9:16, mismo color (un poco cálido y contrastado), grano suave encima.
- Música con pulso a −18 dB que se corta en el silencio del seg. 17 y vuelve en el truco.

## Entrega

1. Primero los 3 MP3 de prueba de voz y la hoja de contacto de tomas → mandárselos al dueño para que elija voz.
2. Después el MP4 con el control de calidad de la sección 6 del estándar (puntaje por punto en el resumen).
