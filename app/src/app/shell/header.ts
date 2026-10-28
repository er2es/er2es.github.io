import { Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { SECTION_IDS, type Locale, type SectionId, type SiteContent } from '../content/model';
import { LangSwitch } from '../core/lang';
import { anchorHref, inPageClick, pagePath } from '../core/nav';
import { squirclePath } from '../core/squircle';
import { Theme } from '../core/theme';

@Component({
  selector: 'app-header',
  template: `
    <div class="edge" aria-hidden="true"></div>
    <header class="bar glass">
      <a class="brand" [attr.href]="home()" (click)="top($event)">
        <span class="avatar-slot" aria-hidden="true"></span>
        <span class="mark">{{ c().hero.name }}</span>
      </a>
      <nav class="links" [attr.aria-label]="c().ui.navLabel">
        @for (s of sections; track s) {
          <a [attr.href]="href(s)" [attr.aria-current]="active() === s ? 'location' : null" (click)="go($event, s)">{{ c().ui.sections[s] }}</a>
        }
      </nav>
      <div class="ctl">
        <button type="button" class="chip icon" aria-keyshortcuts="Control+K Meta+K" [attr.aria-label]="c().ui.palette.open" [attr.data-tip]="c().ui.palette.open + ' (Ctrl K)'" (click)="palette.emit()">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
          </svg>
        </button>
        <button type="button" class="chip icon" [attr.aria-label]="themeLabel()" [attr.data-tip]="themeTip()" [class.tip-off]="hint() !== null" (click)="theme.cycle($any($event.currentTarget))">
          @for (m of [theme.mode()]; track m) {
          <svg class="mode" [class.auto]="m === 'auto'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            @switch (m) {
              @case ('light') {
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
              }
              @case ('dark') {
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
              }
              @default {
                <circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
              }
            }
          </svg>
          }
        </button>
        @if (hint(); as h) {
          <span class="hint" role="status">
            @if (theme.mode() === 'auto') { <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.2" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" /></svg> }
            {{ h }}
          </span>
        }
        <a class="chip" [attr.href]="otherHref()" [attr.lang]="other()" [attr.hreflang]="other()" (click)="switchLang($event)">{{ c().ui.otherLanguage }}</a>
      </div>
      <svg class="read" aria-hidden="true" focusable="false"><path [attr.d]="outline()" pathLength="1" /></svg>
    </header>
  `,
  styles: [`
    .bar {
      position: fixed; z-index: 20; top: max(10px, env(safe-area-inset-top)); left: 50%; translate: -50% 0;
      width: min(100% - 20px, 70rem); min-height: var(--bar-h); padding: 0 0.5rem 0 1.25rem;
      display: flex; align-items: center; gap: 0.75rem; border-radius: 22px;
    }
    /* where the portrait lands (app-avatar-dock flies a copy of it here while the hero scrolls away) */
    .avatar-slot { flex: none; width: 36px; height: 36px; border-radius: 50%; margin-left: -0.5rem; }
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
    .brand { display: flex; align-items: center; gap: 0.75rem; min-width: 0; text-decoration: none; border-radius: 14px; }
    .mark { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-weight: 700; color: var(--fg); letter-spacing: -0.01em; white-space: nowrap; }
    .links { display: none; gap: 0.25rem; margin-inline: auto; }
    .links a { padding: 0.75rem 0.75rem; border-radius: 999px; color: var(--fg-2); text-decoration: none; font-size: var(--t-subhead); font-weight: 500; }
    .links a[aria-current] { color: var(--fg); background: var(--tint-current); }
    .links a { transition: color var(--dur-short) var(--ease-out), background-color var(--dur-short) var(--ease-out), scale var(--dur-press) var(--ease-out); }
    .links a:active { background: var(--tint-press); scale: 0.96; }
    /* one selection pill that glides to the current section (anchor positioning; a static pill elsewhere) */
    @supports (anchor-name: --a) {
      .links { position: relative; isolation: isolate; }
      .links a[aria-current] { anchor-name: --nav-current; background: none; }
      .links::after {
        content: ''; position: absolute; z-index: -1; position-anchor: --nav-current; pointer-events: none;
        top: anchor(top); bottom: anchor(bottom); left: anchor(left); right: anchor(right); border-radius: 999px;
        background: var(--tint-current);
        transition: left var(--dur-med) var(--ease-spring), right var(--dur-med) var(--ease-spring);
      }
    }
    @media (hover: hover) { .links a:hover { color: var(--fg); } .links a:not([aria-current]):hover { background: var(--tint-hover); } }
    @media (prefers-reduced-motion: reduce) { .links a:active { scale: none; } }
    .ctl { position: relative; display: flex; align-items: center; margin-left: auto; }
    /* a click on the theme button is answered under it, in words: above all for Auto, which follows the system */
    .hint {
      position: absolute; z-index: 40; top: calc(100% + 14px); right: 0; width: max-content; max-width: min(16rem, 80vw); padding: 0.4rem 0.7rem; border-radius: 10px;
      display: inline-flex; align-items: center; gap: 0.4rem; background: var(--bg-2); color: var(--fg); border: 1px solid var(--line); box-shadow: var(--glass-shadow);
      font: 500 var(--t-footnote) / 1.3 var(--font); pointer-events: none; animation: hint-in 180ms var(--ease-out) both;
    }
    .hint svg { flex: none; color: var(--accent); }
    @keyframes hint-in { from { opacity: 0; translate: 0 -4px; } }
    .tip-off::after { display: none; } /* the bubble says it already */
    @media (prefers-reduced-motion: no-preference) {
      /*
       * The icon turns into its new state (the element is new for every mode, so this plays on each click). The cycle is
       * Auto, Light, Dark and back: Light and Dark spin in one way and grow into place, and arriving back at Auto
       * is the opposite: a half turn the other way, shrinking in from large, like winding the dial back.
       */
      .mode { animation: mode-in 360ms var(--ease-out) both; }
      .mode.auto { animation: mode-back 480ms var(--ease-out) both; }
      @keyframes mode-in { from { rotate: -90deg; scale: 0.6; opacity: 0.2; } }
      @keyframes mode-back { from { rotate: 180deg; scale: 1.5; opacity: 0.2; } }
    }
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
        this.hintTimer = setTimeout(() => this.hint.set(null), 2600);
      });
    });
    destroy.onDestroy(() => clearTimeout(this.hintTimer));
    afterNextRender(() => {
      const bar = this.host.nativeElement.querySelector<HTMLElement>('.bar');
      if (!bar) return;
      const fit = (): void => this.outline.set(squirclePath(bar.offsetWidth, bar.offsetHeight, 22));
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

  /** What the theme button's tooltip says: for Auto, what Auto means and what the system is using right now. */
  protected readonly themeTip = computed(() => (this.theme.mode() === 'auto' ? this.autoNote() : this.themeLabel()));
  /** The answer shown under the theme button for a moment after a click. */
  protected readonly hint = signal<string | null>(null);
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
