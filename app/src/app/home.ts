import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getContent } from './content';
import type { Locale } from './content/model';
import { Seo } from './core/seo';

@Component({
  selector: 'app-home',
  template: '<main id="main"><h1>{{ c.hero.name }}</h1><p>{{ c.hero.role }}</p></main>',
})
export class Home {
  readonly locale = inject(ActivatedRoute).snapshot.data['locale'] as Locale;
  readonly c = getContent(this.locale);

  constructor() {
    inject(Seo).apply(this.locale, this.c);
  }
}
