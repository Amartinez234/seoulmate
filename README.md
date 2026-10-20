# Seoulmate 💜

App móvil (PWA) privada con BTS World, Cat Café, K-Drama Diary, Nuestro capítulo y un diario personal.
Hecha con React 19 + TypeScript + Vite. Funciona sin servidor y sin conexión; la sincronización con Supabase es opcional.

## Requisitos

- Node.js 20 o superior (probado con Node 22) y npm.

## Ejecutar

```bash
npm install
npm run dev        # desarrollo: http://localhost:5173 (también visible en tu red local)
npm run build      # genera la app lista para publicar en dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

## Instalarla en el celular

La instalación como app y el modo sin conexión **requieren https** (o `localhost`). La forma más simple:

1. `npm run build`.
2. Publicá la carpeta `dist/` en un hosting estático gratuito con https, por ejemplo Netlify (arrastrar la carpeta en app.netlify.com/drop), Cloudflare Pages, Vercel o GitHub Pages. La app usa rutas con `#`, así que no hace falta configurar redirecciones.
3. Abrí la dirección en el teléfono:
   - **Android (Chrome):** Ajustes de Seoulmate → "Instalar Seoulmate", o menú ⋮ → "Instalar app".
   - **iPhone (Safari):** botón Compartir → "Agregar a pantalla de inicio".

> La URL no muestra datos de nadie: cada teléfono guarda su propio contenido cifrado. Igual conviene no difundirla.

## Cómo preparar el regalo (flujo recomendado)

1. En **tu** teléfono o computadora, abrí la app, creá una contraseña cualquiera y andá a **Nosotros → Modo autor**.
2. Cargá la fecha del contador, la línea de tiempo, fotos, cartas (con fecha de apertura opcional), sorpresas con fecha, mensajes para cada ocasión y planes de citas.
3. **Ajustes → Copias de seguridad → "Paquete de Nuestro capítulo"**, poné una contraseña de archivo y exportá. El paquete va cifrado y **nunca** incluye el diario.
4. En el teléfono de ella: abrir la app, que ella cree su contraseña, y en **Ajustes → Importar** elegir el archivo y escribir la contraseña del archivo. Podés repetir el proceso más adelante para sumar cartas: se combinan sin duplicar y se respeta lo que ella ya abrió.
5. Si vas a editar directamente en el teléfono de ella, poné un **PIN de autor** en Ajustes para que la edición del capítulo quede protegida.

## Qué hace cada módulo

| Módulo | Funciones |
| --- | --- |
| Inicio | Saludo con apodo configurable, fecha, frase del día (31 frases originales + las que agregues), gatito animado con nivel, accesos directos, tarjeta de sorpresa desbloqueable, contador de días juntos. |
| BTS World | Canciones y álbumes (con portada propia), favoritos, integrantes con favoritos y orden, photocards con 5 marcos originales y colecciones, recuerdos con fecha, listas personales con favoritos. Solo vienen precargados los nombres artísticos de los integrantes; todo lo demás lo carga ella. No hay letras ni imágenes oficiales. |
| Cat Café | Elegir gatito (4 pelajes) y nombre; habitación con pared, cama, juguete, 3 decoraciones y accesorios; alimentar, jugar, acariciar (también tocando al gatito) con reacciones animadas; cariño, energía y felicidad; corazones, niveles, tienda de 24 objetos; recompensas por visita diaria, misiones opcionales y tareas completadas. **Sin castigos:** si pasan días sin entrar, la energía y la felicidad solo vuelven a un punto de calma (60), el cariño nunca baja y al volver hay un regalo de bienvenida. |
| K-Drama Diary | Pendientes / en curso / terminados, puntuación 1-5, reseña, personajes y actores favoritos, notas por episodio, géneros (y propios), filtros por estado, género, puntuación y búsqueda, ruleta por estado de ánimo, recomendaciones propias. Pestaña **Romance 💜** con 20 K-dramas de romance reales (sinopsis propias) que se suman a la lista con un toque, y búsquedas en JustWatch (AR), Netflix, Viki y tráiler en YouTube; no se incluyen enlaces a sitios no oficiales. Campo "Dónde verlo": un enlace de YouTube se ve dentro de la app y otras plataformas se abren afuera. |
| Nuestro capítulo | Contador configurable, línea de tiempo con fotos, álbum de fotos, cartas (con fecha de apertura), sorpresas que se desbloquean en una fecha, mensajes para cada ocasión, planes de citas (10 ideas genéricas inspiradas en situaciones típicas de K-dramas + propias), botón "Carta sorpresa". Todo el contenido personal empieza vacío. |
| Mi diario | Diario con estado de ánimo y búsqueda, tareas con fecha, objetivos con progreso. Crear, editar, eliminar y consultar. Documento separado del contenido romántico. |

## Privacidad y seguridad

- **Cifrado local:** todos los datos (incluidas las fotos) se guardan en IndexedDB cifrados con AES-GCM 256. La clave se deriva de la contraseña con PBKDF2-SHA256 (310.000 iteraciones) y solo vive en memoria mientras la app está desbloqueada.
- **Bloqueo:** al abrir, con el botón 🔒, y automáticamente tras 1/5/15/30 minutos sin uso o en segundo plano. Tras 5 intentos fallidos hay espera progresiva.
- **Separación:** el diario (`personal`) y el capítulo romántico (`chapter`) son registros cifrados distintos; el paquete del capítulo nunca incluye el diario.
- **Modo autor:** protegido con un PIN (hash PBKDF2). Mientras no se cumple la fecha, las cartas y sorpresas bloqueadas no se muestran fuera del modo autor. Es una protección de interfaz pensada para conservar la sorpresa: alguien con acceso al teléfono, la contraseña y conocimientos técnicos podría descifrar los datos locales.
- **Sin contraseña no hay recuperación.** Si se olvida, solo se puede borrar todo y restaurar una copia. Recomendado: exportar una copia completa de vez en cuando.
- No hay claves privadas en el código. La "anon key" de Supabase es pública por diseño y la protección real del servidor la hacen las políticas RLS.

## Sincronización opcional con Supabase

Solo hace falta si se quiere usar los mismos datos en varios dispositivos de la **misma persona**.

1. Creá un proyecto en supabase.com.
2. En **SQL Editor**, ejecutá `supabase/schema.sql`. Crea dos tablas con Row Level Security: cada usuario autenticado solo puede leer y escribir sus propias filas, y el rol anónimo no tiene acceso.
3. En **Authentication → Providers** dejá activado Email (con confirmación de correo, recomendado).
4. Copiá `.env.example` como `.env.local` y completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Project Settings → API). **Nunca** uses la `service_role` key.
5. `npm run build` y volvé a publicar `dist/`.
6. En la app: Ajustes → Sincronización → crear cuenta o iniciar sesión, elegir una **contraseña de sincronización** (mínimo 8 caracteres, la misma en todos los dispositivos) y "Sincronizar ahora".

Los datos se cifran en el teléfono con la contraseña de sincronización antes de subirse (cifrado de extremo a extremo): el servidor solo guarda texto cifrado. Resolución de conflictos: por registro gana la versión más reciente; en la primera sincronización de un dispositivo gana lo que ya está en la nube. La sincronización es manual (botón).

> Estado de verificación: la lógica de sincronización se probó con un servidor simulado en memoria. **No se probó contra un proyecto Supabase real** porque este entorno no tiene uno; probala con datos de prueba antes de confiarle contenido.

## Pruebas

```bash
npm test                 # 31 pruebas unitarias (Vitest)
npx playwright install chromium   # solo la primera vez
npm run build && npm run test:e2e # 10 pruebas de punta a punta en Chromium con viewport de celular
```

Resultados de la última ejecución: ver `docs/INFORME-DE-PRUEBAS.md` y capturas en `docs/screenshots/`.

## Estructura

```
src/lib/        lógica: cifrado, bóveda, documentos, gatito, fechas, dramas, copias, sincronización
src/components/ UI reutilizable, gatito y habitación en SVG originales, íconos
src/pages/      pantallas de cada módulo
supabase/       schema.sql con tablas y políticas RLS
tests/unit/     pruebas unitarias
tests/e2e/      pruebas de punta a punta (Playwright)
scripts/        generación de íconos PNG
```

Todas las ilustraciones (gatitos, objetos, flores, estrellas, íconos) son SVG originales hechos para esta app. Fuentes: Nunito y Gowun Batang (licencia SIL OFL), empaquetadas para funcionar sin conexión.
