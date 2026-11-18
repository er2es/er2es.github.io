import { DOCUMENT, PlatformLocation, isPlatformBrowser } from '@angular/common';
import { ApplicationRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { getContent } from '../content';
import type { Locale } from '../content/model';
import { pagePath } from './nav';
import { Seo } from './seo';

export const localeOf = (path: string): Locale => (/^\/hu(\/|$)/.test(path) ? 'hu' : 'en');

/**
 * The page language. Switching is an in-app navigation without a router: the URL is pushed, the language signal
 * changes and the page re-renders in place (no reload, the scroll position stays); the texts that changed come in
 * with a short animation of their own (`swap`), not with the browser's cross-fade, which would play before it.
 * Back and forward between the two pages switch the same way.
 */
@Injectable({ providedIn: 'root' })
export class LangSwitch {
  private readonly doc = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);
  private readonly seo = inject(Seo);
  readonly current = signal<Locale>(localeOf(inject(PlatformLocation).pathname));

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    this.doc.defaultView?.addEventListener('popstate', () => {
      const to = localeOf(this.doc.location.pathname);
      if (to !== this.current()) this.show(to);
    });
  }

  /**
   * The choice is remembered for this tab session only (the head script in index.html reads it), so a
   * Hungarian browser opening the site later is sent to /hu/ again. Old localStorage values are ignored.
   */
  go(to: Locale): void {
    try {
      sessionStorage.setItem('cv:lang', to);
    } catch { /* blocked storage: the switch still works for this navigation */ }
    if (to === this.current()) return;
    this.doc.defaultView?.history.pushState(null, '', pagePath(to));
    this.show(to);
  }

  private show(to: Locale): void {
    this.current.set(to);
    this.seo.apply(to, getContent(to));
    this.appRef.tick(); // the new language is in the page before the texts are animated
    this.settle();
  }

  private swapTimer: ReturnType<typeof setTimeout> | undefined;

  /** For a moment the page carries `swap` (see `_layout.scss`): the texts that changed come in, and the language chip turns over. */
  private settle(): void {
    const root = this.doc.documentElement;
    root.classList.remove('swap'); // off and on again, with a layout in between, so that every switch plays the animations from the start
    void root.offsetWidth;
    root.classList.add('swap');
    clearTimeout(this.swapTimer);
    this.swapTimer = setTimeout(() => root.classList.remove('swap'), 600);
  }
}
