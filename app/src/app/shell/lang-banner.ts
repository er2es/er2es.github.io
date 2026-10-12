import { Component, afterNextRender, inject, input, signal } from '@angular/core';
import type { Locale } from '../content/model';
import { LangSwitch } from '../core/lang';
import { shouldOfferHungarian } from '../core/lang-detect';
import { store } from '../core/storage';

const TEXT = { text: 'Magyarul olvasnád?', link: 'Magyar nyelven', dismiss: 'Bezár', label: 'Nyelv' };

@Component({
  selector: 'app-lang-banner',
  template: `
    @if (visible()) {
      <aside class="banner glass" lang="hu" role="region" [attr.aria-label]="t.label">
        <p>{{ t.text }}</p>
        <a class="chip" hreflang="hu" href="/hu/" (click)="accept($event)">{{ t.link }}</a>
        <button type="button" class="chip" (click)="dismiss()">{{ t.dismiss }}</button>
      </aside>
    }
  `,
  styles: [`
    .banner {
      position: fixed; z-index: 30; left: 50%; translate: -50% 0; width: min(100% - 20px, 30rem);
      bottom: calc(var(--tabbar-h) + 24px + env(safe-area-inset-bottom));
      display: flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem 0.25rem 1.25rem; border-radius: 22px;
    }
    p { margin-right: auto; font-weight: 500; }
    a.chip { color: var(--accent); font-weight: 600; }
    @media (min-width: 900px) { .banner { bottom: 20px; } }
  `],
})
export class LangBanner {
  readonly locale = input.required<Locale>();
  protected readonly t = TEXT;
  protected readonly visible = signal(false);
  private readonly lang = inject(LangSwitch);

  constructor() {
    afterNextRender(() => {
      const show = () =>
        this.visible.set(
          shouldOfferHungarian({
            locale: this.locale(),
            languages: navigator.languages,
            chosen: store.get('lang'),
            dismissed: store.get('banner'),
          }),
        );
      if ('requestIdleCallback' in window) requestIdleCallback(show);
      else setTimeout(show, 1500);
    });
  }

  protected accept(e: Event): void {
    if (e instanceof MouseEvent && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)) return;
    e.preventDefault();
    this.visible.set(false);
    this.lang.go('hu');
  }

  protected dismiss(): void {
    store.set('banner', '1');
    this.visible.set(false);
  }
}
