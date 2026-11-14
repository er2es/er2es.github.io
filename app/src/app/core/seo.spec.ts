import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { getContent } from '../content';
import { Seo } from './seo';

describe('Seo', () => {
  it('sets lang, title, canonical, hreflang and JSON-LD for HU', () => {
    TestBed.inject(Seo).apply('hu', getContent('hu'));
    expect(document.documentElement.lang).toBe('hu');
    expect(TestBed.inject(Title).getTitle()).toBe(getContent('hu').meta.title);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://er2es.github.io/hu/');
    const alts = [...document.head.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')]);
    expect(alts).toEqual([
      ['en', 'https://er2es.github.io/'],
      ['hu', 'https://er2es.github.io/hu/'],
      ['x-default', 'https://er2es.github.io/'],
    ]);
    const ld = JSON.parse(document.head.querySelector('script[type="application/ld+json"]')!.textContent!);
    const node = (type: string) => ld['@graph'].find((n: { '@type': string }) => n['@type'] === type);
    expect(ld['@graph'].map((n: { '@type': string }) => n['@type'])).toEqual(['WebSite', 'ProfilePage', 'Person']);
    const person = node('Person');
    expect(person.email).toBe('szabo.jozsef.acc@gmail.com');
    expect(person.sameAs).toEqual(['https://github.com/er2es', 'https://www.linkedin.com/in/szabo-j%C3%B3zsef-a61156357/', 'https://dev.to/_er2es_']);
    expect(person.address).toEqual({ '@type': 'PostalAddress', addressLocality: 'Budapest', addressCountry: 'HU' }); // the city only
    expect(person.knowsLanguage).toEqual(['hu', 'en']);
    expect(person.knowsAbout).toContain('Symfony');
    expect(person.image.url).toBe('https://er2es.github.io/img/portrait-640.jpg');
    // the three nodes point at each other by id, and the page is in the language of the URL
    expect(node('ProfilePage').mainEntity).toEqual({ '@id': person['@id'] });
    expect(node('ProfilePage').isPartOf).toEqual({ '@id': node('WebSite')['@id'] });
    expect(node('ProfilePage').inLanguage).toBe('hu');
    expect(node('WebSite').inLanguage).toBe('hu');
    expect(Object.keys(person).join()).not.toMatch(/telephone|worksFor|alumniOf|streetAddress/); // what the page keeps out
  });

  it('gives each language its own social card, in the large format, with its size and a description', () => {
    TestBed.inject(Seo).apply('en', getContent('en'));
    const meta = (key: string) => document.head.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute('content');
    expect(meta('og:image')).toBe('https://er2es.github.io/img/card-en.jpg');
    expect(meta('og:image:width')).toBe('1200');
    expect(meta('og:image:height')).toBe('630');
    expect(meta('og:image:alt')).toContain('József Szabó');
    expect(meta('twitter:card')).toBe('summary_large_image');
    expect(meta('twitter:image')).toBe('https://er2es.github.io/img/card-en.jpg');
    expect(meta('og:site_name')).toBe('József Szabó');
    expect(meta('og:locale:alternate')).toBe('hu_HU');
  });

  it('is idempotent', () => {
    const seo = TestBed.inject(Seo);
    seo.apply('en', getContent('en'));
    seo.apply('en', getContent('en'));
    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.head.querySelectorAll('script[type="application/ld+json"]').length).toBe(1);
  });
});
