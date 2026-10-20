import { expect, test, type Page } from '@playwright/test';

const SHOTS = 'docs/screenshots';
const PASS = 'clave-secreta';

async function toGames(page: Page) {
  await page.goto('/');
  await page.getByLabel('¿Cómo querés que te llame?').fill('Nicole');
  await page.getByLabel('Creá una contraseña').fill(PASS);
  await page.getByLabel('Repetí la contraseña').fill(PASS);
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Gatito' }).click();
  await page.getByRole('radio', { name: /Atigrado naranja/ }).click();
  await page.getByLabel('Nombre').fill('Mochi');
  await page.getByRole('button', { name: 'Adoptar' }).click();
  await expect(page.getByText(/Bienvenido\/a, Mochi/)).toBeHidden({ timeout: 10_000 });
  await page.getByRole('tab', { name: /Juegos/ }).click();
}

const open = (page: Page, name: string) => page.getByRole('button', { name: `Jugar ${name}` }).click();
const result = (page: Page) => page.getByTestId('game-result');
const back = async (page: Page) => {
  if (await result(page).isVisible()) await page.getByRole('button', { name: 'Volver' }).click();
  else await page.getByRole('button', { name: '✕ Salir' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
};

test('Menú con 16 juegos y los juegos de música: ritmo, coreografía, burbujas', async ({ page }) => {
  await toGames(page);
  await expect(page.getByRole('button', { name: /^Jugar / })).toHaveCount(16);
  await page.screenshot({ path: `${SHOTS}/23-menu-juegos.png`, fullPage: true });

  await open(page, 'Ritmo Bangtan');
  await page.getByRole('button', { name: '¡Empezar!' }).click();
  await page.waitForTimeout(2200);
  for (let k = 0; k < 6; k++) {
    await page.getByTestId('rh-pad').nth(k % 3).dispatchEvent('pointerdown');
    await page.waitForTimeout(120);
  }
  await page.screenshot({ path: `${SHOTS}/24-ritmo.png` });
  await back(page);

  await open(page, 'Coreografía');
  await page.getByRole('button', { name: '¡Empezar!' }).click();
  await expect(page.getByText(/Tu turno/)).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: `${SHOTS}/25-coreografia.png` });
  for (let k = 0; k < 4 && !(await result(page).isVisible()); k++) {
    await page.getByTestId('simon-pad').nth(k).dispatchEvent('pointerdown');
    await page.waitForTimeout(100);
  }
  await back(page);

  await open(page, 'Burbujas Borahae');
  await page.getByRole('button', { name: '¡Empezar!' }).click();
  await page.waitForTimeout(2500);
  for (let k = 0; k < 4; k++) {
    const b = page.locator('[data-kind="morada"]').first();
    if (await b.count()) await b.dispatchEvent('pointerdown');
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/26-burbujas.png` });
  await expect(page.getByTestId('game-score')).not.toContainText(/^0 💜/);
  await back(page);
});

test('Juegos con el gatito: café, saltarín, vasos y tres en raya dan premios', async ({ page }) => {
  await toGames(page);
  const heartsBefore = Number((await page.getByTestId('hearts').innerText()).replace(/\D/g, ''));

  await open(page, 'Café de Mochi');
  await page.getByRole('button', { name: '¡Empezar!' }).click();
  const menu = await page.getByTestId('cafe-item').evaluateAll((els) => els.map((e) => [(e as HTMLElement).dataset.id!, e.querySelector('span')!.textContent!]));
  for (let served = 0; served < 2; served++) {
    const want = await page.getByTestId('cafe-order').locator('div span').allInnerTexts();
    if (served === 1) await page.screenshot({ path: `${SHOTS}/27-cafe.png` });
    for (const e of want) await page.locator(`[data-testid="cafe-item"][data-id="${menu.find(([, em]) => em === e)![0]}"]`).click();
  }
  await expect(page.getByTestId('game-score')).toContainText(/^2 ☕/);
  await back(page);

  await open(page, 'Gatito saltarín');
  await page.getByRole('button', { name: '¡Empezar!' }).click();
  await page.waitForTimeout(1000);
  await page.getByTestId('hopper').dispatchEvent('pointerdown');
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${SHOTS}/28-saltarin.png` });
  await expect(result(page)).toBeVisible({ timeout: 30_000 });
  await back(page);

  await open(page, '¿Dónde está el gatito?');
  await page.getByRole('button', { name: '¡Empezar!' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/29-vasos.png` });
  for (let r = 0; r < 5; r++) {
    await expect(page.getByText('¿Debajo de qué vaso está?')).toBeVisible({ timeout: 15_000 });
    await page.locator('[data-testid="cup"][data-cat="1"]').click();
    await expect(page.getByText('¡Lo encontraste! 💜')).toBeVisible();
    await page.getByRole('button', { name: r < 4 ? 'Otra vez' : 'Ver resultado' }).click();
  }
  await expect(result(page)).toContainText('5 de 5');
  await back(page);

  await open(page, 'Tres en raya');
  for (let g = 0; g < 3; g++) {
    for (let k = 0; k < 9 && !(await page.getByRole('button', { name: /Otra partida|Ver resultado/ }).isVisible()); k++) {
      const free = page.getByRole('button', { name: /^Casilla/ }).first();
      if (await free.isEnabled()) await free.click();
      await page.waitForTimeout(650);
    }
    if (g === 0) await page.screenshot({ path: `${SHOTS}/30-tres-en-raya.png` });
    await page.getByRole('button', { name: /Otra partida|Ver resultado/ }).click();
  }
  await expect(result(page)).toBeVisible();
  await back(page);
  expect(Number((await page.getByTestId('hearts').innerText()).replace(/\D/g, ''))).toBeGreaterThan(heartsBefore);
});

test('Juegos para ARMY: quién es, canción, línea de tiempo y sopa de letras', async ({ page }) => {
  await toGames(page);

  await open(page, '¿Quién es?');
  for (let k = 0; k < 8; k++) {
    await page.getByTestId('who-option').first().click();
    if (k === 0) await page.screenshot({ path: `${SHOTS}/31-quien-es.png` });
    await page.getByRole('button', { name: k < 7 ? 'Siguiente' : 'Ver resultado' }).click();
  }
  await expect(result(page)).toContainText(/Adivinaste \d de 8/);
  await back(page);

  await open(page, 'Adiviná la canción');
  for (let s = 0; s < 5; s++) {
    for (const k of 'AEIOSTNRLDMBCUGPFHKVWYJXZQ'.split('')) {
      if (await page.getByRole('button', { name: /Siguiente|Ver resultado/ }).isVisible()) break;
      const key = page.getByRole('button', { name: k, exact: true });
      if (await key.isEnabled()) await key.click();
      if (s === 0 && k === 'O') await page.screenshot({ path: `${SHOTS}/32-cancion.png` });
    }
    await page.getByRole('button', { name: s < 4 ? 'Siguiente' : 'Ver resultado' }).click();
  }
  await expect(result(page)).toBeVisible();
  await back(page);

  await open(page, 'Línea de tiempo');
  for (let r = 0; r < 3; r++) {
    for (let k = 0; k < 5; k++) await page.getByTestId('tl-album').first().click();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    if (r === 0) await page.screenshot({ path: `${SHOTS}/33-linea-de-tiempo.png` });
    await page.getByRole('button', { name: r < 2 ? 'Siguiente' : 'Ver resultado' }).click();
  }
  await expect(result(page)).toBeVisible();
  await back(page);

  await open(page, 'Sopa ARMY');
  await expect(page.getByTestId('ws-cell')).toHaveCount(100);
  await page.screenshot({ path: `${SHOTS}/34-sopa.png` });
  await page.getByRole('button', { name: 'Terminar acá' }).click();
  await expect(result(page)).toContainText('Encontraste 0 de 10');
  await back(page);
});
