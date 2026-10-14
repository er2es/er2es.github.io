import { activeAt, careerArc, fromYear } from './arc';

const jobs = [
  { id: 'a', start: 2010, end: 2014, main: true },
  { id: 'b', start: 2014, end: 2018, main: true },
  { id: 'c', start: 2018, end: 2020, main: true },
];

describe('careerArc', () => {
  it('scales bars to the whole time axis and reports where each lane starts', () => {
    const arc = careerArc(jobs, [{ id: 'x', jobs: ['b', 'c'] }]);
    expect([arc.min, arc.max]).toEqual([2010, 2020]);
    expect(arc.lanes).toEqual([
      { id: 'x', since: 2014, bars: [{ id: 'b', left: 40, width: 40, main: true }, { id: 'c', left: 80, width: 20, main: true }] },
    ]);
  });

  it('drops lanes without a job and puts a tick every few years', () => {
    const arc = careerArc(jobs, [{ id: 'none', jobs: ['zzz'] }, { id: 'all', jobs: ['a'] }], 5);
    expect(arc.lanes.map((l) => l.id)).toEqual(['all']);
    expect(arc.ticks).toEqual([{ year: 2010, left: 0 }, { year: 2015, left: 50 }, { year: 2020, left: 100 }]);
  });
});

describe('activeAt', () => {
  it('gives a boundary year to the job that starts there, and the last year to the job that is still running', () => {
    expect(activeAt(jobs, 2013)).toEqual(['a']);
    expect(activeAt(jobs, 2014)).toEqual(['b']);
    expect(activeAt(jobs, 2020)).toEqual(['c']);
  });

  it('lists overlapping jobs together', () => {
    expect(activeAt([...jobs, { id: 's', start: 2015, end: 2016, main: false }], 2015)).toEqual(['b', 's']);
  });
});

describe('fromYear', () => {
  it('writes the Hungarian suffix the way the year is spoken', () => {
    expect(['2008', '2011', '2013', '2016', '2020', '2021'].map((y) => fromYear('hu', +y))).toEqual([
      '2008-tól', '2011-től', '2013-tól', '2016-tól', '2020-tól', '2021-től',
    ]);
    expect(fromYear('en', 2011)).toBe('from 2011');
  });
});
