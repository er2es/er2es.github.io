import { activeAt, fromYear } from './arc';

const jobs = [
  { id: 'a', start: 2010, end: 2014, main: true },
  { id: 'b', start: 2014, end: 2018, main: true },
  { id: 'c', start: 2018, end: 2020, main: true },
];

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
