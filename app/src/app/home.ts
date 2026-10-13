import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getContent } from './content';
import { SECTION_IDS, type Locale, type SectionId } from './content/model';
import { trackActive } from './core/active';
import { Seo } from './core/seo';
import { Palette } from './search/palette';
import { About } from './sections/about';
import { Contact } from './sections/contact';
import { Experience } from './sections/experience';
import { Hero } from './sections/hero';
import { Profile } from './sections/profile';
import { Projects } from './sections/projects';
import { Skills } from './sections/skills';
import { Header } from './shell/header';
import { LangBanner } from './shell/lang-banner';
import { TabBar } from './shell/tabbar';

@Component({
  selector: 'app-home',
  imports: [Header, TabBar, LangBanner, Hero, Profile, Experience, Skills, Projects, About, Contact, Palette],
  template: `
    <svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
      <filter id="cv-refract" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="1" seed="3" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
    <a class="skip" [attr.href]="mainHref" (click)="skip($event)">{{ c.ui.skip }}</a>
    <app-header [c]="c" [locale]="locale" [active]="active()" (palette)="paletteOpen.set(true)" />
    <main id="main" tabindex="-1">
      <app-hero [c]="c" />
      <app-profile [c]="c" />
      <app-experience [c]="c" [locale]="locale" />
      <app-skills [c]="c" />
      <app-projects [c]="c" />
      <app-about [c]="c" />
      <app-contact [c]="c" />
    </main>
    <app-tabbar [c]="c" [locale]="locale" [active]="active()" />
    <app-lang-banner [locale]="locale" />
    @if (paletteOpen()) {
      @defer (on immediate) {
        <app-palette [c]="c" [locale]="locale" (closed)="paletteOpen.set(false)" />
      }
    }
  `,
  host: { '(window:keydown)': 'onKey($event)' },
})
export class Home {
  readonly locale = inject(ActivatedRoute).snapshot.data['locale'] as Locale;
  readonly c = getContent(this.locale);
  readonly active = signal<SectionId>('profile');
  readonly paletteOpen = signal(false);
  protected readonly mainHref = `${this.locale === 'hu' ? '/hu/' : '/'}#main`;

  constructor() {
    inject(Seo).apply(this.locale, this.c);
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const stop = trackActive(SECTION_IDS, (id) => this.active.set(id as SectionId));
      destroy.onDestroy(stop);
      const chromium = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands.some((b) => b.brand === 'Chromium');
      const calm = !matchMedia('(prefers-reduced-motion: reduce), (prefers-reduced-transparency: reduce), (prefers-contrast: more)').matches;
      if (chromium && calm) requestAnimationFrame(() => document.documentElement.classList.add('refract'));
    });
  }

  protected skip(e: Event): void {
    e.preventDefault();
    document.getElementById('main')?.focus();
  }

  protected onKey(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.paletteOpen.set(true);
    }
  }
}
