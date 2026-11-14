import { Component, computed, inject, input } from '@angular/core';
import { EXTRA } from '../content/extra';
import type { SiteContent } from '../content/model';
import { BUILD } from '../egg/build-info';
import { Graveyard } from './graveyard';

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
      <div class="yard" aria-hidden="true"><div class="wrap lot">
        @if (ground().l) { <i class="ground l"></i> }
        @if (ground().r) { <i class="ground r"></i> }
        @for (g of graves(); track g.id) {
          <span class="grave" [class.l]="g.side < 0" [class.r]="g.side > 0" [class.flip]="g.flip" [style.--x.px]="g.x" [style.--y.px]="g.y" [style.--tilt.deg]="g.tilt">
            <svg class="body" viewBox="0 0 34 14" width="34" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false"><circle cx="5" cy="7" r="3" /><path d="M8 7h13M13 7l-2-4M14 7l3 5M21 7l7-3l3 1M21 7l8 3" /></svg>
            <svg class="cross" viewBox="0 0 10 16" width="10" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" focusable="false"><path d="M5 1v14M1.500 5h7" /></svg>
          </span>
        }
      </div></div>
    </footer>
  `,
  styles: [`
    .foot { position: relative; padding-block: 1.5rem 2.75rem; font-size: var(--t-footnote); color: var(--fg-2); }
    /* those who fell off the tiles lie along the bottom edge, each with a small cross, leaning */
    .yard { position: absolute; inset-inline: 0; bottom: 6px; height: 56px; pointer-events: none; overflow: hidden; }
    /* on the side they fell off, in a heap: a few side by side, the next on top of those */
    /* a hairline of ground under each heap, fading out at the ends, so that they lie on something */
    .lot { position: relative; height: 100%; } /* the same column as the text above: the heaps stand at its two edges */
    .ground { position: absolute; bottom: 0; width: 230px; height: 1px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--fg-2) 60%, transparent) 16% 84%, transparent); }
    .ground.l { left: 0; }
    .ground.r { right: 0; }
    .grave { position: absolute; bottom: calc(var(--y) + 1px); display: flex; align-items: flex-end; gap: 5px; opacity: 0.85; }
    .grave.l { left: calc(0.5rem + var(--x)); }
    .grave.r { right: calc(0.5rem + var(--x)); }
    .grave.flip { flex-direction: row-reverse; }
    .grave.flip .body { scale: -1 1; }
    .cross { rotate: var(--tilt); transform-origin: 50% 100%; }
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
  private readonly yard = inject(Graveyard);
  protected readonly ground = computed(() => ({ l: this.yard.sides().includes(-1), r: this.yard.sides().includes(1) }));
  protected readonly graves = computed(() => {
    const lying: Record<'-1' | '1', number[]> = { '-1': [], '1': [] }; // where the ones on each side lie, along it
    return this.yard.sides().flatMap((side, id) => {
      const xs = lying[side === 1 ? '1' : '-1'];
      const k = xs.length; // the how-manyeth on its side
      if (k >= 14) return []; // a heap this high is enough
      const x = ((k * 53) % 11) * 14 + (k % 2) * 3; // scattered over a strip of about 200px
      const y = xs.filter((o) => Math.abs(o - x) < 28).length * 9; // lying on those that are already there
      xs.push(x);
      return [{ id, side, x, y, tilt: k % 2 ? 9 : -13, flip: (k + (side > 0 ? 1 : 0)) % 3 === 0 }];
    });
  });
  protected readonly year = BUILD.date ? BUILD.date.slice(0, 4) : new Date().getFullYear();
  protected readonly version = BUILD.version || '1';
  protected readonly release = `${REPO}/releases/tag/v${BUILD.version}`;
  protected readonly licence = `${REPO}/blob/main/LICENSE`;
}
