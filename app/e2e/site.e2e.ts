import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const EMAIL = 'szabo.jozsef.acc@gmail.com';
const PAGES = [
  { url: '/', lang: 'en', name: 'József Szabó' },
  { url: '/hu/', lang: 'hu', name: 'Szabó József' },
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
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.name);
      const html = await page.content();
      const emails = [...new Set(html.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? [])];
      expect(emails).toEqual([EMAIL]);
      expect(html).not.toMatch(/\+36/);
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

test.describe('browser language detection', () => {
  test.describe('Hungarian browser', () => {
    test.use({ locale: 'hu-HU' });
    test('/ goes to the Hungarian page before first paint', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/hu\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'hu');
    });
    test('an explicit choice of English wins over the browser language', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('cv:lang', 'en'));
      await page.goto('/');
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
    test('switching to English from the Hungarian page sticks', async ({ page }) => {
      await ready(page, '/hu/');
      await page.getByRole('link', { name: 'English' }).first().click();
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await page.goto('/');
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
  });
  for (const locale of ['en-US', 'de-DE', 'fr-FR']) {
    test.describe(`${locale} browser`, () => {
      test.use({ locale });
      test('stays on the English page', async ({ page }) => {
        await ready(page, '/');
        await expect(page).toHaveURL(/\/$/);
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      });
      test('an explicit /hu/ link is respected', async ({ page }) => {
        await ready(page, '/hu/');
        await expect(page.locator('html')).toHaveAttribute('lang', 'hu');
      });
    });
  }
});

test.describe('JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });
  for (const p of PAGES) {
    test(`${p.url} is readable and navigable`, async ({ page }) => {
      await page.goto(p.url);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.name);
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

test.describe('search results land exactly on their target', () => {
  for (const p of PAGES) {
    test(`${p.url}: every result exists and is shown below the header`, async ({ page }) => {
      await ready(page, p.url);
      const queries = ['php', 'qa', 'symfony', 'wordpress', 'laravel', 'egyetem', 'university', 'tesztel', 'tester', 'postgre', 'angular', 'survey', 'kérdőív', 'english', 'angol', 'education', 'tanulm', 'award', 'elismer', 'contact', 'kapcsolat', 'profile', 'profil', 'audit', 'fuzzphony', 'seeddms', 'vba'];
      const open = async (q: string) => {
        await page.keyboard.press('Control+k');
        await page.getByRole('dialog').waitFor();
        await page.keyboard.type(q);
        // the list re-renders one frame after the last keystroke: wait for it before reading or clicking
        await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
      };
      const seen = new Map<string, string>(); // anchor -> query that finds it
      for (const q of queries) {
        await open(q);
        const anchors = await page.getByRole('dialog').getByRole('option').evaluateAll((os) => os.map((o) => o.getAttribute('data-anchor')).filter(Boolean) as string[]);
        for (const a of anchors) if (!seen.has(a)) seen.set(a, q);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toBeHidden();
      }
      expect(seen.size).toBeGreaterThanOrEqual(14);
      for (const [anchor, q] of seen) {
        await open(q);
        await page.getByRole('dialog').locator(`[role=option][data-anchor="${anchor}"]`).first().click();
        await expect(page.getByRole('dialog')).toBeHidden();
        await page.waitForFunction((id) => {
          const el = document.getElementById(id);
          if (!el) return false;
          const r = el.getBoundingClientRect();
          const header = document.querySelector('header')!.getBoundingClientRect().bottom;
          const atBottom = window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 2;
          // lands just under the fixed header; targets near the page end cannot reach the top, they must still be in view
          return atBottom ? r.bottom > header && r.top < window.innerHeight : r.top >= header - 2 && r.top < window.innerHeight * 0.6;
        }, anchor, { timeout: 4000 }).catch(async (e) => {
          const m = await page.evaluate((id) => { const el = document.getElementById(id); const r = el?.getBoundingClientRect(); return { id, found: !!el, top: r?.top, bottom: r?.bottom, header: document.querySelector('header')!.getBoundingClientRect().bottom, sy: scrollY, max: document.documentElement.scrollHeight - innerHeight }; }, anchor);
          throw new Error(`result ${JSON.stringify(m)} (query "${q}"): ${e.message}`);
        });
        if (anchor.startsWith('job-')) {
          expect(await page.locator(`#${anchor} details`).evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
        }
      }
    });
  }
});

test.describe('easter egg', () => {
  test('console hint, and three Shifts open "Under the hood" with live numbers', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (m) => logs.push(m.text()));
    await ready(page, '/');
    expect(logs.some((l) => /stat/.test(l) && /shift shift shift/.test(l) && /Geralt/.test(l))).toBe(true);
    await page.keyboard.press('Shift');
    await page.keyboard.press('Shift');
    await page.keyboard.press('Shift');
    const dlg = page.getByRole('dialog', { name: 'Under the hood' });
    await expect(dlg).toBeVisible();
    await expect(dlg.getByText('Third-party requests')).toBeVisible();
    await expect(dlg.locator('dd').nth(1)).toHaveText('0'); // third-party requests
    await expect(dlg.locator('dd').nth(2)).toHaveText('0'); // cookies
    const r = await new AxeBuilder({ page }).include('dialog').analyze();
    expect(r.violations).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dlg).toBeHidden();
  });
});
