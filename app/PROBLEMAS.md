# Problemas: cómo se evitan, cómo se detectan y qué hacer si vuelven

Este archivo es la memoria de cada error que encontramos en En Claro. **Regla:** todo error nuevo entra acá con
su prueba automática antes de darlo por arreglado. Si una prueba de esta lista falla, el error volvió.

## El sistema (5 capas)

| Capa | Qué hace | Dónde está |
|---|---|---|
| 1. Prevención | Reglas de código que impiden repetir errores conocidos (una prueba falla si alguien las rompe). | `tests/redirecciones.test.ts`, `lib/redirigir.ts`, guardas de doble toque |
| 2. Detección | Más de 120 pruebas de la lógica, 40+ de seguridad de la base, el recorrido completo con Supabase real y escenarios en **Chrome de Android y Safari de iPhone**. Corren en cada cambio **y todas las noches** aunque nadie toque nada. | `.github/workflows/app.yml` (GitHub Actions) |
| 3. Contención | Si algo falla igual, la persona nunca ve un error en inglés ni pierde lo guardado: pantalla en español, botón "Probar de nuevo", recarga sola si la app quedó vieja, mensajes claros en cada formulario. | `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `components/errores/PantallaError.tsx` |
| 4. Diagnóstico | El servidor anota (sin datos personales) los casos raros: `[sesion]`, `[nueva-clave]`, `[pantalla-error]`. La pantalla de error da un **código** que el cliente te manda por WhatsApp. | Netlify → Logs → Functions |
| 5. Respuesta | Para cada problema conocido, qué hacer si vuelve (tabla de abajo) y cómo sumar uno nuevo. | este archivo |

## Problemas conocidos

| # | Qué se veía | Causa | Arreglo permanente | Prueba que lo vigila | Si vuelve |
|---|---|---|---|---|---|
| P-01 | Con la prueba vencida, la pantalla se quedaba rebotando ("demasiadas redirecciones"). | El permiso guardado en la sesión puede tener hasta 1 hora de atraso. | El acceso se decide en el momento, mirando la base, en cada pantalla. | `tests/acceso.test.ts`, recorrido real "vencida" | Revisar `lib/acceso.ts` → `destino()` y `app/suscribirme/page.tsx`. |
| P-02 | Error técnico al abrir la app con la prueba vencida. | La base (bien) esconde los datos y la pantalla esperaba encontrarlos. | Si la base no da el negocio, va a "Tu prueba terminó" (`SinAcceso`). | recorrido real "vencida" | Toda pantalla nueva tiene que atajar `SinAcceso`. |
| P-03 | Recuperar contraseña: "El link venció" o el link ya estaba usado. | Los antivirus del mail abren los links solos y los gastan. | El link se valida recién al tocar "Guardar contraseña". | recorrido real "recuperar contraseña" (incluye: el link no sirve dos veces) | Revisar `app/auth/callback` y `app/nueva-clave/acciones.ts`. |
| P-04 | Después de cambiar la contraseña, a los segundos pedía entrar de nuevo. | Supabase cierra las sesiones viejas al cambiar la contraseña. | Apenas se cambia, se abre una sesión nueva con la contraseña nueva. | recorrido real "recuperar contraseña" → entra a su bienvenida | Ver `[nueva-clave] entrar:` en los logs. |
| P-05 | La voz no entendía "1.250,50", "50 por Mercado Pago" o "le di 40 mil al de la gaseosa". | Formas de decir los montos que el lector no conocía. | Lector `lib/voz.ts` ampliado. | `tests/voz.test.ts` + 23 frases de `tests/escenarios-voz.test.ts` | Sumá la frase que falló a `escenarios-voz` y ajustá `lib/voz.ts`. Siempre queda cargarlo a mano. |
| P-06 | Fiados: se podía anotar un pago mayor a la deuda; doble toque guardaba dos veces; pérdidas como "$-53.000". | Faltaban controles. | Freno de sobrepago, guarda de doble toque en todas las pantallas, formato "-$53.000". | escenarios de fiados, doble toque, `tests/funciones.test.ts` | Toda pantalla nueva con "Guardar" lleva la guarda `enCurso`. |
| P-07 | La sesión "desaparecía" después de tocar un link del mail (o al pasar de `www.` a sin `www.`). | Una redirección armada con la dirección interna del servidor mandaba al navegador a **otra dirección del mismo sitio**; la sesión queda guardada a nombre de la anterior. | Todas las redirecciones usan `irA()` (dirección relativa, el navegador no cambia de sitio). Opcional en producción: `HOST_CANONICO` lleva a todos a una sola dirección. | `tests/redirecciones.test.ts` (prohíbe escribirlo de nuevo) + recorrido real (el link no cambia de dirección; salir tampoco) | No uses `NextResponse.redirect`; usá `irA()`. En Netlify cargá `HOST_CANONICO` con tu dominio. |
| P-08 | Si algo fallaba, el celular mostraba un cartel técnico en inglés. Después de cada actualización, quien tenía la app abierta podía ver errores. | No había pantallas de error propias; los archivos viejos ya no existen tras actualizar. | Pantallas en español con "Probar de nuevo" y código de error; recarga sola una vez si la app quedó vieja. | `tests/errores.test.ts` + escenario "link viejo" | Pedile al cliente el código de error y buscalo en los logs de Netlify. |
| P-09 | Quien se registraba y no terminaba el primer uso no podía salir de la cuenta. | Faltaba el botón. | "Salir de mi cuenta" al pie de la bienvenida. | recorrido real "salir" | — |
| P-10 | Pruebas que fallaban a veces (sobre todo en Safari). | La prueba recargaba antes de que la pantalla confirmara "Listo". | Regla: toda prueba espera el "Listo" antes de seguir. | — | Si una prueba falla una sola vez y después pasa, revisá que espere la confirmación. |
| P-11 | Factura con foto: renglones mal leídos o productos que no son tuyos. | Fotos movidas, otros proveedores. | Lector con cruce por parecido; lo dudoso queda en "No lo uses"; siempre se puede usar "Aumentó un %". | `tests/facturas.test.ts` (3 facturas reales al 100%) + escenarios de factura | Guardá la foto que falló en `tests/facturas/` con su resultado esperado. |
| P-12 | Sin internet o sin la base configurada. | Corte de conexión o variables sin cargar. | Pantalla "sin conexión" de la app y aviso "falta configurar" que nombra la variable. | escenarios "todas las pantallas" | Cargá la variable que nombra el aviso en Netlify. |

## Cómo se suma un problema nuevo (siempre igual)

1. Reproducirlo con una prueba que falle (escenario, recorrido real o prueba de la lógica).
2. Encontrar la causa de fondo, no tapar el síntoma: anotar qué se veía, por qué pasaba y cuál es la causa.
3. Arreglar la causa y, si se puede, agregar una regla que impida volver a escribir el error (capa 1).
4. Ver la prueba pasar en Chrome y en Safari, con Supabase real.
5. Sumar la fila a la tabla de arriba.

## Si un cliente te avisa que algo no anda (desde el celular)

1. Pedile el **código del error** que muestra la pantalla y en qué pantalla estaba.
2. Abrí GitHub → Actions → "App": si la última corrida está en rojo, el problema ya está detectado.
3. Pasale a Claude el código del error y el nombre de la pantalla: con este archivo encuentra la causa rápido.
4. Mientras tanto, el cliente puede cargar todo a mano: nada de lo guardado se pierde.
