import { FACTS, SKILLS, type Fact, type ItemId, type ItemText } from '../content/model';
import { getContent } from '../content';
import { usesOf } from './uses';

const fact = (id: string, kind: Fact['kind'], start: number, end: number, keywords: string[] = []): Fact =>
  ({ id: id as ItemId, kind, main: true, inGraph: kind === 'job', start, end, keywords });
const text = (title: string, points: string[] = [], summary?: string): ItemText => ({ title, points, summary });

describe('usesOf', () => {
  const facts = [
    fact('old', 'job', 2010, 2012, ['MySQL']),
    fact('new', 'job', 2020, 2024, ['symfony']),
    fact('fuzzphony', 'project', 2019, 2019),
    fact('audit', 'project', 2018, 2018),
  ];
  const items = {
    old: text('Tester', ['Used GitLab daily.']),
    new: text('Developer', ['Built APIs and an API gateway.']),
    fuzzphony: text('Library', [], 'A PHP library.'),
    audit: text('Audit', [], 'Built in Laravel.'),
  } as unknown as Record<ItemId, ItemText>;

  it('matches keywords case-insensitively and orders newest job first, then projects in display order', () => {
    expect(usesOf('PHP', facts, items)).toEqual(['new', 'fuzzphony', 'audit']);
  });

  it('matches whole words of the text only', () => {
    expect(usesOf('Git', facts, items)).toEqual(['old']); // via the GitLab alias, not as a substring
    expect(usesOf('MySQL', facts, items)).toEqual(['old']);
    expect(usesOf('REST / SOAP API', facts, items)).toEqual(['new']); // "API" as a word, "APIs" does not count
  });

  it('finds nothing for an unused skill', () => {
    expect(usesOf('Redis', facts, items)).toEqual([]);
  });

  it('links the core skills to real entries in both languages', () => {
    for (const locale of ['en', 'hu'] as const) {
      const c = getContent(locale);
      for (const s of ['PHP', 'Symfony', 'Angular', 'PostgreSQL', 'QA', 'Selenium WebDriver']) {
        expect(usesOf(s, FACTS, c.items).length, `${locale} ${s}`).toBeGreaterThan(0);
      }
      const all = SKILLS.flatMap((g) => g.items.map((i) => i.name));
      for (const s of all) for (const id of usesOf(s, FACTS, c.items)) expect(FACTS.some((f) => f.id === id)).toBe(true);
    }
  });
});
