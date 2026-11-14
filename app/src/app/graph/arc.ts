import type { Locale } from '../content/model';

export interface ArcJob { id: string; start: number; end: number; main: boolean }

/**
 * The jobs running in `year`. A job ends where the next begins, so its last year belongs to the next one; when no main job
 * runs that year (the next begins later), the last year is still the job's own.
 */
export function activeAt(jobs: readonly ArcJob[], year: number): string[] {
  const running = (o: ArcJob): boolean => o.main && o.start <= year && year < o.end;
  return jobs.filter((j) => j.start <= year && (year < j.end || (year === j.end && !jobs.some((o) => o !== j && running(o))))).map((j) => j.id);
}

// Hungarian suffix of "-tól/-től" follows how the last digit is spoken (egy-től, három-tól, hat-tól, húsz-tól)
const HU_FROM = ['től', 'től', 'től', 'tól', 'től', 'től', 'tól', 'től', 'tól', 'tól'];

/** "from 2011" / "2011-től". */
export function fromYear(lang: Locale, year: number): string {
  if (lang === 'en') return `from ${year}`;
  return `${year}-${year % 100 === 20 ? 'tól' : HU_FROM[year % 10]}`;
}
