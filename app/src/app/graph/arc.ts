import type { Locale } from '../content/model';

export interface ArcJob { id: string; start: number; end: number; main: boolean }

/** The jobs running in `year`. A job ends where the next begins, so its last year belongs to the next one. */
export function activeAt(jobs: readonly ArcJob[], year: number): string[] {
  const max = Math.max(...jobs.map((j) => j.end));
  return jobs.filter((j) => j.start <= year && (year < j.end || (year >= max && j.end === max))).map((j) => j.id);
}

// Hungarian suffix of "-tól/-től" follows how the last digit is spoken (egy-től, három-tól, hat-tól, húsz-tól)
const HU_FROM = ['től', 'től', 'től', 'tól', 'től', 'től', 'tól', 'től', 'tól', 'tól'];

/** "from 2011" / "2011-től". */
export function fromYear(lang: Locale, year: number): string {
  if (lang === 'en') return `from ${year}`;
  return `${year}-${year % 100 === 20 ? 'tól' : HU_FROM[year % 10]}`;
}
