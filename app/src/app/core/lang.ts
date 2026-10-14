import { DOCUMENT, PlatformLocation, isPlatformBrowser } from '@angular/common';
import { ApplicationRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { getContent } from '../content';
import type { Locale } from '../content/model';
import { pagePath } from './nav';
import { Seo } from './seo';

export const localeOf = (path: string): Locale => (/^\/hu(\/|$)/.test(path) ? 'hu' : 'en');

/**
 * The page language. Switching is an in-app navigation without a router: the URL is pushed, the language signal
 * changes and the page re-renders in place inside a view transition (no reload, the scroll position stays).
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
    const apply = (): void => {
      this.current.set(to);
      this.seo.apply(to, getContent(to));
      this.appRef.tick(); // the new language is rendered before the view transition takes its "after" snapshot
    };
    const start = (this.doc as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition;
    if (start) start.call(this.doc, apply);
    else apply();
  }
}
