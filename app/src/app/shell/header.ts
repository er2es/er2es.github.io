import { Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { SECTION_IDS, type Locale, type SectionId, type SiteContent } from '../content/model';
import { LangSwitch } from '../core/lang';
import { anchorHref, inPageClick, pagePath } from '../core/nav';
import { squirclePath } from '../core/squircle';
import { Theme } from '../core/theme';
import { MONOGRAM } from './monogram';
import { SectionIcon } from './section-icon';

@Component({
  selector: 'app-header',
  imports: [SectionIcon],
  template: `
    <div class="edge" aria-hidden="true"></div>
    <header class="bar glass">
      <a class="brand" [attr.href]="home()" (click)="top($event)">
        <span class="avatar-slot" aria-hidden="true"><svg class="sz" [attr.viewBox]="mono.box" focusable="false"><path [attr.d]="mono.d" /></svg></span>
        <span class="mark">{{ c().hero.name }}</span>
      </a>
      <nav class="links" [attr.aria-label]="c().ui.navLabel">
        @for (s of sections; track s) {
          <a [attr.href]="href(s)" [attr.aria-current]="active() === s ? 'location' : null" (click)="go($event, s)"><app-section-icon [id]="s" [size]="18" />{{ c().ui.sections[s] }}</a>
        }
        <span class="sel" aria-hidden="true"></span>
      </nav>
      <div class="ctl">
        <button type="button" class="chip icon" aria-keyshortcuts="Control+K Meta+K" [attr.aria-label]="c().ui.palette.open" [attr.data-tip]="c().ui.palette.open + ' (Ctrl K)'" (click)="palette.emit()">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
          </svg>
        </button>
        <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -- the arrow keys are handled for the radio buttons inside, which are focusable (a roving tabindex) -->
        <div class="theme" role="radiogroup" [attr.aria-label]="c().ui.theme.label" [class.go]="moved()" [style.--k]="theme.offSystem() ? 1 : 0" (keydown)="themeKey($event)">
          <span class="thumb" aria-hidden="true"></span>
          @for (p of positions; track p) {
            <button type="button" class="seg" role="radio" [attr.aria-checked]="theme.offSystem() === (p === 'other')" [attr.tabindex]="theme.offSystem() === (p === 'other') ? 0 : -1" [attr.aria-label]="label(p)" [attr.data-tip]="tipOf(p)" [class.tip-off]="hint() !== null" (click)="pick($event, p)">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                @if (p === 'auto') {
                  <circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
                } @else if (theme.opposite() === 'dark') {
                  <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
                } @else {
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
                }
              </svg>
            </button>
          }
        </div>
        <span class="sr-only" role="status">{{ hint() }}</span>
        @for (h of hints(); track h) {
          <span class="hint info" style="--life: 2000ms" aria-hidden="true">
            @if (theme.mode() === 'auto') { <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.2" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" /></svg> }
            {{ h }}
          </span>
        }
        <a class="chip" [attr.href]="otherHref()" [attr.lang]="other()" [attr.hreflang]="other()" (click)="switchLang($event)"><span aria-hidden="true">{{ other().toUpperCase() }}</span><span class="sr-only">{{ c().ui.otherLanguage }} ({{ other().toUpperCase() }})</span></a>
      </div>
      <svg class="read" aria-hidden="true" focusable="false"><path [attr.d]="outline()" pathLength="1" /></svg>
    </header>
  `,
  styles: [`
    .bar {
      position: fixed; z-index: 20; top: max(10px, env(safe-area-inset-top)); left: 50%; translate: -50% 0;
      width: min(100% - 2 * max(10px, env(safe-area-inset-left), env(safe-area-inset-right)), 70rem); min-height: var(--bar-h); padding: 0 5px 0 9px; corner-shape: round;
      /* round corners (not the squircles of the other surfaces) and one gap on every side (6px around a 44px control, 10px around the 36px portrait, borders included):
         then what sits at the edges is exactly concentric with the bar's corner, radius 22 - gap */
      display: flex; align-items: center; gap: 0.75rem; border-radius: 22px;
    }
    /* where the portrait lands (app-avatar-dock flies a copy of it here while the hero scrolls away) */
    .avatar-slot { flex: none; display: grid; place-items: center; overflow: hidden; width: 36px; height: 36px; border-radius: 12px; background: var(--tint-current); transition: background-color var(--dur-short) var(--ease-out); }
    /* the monogram holds the place until the portrait arrives, and is pushed out upwards by it (and drops back in when the portrait leaves) */
    .sz { width: 24px; height: auto; fill: var(--fg); transition: translate var(--dur-med) var(--ease-spring), scale var(--dur-med) var(--ease-spring), opacity var(--dur-short) var(--ease-out); }
    .avatar-slot.filled { background: transparent; }
    .avatar-slot.filled .sz { translate: 0 -140%; scale: 0.6; opacity: 0; }
    /* scroll edge: text passing above the floating bar softens into the page instead of showing sharp */
    .edge {
      position: fixed; z-index: 19; inset: 0 0 auto; height: calc(max(10px, env(safe-area-inset-top)) + var(--bar-h) * 0.6); pointer-events: none;
      background: color-mix(in srgb, var(--bg) 55%, transparent);
      -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
      -webkit-mask-image: linear-gradient(#000 35%, transparent); mask-image: linear-gradient(#000 35%, transparent);
    }
    @media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
      .edge { -webkit-backdrop-filter: none; backdrop-filter: none; background: var(--bg); }
    }
    /* the portrait and the name are one link, back to the very top of the page */
    .brand { display: flex; align-items: center; gap: 0.75rem; min-width: 0; min-height: 44px; text-decoration: none; border-radius: var(--r-ctl); }
    .mark { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-weight: 700; color: var(--fg); letter-spacing: -0.01em; white-space: nowrap; }
    .links .sel { display: none; }
    .links { display: none; margin-inline: auto; } /* no gap: the pill must not lose the pointer between two items */
    .links a { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.75rem 0.7rem; margin-inline: 0.125rem; border-radius: var(--r-ctl); color: var(--fg-2); text-decoration: none; font-size: var(--t-subhead); font-weight: 500; }
    .links a[aria-current] { color: var(--fg); background: var(--tint-current); }
    .links a { transition: color var(--dur-press) var(--ease-out), background-color var(--dur-short) var(--ease-out), scale var(--dur-press) var(--ease-out); }
    .links a:active { background: var(--tint-press); scale: 0.96; }
    /* one selection pill that glides to the current section, and follows the pointer while it is over the menu
       (anchor positioning; a static pill elsewhere) */
    @supports (anchor-name: --a) {
      .links { position: relative; isolation: isolate; }
      .links a[aria-current] { anchor-name: --nav-target; background: none; }
      .links .sel {
        display: block; position: absolute; z-index: -1; position-anchor: --nav-target; pointer-events: none;
        top: anchor(top); bottom: anchor(bottom); left: anchor(left); right: anchor(right); border-radius: var(--r-ctl);
        background: var(--tint-current);
        /* quick enough to keep up with the pointer; the short delay (only on the way back to the current item) keeps the
           pill from jumping away while the pointer crosses the edge of the menu */
        transition: left var(--dur-short) var(--ease-spring) 90ms, right var(--dur-short) var(--ease-spring) 90ms,
          background-color var(--dur-short) var(--ease-out), scale var(--dur-press) var(--ease-out);
      }
      @media (hover: hover) {
        .links:has(a:hover) a[aria-current]:not(:hover) { anchor-name: none; }
        .links a:hover { anchor-name: --nav-target; }
        .links:has(a:hover) .sel { transition-delay: 0s; }
        .links:has(a:not([aria-current]):hover) .sel { background: var(--tint-hover); }
      }
      /* a press is shown on the pill, which shrinks with the label */
      .links.links:has(a:active) .sel { background: var(--tint-press); scale: 0.96; transition-delay: 0s; }
    }
    @media (max-width: 1099px) { .links app-section-icon { display: none; } } /* the bar has no room for them between 900 and 1100 px */
    .links a app-section-icon { transition: translate var(--dur-short) var(--ease-spring), color var(--dur-short) var(--ease-out); }
    .links a[aria-current] app-section-icon { color: var(--accent); }
    @media (hover: hover) and (prefers-reduced-motion: no-preference) { .links a:hover app-section-icon { translate: 0 -2px; } }
    @media (hover: hover) { .links a:hover { color: var(--fg); } }
    /* with the pill, an item has no background of its own (it would show as a second shape under the pill) */
    @supports not (anchor-name: --a) { @media (hover: hover) { .links a:not([aria-current]):hover { background: var(--tint-hover); } } }
    @media (prefers-reduced-motion: reduce) { .links a:active { scale: none; } .links.links:has(a:active) .sel { scale: none; } }
    .ctl { position: relative; display: flex; align-items: center; margin-left: auto; }
    /* a click on the theme button is answered under it, in words: above all for Auto, which follows the system */
    .hint {
      position: absolute; z-index: 40; top: calc(100% + 14px); right: 0; width: max-content; max-width: min(16rem, 80vw); padding: 0.4rem 0.7rem; border-radius: var(--r-pop);
      display: inline-flex; align-items: center; gap: 0.4rem; background: var(--bg-2); color: var(--fg); border: 1px solid var(--line); box-shadow: var(--glass-shadow);
      font: 500 var(--t-footnote) / 1.3 var(--font); pointer-events: none;
    }
    .hint svg { flex: none; color: var(--accent); }
    @keyframes hint-in { from { opacity: 0; translate: 0 -4px; } }
    @media (prefers-reduced-motion: no-preference) { .hint { animation: hint-in var(--dur-press) var(--ease-out) both; } }
    .tip-off::after { display: none; } /* the bubble says it already */
    /* the theme as three positions (Light, Auto, Dark) with one thumb that glides between them */
    .theme { position: relative; display: inline-flex; align-items: center; height: 36px; padding: 0 2px; margin-inline: 2px; border-radius: var(--r-ctl); background: var(--tint-hover); }
    .thumb {
      position: absolute; left: 2px; top: 2px; width: 34px; height: 32px; border-radius: 14px; pointer-events: none;
      background: color-mix(in srgb, var(--fg) 16%, transparent); translate: calc(var(--k, 0) * 34px) 0;
    }
    .go .thumb { transition: translate var(--dur-med) var(--ease-spring); }
    .seg { position: relative; z-index: 1; display: grid; place-items: center; width: 34px; height: 44px; margin-block: -4px; padding: 0; border: 0; border-radius: 14px; background: none; color: var(--fg-2); cursor: pointer; transition: color var(--dur-press) var(--ease-out); }
    .seg[aria-checked='true'] { color: var(--fg); }
    @media (hover: hover) { .seg:hover { color: var(--fg); } }
    /* the controls at the bar's edges take the bar's corner, less the gap they keep from it (22px - 6px), instead of a full pill */
    .chip { border-radius: var(--r-ctl); }
    .chip.icon { width: 44px; padding: 0; justify-content: center; }
    @media (min-width: 900px) { .links { display: flex; } .ctl { margin-left: 0; } }

    /* large title -> inline title: the wordmark appears once the hero heading has scrolled away */
    @media (prefers-reduced-motion: no-preference) {
      @supports (animation-timeline: scroll()) {
        .mark { animation: dock linear both; animation-timeline: scroll(root); animation-range: 170px 340px; }
      }
    }
    /* reading progress: a line that starts at the bottom-left corner and runs once around the bar as the page scrolls
       (the offset is eased in script, so a fast flick still draws it smoothly); it blooms softly as the ring closes */
    .read { position: absolute; inset: -1px; width: calc(100% + 2px); height: calc(100% + 2px); overflow: visible; pointer-events: none; }
    .read path { fill: none; stroke: var(--accent); stroke-width: 2; stroke-dasharray: 1 2; stroke-dashoffset: 1; }
    @keyframes dock { from { opacity: 0; translate: 0 6px; } to { opacity: 1; translate: 0 0; } }
  `],
})
export class Header {
  readonly c = input.required<SiteContent>();
  readonly locale = input.required<Locale>();
  readonly active = input<SectionId>('profile');
  readonly palette = output<void>();

  protected readonly mono = MONOGRAM;
  protected readonly theme = inject(Theme);
  /** The progress line follows the bar's own outline (squircle corners included), whatever width the bar has. */
  protected readonly outline = signal('');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const destroy = inject(DestroyRef);
    // every change of the theme after the first render is answered in words for a moment
    let first = true;
    effect(() => {
      const mode = this.theme.mode();
      if (first) {
        first = false;
        return;
      }
      untracked(() => {
        this.hint.set(mode === 'auto' ? this.autoNote() : this.themeLabel());
        clearTimeout(this.hintTimer);
        this.hintTimer = setTimeout(() => this.hint.set(null), 2000); // long enough to read; the line along the bubble's edge counts it down (--life)
      });
    });
    destroy.onDestroy(() => clearTimeout(this.hintTimer));
    afterNextRender(() => {
      const bar = this.host.nativeElement.querySelector<HTMLElement>('.bar');
      if (!bar) return;
      const fit = (): void => this.outline.set(squirclePath(bar.offsetWidth, bar.offsetHeight, 22, 2));
      new ResizeObserver(fit).observe(bar); // its first callback measures, after the first layout

      // reading progress, eased towards the real scroll position (frame-rate independent, instant under reduced motion)
      const svg = bar.querySelector<SVGSVGElement>('.read');
      const line = bar.querySelector<SVGPathElement>('.read path');
      if (!svg || !line) return;
      const still = matchMedia('(prefers-reduced-motion: reduce)');
      let shown = 0;
      let last = 0;
      let raf = 0;
      const frame = (now: number): void => {
        raf = 0;
        const room = scrollY > 0 ? document.documentElement.scrollHeight - innerHeight : 0; // at the top there is nothing to measure
        const target = room > 0 ? Math.min(1, Math.max(0, scrollY / room)) : 0;
        const dt = Math.min(64, now - last || 16);
        last = now;
        shown = still.matches ? target : shown + (target - shown) * (1 - Math.exp(-dt / 110));
        if (Math.abs(target - shown) < 0.0004) shown = target;
        line.style.strokeDashoffset = String(1 - shown);
        const bloom = Math.min(1, Math.max(0, (shown - 0.97) / 0.03)); // 0 until the last 3 %, 1 when the ring is closed
        svg.style.filter = bloom > 0 && !still.matches ? `drop-shadow(0 0 ${(6 * bloom).toFixed(1)}px var(--accent))` : '';
        if (shown !== target) raf = requestAnimationFrame(frame);
      };
      const kick = (): void => {
        if (!raf) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      };
      addEventListener('scroll', kick, { passive: true });
      addEventListener('resize', kick);
      if (scrollY > 0) kick(); // at the top there is nothing to draw yet
      destroy.onDestroy(() => {
        removeEventListener('scroll', kick);
        removeEventListener('resize', kick);
        cancelAnimationFrame(raf);
      });
    });
  }
  private readonly lang = inject(LangSwitch);
  protected readonly sections = SECTION_IDS;
  protected readonly other = computed<Locale>(() => (this.locale() === 'en' ? 'hu' : 'en'));
  protected readonly otherHref = computed(() => pagePath(this.other()));
  protected readonly home = computed(() => pagePath(this.locale()));
  protected readonly themeLabel = computed(() => `${this.c().ui.theme.label}: ${this.c().ui.theme[this.theme.mode()]}`);

  /** The two positions: Auto (what the system prefers, nothing kept) and its opposite (a choice that is kept; see `Theme.choose`). */
  protected readonly positions = ['auto', 'other'] as const;
  /** Set at the first change by hand: the thumb glides only then, never on its way to the first position at load. */
  protected readonly moved = signal(false);

  protected label(p: 'auto' | 'other'): string {
    return this.c().ui.theme[p === 'auto' ? 'auto' : this.theme.opposite()];
  }

  /** A position's tooltip: for Auto, what Auto means and what the system is using right now. */
  protected tipOf(p: 'auto' | 'other'): string {
    return p === 'auto' ? this.autoNote() : `${this.c().ui.theme.label}: ${this.label(p)}`;
  }

  protected pick(e: Event, p: 'auto' | 'other', from = e.currentTarget as Element): void {
    if ((p === 'other') === this.theme.offSystem()) return;
    this.moved.set(true);
    this.theme.choose(p, from);
  }

  /** Arrow keys move between the two positions (a radio group: only the chosen one is in the tab order). */
  protected themeKey(e: KeyboardEvent): void {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const to = (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('.seg')[step > 0 ? 1 : 0];
    this.pick(e, step > 0 ? 'other' : 'auto', to);
    to.focus();
  }

  /** The answer shown under the theme button for a moment after a click. */
  protected readonly hint = signal<string | null>(null);
  /** The bubble as a list of one, so every new answer is a new element and its countdown starts over. */
  protected readonly hints = computed(() => { const h = this.hint(); return h ? [h] : []; });
  private hintTimer: ReturnType<typeof setTimeout> | undefined;

  private autoNote(): string {
    const ui = this.c().ui.theme;
    const dark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
    return ui.autoNote.replace('{now}', (dark ? ui.dark : ui.light).toLowerCase());
  }

  protected href(s: SectionId): string {
    return anchorHref(this.locale(), s);
  }

  /** The portrait and name always go to the top of the page, not to the top of a section. */
  protected top(e: Event): void {
    if (e instanceof MouseEvent && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) return;
    e.preventDefault();
    scrollTo({ top: 0 }); // smooth from the CSS, instant under reduced motion; the hash goes away at the top (core/hash.ts)
    document.getElementById('main')?.focus({ preventScroll: true });
  }

  protected go(e: Event, id: SectionId): void {
    inPageClick(e, id);
  }

  protected switchLang(e: Event): void {
    if (e instanceof MouseEvent && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)) return;
    e.preventDefault();
    this.lang.go(this.other());
  }
}
