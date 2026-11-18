import { DEVTO_API, fetchArticles, parseArticles } from './devto';

const entry = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  url: 'https://dev.to/x/a', title: ' A title ', description: ' About it ', published_at: '2026-11-05T10:00:00Z', reading_time_minutes: 7, tag_list: ['php', 'testing'], ...over,
});
const answer = (body: unknown, ok = true, status = 200) => ({ ok, status, json: () => Promise.resolve(body) }) as Response;

describe('parseArticles', () => {
  it('keeps what the page shows, newest first, and nothing else', () => {
    const list = parseArticles([
      entry({ url: 'https://dev.to/x/old', published_at: '2026-01-01T00:00:00Z', public_reactions_count: 9, user: { name: 'someone' } }),
      entry({ url: 'https://dev.to/x/b', published_at: '2026-11-05T09:00:00Z' }),
      entry({ url: 'https://dev.to/x/a', published_at: '2026-11-05T10:00:00Z' }),
    ]);
    expect(list.map((a) => a.url)).toEqual(['https://dev.to/x/a', 'https://dev.to/x/b', 'https://dev.to/x/old']); // same day: by address
    expect(list[0]).toEqual({ url: 'https://dev.to/x/a', title: 'A title', description: 'About it', date: '2026-11-05', minutes: 7, tags: ['php', 'testing'] });
  });

  it('is gentle with what is missing: a description, a reading time, the tags', () => {
    const [a] = parseArticles([entry({ description: undefined, reading_time_minutes: undefined, tag_list: undefined })]);
    expect(a).toMatchObject({ description: '', minutes: 1, tags: [] });
  });

  it('skips an entry without an address, a title or a date, and refuses an answer that is not a list', () => {
    expect(parseArticles([entry({ url: undefined }), entry({ title: 3 }), entry({ published_at: null }), entry()])).toHaveLength(1);
    expect(() => parseArticles({ error: 'x' })).toThrow('list');
  });
});

describe('fetchArticles', () => {
  it('asks the API for the list without cookies or a referrer, and gives the articles', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fake = ((url: string, init: RequestInit) => { calls.push({ url, init }); return Promise.resolve(answer([entry()])); }) as unknown as typeof fetch;
    const list = await fetchArticles(fake);
    expect(list).toHaveLength(1);
    expect(calls[0]!.url).toBe(DEVTO_API);
    expect(calls[0]!.init).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' });
    expect(calls[0]!.init).not.toHaveProperty('signal'); // none given: none passed on
  });

  it('passes on the signal that can call the request off (the page gives up after a few seconds)', async () => {
    const ctl = new AbortController();
    const calls: RequestInit[] = [];
    const fake = ((_: string, init: RequestInit) => { calls.push(init); return Promise.resolve(answer([entry()])); }) as unknown as typeof fetch;
    await fetchArticles(fake, ctl.signal);
    expect(calls[0]!.signal).toBe(ctl.signal);
  });

  it('fails on an answer that is an error or an empty list, so the page keeps the list it has', async () => {
    await expect(fetchArticles((() => Promise.resolve(answer({}, false, 503))) as unknown as typeof fetch)).rejects.toThrow('503');
    await expect(fetchArticles((() => Promise.resolve(answer([]))) as unknown as typeof fetch)).rejects.toThrow('no articles');
  });

  it('uses the browser\'s own fetch when none is given', async () => {
    const real = globalThis.fetch;
    globalThis.fetch = (() => Promise.resolve(answer([entry()]))) as unknown as typeof fetch;
    try {
      expect(await fetchArticles()).toHaveLength(1);
    } finally {
      globalThis.fetch = real;
    }
  });
});
