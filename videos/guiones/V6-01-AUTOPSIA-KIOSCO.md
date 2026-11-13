# V6-01 · "Autopsia de un kiosco" (≈34 s)

> Molde nuevo **"Expediente"** (policial/forense). Cumple las 6 reglas de oro. Se publica el día anterior a V6-02:
> cada uno termina anunciando al otro ("Mañana: …") para que la gente vuelva al perfil.
> Base: `src/v6/comun.tsx` (`Marco`, `camaraBeats`, `GanchoGigante`, `Celular`, `BotonProbalo`, `"encadenar": "recortar"` en la voz). Reutilizá lo que exista (`Kiosco3D`, `Piso`, `Cinta`/`TrozoCinta` de v4, `Subtitulos`, `tPalabra` de `src/lib/guion.ts`, sonidos de `public/sfx`).
> Momentos clave atados a la voz con `tPalabra` (patrón de `SeHunde.tsx`). Montos con "ejemplo" en pantalla.

## Idea

Un perito forense hace la autopsia de un kiosco que cerró **vendiendo más que nunca**. Revisa las sospechas de siempre
(fiados, aumentos, la caja) y las descarta. El arma: **su producto estrella**. Llenó el local de lo que más se vendía,
y eso era lo que menos le dejaba. La app es el "luminol" que muestra cuánto deja cada producto.

## Voz

Tomás (`es-AR-TomasNeural`), perito frío y rápido: `rate` +25%, `pitch` −4Hz. Gancho con fuerza (`rate` +15%, `volume` +20%).
Silencio real de 0,6 s antes de "Su producto estrella." (sin música ni efectos).

## Guion

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2 | "Este kiosco vendió más que nunca. Y cerró igual." | **Cuadro 0:** vereda de noche, el kiosco con la persiana baja y el toldo, luces de patrullero rojas y azules barriendo la fachada. En el piso, **silueta de tiza con forma de kiosco**. Una cinta "NO PASAR" entra de un latigazo y cruza la pantalla. Caen gigantes "VENDIÓ MÁS QUE NUNCA" y un sello rojo "Y CERRÓ" que hace temblar todo. | Sirena corta + latigazo de cinta + golpe |
| 2–4 | "Soy perito. Y encontré el arma." | Mano con guante de látex levanta una **bolsa de evidencia "ARMA — N° 0"** con el contenido pixelado y un "?" encima. La bolsa queda colgada en una esquina hasta el seg. 24 (misterio a la vista). Flash de cámara. | Guante que se estira + flash |
| 4–10 | "Evidencia uno: fiados. Dos: una factura con aumento. Tres: la caja. Doscientos mil por día." | Cámara 3D recorre el mostrador. Con cada número cae un **cartelito amarillo de evidencia** (1, 2, 3) junto al objeto: cuaderno de fiados, factura, caja abierta. Cada uno se congela con flash y sello "EVIDENCIA N". "$200.000 por día (ejemplo)". | Flash + clic por evidencia, sello |
| 10–12 | "Ninguna de estas lo mató." | **Re-gancho:** un golpe de viento tira los tres carteles. Apagón. Solo queda la bolsa "?" iluminada por una linterna que tiembla. | Viento + clic de linterna + zumbido grave |
| 12–17 | "Mirá. Las ventas, subiendo. La ganancia… bajando." | **Comparación:** sobre la persiana se dibuja un **monitor cardíaco** con dos líneas. VENTAS (verde) sube con cada latido; GANANCIA (amarilla) late cada vez más débil hasta quedar **plana**. Las dos líneas se cruzan formando una X. | Pitidos de monitor que se aceleran → pitido largo plano |
| 17–22 | "Llenó el local de lo que más se vendía. Y lo que más se vendía… casi no le dejaba nada." | Timelapse 3D: la góndola y la heladera se llenan solas de la misma botella de gaseosa genérica (sin marca), desplazando a los otros productos, que salen volando. Sobre las botellas, contador de unidades que sube; arriba, "le deja $96 c/u (ejemplo)". | Botellas que se apilan + caja registradora rápida |
| 22–25 | "¿El arma?" … "Su producto estrella." | **Revelación:** silencio total 0,6 s. La bolsa se despixela: adentro, una botella de gaseosa con estrella dorada y etiqueta "EL MÁS VENDIDO". Sello rojo **"ARMA HOMICIDA"**. El "?" se cae. | Silencio → golpe grave |
| 25–30 | "Esto lo hubiera salvado: el que más vendés no es el que más te deja." | **El truco:** el celular (≥55% del alto) rocía "luminol" azul sobre la góndola. Con luz negra, cada producto brilla según lo que deja: la gaseosa en **rojo 6%**, el alfajor en **verde 46%**, la yerba 20%… En la pantalla del celular, el ranking de En Claro ordenado por margen. | Spray + zumbido de luz UV + "ding" por producto |
| 30–34 | "Caso cerrado. Mañana: el kiosco al que le roban todos los días… y la cámara no ve a nadie." | Sello "CASO CERRADO" sobre una carpeta. Teaser de 0,8 s: imagen de cámara de seguridad con "REC" y un recuadro rojo que parpadea sobre el mostrador (es V6-02). Texto chico: "Probalo gratis · link en el perfil". Último cuadro = cuadro 0 (silueta de tiza + luces) para el loop. | Sello + estática de video |

## Visual

- **Paleta policial:** noche azul petróleo, luces rojo/azul que barren (calculadas por cuadro, nada aleatorio), amarillo de cinta y de carteles de evidencia.
- **3D (`@remotion/three`):** reutilizá `Kiosco3D` y `Piso`. Modelos nuevos en `src/v6/ModelosPerito.tsx`: `CintaPolicial` (tira con texto en textura de canvas),
  `CartelEvidencia` (prisma triangular amarillo con número), `BolsaEvidencia` (plano translúcido con etiqueta), `Botella` (genérica, sin marca).
- **Silueta de tiza:** trazo blanco irregular sobre la vereda, con `strokeDashoffset` que se dibuja en el cuadro 0 (ya visible en el cuadro 0).
- **Monitor cardíaco:** SVG con dos trazos que avanzan por cuadro; la línea de ganancia baja de amplitud hasta 0 justo en "bajando".
- **Luminol:** capa violeta oscura sobre la escena + productos con material emisivo rojo/verde según su margen; los porcentajes aparecen como etiquetas 2D proyectadas (`proyectar()` de `ElDueno.tsx`).
- **Sonidos nuevos a sintetizar en `scripts/sfx.py`:** sirena corta, latigazo de cinta, guante de látex, flash de cámara, monitor cardíaco (pitidos + plano), spray, zumbido UV, estática de video.
- Rótulo chico fijo abajo: "Dramatización · montos de ejemplo".
