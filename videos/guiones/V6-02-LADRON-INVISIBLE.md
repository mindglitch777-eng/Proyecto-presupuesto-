# V6-02 · "El ladrón que la cámara no ve" (≈38 s)

> Molde **"Expediente"**, segundo caso (thriller de cámara de seguridad). Cumple las 6 reglas de oro.
> Se publica el día después de V6-01 y termina anunciándolo ("Mañana: el kiosco que vendió más que nunca…") para cerrar el círculo.
> Base: `src/v6/comun.tsx` (`Marco`, `camaraBeats`, `GanchoGigante`, `Celular`, `BotonProbalo`, `"encadenar": "recortar"` en la voz). Reutilizá lo que exista (`Kiosco3D`, `Piso`, `Subtitulos`, `tPalabra`, sonidos de `public/sfx`; los de V6-01 si ya están).
> Momentos clave atados a la voz con `tPalabra`. Montos y porcentaje con "ejemplo" en pantalla.
> **No nombrar ninguna marca** de cobros: se dice "el QR", "la tarjeta", "el posnet".

## Idea

Un kiosquero cuenta que le roban todos los días y la cámara no ve a nadie. Revisa empleados, cambia la cerradura, cuenta la caja dos veces.
Deja la cámara grabando de noche y descubre al ladrón: **estaba pegado en el mostrador**. Es el QR/posnet: con cada cobro con el celular
o con tarjeta se queda una comisión que él nunca restó. La app lo atrapa: descuenta la comisión del cierre y la suma al precio sugerido.

## Voz

Tomás (`es-AR-TomasNeural`), tenso, como quien cuenta algo raro: `rate` +20%, `pitch` −3Hz. Gancho con fuerza (`rate` +15%, `volume` +20%).
Silencio real de 0,5 s antes de "El ladrón estaba pegado ahí."

## Guion

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2 | "Me roban todos los días, en mi cara. Y la cámara no ve a nadie." | **Cuadro 0:** vista de cámara de seguridad (blanco y negro, granulado, "● REC", "CAM 02", hora que corre) del interior del kiosco: mostrador, góndola, heladera, toldo en la vidriera. **El cajón de la caja se abre solo de un golpe** y salen billetes volando. Recuadro rojo de "MOVIMIENTO DETECTADO" que parpadea sobre un punto del mostrador (misterio a la vista hasta el seg. 18). Caen gigantes "ME ROBAN TODOS LOS DÍAS". | Cajón que golpea + estática + golpe |
| 2–5 | "Revisé a los empleados. Cambié la cerradura." | Cortes rápidos de cámara: CAM 01, CAM 03, CAM 04. Un candado nuevo que cierra. Fotos de "sospechosos" tachadas con marcador rojo (siluetas genéricas, sin caras reales). | Clic de cambio de cámara por corte + candado |
| 5–9 | "Y cada mes, faltan cien mil." | Mañana, a color: manos contando billetes sobre el mostrador; el fajo se achica en cada pasada. Calendario que pasa hojas: −$100.000 (ejemplo) en rojo en cada mes. | Conteo de billetes + hojas de calendario |
| 9–12 | "Anoche dejé la cámara grabando." | **Re-gancho:** visión nocturna verde, el local vacío, la hora corre a toda velocidad 23:00 → 03:13. Un zoom lento hacia el recuadro rojo. | Zumbido de visión nocturna + reloj acelerado |
| 12–16 | "Tres y catorce. Algo se movió en el mostrador." | 03:14:07. Zoom "mejorar imagen" ×2 ×4 ×8 (pixelado que se aclara por pasos) sobre el recuadro: es un **cartelito con un código QR**. El QR empieza a brillar. | Pitido de "mejorar" por paso + latido |
| 16–21 | (0,5 s silencio) "El ladrón estaba pegado ahí. Cada vez que me pagaban con el celular, se quedaba un pedacito." | **Revelación:** el QR se vuelve un **remolino**: monedas y billetes de todo el local son chupados hacia adentro como un desagüe. En cada cobro (clientes en silueta acercan el celular) sale un billete y un pedazo se queda en el QR: "4% (ejemplo)". | Silencio → succión + tintineo de monedas |
| 21–28 | "Un ladrón te saca cinco mil y llamás a la policía. Este te saca cien mil por mes… y le das las gracias." | **Comparación** en pantalla partida: izquierda, un ladrón con pasamontañas, sirenas y patrullero (−$5.000); derecha, el QR sonriente con un cartel "GRACIAS POR SU COMPRA" (−$100.000/mes, ejemplo). La mitad derecha crece hasta comerse a la izquierda. | Sirena a la izquierda / campanita de "gracias" a la derecha |
| 28–33 | "Ahora En Claro me descuenta la comisión antes de decirme cuánto gané. Y me sube los precios lo justo." | **El truco:** el celular (≥55% del alto) con En Claro; el remolino del QR se frena y se cierra. En la pantalla: cierre del día con "Comisiones de cobro −$3.400" y "Hoy te quedaron $37.267 (ejemplo)"; abajo, precio sugerido que ya incluye la comisión. Alarma verde "Ladrón atrapado". | Remolino que se frena + alarma corta + caja registradora |
| 33–38 | "¿Cuánto te cobra a vos? Comentalo. Mañana: el kiosco que vendió más que nunca… y cerró igual." | Teaser de 0,8 s: silueta de tiza con forma de kiosco y luces de patrullero (es V6-01). Texto chico: "Probalo gratis · link en el perfil". Último cuadro = cuadro 0 (cámara de seguridad, cajón a punto de abrirse) para el loop. | Estática + golpe seco |

## Visual

- **Estética de cámara de seguridad:** blanco y negro con grano, líneas de escaneo y "● REC" titilando; visión nocturna en verde. Todo el ruido sale de una función con semilla por cuadro (determinista).
- **3D:** reutilizá `Kiosco3D` y `Piso` vistos desde arriba en diagonal (ángulo de cámara de techo, lente gran angular con leve distorsión).
  Modelos nuevos en `src/v6/ModelosCamara.tsx`: `CartelQR` (cartelito de mostrador con QR genérico dibujado en canvas, sin logos), `Remolino` (espiral de partículas calculada por cuadro), `Billete`/`Moneda` (reutilizá los de `ModelosBanco.tsx`).
- **"Mejorar imagen":** el recuadro se escala por pasos y se pixela/des-pixela con un canvas de baja resolución que va subiendo de tamaño.
- **Pantalla partida:** dos mitades con la misma escena; la derecha empuja el borde hacia la izquierda en "gracias".
- **Sonidos nuevos a sintetizar en `scripts/sfx.py`:** estática de video, cambio de cámara, candado, zumbido de visión nocturna, pitido de "mejorar", succión de remolino, alarma corta.
- Rótulo chico fijo abajo: "Dramatización · montos y comisión de ejemplo".
- Cuentas de ejemplo: cobros con celular o tarjeta $85.000 por día × 30 = $2.550.000 × 4% ≈ **$100.000 por mes**; hoy: $85.000 × 4% = $3.400.
