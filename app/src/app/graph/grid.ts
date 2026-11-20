import { activeAt, type ArcJob } from './arc';

export interface GridLaneIn {
  id: string;
  /** The jobs that used this family (the first job, the foundation, is not among them). */
  jobs: readonly string[];
  /** The skills of this family that a job uses. */
  tagsOf: (jobId: string) => readonly string[];
}
export interface GridCell { year: number; level: number; jobs: string[]; tags: string[] }
export interface GridLane {
  id: string;
  since: number;
  /** How many cells at the start of the row are empty (drawn as one bar, not as separate squares); all of them where the family is unused. */
  lead: number;
  cells: GridCell[];
}
export interface Grid {
  min: number;
  max: number;
  /** Every year on the axis, the foundation's years included. */
  years: number[];
  /** How many years the foundation (the first job) takes: they are drawn as one block, before the first cell. */
  baseYears: number;
  lanes: GridLane[];
}

/** The darkest level: this many technologies of a family in one year, or more. */
export const MAX_LEVEL = 4;

/**
 * The career as a grid of years, like a contribution graph: one row per skill family, one cell per year after the
 * foundation. A cell's level is how many different skills of the family the jobs of that year use (capped at
 * `MAX_LEVEL`), and at least 1 where a job used the family at all. It counts what a role mentions, not how well it was known.
 */
export function careerGrid(jobs: readonly ArcJob[], baseId: string, lanes: readonly GridLaneIn[]): Grid {
  const min = Math.min(...jobs.map((j) => j.start));
  const max = Math.max(...jobs.map((j) => j.end));
  const base = jobs.find((j) => j.id === baseId)!;
  const baseYears = base.end - base.start;
  const years = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return {
    min,
    max,
    years,
    baseYears,
    lanes: lanes.map((lane) => {
      const cells = years.slice(baseYears).map((year) => {
        const active = activeAt(jobs, year).filter((id) => lane.jobs.includes(id));
        const tags = [...new Set(active.flatMap((id) => lane.tagsOf(id)))];
        return { year, level: Math.min(MAX_LEVEL, Math.max(tags.length, active.length ? 1 : 0)), jobs: active, tags };
      });
      const first = cells.findIndex((c) => c.level > 0);
      return { id: lane.id, since: cells.find((c) => c.level > 0)?.year ?? min, lead: first === -1 ? cells.length : first, cells };
    }),
  };
}

/** One piece of a row as it is drawn: a bar over a stretch of years with nothing in them, or a square with something in it. */
export type CellRun = { gap: number; cell?: undefined } | { gap?: undefined; cell: GridCell };

/** The row's cells as drawn: every stretch of empty years is one bar (not a string of separate squares), the other years are squares. */
export function cellRuns(cells: readonly GridCell[]): CellRun[] {
  const runs: CellRun[] = [];
  for (const cell of cells) {
    const last = runs[runs.length - 1];
    if (cell.level !== 0) runs.push({ cell });
    else if (last?.gap !== undefined) last.gap++;
    else runs.push({ gap: 1 });
  }
  return runs;
}

/** The first and last index of the stretch of empty years around an index (the index itself must be an empty year). */
export function emptyStretch(cells: readonly GridCell[], at: number): [number, number] {
  let a = at;
  let b = at;
  while (a > 0 && cells[a - 1]!.level === 0) a--;
  while (b < cells.length - 1 && cells[b + 1]!.level === 0) b++;
  return [a, b];
}
