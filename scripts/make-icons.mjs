// Genera los íconos PNG de la PWA a partir de public/icons/icon.svg (usa Chromium de Playwright).
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/icons/icon.svg', import.meta.url), 'utf8');
const exe = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage();
const sizes = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, true],
];
for (const [name, size, padded] of sizes) {
  await page.setViewportSize({ width: size, height: size });
  const inner = padded ? Math.round(size * 0.8) : size;
  await page.setContent(
    `<html><body style="margin:0;background:${padded ? '#e8dcf6' : 'transparent'};display:grid;place-items:center;width:${size}px;height:${size}px">` +
      svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `) +
      '</body></html>',
  );
  await page.screenshot({ path: new URL(`../public/icons/${name}`, import.meta.url).pathname, omitBackground: !padded });
  console.log('ok', name);
}
await browser.close();
