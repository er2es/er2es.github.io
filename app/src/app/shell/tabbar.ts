import { Component, DestroyRef, ElementRef, afterNextRender, effect, inject, input, viewChild } from '@angular/core';
import { SECTION_IDS, type Locale, type SectionId, type SiteContent } from '../content/model';
import { anchorHref, inPageClick } from '../core/nav';

/** Largest label size first; the bar picks the biggest one at which every label fits (never below 12px). */
const LABEL_SIZES = [13, 12] as const;

@Component({
  selector: 'app-tabbar',
  template: `
    <nav #nav class="tabs glass" [attr.aria-label]="c().ui.tabsLabel">
      @for (s of tabs; track s) {
        <a [attr.href]="href(s)" [attr.aria-current]="active() === s ? 'location' : null" (click)="go($event, s)">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            @switch (s) {
              @case ('profile') { <circle cx="12" cy="8" r="3.6" /><path d="M5 20c1-4 4-5.6 7-5.6s6 1.6 7 5.6" /> }
              @case ('experience') { <rect x="3" y="7" width="18" height="12" rx="2.5" /><path d="M9 7V5.5h6V7M3 12.5h18" /> }
              @case ('skills') { <path d="M4 7h9M19 7h1M4 17h1M11 17h9" /><circle cx="16" cy="7" r="2.2" /><circle cx="8" cy="17" r="2.2" /> }
              @case ('projects') { <path d="M3.5 7.5V17a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V9.5a2 2 0 0 0-2-2H12L10 5.5H5.5a2 2 0 0 0-2 2z" /> }
              @case ('about') { <circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><circle cx="12" cy="8" r="0.7" fill="currentColor" stroke="none" /> }
              @case ('contact') { <rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M4 8l8 5.5L20 8" /> }
            }
          </svg>
          <span class="lbl">{{ c().ui.sections[s] }}</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    .tabs {
      position: fixed; z-index: 20; left: 50%; translate: -50% 0; bottom: max(10px, env(safe-area-inset-bottom));
      width: min(100% - 20px, 34rem); min-height: var(--tabbar-h); padding: 6px; border-radius: 26px;
      display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 2px;
    }
    a {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-width: 0; min-height: 52px; padding: 4px 2px;
      border-radius: 20px; color: var(--fg-2); text-decoration: none; font-size: var(--tab-fs, 12px); font-weight: 600; line-height: 1.1; text-align: center;
    }
    .lbl { display: block; max-width: 100%; overflow: hidden; white-space: nowrap; }
    /* labels that cannot fit at a readable size give way to the icons (still announced to screen readers) */
    .compact .lbl { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    a[aria-current] { color: var(--fg); background: var(--tint-current); }
    a { transition: color var(--dur-short) var(--ease-out), background-color var(--dur-short) var(--ease-out), scale var(--dur-press) var(--ease-out); }
    @media (hover: hover) { a:not([aria-current]):hover { color: var(--fg); background: var(--tint-hover); } }
    a:active { background: var(--tint-press); scale: 0.95; }
    @media (prefers-reduced-motion: reduce) { a:active { scale: none; } }
    /* the selection glides between tabs (anchor positioning; a static highlight elsewhere) */
    @supports (anchor-name: --a) {
      .tabs { isolation: isolate; }
      a[aria-current] { anchor-name: --tab-current; background: none; }
      .tabs::after {
        content: ''; position: absolute; z-index: -1; position-anchor: --tab-current; pointer-events: none; opacity: 1;
        top: anchor(top); bottom: anchor(bottom); left: anchor(left); right: anchor(right); border-radius: 20px;
        background: var(--tint-current);
        transition: left var(--dur-med) var(--ease-spring), right var(--dur-med) var(--ease-spring);
      }
      .tabs:not(:has(a[aria-current]))::after { display: none; }
    }
    @media (min-width: 900px) { .tabs { display: none; } }
  `],
})
export class TabBar {
  readonly c = input.required<SiteContent>();
  readonly locale = input.required<Locale>();
  readonly active = input<SectionId>('profile');
  protected readonly tabs = SECTION_IDS;
  private readonly nav = viewChild.required<ElementRef<HTMLElement>>('nav');
  private ready = false;

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      this.ready = true;
      // the observer's first callback measures once the bar has its first layout: no forced reflow here
      const ro = new ResizeObserver(() => this.fit());
      ro.observe(this.nav().nativeElement);
      destroy.onDestroy(() => ro.disconnect());
    });
    // another language means other label lengths: measure again after the new labels are in the DOM
    effect(() => {
      this.c();
      if (this.ready) requestAnimationFrame(() => this.fit());
    });
  }

  /** The width and language the labels were last fitted for: the same inputs give the same answer, so nothing is measured again. */
  private fitted = '';

  /** Picks the largest label size at which every label fits; if none does, the bar shows icons only. */
  private fit(): void {
    if (matchMedia('(min-width: 900px)').matches) return; // the bar is not shown on wide screens
    const nav = this.nav().nativeElement;
    const key = `${nav.clientWidth}|${this.c().lang}`;
    if (key === this.fitted) return;
    const labels = Array.from(nav.querySelectorAll<HTMLElement>('.lbl'));
    const fits = (): boolean => labels.every((l) => l.scrollWidth <= l.clientWidth);
    this.fitted = key;
    // the usual case: it already fits at the largest size, so nothing is written
    const now = nav.style.getPropertyValue('--tab-fs');
    if (!nav.classList.contains('compact') && (now === '' || now === `${LABEL_SIZES[0]}px`) && fits()) return;
    nav.classList.remove('compact');
    for (const size of LABEL_SIZES) {
      nav.style.setProperty('--tab-fs', `${size}px`);
      if (fits()) return;
    }
    nav.style.removeProperty('--tab-fs');
    nav.classList.add('compact');
  }

  protected href(s: SectionId): string {
    return anchorHref(this.locale(), s);
  }

  protected go(e: Event, id: SectionId): void {
    inPageClick(e, id);
  }
}
