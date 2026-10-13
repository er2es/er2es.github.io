import { FACTS, SKILLS, SECTION_IDS, EMAIL, period } from './model';
import { getContent } from './index';
import type { Locale } from './model';

const LOCALES: Locale[] = ['en', 'hu'];
const IDENTIFYING =
  /mbvk|semmelweis|uni-nke|\bnke\b|kfpr|\bjam\b|árukereső|arukereso|\beducatio\b|oktatási hivatal|nefi\b|honvedelem|sportpont|jó állam|good state|budapestlocal|budapestflow|konigsberg|felvi\b|felvi\.hu|támop|tamop|arveres/i;

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}

describe('content', () => {
  it('has unique fact ids and sane periods', () => {
    const ids = FACTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FACTS) {
      if (f.start !== null && f.end !== null) expect(f.start).toBeLessThanOrEqual(f.end);
      if (f.inGraph) expect(f.start !== null && f.end !== null).toBe(true);
    }
  });

  it('formats periods', () => {
    expect(period(FACTS.find((f) => f.id === 'chamber')!)).toBe('2021–2026');
    expect(period(FACTS.find((f) => f.id === 'admissions-map')!)).toBe('2013');
    expect(period(FACTS.find((f) => f.id === 'fuzzphony')!)).toBe('');
  });

  it('lists each skill once per group', () => {
    for (const g of SKILLS) {
      const names = g.items.map((s) => s.name);
      expect(new Set(names).size).toBe(names.length);
      for (const n of names) expect(n.trim().length).toBeGreaterThan(0);
    }
  });

  for (const locale of LOCALES) {
    describe(locale, () => {
      const c = getContent(locale);

      it('has text for every fact, shaped by kind', () => {
        for (const f of FACTS) {
          const t = c.items[f.id];
          expect(t.title.length).toBeGreaterThan(0);
          if (f.kind === 'job') {
            expect(t.org?.length ?? 0).toBeGreaterThan(0);
            expect(t.points.length).toBeGreaterThan(0);
          } else {
            expect((t.summary ?? '').length).toBeGreaterThan(0);
          }
        }
      });

      it('has every section label and no empty strings', () => {
        for (const s of SECTION_IDS) expect(c.ui.sections[s].length).toBeGreaterThan(0);
        for (const s of strings(c)) expect(s.trim().length).toBeGreaterThan(0);
      });

      it('contains no filler phrases, emoji, or private data', () => {
        const all = strings(c).join('\n');
        const banned =
          /passionate|results-driven|cutting-edge|cutting edge|innovative|synergy|rockstar|ninja|guru|leverage|seamless|world-class|szenvedélyes|eredményorientált|innovatív|csúcstechnológi/i;
        expect(all).not.toMatch(banned);
        expect(all).not.toMatch(/\p{Extended_Pictographic}/u);
        expect(all).not.toMatch(/gmail|\+36|\b06[ -]?30\b|kerület|XX\./i);
        expect(all).not.toMatch(/\d{2}[\s\-/]\d{3}[\s\-/]\d{2}[\s\-/]\d{2}/);
        expect(all).not.toContain(EMAIL); // the address is rendered from the constant only
        // employers, systems and clients stay anonymous (owner's decision)
        expect(all).not.toMatch(IDENTIFYING);
      });
    });
  }

  it('keeps EN and HU structurally identical', () => {
    const en = getContent('en');
    const hu = getContent('hu');
    expect(hu.profile.paragraphs.length).toBe(en.profile.paragraphs.length);
    expect(hu.about.education.items.length).toBe(en.about.education.items.length);
    expect(hu.about.languages.items.length).toBe(en.about.languages.items.length);
    for (const f of FACTS) expect(hu.items[f.id].points.length).toBe(en.items[f.id].points.length);
  });
});
