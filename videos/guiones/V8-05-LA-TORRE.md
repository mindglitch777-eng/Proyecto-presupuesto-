# V8-05 · "La torre" (≈30 s)

> Estándar nuevo (`videos/referencia/ESTANDAR-CALIDAD.md`, leelo entero). Serie V8 con **más animación: comparaciones en 3D**.
> **Estilo 3D "render de producto"**: objetos y datos (billetes, cajas, kiosco), materiales realistas, luz suave de estudio con sombras, profundidad de campo,
> cámara con movimiento continuo. **Prohibido** low-poly de juguete y muñecos (fue el problema del V7-01). Personas: solo siluetas o ninguna.
> `@remotion/three` + modelos hechos en código, todo determinista. Voz **Orus** (Gemini) sin acelerar. Montos "(ejemplo)". Sin marcas. Nunca fotos CC BY-SA.

## Idea

Todo lo que vende un kiosco en un año, apilado en billetes de $1.000: una torre de 5,4 metros que atraviesa el techo.
Se le van arrancando bloques (mercadería, alquiler y luz, fiado, QR). Lo que queda es una pilita de 85 cm: le llega a la rodilla.

**Cuenta (ejemplo, misma base que el V8-01):** vende $150.000/día × 360 = **$54.000.000** = 54.000 billetes de $1.000 ≈ **5,4 m** (0,1 mm por billete).
Mercadería 65% −$35.100.000 (3,5 m) · alquiler y luz −$6.480.000 (65 cm) · fiado que no vuelve −$2.880.000 (29 cm) · comisión QR −$1.080.000 (11 cm)
→ queda **$8.460.000 ≈ 85 cm**.

## Preguntas (loops)

| Se abre | Pregunta | Se cierra |
|---|---|---|
| 0 s | ¿Cuánto de esta torre es tuyo? | 20 s |
| 5 s | ¿Hasta dónde te llega lo tuyo? (marca de altura en una figura de referencia) | 20 s |
| 15 s | "No te llega ni a la cintura" → ¿entonces hasta dónde? | 20 s |

## Voz (≈75 palabras)

Actuación: "Kiosquero argentino de 50 años, voseando, primero orgulloso mostrando la torre, después cada vez más serio; ritmo natural; pausa larga en (…)".

## Guion

| Seg. | Voz | Qué se ve (3D) | Sonido |
|---|---|---|---|
| 0–2 | "Esto es lo que vende un kiosco en un año." | **Cuadro 0:** frente del kiosco en 3D (toldo, vidriera, puerta), de noche, luz cálida. Al lado de la puerta, una **torre de billetes de $1.000** que sube y atraviesa el techo del encuadre. Texto: **"LO QUE VENDE EN UN AÑO"**. | Golpe grave + billetes que se acomodan |
| 2–5 | "Cincuenta y cuatro millones. Cinco metros de billetes." | La cámara **sube por la torre** (grúa rápida con desenfoque), regla lateral con marcas 1 m, 2 m… 5,4 m. Número **$54.000.000** arriba. | Whoosh ascendente + clac en cada metro |
| 5–7 | "¿Cuánto de esta torre es tuyo? ¿Hasta dónde te llega?" | La cámara baja rápido; al lado de la torre aparece una **silueta de referencia** de 1,75 m (plana, gris) con marcas: cabeza, cintura, rodilla. | Golpe + latido |
| 7–10 | "La mercadería se lleva treinta y cinco millones." | Un bloque enorme (3,5 m) **se separa de la torre** y sale volando hacia la calle, donde lo carga un camión de proveedor genérico. La torre baja de golpe con rebote. Número: **−$35.100.000**. | Crujido + whoosh + golpe al caer la torre |
| 10–13 | "Alquiler y luz, seis millones y medio." | Bloque de 65 cm sale hacia la persiana del local de al lado, que se cierra encima. **−$6.480.000**. | Persiana + golpe |
| 13–15 | "El fiado que no vuelve, casi tres millones. El QR, uno más." | Dos bloques chicos: uno se mete en un **cuaderno** 3D que se cierra; otro se desarma en monedas que se van por un cartel QR. | Tapa de cuaderno · monedas · golpes |
| 15–17 | "Te doy una pista: no te llega ni a la cintura." | **Re-gancho:** la marca de "cintura" de la silueta se pone roja y parpadea. La torre tapada con una lona que tiembla. | Latido creciente |
| 17–18 | (silencio 0,5 s) | La lona se queda quieta; sólo polvo en el aire iluminado. | Silencio |
| 18–21 | "Ocho millones. Ochenta y cinco centímetros. A la rodilla." | **Revelación + comparación:** se arranca la lona: una **pilita de 85 cm**, a la altura de la rodilla de la silueta. La cámara gira alrededor y muestra, en "fantasma" transparente, la torre de 5,4 m que había. Rótulos: **"VENDISTE: 5,4 m"** · **"TE QUEDÓ: 85 cm"**. | Lona + golpe grave |
| 21–27 | "En Claro te dice cada noche cuánto de lo que vendiste es tuyo. Para que la torre no te engañe." | **El truco:** pantalla real de la app (Tu día, `ENCLARO_DEMO=v8-05`) en un celular 3D que entra flotando al lado de la pilita; la pilita **crece un poco** a medida que la app marca dónde se va la plata. | "Ding" por dato |
| 27–30 | "¿Hasta dónde te llega a vos? Probalo gratis, link en el perfil." | Vuelve el plano del cuadro 0 con la torre entera. "Probalo gratis · link en el perfil". Último cuadro = cuadro 0. | Golpe que empalma |

## Notas de producción

- Billetes: textura propia genérica de $1.000 (sin copiar el diseño oficial; color y tamaño aproximados), apilados con instancias (`InstancedMesh`) para que rinda.
- Escala real coherente: 1 unidad = 1 m. La silueta mide 1,75 m.
- Control de calidad de la sección 6 antes de entregar. MP4 por chat + link directo de GitHub.
