# V7-03 · "El juego que no se puede ganar" (22 s)

> Serie **V7 "Rompe-esquemas"**. Cumple las 6 reglas de oro. **Antes de producir, leé `videos/referencia/DIRECCION-V7.md`.**
> Estética de videojuego retro hecha en código (sin personajes ni música de juegos existentes). Montos con "(ejemplo)". Sin marcas.

## Idea

Tu kiosco es un videojuego y lo vas perdiendo. Tres enemigos (el Fiador, la Inflación, el QR) te bajan la vida. GAME OVER falso.
El jefe final es tu propia silueta con un celular en la mano: "el enemigo sos vos sin tus números". El código secreto es En Claro: combo y K.O.

## Preguntas (loops)

| Se abre | Pregunta | Se cierra |
|---|---|---|
| 0 s | ¿Por qué no se puede ganar? | 12–14 s |
| 1,5 s | ¿Quién es el enemigo que está mirando este video? | 14–16 s |
| 9,5 s | ¿Cuál es el código secreto que "tenés en la mano"? | 16 s |

## Voz

Tomás como locutor de arcade: `rate` +30%, `pitch` +0Hz, gancho `volume` +20%. El susurro del seg. 9,5 con `volume` −30% y `rate` +5%.
~70 palabras.

## Guion

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–1,5 | "Este juego no se puede ganar." | **Cuadro 0:** pantalla de arcade (marco CRT, scanlines). El kiosco en 3D estilo bloque/píxel con toldo; arriba **"PLAYER 1: KIOSQUERO"** y la **barra de vida = tu caja** ya por la mitad, **sin números**. Explota el título **"NO SE PUEDE GANAR"** con letras de píxel que caen y rebotan. | Moneda de arcade insertada + golpe + acorde 8-bit |
| 1,5–3 | "Hay un enemigo que no aparece… y está mirando este video ahora." | Una **mira roja** recorre la pantalla buscando, se acerca a la cámara (al espectador) y se clava en el centro del lente. Texto: "ENEMIGO OCULTO: 1". | Pitido de radar + latido |
| 3–4,5 | "¡El Fiador!" | **Pelea 1:** cartel de pelea que entra en diagonal "ROUND 1 · EL FIADOR" (cuaderno con brazos). Golpe: **"−$14.000 (ejemplo)"** salta, la barra baja, **hit-stop** de 3 cuadros y temblor. | Cartel "round" (voz sintética 8-bit) · golpe · hit |
| 4,5–6 | "¡La Inflación!" | **Pelea 2:** "ROUND 2 · LA INFLACIÓN" (un globo con forma de precio que se infla). Te escupe etiquetas; los billetes de tu barra **se achican**. "−$9.000 (ejemplo)". | Globo inflándose · golpe · hit |
| 6–7,5 | "¡El QR!" | **Pelea 3:** "ROUND 3 · EL QR" (cuadrado con dientes) que **chupa monedas** de la barra. "−4% por cobro (ejemplo)". La barra queda parpadeando en rojo. | Succión · monedas · alarma de vida baja |
| 7,5–9 | — | **Rompe-patrón:** la pantalla **se traba** (glitch, cuadros repetidos, colores corridos), se rompe en píxeles y queda **"GAME OVER"**. | Glitch digital → silencio total |
| 9–11 | (susurro) "Hay un código secreto. Lo tenés en la mano." | **"CONTINUE? 9… 8… 7…"** gigante, con cada número golpeando. | Tic de cuenta regresiva por número |
| 11–14 | "¿Por qué no se puede ganar? Porque tu barra de vida… no tiene números." | **Jefe final:** entra una sombra gigante, la pantalla tiembla, cartel "FINAL BOSS". Zoom a la barra de vida: está **en blanco**, sin ningún número. Caen **"JUGÁS A CIEGAS"**. | Rugido grave sintetizado · temblor · golpe |
| 14–16 | "El enemigo… sos vos. Sin tus números." | **Revelación:** el jefe se da vuelta: es la **silueta del kiosquero con delantal y un celular en la mano**, en la misma pose que quien está mirando. Cartel del jefe: **"VOS SIN TUS NÚMEROS"**. La mira roja del seg. 1,5 se clava en él. | Silencio 0,3 s → golpe sub |
| 16–20 | "El código secreto: En Claro." | **Power-up:** cae un **celular dorado** con "EN CLARO" (≥55% del alto) y la barra de vida se llena **con números** ($41.300 hoy, ejemplo). **Combo de 3 golpes en 1,5 s**: cada enemigo vuelve y cae de un golpe con "K.O." (Fiador → "Cobrá a Marta $14.000", Inflación → "Precio sugerido +12%", QR → "Comisión ya restada"). Contador de COMBO ×1 ×2 ×3, lluvia de monedas, **"LEVEL UP"**. | Power-up · 3 K.O. distintos · monedas · fanfarria 8-bit |
| 20–22 | "Nivel dos desbloqueado. Probalo gratis." | "NIVEL 2 DESBLOQUEADO" + "Probalo gratis · link en el perfil". **Último cuadro = cuadro 0** (pantalla de arcade, barra por la mitad) para el loop. | Moneda de arcade (la misma del cuadro 0) |
