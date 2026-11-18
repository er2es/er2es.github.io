import type { ArticleData } from './articles.data';

/**
 * The one request the page makes to somebody else: the list of the author's articles from the public dev.to API, once, when the
 * research block comes near the screen. It carries no cookies and no referrer (`credentials: 'omit'`, `referrerPolicy: 'no-referrer'`),
 * the Content Security Policy lets exactly this address through (scripts/csp.mjs), and if it fails for any reason the page keeps
 * the list that was fetched at build time (articles.data.ts): the section is never empty.
 */
export const DEVTO_API = 'https://dev.to/api/articles?username=_er2es_&per_page=100';

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

export async function fetchArticles(fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<ArticleData[]> {
  const res = await fetcher(DEVTO_API, { credentials: 'omit', referrerPolicy: 'no-referrer', ...(signal ? { signal } : {}) });
  if (!res.ok) throw new Error(`dev.to answered ${res.status}`);
  const list = parseArticles(await res.json());
  if (!list.length) throw new Error('dev.to answered with no articles');
  return list;
}
