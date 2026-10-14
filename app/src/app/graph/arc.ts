import type { Locale } from '../content/model';

export interface ArcJob { id: string; start: number; end: number; main: boolean }
export interface ArcLaneIn { id: string; jobs: readonly string[] }
export interface ArcBar { id: string; left: number; width: number; main: boolean }
export interface ArcLane { id: string; since: number; bars: ArcBar[] }
export interface Arc { min: number; max: number; ticks: { year: number; left: number }[]; lanes: ArcLane[] }

/**
 * Positions (in percent of the time axis) for the career arc: one lane per skill family, one bar per job that uses
 * it. A lane without any job is dropped; `since` is the start of its earliest job.
 */
export function careerArc(jobs: readonly ArcJob[], lanes: readonly ArcLaneIn[], tickEvery = 4): Arc {
  const min = Math.min(...jobs.map((j) => j.start));
  const max = Math.max(...jobs.map((j) => j.end));
  const pct = (y: number): number => ((y - min) / (max - min)) * 100;
  const out: ArcLane[] = [];
  for (const lane of lanes) {
    const mine = jobs.filter((j) => lane.jobs.includes(j.id));
    if (!mine.length) continue;
    out.push({
      id: lane.id,
      since: Math.min(...mine.map((j) => j.start)),
      bars: mine.map((j) => ({ id: j.id, left: pct(j.start), width: pct(j.end) - pct(j.start), main: j.main })),
    });
  }
  const ticks: Arc['ticks'] = [];
  for (let y = min; y <= max; y += tickEvery) ticks.push({ year: y, left: pct(y) });
  if (ticks[ticks.length - 1].year !== max) ticks.push({ year: max, left: 100 }); // the axis always ends with its last year
  return { min, max, ticks, lanes: out };
}

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
