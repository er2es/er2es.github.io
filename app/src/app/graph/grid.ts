import { activeAt, type ArcJob } from './arc';

export interface GridLaneIn {
  id: string;
  /** The jobs that used this family (the first job, the foundation, is not among them). */
  jobs: readonly string[];
  /** The skills of this family that a job uses. */
  tagsOf: (jobId: string) => readonly string[];
}
export interface GridCell { year: number; level: number; jobs: string[]; tags: string[] }
export interface GridLane { id: string; since: number; cells: GridCell[] }
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
      return { id: lane.id, since: cells.find((c) => c.level > 0)?.year ?? min, cells };
    }),
  };
}
