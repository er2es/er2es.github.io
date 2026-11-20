import { careerGrid, cellRuns, emptyStretch, MAX_LEVEL, type GridCell } from './grid';

const jobs = [
  { id: 'base', start: 2008, end: 2010, main: true },
  { id: 'a', start: 2010, end: 2013, main: true },
  { id: 'b', start: 2014, end: 2016, main: true },
];
const tags: Record<string, string[]> = { a: ['PHP', 'MySQL'], b: ['PHP', 'Symfony', 'Twig', 'Doctrine', 'Composer'] };
const lane = { id: 'backend', jobs: ['a', 'b'], tagsOf: (id: string) => tags[id] ?? [] };

describe('careerGrid', () => {
  const g = careerGrid(jobs, 'base', [lane, { id: 'none', jobs: [], tagsOf: () => [] }]);

  it('spans every year of the axis and gives the foundation its own years', () => {
    expect(g.years).toEqual([2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016]);
    expect(g.baseYears).toBe(2);
    expect(g.lanes[0].cells.map((c) => c.year)).toEqual([2010, 2011, 2012, 2013, 2014, 2015, 2016]);
  });

  it('levels a year by how many technologies the family has in it, capped, and 1 where a job used it with none listed', () => {
    const levels = g.lanes[0].cells.map((c) => c.level);
    expect(levels).toEqual([2, 2, 2, 2, MAX_LEVEL, MAX_LEVEL, MAX_LEVEL]); // 2013 is still the first job's (no job starts that year), 2014+ lists five
    const bare = careerGrid(jobs, 'base', [{ id: 'x', jobs: ['a'], tagsOf: () => [] }]);
    expect(bare.lanes[0].cells[0].level).toBe(1);
  });

  it('keeps the jobs and technologies of a cell, and says when the family began', () => {
    expect(g.lanes[0].cells[0]).toMatchObject({ jobs: ['a'], tags: ['PHP', 'MySQL'] });
    expect(g.lanes[0].since).toBe(2010);
  });

  it('counts the empty years at the start of a row, which are drawn as one bar', () => {
    expect(g.lanes[0].lead).toBe(0); // the family is used from the first year after the foundation
    expect(g.lanes[1].lead).toBe(g.lanes[1].cells.length); // never used: all of them
    const late = careerGrid(jobs, 'base', [{ id: 'late', jobs: ['b'], tagsOf: () => ['PHP'] }]);
    expect(late.lanes[0].lead).toBe(late.lanes[0].cells.findIndex((c) => c.year === 2014));
    expect(late.lanes[0].lead).toBeGreaterThan(0);
  });

  it('starts an unused family at the beginning of the axis', () => {
    expect(g.lanes[1].since).toBe(2008);
    expect(g.lanes[1].cells.every((c) => c.level === 0)).toBe(true);
  });
});

describe('cellRuns and emptyStretch', () => {
  const cell = (year: number, level: number): GridCell => ({ year, level, jobs: [], tags: [] });
  const cells = [cell(2010, 0), cell(2011, 0), cell(2012, 2), cell(2013, 0), cell(2014, 0), cell(2015, 0), cell(2016, 4), cell(2017, 0)];

  it('draws every stretch of empty years as one bar, and the other years as squares', () => {
    const runs = cellRuns(cells);
    expect(runs.map((r) => (r.cell ? r.cell.year : `gap${r.gap}`))).toEqual(['gap2', 2012, 'gap3', 2016, 'gap1']);
  });

  it('draws nothing for no cells', () => {
    expect(cellRuns([])).toEqual([]);
  });

  it('finds the whole stretch of empty years around an index', () => {
    expect(emptyStretch(cells, 1)).toEqual([0, 1]);
    expect(emptyStretch(cells, 4)).toEqual([3, 5]);
    expect(emptyStretch(cells, 7)).toEqual([7, 7]);
  });
});
