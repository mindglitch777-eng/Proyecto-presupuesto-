# V8-06 · "Rayos X" (≈30 s)

> Estándar nuevo (`videos/referencia/ESTANDAR-CALIDAD.md`). Serie V8 con **comparaciones en 3D**, estilo **render de producto** (ver V8-05: materiales
> realistas, luz de estudio, profundidad de campo, sin low-poly ni muñecos). `@remotion/three`, determinista. Voz **Orus** sin acelerar.
> Montos "(ejemplo)". Productos genéricos sin marcas. Nunca fotos CC BY-SA.

## Idea

Un escáner de rayos X barre el depósito del kiosco. Las cajas se vuelven transparentes y adentro hay plata congelada: $400.000 en mercadería que no se vende.
La caja más cara es la que el dueño más repone. Esa plata son 17 días de trabajo guardados en cajas. En Claro le muestra la plata dormida y qué no reponer.

**Cuenta (ejemplo):** galletitas que vencen en 40 días $86.000 · golosinas que nadie lleva $120.000 · bebidas que no rotan $94.000 · artículos de limpieza parados $100.000
= **$400.000** ≈ **17 días** de lo que le queda por día ($23.500, misma base que el V8-01).

## Preguntas (loops)

| Se abre | Pregunta | Se cierra |
|---|---|---|
| 0 s | ¿Dónde están escondidos los $400.000? | 4–13 s, caja por caja |
| 13 s | ¿Cuál es la caja más cara? ("la que más te gusta reponer") | 16 s |
| 18 s | ¿Cuánto es eso en días de trabajo? | 20 s |

## Voz (≈75 palabras)

Actuación: "Kiosquero argentino de 50 años, voseando, en tono de revelación, como quien muestra algo que nadie vio; misterioso al principio, indignado al final; ritmo natural".

## Guion

| Seg. | Voz | Qué se ve (3D) | Sonido |
|---|---|---|---|
| 0–2 | "Tenés cuatrocientos mil pesos escondidos en tu kiosco. Y no los podés gastar." | **Cuadro 0:** depósito del kiosco en 3D (estantes metálicos, cajas de cartón apiladas, foco colgante), y un **haz de escáner azul** que entra por la izquierda. Texto: **"$400.000 ESCONDIDOS"**. | Zumbido eléctrico del escáner + golpe |
| 2–4 | "Mirá." | El haz barre; donde pasa, las cajas se vuelven **transparentes como rayos X** (borde azul, interior visible). | Barrido con pitido |
| 4–7 | "Galletitas que vencen en cuarenta días: ochenta y seis mil." | Adentro de la primera caja se ven paquetes y, entre ellos, **billetes congelados** con escarcha. Etiqueta flotante con el monto. Contador **ESCONDIDO** arriba: $86.000. | Pitido de detección + cristal helado |
| 7–10 | "Golosinas que nadie lleva: ciento veinte mil." | Segunda caja, con **telarañas** en la transparencia. Contador: $206.000. | Pitido + golpe |
| 10–13 | "Bebidas que no rotan. Limpieza parada." | Dos cajas seguidas, ritmo más rápido. Contador: **$400.000**. | Dos pitidos + golpes |
| 13–16 | "Y la caja más cara… es la que más te gusta reponer." | **Re-gancho:** el escáner se frena en una caja grande del fondo que **tiembla**; luz roja de alarma. Se abre: es la de golosinas, la que el dueño repone todas las semanas. | Alarma corta + latido |
| 16–18 | (silencio 0,5 s) "¿Sabés cuánto es eso?" | Las cajas se cierran; sólo queda el número **$400.000** girando en 3D. | Silencio → golpe |
| 18–21 | "Diecisiete días de trabajo. Guardados en cajas." | **Comparación 3D:** los billetes salen de las cajas y forman una **fila de 17 bloques** (uno por día), cada uno con su fecha de calendario. La cámara la recorre de punta a punta. Rótulo: **"17 DÍAS DE TRABAJO"**. | Un "clac" por bloque, en ráfaga |
| 21–27 | "En Claro te muestra la plata dormida y te dice qué no volver a comprar." | **El truco:** pantalla real de la app (Depósito, `ENCLARO_DEMO=v8-06`, mismos productos y montos) en un celular 3D; las cajas del depósito pasan de azul a verde a medida que la app las marca. | "Ding" por caja |
| 27–30 | "¿Cuánto tenés vos escondido? Probalo gratis, link en el perfil." | Vuelve el depósito oscuro del cuadro 0 con el haz entrando. "Probalo gratis · link en el perfil". Último cuadro = cuadro 0. | Zumbido que empalma |

## Notas de producción

- Efecto rayos X: material de las cajas con transparencia + borde (fresnel) azul, activado según la posición del haz (función del cuadro, determinista).
- Escarcha y telaraña como texturas simples; nada de partículas con azar sin semilla.
- Control de calidad de la sección 6 antes de entregar. MP4 por chat + link directo de GitHub.
