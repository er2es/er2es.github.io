import { ARTICLE_DATA, type ArticleData } from './articles.data';
import type { Locale } from './model';

/**
 * Articles under About → Research. The list shown at first is the one fetched from the dev.to API before the build (`npm run articles`,
 * written to articles.data.ts: it is what search engines and the first paint see); in the browser the page asks the API again
 * (content/devto.ts) and shows what it answers, newest first.
 * The filter has the four topics the rest of the page is about (the skills and tags it already uses): a dev.to tag is mapped onto
 * them, and the title and the description are read for the terms as well, so an article about mutation testing is found under QA
 * even where its tags say only "php". Tags that say nothing here (webdev, programming, opensource...) are not mapped at all, and an
 * article with no topic is shown only under "All".
 */
export interface Topic {
  id: string;
  en: string;
  hu: string;
  /** dev.to tags that mean this topic. */
  tags: readonly string[];
  /** Words in the title or the description that mean it. */
  terms: RegExp;
  /** Whether it is a filter chip as well (default); a topic that is only a pill on the card says what the article is about when nothing else does. */
  filter?: boolean;
}

export const TOPICS: readonly Topic[] = [
  { id: 'symfony', en: 'Symfony', hu: 'Symfony', tags: ['symfony'], terms: /\b(?:Symfony|slimfony)\b/i },
  { id: 'postgresql', en: 'PostgreSQL', hu: 'PostgreSQL', tags: ['postgres', 'postgresql', 'sql'], terms: /\bPostgre(?:SQL|s)\b/i },
  { id: 'qa', en: 'QA', hu: 'QA', tags: ['testing', 'codereview', 'qa', 'tdd'], terms: /\b(?:tests?|testing|mutation|review|QA)\b/i },
  { id: 'angular', en: 'Angular', hu: 'Angular', tags: ['angular', 'typescript'], terms: /\bAngular\b/ },
  { id: 'php', en: 'PHP', hu: 'PHP', tags: ['php'], terms: /\bPHP\b/, filter: false },
];

export interface Article extends ArticleData {
  /** Topic ids, in the order of TOPICS. */
  topics: readonly string[];
}

/** The topics of an article: by its dev.to tags, and by the terms in its title and description. */
export function topicsOf(a: ArticleData): string[] {
  const text = `${a.title} ${a.description}`;
  const tags = a.tags.map((t) => t.toLowerCase());
  return TOPICS.filter((t) => t.tags.some((x) => tags.includes(x)) || t.terms.test(text)).map((t) => t.id);
}

/** Articles newest first, each with its topics (the list from the API goes through here as well). */
export const toArticles = (data: readonly ArticleData[]): Article[] =>
  [...data].sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url)).map((a) => ({ ...a, topics: topicsOf(a) }));

export const ARTICLES: readonly Article[] = toArticles(ARTICLE_DATA);

/** The topics that make a filter: those with at least one article, with how many, the biggest first (ties in the order of TOPICS). */
export function filterTopics(articles: readonly Article[]): { id: string; count: number }[] {
  return TOPICS.filter((t) => t.filter !== false).map((t) => ({ id: t.id, count: articles.filter((a) => a.topics.includes(t.id)).length })).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
}

/** The pills of a card: up to three of its topics; PHP, which nearly everything is, only where nothing else says what the article is about. */
export function cardTopics(a: Article): string[] {
  const others = a.topics.filter((t) => t !== 'php');
  return (others.length ? others : a.topics).slice(0, 3);
}

export const topicLabel = (id: string, lang: Locale): string => {
  const t = TOPICS.find((x) => x.id === id);
  return t ? t[lang] : id;
};

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "18 Nov 2026" / "2026. 11. 18." from an ISO date, with no Intl (the server and the browser must write the same). */
export function formatDate(iso: string, lang: Locale): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return lang === 'hu' ? `${y}. ${String(m).padStart(2, '0')}. ${String(d).padStart(2, '0')}.` : `${d} ${MONTHS_EN[m - 1]} ${y}`;
}

export const minutesLabel = (n: number, lang: Locale): string => (lang === 'hu' ? `${n} perc` : `${n} min read`);
