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

test('back and forward switch the language in-app, and the switch keeps the scroll position', async ({ page }) => {
  await ready(page, '/');
  await page.evaluate(() => ((window as unknown as { __m: number }).__m = 1));
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('skills')!.scrollIntoView(); });
  const y = await page.evaluate(() => scrollY);
  await page.getByRole('link', { name: 'Magyar' }).first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hu');
  await expect(page.locator('#skills h2')).toHaveText('Kompetenciák');
  expect(Math.abs((await page.evaluate(() => scrollY)) - y)).toBeLessThan(400);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#skills h2')).toHaveText('Skills');
  await page.goForward();
  await expect(page).toHaveURL(/\/hu\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'hu');
  expect(await page.evaluate(() => (window as unknown as { __m?: number }).__m)).toBe(1);
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
      await page.addInitScript(() => sessionStorage.setItem('cv:lang', 'en'));
      await page.goto('/');
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
    test('switching to English from the Hungarian page sticks within the tab session', async ({ page }) => {
      await ready(page, '/hu/');
      await page.getByRole('link', { name: 'English' }).first().click();
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await page.goto('/');
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
  });
  test('a new tab session with a Hungarian browser goes to /hu/ again, and old localStorage choices are ignored', async ({ browser, baseURL }) => {
    const first = await browser.newContext({ locale: 'hu-HU', baseURL });
    const p1 = await first.newPage();
    await ready(p1, '/hu/');
    await p1.getByRole('link', { name: 'English' }).first().click();
    await expect(p1.locator('html')).toHaveAttribute('lang', 'en');
    await first.close();
    const second = await browser.newContext({ locale: 'hu-HU', baseURL });
    const p2 = await second.newPage();
    await p2.addInitScript(() => localStorage.setItem('cv:lang', 'en')); // a value from the old, permanent behaviour
    await p2.goto('/');
    await expect(p2).toHaveURL(/\/hu\/$/);
    await second.close();
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
      test.setTimeout(60_000); // ~45 palette round trips; clicks wait for the results' short entrance to settle
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
    // first the photo, then any key moves on to the sheet, which sits on the photo's glow
    await expect(page.locator('app-pup .pup')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.keyboard.press('Space');
    await expect(page.locator('app-pup .pup.sheet')).toBeAttached();
    const dlg = page.getByRole('dialog', { name: 'Under the hood' });
    await expect(dlg).toBeVisible();
    await expect(dlg.getByText('Third-party cookies')).toBeVisible();
    // the build's own facts: the version and the coverage come from the build
    await expect(dlg.locator('dd', { hasText: /^v\d+\.\d+\.\d+$/ })).toHaveCount(1);
    await expect(dlg.locator('dd', { hasText: /^\d+%$/ })).toHaveCount(1);
    await expect(dlg.locator('dd').nth(1)).toHaveText('0'); // third-party requests
    await expect(dlg.locator('dd').nth(2)).toHaveText('0'); // cookies
    const r = await new AxeBuilder({ page }).include('dialog').analyze();
    expect(r.violations).toEqual([]);
    await expect(page.locator('app-pup .stage')).toHaveCSS('opacity', '0'); // the photo has finished stepping back
    await page.keyboard.press('Escape');
    await expect(dlg).toBeHidden();
    // while the glow fades out, the photo does not come back
    await expect(page.locator('app-pup .pup.leave .stage')).toHaveCSS('opacity', '0');
    await expect(page.locator('app-pup')).toHaveCount(0, { timeout: 3000 }); // the glow leaves with the sheet
  });

  test('behind the photo and behind the sheet the page neither scrolls nor takes clicks', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await ready(page, '/');
    for (let i = 0; i < 3; i++) await page.keyboard.press('Shift');
    await expect(page.locator('app-pup .hint')).toBeAttached();
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    expect(await page.evaluate(() => !!document.querySelector('app-header[inert]') && !!document.querySelector('main[inert]'))).toBe(true);
    await page.keyboard.press('Space');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator('app-pup .stage')).toHaveCSS('opacity', '0', { timeout: 3000 }); // the photo itself is gone
  });

  test('Escape on the photo itself closes it without ever opening the sheet', async ({ page }) => {
    await ready(page, '/');
    for (let i = 0; i < 3; i++) await page.keyboard.press('Shift');
    await expect(page.locator('app-pup .pup')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('app-pup .pup')).toHaveCount(0, { timeout: 3000 });
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test('the easter egg counts only cookies this page set, not those of other sites on the same host', async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: 'other-project', value: '1', url: baseURL! }, { name: 'another', value: '2', url: baseURL! }]);
  await ready(page, '/');
  for (let i = 0; i < 3; i++) await page.keyboard.press('Shift');
  await page.keyboard.press('Space'); // past the photo
  const dlg = page.getByRole('dialog', { name: 'Under the hood' });
  await expect(dlg).toBeVisible();
  expect(await page.evaluate(() => document.cookie.split(';').length)).toBeGreaterThanOrEqual(2);
  await expect(dlg.locator('dd').nth(2)).toHaveText('0');
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

  test('the skills are plain labels: nothing to press, and nothing lights up elsewhere', async ({ page }) => {
    await ready(page, '/');
    await expect(page.locator('#skills button')).toHaveCount(0);
    await expect(page.locator('#skills li.pill').first()).toHaveText('PHP');
    await page.locator('#skills li.pill', { hasText: 'PHP' }).first().click();
    await expect(page.locator('.row.lit, .card.lit').first()).toBeVisible(); // only the career graph's own choice (Backend) is lit
    expect(await page.locator('#projects .card.lit').count()).toBe(0); // and never a project card
    expect(await page.locator('#skills li.pill[title]').count()).toBe(0); // no tooltips: a label is just a label
    const r = await new AxeBuilder({ page }).include('#skills').analyze();
    expect(r.violations).toEqual([]);
  });

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

test.describe('email address: visible, copyable, answered on the button', () => {
  const COPIED = { en: 'Email address copied to clipboard', hu: 'Az email cím a vágólapra másolva' };
  const SHORT = { en: 'Copied', hu: 'Másolva' };
  for (const p of PAGES) {
    test(`${p.url}: the address is text in the hero and contact; Enter copies it and a bubble under the button confirms`, async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await ready(page, p.url);
      await expect(page.locator('.hero').getByText(EMAIL, { exact: true })).toBeVisible();
      await expect(page.locator('#contact').getByText(EMAIL, { exact: true })).toBeVisible();
      await expect(page.locator('#contact a[href^="mailto:"]')).toHaveAttribute('href', `mailto:${EMAIL}`); // the mail icon beside the other links
      const copy = page.locator('.hero').getByRole('button', { name: new RegExp(EMAIL.replace(/\./g, '\\.')) });
      await copy.focus();
      await page.keyboard.press('Enter');
      const heard = page.locator('.hero [role=status]');
      const bubble = page.locator('.hero .bubble');
      await expect(heard).toHaveText(COPIED[p.lang as 'en' | 'hu']); // a screen reader hears the sentence
      await expect(bubble).toHaveText(SHORT[p.lang as 'en' | 'hu']); // the eye gets the short word, under the icon
      await expect(copy.locator('.tick')).toHaveCount(1); // and the copy icon has turned into a check
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);
      await expect(copy).toBeFocused(); // the answer never takes focus
      // each button answers for itself; a second click on the same one restarts it instead of stacking
      await page.locator('#contact').getByRole('button', { name: new RegExp(EMAIL.replace(/\./g, '\\.')) }).click();
      await expect(page.locator('#contact .bubble')).toHaveCount(1);
      await copy.click();
      await expect(bubble).toHaveCount(1);
      await expect(bubble).toBeHidden({ timeout: 5000 });
      await expect(copy.locator('.tick')).toHaveCount(0);
      const r = await new AxeBuilder({ page }).include('.hero').include('#contact').analyze();
      expect(r.violations).toEqual([]);
    });
  }

  test('when copying fails, it says so and selects the address for a manual copy', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } });
      document.execCommand = () => false;
    });
    await ready(page, '/');
    await page.locator('.hero').getByRole('button', { name: /@/ }).click();
    await expect(page.locator('.hero .bubble.error')).toHaveText('Could not copy. The address is shown below.');
    expect(await page.evaluate(() => getSelection()?.toString())).toBe(EMAIL);
  });
});

test('external links open in a new tab, say so, and the GitHub link carries its mark', async ({ page }) => {
  for (const p of PAGES) {
    await ready(page, p.url);
    const ext = page.locator('main a[href^="http"]');
    expect(await ext.count()).toBeGreaterThan(0);
    for (const a of await ext.all()) {
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', /noopener/);
      await expect(a).toHaveAccessibleName(p.lang === 'en' ? /\(opens in a new tab\)$/ : /\(új lapon nyílik\)$/);
    }
    const gh = page.locator('#p-fuzzphony a[href^="https://github.com/"]');
    await expect(gh.locator('svg[aria-hidden="true"]')).toHaveCount(1);
    expect((await gh.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
});

test('the entrances play once: scrolling to the bottom and back to the top starts no animation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page, '/');
  await expect(page.locator('html')).toHaveClass(/settled/);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); });
  await page.waitForTimeout(1400);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  const running = await page.evaluate(() => document.getAnimations().map((a) => (a as CSSAnimation).animationName ?? '').filter((n) => /settle|ping/.test(n)));
  expect(running).toEqual([]);
});

test('palette: empty query lists only the six sections; the placeholder is an example', async ({ page }) => {
  for (const p of PAGES) {
    await ready(page, p.url);
    await page.keyboard.press('Control+k');
    const input = page.getByRole('combobox');
    await expect(input).toHaveAttribute('placeholder', p.lang === 'en' ? 'e.g. PHP' : 'pl. PHP');
    await expect(page.getByRole('dialog').getByRole('option')).toHaveCount(6);
    await page.keyboard.press('Escape');
  }
});

test.describe('the portrait is never downloaded larger than it is shown', () => {
  for (const d of [
    { name: 'phone at 1.75x (Lighthouse mobile)', viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, file: 'portrait-480.avif' },
    { name: 'phone at 3x', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, file: 'portrait-640.avif' },
    { name: 'desktop at 1x', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, file: 'portrait-320.avif' },
    { name: 'desktop at 2x', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, file: 'portrait-640.avif' },
  ]) {
    test.describe(d.name, () => {
      test.use({ viewport: d.viewport, deviceScaleFactor: d.deviceScaleFactor });
      test(`takes ${d.file}, and the file covers the shown size`, async ({ page }) => {
        const images: string[] = [];
        page.on('request', (r) => { if (r.resourceType() === 'image' && /portrait-/.test(r.url())) images.push(r.url().replace(/^.*\//, '')); });
        await ready(page, '/');
        expect(images).toEqual([d.file]);
        const img = page.locator('.portrait img');
        // the chosen file is wide enough for the device pixels it covers (640 is the largest there is)
        const [shown, file] = await img.evaluate((i: HTMLImageElement) => [i.getBoundingClientRect().width * devicePixelRatio, Number(/portrait-(\d+)/.exec(i.currentSrc)![1])]);
        expect(file).toBeGreaterThanOrEqual(Math.min(640, Math.floor(shown)));
      });
    });
  }
});

test.describe('the URL hash changes only when the visitor jumps, and goes at the top', () => {
  const scrollTo = async (page: Page, y: number) => {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.waitForTimeout(350);
  };
  const hash = (page: Page) => page.evaluate(() => location.hash);
  // a spot inside a section, so the test does not depend on how tall the sections above it are
  const inside = (page: Page, id: string, fraction = 0.5) =>
    page.evaluate(([i, f]) => { const r = document.getElementById(i as string)!.getBoundingClientRect(); return Math.round(scrollY + r.top + r.height * (f as number) - 200); }, [id, fraction]);

  test('scrolling alone never writes a hash; a click writes it and scrolling on leaves it; the top removes it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await ready(page, '/hu/');
    await scrollTo(page, await inside(page, 'skills'));
    expect(await hash(page)).toBe('');
    await scrollTo(page, 0);
    expect(await hash(page)).toBe('');

    await page.getByRole('link', { name: 'Projektek' }).first().click();
    await expect.poll(() => hash(page)).toBe('#projects');
    await page.waitForTimeout(1300); // the jump has come to rest
    await scrollTo(page, await inside(page, 'skills'));
    expect(await hash(page)).toBe('#projects'); // the last jump, not the section in view
    await scrollTo(page, await inside(page, 'about'));
    expect(await hash(page)).toBe('#projects');

    await scrollTo(page, 0);
    expect(await hash(page)).toBe('');
    await scrollTo(page, await inside(page, 'skills'));
    expect(await hash(page)).toBe(''); // not put back by scrolling

    await page.getByRole('link', { name: 'Kapcsolat' }).first().click();
    await expect.poll(() => hash(page)).toBe('#contact');
  });

  test('a page loaded with a hash keeps it, and drops it once the visitor is back at the top', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#job-chamber');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    expect(await hash(page)).toBe('#job-chamber');
    await scrollTo(page, await inside(page, 'projects'));
    expect(await hash(page)).toBe('#job-chamber');
    await scrollTo(page, 0);
    expect(await hash(page)).toBe('');
  });
});

test.describe('bottom tab bar on phones', () => {
  for (const [path, name] of [['/', 'About'], ['/hu/', 'Rólam']] as const) {
    test(`${path}: all six sections are there, fitting at 360 and 390 wide`, async ({ page }) => {
      for (const width of [360, 390]) {
        await page.setViewportSize({ width, height: 760 });
        await ready(page, path);
        const nav = page.getByRole('navigation', { name: path === '/' ? 'Quick navigation' : 'Gyors navigáció' });
        await expect(nav.getByRole('link')).toHaveCount(6);
        await expect(nav.getByRole('link', { name })).toBeVisible(); // icon only is fine: the name is still there
        const inside = await nav.evaluate((n) => {
          const box = n.getBoundingClientRect();
          return [...n.querySelectorAll('a')].every((a) => { const r = a.getBoundingClientRect(); return r.left >= box.left - 1 && r.right <= box.right + 1 && r.width >= 40; });
        });
        expect(inside).toBe(true);
      }
    });
  }

  test('jumps through the About tab like every other link', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await ready(page, '/');
    await page.getByRole('navigation', { name: 'Quick navigation' }).getByRole('link', { name: 'About' }).click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#about');
    await expect(page.getByRole('navigation', { name: 'Quick navigation' }).getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'location');
  });
});

test.describe('the portrait flies into the header', () => {
  test('a copy of the portrait is in the header slot once the hero has scrolled away, and the hero one steps aside', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await ready(page, '/');
    const ghost = page.locator('app-avatar-dock .ghost');
    await expect(ghost).not.toHaveClass(/on/);
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    await expect(ghost).toHaveClass(/on/);
    await expect(page.locator('.portrait')).toHaveClass(/docked/);
    const [g, slot] = await page.evaluate(() => {
      const r = (el: Element | null) => { const b = el!.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width)]; };
      return [r(document.querySelector('app-avatar-dock .ghost')), r(document.querySelector('.avatar-slot'))];
    });
    expect(Math.abs(g[0] - slot[0])).toBeLessThanOrEqual(2);
    expect(Math.abs(g[1] - slot[1])).toBeLessThanOrEqual(2);
    expect(Math.abs(g[2] - slot[2])).toBeLessThanOrEqual(2);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(ghost).not.toHaveClass(/on/);
    await expect(page.locator('.portrait')).not.toHaveClass(/docked/);
  });

  test('under reduced motion it simply appears in the slot once the portrait has left', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await ready(page, '/');
    await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'instant' }));
    await page.waitForTimeout(200);
    await expect(page.locator('app-avatar-dock .ghost')).not.toHaveClass(/on/); // portrait still partly in view: no half-way states
    await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }));
    await expect(page.locator('app-avatar-dock .ghost')).toHaveClass(/on/);
  });
});

test.describe('career graph', () => {
  const setup = async (page: Page, width = 1280) => {
    await page.setViewportSize({ width, height: 800 });
    await ready(page, '/hu/');
    return {
      lit: page.locator('#experience .row.lit'),
      chips: page.locator('.arc .filter'),
      lane: (name: string) => page.locator('.arc .name', { hasText: name }),
    };
  };

  test('the log starts collapsed with the Backend family chosen; families are added and removed one by one', async ({ page }) => {
    const { lit, chips, lane } = await setup(page);
    await expect(page.locator('#experience details[open]')).toHaveCount(0);
    await expect(lane('Backend')).toHaveAttribute('aria-pressed', 'true');
    await expect(chips).toHaveCount(1);
    const backendJobs = await lit.count();
    expect(backendJobs).toBeGreaterThan(2);

    await lane('Frontend').click(); // a second family joins the first
    await expect(lane('Frontend')).toHaveAttribute('aria-pressed', 'true');
    await expect(lane('Backend')).toHaveAttribute('aria-pressed', 'true');
    await expect(chips).toHaveCount(2);

    await lane('Backend').click(); // and the first can leave: only the two front-end jobs stay lit
    await expect(lane('Backend')).toHaveAttribute('aria-pressed', 'false');
    await expect(lit).toHaveCount(2);

    await chips.first().click(); // a chip removes its family
    await expect(chips).toHaveCount(0);
    await expect(lit).toHaveCount(0);
  });

  test('pointing at a year lights that year, and the chosen families come back afterwards', async ({ page }) => {
    const { lit, lane } = await setup(page);
    await lane('Backend').click(); // nothing chosen
    await lane('Frontend').click();
    await expect(lit).toHaveCount(2);
    const track = page.locator('.arc .lane').first().locator('.track');
    await track.scrollIntoViewIfNeeded();
    const box = (await track.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
    await expect(page.locator('.arc .readout')).toContainText('2017');
    await expect(lit).toHaveCount(1);
    await page.mouse.move(2, 2);
    await expect(page.locator('.arc .readout')).not.toContainText('2017');
    await expect(lit).toHaveCount(2);
  });

  test('nothing in the graph moves the page or the URL: not a square, not the foundation, not a family', async ({ page }) => {
    const { lane } = await setup(page);
    await page.locator('.arc').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const y = await page.evaluate(() => scrollY);
    await page.locator('.arc .lane').first().locator('.cell[data-l="4"]').last().click();
    await page.locator('.arc .base').first().click();
    await lane('Frontend').click();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => scrollY)).toBe(y);
    expect(await page.evaluate(() => location.hash)).toBe('');
    await expect(page.locator('#experience details[open]')).toHaveCount(0);
  });

  test.describe('on a touch screen', () => {
    test.use({ hasTouch: true });

    test('touching a square shows its year and does not scroll the page', async ({ page }) => {
      await setup(page, 390);
      await page.locator('.arc').scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const y = await page.evaluate(() => scrollY);
      const box = (await page.locator('.arc .lane').first().locator('.cell[data-l="4"]').last().boundingBox())!;
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await expect(page.locator('.arc .readout')).toContainText('2026');
      expect(await page.evaluate(() => scrollY)).toBe(y);
    });
  });
});

test.describe('content security policy', () => {
  for (const p of PAGES) {
    test(`${p.url}: scripts run only by hash, and nothing the site does is refused`, async ({ page }) => {
      const refused: string[] = [];
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (e) => {
          (window as unknown as { __csp: string[] }).__csp = [...((window as unknown as { __csp?: string[] }).__csp ?? []), `${e.violatedDirective} ${e.blockedURI}`];
        });
      });
      page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) refused.push(m.text()); });
      await ready(page, p.url);
      const policy = (await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')) ?? '';
      expect(policy).toMatch(/script-src 'self' 'sha256-/);
      expect(policy).not.toMatch(/script-src[^;]*unsafe-(inline|eval)/);
      expect(policy).toContain("object-src 'none'");

      // use everything that runs script: theme, palette and search, the photo scene and the sheet, the language switch
      await page.locator('app-header button.chip.icon').nth(1).click();
      await page.keyboard.press('Control+K');
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.type('php');
      await page.keyboard.press('Escape');
      for (let i = 0; i < 3; i++) await page.keyboard.press('Shift');
      await expect(page.locator('app-pup .pup')).toBeVisible();
      await page.keyboard.press('Space');
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.locator('app-header a[hreflang]').click();
      await page.waitForTimeout(600);

      expect(await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? [])).toEqual([]);
      expect(refused).toEqual([]);
    });
  }

  test('a script that is not in the page at build time is refused', async ({ page }) => {
    await ready(page, '/');
    const ran = await page.evaluate(() => {
      (window as unknown as { __injected?: boolean }).__injected = false;
      const s = document.createElement('script');
      s.textContent = 'window.__injected = true';
      document.head.appendChild(s);
      return (window as unknown as { __injected: boolean }).__injected;
    });
    expect(ran).toBe(false);
  });
});

test('the portrait and the name in the header lead back to the very top of the page, and the hash goes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await ready(page, '/');
  await page.locator('app-header .links a[href$="#projects"]').click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#projects');
  await page.waitForTimeout(1300);
  await page.locator('app-header .brand').click();
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBe(0);
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
});

test.describe('review fixes', () => {
  test('phone: the contact icons wrap inside the page margin', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await ready(page, '/hu/');
    const lefts = await page.locator('#contact .icon').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
    expect(lefts.length).toBe(3);
    for (const x of lefts) expect(x).toBeGreaterThanOrEqual(16);
  });

  test('phone: the tabs stay where they are while the current section changes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await ready(page, '/hu/');
    const xs = () => page.evaluate(() => [...document.querySelectorAll('app-tabbar a svg')].map((e) => Math.round(e.getBoundingClientRect().left)));
    const before = await xs();
    for (const id of ['experience', 'projects', 'contact']) {
      await page.evaluate((i) => { const el = document.getElementById(i)!; scrollTo({ top: el.getBoundingClientRect().top + scrollY - 70, behavior: 'instant' }); }, id);
      await page.waitForTimeout(600);
      expect(await xs()).toEqual(before);
    }
  });

  test('the footer names the release and links to it and to the licence', async ({ page }) => {
    await ready(page, '/');
    const links = await page.locator('footer a').evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
    expect(links[0]).toMatch(/\/releases\/tag\/v\d+\.\d+\.\d+$/);
    expect(links[1]).toMatch(/\/blob\/main\/LICENSE$/);
  });

  test('phone: a long project description folds and unfolds', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await ready(page, '/');
    const more = page.locator('#projects .more').first();
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(more).toBeHidden();
  });
});

test.describe('own tooltips and the theme answer', () => {
  test('a tooltip is a data attribute with no browser title, it exists only on hover, and it never widens the page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await ready(page, '/hu/');
    expect(await page.locator('[title]:not(svg *)').count()).toBe(0); // no native title tooltips left
    const search = page.locator('app-header button[data-tip]').first();
    const shown = () => search.evaluate((e) => getComputedStyle(e, '::after').display);
    expect(await shown()).toBe('none');
    await search.hover();
    await expect.poll(shown).toBe('block');
    expect(await search.evaluate((e) => getComputedStyle(e, '::after').content)).toContain('Ctrl K');
  });

  test('a click on the theme button is answered in words; Auto says what it follows and what the system uses now', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await ready(page, '/hu/');
    const button = page.locator('app-header button[aria-label^="Téma"]');
    const hint = page.getByRole('status').filter({ hasText: /Világos|Sötét|Auto/ });
    await expect(hint).toHaveCount(0);
    await button.click(); // auto -> light
    await expect(hint).toHaveText(/Világos/);
    await button.click(); // light -> dark
    await expect(hint).toHaveText(/Sötét/);
    await button.click(); // dark -> auto
    await expect(hint).toContainText('a rendszered témáját követi (most: sötét)');
    // arriving back at Auto turns the other way from Light and Dark (the cycle winds back)
    const anim = (sel: string) => page.locator(sel).evaluate((e) => (e as SVGElement).getAnimations().map((x) => (x as CSSAnimation).animationName).join());
    expect(await anim('app-header button[aria-label^="Téma"] svg.mode.auto')).toMatch(/mode-back/);
    await expect(hint).toHaveCount(0, { timeout: 5000 }); // and it goes away by itself
  });
});

test.describe('skill pills on a touch screen', () => {
  test.use({ hasTouch: true });

  test('touching a pill plays its glint once and then lets go', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await ready(page, '/hu/');
    const pill = page.locator('#skills li.pill', { hasText: 'Symfony' });
    await pill.scrollIntoViewIfNeeded();
    await pill.tap();
    await expect(pill).toHaveClass(/touched/);
    expect(await pill.evaluate((e) => getComputedStyle(e, '::after').animationName)).toMatch(/glint/);
    await expect(pill).not.toHaveClass(/touched/, { timeout: 3000 });
  });
});

test.describe('HIG and motion polish', () => {
  test('a skill pill is not pressable: no press scale rule applies to it', async ({ page }) => {
    await ready(page, '/hu/');
    const rules = await page.evaluate(() => [...document.styleSheets].flatMap((s) => [...s.cssRules]).map((r) => r.cssText).filter((t) => /\.pill[^{]*:active/.test(t)));
    expect(rules).toEqual([]);
  });

  test('the tooltip waits 400 ms on hover, and Escape hides it until the pointer moves', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await ready(page, '/hu/');
    const search = page.locator('app-header button[data-tip]').first();
    await search.hover();
    await expect.poll(() => search.evaluate((e) => getComputedStyle(e, '::after').animationDelay)).toBe('0.4s');
    await expect.poll(() => search.evaluate((e) => getComputedStyle(e, '::after').display)).toBe('block');
    await page.keyboard.press('Escape');
    await expect.poll(() => search.evaluate((e) => getComputedStyle(e, '::after').display)).toBe('none');
    await page.mouse.move(2, 2);
    await search.hover();
    await expect.poll(() => search.evaluate((e) => getComputedStyle(e, '::after').display)).toBe('block');
  });

  test('the theme button tooltip lines up with its right edge, and keyboard focus shows a tooltip at once', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await ready(page, '/hu/');
    const theme = page.locator('app-header button[data-tip-align="end"]');
    await page.keyboard.press('Tab');
    await theme.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect.poll(() => theme.evaluate((e) => getComputedStyle(e, '::after').display)).toBe('block');
    expect(await theme.evaluate((e) => getComputedStyle(e, '::after').animationDelay)).toBe('0s');
    expect(await theme.evaluate((e) => getComputedStyle(e, '::after').right)).toBe('0px');
  });

  test('phone: the targets are at least 44 px high', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await ready(page, '/hu/');
    const tall = (sel: string) => page.locator(sel).evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    for (const h of await tall('.arc .name')) expect(h).toBeGreaterThanOrEqual(44);
    for (const h of await tall('#projects .more')) expect(h).toBeGreaterThanOrEqual(44);
    for (const h of await tall('footer a')) expect(h).toBeGreaterThanOrEqual(44);
    expect((await tall('app-header .brand'))[0]).toBeGreaterThanOrEqual(44);
    const chip = await page.locator('.arc .filter').first().evaluate((e) => { const r = e.getBoundingClientRect(); const b = getComputedStyle(e, '::before'); return r.height + parseFloat(b.top) * -2; });
    expect(chip).toBeGreaterThanOrEqual(44);
  });

  test.describe('on a touch screen', () => {
    test.use({ hasTouch: true });

    test('tapping a hobby tile shows its name for a moment, tapping elsewhere puts it away', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 800 });
      await ready(page, '/hu/');
      const tile = page.locator('.tile.dog');
      await tile.scrollIntoViewIfNeeded();
      await tile.tap();
      await expect(tile).toHaveClass(/tip-open/);
      expect(await tile.evaluate((e) => getComputedStyle(e, '::after').display)).toBe('block');
      await page.locator('.tile.cinema').tap();
      await expect(tile).not.toHaveClass(/tip-open/);
      await expect(page.locator('.tile.cinema')).toHaveClass(/tip-open/);
    });
  });

  test('the theme answer is a live region that is always there, so it is announced', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await ready(page, '/hu/');
    const live = page.locator('app-header .ctl [role="status"]');
    await expect(live).toHaveCount(1);
    await expect(live).toHaveText('');
    await page.locator('app-header button[aria-label^="Téma"]').click();
    await expect(live).toContainText('Világos');
  });
});

test.describe('the menu follows the click', () => {
  const current = (page: Page) => page.evaluate(() => [...document.querySelectorAll('app-header .links a')].filter((a) => a.hasAttribute('aria-current')).map((a) => a.textContent!.trim()));

  test('at the bottom, where About and Contact are both in view, a click on About makes About current and a click on Contact brings Contact back', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ready(page, '/hu/');
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); });
    await expect.poll(() => current(page)).toEqual(['Kapcsolat']);
    await page.locator('app-header .links a', { hasText: 'Rólam' }).click();
    await expect.poll(() => current(page)).toEqual(['Rólam']);
    await page.locator('app-header .links a', { hasText: 'Kapcsolat' }).click();
    await expect.poll(() => current(page)).toEqual(['Kapcsolat']);
  });

  test('a click on the section already at the top still makes it current at once', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ready(page, '/hu/');
    await page.locator('app-header .links a', { hasText: 'Projektek' }).click();
    await expect.poll(() => current(page)).toEqual(['Projektek']);
    await page.waitForTimeout(1300);
    await page.locator('app-header .links a', { hasText: 'Projektek' }).click(); // the same one again: nothing to scroll
    await expect.poll(() => current(page)).toEqual(['Projektek']);
  });
});

test.describe('the desktop menu', () => {
  test('has an icon before each label, and its pill follows the pointer and returns to the current item', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ready(page, '/hu/');
    const links = page.locator('app-header .links a');
    await expect(links.locator('svg')).toHaveCount(6);
    const target = (i: number) => links.nth(i).evaluate((a) => getComputedStyle(a).getPropertyValue('anchor-name'));
    await expect.poll(() => target(0)).toBe('--nav-target');
    await links.nth(3).hover();
    await expect.poll(() => target(3)).toBe('--nav-target');
    await expect.poll(() => target(0)).toBe('none');
    await page.mouse.move(600, 600);
    await expect.poll(() => target(0)).toBe('--nav-target');
  });

  test('fits the bar at the narrowest desktop width, in both languages', async ({ page }) => {
    for (const width of [900, 1100]) for (const path of ['/', '/hu/']) {
      await page.setViewportSize({ width, height: 800 });
      await ready(page, path);
      const over = await page.evaluate(() => {
        const bar = document.querySelector('app-header .bar')!.getBoundingClientRect();
        const last = document.querySelector('app-header .ctl')!.getBoundingClientRect();
        const nav = document.querySelector('app-header .links')!.getBoundingClientRect();
        return { wide: document.documentElement.scrollWidth > innerWidth, clipped: last.right > bar.right || nav.right > last.left + 1 };
      });
      expect(over).toEqual({ wide: false, clipped: false });
    }
  });
});

test.describe('the search on a phone', () => {
  test('is a full-screen opaque sheet whose Close button stays inside it, even for long results', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await ready(page, '/hu/');
    await page.locator('app-header button[aria-label]').first().click();
    const dlg = page.getByRole('dialog');
    await expect(dlg).toBeVisible();
    await page.keyboard.type('php');
    await expect(dlg.getByRole('option').first()).toBeVisible();
    await page.waitForTimeout(600); // the sheet's entrance
    const m = await page.evaluate(() => {
      const d = document.querySelector('dialog')!.getBoundingClientRect();
      const b = document.querySelector('dialog .field button')!.getBoundingClientRect();
      const bg = getComputedStyle(document.querySelector('dialog')!).backgroundColor;
      return { w: d.width, h: d.height, vw: innerWidth, vh: innerHeight, inside: b.right <= d.right && b.left >= d.left, bg };
    });
    expect(m.w).toBe(m.vw);
    expect(m.h).toBe(m.vh);
    expect(m.inside).toBe(true);
    expect(m.bg).not.toMatch(/rgba\(.*, 0\.\d+\)$/); // no alpha: nothing shows through
  });
});

