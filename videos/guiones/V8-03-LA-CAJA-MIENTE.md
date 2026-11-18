# V8-03 · "La caja llena miente" (≈30 s)

> Estándar nuevo (`videos/referencia/ESTANDAR-CALIDAD.md`) · formato **F3 "Un día en el kiosco, con la cuenta en pantalla"** de `FORMATOS-VIRALES.md`.
> Estilo **explicador financiero** del V8-01 (`src/v8/`), voz **Orus** sin acelerar. Montos "(ejemplo)". Sin marcas. Nunca fotos CC BY-SA.

## Idea

Un día entero del kiosco en 20 segundos, con un reloj que corre. A las 22 la caja tiene $210.000 y aun así el dueño perdió plata.
¿Cómo? La caja llena no era suya: la mitad era del proveedor y $95.000 quedaron dormidos en el depósito en mercadería que no rota.
En Claro le muestra lo que es suyo de verdad y la plata dormida.

**Cuenta (ejemplo):** entró $210.000 · proveedor pagado en efectivo −$140.000 · comisión del QR −$3.600 · fijos del día −$36.300 = **$30.100 propios**.
Pero repuso $95.000 en productos que tardan meses en venderse → ese día **puso $64.900 más de lo que ganó** ("perdió plata").

## Preguntas (loops)

| Se abre | Pregunta | Se cierra |
|---|---|---|
| 0 s | ¿Cómo perdés plata con la caja llena? | 22 s |
| 9 s | ¿Qué pasó a las ocho de la noche? (hora tachada en el reloj) | 17 s |

## Voz (≈75 palabras)

Actuación: "Kiosquero argentino de 50 años, voseando, contando su día con orgullo al principio y desconcierto al final; ritmo natural; pausa larga en (…)".

## Guion

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2 | "Hoy la caja cerró con doscientos diez mil. Y perdí plata." | **Cuadro 0:** kiosco ilustrado con la persiana a medio bajar y la **caja registradora abierta, llena de billetes**. Texto: **"CAJA: $210.000"** (verde) y abajo, tachado en rojo, **"…Y PERDÍ PLATA"**. | Ding de caja + golpe |
| 2–4 | "Te muestro el día." | **Reloj grande** arriba (7:00). Arriba a la izquierda el contador **ENTRÓ** y a la derecha **ES TUYO**, los dos en $0. | Tic-tac que arranca con el pulso de la música |
| 4–9 | "Siete, abro. Ocho y cuarto, viene el proveedor: ciento cuarenta mil, en efectivo." | El reloj **gira rápido** (las agujas dan vueltas, el fondo pasa de mañana a mediodía). Clientes como siluetas planas que entran y salen; **ENTRÓ** sube sin parar. A las 8:15 entra el camión del proveedor (ilustración genérica) y una flecha saca **−$140.000** de **ES TUYO**. | Campanita por cliente · bocina corta · golpe en la resta |
| 9–11 | "Y a las ocho de la noche hice algo que todos hacemos." | **Re-gancho:** el reloj se frena en **20:00** con una cruz roja encima y un "?" que queda clavado. | Rayón corto + latido |
| 11–14 | "Comisión del QR, gastos del día…" | Dos restas rápidas en **ES TUYO**: −$3.600 (cartel de QR ilustrado) y −$36.300 (persiana + luz). **ES TUYO** queda en **$30.100**. | Pitido de cobro + golpe · persiana + golpe |
| 14–17 | "…y a las ocho repuse noventa y cinco mil en mercadería que tarda meses en venderse." | **Respuesta al re-gancho:** la cruz del reloj se va. Corte al depósito ilustrado: cajas que se apilan con **telarañas** y un rótulo **"PLATA DORMIDA: $95.000"**. **ES TUYO** baja a **−$64.900** y se pone rojo. | Cajas que caen en cadena + golpe grave |
| 17–18 | (silencio 0,5 s) | Solo el número **−$64.900** en el centro. | Silencio |
| 18–22 | "La caja llena no era mía. La mitad era del proveedor y el resto quedó dormido en el depósito." | **Comparación:** la caja de $210.000 se parte en bloques de colores: **PROVEEDOR $140.000** · **COMISIÓN Y GASTOS $39.900** · **DORMIDO EN EL DEPÓSITO $95.000**… y un bloquecito chico **TUYO**. Responde la pregunta del gancho. | Un golpe por bloque |
| 22–27 | "En Claro te dice cada noche cuánto es tuyo de verdad, y qué plata tenés dormida." | **El truco:** pantalla real de la app (`ENCLARO_DEMO=v8-03`): "Tu día" con lo que es tuyo y "Depósito" con los productos dormidos y su plata. | "Ding" por dato |
| 27–30 | "¿Tu caja te dice la verdad? Probalo gratis, link en el perfil." | Vuelve la caja llena del cuadro 0 con "Probalo gratis · link en el perfil". Último cuadro = cuadro 0. | Ding de caja que empalma |

## Notas de producción

- Reloj y fondo que cambian de mañana a noche son el "movimiento con sentido" de todo el video (nunca quieto).
- Pantalla real: la app ya tiene Tu día y Depósito (plata dormida). Demo nueva `ENCLARO_DEMO=v8-03` con estos números.
- Control de calidad de la sección 6 antes de entregar. MP4 por chat + link directo de GitHub.
