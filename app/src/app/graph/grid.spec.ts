import { careerGrid, MAX_LEVEL } from './grid';

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
    expect(levels).toEqual([2, 2, 2, 0, MAX_LEVEL, MAX_LEVEL, MAX_LEVEL]); // 2013 is a gap, 2014+ lists five
    const bare = careerGrid(jobs, 'base', [{ id: 'x', jobs: ['a'], tagsOf: () => [] }]);
    expect(bare.lanes[0].cells[0].level).toBe(1);
  });

  it('keeps the jobs and technologies of a cell, and says when the family began', () => {
    expect(g.lanes[0].cells[0]).toMatchObject({ jobs: ['a'], tags: ['PHP', 'MySQL'] });
    expect(g.lanes[0].since).toBe(2010);
  });

  it('starts an unused family at the beginning of the axis', () => {
    expect(g.lanes[1].since).toBe(2008);
    expect(g.lanes[1].cells.every((c) => c.level === 0)).toBe(true);
  });
});
