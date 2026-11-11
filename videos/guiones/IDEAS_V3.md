# Guiones v3 — identificables al instante, comparaciones locas, 3D

> Reemplaza a `IDEAS_V2.md` (de ahí solo sobrevive "Cámara de seguridad", mejorado, como 08).
> Leer antes: reglas de oro en `videos/referencia/CREATIVE_BRIEF.md`.

## La regla del cuadro 0 (obligatoria para estos 8)

El primer cuadro, sin sonido y sin leer de más, tiene que decir **"esto es para un kiosquero y le duele"**. Lleva siempre tres cosas:

1. **Un objeto del rubro ocupando al menos el 40% de la pantalla:** persiana, toldo rayado, heladera de bebidas, cuaderno de fiados, mostrador con caja.
2. **El llamado:** "KIOSQUERO:" o "ALMACENERO:" en la píldora amarilla.
3. **La herida en 5 palabras o menos**, gigante, ya golpeando en el cuadro 0 (nada de entrar desde negro).

## 3D

Usar `@remotion/three` (React Three Fiber) con modelos **hechos en código** (cajas, cilindros, low-poly con colores planos de la marca),
sin descargar modelos externos. Luz cálida de kiosco, sombras suaves, cámara que siempre se mueve.
Para renderizar en GitHub Actions configurar `chromiumOptions.gl` (probar `"angle"` y si falla `"swangle"`) y verificarlo en la doc de Remotion.
Todo determinista: nada de `Math.random()` sin semilla, nada de física en tiempo real; la "física" se calcula por cuadro.

---

## 01 · "El dueño del local gana más que vos" (28 s) · 3D

**Cuadro 0:** tu kiosco en 3D, de frente, con la persiana a media altura. Píldora "KIOSQUERO:" y gigante: **"EL DUEÑO GANA MÁS QUE VOS"**. Un billete gigante sale volando por la puerta hacia arriba.

**Gancho (voz, gritado):** "¡El dueño del local gana más que vos… con TU kiosco!"

**La comparación loca:** dos podios 3D que crecen desde el piso. En uno, un muñeco con traje y una llave gigante (el dueño del local) sube hasta "$400.000". En el otro, el kiosquero con delantal sube hasta "$350.000" y queda más abajo. La cámara gira alrededor de los dos.

- **2–8 s** · "Vendés tres millones. Alquiler: cuatrocientas. A vos te quedan trescientas cincuenta." Los podios crecen al ritmo de los números; cada número golpea.
- **8–13 s** · "Él no abre a las ocho. No atiende. No fía." El muñeco del dueño en una reposera con anteojos de sol arriba del podio; el kiosquero atiende, carga cajones, anota fiados, todo acelerado.
- **13–18 s** · "Y vos ni sabías esta cuenta." Corte seco a negro con el cuaderno cerrado en el centro: silencio de medio segundo.
- **18–25 s** · "En Claro te la hace todos los días y te dice dónde se va tu plata." El celular entra gigante; las tarjetas de la app empujan al podio del kiosquero hacia arriba hasta pasar al del dueño.
- **25–28 s** · "Probalo gratis." El kiosquero arriba, el dueño se cae de la reposera. Logo.

**Sonidos:** golpe en cada número · ascensor/elevador cuando crecen los podios · música de "vida de rico" (ukelele) para el dueño · silencio total en el corte · caja registradora cuando el kiosquero pasa.

---

## 02 · "Sos el banco del barrio" (27 s) · 3D

**Cuadro 0:** el cuaderno de fiados abierto, enorme, ocupando media pantalla; encima, letras doradas tipo fachada de banco: **"BANCO DEL BARRIO"**. Píldora "KIOSQUERO:".

**Gancho:** "¡Sos el banco del barrio… y no cobrás ni un peso de interés!"

**La comparación loca:** el cuaderno se transforma en 3D en una bóveda de banco con columnas. La puerta redonda de la bóveda se abre… y adentro no hay plata, hay papelitos de "te pago el viernes".

- **2–7 s** · "Prestás leche, pan, cigarrillos. Sin firma, sin interés, sin fecha." Productos que salen volando de la bóveda hacia casitas del barrio.
- **7–13 s** · "Un banco de verdad te cobra ochenta por ciento por año. Vos, cero." Dos carteles 3D enfrentados: "BANCO: 80%" frío y gris, "VOS: 0%" con el cuaderno. (Usar la tasa real vigente, con fuente; si no se consigue, decir "un banco te cobra intereses. Vos, cero.")
- **13–18 s** · "Y encima, nadie te paga." Los papelitos de "te pago el viernes" caen como lluvia y tapan la bóveda.
- **18–24 s** · "En Claro te dice quién te debe, desde cuándo, y le avisa el día que cobra." El celular gigante con el semáforo; las deudas rojas se vuelven verdes una por una con monedas que vuelven a la bóveda.
- **24–27 s** · "Cobrá como un banco. Probalo gratis."

**Sonidos:** puerta de bóveda pesada · viento cuando la bóveda está vacía · papelitos · monedas que vuelven.

---

## 03 · "Tu kiosco se hunde" (30 s) · 3D

**Cuadro 0:** el kiosco flotando como un barco en el agua, inclinado, con agua entrando por la vidriera. Píldora "KIOSQUERO:" y **"TU KIOSCO SE HUNDE"**.

**Gancho:** "¡Tu kiosco se está hundiendo… y vos sacás agua con un vasito!"

**La comparación loca:** el kiosquero achica agua con un vasito (vender más) mientras se abren agujeros en el casco, cada uno con su etiqueta y un chorro: "FIADO", "PRECIOS VIEJOS", "MERCADERÍA QUE NO SE VENDE", "LUZ".

- **2–9 s** · "Vendés más, trabajás más horas… pero el agua sigue subiendo." El vasito cada vez más rápido; el nivel del agua sube igual.
- **9–16 s** · "Porque el problema no es cuánto vendés. Son los agujeros." Cámara bajo el agua: cuatro agujeros con chorros de monedas que se van hacia el fondo.
- **16–24 s** · "En Claro te muestra cada agujero y cómo taparlo." Cuatro tapones con el logo de En Claro se disparan desde el celular y tapan cada agujero con un golpe; el barco se endereza.
- **24–30 s** · "Dejá de achicar agua. Probalo gratis." El kiosco-barco navega con la persiana arriba, sol. Logo.

**Sonidos:** agua entrando · burbujas bajo el agua · chorro de monedas · golpe de tapón ×4 · gaviotas al final.

---

## 04 · "Le regalás plata al proveedor" (24 s) · 3D

**Cuadro 0:** una lata de gaseosa gigante en 3D girando frente a la heladera del kiosco, con una grieta. Píldora "KIOSQUERO:" y **"CADA LATA TE ROBA $112"**.

**Gancho:** "¡Cada gaseosa que vendés… te roba ciento doce pesos!"

**La comparación loca:** la lata se parte en cámara lenta y de adentro salen monedas que vuelan hacia un camión de reparto que se aleja. Después, 200 latas cayendo en una pila infinita, cada una soltando su moneda.

- **2–8 s** · "El proveedor aumentó ocho por ciento. Vos seguís con el precio viejo." Factura 3D que cae sobre el mostrador con "+8%" sellado.
- **8–14 s** · "Doscientas latas por semana: veintidós mil cuatrocientos pesos que le regalás." Pila de latas que crece hasta tapar la pantalla; contador rojo.
- **14–20 s** · "Sacale una foto a la factura: En Claro te dice el precio nuevo y te imprime el cartel." Celular gigante, escaneo, cartel que sale volando y se pega en la heladera.
- **20–24 s** · "Dejá de regalar. Probalo gratis." La próxima lata se abre y las monedas vuelan hacia la caja del kiosco.

**Sonidos:** lata que se abre (pssst) en cámara lenta · monedas · bocina de camión que se aleja · sello · caja registradora.

---

## 05 · "365 días abierto. 0 vacaciones." (26 s) · 3D

**Cuadro 0:** la persiana subiendo a las 8:00 con un reloj gigante al lado; detrás, un calendario 3D de 365 cubos todos marcados "ABIERTO". Píldora "KIOSQUERO:" y **"0 DÍAS DE VACACIONES"**.

**Gancho:** "¡Abriste trescientos sesenta y cinco días… y no te tomaste ni uno!"

**La comparación loca:** los 365 cubos forman una montaña 3D; la cámara sube por la montaña de días trabajados hasta la cima, donde hay… una moneda chiquita de "$833 la hora".

- **2–8 s** · "Catorce horas por día. Feriados, domingos, Navidad." Cubos de días especiales se iluminan: 25 de diciembre, 1 de enero, cumpleaños.
- **8–14 s** · "¿Y sabés cuánto ganás por hora? Ochocientos treinta y tres pesos." Subida hasta la moneda en la cima; la moneda es diminuta frente a la montaña.
- **14–20 s** · "Trabajar más no es la salida. Saber dónde se te va la plata, sí." El celular aparece en la cima y proyecta las tres tarjetas sobre la montaña.
- **20–26 s** · "En Claro: cinco minutos por día. Probalo gratis." Un cubo del calendario se pinta de amarillo: "VACACIONES". Logo.

**Sonidos:** despertador · golpes de cubos cayendo en ritmo rápido · viento en la cima · moneda que tintinea sola · campanita en el cubo amarillo.

---

## 06 · "Tirás plata a la basura" (22 s) · 3D

**Cuadro 0:** un tacho de basura 3D al lado del mostrador, con la tapa abierta, tragando billetes y paquetes de golosinas vencidas. Píldora "ALMACENERO:" y **"TIRÁS PLATA A LA BASURA"**.

**Gancho:** "¡Todos los meses tirás plata a la basura… y no te das cuenta!"

**La comparación loca:** el tacho como un monstruo que mastica: cada producto vencido o que no rota entra y escupe su precio en el aire ("−$1.800", "−$2.400"); el contador de la basura sube.

- **2–8 s** · "Lo que compraste y nunca se vendió. Lo que se venció en el depósito." Depósito 3D con cajas polvorientas que caen al tacho una tras otra.
- **8–13 s** · "Treinta y siete mil ochocientos pesos dormidos." El tacho eructa con el número.
- **13–19 s** · "En Claro te avisa qué no reponer antes de que termine acá." Celular gigante con la lista de plata dormida; el tacho se cierra solo con un candado.
- **19–22 s** · "Probalo gratis."

**Sonidos:** masticado del tacho · eructo (gracioso, corto) · cajas cayendo · candado.

---

## 07 · "El súper sabe. Vos adivinás." (26 s) · 3D

**Cuadro 0:** tu kiosco chiquito en 3D a la sombra de un supermercado gigante con pantallas de datos en la fachada. Píldora "KIOSQUERO:" y **"EL SÚPER SABE. VOS ADIVINÁS."**

**Gancho:** "¡El súper sabe cuánto gana con cada producto… y vos adivinás!"

**La comparación loca:** David contra Goliat. El súper tiene pantallas, gráficos y robots que acomodan precios; el kiosquero tiene un cuaderno y una birome. La cámara muestra la diferencia de tamaño.

- **2–9 s** · "Ellos cambian precios todos los días con sistemas carísimos." Robots 3D cambiando carteles en el súper a toda velocidad.
- **9–14 s** · "Vos tenés un cuaderno." Zoom al cuaderno, silencio, una birome que no escribe.
- **14–22 s** · "Ahora tenés lo mismo en el celular, por cuatrocientos treinta pesos por día." El celular de En Claro es la honda de David: dispara y en la fachada del kiosco se encienden sus propias pantallas con sus números.
- **22–26 s** · "Jugá con las mismas armas. Probalo gratis." El kiosco crece hasta la altura del súper. Logo.

**Sonidos:** zumbido de máquinas del súper · birome raspando · honda (estiramiento + disparo) · encendido de pantallas.

---

## 08 · "Cámara de seguridad" (mejorado del v2) (26 s)

**Cuadro 0:** imagen de cámara de seguridad en blanco y negro **del interior de un kiosco** (góndola, heladera, caja visibles), "REC ●" y "03:14". Una silueta saca plata de la caja. Píldora "KIOSQUERO:" y **"TE ROBAN TODAS LAS NOCHES"**.

**Gancho:** "¡Te están robando todas las noches… y no es un chorro!"

Beats: zoom "ENHANCE" pixelado sobre la silueta → se da vuelta: es la etiqueta de precio con antifaz → rebobinado VHS de la semana con contador "−$22.400" → la imagen pasa a color: foto a la factura con En Claro, precios nuevos → esposas sobre la etiqueta: "Ladrón atrapado. Probalo gratis."

**Sonidos:** zumbido de video · bips de zoom · risa malvada corta · rebobinado · clic de esposas.

---

## Ganchos de reserva (más directos al dolor)

- "¡Kiosquero: el cuaderno de fiados te está fundiendo!"
- "¡Si cerraste el mes y no sabés cuánto ganaste, mirá esto!"
- "¡Trabajás 14 horas para que gane el proveedor!"
- "¡Tu heladera te cuesta más de lo que te deja!" (solo con la cuenta hecha y marcada "ejemplo")
- "¡Almacenero: el súper te está sacando los clientes con esto!"
- "¡No repongas nada hasta ver este video!"

## Orden sugerido

1. **01 El dueño del local** y **02 El banco del barrio**: los dolores más fuertes y nuevos para el público.
2. **03 Se hunde** y **05 365 días**: los más emotivos y los mejores en 3D.
3. **04**, **06**, **07**, **08**.

Para los conceptos 3D nuevos: primero un animatic rápido (HTML o una composición Remotion de baja calidad) para validar el cuadro 0 y el gancho, después el video completo.
