# videos/ — estado

## Hecho
- Aviso "La persiana" (32 s, 1080×1920, 30 fps) portado del animatic a Remotion 4.0.538: 11 escenas.
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

## Cambios respecto del animatic / brief
- Sin fundido a negro al principio: el cuadro 0 ya muestra kiosco + persiana cayendo + "EL PRÓXIMO".
- Cartel de CERRADO colgado arriba a la derecha de la persiana (en el animatic quedaba escondido abajo).
- "Coca" → "Gaseosa" (sin marcas de terceros en el aviso). Íconos dibujados en vez de emojis.
- CTA subido a la zona segura (top 496). Fuente del dato debajo de la grilla.
- Cartel "ABIERTO" de neón al final, contador "CERRADOS HOY" en la grilla.

## Pendiente
- [ ] Escuchar la voz real en el primer render de Actions y ajustar tiempos si alguna línea quedó apurada.
- [ ] Azure AI Speech para publicar (misma voz, oficial): falta implementar en `voz.py` + secretos.
- [ ] Sistema de escenas atadas a palabras (`empiezaEn`) y un guion `02` para probarlo.
- [ ] Música de fondo opcional con ducking.

## Probar localmente
`npm ci`, después `npx remotion render src/index.ts LaPersiana out/x.mp4 --scale=0.25`
(en el contenedor de Claude: `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`).
