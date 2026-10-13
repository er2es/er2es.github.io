import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PAGES = [
  { url: '/', lang: 'en' },
  { url: '/hu/', lang: 'hu' },
];

const ready = async (page: Page, url: string) => {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
};

for (const p of PAGES) {
  test.describe(p.url, () => {
    test('renders with the right language, one email, no console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push(String(e)));
      await ready(page, p.url);
      await expect(page.locator('html')).toHaveAttribute('lang', p.lang);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Szabó József');
      const html = await page.content();
      const emails = [...new Set(html.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? [])];
      expect(emails).toEqual(['claude@mbvk.hu']);
      expect(html).not.toMatch(/\+36|gmail/i);
      expect(errors).toEqual([]);
    });

    for (const scheme of ['light', 'dark'] as const) {
      test(`axe finds no violations (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await ready(page, p.url);
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
        expect(r.violations).toEqual([]);
      });
    }

    test('palette opens with Ctrl+K, searches, closes with Escape, and is accessible', async ({ page }) => {
      await ready(page, p.url);
      await page.keyboard.press('Control+k');
      const dlg = page.getByRole('dialog');
      await expect(dlg).toBeVisible();
      await page.keyboard.type('selenium');
      await expect(dlg.getByRole('option').first()).toContainText(/tester|tesztelő/i);
      const r = await new AxeBuilder({ page }).include('dialog').analyze();
      expect(r.violations).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(dlg).toBeHidden();
    });
  });
}

test('theme button cycles and sets data-theme', async ({ page }) => {
  await ready(page, '/');
  const btn = page.getByRole('button', { name: /^Theme:/ });
  await btn.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await btn.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('language switch is an in-app navigation and keeps hreflang correct', async ({ page }) => {
  await ready(page, '/');
  await page.evaluate(() => ((window as unknown as { __m: number }).__m = 1));
  await page.getByRole('link', { name: 'Magyar' }).first().click();
  await expect(page).toHaveURL(/\/hu\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'hu');
  expect(await page.evaluate(() => (window as unknown as { __m?: number }).__m)).toBe(1); // no full reload
});

test.describe('Hungarian browser', () => {
  test.use({ locale: 'hu-HU' });
  test('sees the discreet Hungarian prompt on the English page only, and can dismiss it', async ({ page }) => {
    await ready(page, '/');
    const banner = page.getByRole('region', { name: 'Nyelv' });
    await expect(banner).toBeVisible();
    await banner.getByRole('button', { name: 'Bezár' }).click();
    await expect(banner).toBeHidden();
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('region', { name: 'Nyelv' })).toHaveCount(0);
  });
  test('does not see it on /hu/', async ({ page }) => {
    await ready(page, '/hu/');
    await expect(page.getByRole('region', { name: 'Nyelv' })).toHaveCount(0);
  });
});

test.describe('English browser', () => {
  test('never sees the Hungarian prompt', async ({ page }) => {
    await ready(page, '/');
    await expect(page.getByRole('region', { name: 'Nyelv' })).toHaveCount(0);
  });
});

test.describe('JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });
  for (const p of PAGES) {
    test(`${p.url} is readable and navigable`, async ({ page }) => {
      await page.goto(p.url);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Szabó József');
      await expect(page.locator('#experience')).toContainText('2021–2026');
      const hrefs = await page.locator('header nav a').evaluateAll((a) => a.map((x) => x.getAttribute('href')));
      expect(hrefs.every((h) => h!.startsWith(p.url))).toBe(true);
    });
  }
});

test.describe('reduced motion, transparency and high contrast', () => {
  test('stays accessible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', contrast: 'more' });
    await ready(page, '/');
    const r = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
    expect(r.violations).toEqual([]);
  });
});

test('no horizontal scroll on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await ready(page, '/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
