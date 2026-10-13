import { chromium } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import desktop from 'lighthouse/core/config/desktop-config.js';

const BASE = process.env.BASE_URL ?? 'http://localhost:4300';
const PAGES = ['/', '/hu/'];
// Performance is a noisy lab metric: >= 95. The others signal real defects: exactly 100.
const MIN = { performance: 95, accessibility: 100, 'best-practices': 100, seo: 100 };
const CATS = Object.keys(MIN);

const chrome = await chromeLauncher.launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless=new', '--no-sandbox'],
});
let failed = false;
try {
  for (const path of PAGES) {
    for (const mode of ['mobile', 'desktop']) {
      const { lhr } = await lighthouse(
        BASE + path,
        { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: CATS },
        mode === 'desktop' ? desktop : undefined,
      );
      const scores = Object.fromEntries(CATS.map((c) => [c, Math.round((lhr.categories[c].score ?? 0) * 100)]));
      console.log(`${path.padEnd(5)} ${mode.padEnd(8)} ${JSON.stringify(scores)}`);
      if (CATS.some((c) => scores[c] < MIN[c])) {
        failed = true;
        for (const a of Object.values(lhr.audits)) {
          if (a.score !== null && a.score < 1 && !['informative', 'notApplicable', 'manual'].includes(a.scoreDisplayMode)) {
            console.log(`   - ${a.id}: ${a.score} ${a.displayValue ?? ''}`);
          }
        }
      }
    }
  }
} finally {
  await chrome.kill();
}
process.exit(failed ? 1 : 0);
