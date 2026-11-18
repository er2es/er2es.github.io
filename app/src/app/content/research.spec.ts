import { ARTICLES, TOPICS, cardTopics, filterTopics, formatDate, minutesLabel, toArticles, topicLabel, topicsOf, type Article } from './research';

const art = (over: Partial<Article>): Article => ({ url: 'u', title: '', description: '', date: '2026-01-01', minutes: 1, tags: [], topics: [], ...over });

describe('topicsOf', () => {
  it('maps the dev.to tags onto the four topics of the page and ignores the tags that say nothing here', () => {
    const t = topicsOf(art({ tags: ['php', 'symfony', 'opensource', 'webdev', 'programming', 'postgres', 'codereview', 'ddd', 'typescript'] }));
    expect(t).toEqual(['symfony', 'postgresql', 'qa', 'angular', 'php']);
  });

  it('also reads the title and the description, so a topic its tags do not name is found', () => {
    expect(topicsOf(art({ title: 'What mutation testing says', description: 'about a Symfony core, slimfony', tags: ['webdev'] }))).toEqual(['symfony', 'qa']);
    expect(topicsOf(art({ title: 'Stop these 5 Angular anti-patterns', tags: [] }))).toEqual(['angular']);
    expect(topicsOf(art({ description: 'Postgres, read-your-writes', tags: [] }))).toEqual(['postgresql']);
  });

  it('is in the order of the topics, whatever the order of the tags', () => {
    expect(topicsOf(art({ tags: ['angular', 'testing', 'postgres', 'symfony'] }))).toEqual(['symfony', 'postgresql', 'qa', 'angular']);
  });

  it('gives only PHP, or nothing, to an article that is about none of the four (it is shown under "All")', () => {
    expect(topicsOf(art({ title: 'A walk in the park', tags: ['life', 'webdev'] }))).toEqual([]);
    expect(topicsOf(art({ title: 'grapheme_levenshtein() in PHP 8.5', tags: ['php'] }))).toEqual(['php']); // PHP is a pill, not a filter
  });
});

describe('toArticles and ARTICLES', () => {
  it('put the articles newest first, the ones of a day by address, each with its topics', () => {
    const list = toArticles([
      { url: 'https://dev.to/b', title: 'B', description: '', date: '2026-02-01', minutes: 1, tags: ['angular'] },
      { url: 'https://dev.to/a', title: 'A', description: '', date: '2026-02-01', minutes: 1, tags: [] },
      { url: 'https://dev.to/c', title: 'C', description: '', date: '2026-03-01', minutes: 1, tags: ['symfony'] },
    ]);
    expect(list.map((a) => a.url)).toEqual(['https://dev.to/c', 'https://dev.to/a', 'https://dev.to/b']);
    expect(list.map((a) => a.topics)).toEqual([['symfony'], [], ['angular']]);
  });

  it('are what was fetched at build time, newest first', () => {
    expect(ARTICLES.length).toBeGreaterThan(0);
    for (let i = 1; i < ARTICLES.length; i++) expect(ARTICLES[i - 1]!.date >= ARTICLES[i]!.date).toBe(true);
    for (const a of ARTICLES) expect(a.url).toMatch(/^https:\/\/dev\.to\//);
  });
});

describe('filterTopics', () => {
  it('lists the topics that hold an article, with how many, in the order of TOPICS', () => {
    const list = [art({ topics: ['qa', 'angular'] }), art({ topics: ['qa'] }), art({ topics: [] })];
    expect(filterTopics(list)).toEqual([{ id: 'qa', count: 2 }, { id: 'angular', count: 1 }]);
    expect(filterTopics([art({ topics: ['symfony'] }), art({ topics: ['qa', 'angular'] }), art({ topics: ['qa'] })])).toEqual([{ id: 'qa', count: 2 }, { id: 'symfony', count: 1 }, { id: 'angular', count: 1 }]); // the biggest first
    expect(filterTopics([art({ topics: [] })])).toEqual([]);
    expect(filterTopics([art({ topics: ['php'] }), art({ topics: ['php', 'qa'] })])).toEqual([{ id: 'qa', count: 1 }]); // PHP is not a filter
  });
});

describe('cardTopics', () => {
  it('gives the pills of a card: at most three, PHP only when it is all there is', () => {
    expect(cardTopics(art({ topics: ['symfony', 'qa', 'php'] }))).toEqual(['symfony', 'qa']);
    expect(cardTopics(art({ topics: ['symfony', 'postgresql', 'qa', 'angular', 'php'] }))).toEqual(['symfony', 'postgresql', 'qa']);
    expect(cardTopics(art({ topics: ['php'] }))).toEqual(['php']);
    expect(cardTopics(art({ topics: [] }))).toEqual([]);
  });
});

describe('labels', () => {
  it('names a topic in the language of the page, and an unknown one by its id', () => {
    expect(topicLabel('qa', 'hu')).toBe('QA');
    expect(topicLabel('postgresql', 'en')).toBe('PostgreSQL');
    expect(topicLabel('nothing', 'en')).toBe('nothing');
    expect(TOPICS.map((t) => t.id)).toEqual(['symfony', 'postgresql', 'qa', 'angular', 'php']);
  });

  it('writes a date the same on the server and in the browser, in each language', () => {
    expect(formatDate('2026-11-05', 'en')).toBe('5 Nov 2026');
    expect(formatDate('2026-01-31', 'hu')).toBe('2026. 01. 31.');
  });

  it('writes the reading time', () => {
    expect(minutesLabel(9, 'en')).toBe('9 min read');
    expect(minutesLabel(9, 'hu')).toBe('9 perc');
  });
});
