import type { ArticleData } from './articles.data';

/**
 * The one request the page makes to somebody else: the list of the author's articles from the public dev.to API, once, when the
 * research block comes near the screen. It carries no cookies and no referrer (`credentials: 'omit'`, `referrerPolicy: 'no-referrer'`),
 * the Content Security Policy lets exactly this address through (scripts/csp.mjs), and if it fails for any reason the page keeps
 * the list that was fetched at build time (articles.data.ts): the section is never empty.
 */
export const DEVTO_API = 'https://dev.to/api/articles?username=_er2es_';

/**
 * The address of the list. dev.to's edge keeps each answer, per address and per encoding and origin, for up to two days
 * (`X-Accel-Expires: 172800`), and a new article does not reliably clear all of those copies: a copy made before an article was
 * published goes on being served without it. The cache key includes `per_page` but not unknown parameters, so a `per_page` that
 * changes every ten minutes (any value from 100 up is more than the number of articles, so the answer is the same list) is a key no
 * stale copy exists for: a new article shows within about ten minutes of being published, on the first visit of a new window.
 */
export const articlesUrl = (now: number = Date.now()): string => `${DEVTO_API}&per_page=${100 + (Math.floor(now / 600000) % 800)}`;

/** The articles from the API's answer, newest first; anything that is not a list is an error, and an entry without an address or a title is skipped. */
export function parseArticles(json: unknown): ArticleData[] {
  if (!Array.isArray(json)) throw new Error('dev.to did not answer with a list');
  return json
    .flatMap((a: Record<string, unknown>) => {
      if (typeof a['url'] !== 'string' || typeof a['title'] !== 'string' || typeof a['published_at'] !== 'string') return [];
      return [{
        url: a['url'],
        title: a['title'].trim(),
        description: typeof a['description'] === 'string' ? a['description'].trim() : '',
        date: a['published_at'].slice(0, 10),
        minutes: Number(a['reading_time_minutes']) || 1,
        tags: Array.isArray(a['tag_list']) ? a['tag_list'].map(String) : [],
      }];
    })
    .sort((x, y) => y.date.localeCompare(x.date) || x.url.localeCompare(y.url));
}

export async function fetchArticles(fetcher: typeof fetch = fetch, signal?: AbortSignal, now: number = Date.now()): Promise<ArticleData[]> {
  const res = await fetcher(articlesUrl(now), { credentials: 'omit', referrerPolicy: 'no-referrer', ...(signal ? { signal } : {}) });
  if (!res.ok) throw new Error(`dev.to answered ${res.status}`);
  const list = parseArticles(await res.json());
  if (!list.length) throw new Error('dev.to answered with no articles');
  return list;
}
