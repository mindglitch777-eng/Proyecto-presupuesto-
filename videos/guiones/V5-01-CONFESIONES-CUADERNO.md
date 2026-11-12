# V5-01 · "Confesiones de un cuaderno de fiados" (35 s) — APROBADO

> Primer video del molde **"Objeto que habla"** (serie "Confesiones de…"). Cumple las 6 reglas de oro.
> Reutilizá lo que exista (`Kiosco`, `Capas`, `Subtitulos`, `tPalabra` de `src/lib/guion.ts`, sonidos de `public/sfx`).
> Los momentos clave se sincronizan con la voz usando `tPalabra` (patrón de `SeHunde.tsx`).

## Idea

El narrador es el **cuaderno de fiados** del kiosco, que confiesa que lleva años fundiendo a su dueño.
Misterio abierto desde el segundo 2: "hoy te voy a decir quién fundió a mi dueño". Giro: fue el propio cuaderno.

## Voz

Tomás (`es-AR-TomasNeural`), pero como personaje cansado: **más lento y más grave** que en los otros videos
(`rate` alrededor de +0% a +5%, `pitch` −6Hz aprox.). Excepción: el gancho entra con fuerza (`rate` +15%, `volume` +20%).
Pausa real de 0,5 s antes de "Fui yo." (silencio también en la mezcla: sin música ni efectos).

## Guion

| Seg. | Voz | Qué se ve | Sonido |
|---|---|---|---|
| 0–2 | "Soy el cuaderno de fiados de un kiosco… y te estoy fundiendo." | **Cuadro 0:** el cuaderno sobre el mostrador, de frente a cámara, kiosco desenfocado atrás (toldo, góndola, heladera). Las letras se escriben solas con birome, a mano, gigantes: **"TE ESTOY FUNDIENDO"** (ya hay trazo visible en el cuadro 0). Al terminar la última letra, la tinta se pone roja y chorrea. Temblor en el golpe. | Birome raspando rápido + golpe |
| 2–5 | "Hace once años que vivo en este mostrador. Y hoy te voy a decir quién fundió a mi dueño." | La cámara entra entre las páginas: un pasillo de papel con manchas de café, esquinas dobladas, fechas viejas. Un signo de pregunta escrito a mano queda flotando en una esquina (el misterio a la vista hasta el segundo 22). | Hoja que se da vuelta + reloj de pared |
| 5–11 | "Doña Marta: dieciocho mil. Juan: siete quinientos. El de la moto: nunca supe el nombre." | Las páginas pasan solas como un fichero. Cada nombre se escribe a mano (sincronizado con la palabra) y al lado un número que crece como contador. "El de la moto" tiene un garabato en vez de nombre. | Hojas rápidas + tic por número |
| 11–14 | "Ciento ochenta mil pesos… que él cree que va a cobrar." | Todos los números se despegan del papel y se juntan en uno gigante que flota: **$180.000**, con "ejemplo" a mano debajo. | Riser + golpe |
| 14–16 | "Pero eso no es lo peor." | **Re-gancho:** una hoja se arranca de un tirón. Pantalla blanca, la hoja rota tiembla. | Papel arrancado + silencio |
| 16–22 | "Lo peor es lo que no anoto. No anoto cuánto le aumentó el proveedor. No anoto lo que se vence. No anoto cuánto le queda al final del día." | Renglones vacíos con etiquetas tachadas: "aumento", "vencidos", "ganancia". La tinta intenta escribir y se borra sola. La página se pone gris. | Birome que no escribe + latido |
| 22–25 | "¿Querés saber quién lo fundió?" … "Fui yo." | **Revelación:** las páginas se abren en abanico y, vistas de frente, sus bordes forman **"FUI YO"**. Medio segundo de silencio total antes de "Fui yo". El signo de pregunta del misterio se borra. | Silencio → golpe grave |
| 25–31 | "Ahora le habla al celular, y en cinco minutos sabe todo lo que yo le escondí." | **El truco:** luz amarilla desde abajo del cuaderno: el celular. La tinta se despega de las páginas, vuela en hilos y entra al celular (≥55% del alto), donde se ordena en pantallas de En Claro: fiados en semáforo, precio sugerido, "Hoy te quedaron $41.200" (ejemplo). | Tinta líquida + whoosh + caja registradora |
| 31–35 | "Me jubiló. Y la verdad… me lo merecía. ¿Cuántos años tiene tu cuaderno? Comentalo." | El cuaderno se cierra solo, entra en un cajón que se cierra. Etiqueta a mano en la tapa: **"2015 – 2026. Descansa en paz."** Último cuadro: el cuaderno sobre el mostrador como en el cuadro 0 (loop). | Cajón + campanita |

## Visual

- **Mundo de papel:** textura de hoja cuadriculada, birome azul, manchas de café, esquinas dobladas. En 3D (`@remotion/three`) para el pasillo de páginas y el abanico; el resto puede ser 2D sobre texturas de canvas.
- **Letra a mano:** usar `PermanentMarker.woff2` (ya está en `public/fuentes`) con revelado por trazo (máscara que avanza por el texto) para que parezca que se escribe en vivo.
- **Abanico "FUI YO":** las hojas son planos 3D; al abrirse, la cámara queda de frente y cada hoja tiene pintado un fragmento de las letras en su borde, así solo se lee de frente. Calcularlo por cuadro, determinista.
- **Tinta que vuela:** curvas Bézier con trazo animado (`strokeDashoffset`) desde las páginas hasta el celular, con gotas que caen.
- **Sonidos nuevos a sintetizar en `scripts/sfx.py`:** birome raspando, hoja que se da vuelta, papel arrancado, reloj de pared, tinta líquida, cajón.

## Serie (próximos objetos que confiesan)

- La heladera: "Me como tu luz y vos no te enterás."
- La góndola: "Tengo cosas que nadie compra hace meses."
- La caja registradora: "Lo que entra no es lo que te queda."
