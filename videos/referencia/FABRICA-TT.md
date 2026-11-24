# Fábrica TikTok (TT) · cómo sale un video nuevo rápido (desde 24/11/2026)

Decisiones del dueño: **todo 2D** (el 3D tarda mucho), **historia o humor primero, la app 2–3 s al final**, sin "(ejemplo)" en pantalla,
precio solo en el comentario fijado. Lo que funciona en el nicho: **POV de humor** (TT-03) y **misterio con giro** (TT-02).

## Las dos plantillas (copiar y cambiar, no empezar de cero)
| Plantilla | Archivo | Voz | Cuándo |
|---|---|---|---|
| **POV de humor** | `src/tt/PovFiado.tsx` | 2 personajes, frases cortas (`guiones/dialogos/<id>.json`, `scripts/voces_dialogo.py`) | situaciones del mostrador: fiado, regateo, "¿tenés cambio?", el que toca todo |
| **Misterio / caso** | `src/tt/DondeEstaLaPlata.tsx` | narrador Orus en una toma (`guiones/<id>.json`, `scripts/voz_gemini.py`) | "¿dónde está la plata?", sospechosos, revelación |

Piezas listas en `PovFiado.tsx`: `Kiosco` (fondo detrás del mostrador), `Mostrador` (con tus manos y grieta), `Cliente` (caras: canchero,
sonrisa, puchero), `Globo` (se escribe letra por letra), `GloboVos` (lo que contestás vos), `Paciencia` + `Danio` + `Impacto` (barra tipo
videojuego), `Cuaderno`, `App` (pantalla real). En `DondeEstaLaPlata.tsx`: `Cajon`, `Mano` (con anillo), `Polaroid`, `Hilo`, `Sello`, `Espejo`, `Polvo`.

## Pasos para un episodio nuevo (una sola corrida de GitHub)
1. Copiar la plantilla a `src/tt/<Nombre>.tsx` y cambiar solo: textos, tiempos `K`, utilería de cada momento.
2. Voces: POV → `guiones/dialogos/<id>.json` (una toma por personaje, cuida la cuota de ~10 voces/día). Caso → `guiones/<id>.json`.
3. Registrar la composición en `src/Root.tsx` y ponerla sola en `VIDEOS` de `.github/workflows/videos.yml`.
4. Revisar acá con `npx tsc --noEmit` + 6–10 imágenes (`npx remotion still … --scale=0.4`) **antes** de subir: cada corrida de GitHub que
   se ahorra son ~4 min.
5. Un solo push. El MP4 queda en `videos/salida/` y se manda por el chat.

## Por qué tarda lo que tarda (y qué se recortó el 24/11)
- Las máquinas ya **no bajan `videos/salida/`** (1,1 GB de MP4 viejos) ni el historial: checkout parcial.
- **Si no cambió ningún guion de voz, no se instala nada de voz** (ffmpeg + whisper ≈ 2 min) y se usan las voces del repo.
- Queda: voz (≈ 20 s sin cambios / ≈ 2 min con voces nuevas) → 10 partes en paralelo (≈ 1,5–2 min) → unir (≈ 40 s).
- Los ajustes chicos (tiempos, colores, textos) no regeneran voces: la voz se pide solo cuando cambia su texto.
- Cuota de Gemini: 10 voces por día. Si se agota, `voces_dialogo.py` usa la voz de respaldo (Tomás, edge-tts) y al día siguiente, con
  cualquier render, vuelve a pedir la voz buena sola. Si la toma sale sin pausas, corta las frases por las palabras (whisper), sin gastar cuota.
