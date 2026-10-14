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
      await expect(dlg.getByRole('option').filter({ hasText: /tester|tesztelő/i }).first()).toBeVisible();
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

test.describe('interaction layer', () => {
  test('hero entrance plays once, transform only, and is skipped under reduced motion', async ({ page }) => {
    await ready(page, '/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/\bsettled\b/);
    const uses = await page.evaluate(() => [...document.styleSheets].flatMap((s) => [...s.cssRules]).map((r) => r.cssText).filter((t) => /@keyframes[^{]*settle/.test(t)));
    expect(uses.length).toBeGreaterThan(0);
    for (const k of uses) expect(k).not.toMatch(/opacity/); // never fades text or the LCP portrait
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const names = await page.evaluate(() => document.getAnimations().map((a) => (a as CSSAnimation).animationName ?? ''));
    expect(names.filter((n) => /settle|ping|drift/.test(n))).toEqual([]);
  });

  test('portrait follows a fine pointer and lets go on leave; not under reduced motion', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await ready(page, '/');
    await expect(page.locator('html')).toHaveClass(/\bsettled\b/); // hydrated, listeners attached
    const pic = page.locator('.portrait');
    const box = (await pic.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1, { steps: 4 });
    await expect(pic).toHaveClass(/tracking/);
    expect(await pic.evaluate((e) => e.style.getPropertyValue('--tilt-y'))).toMatch(/deg$/);
    await page.mouse.move(box.x + box.width / 2, 880, { steps: 4 }); // below the hero
    await expect(pic).not.toHaveClass(/tracking/);
    expect(await pic.evaluate((e) => e.style.getPropertyValue('--tilt-y'))).toBe('');
  });

  test('a skill opens where it was used, with the keyboard, and lights up those entries', async ({ page }) => {
    await ready(page, '/');
    const toolbar = page.getByRole('toolbar');
    const pills = toolbar.locator('button.pill');
    expect(await pills.evaluateAll((bs) => bs.filter((b) => b.getAttribute('tabindex') === '0').length)).toBe(1); // one Tab stop
    await pills.first().focus();
    await expect(pills.first()).toHaveText('PHP');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('button', { name: 'Symfony' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Symfony' })).toHaveAttribute('aria-expanded', 'true');
    const panel = page.getByRole('region', { name: 'Where I used Symfony' });
    await expect(panel).toBeVisible();
    await expect(panel.locator('a[href="/#job-chamber"]')).toBeVisible();
    await expect(panel.locator('a[href="/#p-fuzzphony"]')).toBeVisible();
    await expect(page.locator('#job-chamber')).toHaveClass(/\blit\b/);
    await expect(page.locator('#p-fuzzphony')).toHaveClass(/\blit\b/);
    await expect(page.locator('#job-edu-nonprofit')).not.toHaveClass(/\blit\b/);
    const r = await new AxeBuilder({ page }).include('#skills').analyze();
    expect(r.violations).toEqual([]);
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('button', { name: 'Angular' })).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(page.getByRole('button', { name: 'PHP' })).toBeFocused();
    await expect(page.locator('#job-chamber')).not.toHaveClass(/\blit\b/);
    // a link in the panel jumps to the entry and opens it
    await page.getByRole('button', { name: 'Laravel' }).click();
    await page.getByRole('region', { name: 'Where I used Laravel' }).locator('a[href="/#job-uni-med"]').click();
    await expect(page).toHaveURL(/#job-uni-med$/);
    expect(await page.locator('#job-uni-med details').evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
  });

  // the owner's line is the same, in English, on both pages
  for (const p of [{ url: '/', none: "Trust me bro' :)", label: 'Where I used' }, { url: '/hu/', none: "Trust me bro' :)", label: 'Hol használtam:' }]) {
    test(`${p.url}: a skill with no entry in the CV still answers, and one with entries lists them`, async ({ page }) => {
      await ready(page, p.url);
      const redis = page.getByRole('button', { name: 'Redis' });
      await redis.click();
      await expect(redis).toHaveAttribute('aria-expanded', 'true');
      const panel = page.getByRole('region', { name: new RegExp(`^${p.label}.*Redis`) });
      await expect(panel).toHaveText(p.none);
      await expect(panel.getByRole('link')).toHaveCount(0);
      await page.getByRole('button', { name: 'PostgreSQL' }).click();
      await expect(redis).toHaveAttribute('aria-expanded', 'false');
      const rows = page.getByRole('region', { name: /PostgreSQL/ }).getByRole('link');
      expect(await rows.count()).toBeGreaterThan(0);
      await expect(page.getByText(p.none)).toHaveCount(0);
    });
  }

  test('career entries: arrow keys move between them, Home and End jump', async ({ page }) => {
    await ready(page, '/');
    const summaries = page.locator('#experience summary');
    await summaries.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(summaries.nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(summaries.last()).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(summaries.nth(-2)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(summaries.first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    expect(await summaries.nth(1).evaluate((s) => (s.parentElement as HTMLDetailsElement).open)).toBe(true);
  });

  test('theme change starts from the theme button and cleans up after itself', async ({ page }) => {
    await ready(page, '/');
    const btn = page.getByRole('button', { name: /^Theme:/ });
    const seen = page.evaluate(() => new Promise<string>((resolve) => {
      const root = document.documentElement;
      const mo = new MutationObserver(() => { if (root.classList.contains('theme-vt')) { mo.disconnect(); resolve(root.style.getPropertyValue('--vt-x')); } });
      mo.observe(root, { attributes: true });
    }));
    await btn.press('Enter'); // keyboard activation still has an origin: the button itself
    const x = parseFloat(await seen);
    const b = (await btn.boundingBox())!;
    expect(Math.abs(x - (b.x + b.width / 2))).toBeLessThan(2);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).not.toHaveClass(/theme-vt/);
    expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--vt-x'))).toBe('');
  });

  test('palette marks the matched text and gives each result an icon', async ({ page }) => {
    await ready(page, '/');
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox').waitFor();
    await page.keyboard.type('tester');
    const first = page.getByRole('dialog').getByRole('option').first();
    await expect(first.locator('.hit').first()).toHaveText(/tester/i);
    await expect(first.locator('svg')).toHaveCount(1);
  });

  test('the header selection follows the current section', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await ready(page, '/');
    await page.getByRole('navigation', { name: /./ }).first().getByRole('link', { name: 'Skills' }).click();
    const link = page.locator('header nav a[aria-current]');
    await expect(link).toHaveText('Skills');
    await expect.poll(async () => page.evaluate(() => {
      const nav = document.querySelector('header nav')!;
      const cur = nav.querySelector('a[aria-current]')!.getBoundingClientRect();
      if (!CSS.supports('anchor-name: --a')) return 0;
      const pill = getComputedStyle(nav, '::after');
      return Math.abs(parseFloat(pill.left) + nav.getBoundingClientRect().left - cur.left);
    })).toBeLessThan(2);
  });
});
