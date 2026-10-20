import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

const SHOTS = 'docs/screenshots';
mkdirSync(SHOTS, { recursive: true });
const IMG = 'public/icons/icon-512.png';
const PASS = 'clave-secreta';

async function onboard(page: Page, nick = 'Nicole') {
  await page.goto('/');
  await page.getByLabel('¿Cómo querés que te llame?').fill(nick);
  await page.getByLabel('Creá una contraseña').fill(PASS);
  await page.getByLabel('Repetí la contraseña').fill(PASS);
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: new RegExp(nick) })).toBeVisible();
}

async function unlock(page: Page) {
  await page.getByLabel('Contraseña', { exact: true }).fill(PASS);
  await page.getByRole('button', { name: 'Desbloquear' }).click();
  await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible();
}

async function noHorizontalScroll(page: Page) {
  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(sw).toBeLessThanOrEqual(iw);
}

const dialog = (page: Page) => page.getByRole('dialog');
const todayIn = (page: Page) =>
  page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

test('primer uso: validación, saludo personalizado, frase del día y navegación', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Creá una contraseña').fill('123');
  await page.getByLabel('Repetí la contraseña').fill('456');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByText('Decinos cómo querés que te saludemos.')).toBeVisible();
  await expect(page.getByText('Usá al menos 6 caracteres.')).toBeVisible();
  await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/01-bienvenida.png` });

  await onboard(page);
  await expect(page.getByLabel('Frase del día')).toBeVisible();
  await expect(page.getByRole('link', { name: 'BTS World' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'K-Dramas' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mi diario' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nuestro rincón' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/02-inicio.png`, fullPage: true });
  await noHorizontalScroll(page);

  for (const [link, title] of [
    ['BTS', 'BTS World'],
    ['Dramas', 'K-Drama Diary'],
    ['Gatito', 'Cat Café'],
    ['Nosotros', 'Nuestro capítulo'],
  ]) {
    await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: link }).click();
    await expect(page.getByRole('banner').getByRole('heading', { name: title })).toBeVisible();
    await noHorizontalScroll(page);
  }
  await page.getByRole('link', { name: 'Ajustes' }).click();
  await expect(page.getByRole('heading', { name: 'Privacidad y seguridad' })).toBeVisible();
  await noHorizontalScroll(page);
});

test('bloqueo: contraseña incorrecta, bloqueo manual y al recargar', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: 'Bloquear ahora' }).click();
  await expect(page.getByRole('button', { name: 'Desbloquear' })).toBeVisible();
  await expect(page.getByText('Frase del día')).toHaveCount(0);
  await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta');
  await page.getByRole('button', { name: 'Desbloquear' }).click();
  await expect(page.getByText('Contraseña incorrecta.')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/03-bloqueo.png` });
  await unlock(page);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Desbloquear' })).toBeVisible();
  await unlock(page);
});

test('Cat Café: adoptar, acciones con efecto real, tienda, misiones y progreso guardado', async ({ page }) => {
  await onboard(page);
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Gatito' }).click();
  await page.getByRole('button', { name: 'Adoptar' }).click();
  await expect(page.getByText('Ponele un nombre a tu gatito.')).toBeVisible();
  await page.getByRole('radio', { name: /Esmoquin/ }).click();
  await page.getByLabel('Nombre').fill('Mochi');
  await page.getByRole('button', { name: 'Adoptar' }).click();
  await expect(page.getByRole('heading', { name: 'Mochi' })).toBeVisible();

  const energy = page.getByTestId('stat-Energía');
  const happy = page.getByTestId('stat-Felicidad');
  const love = page.getByTestId('stat-Cariño');
  const hearts = page.getByTestId('hearts');
  await expect(energy).toHaveText('70');
  await expect(hearts).toHaveText('20 💗');

  await page.getByRole('button', { name: /Alimentar/ }).click();
  await expect(energy).toHaveText('95');
  await expect(hearts).toHaveText('22 💗');
  await expect(page.getByTestId('cat-speech')).toContainText('Ñam');
  // Repetir enseguida no hace efecto (espera visible)
  await page.getByRole('button', { name: /Alimentar/ }).click();
  await expect(page.getByTestId('cat-speech')).toContainText(/llenito|antes de repetir/);
  await expect(energy).toHaveText('95');

  await page.getByRole('button', { name: /Jugar/ }).click();
  await expect(happy).toHaveText('90');
  await expect(energy).toHaveText('85');
  await page.getByRole('button', { name: 'Acariciar a Mochi' }).click();
  await expect(love).toHaveText('31');
  await page.screenshot({ path: `${SHOTS}/04-cat-cafe.png`, fullPage: true });

  // Misiones
  await page.getByRole('tab', { name: 'Recompensas' }).click();
  const feedMission = page.locator('.item', { hasText: 'Darle de comer' });
  await feedMission.getByRole('button', { name: 'Reclamar' }).click();
  await expect(feedMission.getByRole('button', { name: 'Hecho' })).toBeDisabled();
  await expect(page.locator('.item', { hasText: 'Hacerle 3 mimos' }).getByRole('button', { name: 'Reclamar' })).toBeDisabled();
  const heartsNow = Number((await hearts.textContent())!.replace(/\D/g, ''));
  expect(heartsNow).toBe(22 + 3 + 1 + 3); // comida + caricia + jugar + misión

  // Tienda: comprar y colocar una planta
  await page.getByRole('tab', { name: 'Tienda y decoración' }).click();
  await page.getByTestId('item-corona-estrellas').getByRole('button').isDisabled();
  await expect(page.getByTestId('item-corona-estrellas').getByRole('button')).toHaveText('Nivel 3');
  await page.getByTestId('item-planta').getByRole('button', { name: '12 💗' }).click();
  await expect(hearts).toHaveText(`${heartsNow - 12} 💗`);
  await page.getByTestId('item-planta').getByRole('button', { name: 'Colocar' }).click();
  await expect(page.getByTestId('room').locator('[title="planta"]')).toBeVisible();
  await page.getByTestId('item-pared-crema').getByRole('button', { name: 'Usar' }).click();
  await expect(page.getByTestId('room').locator('.wp-pared-crema')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/05-habitacion-decorada.png` });

  // Persistencia tras cerrar/recargar
  await page.reload();
  await unlock(page);
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Gatito' }).click();
  await expect(page.getByRole('heading', { name: 'Mochi' })).toBeVisible();
  await expect(page.getByTestId('stat-Cariño')).toHaveText('31');
  await expect(page.getByTestId('room').locator('[title="planta"]')).toBeVisible();
  // la recompensa diaria de visita se suma una sola vez (+10)
  await expect(page.getByTestId('hearts')).toHaveText(`${heartsNow - 12 + 10} 💗`);
});

test('BTS World: validación, canciones, favoritos, integrantes, photocards y listas', async ({ page }) => {
  await onboard(page);
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'BTS' }).click();
  await page.getByRole('button', { name: '+ Canción' }).click();
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(dialog(page).getByText('El título es obligatorio.')).toBeVisible();
  await dialog(page).locator('input').first().fill('Mi canción favorita');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByTestId('song')).toHaveCount(1);
  await page.getByTestId('song').getByRole('button', { name: 'Favorita' }).click();
  await page.getByLabel('Mostrar solo favoritos').check();
  await expect(page.getByTestId('song')).toHaveCount(1);

  await page.getByRole('tab', { name: 'Integrantes' }).click();
  await expect(page.getByTestId('member')).toHaveCount(7);
  await page.getByRole('button', { name: 'Favorito: Jimin' }).click();
  await expect(page.getByTestId('fav-members')).toContainText('Jimin');
  await page.getByRole('button', { name: 'Subir Jimin' }).click();
  await expect(page.getByTestId('member').nth(3)).toContainText('Jimin');

  await page.getByRole('tab', { name: 'Photocards' }).click();
  await page.getByRole('button', { name: '+ Photocard' }).click();
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(dialog(page).getByText('Elegí una imagen.')).toBeVisible();
  await dialog(page).getByTestId('image-input').setInputFiles(IMG);
  await expect(dialog(page).locator('img.thumb')).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Holográfico' }).click();
  await dialog(page).getByLabel('Integrante (opcional)').selectOption('Jimin');
  await dialog(page).getByLabel(/Colección/).fill('Carpeta lavanda');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('.pc-btn')).toHaveCount(1);
  await expect(page.locator('.pc-btn img')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Carpeta lavanda' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/06-photocards.png` });

  await page.getByRole('tab', { name: 'Listas' }).click();
  await page.getByLabel('Nueva lista').fill('Para escuchar');
  await page.getByRole('button', { name: 'Crear' }).click();
  await page.getByLabel('Agregar a Para escuchar').fill('Algo que me recomendaron');
  await page.getByTestId('fan-list').getByRole('button', { name: 'Agregar' }).click();
  await expect(page.getByTestId('fan-list')).toContainText('Algo que me recomendaron');

  await page.reload();
  await unlock(page);
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'BTS' }).click();
  await expect(page.getByTestId('song')).toContainText('Mi canción favorita');
  await page.getByRole('tab', { name: 'Photocards' }).click();
  await expect(page.locator('.pc-btn img')).toBeVisible();
});

test('K-Drama Diary: alta, filtros, notas de episodio, ruleta por ánimo y recomendaciones', async ({ page }) => {
  await onboard(page);
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Dramas' }).click();
  await expect(page.getByText('Tu lista de dramas está vacía')).toBeVisible();

  await page.getByRole('button', { name: '+ Drama' }).click();
  await dialog(page).locator('input').first().fill('Drama de prueba A');
  await dialog(page).getByRole('button', { name: 'Romance' }).click();
  await dialog(page).getByRole('button', { name: 'Romántica' }).click();
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();

  await page.getByRole('button', { name: '+ Drama' }).click();
  await dialog(page).locator('input').first().fill('Drama de prueba B');
  await dialog(page).getByLabel('Estado').selectOption('terminado');
  await dialog(page).getByRole('radio', { name: '5 estrellas' }).click();
  await dialog(page).getByLabel('Lo recomiendo').check();
  await dialog(page).getByLabel('¿A quién y por qué?').fill('Para un fin de semana tranquilo');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByTestId('drama')).toHaveCount(2);

  await page.getByRole('button', { name: /Terminado/ }).first().click();
  await expect(page.getByTestId('drama-count')).toHaveText('1 de 2');
  await page.getByRole('button', { name: /Terminado/ }).first().click();
  await page.getByText('Buscar y filtrar').click();
  await page.getByLabel('Puntuación mínima').selectOption('5');
  await expect(page.getByTestId('drama')).toHaveCount(1);
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();

  await page.getByTestId('drama').filter({ hasText: 'Drama de prueba A' }).click();
  await dialog(page).getByLabel('Episodio').fill('3');
  await dialog(page).getByLabel('Nota', { exact: true }).fill('La escena del paraguas');
  await dialog(page).getByRole('button', { name: 'Agregar nota' }).click();
  await expect(dialog(page)).toContainText('Ep. 3');
  await dialog(page).getByRole('button', { name: 'Cerrar' }).click();

  await page.getByRole('tab', { name: 'Ruleta' }).click();
  await page.getByRole('button', { name: 'Para llorar' }).click();
  await expect(page.getByText('No hay dramas para este ánimo')).toBeVisible();
  await page.getByRole('button', { name: 'Romántica' }).click();
  await page.getByRole('button', { name: 'Girar la ruleta' }).click();
  await expect(page.getByTestId('roulette-result')).toContainText('Drama de prueba A', { timeout: 8000 });
  await page.screenshot({ path: `${SHOTS}/07-ruleta.png` });
  await page.getByRole('button', { name: 'Empezar a verlo' }).click();
  await expect(page.getByTestId('roulette-result')).toContainText('En curso');

  await page.getByRole('tab', { name: 'Mis recomendaciones' }).click();
  await expect(page.getByText('Para un fin de semana tranquilo')).toBeVisible();
});

test('Nuestro capítulo: modo autor, contador, cartas con fecha, sorpresas y carta sorpresa', async ({ page }) => {
  await onboard(page);
  const today = await todayIn(page);
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Nosotros' }).click();
  await expect(page.getByRole('button', { name: '+ Escribir carta' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Modo autor' }).click();

  await page.getByLabel('Fecha de inicio').fill('2024-02-14');
  await page.getByRole('button', { name: 'Guardar fecha' }).click();
  await expect(page.getByTestId('counter')).toContainText('días');
  await page.screenshot({ path: `${SHOTS}/08-contador.png` });

  await page.getByRole('tab', { name: 'Cartas' }).click();
  await page.getByRole('button', { name: '+ Escribir carta' }).click();
  await dialog(page).getByLabel('Título').fill('Para el futuro');
  await dialog(page).getByLabel('Carta').fill('Texto secreto del futuro');
  await dialog(page).getByLabel(/Se puede abrir desde/).fill('2030-01-01');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('button', { name: '+ Escribir carta' }).click();
  await dialog(page).getByLabel('Título').fill('Para hoy');
  await dialog(page).getByLabel('Carta').fill('Te quiero mucho, de verdad.');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();

  await page.getByRole('tab', { name: 'Sorpresas' }).click();
  await page.getByRole('button', { name: '+ Programar sorpresa' }).click();
  await dialog(page).getByLabel(/^Título/).fill('Sorpresa de hoy');
  await dialog(page).getByLabel('Se abre el').fill(today);
  await dialog(page).getByLabel('Mensaje').fill('¡Sorpresa! Mirá debajo de la almohada.');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('button', { name: '+ Programar sorpresa' }).click();
  await dialog(page).getByLabel(/^Título/).fill('Sorpresa futura');
  await dialog(page).getByLabel('Se abre el').fill('2031-05-05');
  await dialog(page).getByLabel('Mensaje').fill('Contenido que todavía no se ve');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();

  await page.getByRole('tab', { name: 'Citas' }).click();
  await page.getByRole('button', { name: 'Ver ideas' }).click();
  await page.getByRole('button', { name: /Paraguas compartido/ }).click();
  await expect(page.getByTestId('plan')).toHaveCount(1);
  await page.getByTestId('plan').getByRole('button', { name: /Estado: Idea/ }).click();
  await expect(page.getByTestId('plan')).toContainText('Planeada');

  await page.getByRole('button', { name: 'Salir', exact: true }).click();

  // Vista de ella
  await page.getByRole('tab', { name: 'Cartas' }).click();
  const future = page.getByTestId('letter').filter({ hasText: 'Para el futuro' });
  await expect(future).toContainText('Se abre en');
  await expect(future.getByRole('button')).toHaveCount(0);
  await expect(page.getByText('Texto secreto del futuro')).toHaveCount(0);

  await page.getByRole('tab', { name: 'Sorpresas' }).click();
  await expect(page.getByText('Contenido que todavía no se ve')).toHaveCount(0);
  await expect(page.getByText('Sorpresa futura')).toHaveCount(0);

  await page.getByRole('button', { name: 'Abrir una carta sorpresa' }).click();
  await expect(page.getByTestId('letter-body')).toContainText('Te quiero mucho');
  await page.screenshot({ path: `${SHOTS}/09-carta.png` });
  await dialog(page).getByRole('button', { name: 'Cerrar' }).click();

  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Inicio' }).click();
  await expect(page.getByText('Tenés una sorpresa lista')).toBeVisible();
  await page.getByRole('link', { name: 'Abrir sorpresa' }).click();
  await page.getByTestId('surprise').filter({ hasText: 'Sorpresa de hoy' }).getByRole('button', { name: 'Abrir' }).click();
  await expect(page.getByTestId('surprise-content')).toContainText('debajo de la almohada');
  await dialog(page).getByRole('button', { name: 'Cerrar' }).click();
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Inicio' }).click();
  await expect(page.getByText(/Próxima sorpresa/)).toBeVisible();
});

test('PIN de autor: impide editar sin el PIN', async ({ page }) => {
  await onboard(page);
  await page.getByRole('link', { name: 'Ajustes' }).click();
  await page.getByLabel(/PIN \(4 a 8/).fill('12');
  await page.getByRole('button', { name: 'Guardar PIN' }).click();
  await expect(page.getByText('El PIN debe tener entre 4 y 8 números.')).toBeVisible();
  await page.getByLabel(/PIN \(4 a 8/).fill('2468');
  await page.getByRole('button', { name: 'Guardar PIN' }).click();
  await expect(page.getByText('Hay un PIN configurado.', { exact: false })).toBeVisible();
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Nosotros' }).click();
  await page.getByRole('button', { name: 'Modo autor' }).click();
  await dialog(page).getByLabel('PIN de autor').fill('1111');
  await dialog(page).getByRole('button', { name: 'Entrar' }).click();
  await expect(dialog(page).getByText('PIN incorrecto.')).toBeVisible();
  await dialog(page).getByLabel('PIN de autor').fill('2468');
  await dialog(page).getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Modo autor: podés agregar')).toBeVisible();
});

test('Diario personal: crear, consultar, editar, eliminar; tareas con recompensa; objetivos; cifrado en disco', async ({ page }) => {
  await onboard(page);
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Gatito' }).click();
  await page.getByLabel('Nombre').fill('Bori');
  await page.getByRole('button', { name: 'Adoptar' }).click();

  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Inicio' }).click();
  await page.getByRole('link', { name: 'Mi diario' }).click();
  await page.getByRole('button', { name: '+ Escribir' }).click();
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(dialog(page).getByText('El texto es obligatorio.')).toBeVisible();
  await dialog(page).getByRole('button', { name: '🥰' }).click();
  await dialog(page).getByLabel(/Título/).fill('Un día lindo');
  await dialog(page).getByLabel('Querido diario…').fill('Hoy fue un buen día secreto');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByTestId('diary-entry')).toHaveCount(1);
  await page.getByTestId('diary-entry').click();
  await expect(page.getByTestId('diary-body')).toHaveText('Hoy fue un buen día secreto');
  await dialog(page).getByRole('button', { name: 'Editar' }).click();
  await dialog(page).getByLabel('Querido diario…').fill('Hoy fue un buen día secreto (editado)');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByTestId('diary-entry')).toContainText('(editado)');
  await page.screenshot({ path: `${SHOTS}/10-diario.png` });

  // El texto del diario no aparece en claro en el almacenamiento del navegador
  const raw = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const req = indexedDB.open('seoulmate');
        req.onsuccess = () => {
          const all = req.result.transaction('records').objectStore('records').getAll();
          all.onsuccess = () => resolve(JSON.stringify(all.result));
        };
      }),
  );
  expect(raw.length).toBeGreaterThan(100);
  expect(raw).not.toContain('buen día secreto');
  expect(raw).not.toContain('Nicole');

  // Tareas: completar da corazones al gatito una sola vez
  await page.getByRole('tab', { name: 'Tareas' }).click();
  await page.getByLabel('Nueva tarea').fill('Estudiar coreano');
  await page.getByRole('button', { name: 'Agregar' }).click();
  await page.getByLabel('Completar: Estudiar coreano').check();
  await expect(page.getByText('+5 💗 para Bori')).toBeVisible();
  await page.getByLabel('Completar: Estudiar coreano').uncheck();
  await page.getByLabel('Completar: Estudiar coreano').check();
  await expect(page.getByText('Hechas (1)')).toBeVisible();

  // Objetivos
  await page.getByRole('tab', { name: 'Objetivos' }).click();
  await page.getByRole('button', { name: '+ Nuevo objetivo' }).click();
  await dialog(page).getByLabel('Objetivo').fill('Aprender hangul');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('button', { name: 'Sumar 10%' }).click();
  await expect(page.getByTestId('goal')).toContainText('10%');

  // Eliminar la entrada del diario
  await page.getByRole('tab', { name: 'Diario' }).click();
  await page.getByTestId('diary-entry').click();
  await dialog(page).getByRole('button', { name: 'Editar' }).click();
  await dialog(page).getByRole('button', { name: 'Eliminar' }).click();
  await dialog(page).getByRole('button', { name: '¿Seguro? Eliminar' }).click();
  await expect(page.getByTestId('diary-entry')).toHaveCount(0);

  // Misión de diario disponible en Cat Café tras escribir hoy (se borró, así que no debe estar disponible)
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Gatito' }).click();
  await page.getByRole('tab', { name: 'Recompensas' }).click();
  await expect(page.locator('.item', { hasText: 'Escribir en tu diario hoy' }).getByRole('button')).toBeDisabled();
});

test('Paquete del capítulo: se exporta cifrado, sin el diario, y se importa en otro dispositivo', async ({ page, browser }) => {
  await onboard(page, 'Andrés');
  // Diario privado en el dispositivo de origen
  await page.getByRole('link', { name: 'Mi diario' }).click();
  await page.getByRole('button', { name: '+ Escribir' }).click();
  await dialog(page).getByLabel('Querido diario…').fill('Nota privada que no debe viajar');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();

  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Nosotros' }).click();
  await page.getByRole('button', { name: 'Modo autor' }).click();
  await page.getByRole('tab', { name: 'Fotos' }).click();
  await page.getByRole('button', { name: '+ Subir foto' }).click();
  await dialog(page).getByTestId('image-input').setInputFiles(IMG);
  await expect(dialog(page).locator('img.thumb')).toBeVisible();
  await dialog(page).getByLabel(/Texto/).fill('Nuestra foto');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('tab', { name: 'Cartas' }).click();
  await page.getByRole('button', { name: '+ Escribir carta' }).click();
  await dialog(page).getByLabel('Título').fill('Carta viajera');
  await dialog(page).getByLabel('Carta').fill('Contenido de la carta viajera');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();

  await page.getByRole('link', { name: 'Ajustes' }).click();
  await page.getByLabel('¿Qué exportar?').selectOption('chapter');
  await page.getByLabel('Contraseña del archivo').fill('codigo-regalo');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar' }).click()]);
  const path = await download.path();
  const text = readFileSync(path!, 'utf8');
  expect(text).toContain('seoulmate-backup');
  expect(text).not.toContain('Contenido de la carta viajera');
  expect(text).not.toContain('Nota privada');

  // Otro "dispositivo" (contexto nuevo con almacenamiento vacío)
  const ctx = await browser.newContext({ baseURL: 'http://localhost:4173', viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true });
  const her = await ctx.newPage();
  await onboard(her, 'Nicole');
  await her.getByRole('link', { name: 'Ajustes' }).click();
  await her.getByTestId('import-file').setInputFiles(path!);
  await her.getByLabel(/Contraseña del archivo/).last().fill('mal-codigo');
  await her.getByRole('button', { name: 'Importar' }).click();
  await expect(her.getByText('Contraseña incorrecta o archivo dañado.')).toBeVisible();
  await her.getByLabel(/Contraseña del archivo/).last().fill('codigo-regalo');
  await her.getByRole('button', { name: 'Importar' }).click();
  await expect(her.getByText('Capítulo importado y combinado 💌')).toBeVisible();
  await her.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Nosotros' }).click();
  await her.getByRole('tab', { name: 'Cartas' }).click();
  await expect(her.getByTestId('letter')).toContainText('Carta viajera');
  await her.getByRole('tab', { name: 'Fotos' }).click();
  await expect(her.locator('.photo-tile img')).toBeVisible();
  await her.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Inicio' }).click();
  await her.getByRole('link', { name: 'Mi diario' }).click();
  await expect(her.getByText('Tu diario está en blanco')).toBeVisible();
  await ctx.close();
});

test('PWA: manifiesto, íconos y service worker para instalar y usar sin conexión', async ({ page, request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.name).toBe('Seoulmate');
  expect(manifest.display).toBe('standalone');
  for (const icon of manifest.icons) expect((await request.get('/' + icon.src)).ok()).toBe(true);
  await page.goto('/');
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toContain('localhost:4173');
  // Sin conexión, la app sigue abriendo desde la caché
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Seoulmate' })).toBeVisible();
  await page.context().setOffline(false);
});

test('Música con YouTube Music, fotos por integrante y "Ver ahora" en dramas', async ({ page }) => {
  await onboard(page);
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'BTS' }).click();
  await page.getByRole('button', { name: '+ Canción' }).click();
  await dialog(page).locator('input').first().fill('Canción con enlace');
  await dialog(page).getByLabel(/Enlace de YouTube Music/).fill('https://open.spotify.com/track/123');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(dialog(page).getByText(/Pegá un enlace de YouTube/)).toBeVisible();
  await expect(dialog(page).getByRole('link', { name: /Buscar "Canción con enlace" en YouTube Music/ })).toHaveAttribute('href', /music\.youtube\.com\/search/);
  await dialog(page).getByLabel(/Enlace de YouTube Music/).fill('https://music.youtube.com/watch?v=dQw4w9WgXcQ&si=abc');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('button', { name: 'Reproducir Canción con enlace' }).click();
  await expect(page.getByTestId('yt-frame')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?.*autoplay=1/);
  await expect(page.getByRole('link', { name: 'Abrir en YouTube Music' })).toHaveAttribute('href', 'https://music.youtube.com/watch?v=dQw4w9WgXcQ');
  // El reproductor sigue al cambiar de sección
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Inicio' }).click();
  await expect(page.getByTestId('yt-frame')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/11-reproductor.png` });
  await page.getByRole('button', { name: 'Cerrar reproductor' }).click();
  await expect(page.getByTestId('yt-frame')).toHaveCount(0);

  // Fotos favoritas de un integrante
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'BTS' }).click();
  await page.getByRole('tab', { name: 'Integrantes' }).click();
  await page.getByRole('button', { name: 'Fotos de Jimin' }).click();
  await dialog(page).getByTestId('member-photos-input').setInputFiles([IMG, 'public/icons/icon-192.png']);
  await expect(dialog(page).getByTestId('member-photos').locator('img')).toHaveCount(2);
  await page.screenshot({ path: `${SHOTS}/12-fotos-integrante.png` });
  await dialog(page).getByRole('button', { name: 'Cerrar' }).first().click();
  await expect(page.getByRole('button', { name: 'Fotos de Jimin' })).toContainText('2 fotos');
  await page.reload();
  await unlock(page);
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'BTS' }).click();
  await page.getByRole('tab', { name: 'Integrantes' }).click();
  await expect(page.getByRole('button', { name: 'Fotos de Jimin' })).toContainText('2 fotos');
  await expect(page.getByRole('button', { name: 'Fotos de Jimin' }).locator('img.avatar')).toBeVisible();

  // K-dramas: ver dentro de la app (YouTube) o abrir la plataforma
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Dramas' }).click();
  await page.getByRole('button', { name: '+ Drama' }).click();
  await dialog(page).locator('input').first().fill('Drama en YouTube');
  await dialog(page).getByLabel(/Dónde verlo/).fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('button', { name: '+ Drama' }).click();
  await dialog(page).locator('input').first().fill('Drama en plataforma');
  await dialog(page).getByLabel(/Dónde verlo/).fill('https://www.netflix.com/title/123');
  await dialog(page).getByRole('button', { name: 'Guardar' }).click();
  await page.getByTestId('drama').filter({ hasText: 'Drama en plataforma' }).click();
  await expect(dialog(page).getByRole('link', { name: '▶ Ver en netflix.com' })).toHaveAttribute('href', 'https://www.netflix.com/title/123');
  await dialog(page).getByRole('button', { name: 'Cerrar' }).click();
  await page.getByTestId('drama').filter({ hasText: 'Drama en YouTube' }).click();
  await dialog(page).getByRole('button', { name: '▶ Ver aquí' }).click();
  await expect(page.getByTestId('yt-frame')).toHaveAttribute('src', /embed\/dQw4w9WgXcQ/);
});

test('Ideas de K-dramas de romance: se suman a la lista y a la ruleta', async ({ page }) => {
  await onboard(page);
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Dramas' }).click();
  await page.getByRole('tab', { name: /Romance/ }).click();
  await expect(page.getByTestId('romance-pick')).toHaveCount(20);
  const goblin = page.getByTestId('romance-pick').filter({ hasText: 'Goblin' });
  await expect(goblin.getByRole('link', { name: 'Netflix' })).toHaveAttribute('href', 'https://www.netflix.com/search?q=Goblin');
  await page.screenshot({ path: `${SHOTS}/13-romance.png` });
  await page.getByRole('button', { name: 'Agregar Goblin a mis dramas' }).click();
  await expect(page.getByRole('button', { name: 'Goblin ya está en tu lista' })).toBeDisabled();
  await page.getByRole('tab', { name: 'Mis dramas' }).click();
  await expect(page.getByText('Goblin').first()).toBeVisible();
  await page.reload();
  await unlock(page);
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Dramas' }).click();
  await expect(page.getByText('Goblin').first()).toBeVisible();
});
