# Demos para Facebook FB-01 a FB-03 (21/11/2026) — "que parezca de celular"
Objetivo: vender en Facebook. Estilo: **grabación de pantalla real de la app en el celular**, nada de 3D ni animación de publicidad.
Pantalla completa vertical como un "grabar pantalla" del teléfono: barra de estado arriba, toques de dedo (círculo gris), scroll natural.
Encima, máximo 1 texto grande arriba (gancho) + subtítulo palabra por palabra abajo. Voz: Gemini Orus en **primera persona, tono kiosquero contando
a otro kiosquero**, natural, sin acelerar. Montos "(ejemplo)" en pantalla. Música propia muy baja. 20–30 s. Último cuadro con el precio "por mes".

## FB-01 · "Cerré mi kiosco en 20 segundos, hablando" (demo de voz)
Texto fijo arriba: **"Cierro el kiosco hablando 🎙️"**
| Voz (exacta) | Pantalla |
|---|---|
| "Así cierro mi kiosco a la noche. No cargo venta por venta." | Abre la app en Tu día / cierre. |
| "Toco el micrófono y le cuento mi día:" | Dedo toca el micrófono; aparece la onda de grabación. |
| (frase de cierre) **usar exacta una de las 5 frases de `app/tests/voz.json`**, dicha por la voz | El texto reconocido aparece escribiéndose en pantalla mientras la voz lo dice, y la app lo convierte en el cierre. |
| "Y listo. Me dice cuánto me quedó de verdad. No lo que entró: lo que me quedó." | Número del día grande (ganancia) y "entró a la caja" aparte. Zoom suave al número. |
| "Los primeros cien kioscos pagan doce mil novecientos por mes, para siempre. Probalo catorce días gratis." | Cartel final: "$12.900 por mes, para siempre · 14 días gratis · escribinos por WhatsApp". |

## FB-02 · "Los otros sistemas te hacen cargar todo" (comparación, sin nombrar a nadie)
Texto fijo arriba: **"¿Tu sistema te hace cargar TODO?"**
| Voz (exacta) | Pantalla |
|---|---|
| "¿Tu sistema te hace cargar cada venta, cada producto, cada precio?" | Arriba (6 s): un formulario genérico "Cargar venta" que se repite y se repite, dedo tipeando, cansador (dibujado genérico, sin marca ni copia de ningún sistema real). |
| "Si un día no cargás, ya no sirve." | El formulario se llena de campos vacíos en rojo. |
| "Con En Claro le contás tu día hablando, en veinte segundos," | Corte a En Claro: micrófono + frase de `voz.json` reconocida. |
| "y te dice cuánto te quedó, a quién cobrarle y qué precio subir." | Tres pantallas reales rápidas: Tu día → Fiados (semáforo) → Precios (precio sugerido). |
| "Los primeros cien kioscos pagan doce mil novecientos por mes, para siempre." | Cartel final igual a FB-01. |

## FB-03 · "Le saqué foto a la factura y me dijo qué precio cambiar"
Texto fijo arriba: **"Le saco foto a la factura 📸"**
| Voz (exacta) | Pantalla |
|---|---|
| "Llegó la factura del proveedor. Antes la revisaba renglón por renglón." | `/app/factura`: la factura de ejemplo propia (sin marcas, `tests/facturas/`). |
| "Ahora le saco una foto…" | Dedo toca la cámara; la factura se lee (barrido). |
| "…y me dice qué subió y a cuánto tengo que poner cada cosa." | "El proveedor aumentó X%" + lista con precio sugerido, productos que subieron en rojo. |
| "Sin cargar nada a mano. Y mi margen no se pierde." | Toca un producto: precio sugerido aplicado; opción de cartel para imprimir. |
| "Los primeros cien kioscos pagan doce mil novecientos por mes, para siempre." | Cartel final igual a FB-01. |

## Textos para publicar (página de Facebook)
FB-01: "Cierro el kiosco hablándole al celular 🎙️ 20 segundos y me dice cuánto me quedó de verdad (no lo que entró a la caja). Sin cargar venta por venta. ¿Vos cómo cerrás la caja? 👇 Los primeros 100 kioscos pagan $12.900 por mes, para siempre. 14 días gratis: https://enclaroar.netlify.app"
FB-02: "Si tu sistema te hace cargar cada venta, el día que no cargás deja de servir. Con En Claro le contás tu día hablando y te dice cuánto te quedó, a quién cobrarle y qué precio subir. ¿Cuánto tiempo perdés cargando? 👇 $12.900 por mes, para siempre (primeros 100 kioscos). 14 días gratis: https://enclaroar.netlify.app"
FB-03: "Llegó la factura del proveedor: foto y listo 📸 Te dice qué aumentó y a cuánto poner cada producto para no perder margen. ¿Cada cuánto te aumenta tu proveedor? 👇 $12.900 por mes, para siempre (primeros 100 kioscos). 14 días gratis: https://enclaroar.netlify.app"

## Texto para grupos de kiosqueros (aporte, no venta; respetar reglas del grupo)
"Hola, soy [nombre], hice una calculadora gratis para kiosqueros: ponés lo que vendiste, tus gastos fijos y te dice cuánto te quedó de verdad en el día (no lo que entró a la caja). No hay que registrarse. La dejo por si a alguien le sirve: https://enclaroar.netlify.app — Aclaro que la hice yo, si tienen ideas para mejorarla las leo 🙌"
