# CREATIVE BRIEF — Videos de En Claro

> Para Claude Code. Leé este archivo completo antes de escribir código.
> Referencia visual obligatoria: `videos/referencia/animatic.html` (abrilo y leé su `render(t)`:
> cada elemento está calculado desde el tiempo, igual que `useCurrentFrame()` en Remotion).
> Tu trabajo es portar ese animatic a Remotion con calidad de producción y convertirlo en un sistema
> que produzca un video nuevo por día desde un JSON y una grabación de voz.

---

## 0. REGLAS DE ORO (valen para TODO video de En Claro, de ahora en adelante)

Si un video rompe una de estas reglas, no está terminado.

1. **Cuadro 0 = kiosco + amenaza.** En el primer cuadro se ve un kiosco o almacén argentino y una amenaza
   directa al dueño. Se entiende sin leer y sin sonido: "esto es para mí y algo malo me pasa".
2. **Los primeros 0,3 s entran con toda la polenta.** La voz del gancho se graba a todo pulmón, como un titular gritado.
   La animación acompaña esa fuerza: palabras que caen gigantes (escala 2,8 → 1 en 4 cuadros, con desenfoque de movimiento),
   golpe de sonido, temblor de 18 px, destello blanco y polvo. Cada palabra fuerte cae en un golpe.
3. **Nunca quieto.** Algo pasa como máximo cada 0,7 s (21 cuadros). Además del evento principal, siempre hay
   movimiento ambiente: cámara que empuja, tubo fluorescente que parpadea, polvo en la luz, números que ruedan, objetos que flotan.
4. **Todo lo que se ve, suena.** Cada evento visual tiene su sonido según el contexto (tabla en la sección 6).
   Nada aparece mudo.
5. **Comparaciones que pegan.** Mostrar, no explicar: tres persianas que caen y la cuarta es la tuya;
   cada gasto que baja tu persiana; "$833 la hora" pintado con aerosol; $430 al lado de un alfajor;
   40 gaseosas en una balanza contra 17 alfajores. Cada video necesita al menos una comparación visual así.

## 1. Qué queremos

Avisos verticales de 20 a 40 segundos que se vean como **publicidad de una SaaS premium**
(Linear, Stripe, Apple) pero que cuenten la vida real de un **kiosco o almacén argentino**.
Ese contraste es el diferencial: nadie le habló nunca al kiosquero con este nivel de producción.

- **Público:** dueño de kiosco, almacén o dietética. 30 a 65 años. Usa el celular, no sabe de tecnología.
- **Dónde se ve:** TikTok, Instagram Reels, YouTube Shorts y Facebook Reels. Mayoría sin sonido.
- **Qué tiene que lograr:** que frene el dedo en 1,5 s, que mire hasta el final, que comente y que entre a la prueba gratis.
- **Voz:** la voz real del creador (mindglitch), en español rioplatense, con voseo. El gancho se graba con máxima energía, casi gritado; el resto, con ritmo rápido y pausas cortas antes de cada número.

## 2. Las tres reglas del nicho

1. **Se reconoce en 1 segundo.** El primer cuadro muestra un kiosco o almacén argentino (toldo rayado,
   cartel, vidriera con golosinas, heladera de bebidas, mostrador con el cuaderno de fiados, vereda)
   y un llamado directo arriba: **"KIOSQUERO:"** o **"ALMACENERO:"**. Quien tiene un kiosco se ve a sí mismo antes de leer.
2. **El dolor se ve, no se cuenta.** Cada pérdida le pasa al kiosco: la persiana baja, la góndola se vacía,
   la luz se apaga, aparece el cartel de CERRADO. Nunca un número solo sobre un fondo vacío.
3. **Pantalla llena.** Tercio superior = mensaje (gancho, título, número). Resto = escena (el kiosco,
   o el celular delante del kiosco desenfocado). Al menos 60% de la pantalla con contenido en todo momento.

**El motivo visual de la serie: la persiana.** Baja con cada dolor y sube con la solución. Cualquier video
de En Claro puede usarla, y el final siempre es la persiana subiendo con las luces prendidas.

## 3. El aviso principal: "La persiana" (32 s, 960 cuadros)

| # | Seg. | Voz | Qué se ve | Componentes |
|---|------|-----|-----------|-------------|
| 1 | 0–2,6 | "¡El próximo kiosco que cierra… es el tuyo!" (gritado) | **Dominó de persianas.** Calle de 4 kioscos en grilla 2×2 con luz cálida. A 0,05 s, 0,4 s y 0,75 s cae de golpe la persiana de tres kioscos: golpe metálico, temblor de 18 px, destello blanco, polvo, la luz de ese kiosco se apaga y cuelga el cartel de CERRADO. Con cada golpe cae una línea del gancho: "EL PRÓXIMO" · "KIOSCO QUE CIERRA". A 1,15 s una mira roja gira y se fija sobre el cuarto kiosco (bip de fijación) y golpea "ES EL TUYO." en rojo con glitch. A 1,55 s barrido con zoom hasta tu kiosco, que ocupa toda la pantalla; latidos; tu persiana empieza a bajar temblando | Calle, Kiosco, Persiana, Mira, TextoGolpe |
| 2 | 2,6–5 | "Cierran hasta setenta kioscos por día. ¿El tuyo es el próximo?" | Grilla de 70 kiosquitos con la vidriera prendida que se apagan uno por uno con un clic cada uno. Título "Cierran hasta 70 kioscos por día", fuente abajo (UKRA vía Cadena 3, mar. 2026). "¿El tuyo es el próximo?" golpea en amarillo | GrillaDeCierres, Fuente |
| 3 | 5–9,5 | "Vendés tres millones. Mercadería, alquiler, luz… te quedan trescientos cincuenta mil." | Vuelve el kiosco. Arriba "VENDÉS POR MES $3.000.000" rodando. Cada gasto es una ficha roja (📦 Mercadería −$2.100.000, 🔑 Alquiler, 💡 Luz, 🧾 Otros) que vuela y se estrella contra la persiana: la persiana cae con rebote, la góndola pierde productos, el número baja y tiembla, la luz se va apagando. Termina en "te quedan $350.000" | Kiosco, Persiana, RestaEnCascada |
| 4 | 9,5–12 | "Catorce horas por día. Ochocientos treinta y tres pesos la hora." | Persiana casi cerrada. "$833/hora" pintado con aerosol rojo sobre la persiana (glitch al aparecer). Cartel de CERRADO que se balancea. Arriba: "14 horas por día. Para esto." | Persiana, Aerosol, Cartel |
| 5 | 12–14 | "Y tu cuaderno nunca te lo dijo." | Zoom de cámara al mostrador; el cuaderno de FIADOS escrito a mano (Marta 18.000, Juan 7.500…) aparece grande y se cierra de golpe | ObjetoIlustrado, Cámara |
| 6 | 14–16 | "Esto sí." | Destello amarillo. El kiosco queda desenfocado y oscuro de fondo. "Esto sí." gigante. El celular entra girando en 3D | Transiciones, Celular3D |
| 7 | 16–19,5 | "Le hablás… y te hace la cuenta." | Título arriba "Le hablás y te hace la cuenta". Micrófono, onda de voz, transcripción tipeándose, tarjeta "Hoy te quedaron $85.667" | PantallaApp (voz) |
| 8 | 19,5–23 | "Te dice a quién cobrarle, a cuánto vender y qué no reponer." | "Te dice qué hacer". Tres tarjetas de vidrio salen del celular: fiado de Marta con botón de WhatsApp, Coca a $2.160, $37.800 dormidos. La persiana del fondo empieza a subir | InterfazExplotada, TarjetaVidrio |
| 9 | 23–26,3 | "Una foto a la factura, y los carteles listos." | "Una foto y listo". Visor, escaneo, precios que giran como cartel de aeropuerto, cartel impreso que vuela a cámara | PantallaApp (foto), Cartel |
| 10 | 26,3–29,5 | "Cuatrocientos treinta pesos por día. Menos que un alfajor." | Arriba "LO QUE PERDÉS POR MES SIN SABERLO −$45.000" en rojo. Tarjeta de vidrio "$430 por día" con un alfajor dibujado al lado. Píldora "14 días gratis · sin tarjeta" | TarjetaPrecio |
| 11 | 29,5–32 | "En Claro. Dejá de adivinar." | El kiosco vuelve nítido: la persiana sube del todo con traqueteo, se prende el cartel con neón, la góndola se llena, la heladera brilla. Logo arriba, "Dejá de adivinar.", CTA amarillo con brillo | Kiosco, Cierre |

**Ganchos para probar (A/B):** el animatic permite cambiarlos. Publicar el mismo video con distintos ganchos y quedarse con el que retenga más a los 3 segundos.
Los cuatro usan el mismo dominó de persianas; cambia el texto que cae con cada golpe.
- "EL PRÓXIMO · KIOSCO QUE CIERRA · ES EL TUYO."
- "KIOSQUERO: · TU KIOSCO · SE ESTÁ MURIENDO."
- "ALMACENERO: · MIRÁ ESTO · ANTES DE CERRAR."
- "VENDÉS UN MONTÓN · Y NO TE QUEDA · NI PARA REPONER."

Cuentas del aviso (marcadas "ejemplo" en pantalla):
3.000.000 − 2.100.000 − 400.000 − 90.000 − 60.000 = 350.000 · 14 h × 30 días = 420 h · 350.000 ÷ 420 = $833.
Cierre por voz: 280.000 − 150.000 − 8.000 − 36.333 de fijos diarios = $85.667. Precio: 12.900 ÷ 30 = $430.
Dato real: cierran entre 50 y 70 kioscos por día según UKRA (Cadena 3, marzo 2026); se muestra con su fuente.

**Ilustración del kiosco:** vectorial plana con textura, no fotos ni stock. Construila como componente
`Kiosco` con props: `persiana` (0 a 1), `luz` (0 a 1), `productosQueFaltan` (0 a 21), `desenfoque`, `zoom`,
`cartelCerrado`, `tuboParpadea` y `polvo`. El componente `Calle` reúne varios `Kiosco` para el dominó. Así cualquier guion la anima desde el JSON.

## 4. Reglas de movimiento (no negociables)

1. **Todo entra con resorte.** `spring({frame, fps, config: {damping: 12, stiffness: 180}})` con leve pasado. Nada lineal salvo barridos de luz.
2. **Algo cambia cada 1,5 s como máximo.** La cámara (contenedor) siempre flota: seno lento de ±4 px y ±5° de rotación en Y para el celular.
3. **Cada pérdida pega:** temblor `10 * exp(-12*d) * sin(60*d)` px, destello rojo al 25% de opacidad que se apaga en 0,35 s y golpe de bajo.
4. **Tres capas siempre:** fondo con degradado radial que se mueve lento → contenido → grano animado (overlay, 9%) y viñeta.
5. **3D real en el celular:** `perspective` 900, `rotateY` y `rotateX`, sombra grande y suave. Nunca un mockup plano.
6. **Contadores con números tabulares** y formato `es-AR` (`$22.400`, `−$45.000`).
7. **Color con significado:** amarillo `#FFB703` = la plata que importa; rojo `#FF4D5A` = pérdida; verde `#5FD39A` = mejora. Fondo `#050F0A` a `#1B4332`.
8. **Tipografía:** Space Grotesk 700/900 para títulos y números; Inter 800/900 para subtítulos. Cargá con `@remotion/google-fonts`.
9. **Nada mudo:** cada entrada lleva sonido (ver sección 5).
10. **Prohibido:** pantallas vacías con un número solo, logo al inicio, transiciones CSS (parpadean en el render), stock footage, emojis como decoración principal, texto fuera de la zona segura.

## 5. Ficha técnica

- 1080 × 1920, 30 fps (960 cuadros en el aviso principal), H.264 (`crf` 18), audio AAC normalizado a −14 LUFS.
- Diseñá en un lienzo lógico de 360 × 640 como el animatic y escalá ×3, o directamente en 1080 × 1920 multiplicando las medidas del animatic por 3.
- **Zona segura:** 10% libre arriba, 18% abajo, 6% a los costados. Subtítulos y números siempre adentro.
- Subtítulos: `@remotion/captions` + `createTikTokStyleCaptions`, `combineTokensWithinMilliseconds: 400`, máximo 3 palabras por página, palabra activa en amarillo con escala 1.12, sombra negra fuerte. Se ocultan cuando el mismo texto ya está gigante en pantalla.

## 6. Diseño de sonido

| Evento | Sonido |
|--------|--------|
| Entrada de número o tarjeta | whoosh corto |
| Persiana que baja | golpe metálico con rebote |
| Persiana que sube | traqueteo metálico |
| Kiosquito que se apaga | clic seco |
| Persiana que cae de golpe (gancho) | golpe metálico + kick + ruido grave |
| Mira que se fija | doble bip |
| Tensión (gancho, herida) | latido doble |
| Tubo fluorescente que parpadea | zumbido eléctrico |
| Plata que aparece en pantalla | monedas |
| Contador rodando | tic cada 2 cuadros |
| Gasto que muerde / golpe de precio | golpe de bajo (kick 150→40 Hz) |
| Pérdida en rojo | golpe + ruido glitch 0,3 s |
| Antes de una revelación | riser 0,6 s |
| Plata que aparece | caja registradora |

El animatic sintetiza estos sonidos con WebAudio como guía. En producción usá archivos reales con licencia comercial en `videos/public/sfx/` y documentá el origen en `videos/public/sfx/README.md`. Música de fondo opcional a 100–120 BPM, a −22 LUFS, con los cortes en el golpe.

## 7. Arquitectura

```
videos/
  referencia/           CREATIVE_BRIEF.md, animatic.html
  guiones/              01-la-persiana.json, 02-…json
  voces/                01-la-persiana.m4a (grabadas por mindglitch)
  public/sfx/           whoosh, tic, kick, glitch, riser, caja (+ README de licencias)
  src/
    Root.tsx            registra una composición por cada JSON
    Video.tsx           lee el JSON y arma la TransitionSeries
    lib/                tiempo.ts (palabra → cuadro), formato.ts (ARS), easing.ts
    components/         Kiosco, Calle, Persiana, Mira, TextoGolpe, GrillaDeCierres, Aerosol, Fondo, Grano, Vineta, TextoCinetico, Contador, RestaEnCascada,
                        Glitch, ObjetoIlustrado, Celular3D, PantallaApp, InterfazExplotada,
                        TarjetaVidrio, Cartel, TarjetaPrecio, Cierre, Subtitulos, Fuente,
                        LuzDestello
.github/workflows/videos.yml
```

**Escenas atadas a palabras.** Cada escena del JSON dice en qué palabra de la voz empieza (`empiezaEn`).
Whisper (`@remotion/install-whisper-cpp`, modelo multilingüe, idioma `es`) devuelve el tiempo de cada palabra
y `tiempo.ts` lo convierte a cuadro. Si una palabra no aparece, el log lo dice y se usa el tiempo del JSON (`respaldoSeg`).
Sin voz grabada, el video usa los tiempos de respaldo, así se puede previsualizar antes de grabar.

```json
{
  "id": "01-la-persiana",
  "duracionSeg": 30,
  "voz": "voces/01-la-persiana.m4a",
  "escenas": [
    { "componente": "Gancho", "empiezaEn": "Kiosquero", "respaldoSeg": 0.1, "props": { "llamado": "KIOSQUERO:", "texto": "Tu kiosco se está muriendo.", "persiana": 0.14 } },
    { "componente": "GrillaDeCierres", "empiezaEn": "Cierran", "respaldoSeg": 2.3, "props": { "cantidad": 70, "fuente": "UKRA vía Cadena 3, mar. 2026" } },
    { "componente": "RestaEnCascada", "empiezaEn": "Vendés", "respaldoSeg": 5.1,
      "props": { "gastos": [["Mercadería", 2100000], ["Alquiler", 400000], ["Luz", 90000], ["Otros gastos", 60000]] } }
  ],
  "sonidos": [ { "en": "Kiosquero", "sfx": "golpe" }, { "en": "Cierran", "sfx": "whoosh" } ]
}
```

`PantallaApp` reutiliza los componentes reales de la app de En Claro (o los copia fielmente si dependen de datos),
para que lo que se ve en el video sea el producto de verdad.

## 8. Pipeline desde el celular

1. mindglitch sube la voz a `videos/voces/` desde GitHub.
2. Push → `videos.yml` en GitHub Actions: instala, recorta silencios mayores a 0,4 s (ffmpeg `silenceremove`),
   transcribe con Whisper, renderiza **3 imágenes de control** (cuadros del gancho, del giro y del precio) y después el MP4.
3. Sube imágenes y MP4 como artifacts descargables.
4. Si no hay voz para un guion, renderiza igual con los tiempos de respaldo y subtítulos del JSON.

Remotion es gratis para personas y equipos de hasta 3 personas, incluso para uso comercial.
Instalá las Agent Skills oficiales con `npx remotion skills add` y usá `/remotion-best-practices` como referencia.

## 9. Orden de trabajo

1. **Modo plan:** leé este archivo y el animatic, proponé estructura y versiones exactas de paquetes. Esperá aprobación.
2. Proyecto Remotion + Agent Skills + fuentes + `Fondo`, `Grano`, `Vineta`.
3. Componente `Kiosco` con todas sus props y escenas 1 a 5 (gancho, cierres, cuenta, herida, cuaderno). Render de prueba de esos 14 s.
4. Escenas 6 a 9 (celular 3D delante del kiosco desenfocado, pantallas, tarjetas, foto).
5. Escenas 10 y 11 (precio y persiana que sube), subtítulos y sonido.
6. Workflow de GitHub Actions con imágenes de control.
7. Sistema de JSON: convertir el aviso principal en `guiones/01-la-persiana.json` y crear el `02` a partir de un guion nuevo para probar que el sistema funciona sin tocar componentes.

Commit y push al terminar cada paso. Mantené un `videos/CLAUDE.md` con el estado.

## 10. Listo cuando

- [ ] Cumple las 5 reglas de oro (sección 0).
- [ ] En el primer cuadro se ve un kiosco y una amenaza directa.
- [ ] Al menos 60% de la pantalla tiene contenido en todo momento.
- [ ] Cada gasto baja la persiana y vacía la góndola.
- [ ] El final muestra la persiana subiendo con las luces prendidas.
- [ ] En 1,5 s se entiende de qué habla.
- [ ] Nunca hay más de 1,5 s con la pantalla quieta.
- [ ] Cada número rueda, cada golpe tiembla y suena.
- [ ] Los subtítulos marcan la palabra que se dice y no tapan el número.
- [ ] Todo lo importante está en la zona segura.
- [ ] El celular muestra pantallas reales de En Claro.
- [ ] Los montos de ejemplo dicen "ejemplo".
- [ ] El precio aparece después de la pérdida.
- [ ] El último cuadro empalma con el primero.
- [ ] Se entiende entero sin sonido.
- [ ] Comparado lado a lado con el animatic, se ve igual o mejor en cada escena.

## 11. Voz (decisión actual)

La voz real del creador no da la calidad buscada, así que se usa **voz sintética argentina**.

- **Prueba (gratis):** voz `es-AR-TomasNeural` de Microsoft con el paquete de Python `edge-tts`, generada dentro de
  GitHub Actions (el entorno de Actions tiene internet). Solo para pruebas internas: es un servicio no oficial.
- **Para publicar:** la misma voz `es-AR-TomasNeural` por **Azure AI Speech** (servicio oficial, tiene plan gratis
  mensual; confirmar el cupo vigente en la página de precios de Azure), o una voz argentina de ElevenLabs (plan pago).
  La clave va en un secreto de GitHub, nunca en el código.
- **Cómo se genera:** una pista por cada línea de la tabla de la sección 3, con su propio ritmo:
  gancho `--rate=+25% --pitch=+3Hz --volume=+20%`; resto `--rate=+15%`.
  `scripts/voz.py` lee las líneas y sus tiempos del JSON del guion, genera cada una, y si una línea dura más que su escena
  la acelera con `atempo` hasta 1,25×; si aun así no entra, falla y dice qué línea acortar.
  Después la ubica en su segundo exacto con `ffmpeg adelay`, mezcla todo en `voces/<id>.mp3`, normaliza a −14 LUFS
  y le pasa Whisper para los tiempos por palabra de los subtítulos.
- **Mezcla:** voz arriba de todo; efectos a −6 dB por debajo de la voz; música (si hay) a −22 LUFS con ducking cuando habla la voz.
