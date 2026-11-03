import { EXTRA } from './extra';

describe('the prizes under the scratch card', () => {
  it('are ten in each language, each with a title, a line and the small print, no two alike', () => {
    for (const lang of ['en', 'hu'] as const) {
      const prizes = EXTRA[lang].prizes;
      expect(prizes).toHaveLength(10);
      for (const p of prizes) expect([p.title, p.text, p.small].every((t) => t.trim().length > 0)).toBe(true);
      expect(new Set(prizes.map((p) => p.title)).size).toBe(10);
    }
  });
});
