# V8-04 · "¿Cuál de estos 4 te hace perder plata?" (≈30 s)

> Estándar nuevo (`videos/referencia/ESTANDAR-CALIDAD.md`) · formato **F4 "Precio de antes vs. precio de hoy"** de `FORMATOS-VIRALES.md`, en versión juego
> (el espectador elige, se da vuelta carta por carta). Estilo **explicador financiero** del V8-01, voz **Orus** sin acelerar.
> Productos **genéricos, sin marcas** (dibujados planos). Montos "(ejemplo)". Nunca fotos CC BY-SA.

## Idea

Cuatro productos de kiosco con su precio de venta. Uno o más se venden por debajo de lo que cuesta reponerlos porque el proveedor aumentó y el precio quedó viejo.
El espectador juega a adivinar cuál. Se dan vuelta las cartas: son tres de cuatro. Multiplicado por lo que se vende, son $246.000 por mes que se pierden sin enterarse.
En Claro lee la foto de la factura, avisa "el proveedor aumentó X%" y sugiere el precio nuevo.

**Cartas (ejemplo):**
1. Alfajor: lo vende a $1.200 · reponerlo cuesta $1.450 → **pierde $250**
2. Gaseosa 1,5 L: vende $2.250 · cuesta $1.600 → **gana $650 ✓**
3. Yerba 1 kg: vende $3.900 · cuesta $4.300 → **pierde $400**
4. Galletitas: vende $1.100 · cuesta $1.050 + comisión del QR $44 → **le deja $6** (empate, cuenta como perdida)

Por día: 20 alfajores × $250 + 8 yerbas × $400 = $8.200 → **×30 = $246.000 por mes**.

## Preguntas (loops)

| Se abre | Pregunta | Se cierra |
|---|---|---|
| 0 s | ¿Cuál de los 4 te hace perder plata? (elegí uno) | 7–17 s, carta por carta |
| 12 s | "Ojo con la última" | 15–17 s |
| 17 s | ¿Cuánto es eso por mes? | 21 s |

## Voz (≈78 palabras)

Actuación: "Kiosquero argentino de 50 años, voseando, como conductor de un juego de la tele pero en tono de barrio; picante, ritmo natural; pausa larga en (…)".

## Guion

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2 | "Uno de estos cuatro te está haciendo perder plata. ¿Cuál?" | **Cuadro 0:** mostrador de kiosco ilustrado y **4 cartas grandes** boca arriba, cada una con el producto dibujado y su precio de venta. Texto: **"¿CUÁL TE HACE PERDER PLATA?"**. | Golpe + 4 "clac" de cartas que caen |
| 2–4 | "Elegí uno. Ya. Dale." | Números 1-2-3-4 sobre las cartas y una cuenta regresiva de 3 en el centro. | Tic por número |
| 4–7 | "Primera. El alfajor: lo vendés a mil doscientos… reponerlo te cuesta mil cuatrocientos cincuenta." | La carta 1 **se da vuelta** (giro con perspectiva): atrás aparece la factura con el costo nuevo. Sello rojo **"−$250 POR CADA UNO"**. | Giro de carta + sello |
| 7–10 | "La gaseosa, tranquilo: te deja seiscientos cincuenta." | Carta 2 se da vuelta: tilde verde **"+$650 ✓"**. Alivio breve. | Giro + "ding" positivo |
| 10–12 | "La yerba: cuatrocientos abajo." | Carta 3: **"−$400 POR CADA UNO"**. | Giro + sello |
| 12–14 | "Y ojo con la última, que parece que está bien…" | **Re-gancho:** la carta 4 tiembla, la cámara se acerca despacio. | Latido creciente |
| 14–17 | "…te deja seis pesos. Seis. Con la comisión del QR, es como regalarla." | Carta 4: **"+$6"** chiquito que se cae del borde. Las cartas 1, 3 y 4 se ponen rojas: **"3 DE 4"**. | Giro · monedita que cae · golpe |
| 17–18 | (silencio 0,5 s) "¿Y por mes?" | Las cartas se apilan; solo queda el número tapado **"$???.???"**. | Silencio → golpe |
| 18–21 | "Doscientos cuarenta y seis mil pesos por mes. Vendiendo." | **Revelación + comparación:** **$246.000/MES** gigante en rojo. Al lado, la pila de alfajores y yerbas que vendió ese mes "regalando" plata. | Golpe grave + caja registradora al revés |
| 21–27 | "Sacale una foto a la factura y En Claro te avisa: 'el proveedor aumentó veintiuno por ciento', y te dice a cuánto vender." | **El truco:** pantalla real de la app (`/app/factura`, `ENCLARO_DEMO=v8-04`): foto de una factura de ejemplo, renglones leídos, aviso de aumento y precio sugerido. Las cartas rojas se vuelven verdes una por una. | "Ding" por carta que pasa a verde |
| 27–30 | "¿Cuál habías elegido? Comentalo. Probalo gratis, link en el perfil." | Vuelven las 4 cartas del cuadro 0 con "Probalo gratis · link en el perfil". Último cuadro = cuadro 0. | 4 "clac" que empalman con el inicio |

## Notas de producción

- La app ya tiene foto de factura con aviso de aumento y precio sugerido (fase 4). Usar una factura de ejemplo de `app/tests/facturas/` o una nueva sin datos reales.
- Productos genéricos dibujados (sin etiquetas reales). La galletita de $6 tiene que dar risa: es el remate.
- Control de calidad de la sección 6 antes de entregar. MP4 por chat + link directo de GitHub.
