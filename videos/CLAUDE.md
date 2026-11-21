# videos/ — estado

## Hecho
- Aviso "La persiana" (36,2 s, 1080×1920, 30 fps) portado del animatic a Remotion 4.0.538: 11 escenas.
  Composiciones: `LaPersiana` (gancho A) y `LaPersiana-ganchoB/C/D` (ganchos A/B de la sección 3 del brief).
- Lienzo lógico 360×640 escalado ×3 (`src/Video.tsx`), así cada número del `render(t)` del animatic se copia tal cual.
- Kiosco ilustrado con props (`src/components/Kiosco.tsx`), escenas en `src/escenas/`.
- Guion en `guiones/01-la-persiana.json`: líneas de voz, ganchos, montos, sonidos (segundo exacto de cada uno).
- Voz `es-AR-TomasNeural` con `scripts/voz.py` (edge-tts): gancho y remates con más fuerza, resto +15%;
  si no entra, primero sube la velocidad de la voz y después `atempo` ≤ 1,25×; si igual no entra, falla y dice qué acortar.
  Tiempos por palabra de edge-tts (WordBoundary) en vez de Whisper. Sale a `public/voces/<id>.gancho-N.{mp3,json}`.
  `--si-cambio` solo regenera si cambió el texto (firma en el JSON).
- Sonidos propios sintetizados (`scripts/sfx.py` → `public/sfx/`, sin licencias de terceros). Efectos a 0,5 (−6 dB).
- Fuentes guardadas en `public/fuentes/` (OFL), el render no depende de internet.
- Subtítulos `@remotion/captions` (máx. 3 palabras, activa amarilla ×1,12), ocultos en líneas gigantes.
- `.github/workflows/videos.yml`: voz → 3 imágenes de control → 4 MP4 (uno por gancho) con loudnorm −14 LUFS → artifacts.

## Video 01 de IDEAS_V3: "El dueño del local gana más que vos" (28 s, 3D)
- Composición `Video01-ElDueno` (`src/v3/ElDueno.tsx`), guion `guiones/v3-01-el-dueno.json`.
- 3D con `@remotion/three` 4.0.538 + `three` 0.186.1 + `@react-three/fiber` 9.8.2. Modelos hechos en código en
  `src/v3/Modelos3D.tsx`: `Kiosco3D`, `Podio`, `Muneco` (dueño con traje y llave / kiosquero con delantal),
  `Reposera`, `Billete`, `Cajones`, `Piso`. Carteles con texturas de canvas.
- `camara(t)` maneja la cámara 3D y `proyectar()` ubica las etiquetas 2D sobre las cabezas con la misma cuenta.
- WebGL: `swangle` en `remotion.config.ts` (angle no levanta sin GPU).
- Sonidos nuevos: `ascensor`, `ding`, `ukelele` (Karplus-Strong). Los efectos duran hasta 5 s en esta composición.

## Video 02 de IDEAS_V3: "Sos el banco del barrio" (27 s, 3D)
- Composición `Video02-Banco` (`src/v3/ElBanco.tsx`), guion `guiones/v3-02-el-banco.json`, modelos en `src/v3/ModelosBanco.tsx`:
  `Cuaderno3D` (cuaderno de fiados gigante), `Banco` (fachada con columnas, cartel dorado y puerta de bóveda que se abre),
  `Casita`, `Producto`, `Moneda`, `Papelito`, `MontonPapel`, `Cartel3D` (BANCO vs VOS).
- Comparación: carteles BANCO "te cobra interés" vs VOS "0%". **No lleva el 80% anual del guion** (no tengo una tasa
  verificada con fuente): la voz dice "un banco te cobra intereses. Vos, cero." Si se consigue la tasa real, agregarla con fuente.
- Los montos de deudas (Marta, Juan, Rosa) llevan "ejemplo". Las monedas vuelven a la bóveda a medida que se cobra.
- Sonidos nuevos: `boveda`, `viento`, `papel`. Exporta `ControlCamara`, `useFuentesListas`, `Pildora`, `mixV` desde `ElDueno.tsx`.

## Video 03 de IDEAS_V3: "Tu kiosco se hunde" (30 s, 3D)
- Composición `Video03-SeHunde` (`src/v3/SeHunde.tsx`), guion `guiones/v3-03-se-hunde.json`, modelos en `src/v3/ModelosBarco.tsx`:
  `Casco` (barco con el kiosco arriba), `Agua` (olas calculadas por cuadro), `Agujero`, `Tapon` (con el logo), `Sol`, `Gaviota`, `Gota`, `Moneda`.
  El kiosquero usa `Muneco` con `vaso` (nuevo).
- **Los momentos clave leen la voz**: `tPalabra(pal, linea, prefijo, def)` en `src/lib/guion.ts` devuelve el segundo en que Tomás dice
  una palabra. Con eso se sincronizan el corte bajo el agua ("Porque"), los agujeros ("Son"), los tapones ("taparlo") y el cierre ("Dejá").
  Los sonidos que dependen de la voz se arman en el componente (`extra`); los fijos están en el JSON. Usar este patrón en los próximos.
- Corte bajo el agua: niebla + luz solo cuando `sub > 0.5`; fondo azul y cielo (2D) detrás del canvas.
- Los montos ($37.800, $22.400, $31.500, $14.000 = $105.700) son de ejemplo y lo dicen en pantalla.
- Sonidos nuevos: `agua`, `burbujas`, `gaviota`.

## Videos v4 (loop abierto, `guiones/IDEAS_V4.md`)
- **v4-01 "El número tapado"** (33 s, 3D): composición `Video-v4-01-NumeroTapado` (`src/v4/NumeroTapado.tsx`), guion `guiones/v4-01-numero-tapado.json`,
  modelos en `src/v4/ModelosNumero.tsx` (`NumeroAerosol`, `Cinta`, `TrozoCinta`, `Boleta`). Reutiliza `Kiosco3D` y `Piso`.
- El misterio (el número pintado en la persiana, tapado con cinta) está a la vista casi todo el video. Se destapa de a pedazos:
  "$3…" (en "destapo"), "$36…" (re-gancho, tras el corte a negro con latido), boletas que aflojan la cinta (alquiler, luz, sueldo,
  "÷ 30") y el tirón final que arranca todo (revelación, con silencio antes). El truco es el celular con la barra del día que pasa el número.
  El último cuadro vuelve a tapar un número nuevo ("$??.???") y la cámara vuelve al encuadre del cuadro 0 (loop).
- Cuentas de ejemplo (marcadas "ejemplo"): alquiler $450.000 + luz $140.000 + sueldo $500.000 = $1.090.000 ÷ 30 = **$36.333/día**; hoy $41.200 (+$4.867).
- Todo atado a las palabras de Tomás con `tPalabra`. Sonidos nuevos: `cinta`, `cinta_larga`.
- Se acercó la cámara bajo el agua del video 03 (pendiente que estaba anotado).

## V5 "Objeto que habla" (`guiones/V5-01-CONFESIONES-CUADERNO.md`)
- **V5-01 "Confesiones de un cuaderno de fiados"**: composición `Video-v5-01-Confesiones` (`src/v5/Confesiones.tsx`), guion `guiones/v5-01-confesiones-cuaderno.json`,
  modelos 3D en `src/v5/ModelosPapel.tsx` (`Pasillo` de páginas, `AbanicoFuiYo`: 26 hojas que giran sobre su borde y forman "FUI YO").
  El resto es 2D (cuaderno de frente, fichero, suma, hoja arrancada, renglones que se borran, celular, cajón) con "escritura a mano" por máscara (`Tinta`).
- **Voz en modo encadenado** (`"encadenar": true` en el guion): `voz.py` pone cada línea cuando termina la anterior (+`antes` s de pausa) y cada línea puede
  traer su `estilo` (rate/pitch/volume). Voz grave y lenta (−6 Hz, +8%), "Fui yo." más grave con 0,9 s de silencio antes. El video dura lo que dura la voz:
  `voces/<id>.json` trae `duracionSeg` y `Root.tsx` lo usa en `calculateMetadata`.
- **Versión rápida (la vigente)**: pedido del dueño "mucho más rápido, cambios de cámara más intensos, más corto, que no pase tiempo sin que pase nada".
  Texto recortado a ~96 palabras, voz +30% (−5 Hz), pausas de 0,3 s (0,6 s de silencio antes de "Fui yo."): ~36 s en vez de 58.
  `camara2d` (en `Confesiones.tsx`) da un golpe de zoom/giro en cada palabra clave y un barrido con desenfoque en cada corte; el 3D recorre el pasillo a 6,5 m/s con
  inclinación (`ControlCamaraRoll`) y entra al abanico con dolly + snap en "Fui yo". Subtítulos, grano y destellos quedan fuera de la cámara.
  La versión lenta de 58 s quedó en `videos/salida/en-claro-v5-01-confesiones-de-un-cuaderno.mp4`.
- Sonidos nuevos: `birome`, `hoja`, `papel_arrancado`, `reloj`, `tinta`, `cajon`.
- Montos de ejemplo marcados ("$180.000 ejemplo", "$41.200 ejemplo"). Último cuadro = cuadro 0 (loop).

## V3-06, V4-02 y V5-02 (tercera tanda, código común en `src/v6/`)
- `src/v6/comun.tsx`: `Marco` (capas 2D + 3D + cámara 2D con golpes + subtítulos + sonidos), `camaraBeats`, `camaraClaves` (cámara 3D por cuadros clave),
  `temblor`, `GanchoGigante`, `Celular`, `LogoEnClaro`, `BotonProbalo`, `useTex`. Un video nuevo solo escribe sus `tiempos()` (con `tPalabra`) y sus escenas.
- **V3-06 "Tirás plata a la basura"** (`Video-v3-06-Basura`, 20 s): tacho monstruo (`ModelosBasura.tsx`: `Tacho`, `Objeto`, `Deposito`). El número queda en "$??.???" hasta que la voz dice "treinta y siete mil".
- **V4-02 "3 errores que cierran kioscos"** (`Video-v4-02-TresErrores`, 27 s): persianas 3D (`ModelosPersianas.tsx`: `Persiana` que se enrolla, lona que se arranca, `Fachada`). Termina con la cuarta persiana tapada ("PARTE 2 · MAÑANA").
- **V5-02 "Confesiones de una caja registradora"** (`Video-v5-02-Caja`, 38 s): caja 3D (`ModelosCaja.tsx`: pantalla con ojos y LCD redibujada por cuadro, ticket que se imprime, cajón con billetes). Cuenta: $120.000 − $66.000 − $36.333 − $8.000 = **$9.667** (ejemplo).
- `voz.py`: con `"encadenar": "recortar"` saca el silencio del final de cada línea (la voz deja ~0,7 s) y el video queda más ágil. Los 3 videos nuevos lo usan.
- La voz no se puede generar desde el contenedor de Claude (edge-tts no tiene salida): se genera en Actions y se baja con `git pull` para sacar imágenes de control con los tiempos reales.

## V7 "Rompe-esquemas" (`referencia/DIRECCION-V7.md`)
- `src/v7/rompe.tsx`: los 10 rompe-patrones de la dirección. Usados en V7-01: `Congelado` (desatura con backdrop-filter, rayón, ‖),
  `RebobinadoVHS` (líneas de tracking y ◀◀ / ▶ ×0,4), `FinFalso`, `VidrioRoto` (triángulos desde un punto que vuelan a cámara), `Escudo`
  (rebotes con "BLOQUEADO"). Listos para V7-02/03: `Tragamonedas`, `ZoomMejorar`, `BarraVida`, `Glitch`, `CartelPelea`. Curvas `entra`/`sale`
  (expo-out / rápida) y `remapear` (tiempo de imagen para rebobinar o cámara lenta).
- **V7-01 "Récord de ventas"** (`Video-v7-01-Record`, `src/v7/RecordDeVentas.tsx`, guion `guiones/v7-01-record-de-ventas.json`):
  kiosco 3D (`Kiosco3D`), caja (`Caja` de V5-02, a escala 0,72) y el dueño (`Muneco` kiosquero ×2). Todo se dibuja desde un **tiempo de imagen**
  (`vista(t)`): se congela en "Pará", rebobina y va en cámara lenta en "Volvé dos segundos" (se ve de verdad la mano del seg. ~3 con círculo de
  marcador), FIN falso en silencio, vidrio roto, la mano es del dueño, comparación que se cruza en X y el mes repetido con En Claro (escudo).
  El último cuadro repite el cuadro 0 (cámara, temblor y destellos en cero). Montos con "(ejemplo)".
- Sonidos nuevos: `rayon`, `rebobinado`, `vidrio`, `escudo`, `tijera`, `aspiradora`, `marcador`, `sello` (`scripts/sfx.py`, ya generados en `public/sfx/`).
- Duración: la da la voz (~25 s con las pausas del guion: rebobinado + FIN y el truco necesitan aire; el guion decía 22 s).

## V8 · estándar de calidad nuevo (`referencia/ESTANDAR-CALIDAD.md`)
- **V8-01 "¿Cuánto le queda de verdad a un kiosco?"** (`Video-v8-01-CuantoLeQueda`, `src/v8/CuantoLeQueda.tsx`, íconos planos en `src/v8/iconos.tsx`:
  `Kiosco`, `Gondola`, `PersianaLuz`, `Billete`, `Kiosquero`). El número es el protagonista (cuenta dígito por dígito, verde → amarillo → rojo);
  máximo 2 textos a la vez + subtítulo; algo visible cada ≤ 0,6 s (`latido`). Fotos: solo las 3 de `public/tomas/v8-01/`, recortadas sin marcas.
- **Voz Gemini** (`scripts/voz_gemini.py`, guion con `"motor": "gemini"`): una sola toma de Orus a velocidad natural; tiempos por palabra con
  faster-whisper (el audio se le pasa ya decodificado: con archivo falla por PyAV); pausas medidas en el audio real (`silencio` exacto antes de la
  revelación, `pausa_max` entre frases). Si cambia el código pero no el guion, NO pide otra toma: recalcula sobre la misma (`alineado`).
  `voz.py` saltea los guiones con motor gemini.
- **Pantalla real de la app**: `app/scripts/grabar-v8-01.cjs` (screencast de Chrome a 1080 px; la grabación de Playwright sale a 360 px y borrosa)
  con `ENCLARO_DEMO=v8-01` (negocio de ejemplo cuya cuenta da $23.500). Sale `public/tomas/v8-01/app-cierre.mp4` + `app-cierre.json` (tiempos).
- Música propia con pulso (`pulso`, −18 dB, se corta en el silencio) y ambiente `calle` en `scripts/sfx.py`.

- **V8-02 "El cuaderno de los $380.000"** (`Video-v8-02-ElCuaderno`, `src/v8/ElCuaderno.tsx`), **V8-03 "La caja llena miente"**
  (`Video-v8-03-LaCajaMiente`, `src/v8/LaCajaMiente.tsx`) y **V8-04 "¿Cuál de estos 4 te hace perder plata?"** (`Video-v8-04-CualTeHacePerder`,
  `src/v8/CualTeHacePerder.tsx`). Piezas comunes en `src/v8/comun.tsx` (`Numero` que cuenta por pasos, `Etiqueta`, `Rotulo`, `Cartel`, `Fondo`,
  `Foto`, `Probalo`, `AppGrabada` con marcos sobre la pantalla y `aPantalla` para pasar px de la grabación a la pantalla del celular).
  Íconos nuevos en `iconos.tsx`: `Cuaderno`, `CuadernoCerrado`, `Burbuja`, `Clienta`, `Recibo`, `CajaRegistradora`, `Reloj`, `Camion`, `CajaDeposito`, `Producto`.
- **Pantallas reales**: `app/scripts/grabar-v8.cjs <demo> <salida>` (un recorrido por video, verifica los números y saca los tramos de espera)
  con `ENCLARO_DEMO=v8-02|v8-03|v8-04` (`app/lib/datos/memoria.ts`). Sale `public/tomas/v8-0N/app.mp4`, `app.json` (marcas), `app-inicio.jpg`, `app-final.jpg`.
  La factura del V8-04 es propia y sin marcas: `node scripts/facturas-ejemplo.cjs tests/facturas/v8-04.json`.
- **Silencios medidos**: whisper marca el arranque de una línea hasta 0,4 s antes después de un silencio. Las revelaciones usan el tiempo medido
  con `silencedetect` (constantes `REVELA_MEDIDO`/`MEDIDO`, que solo valen si la duración de la voz coincide; si se regenera la voz, se vuelve a `l[i]`).

- **V8-05 "La torre"** (`Video-v8-05-LaTorre`), **V8-06 "Rayos X"** (`Video-v8-06-RayosX`) y **V8-07 "El ticket de 3 cuadras"** (`Video-v8-07-ElTicket`):
  3D "render de producto" con `@remotion/three` dentro de `Marco`. Base en `src/v8/estudio3d.tsx`: `Estudio` (reflejos RoomEnvironment, sombras suaves,
  ACES), `Profundidad` (BokehPass de three, foco = distancia cámara→mira), `Camara` (aire de cámara en mano), `useLienzo`, `cajaR` (cajas redondeadas),
  `useImagen` y `PantallaApp`. Modelos en `src/v8/modelos3d.tsx`: `Kiosco3D`, `Vereda`, `PilaBilletes` (fajos de 1 cm instanciados, escala real),
  `Silueta`, `Lona`, `Camion3D`, `Cuaderno3D`, `Celular3D`, `Marca`, `Regla`, `Polvo`, `Moneda3D`, `CartelQR3D`. Escala real: 1 unidad = 1 m.
- **Pantalla de la app en el celular 3D**: la grabación se pasa a cuadros JPG (`public/tomas/v8-0N/cuadros/`, 15 por segundo, 720 px) y cada cuadro
  monta su textura. Dos trampas resueltas: (1) la textura llega después de que se dibujó la escena → `useImagen` vuelve a dibujar (`advance`) antes de
  `continueRender`; (2) en el render por software (swangle) las fotos con mipmaps salen negras → `generateMipmaps = false`. La textura de video
  (`useOffthreadVideoTexture` dentro de `Sequence`) no salió confiable: no usarla.
- **Tiempos de la voz**: `voz_gemini.py` ahora hace arrancar cada línea al final de su silencio medido (whisper la adelantaba hasta 0,7 s).
  Para una voz ya generada: `python scripts/voz_gemini.py guiones/<id>.json --solo-tiempos` (no pide otra toma).

- **V8-08 "La cuenta regresiva"** (`Video-v8-08-CuentaRegresiva`), **V8-09 "Mismo kiosco, distinto final"** (`Video-v8-09-MismoKiosco`) y
  **V8-10 "Entramos a un kiosco que cerró"** (`Video-v8-10-KioscoCerrado`). Modelos nuevos en `modelos3d.tsx`: `PersianaFrente` (todo el frente, con
  cartel CERRADO, grafiti y chispas), `Calculadora3D`, `Registradora3D` (cajón que se abre), `Papelito` (letra a mano), `FacturaClavo`, `Auto3D`
  (sedán genérico), `HojaMes`, `Lupa3D`. V8-09: **pantalla partida de verdad** (`Partida`: dos cámaras en la misma escena con scissor/viewport).
  V8-10: linterna (`SpotLight` que sigue a la cámara) y rótulo RECREACIÓN fijo. FOMO honesto: `CupoFundadores` en `comun.tsx` (100 casilleros
  recorridos por un brillo, nunca lugares restantes).
- **Voz**: `"silencio_max"` en el guion acorta los silencios largos sin acelerar la voz (Orus en voz baja hacía pausas de 1,7 s). `"aparte": "<actuación>"`
  en una línea la graba en una toma separada con su propia actuación y la inserta en su lugar (el papelito del V8-10, quebrado). Sonido nuevo `piano_grave`.

- **V8-11 "¿Cuánto gana por hora un kiosquero?"** (`Video-v8-11-PorHora`, `src/v8/PorHora.tsx`) y **V8-12 "¿Vender más o ganar más?"**
  (`Video-v8-12-VenderMas`, `src/v8/VenderMas.tsx`): mismo sistema 3D, pantalla partida con `Partida` (exportada de `MismoKiosco.tsx`).
  Modelos nuevos: `Reloj3D`, `Candado3D`, `Barra3D` (barras de comparación). `Numero` acepta `redondeo` (1 para mostrar $1.808 exacto).
  Demos `v8-11` (Tu día → precio sugerido → Fiados) y `v8-12` (ranking de Precios → precio sugerido). Duran ~47 s (voz a velocidad natural).

- **V8-13 "El taxímetro"** (`Video-v8-13-Taximetro`, `src/v8/Taximetro.tsx`) y **V8-14 "Hasta las 14:20 trabajás gratis"**
  (`Video-v8-14-TrabajasGratis`, `src/v8/TrabajasGratis.tsx`): primeros con `referencia/SISTEMA-VIRAL.md`. Modelos nuevos: `Taximetro3D`
  (display redibujado por cuadro), `GondolaPrecios` (etiquetas que se dan vuelta solas: el detalle para volver a ver), `Mensaje3D`,
  `RelojKiosco3D` (una vuelta = el día abierto, 7 a 20; se pinta por sectores, `pinta` separado de la aguja). `CupoFundadores mensual`
  ("$12.900 por mes, para siempre"). Demos `v8-13`/`v8-14` = mismo recorrido que `v8-11`. Voz con actuación "ritmo de redes" y
  `pausa_max` 0,3: 38,5 s y 31 s sin acelerar.

## V9
- **V9-03 "Tenés plata encerrada en tu depósito"** (`Video-v9-03-PlataEncerrada`, `src/v9/PlataEncerrada.tsx`, guion `guiones/V9-03-PLATA-ENCERRADA.md`,
  voz exacta de ChatGPT con Orus: 24 s sin acelerar). El depósito es una cárcel: pasillo de estanterías, contador 3D que cae y se parte,
  escarcha, reja que baja, 3 llaves de alquiler, la mano que no llega, celular con Depósito real (demo `v9-03`: dormido $360.000 de
  $1.200.000), candado que salta, billetes a la caja, cupo mensual, mota de polvo y botón de compartir. Modelos nuevos en `modelos3d.tsx`:
  `CajaCarton`, `EstanteriaDeposito`, `Escarcha`, `Telarana`, `Barrotes3D`, `LlaveGigante`, `Contador3D`, `ManoBrazo`, `BotonCompartir`, `Avioncito3D`.
  Ojo: los cuadros de la app tienen que empezar en `c000.jpg` (`ffmpeg -start_number 0`): si no, el celular sale en blanco al entrar.

## Prueba piloto (3 videos, `src/piloto/`)
- `Piloto-1-LaCajaMiente` (caja registradora gigante → conductos de vidrio a REPOSICIÓN y GASTOS → bolsillo casi vacío → la caja se aplasta y es
  el celular con Tu día), `Piloto-2-TrabajasParaPagar` (reloj → calendario → bloque de $900.000 partido en 30 → balanza $30.000 vs $25.000 →
  reloj de 12 horas con el kiosquero a contraluz → celular con Tu día) y `Piloto-3-PlataEnLaCalle` (billete que se va a la calle, billetes FIADO
  que se vuelven tickets en las puertas, 4 calendarios, barrera de vidrio, celular con Fiados). Demos de la app `p1`/`p2`/`p3`, voces exactas
  del pedido (Orus, ≤ 2,3 palabras/s), subtítulos más arriba (`subTop`, zona segura). Modelos en `src/piloto/modelos.tsx`, oferta fija en `comun.tsx`.
- Gemini gratis permite ~10 voces por día. Si se agota, las pausas se pueden alargar sobre la toma que ya está (se insertan ceros y se corren
  los tiempos; la firma se actualiza para que el workflow no pida otra toma). Así se hizo con la del video 3.

## "Vendés, pero no cobrás" (`Video-VendesNoCobras`, `src/vnc/`) · nueva estética
- Pedido del dueño: animaciones con agresividad, no "de juguete". Cámara subjetiva (sos el kiosquero, detrás del mostrador, de noche),
  personas como siluetas a contraluz con estela, tubo fluorescente que titila / estroboscopio, neón, haz de luz por la puerta.
- `src/vnc/cine.tsx`: `Cine` (posproceso: profundidad de campo → bloom → OutputPass → grado con aberración cromática, zoom radial en los golpes,
  viñeta y grano; el grado va DESPUÉS del OutputPass, si no el grano lava la imagen) y `Texto3D` (texto extruido con la tipografía de la marca
  vía opentype.js; `public/fuentes/SpaceGrotesk-Bold.ttf` sale de la woff2 con fontTools). El texto 3D que mira a la cámara subjetiva va con
  `rotation-y = π` (si no, se ve espejado). `useFuente` vuelve a dibujar (`advance`) al cargar la fuente.
- Desenfoque de movimiento en los latigazos: filtro SVG `feGaussianBlur` horizontal/vertical según lo que gira la cámara (`Marco filtro`).
- 400 notas de fiado instanciadas (`Notas`): caen sobre el mostrador, forman "$96.000" (puntos muestreados de un canvas) y la cámara las atraviesa.
  "ÉL NO TE ESPERA." y el sello FIADO van en 2D (con volumen por sombras) para que se lean siempre.

## "¡Estás regalando tu ganancia!" (`Video-RegalandoGanancia`, `src/rg/`)
- Mismo sistema de cine que "Vendés, pero no cobrás", pero en tercera persona con el mismo kiosquero en todo el video (`Kiosquero` con `Pose`,
  `Perfil` para el primer plano a contraluz), grieta en el mostrador, monedas instanciadas, tubos de vidrio ANTES $200 / AHORA $50, cinta de
  100 ventas que llena una caja de vidrio, góndola con etiquetas viejas que se marcan en rojo. Pantalla real de Precios: demo `p5`.
- **Trampa del render por software (swangle):** con demasiadas luces puntuales la imagen sale NEGRA (no tira error). Máximo ~6 `pointLight`
  a la vez; los brillos chicos (grieta, etiquetas) van solo con material emisivo + bloom. Y las `InstancedMesh` llevan `frustumCulled = false`.
- La voz salió de 26,5 s: se le insertaron silencios entre frases (sin tocar la voz) para que cada una caiga en su escena (30 s).

## Demos de Facebook FB-01 a FB-03 (`src/fb/DemoFB.tsx`, guion `guiones/FB-DEMOS-01-03.md`)
- `Video-fb-01-Voz`, `Video-fb-02-CargarTodo`, `Video-fb-03-Factura`: "grabar pantalla" del celular, sin 3D. Pantalla completa = grabación real
  (`app/scripts/grabar-v8.cjs fb-0N`, viewport 360 × 616 + barra de estado de 24 px dibujada en el video = 9:16 justo), con toques de dedo
  (círculo gris inyectado en la página), scroll con el dedo y fecha en formato argentino (`LANG=es_AR`).
- Cierre por voz: el robot no tiene micrófono, así que en la grabación el reconocedor del navegador se reemplaza por uno que "escucha" la frase
  exacta de `app/tests/voz.json` palabra por palabra y marca cada palabra (`w0`, `w1`, …). FB-01 usa la frase 1 y FB-02 la frase 4.
- La grabación se acomoda a la voz con anclas (segundo del video ↔ segundo de la grabación, `aGrabacion`): entre anclas corre a velocidad
  normal y espera, o se apura. Cada palabra dictada es un ancla (la palabra se ve ~0,05 s antes de su marca: ancla en marca − 0,1 s).
  La pantalla se dibuja con `<Freeze>` + `OffthreadVideo` (cuadro exacto de `public/tomas/fb-0N/app.mp4`).
- Voz Orus, primera persona, tono kiosquero; la frase dictada va en toma aparte (`"aparte"`, tono de dictarle al celular). Un solo texto
  grande (franja arriba con "MONTOS DE EJEMPLO") + subtítulo; cartel final con "$12.900 por mes, para siempre · 14 días gratis".
- FB-02 empieza con un formulario genérico dibujado ("Cargar venta", sin marca ni copia de ningún sistema real).

## Guardado del MP4 en la rama (videos.yml)
- **Varios videos por corrida**: lista `VIDEOS` (JSON con nombre, id y cuadros de control; `[]` = solo voces). Cada video se reparte en 10 máquinas
  (matriz video × parte) y `unir` verifica que las partes estén pegadas y completas antes de armar el MP4 (si una máquina falló, no sale un video cortado).
- Render repartido (lo armó Claude chat): job `parte` ×10 (`--frames=A-B` + `--separate-audio-to`, `scripts/cuadros.cjs` dice cuántos cuadros hay)
  y job `unir` (concatena el video sin recomprimir, junta el audio, −14 LUFS). Primera corrida del V7-01: 9 min de punta a punta
  (una parte tardó 5 min en instalar porque no había caché; con caché, ~4 min). Uniones revisadas cuadro a cuadro: sin saltos ni silencios.
- Después de renderizar, el MP4 se sube primero como respaldo (`mp4-<nombre>`, 7 días) y después se guarda en `videos/salida/`
  partiendo siempre de una copia limpia de la rama (`fetch` + `reset --hard` + `clean`), con 8 reintentos.
  Antes fallaba con "cannot pull with rebase: You have unstaged changes" (las voces bajadas dejaban el árbol sucio) y el render se perdía.

## Cambios respecto del animatic / brief
- **Duración 36,2 s en vez de 32 s.** La voz real de Tomás no entraba en los tiempos del animatic (líneas 2 y 4 daban
  más de 1,25×). Las escenas se siguen escribiendo en segundos del animatic y `tramos` del guion estira solo
  la amenaza (×1,6), la cuenta (×1,12), la herida (×1,5), el precio (×1,15) y el cierre (×1,2).
  `aVideo`/`aAnimatic` en `src/lib/guion.ts` y `a_video` en `scripts/voz.py` hacen la misma cuenta.
- Sin fundido a negro al principio: el cuadro 0 ya muestra kiosco + persiana cayendo + "EL PRÓXIMO".
- Cartel de CERRADO colgado arriba a la derecha de la persiana (en el animatic quedaba escondido abajo).
- "Coca" → "Gaseosa" (sin marcas de terceros en el aviso). Íconos dibujados en vez de emojis.
- CTA subido a la zona segura (top 496). Fuente del dato debajo de la grilla.
- Cartel "ABIERTO" de neón al final, contador "CERRADOS HOY" en la grilla.

## Pendiente
- [ ] Escuchar la voz real en el render de Actions y ajustar `tramos` si alguna línea quedó apurada o con mucho silencio.
- [ ] Azure AI Speech para publicar (misma voz, oficial): falta implementar en `voz.py` + secretos.
- [ ] Sistema de escenas atadas a palabras (`empiezaEn`) y un guion `02` para probarlo.
- [ ] Música de fondo opcional con ducking.

## Probar localmente
`npm ci`, después `npx remotion render src/index.ts LaPersiana out/x.mp4 --scale=0.25`
(en el contenedor de Claude: `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`).
