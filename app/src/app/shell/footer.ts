import { Component, computed, input } from '@angular/core';
import { EXTRA } from '../content/extra';
import type { SiteContent } from '../content/model';
import { BUILD } from '../egg/build-info';

const REPO = 'https://github.com/er2es/er2es.github.io';

/** The last line of the page: whose it is, which release it is, and under what terms the code can be used. */
@Component({
  selector: 'app-footer',
  template: `
    <footer class="block alt foot">
      <div class="wrap mono">
        <span>© {{ year }} {{ c().hero.name }}</span>
        <a [attr.href]="release" target="_blank" rel="noopener noreferrer">v{{ version }}<span class="sr-only"> {{ x().newTab }}</span></a>
        <a [attr.href]="licence" target="_blank" rel="noopener noreferrer">MIT<span class="sr-only"> {{ x().newTab }}</span></a>
      </div>
    </footer>
  `,
  styles: [`
    .foot { padding-block: 1.5rem; font-size: var(--t-footnote); color: var(--fg-2); }
    .foot.block { border-top: 1px solid var(--accent); } /* the page ends on a line in the accent colour */
    .wrap { display: flex; flex-wrap: wrap; gap: 0.25rem 1.25rem; align-items: center; }
    a { display: inline-flex; align-items: center; min-height: 44px; margin-inline: -0.5rem; padding-inline: 0.5rem; color: inherit; text-underline-offset: 0.2em; }
    @media (hover: hover) { a:hover { color: var(--fg); } }
    /* room for the floating tab bar on phones */
    @media (max-width: 899px) { .foot { padding-bottom: calc(var(--tabbar-h) + 2rem + env(safe-area-inset-bottom)); } }
  `],
})
export class Footer {
  readonly c = input.required<SiteContent>();
  protected readonly x = computed(() => EXTRA[this.c().lang]);
  protected readonly year = BUILD.date ? BUILD.date.slice(0, 4) : new Date().getFullYear();
  protected readonly version = BUILD.version || '1';
  protected readonly release = `${REPO}/releases/tag/v${BUILD.version}`;
  protected readonly licence = `${REPO}/blob/main/LICENSE`;
}
