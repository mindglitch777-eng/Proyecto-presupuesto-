# Dirección de animación · serie V7 "Rompe-esquemas"

Vale para V7-01, V7-02 y V7-03. Manda junto con las reglas de oro de `CLAUDE.md` y el CREATIVE_BRIEF.
Skills de apoyo (cargá solo la que necesites en cada paso): `short-form-video` (ritmo y retención), `motion-art-direction`
(lenguaje de movimiento), `animation-principles` (curvas y peso), `beat-sync-editing` (cortes a tiempo, rampas de velocidad),
`caption-animation` (subtítulos palabra por palabra), `remotion-best-practices` (código Remotion).

## 1. Personalidad: Enérgica (cinética y filosa)

Una sola para toda la serie, sin mezclar:

| Propiedad | Valor |
|---|---|
| Entradas | `ease-out-expo` · `cubic-bezier(0.16, 1, 0.3, 1)` · 4–8 cuadros (30 fps) |
| Salidas | `cubic-bezier(0.7, 0, 0.84, 0)` · 3–5 cuadros. Nada se va despacio |
| Palabras gigantes y sellos | `spring` damping 10–12, stiffness 200, rebote 15–30% |
| Números de plata | sin rebote (suben/bajan secos, con "conteo" de dígitos) |
| Unidad base | 3 cuadros (0,1 s). Todo dura múltiplos de 3 |
| Cámara 2D | punch-in 1 → 1,12 en 5 cuadros sobre cada palabra clave (`camaraBeats`); latigazo lateral con desenfoque en cada cambio de escena |
| Transición por defecto | **corte seco**. Match-cut cuando hay forma común (caja → caja, ventana → celular). Nada de fundidos |

## 2. Grilla de ritmo

- Música base a 120 BPM → **15 cuadros por tiempo**. Cortes de escena en el tiempo; golpes, palabras y números en la **corchea (7–8 cuadros)**.
- **Algo cambia cada ≤ 15 cuadros (0,5 s)**; cada 2–3 s, una mini recompensa (revelación, número que explota, golpe con sonido grave).
- Intervalos **desparejos a propósito** (3, 5, 4, 6 cuadros…): un metrónomo aburre, lo irregular se siente como impulso.
- Energía: arranque al máximo (0–1,5 s) → construcción → **pico en el rompe-patrón** → silencio → revelación → descarga con el truco de la app.

## 3. Tres capas en cada plano

1. **Héroe:** lo único que importa en ese instante (la palabra, la mano, la barra de vida). Recibe el movimiento más grande y cae en el tiempo.
2. **Apoyo:** reacciona al héroe 2–3 cuadros después (polvo, sombra, billetes que vuelan, temblor de los carteles).
3. **Textura:** grano, polvo en el aire, luz que respira. Siempre en movimiento suave, nunca compite.

Si dos cosas pelean por la mirada en el mismo cuadro, una pasa a apoyo. Máximo 1/3 de los elementos moviéndose a la vez.

## 4. Recetas de impacto (lo que da dopamina)

- **Golpe completo** = anticipación de 2 cuadros (escala 0,95) → impacto (escala 1,15 + destello blanco 2 cuadros + temblor 6 cuadros que decae) → asentado con rebote. Siempre con sonido grave + agudo.
- **Hit-stop:** en los golpes fuertes, congelá 3 cuadros justo en el impacto (V7-03 en cada pelea, V7-02 en cada persiana).
- **Rampa de velocidad** antes de cada revelación: cámara lenta (×0,4) en los 10 cuadros previos y vuelta seca a ×1 en el golpe.
- **Silencio real antes de revelar** (0,3–0,4 s, sin música ni efectos). El golpe posterior se siente el doble.
- **El sonido entra 2–3 cuadros antes que la imagen** en los cortes (J-cut): tira al espectador hacia adelante.
- **Números que cuentan:** los montos ruedan dígito por dígito (8–12 cuadros) y terminan con un "clac".
- **Lluvia de recompensa:** monedas o billetes con física simple (gravedad + rebote + giro), todo determinista con semilla.

## 5. Rompe-patrones de la serie (componentes nuevos, reutilizables)

| Componente | Qué hace | Usado en |
|---|---|---|
| `Congelado` | congela el cuadro, desatura, rayón de disco, ícono ‖ gigante | V7-01 (8 s) |
| `RebobinadoVHS` | rebobina N segundos del propio video (renderizando cuadros anteriores) con líneas de tracking, "◀◀" y ruido; después cámara lenta | V7-01 (8–10 s, 17 s) |
| `FinFalso` | "FIN" + créditos que suben + silencio | V7-01 (10 s) |
| `VidrioRoto` | la pantalla se parte en triángulos desde un punto y vuelan hacia la cámara | V7-01 (10,5 s) |
| `Tragamonedas` | rodillos que giran y frenan con rebote; jackpot con luces | V7-02 |
| `ZoomMejorar` | zoom por pasos ×2 ×4 ×8 con pixelado que se aclara (mosaico) | V7-02 (reutilizable para V6-02) |
| `BarraVida` | barra tipo videojuego, con o sin números, golpe que baja con estela | V7-02, V7-03 |
| `Glitch` | cuadros repetidos, canales de color corridos, bloques que saltan | V7-03 |
| `CartelPelea` | cartel en diagonal "ROUND N" que entra con latigazo | V7-03 |
| `Escudo` | burbuja de luz desde el celular; lo que choca rebota con destello y "BLOQUEADO" | V7-01, V7-03 |

Ponelos en `src/v7/rompe.tsx`. Todo calculado desde `useCurrentFrame()`, sin estado ni azar sin semilla.

## 6. Subtítulos y texto

- Palabra por palabra con `@remotion/captions` (el sistema actual: 1–3 palabras, la activa amarilla ×1,12), con los tiempos de edge-tts.
- Las frases gigantes reemplazan al subtítulo (ya está así). Máximo 4 palabras por frase gigante.
- Todo dentro de la zona segura 9:16: nada importante en los 250 px de arriba ni en los 420 px de abajo, ni a la derecha (botones).
- El texto del gancho está en pantalla **desde el cuadro 0** (la mayoría mira sin sonido).

## 7. Sonido

- Cada evento visible tiene su sonido, distinto según el objeto (regla 4). Banco nuevo a sintetizar en `scripts/sfx.py`:
  `rayon`, `rebobinado`, `vidrio`, `tragamonedas`, `jackpot`, `aplauso`, `camion`, `moneda_arcade`, `golpe_8bit`, `ko`, `power_up`, `glitch`, `escudo`.
- Capa grave (sub) solo en los momentos grandes: gancho, rompe-patrón, revelación. Si suena en todos, deja de pegar.
- Música opcional por debajo (−18 dB) que **se corta** en los silencios y vuelve en la descarga.

## 8. Loop

Último cuadro = cuadro 0 (misma composición, mismo encuadre de cámara). El sonido final empalma con el primero.

## 9. Chequeo antes de dar por terminado

- [ ] Cuadro 0: kiosco + amenaza + texto del gancho, sin entrada desde negro.
- [ ] Ningún tramo de más de 0,5 s sin un cambio visible.
- [ ] Cada pregunta de la tabla del guion se abre y se cierra en el segundo indicado.
- [ ] Un solo "momento wow" por video (V7-01: la mano es tuya · V7-02: cae el A · V7-03: el jefe sos vos).
- [ ] Todo lo que se ve suena. Silencio antes de cada revelación.
- [ ] Montos con "(ejemplo)". Sin marcas ni personajes existentes.
- [ ] Último cuadro = cuadro 0.
