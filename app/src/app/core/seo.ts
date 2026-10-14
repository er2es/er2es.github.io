import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { EMAIL, GITHUB_URL, LINKEDIN_URL, SITE_URL, type Locale, type SiteContent } from '../content/model';
import { pagePath } from './nav';

const url = (l: Locale): string => `${SITE_URL}${pagePath(l)}`;

@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly doc = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  apply(locale: Locale, c: SiteContent): void {
    this.doc.documentElement.lang = locale;
    this.title.setTitle(c.meta.title);

    const tags: [string, string, string][] = [
      ['name', 'description', c.meta.description],
      ['property', 'og:title', c.meta.title],
      ['property', 'og:description', c.meta.description],
      ['property', 'og:type', 'website'],
      ['property', 'og:url', url(locale)],
      ['property', 'og:locale', c.meta.ogLocale],
      ['property', 'og:image', `${SITE_URL}/img/portrait-640.jpg`],
      ['name', 'twitter:card', 'summary'],
    ];
    for (const [attr, key, content] of tags) {
      this.meta.updateTag({ [attr]: key, content }, `${attr}='${key}'`);
    }

    const head = this.doc.head;
    head.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang], script[data-ld]').forEach((n) => n.remove());
    const link = (rel: string, href: string, hreflang?: string) => {
      const el = this.doc.createElement('link');
      el.rel = rel;
      el.href = href;
      if (hreflang) el.setAttribute('hreflang', hreflang);
      head.appendChild(el);
    };
    link('canonical', url(locale));
    link('alternate', url('en'), 'en');
    link('alternate', url('hu'), 'hu');
    link('alternate', url('en'), 'x-default');

    const ld = this.doc.createElement('script');
    ld.type = 'application/ld+json';
    ld.setAttribute('data-ld', '');
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: c.hero.name,
      jobTitle: c.hero.role,
      email: EMAIL,
      sameAs: [GITHUB_URL, LINKEDIN_URL], // the same person on the two profiles linked from the Contact section
    });
    head.appendChild(ld);
  }
}
