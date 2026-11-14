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
        <a [attr.href]="licence" target="_blank" rel="noopener noreferrer">{{ x().source }}: MIT<span class="sr-only"> {{ x().newTab }}</span></a>
      </div>
      <div class="yard" aria-hidden="true"><div class="wrap lot">
        @if (ground().l) { <i class="ground l"></i> }
        @if (ground().r) { <i class="ground r"></i> }
        @for (g of graves(); track g.id) {
          <span class="grave" [class.l]="g.side < 0" [class.r]="g.side > 0" [style.--x.px]="g.x" [style.--tilt.deg]="g.tilt" [style.--d.ms]="g.delay">
            <i class="mire"><i class="hand"></i><i class="b1"></i><i class="b2"></i><i class="b3"></i></i>
            <svg class="cross" viewBox="0 0 10 16" width="10" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" focusable="false"><path d="M5 1v14M1.500 5h7" /></svg>
          </span>
        }
      </div></div>
    </footer>
  `,
  styles: [`
    .foot { position: relative; padding-block: 1.5rem 2.75rem; font-size: var(--t-footnote); color: var(--fg-2); }
    /* those who fell off the tiles are gone: a small cross, leaning, over a patch of swamp that has closed over them */
    .yard { position: absolute; inset-inline: 0; bottom: 6px; height: 40px; pointer-events: none; overflow: hidden; }
    .lot { position: relative; height: 100%; } /* the same column as the text above: the two patches lie at its two edges */
    /* a hairline of ground along the patch, fading out at the ends */
    .ground { position: absolute; bottom: 0; width: 230px; height: 1px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--fg-2) 60%, transparent) 16% 84%, transparent); }
    .ground.l { left: 0; }
    .ground.r { right: 0; }
    .grave { position: absolute; bottom: 1px; width: 44px; height: 30px; display: flex; align-items: flex-end; justify-content: center; opacity: 0.9; }
    .grave.l { left: calc(0.5rem + var(--x)); }
    .grave.r { right: calc(0.5rem + var(--x)); }
    /* the swamp: a dark, slightly green pool at the foot of the cross, with a ripple and three bubbles */
    .mire { position: absolute; left: 0; right: 0; bottom: -3px; height: 9px; border-radius: 50%; background: radial-gradient(ellipse at 50% 40%, color-mix(in srgb, var(--accent) 22%, #000) 0, color-mix(in srgb, var(--accent) 10%, transparent) 65%, transparent 72%); }
    .mire::after { content: ''; position: absolute; inset: 0; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent); opacity: 0; }
    .mire i { position: absolute; display: block; }
    .hand { left: 50%; bottom: 3px; width: 2px; height: 9px; margin-left: -4px; border-radius: 1px; background: currentColor; opacity: 0; }
    .b1, .b2, .b3 { bottom: 4px; width: 3px; height: 3px; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent); opacity: 0; }
    .b1 { left: 30%; } .b2 { left: 55%; } .b3 { left: 72%; }
    .cross { position: relative; margin-bottom: 4px; rotate: var(--tilt); transform-origin: 50% 100%; }
    /* the moment it closes over: a hand goes under, the water rings once, bubbles rise (then it is still) */
    @media (prefers-reduced-motion: no-preference) {
      .hand { animation: sink 1.5s var(--d, 0ms) ease-in both; }
      .mire::after { animation: ring 1.6s calc(var(--d, 0ms) + 1.1s) ease-out both; }
      .b1 { animation: bubble 1.8s calc(var(--d, 0ms) + 1.3s) ease-out both; }
      .b2 { animation: bubble 1.8s calc(var(--d, 0ms) + 1.6s) ease-out both; }
      .b3 { animation: bubble 1.8s calc(var(--d, 0ms) + 1.9s) ease-out both; }
      .cross { animation: rise 1.2s calc(var(--d, 0ms) + 2.2s) var(--ease-out) both; }
    }
    @keyframes sink { 0% { opacity: 1; translate: 0 -8px; } 55% { opacity: 1; translate: 0 2px; } 100% { opacity: 0; translate: 0 6px; } }
    @keyframes ring { 0% { opacity: 0.8; scale: 0.3 0.3; } 100% { opacity: 0; scale: 1.5 1.5; } }
    @keyframes bubble { 0% { opacity: 0; translate: 0 2px; } 25% { opacity: 1; } 100% { opacity: 0; translate: 0 -10px; } }
    @keyframes rise { 0% { opacity: 0; translate: 0 6px; } 100% { opacity: 1; translate: 0 0; } }
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
    const placed: Record<'-1' | '1', number> = { '-1': 0, '1': 0 }; // how many are on each side already
    return this.yard.sides().flatMap((side, id) => {
      const k = placed[side === 1 ? '1' : '-1']++; // the how-manyeth on its side
      if (k >= 14) return []; // enough of them
      // spread over a strip of about 200px; a newcomer's sinking is not delayed
      return [{ id, side, x: ((k * 53) % 11) * 17, tilt: k % 2 ? 9 : -13, delay: 0 }];
    });
  });
  protected readonly year = BUILD.date ? BUILD.date.slice(0, 4) : new Date().getFullYear();
  protected readonly version = BUILD.version || '1';
  protected readonly release = `${REPO}/releases/tag/v${BUILD.version}`;
  protected readonly licence = `${REPO}/blob/main/LICENSE`;
}
