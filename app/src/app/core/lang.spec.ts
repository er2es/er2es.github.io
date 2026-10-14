import { localeOf } from './lang';

describe('localeOf', () => {
  it('reads the page language from the path, with or without the trailing slash', () => {
    expect(localeOf('/')).toBe('en');
    expect(localeOf('/hu/')).toBe('hu');
    expect(localeOf('/hu')).toBe('hu');
    expect(localeOf('/hungary/')).toBe('en');
  });
});
