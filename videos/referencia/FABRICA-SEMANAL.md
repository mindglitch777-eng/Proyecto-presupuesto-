# Fábrica semanal · 2 videos por día sin morir en el intento (desde 23/11/2026)

Decisión del dueño (21/11): volumen y constancia antes que perfección. Lo crudo y nativo ("lo-fi") convence más que lo pulido;
regla 80/20: **80% formatos lo-fi con plantilla, 20% videos "héroe"** (metáfora 3D tipo V9-03).
Todo sigue el SISTEMA-VIRAL (dolor real del kiosquero, número que duele, app como salida, precio "por mes", "(ejemplo)" en montos).

## Cómo funciona
1. **Una plantilla de Remotion por formato** (`src/lofi/`). Un episodio nuevo = un bloque en el JSON de la semana, sin código nuevo.
2. **El domingo**: Claude (chat) escribe `videos/semanas/AAAA-MM-DD.json` con los 14 episodios de la semana (12 lo-fi + 2 héroe).
3. **Claude Code** renderiza los 12 lo-fi en UNA corrida de `videos.yml` y produce los 2 héroe; regenera `CALENDARIO-PUBLICACION.html` desde el JSON.
4. **El dueño** solo sube según el calendario (botón Copiar) y el domingo pasa capturas de métricas.
5. **Plata**: cada semana, el video con mejor % a los 3 s y más compartidos se promociona (Spark Ads en TikTok / promocionar en Facebook) con poco presupuesto. Se pagan ganadores probados, nunca videos nuevos.

## Los 5 formatos lo-fi (plantillas)
| Formato | Cómo se ve | Voz | Duración |
|---|---|---|---|
| **F1 · Notas** | Pantalla de app de notas genérica (sin marcas) sobre foto real desenfocada de mostrador. La cuenta se tipea renglón por renglón, se tacha, el resultado sale en rojo. Última línea con remate humano. | No (tipeo + música propia) | 12–16 s |
| **F2 · Chat** | Conversación de mensajería genérica (verde, sin logo ni marca). Burbujas que entran con sonido, "escribiendo…", tildes, "visto". Giro al final + pantalla real de la app. | No | 14–20 s |
| **F3 · POV** | Toma real de stock (Pixabay/Wikimedia, uso comercial) de kiosco, persiana, góndola o cuaderno, zoom lento; texto grande "POV: …" y a mitad el giro con el número. | No | 8–12 s |
| **F4 · Adiviná** | Pregunta + 3 opciones A/B/C + cuenta regresiva de 3 s + respuesta con golpe + cómo lo sabés (app). | Sí (Orus) | 14–18 s |
| **F5 · La cuenta** | Calculadora gigante que hace la cuenta en vivo mientras la voz la dice; resultado traducido a dolor. | Sí (Orus) | 15–22 s |

Reglas de plantilla: texto ≥ 56 px, máximo 2 textos a la vez, cambio visible cada ≤ 0,7 s, cuadro 0 ya con el dolor,
cierre de 3 s con el precio "por mes" + pregunta para comentar + "Mandáselo a…", último cuadro = primer cuadro.
Sin voz = no gasta la cuota de Gemini y renderiza en minutos.
