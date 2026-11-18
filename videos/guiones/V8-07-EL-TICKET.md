# V8-07 · "El ticket de 3 cuadras" (≈30 s)

> Estándar nuevo (`videos/referencia/ESTANDAR-CALIDAD.md`). Serie V8 con **comparaciones en 3D**, estilo **render de producto** (ver V8-05).
> `@remotion/three`, determinista. Voz **Orus** sin acelerar. Montos "(ejemplo)". Sin marcas. Nunca fotos CC BY-SA.

## Idea

La caja registradora imprime un ticket con todo lo que el kiosco perdió en el año sin darse cuenta. El ticket no para: sale por la puerta y recorre tres cuadras.
La cámara lo persigue para llegar al total, que está al final. Total: −$5.832.000. Desde arriba se ven las tres cuadras cubiertas de papel.
En Claro corta el ticket: cada noche muestra esas fugas cuando todavía se pueden arreglar.

**Cuenta (ejemplo, igual que V8-01 y V8-04):** productos vendidos a precio viejo $246.000/mes × 12 = $2.952.000 · fiado que no vuelve $8.000/día × 360 = $2.880.000
→ **TOTAL −$5.832.000**.

## Preguntas (loops)

| Se abre | Pregunta | Se cierra |
|---|---|---|
| 0 s | ¿Cuánto dice el total? (está al final del ticket) | 20 s |
| 5 s | ¿Hasta dónde llega el ticket? (contador de cuadras) | 17–20 s |
| 14 s | "Y todavía no llegamos al total" | 20 s |

## Voz (≈72 palabras)

Actuación: "Kiosquero argentino de 50 años, voseando, como relatando una persecución; acelera la emoción pero no la velocidad de habla; ritmo natural; pausa larga en (…)".

## Guion

| Seg. | Voz | Qué se ve (3D) | Sonido |
|---|---|---|---|
| 0–2 | "Este ticket tiene todo lo que perdiste este año sin darte cuenta." | **Cuadro 0:** mostrador del kiosco en 3D con la **caja registradora imprimiendo** un ticket que ya cae al piso en una montaña de papel. Texto: **"TODO LO QUE PERDISTE ESTE AÑO"**. | Impresora térmica continua + golpe |
| 2–4 | "Mide tres cuadras." | El ticket se arrastra por el piso y **sale por la puerta**; la cámara lo sigue. Arriba: **"CUADRA 1"**. | Whoosh + puerta |
| 4–9 | "Alfajor a precio viejo, menos doscientos cincuenta. El fiado de Marta, menos catorce mil. La yerba, menos cuatrocientos…" | **Persecución:** cámara baja a ras de vereda, a toda velocidad junto al ticket. Los renglones se leen al pasar (grandes, de a uno): "ALFAJOR PRECIO VIEJO −$250", "FIADO MARTA −$14.000 (ejemplo)", "YERBA −$400"… cada vez más rápido. | "Tic" de impresora por renglón, acelerando |
| 9–11 | "Galletitas: seis pesos. Seis." | El renglón **"GALLETITAS +$6"** pasa en cámara lenta (remate gracioso, guiño al V8-04) y vuelve la velocidad. | Monedita + vuelta al ritmo |
| 11–14 | — (ráfaga) | La cámara dobla la esquina: **"CUADRA 2"**. Los renglones pasan como un borrón; árboles, faroles y portones de barrio genéricos a los costados. | Ráfaga de tics + viento |
| 14–17 | "Y todavía no llegamos al total." | **Re-gancho:** **"CUADRA 3"**. Se ve a lo lejos el final del ticket, con un renglón grande tapado; la cámara acelera. | Latido + impresora que se frena |
| 17–18 | (silencio 0,5 s) | La cámara se frena encima del último renglón, tapado. | Silencio |
| 18–21 | "Cinco millones ochocientos treinta y dos mil." | **Revelación:** se destapa **"TOTAL: −$5.832.000 (ejemplo)"** en grande. | Golpe grave + impresora que corta el papel |
| 21–24 | "Tres cuadras de plata perdida." | **Comparación 3D:** la cámara **sube en grúa** y se ven desde arriba las tres cuadras con el ticket blanco serpenteando, y el kiosco chiquito al principio. Rótulo: **"PRECIOS VIEJOS $2.952.000 · FIADO $2.880.000"**. | Viento alto + golpe |
| 24–28 | "En Claro corta el ticket: cada noche te muestra esto en un renglón, cuando todavía lo podés arreglar." | **El truco:** una tijera de luz corta el ticket en la puerta del kiosco; el resto del papel desaparece hacia atrás. Pantalla real de la app (Tu día con alertas de precio viejo y fiados, `ENCLARO_DEMO=v8-07`) en un celular 3D. | Tijera + "ding" por alerta |
| 28–30 | "¿Cuánto mediría el tuyo? Probalo gratis, link en el perfil." | Vuelve el mostrador del cuadro 0 con la caja imprimiendo. "Probalo gratis · link en el perfil". Último cuadro = cuadro 0. | Impresora que empalma |

## Notas de producción

- Ticket: una cinta 3D (curva sobre el recorrido, textura generada por cuadro con los renglones), calles con bloques de fachadas genéricas simples pero con buena luz.
- Recorrido de cámara por cuadros clave (`camaraClaves`), con desenfoque de movimiento en la persecución.
- Control de calidad de la sección 6 antes de entregar. MP4 por chat + link directo de GitHub.
