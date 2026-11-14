/** Articles under About → Research. To add or swap one, edit this list: newest first, any number of entries. */
export interface Article { url: string; title: string }

export const ARTICLES: readonly Article[] = [
  { url: 'https://dev.to/_er2es_/review-driven-development-a-method-for-the-bugs-a-95-mutation-score-cant-see-39go', title: 'Review-driven development: a method for the bugs a 95% mutation score can’t see' },
  { url: 'https://dev.to/_er2es_/your-architecture-rules-are-code-too-mutation-testing-a-ddd-ruleset-in-php-84-3p33', title: 'Your architecture rules are code too: mutation testing a DDD ruleset in PHP 8.4' },
  { url: 'https://dev.to/_er2es_/95-mutation-score-and-a-review-still-found-a-cross-tenant-leak-fuzzphony-011-27c5', title: '95% mutation score, and a review still found a cross-tenant leak (Fuzzphony 0.11)' },
  { url: 'https://dev.to/_er2es_/the-state-of-mutation-testing-infection-in-the-php-ecosystem-a-scientific-and-practical-analysis-dip', title: 'The state of mutation testing (Infection) in the PHP ecosystem: a scientific and practical analysis' },
];
