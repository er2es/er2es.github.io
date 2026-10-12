import { shouldOfferHungarian } from './lang-detect';

const base = { locale: 'en' as const, languages: ['hu-HU', 'en'], chosen: null, dismissed: null };

describe('shouldOfferHungarian', () => {
  it('offers to a Hungarian-first browser on the English page', () => {
    expect(shouldOfferHungarian(base)).toBe(true);
    expect(shouldOfferHungarian({ ...base, languages: ['HU'] })).toBe(true);
  });
  it('does not offer otherwise', () => {
    expect(shouldOfferHungarian({ ...base, languages: ['en-US', 'hu'] })).toBe(false);
    expect(shouldOfferHungarian({ ...base, languages: undefined })).toBe(false);
    expect(shouldOfferHungarian({ ...base, languages: [] })).toBe(false);
    expect(shouldOfferHungarian({ ...base, locale: 'hu' })).toBe(false);
    expect(shouldOfferHungarian({ ...base, chosen: 'en' })).toBe(false);
    expect(shouldOfferHungarian({ ...base, dismissed: '1' })).toBe(false);
  });
});
