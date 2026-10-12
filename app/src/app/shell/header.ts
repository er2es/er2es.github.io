import { Component, afterNextRender, computed, inject, input, output, signal } from '@angular/core';
import { SECTION_IDS, type Locale, type SectionId, type SiteContent } from '../content/model';
import { LangSwitch } from '../core/lang';
import { anchorHref, inPageClick, pagePath } from '../core/nav';
import { Theme } from '../core/theme';

@Component({
  selector: 'app-header',
  template: `
    <header class="bar glass">
      <a class="mark" [attr.href]="home()" (click)="go($event, 'profile')">{{ c().hero.name }}</a>
      <nav class="links" [attr.aria-label]="c().ui.navLabel">
        @for (s of sections; track s) {
          <a [attr.href]="href(s)" [attr.aria-current]="active() === s ? 'location' : null" (click)="go($event, s)">{{ c().ui.sections[s] }}</a>
        }
      </nav>
      <div class="ctl">
        <button type="button" class="chip" aria-keyshortcuts="Control+K Meta+K" (click)="palette.emit()">
          {{ c().ui.palette.short }} <kbd aria-hidden="true">{{ mac() ? '⌘K' : 'Ctrl K' }}</kbd>
        </button>
        <button type="button" class="chip" (click)="theme.cycle()">{{ c().ui.theme.label }}: {{ themeLabel() }}</button>
        <a class="chip" [attr.href]="otherHref()" [attr.lang]="other()" [attr.hreflang]="other()" (click)="switchLang($event)">{{ c().ui.otherLanguage }}</a>
      </div>
    </header>
  `,
  styles: [`
    .bar {
      position: fixed; z-index: 20; top: max(10px, env(safe-area-inset-top)); left: 50%; translate: -50% 0;
      width: min(100% - 20px, 70rem); min-height: var(--bar-h); padding: 0 0.5rem 0 1.25rem;
      display: flex; align-items: center; gap: 1rem; border-radius: 22px;
    }
    .mark { font-weight: 700; color: var(--fg); text-decoration: none; letter-spacing: -0.01em; white-space: nowrap; }
    .links { display: none; gap: 0.25rem; margin-inline: auto; }
    .links a { padding: 0.75rem 0.75rem; border-radius: 999px; color: var(--fg-2); text-decoration: none; font-size: var(--t-subhead); font-weight: 500; }
    .links a[aria-current] { color: var(--fg); background: color-mix(in srgb, var(--fg) 8%, transparent); }
    .ctl { display: flex; margin-left: auto; }
    @media (min-width: 900px) { .links { display: flex; } .ctl { margin-left: 0; } }
    @media (max-width: 520px) { .ctl .chip:nth-child(2) { display: none; } }
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
  protected readonly mac = signal(false);
  protected readonly other = computed<Locale>(() => (this.locale() === 'en' ? 'hu' : 'en'));
  protected readonly otherHref = computed(() => pagePath(this.other()));
  protected readonly home = computed(() => pagePath(this.locale()));
  protected readonly themeLabel = computed(() => this.c().ui.theme[this.theme.mode()]);

  constructor() {
    afterNextRender(() => this.mac.set(/Mac|iPhone|iPad/.test(navigator.userAgent)));
  }

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
