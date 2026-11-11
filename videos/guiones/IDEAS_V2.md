# Guiones v2 — más locos, más virales

> Antes de producir cualquiera: `videos/referencia/CREATIVE_BRIEF.md` (reglas de oro) y el aviso "La persiana" ya renderizado.
> Cada guion trae un **concepto visual propio** (no es otra vez "números sobre fondo"), un gancho que pega en 0,3 s,
> una comparación física y su sonido. La voz es `es-AR-TomasNeural`: gancho `+25%` y gritado, resto `+15%`.
> Montos marcados "ejemplo" en pantalla. Datos reales con su fuente.

## Lo que aprendimos del primer render

- **El gancho del dominó funciona.** Se repite la fórmula: objeto del rubro + golpe + amenaza directa.
- **El medio se cae (14–26 s):** fondo desenfocado oscuro y celular chico. Regla nueva: **el celular nunca ocupa menos
  del 55% del alto**, la cámara entra a la pantalla (zoom dentro de la interfaz) y cada tarjeta que sale tiene un objeto
  real al lado (el cuaderno, la factura, la gaseosa) para que no sea "una app más".
- **Cada video necesita un mundo visual distinto.** Si todos son el mismo kiosco, el público lo scrollea al tercero.
  El `Kiosco` se mantiene como firma (cuadro 0 o cierre), pero el concepto cambia.

---

## 01 · "La autopsia" — estilo policial (30 s)

**Gancho (0–2 s):** cinta amarilla "ESCENA DEL CRIMEN" cruza la pantalla de golpe (dos cintas en X, con temblor) sobre un kiosco cerrado.
Voz: **"¡Este kiosco murió! Vamos a ver quién lo mató."**

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2 | gancho | Cintas en X, flash de cámara de policía, número de evidencia "N° 1" | golpe + obturador |
| 2–6 | "Sospechoso número uno: el fiado." | Bolsa de evidencia con el cuaderno adentro; rayos X sobre el cuaderno revelan "$180.000" brillando | obturador + zumbido de rayos X |
| 6–10 | "Sospechoso dos: el precio viejo." | Ficha policial (foto de frente y de perfil) de una etiqueta de precio con antifaz, "−$22.400 por semana" | sello de goma |
| 10–14 | "Sospechoso tres: la mercadería que no se vende." | Caja polvorienta en el depósito con huellas marcadas, "$37.800 dormidos" | ruido de polvo + sello |
| 14–20 | "Los tres trabajaban juntos. Y nadie los vio." | Pizarra de detective: hilos rojos que unen las tres fichas con el kiosco al centro | hilo tensándose ×3 |
| 20–26 | "En Claro los ve antes de que sea tarde." | El celular (grande) escanea la pizarra y cada ficha se vuelve una tarjeta de la app con la solución | escáner + caja registradora |
| 26–30 | "Caso cerrado. Tu kiosco, abierto." | Sello gigante "CASO CERRADO" y la persiana sube. Logo y CTA | sello + traqueteo de persiana |

Componentes nuevos: `CintaPolicial`, `BolsaEvidencia`, `RayosX`, `FichaPolicial`, `PizarraHilos`, `Sello`.

---

## 02 · "Cámara de seguridad" — te roban de noche (28 s)

**Gancho:** imagen de cámara de seguridad en blanco y negro con ruido, "REC ●" titilando y la hora "03:14:07".
Un ladrón entra al kiosco. Voz: **"¡Te están robando todas las noches… y no te diste cuenta!"**

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2,5 | gancho | Cámara CCTV con líneas de barrido, ladrón en silueta | zumbido de video + golpe |
| 2,5–7 | "Mirá bien." | Zoom digital pixelado (estilo película de espías) sobre el ladrón: "ENHANCE" ×2, la imagen se aclara | bips de zoom |
| 7–12 | "No es un chorro. Es tu precio viejo." | La silueta se da vuelta: es una etiqueta de precio con antifaz y bolsa de monedas | golpe + risa malvada corta |
| 12–18 | "Cada vez que el proveedor aumenta y vos no, se lleva doce mil por semana." | Rebobinado tipo VHS de la semana: lunes a domingo, un contador rojo suma en la esquina | rebobinado VHS + tic |
| 18–25 | "Sacale foto a la factura y En Claro te dice a cuánto vender." | La cámara pasa a color, el celular ocupa media pantalla, escanea la factura, los precios giran | escáner + giros |
| 25–28 | "Ladrón atrapado." | Esposas que se cierran sobre la etiqueta de precio. Logo | clic de esposas + caja |

Componentes nuevos: `CamaraSeguridad`, `ZoomEnhance`, `RebobinadoVHS`.

---

## 03 · "Game over" — tu kiosco como videojuego (30 s)

**Gancho:** pantalla de videojuego retro en pixel art: "GAME OVER" gigante en rojo sobre un kiosco pixelado.
Voz: **"¡Game over! Así termina tu kiosco si seguís jugando a ciegas."**

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2 | gancho | GAME OVER con parpadeo, el personaje kiosquero cae | sonido 8 bits de muerte |
| 2–5 | "Rebobinemos." | Rebobinado rápido con efecto de cinta | rebobinado |
| 5–14 | "Barra de vida: tu plata. Enemigos: el fiado, el aumento, la luz." | Pantalla de juego: barra de vida "PLATA" arriba; enemigos pixelados (cuaderno, flecha de aumento, lamparita) le pegan al kiosquero y la barra baja con números rojos que saltan | golpes 8 bits, alarma de vida baja |
| 14–20 | "Pero hay un power-up." | Una caja "?" gira; sale el celular de En Claro brillando | moneda de videojuego + fanfarria |
| 20–26 | "Te dice a quién cobrarle, a cuánto vender y qué no reponer." | El kiosquero agarra el power-up: aura amarilla, derrota a cada enemigo con un golpe, la barra de vida sube | power-up + golpes |
| 26–30 | "Nivel superado. Probalo gratis 14 días." | "NIVEL SUPERADO" + puntaje "+$45.000/mes (ejemplo)". Logo | jingle de victoria |

Componentes nuevos: `PixelArt`, `BarraDeVida`, `EnemigoPixel`, `CajaPowerUp`. Paleta de 16 colores + verde y amarillo de la marca.

---

## 04 · "Cerrás en 127 días" — cuenta regresiva (25 s)

**Gancho:** un contador gigante tipo bomba de película, rojo, que baja: "CERRÁS EN 127 DÍAS". Voz: **"¡A este ritmo, cerrás en ciento veintisiete días!"**

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2 | gancho | Display rojo de 7 segmentos con cables, contador bajando | tic-tac fuerte + golpe |
| 2–9 | "Tenés quinientas mil de ahorro. Cada mes perdés cuarenta y cinco mil sin saberlo… y cada mes vendés menos." | Reloj de arena gigante: la arena es plata (monedas cayendo) y la parte de arriba dice "TU AHORRO"; por un agujero lateral se escapa más plata | monedas cayendo constante |
| 9–15 | "Nadie te avisa. El cuaderno no te avisa." | El cuaderno al lado del reloj, mudo; la arena se acelera | tic-tac más rápido + latido |
| 15–21 | "En Claro te avisa." | Mano que agarra el reloj y tapa el agujero: el celular muestra la alerta "Esta semana vendiste menos que tu número del día" | golpe + caja |
| 21–25 | "Desactivá la bomba. Probalo gratis." | Cable cortado, el contador se congela y se pone verde. Logo | corte de tijera + alivio |

Cuenta de ejemplo para que cierre: ahorro $500.000; pérdida que crece de $45.000 a ~$75.000 por mes ⇒ ~127 días.
Claude Code calcula la cuenta exacta en `guiones/04.json` y ajusta el número para que dé (siempre "ejemplo").

---

## 05 · "Dos kioscos iguales" — pantalla dividida (30 s)

**Gancho:** pantalla partida al medio con dos kioscos idénticos. Voz: **"Estos dos kioscos venden lo mismo. ¡Uno cierra en marzo!"**

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2 | gancho | Split vertical; los dos con el mismo cartel "$3.000.000/mes" | golpe |
| 2–8 | "La diferencia no está en lo que venden." | Los dos dueños (ilustrados) atienden en espejo; todo igual | ritmo con clic |
| 8–18 | "Uno sabe sus números. El otro anota en un cuaderno." | A la izquierda: góndola que se vacía, persiana que baja, fiado que crece. A la derecha: carteles nuevos, góndola llena, el dueño mira el celular. Cada acción en un lado tiene su espejo en el otro | golpes metálicos a la izquierda, cajas registradoras a la derecha |
| 18–24 | "Marzo." | Calendario que vuela hasta marzo; el de la izquierda cierra con golpe, el de la derecha se ilumina | golpe enorme + campanita |
| 24–30 | "¿Cuál querés ser? En Claro, 14 días gratis." | La línea del medio se vuelve el celular; logo | whoosh + caja |

Componentes nuevos: `PantallaDividida` (dos escenas sincronizadas), `DuenoIlustrado`.

---

## 06 · "Te pago el viernes" — chat de excusas (25 s)

**Gancho:** avalancha de notificaciones de WhatsApp que tapan la pantalla. Voz: **"¿Cuántas veces te dijeron 'te pago el viernes'?"**

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2 | gancho | 15 notificaciones caen en cascada con vibración de pantalla | ráfaga de "ding" + vibración |
| 2–10 | — (se leen) | Chat ilustrado (no WhatsApp real): "te pago el viernes" · "el lunes sin falta" · "cobro el 5" · "uy me olvidé"; cada mensaje tiene un sello de fecha que se tacha | pop de mensaje + tachado |
| 10–15 | "Mientras, son dieciocho mil que no tenés para reponer." | Los mensajes se convierten en billetes que vuelan fuera de la pantalla | viento + monedas |
| 15–22 | "En Claro te avisa el día que cobra… y le escribe por vos, amable." | Celular grande: semáforo de fiados y mensaje que se escribe solo | tipeo + envío |
| 22–25 | "Y esta vez, paga." | Notificación "Marta te pagó $18.000" con confeti. Logo | caja registradora + confeti |

Componentes nuevos: `AvalanchaNotificaciones`, `ChatIlustrado`, `Confeti`.

---

## 07 · "La balanza" — comparación física (22 s)

**Gancho:** 40 latas de gaseosa caen del cielo sobre una balanza gigante y la hunden. Voz: **"¡Cuarenta gaseosas… te dejan lo mismo que esto!"**

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2,5 | gancho | Lluvia de latas con física (rebotan) sobre un plato | latas golpeando |
| 2,5–6 | — | Del otro lado caen 17 alfajores y la balanza queda pareja | 17 golpecitos + "ding" |
| 6–12 | "Cargar el cajón, enfriarlas, pagar la luz de la heladera… para ganar lo mismo." | Heladera al lado con medidor de luz girando, cajones apilándose | zumbido de heladera |
| 12–18 | "En Claro te muestra qué te deja plata de verdad." | La balanza se transforma en el ranking de margen de la app, gigante | whoosh + caja |
| 18–22 | "¿Cuál es el tuyo? Comentalo." | Pregunta gigante, logo | golpe |

Componentes nuevos: `Fisica` (caída con rebote, puede ser simulación propia por cuadro, sin librerías que no sean deterministas), `Balanza`.

---

## 08 · "Rayos X a tu caja" (25 s)

**Gancho:** la caja registradora del mostrador se vuelve transparente con un efecto de rayos X y adentro hay… casi nada. Voz: **"¡Mirá lo que hay de verdad en tu caja!"**

Beats: billetes que aparecen y se van uno por uno con etiquetas ("proveedor", "alquiler", "luz", "fiado") hasta que queda una moneda sola girando · "Esto es lo tuyo" · En Claro hace los rayos X todos los días · la caja se llena de luz amarilla.

Componentes nuevos: `RayosX` (compartido con 01).

---

## Hooks de reserva para A/B (usar con el dominó o con cualquier concepto)

- "¡Si tenés un kiosco, NO repongas hasta ver esto!"
- "¡Este es el error que cierra kioscos!"
- "¡Le hice las cuentas a un kiosco y casi lloro!"
- "¡Tu cuaderno de fiados te está fundiendo!"
- "¡El súper te está robando clientes y vos lo ayudás!"
- "¡Ganás menos por hora que tu repartidor!" (solo si se consigue el dato real, con fuente)

## Orden de producción sugerido

1. **02 Cámara de seguridad** y **04 Cuenta regresiva**: los conceptos más distintos al primero y los más fáciles de entender sin sonido.
2. **01 La autopsia** y **03 Game over**: los más "virales" por formato, requieren más componentes nuevos.
3. **05**, **06**, **07**, **08**: reutilizan casi todo lo anterior.

Para cada uno: animatic rápido en HTML (como `referencia/animatic.html`) solo si el concepto es nuevo → JSON → render → revisar contra las reglas de oro.
