# Estándar de calidad de los videos (obligatorio desde el 17/11/2026)

Decisión del dueño: los videos hechos 100% con código (muñecos 3D, carteles, contadores) **no atrapan**. Desde ahora,
ningún video se produce ni se entrega si no cumple este estándar. Manda sobre los guiones viejos y sobre cualquier skill.
Las 6 reglas de oro de `CLAUDE.md` siguen vigentes.

**Presupuesto: US$0** (decisión del dueño). Todo tiene que ser gratis **y con permiso de uso comercial**: los videos venden una app paga.
Por eso NO se usan: ElevenLabs gratis (no permite uso comercial y obliga a citarlos), ni generadores de video con IA en plan gratis
(Kling, Dreamina/Seedance, Hailuo: marca de agua y solo uso personal). Si algún día hay presupuesto, se suman.

## 0. Autocrítica (por qué fallaron hasta el V7-01)

1. **Se ve de juguete.** Kiosco y kiosquero low-poly: parece un juego para chicos, no la vida real del kiosquero. No hay con quién identificarse.
2. **Metáforas que hay que descifrar.** Tijera = aumento, aspiradora = comisión, mano = alquiler. Mientras alguien pasa videos con el dedo, no traduce símbolos: se va.
3. **Demasiado texto a la vez.** Dos contadores, rótulos, "(ejemplo)", subtítulos y signos de pregunta compiten. Nada se lee del todo.
4. **Voz apurada y robótica.** Voz gratuita acelerada (+28%) para meter mucho texto en pocos segundos: suena a máquina y no transmite emoción.
5. **Rompe-patrones quietos.** La pausa, el "FIN", "ES TU MANO" y el gráfico partido quedaban 1 a 3 segundos casi quietos: justo lo contrario de lo que buscaban.
6. **Sin emoción.** Mucha información y ninguna persona con algo en juego. La gente comparte lo que siente, no lo que entiende.
7. **Inventamos formatos en vez de copiar lo que ya funciona.** Ningún video partió de un video real que ya haya funcionado en TikTok.

## 1. Proceso nuevo (en este orden, sin saltear pasos)

1. **Formato probado primero.** Cada video usa uno de los formatos de `videos/referencia/FORMATOS-VIRALES.md` (investigados por Claude).
   Si hay un video viral concreto en `videos/referencias-virales/`, se desarma con `reverse-any-video`. Copiamos la **estructura**, nunca el contenido.
2. **Guion con persona y emoción** (sección 2). Siempre 3 ganchos alternativos por video.
3. **Imagen real** (sección 3): video filmado de verdad (búsqueda automática en Wikimedia Commons y Pixabay) + pantalla real de la app.
4. **Voz humana** (sección 4).
5. **Montaje y capa gráfica** con HyperFrames (skills `hyperframes`, `media-use`) o Remotion: solo encima de la imagen real.
6. **Control de calidad** (sección 6). Si no aprueba, no se entrega.
7. **Medir** después de publicar (sección 7).

## 2. Guion

- **Una persona, una situación real, algo en juego.** Ej.: "Don Carlos, 20 años con el kiosco, hoy vendió como nunca y no le alcanza para pagar el alquiler". Nada de metáforas que haya que traducir: se muestra lo real (el cuaderno de fiados, la factura con el aumento, el cajón vacío).
- **Gancho en 1 segundo, entendible sin sonido:** imagen fuerte + frase en pantalla de máximo 7 palabras. Que el kiosquero piense "eso me pasa a mí".
- **Preguntas encadenadas** (como V7): se abre una antes de cerrar la anterior. Pero cada respuesta es una **sorpresa entendible**, no un acertijo.
- **Duración la que pida la historia** (20 a 40 s). La voz va a velocidad natural: **prohibido acelerar la voz para meter texto**. Si no entra, se corta texto.
- **La app aparece como alivio**, con su pantalla real, no como logo. Cierre con una acción concreta ("probalo 14 días gratis, link en el perfil").

## 3. Imagen

- **Base real, filmada:** kiosco argentino real (vidriera con golosinas, heladera de bebidas, cartel pintado, rejas), manos, caja, cuaderno de fiados, billetes, calle de barrio.
  1. **Búsqueda automática (la hace Claude, no el dueño):** un script en GitHub Actions busca y baja las tomas por palabra clave
     de **Wikimedia Commons** (API sin clave) y **Pixabay** (clave gratis `PIXABAY_API_KEY`, opcional). Pexels no: su API está suspendida para cuentas nuevas. (solo archivos con licencia que permita uso comercial,
     y los que piden crédito se anotan en `videos/salida/<id>-creditos.txt` para la descripción). Claude mira cada toma (hoja de contacto) antes de usarla.
  2. **Tomas del dueño, opcionales:** si algún día filma un kiosco real (con permiso), van a `videos/tomas/` y tienen prioridad.
     Nunca un video de stock sin tocar como plano principal: siempre recortado a 9:16, con color propio y la capa gráfica encima.
- **Pantalla real de En Claro:** grabada de la app de verdad (Playwright a 360 px con datos de ejemplo), nunca maquetas dibujadas.
- **La capa gráfica (código) solo suma:** subtítulos palabra por palabra, un número grande, una flecha o círculo, una comparación. **Máximo 2 elementos de texto a la vez** además del subtítulo. Texto mínimo de 48 px (en 1080 de ancho).
- **Nunca quieto más de 0,7 s**, salvo un silencio buscado de 0,5 s como máximo antes de una revelación.
- **Movimiento de cámara en cada plano** (empuje lento, paneo, temblor de celular). Cortes en el tiempo de la música.

## 4. Sonido

- **Voz:** Gemini TTS en el plan gratis de Google AI Studio (clave `GEMINI_API_KEY`, sin tarjeta), que se dirige con instrucciones de actuación en texto
  ("decilo como un kiosquero argentino cansado, voseando, en voz baja"). Velocidad natural. Primero se prueba con 3 voces y el dueño elige.
  Respaldo: `es-AR-TomasNeural` (acento argentino seguro), **sin acelerar**. Opción más humana de todas: la voz del dueño o de un kiosquero real, si algún día quiere.
- **Música** con pulso marcado de fondo (−18 dB bajo la voz), que se corta en los silencios y vuelve en la descarga.
- **Efectos** por capas: ambiente del kiosco (calle, heladera, puerta), golpes en los cortes y grave solo en los momentos grandes.

## 5. Herramientas instaladas y para qué

| Herramienta | Para qué |
|---|---|
| `reverse-any-video` (HyperFrames) | Desarmar un video viral y rearmar su estructura con nuestro contenido |
| `style-sampling` (HyperFrames) | Hacer un episodio en un estilo probado |
| `hyperframes`, `media-use` | Montaje en HTML/GSAP, música, efectos, subtítulos, color |
| `short-form-video`, `beat-sync-editing`, `caption-animation` | Ritmo, cortes en el tiempo y subtítulos |
| Remotion (skills `remotion-*`) | Los videos ya hechos y la capa gráfica si conviene |
| Gemini TTS (plan gratis, clave `GEMINI_API_KEY`) | Voz con emoción dirigida por texto |
| Wikimedia Commons / Pixabay (gratis, desde GitHub Actions) | Tomas reales con uso comercial |
| Tomas del dueño (`videos/tomas/`) | La imagen principal: kioscos reales de su ciudad |

Las claves van como secretos de GitHub, nunca en el código. Si faltan, el workflow falla con un mensaje claro.

## 6. Control de calidad (antes de entregar, siempre)

Claude mira el MP4 terminado completo (hoja de contacto a 2 cuadros por segundo + medición de silencios con ffmpeg) y lo pone al lado de la referencia viral. Puntaje de 1 a 10 en cada punto; **si alguno da menos de 8, se corrige antes de entregar**:

- [ ] En el cuadro 0 se entiende que es para kiosqueros y hay tensión, **sin sonido**.
- [ ] Se ve real (no juguete) y hay una persona con algo en juego.
- [ ] Nada que haya que descifrar; cada sorpresa se entiende al instante.
- [ ] Ningún tramo de más de 0,7 s sin cambio visible (salvo el silencio buscado).
- [ ] Máximo 2 textos a la vez, todos legibles en el celular.
- [ ] La voz suena humana, a velocidad natural, con emoción.
- [ ] La app aparece con su pantalla real y resuelve lo que plantea el gancho.
- [ ] Último cuadro empalma con el primero.
- [ ] ¿Lo mandaría un kiosquero a otro kiosquero? Si la respuesta honesta es no, no está terminado.

## 7. Medir y aprender

Después de cada publicación, el dueño pasa (captura del celular) visualizaciones, retención a los 3 s, % que lo vio completo, comentarios y visitas al perfil.
Se anotan en `videos/METRICAS.md`. **Los próximos guiones salen de lo que funcionó**, no de lo que nos gusta a nosotros.
