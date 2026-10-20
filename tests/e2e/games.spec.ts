import { expect, test, type Page } from '@playwright/test';

const SHOTS = 'docs/screenshots';
const PASS = 'clave-secreta';
const executablePath = process.env.CHROMIUM_PATH || undefined;

// Micrófono falso de Chromium (emite un tono) para probar "Hablá con tu gatito".
test.use({
  permissions: ['microphone'],
  launchOptions: { executablePath, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] },
});

async function adopt(page: Page) {
  await page.goto('/');
  await page.getByLabel('¿Cómo querés que te llame?').fill('Nicole');
  await page.getByLabel('Creá una contraseña').fill(PASS);
  await page.getByLabel('Repetí la contraseña').fill(PASS);
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Gatito' }).click();
  await page.getByRole('radio', { name: /Gris perla/ }).click();
  await page.getByLabel('Nombre').fill('Mochi');
  await page.getByRole('button', { name: 'Adoptar' }).click();
  await expect(page.getByRole('heading', { name: 'Mochi' })).toBeVisible();
  await expect(page.getByText(/Bienvenido\/a, Mochi/)).toBeHidden({ timeout: 10_000 });
}

const hearts = async (page: Page) => Number((await page.getByTestId('hearts').innerText()).replace(/\D/g, ''));

test('Gatito nuevo y minijuegos BTS: memoria, lluvia morada, concierto y quiz con premios', async ({ page }) => {
  await adopt(page);
  await page.screenshot({ path: `${SHOTS}/14-gatito-nuevo.png` });
  await page.getByRole('tab', { name: /Juegos/ }).click();
  await expect(page.getByRole('button', { name: /^Jugar / })).toHaveCount(16);
  await page.screenshot({ path: `${SHOTS}/15-juegos.png`, fullPage: true });
  const before = await hearts(page);

  // Memoria: se resuelve leyendo las caras de las cartas.
  await page.getByRole('button', { name: 'Jugar Memoria de los 7' }).click();
  const cards = page.getByTestId('memory-card');
  await expect(cards).toHaveCount(16);
  await cards.nth(0).click();
  await cards.nth(1).click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${SHOTS}/16-memoria.png` });
  await page.waitForTimeout(800);
  const faces = await cards.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.face!));
  const done = new Set<number>();
  for (let i = 0; i < faces.length; i++) {
    if (done.has(i)) continue;
    const j = faces.findIndex((f, k) => k !== i && f === faces[i] && !done.has(k));
    await cards.nth(i).click();
    await cards.nth(j).click();
    done.add(i).add(j);
  }
  await expect(page.getByTestId('game-result')).toBeVisible();
  await expect(page.getByTestId('game-result')).toContainText(/\+\d+ 💗/);
  await page.screenshot({ path: `${SHOTS}/17-memoria-premio.png` });
  await page.getByRole('button', { name: 'Volver' }).click();
  expect(await hearts(page)).toBeGreaterThan(before);
  await expect(page.getByRole('button', { name: 'Jugar Memoria de los 7' })).toContainText('🏆');

  // Lluvia morada: arranca, caen cosas y termina al perder las 3 vidas.
  await page.getByRole('button', { name: 'Jugar Lluvia morada' }).click();
  await page.getByRole('button', { name: '¡Empezar!' }).click();
  await page.waitForTimeout(2500);
  const area = page.getByTestId('catch-area');
  const box = (await area.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.8);
  await page.screenshot({ path: `${SHOTS}/18-lluvia-morada.png` });
  await expect(page.getByTestId('game-result')).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Volver' }).click();

  // Concierto: tocar las luces que se encienden suma puntos.
  await page.getByRole('button', { name: 'Jugar Concierto morado' }).click();
  await page.getByRole('button', { name: '¡Empezar!' }).click();
  await expect(page.getByRole('button', { name: /Luz (dorada )?encendida/ }).nth(1)).toBeVisible({ timeout: 8000 });
  await page.screenshot({ path: `${SHOTS}/19-concierto.png` });
  for (let k = 0; k < 12; k++) {
    const on = page.getByRole('button', { name: /Luz (dorada )?encendida/ }).first();
    if (await on.count()) await on.dispatchEvent('pointerdown');
    await page.waitForTimeout(250);
  }
  await expect(page.getByTestId('game-score')).not.toContainText(/^0 💜/);
  await page.getByRole('button', { name: '✕ Salir' }).click();

  // Quiz: 10 preguntas.
  await page.getByRole('button', { name: 'Jugar Quiz ARMY' }).click();
  for (let k = 0; k < 10; k++) {
    await page.getByTestId('quiz-option').first().click();
    if (k === 0) await page.screenshot({ path: `${SHOTS}/20-quiz.png` });
    await page.getByRole('button', { name: k < 9 ? 'Siguiente' : 'Ver resultado' }).click();
  }
  await expect(page.getByTestId('game-result')).toContainText(/Acertaste \d+ de 10/);
  await page.getByRole('button', { name: 'Volver' }).click();

  // Los récords y corazones quedan guardados tras bloquear y volver a entrar.
  const after = await hearts(page);
  await page.reload();
  await page.getByLabel('Contraseña', { exact: true }).fill(PASS);
  await page.getByRole('button', { name: 'Desbloquear' }).click();
  // +10 de la visita del día (la primera desde que adoptó), además de lo ganado jugando.
  await expect(page.getByTestId('hearts')).toHaveText(`${after + 10} 💗`);
});

test('Hablá con tu gatito: escucha el micrófono y repite con vocecita', async ({ page }) => {
  await adopt(page);
  await page.getByRole('tab', { name: /Juegos/ }).click();
  await page.getByRole('button', { name: 'Jugar Hablá con tu gatito' }).click();
  const status = page.getByTestId('talk-status');
  await expect(status).toHaveAttribute('data-status', 'off');
  await page.getByRole('button', { name: '🎙️ Hablar' }).click();
  await expect(status).toHaveAttribute('data-status', /listening|recording/);
  await expect(status).toHaveAttribute('data-status', 'recording', { timeout: 10_000 });
  await page.screenshot({ path: `${SHOTS}/21-hablar.png` });
  // El tono falso no se corta: a los 6 s se cierra la grabación y el gatito la repite.
  await expect(status).toHaveAttribute('data-status', 'speaking', { timeout: 15_000 });
  await expect(page.locator('svg.cat-speak')).toBeVisible();
  await page.getByRole('button', { name: 'Dejar de hablar' }).click();
  await expect(status).toHaveAttribute('data-status', 'off');
});

test('Biblioteca BL: guardar historias de Wattpad, progreso, favoritas y filtros', async ({ page }) => {
  await adopt(page);
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Inicio' }).click();
  await page.getByRole('link', { name: 'Biblioteca BL' }).click();
  await expect(page.getByText('Tu biblioteca está vacía')).toBeVisible();
  const dlg = page.getByRole('dialog');

  await page.getByRole('button', { name: '+ Historia' }).click();
  await dlg.getByLabel('Título').fill('Mi historia de prueba');
  await dlg.getByLabel(/Enlace/).fill('wattpad.com/story/123');
  await dlg.getByRole('button', { name: 'Guardar' }).click();
  await expect(dlg.getByText('Pegá un enlace que empiece con https://')).toBeVisible();
  await dlg.getByLabel(/Enlace/).fill('https://www.wattpad.com/story/123-mi-historia');
  await dlg.getByLabel(/Autor/).fill('autora_ejemplo');
  await dlg.getByLabel(/Ship/).fill('Taekook');
  await dlg.getByRole('button', { name: 'Fluff' }).click();
  await dlg.getByLabel('Voy por el capítulo').fill('3');
  await dlg.getByLabel('Total (si sabés)').fill('4');
  await dlg.getByLabel('Estado').selectOption('leyendo');
  await dlg.getByLabel(/Favorita/).check();
  await dlg.getByRole('button', { name: 'Guardar' }).click();

  await page.getByRole('button', { name: '+ Historia' }).click();
  await dlg.getByLabel('Título').fill('Otra historia');
  await dlg.getByLabel(/Ship/).fill('Yoonmin');
  await dlg.getByRole('button', { name: 'Guardar' }).click();

  const first = page.getByTestId('story').filter({ hasText: 'Mi historia de prueba' });
  await expect(first.getByRole('link', { name: 'Leer en Wattpad' })).toHaveAttribute('href', 'https://www.wattpad.com/story/123-mi-historia');
  await expect(first.getByTestId('story-progress')).toHaveText('Cap. 3 de 4');
  await expect(page.getByText('Historia guardada 📚')).toHaveCount(0, { timeout: 10_000 });
  await page.screenshot({ path: `${SHOTS}/22-biblioteca-bl.png` });
  await first.getByRole('button', { name: 'Leí un capítulo más' }).click();
  await expect(first.getByTestId('story-progress')).toHaveText('Terminada ✓');

  await page.getByLabel('Filtrar por ship').selectOption('Yoonmin');
  await expect(page.getByTestId('story')).toHaveCount(1);
  await page.getByLabel('Filtrar por ship').selectOption('');
  await page.getByLabel('Buscar historias').fill('fluff');
  await expect(page.getByTestId('story')).toHaveCount(1);

  await page.reload();
  await page.getByLabel('Contraseña', { exact: true }).fill(PASS);
  await page.getByRole('button', { name: 'Desbloquear' }).click();
  await expect(page.getByTestId('story')).toHaveCount(2);
});
