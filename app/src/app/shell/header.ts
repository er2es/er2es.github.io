import { Component, computed, inject, input, output } from '@angular/core';
import { SECTION_IDS, type Locale, type SectionId, type SiteContent } from '../content/model';
import { LangSwitch } from '../core/lang';
import { anchorHref, inPageClick, pagePath } from '../core/nav';
import { Theme } from '../core/theme';

@Component({
  selector: 'app-header',
  template: `
    <div class="edge" aria-hidden="true"></div>
    <header class="bar glass">
      <span class="avatar-slot" aria-hidden="true"></span>
      <a class="mark" [attr.href]="home()" (click)="go($event, 'profile')">{{ c().hero.name }}</a>
      <nav class="links" [attr.aria-label]="c().ui.navLabel">
        @for (s of sections; track s) {
          <a [attr.href]="href(s)" [attr.aria-current]="active() === s ? 'location' : null" (click)="go($event, s)">{{ c().ui.sections[s] }}</a>
        }
      </nav>
      <div class="ctl">
        <button type="button" class="chip icon" aria-keyshortcuts="Control+K Meta+K" [attr.aria-label]="c().ui.palette.open" (click)="palette.emit()">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
          </svg>
        </button>
        <button type="button" class="chip icon" [attr.aria-label]="themeLabel()" (click)="theme.cycle($any($event.currentTarget))">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            @switch (theme.mode()) {
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
        </button>
        <a class="chip" [attr.href]="otherHref()" [attr.lang]="other()" [attr.hreflang]="other()" (click)="switchLang($event)">{{ c().ui.otherLanguage }}</a>
      </div>
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
    .mark { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-weight: 700; color: var(--fg); text-decoration: none; letter-spacing: -0.01em; white-space: nowrap; }
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
    .ctl { display: flex; align-items: center; margin-left: auto; }
    .chip.icon { width: 44px; padding: 0; justify-content: center; }
    @media (min-width: 900px) { .links { display: flex; } .ctl { margin-left: 0; } }

    /* large title -> inline title: the wordmark appears once the hero heading has scrolled away */
    @media (prefers-reduced-motion: no-preference) {
      @supports (animation-timeline: scroll()) {
        .mark { animation: dock linear both; animation-timeline: scroll(root); animation-range: 170px 340px; }
      }
    }
    @keyframes dock { from { opacity: 0; translate: 0 6px; } to { opacity: 1; translate: 0 0; } }
  `],
})
export class Header {
  readonly c = input.required<SiteContent>();
  readonly locale = input.required<Locale>();
  readonly active = input<SectionId>('profile');
  readonly palette = output<void>();

  protected readonly theme = inject(Theme);
  private readonly lang = inject(LangSwitch);
  protected readonly sections = SECTION_IDS;
  protected readonly other = computed<Locale>(() => (this.locale() === 'en' ? 'hu' : 'en'));
  protected readonly otherHref = computed(() => pagePath(this.other()));
  protected readonly home = computed(() => pagePath(this.locale()));
  protected readonly themeLabel = computed(() => `${this.c().ui.theme.label}: ${this.c().ui.theme[this.theme.mode()]}`);

  protected href(s: SectionId): string {
    return anchorHref(this.locale(), s);
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
