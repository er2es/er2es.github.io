import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getContent } from './content';
import { EMAIL, SECTION_IDS, type Locale, type SectionId } from './content/model';
import { trackActive } from './core/active';
import { Seo } from './core/seo';
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
  imports: [Header, TabBar, LangBanner, Hero, Profile, Experience, Skills, Projects, About, Contact],
  template: `
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

export const CONTACT_EMAIL = EMAIL;
