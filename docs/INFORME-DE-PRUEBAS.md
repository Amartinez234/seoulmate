# Informe de pruebas · Seoulmate v1.0

Fecha: 16 de octubre de 2026. Entorno: Linux, Node 22.22, Chromium 141 (headless) con emulación de Pixel 7 (393×851, táctil), zona horaria America/Argentina/Buenos_Aires.

## Resumen

| Verificación | Resultado |
| --- | --- |
| TypeScript estricto (`tsc --noEmit`) | ✅ sin errores |
| Compilación de producción (`npm run build`) | ✅ 23 archivos precacheados (≈ 906 KB) |
| Pruebas unitarias (Vitest) | ✅ 31 de 31 |
| Pruebas de punta a punta (Playwright) | ✅ 10 de 10 |

## Pruebas unitarias (31)

**Cifrado y bóveda (6):** cifrar/descifrar y fallo con otra clave · rechazo de contraseñas cortas · crear, bloquear, rechazar contraseña errónea y desbloquear (y que el texto no se guarde en claro) · espera progresiva tras 5 fallos · cambio de contraseña conservando datos · persistencia de documentos con diario y capítulo en registros separados.

**Gatito (13):** nombre obligatorio · alimentar (+25 energía, +2 corazones) · espera entre acciones · no juega con poca energía y no come lleno · jugar (+15 felicidad, +5 con juguete, −10 energía) · acariciar (+6 cariño) · tope diario de corazones por acciones · **30 días sin entrar: cariño intacto, energía y felicidad vuelven a 60** · visita diaria una vez por día y regalo de bienvenida tras 3+ días · misiones solo completas y una vez · recompensa por tarea una sola vez · tienda (corazones insuficientes, nivel requerido, compra, colocar/quitar, pared) · niveles.

**Fechas, dramas, validación, frases (8):** fechas reales (29/02) · contador de años/meses/días/total · próximo mesiversario (incluye meses cortos) · desbloqueo por fecha y cuenta regresiva · filtros por estado, género, puntuación, búsqueda y recomendados · ruleta excluye terminados y respeta ánimo · validación de obligatorios, longitud y fecha · frase del día estable durante el día.

**Copias y sincronización (4):** paquete del capítulo sin el diario, cifrado, contraseña errónea rechazada, importación que conserva cartas ya abiertas e imágenes · copia completa restaurada en otro dispositivo · combinación sin duplicados · sincronización con servidor simulado: sube cifrado, otra contraseña es rechazada, el dispositivo nuevo recibe los datos y luego sube sus cambios.

## Pruebas de punta a punta (10), con resultado real

| # | Escenario | Qué se verificó | Resultado |
| --- | --- | --- | --- |
| 1 | Primer uso y navegación | Errores de validación del alta; saludo con el apodo; frase del día; 4 accesos directos; navegación por las 5 pestañas y Ajustes; sin desplazamiento horizontal en móvil | ✅ 2,2 s |
| 2 | Bloqueo | Botón de bloqueo oculta el contenido; contraseña incorrecta muestra error; desbloqueo; al recargar vuelve a pedir contraseña | ✅ 2,0 s |
| 3 | Cat Café | Adopción con nombre obligatorio; energía 70→95 y corazones 20→22 al alimentar; repetir no tiene efecto; jugar 75→90 felicidad; tocar al gatito sube cariño; misión reclamable una vez; objeto bloqueado por nivel; comprar y colocar planta y pared visibles en la habitación; **tras recargar se conserva todo** y la visita diaria suma +10 una sola vez | ✅ 3,7 s |
| 4 | BTS World | Título obligatorio; alta de canción y favorita; 7 integrantes, favorito y reordenar; photocard exige imagen, sube una imagen real, marco holográfico, integrante y colección; listas con elementos; persistencia tras recargar | ✅ 4,0 s |
| 5 | K-Drama Diary | Lista vacía; alta de 2 dramas; filtro por estado (1 de 2) y por puntuación; nota de episodio; ruleta sin candidatos para un ánimo y con resultado correcto para otro; "Empezar a verlo" cambia el estado; recomendación visible | ✅ 7,0 s |
| 6 | Nuestro capítulo | Sin modo autor no hay botones de edición; contador desde 14/02/2024 = 975 días; carta con fecha futura **no muestra su contenido** fuera del modo autor; sorpresa futura oculta; "Carta sorpresa" abre la carta disponible; el inicio avisa "Tenés una sorpresa lista", se abre y luego muestra la próxima; plan de cita desde una idea y cambio de estado | ✅ 6,4 s |
| 7 | PIN de autor | PIN inválido rechazado; PIN incorrecto no da acceso; PIN correcto activa el modo autor | ✅ 3,6 s |
| 8 | Diario personal | Texto obligatorio; crear, consultar, editar y eliminar; **lectura directa de IndexedDB: ni el texto del diario ni el apodo aparecen en claro**; tarea completada da +5 💗 una sola vez; objetivo con progreso; misión de diario deshabilitada sin entrada de hoy | ✅ 5,9 s |
| 9 | Paquete del capítulo | El archivo exportado no contiene en claro la carta ni el diario; en un segundo navegador limpio, contraseña errónea rechazada, importación correcta de carta y foto, y el diario sigue vacío | ✅ 7,0 s |
| 10 | PWA | Manifiesto válido (standalone), los 3 íconos responden, el service worker se registra y **la app abre sin conexión** | ✅ 0,7 s |

## Lo que no se verificó

- Sincronización contra un proyecto Supabase real (solo con servidor simulado).
- Instalación en un iPhone o Android físico: se verificaron manifiesto, íconos, service worker y uso sin conexión en Chromium, no el diálogo de instalación de cada sistema.
- Safari/WebKit: las pruebas automáticas corrieron solo en Chromium. El código usa APIs compatibles con Safari 15+ (Web Crypto, IndexedDB, createImageBitmap con alternativa).
- Bloqueo automático por inactividad: está implementado (temporizador de 15 s + al volver de segundo plano), pero no tiene prueba automática porque requiere esperar minutos reales.

## Capturas

`docs/screenshots/`: bienvenida, inicio, bloqueo, Cat Café, habitación decorada, photocards, ruleta, contador, carta y diario.
