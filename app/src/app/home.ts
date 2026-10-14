import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getContent } from './content';
import { SECTION_IDS, type Locale, type SectionId } from './content/model';
import { trackActive } from './core/active';
import { initLit } from './core/lit';
import { Seo } from './core/seo';
import { onTripleShift } from './core/triple-shift';
import { Egg } from './egg/egg';
import { Palette } from './search/palette';
import { About } from './sections/about';
import { Contact } from './sections/contact';
import { Experience } from './sections/experience';
import { Hero } from './sections/hero';
import { Profile } from './sections/profile';
import { Projects } from './sections/projects';
import { Skills } from './sections/skills';
import { Header } from './shell/header';
import { TabBar } from './shell/tabbar';
import { ToastHost } from './shell/toast';

@Component({
  selector: 'app-home',
  imports: [Header, TabBar, ToastHost, Egg, Hero, Profile, Experience, Skills, Projects, About, Contact, Palette],
  template: `
    <svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
      <filter id="cv-refract" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="1" seed="3" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
    <a class="skip" [attr.href]="mainHref" (click)="skip($event)">{{ c.ui.skip }}</a>
    <app-header [c]="c" [locale]="locale" [active]="active()" (palette)="openPalette()" />
    <main id="main" tabindex="-1">
      <app-hero [c]="c" />
      <app-profile [c]="c" />
      <app-experience [c]="c" />
      <app-skills [c]="c" />
      <app-projects [c]="c" />
      <app-about [c]="c" />
      <app-contact [c]="c" />
    </main>
    <app-tabbar [c]="c" [locale]="locale" [active]="active()" />
    @defer (on idle) { <app-toast /> }
    @if (paletteOpen()) {
      @for (g of [paletteGen()]; track g) {
        @defer (on immediate) {
          <app-palette [c]="c" [locale]="locale" (closed)="closePalette(g)" />
        }
      }
    }
    @if (eggOpen()) {
      @for (g of [eggGen()]; track g) {
        @defer (on immediate) {
          <app-egg [c]="c" (closed)="closeEgg(g)" />
        }
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
  readonly eggOpen = signal(false);
  // every opening gets a fresh instance, even if the previous one has not been torn down yet
  protected readonly paletteGen = signal(0);
  protected readonly eggGen = signal(0);
  protected readonly mainHref = `${this.locale === 'hu' ? '/hu/' : '/'}#main`;

  constructor() {
    inject(Seo).apply(this.locale, this.c);
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const stop = trackActive(SECTION_IDS, (id) => this.active.set(id as SectionId));
      destroy.onDestroy(stop);
      destroy.onDestroy(initLit());
      destroy.onDestroy(onTripleShift(() => this.egg()));
      // the hero's entrance plays once per visit, not again after an in-app language switch
      setTimeout(() => document.documentElement.classList.add('settled'), 900);
      console.log('%cstat%c → shift shift shift\n%c“If I’m to choose between one evil and another, I prefer not to choose at all.”%c – Geralt of Rivia', 'font-weight:700;color:#30d158', 'color:inherit', 'font-style:italic', 'opacity:.7');
      const chromium = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands.some((b) => b.brand === 'Chromium');
      const calm = !matchMedia('(prefers-reduced-motion: reduce), (prefers-reduced-transparency: reduce), (prefers-contrast: more)').matches;
      if (chromium && calm) requestAnimationFrame(() => document.documentElement.classList.add('refract'));
    });
  }

  private egg(): void {
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const root = document.documentElement;
      root.classList.add('sweep');
      setTimeout(() => root.classList.remove('sweep'), 1400);
    }
    if (!document.querySelector('app-egg dialog[open]')) this.eggGen.update((n) => n + 1);
    this.eggOpen.set(true);
  }

  /** A late close event from an old instance must not close the one that replaced it. */
  protected closePalette(gen: number): void {
    if (gen === this.paletteGen()) this.paletteOpen.set(false);
  }

  protected closeEgg(gen: number): void {
    if (gen === this.eggGen()) this.eggOpen.set(false);
  }

  protected openPalette(): void {
    if (!document.querySelector('app-palette dialog[open]')) this.paletteGen.update((n) => n + 1);
    this.paletteOpen.set(true);
  }

  protected skip(e: Event): void {
    e.preventDefault();
    document.getElementById('main')?.focus();
  }

  protected onKey(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.openPalette();
    }
  }
}
