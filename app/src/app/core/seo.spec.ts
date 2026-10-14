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
    expect(Object.keys(ld).sort()).toEqual(['@context', '@type', 'email', 'jobTitle', 'name', 'sameAs']);
    expect(ld.email).toBe('szabo.jozsef.acc@gmail.com');
    expect(ld.sameAs).toEqual(['https://github.com/er2es', 'https://www.linkedin.com/in/szabo-j%C3%B3zsef-a61156357/']);
  });

  it('is idempotent', () => {
    const seo = TestBed.inject(Seo);
    seo.apply('en', getContent('en'));
    seo.apply('en', getContent('en'));
    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.head.querySelectorAll('script[type="application/ld+json"]').length).toBe(1);
  });
});
