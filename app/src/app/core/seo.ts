import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { getContent } from '../content';
import { EMAIL, GITHUB_URL, LINKEDIN_URL, SITE_URL, SKILLS, type Locale, type SiteContent } from '../content/model';
import { BUILD } from '../egg/build-info';
import { pagePath } from './nav';

const url = (l: Locale): string => `${SITE_URL}${pagePath(l)}`;
const PERSON = `${SITE_URL}/#person`;
const WEBSITE = `${SITE_URL}/#website`;
/** The social card of each language (scripts/social-card.mjs makes them) and the portrait. */
const CARD = { width: 1200, height: 630 };
const card = (l: Locale): string => `${SITE_URL}/img/card-${l}.jpg`;
const PORTRAIT = `${SITE_URL}/img/portrait-640.jpg`;

@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly doc = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  apply(locale: Locale, c: SiteContent): void {
    this.doc.documentElement.lang = locale;
    this.title.setTitle(c.meta.title);
    const other: Locale = locale === 'en' ? 'hu' : 'en';

    const tags: [string, string, string][] = [
      ['name', 'description', c.meta.description],
      ['property', 'og:title', c.meta.title],
      ['property', 'og:description', c.meta.description],
      ['property', 'og:type', 'website'],
      ['property', 'og:url', url(locale)],
      ['property', 'og:locale', c.meta.ogLocale],
      ['property', 'og:site_name', c.hero.name],
      ['property', 'og:locale:alternate', getContent(other).meta.ogLocale],
      ['property', 'og:image', card(locale)],
      ['property', 'og:image:width', String(CARD.width)],
      ['property', 'og:image:height', String(CARD.height)],
      ['property', 'og:image:alt', `${c.hero.name}: ${c.hero.role}`],
      ['name', 'twitter:card', 'summary_large_image'],
      ['name', 'twitter:image', card(locale)],
      ['name', 'twitter:image:alt', `${c.hero.name}: ${c.hero.role}`],
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
    // only what the page itself shows: the skills of the Skills section, the languages of About, the city of the hero line
    // (no employers, no districts, no phone number: the page keeps those out, and so does the data about it)
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': WEBSITE,
          url: `${SITE_URL}/`,
          name: c.hero.name,
          inLanguage: locale,
          publisher: { '@id': PERSON },
        },
        {
          '@type': 'ProfilePage',
          '@id': `${url(locale)}#profile`,
          url: url(locale),
          name: c.meta.title,
          description: c.meta.description,
          inLanguage: locale,
          dateModified: BUILD.date,
          isPartOf: { '@id': WEBSITE },
          mainEntity: { '@id': PERSON },
        },
        {
          '@type': 'Person',
          '@id': PERSON,
          name: c.hero.name,
          jobTitle: c.hero.role,
          url: `${SITE_URL}/`,
          email: EMAIL,
          image: { '@type': 'ImageObject', url: PORTRAIT, width: 640, height: 640, caption: c.hero.portraitAlt },
          address: { '@type': 'PostalAddress', addressLocality: 'Budapest', addressCountry: 'HU' },
          knowsAbout: SKILLS.flatMap((g) => g.items.map((s) => s.label?.[locale] ?? s.name)),
          knowsLanguage: ['hu', 'en'],
          sameAs: [GITHUB_URL, LINKEDIN_URL], // the same person on the two profiles linked from the Contact section
        },
      ],
    });
    head.appendChild(ld);
  }
}
