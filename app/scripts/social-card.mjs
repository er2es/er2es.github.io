import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

/**
 * Draws the social cards (1200x630, what a link preview shows) from the portrait that is already in the repository:
 * public/img/card-en.jpg and card-hu.jpg. Run `npm run card` after the name or the role line in the content changes, and
 * commit the pictures. The texts below are the hero lines of content/en.ts and content/hu.ts.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const portrait = readFileSync(join(root, 'public', 'img', 'portrait-640.jpg')).toString('base64');

const CARDS = {
  en: { name: 'József Szabó', role: 'Full-stack PHP developer', stack: 'Symfony · Angular · PostgreSQL · QA', where: 'Budapest · remote / hybrid' },
  hu: { name: 'Szabó József', role: 'Full-stack PHP-fejlesztő', stack: 'Symfony · Angular · PostgreSQL · QA', where: 'Budapest · remote / hybrid' },
};

const html = (c) => `<!doctype html><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #000; color: #f5f5f7; font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif; position: relative; }
  .glow { position: absolute; width: 900px; height: 900px; left: -300px; top: -420px; border-radius: 50%; background: radial-gradient(circle at 40% 40%, rgba(52, 214, 92, 0.30), transparent 66%); }
  .glow2 { position: absolute; width: 700px; height: 700px; right: -260px; bottom: -380px; border-radius: 50%; background: radial-gradient(circle, rgba(255, 255, 255, 0.10), transparent 66%); }
  .frame { position: absolute; inset: 34px; border: 2px solid rgba(255, 255, 255, 0.16); border-radius: 36px; }
  .text { position: absolute; left: 96px; top: 0; bottom: 0; width: 600px; display: flex; flex-direction: column; justify-content: center; gap: 22px; }
  h1 { font-size: 92px; line-height: 1.02; font-weight: 700; letter-spacing: -0.02em; }
  .role { font-size: 44px; font-weight: 500; }
  .stack { font-size: 30px; color: #b8b8bd; }
  .where { display: flex; align-items: center; gap: 14px; font-size: 26px; color: #b8b8bd; letter-spacing: 0.04em; margin-top: 8px; }
  .dot { width: 16px; height: 16px; border-radius: 50%; background: #34d65c; }
  img { position: absolute; right: 96px; top: 95px; width: 440px; height: 440px; border-radius: 96px; object-fit: cover; }
  .url { position: absolute; left: 96px; bottom: 70px; font-size: 24px; color: #34d65c; font-weight: 600; }
</style><div class="glow"></div><div class="glow2"></div><div class="frame"></div>
<div class="text"><h1>${c.name}</h1><p class="role">${c.role}</p><p class="stack">${c.stack}</p><p class="where"><span class="dot"></span>${c.where}</p></div>
<img src="data:image/jpeg;base64,${portrait}" alt=""><p class="url">er2es.github.io</p>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [lang, c] of Object.entries(CARDS)) {
  await page.setContent(html(c));
  await page.waitForTimeout(300);
  writeFileSync(join(root, 'public', 'img', `card-${lang}.jpg`), await page.screenshot({ type: 'jpeg', quality: 88 }));
  console.log(`card-${lang}.jpg`);
}
await browser.close();
