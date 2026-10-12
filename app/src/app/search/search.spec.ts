import { getContent } from '../content';
import { FACTS } from '../content/model';
import { buildDocs, norm, search, buildCvContext } from './search';

const docs = buildDocs(getContent('en'));

describe('search', () => {
  it('indexes every item', () => {
    for (const f of FACTS) expect(docs.some((d) => d.id === `item:${f.id}`)).toBe(true);
  });

  it('is accent- and case-insensitive', () => {
    expect(norm('Árvíztűrő tükörfúrógép')).toBe('arvizturo tukorfurogep');
    const hu = buildDocs(getContent('hu'));
    expect(search(hu, 'szoftvertesztelo').some((d) => d.id === 'item:pricing-co')).toBe(true);
    expect(search(docs, 'SELENIUM').map((d) => d.id)).toEqual(expect.arrayContaining(['item:edu-authority', 'item:pricing-co']));
  });

  it('requires every token to match', () => {
    expect(search(docs, 'symfony postgresql').some((d) => d.id === 'item:chamber')).toBe(true);
    expect(search(docs, 'symfony zzzzqqq')).toEqual([]);
  });

  it('survives regex characters, blanks and long input', () => {
    for (const q of ['(', '[a-', '\\', '.*', '   ', '', 'x'.repeat(5000)]) {
      expect(() => search(docs, q)).not.toThrow();
    }
    expect(search(docs, '   ')).toEqual([]);
  });

  it('builds a CV context that includes the email once and the content', () => {
    const ctx = buildCvContext(getContent('en'));
    expect(ctx).toContain('claude@mbvk.hu');
    expect(ctx).toContain('Symfony');
  });
});
