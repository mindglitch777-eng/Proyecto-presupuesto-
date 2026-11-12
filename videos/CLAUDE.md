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
- El texto aprobado en el guion no entra en 35 s con ese ritmo: el video dura ~45 s. Si se quiere más corto, recortar texto (no acelerar la voz).
- Sonidos nuevos: `birome`, `hoja`, `papel_arrancado`, `reloj`, `tinta`, `cajon`.
- Montos de ejemplo marcados ("$180.000 ejemplo", "$41.200 ejemplo"). Último cuadro = cuadro 0 (loop).

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
