# V8-02 · "El cuaderno de los $380.000" (≈30 s)

> Estándar nuevo (`videos/referencia/ESTANDAR-CALIDAD.md`, leelo entero) · formato **F2 "El cobrador de fiados"** de `FORMATOS-VIRALES.md`
> (conflicto con humor: en Cali se viralizó un cobrador de deudas con parlante). Mismo estilo que el V8-01: **explicador financiero**,
> el número protagonista, íconos planos adultos (`src/v8/iconos.tsx`, sumá los que falten), voz **Orus** (Gemini, `"motor": "gemini"`), sin acelerar.
> Montos y nombres de pila "(ejemplo)". Sin marcas. Fotos: solo `public/tomas/v8-01/4-cuaderno-1.jpg` (dominio público) si suma; nunca CC BY-SA.

## Idea

Un cuaderno de fiados con $380.000 adentro. Las excusas clásicas aparecen como mensajes de WhatsApp y el contador de deuda sube con cada una.
La que más debe es la que más viene. Esa plata es casi un mes de alquiler. En Claro ordena los fiados por semáforo y te deja el mensaje listo para cobrar sin pelear.

## Preguntas (loops)

| Se abre | Pregunta | Se cierra |
|---|---|---|
| 0 s | ¿Cuánta plata hay en este cuaderno? (se ve "$???.???") | 15 s |
| 7 s | ¿Quién es la que más debe? (silueta tapada en la lista) | 13 s |
| 15 s | ¿Cómo cobrás sin perder al cliente? | 20–27 s |

## Voz (≈72 palabras, ritmo natural)

Actuación: "Kiosquero argentino de 50 años, voseando, entre resignado y gracioso, como contándole a un colega; ritmo natural; pausa larga donde hay (…)".

## Guion

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2 | "En este cuaderno hay plata. Mucha. Y no es tuya… todavía." | **Cuadro 0:** kiosco ilustrado de noche (el `Kiosco` del V8-01) y en primer plano un cuaderno de fiados grande que se abre de golpe. Arriba, el número tapado **"$???.???"** latiendo. Texto: **"TU CUADERNO DE FIADOS"**. | Golpe de tapa de cuaderno + ambiente de calle |
| 2–7 | "'Te lo traigo el viernes.' 'Se me rompió el celular.' 'Pasa mi hermano.'" | **Ráfaga de excusas** como burbujas de chat genéricas (sin logo de ninguna app) que entran desde los costados, una cada ~1,2 s, con golpecito. Con cada una, el contador **DEUDA** sube con conteo de dígitos: $48.000 → $96.500 → $155.000. | "Pop" de mensaje distinto por burbuja + clac del contador |
| 7–9 | "Y la que más debe…" | **Re-gancho:** la lista del cuaderno (nombres de pila de ejemplo con montos) y arriba de todo un renglón **tapado con corrector** que tiembla. | Latido + papel |
| 9–13 | "…es la que más viene. Todos los días. Con el chango lleno." | El corrector se raspa y aparece **"Marta — $62.000 (ejemplo)"**. Ilustración de una clienta de espaldas con una bolsa enorme entrando por la puerta; contador "VISITAS ESTE MES: 26" que sube rápido. | Raspado + campanita de puerta repetida (cada vez más rápido) |
| 13–15 | (silencio 0,5 s) "Trescientos ochenta mil." | Negro con textura, solo el número: **$380.000** se destapa por completo. | Silencio → golpe grave |
| 15–19 | "Eso es casi un mes de alquiler. Fiado." | **Comparación:** pantalla partida. Izquierda: el cuaderno con **$380.000**. Derecha: el recibo de **ALQUILER $450.000 (ejemplo)** que se llena como una barra hasta el 84%. Rótulo: **"CASI UN MES DE ALQUILER"**. | Barra que sube + golpe |
| 19–26 | "En Claro te ordena los fiados por color: rojo, a cobrar ya. Y te deja el mensaje listo, con respeto, para mandar por WhatsApp." | **El truco:** pantalla real de la app (Fiados con semáforo), grabada como en el V8-01 (`ENCLARO_DEMO=v8-02`, misma lista y montos). Se toca el rojo → aparece el mensaje de recordatorio armado. El contador **DEUDA** empieza a bajar. | "Ding" por cada fiado que pasa a verde |
| 26–30 | "¿Cuánto tenés vos en el cuaderno? Contalo en los comentarios. Probalo gratis, link en el perfil." | Vuelve el cuaderno del cuadro 0, con **"$???.???"** y "Probalo gratis · link en el perfil". Último cuadro = cuadro 0. | Golpe de tapa que empalma con el inicio |

## Notas de producción

- La app ya tiene Fiados con semáforo y recordatorio por WhatsApp (fase 3): grabar la pantalla real, no dibujarla.
- Las burbujas de chat son genéricas (verde y blanco propios, sin el logo ni la interfaz exacta de WhatsApp).
- Control de calidad de la sección 6 del estándar antes de entregar. MP4 por chat + link directo de GitHub.
