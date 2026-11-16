import { FACTS } from '../content/model';
import { layoutGraph, type Cell, type GraphInput } from './layout';

const real: GraphInput[] = FACTS.filter((f) => f.inGraph).map((f) => ({
  id: f.id, main: f.main, start: f.start!, end: f.end!,
}));

const item = (id: string, main: boolean, start: number, end: number): GraphInput => ({ id, main, start, end });

describe('layoutGraph', () => {
  it('orders newest-finished first and keeps main entries on lane 0', () => {
    const { rows } = layoutGraph(real);
    expect(rows.map((r) => r.id)).toEqual([
      'chamber', 'uni-med', 'uni-admin', 'welfare', 'edu-authority', 'health-inst', 'pricing-co', 'edu-nonprofit',
    ]);
    for (const r of rows) {
      const main = real.find((x) => x.id === r.id)!.main;
      expect(r.lane === 0).toBe(main);
      expect(r.cells[0]).toBe(main ? 'node' : 'pass');
    }
  });

  it('sets a part-time job under the main one it finished with, and the two part-time jobs, one after the other, on one side lane', () => {
    const { laneCount, rows } = layoutGraph(real);
    const ids = rows.map((r) => r.id);
    expect(ids.indexOf('health-inst')).toBe(ids.indexOf('edu-authority') + 1); // the junior analyst right under the tester it ran beside
    expect(laneCount).toBe(2);
    const lane = Object.fromEntries(rows.map((r) => [r.id, r.lane]));
    expect(lane['welfare']).toBe(1);
    expect(lane['health-inst']).toBe(1);
  });

  it('draws a side line next to exactly the main entries it ran beside: out of the main line at the first, in again (or ending at its own node) at the last', () => {
    const { rows } = layoutGraph(real);
    const on = (id: string): Cell => rows.find((r) => r.id === id)!.cells[1]!;
    // the 2018–2019 job ran beside the 2016–2020 one, directly above it: out of that node, ending at its own
    expect(on('uni-admin')).toBe('split');
    expect(on('welfare')).toBe('tip');
    // the 2014–2015 job ran beside the 2012–2015 one: the same, a little lower down, on the same lane
    expect(on('edu-authority')).toBe('split');
    expect(on('health-inst')).toBe('tip');
    expect(['chamber', 'uni-med', 'pricing-co', 'edu-nonprofit'].map(on)).toEqual(['none', 'none', 'none', 'none']);
  });

  it('runs a side line through its own node and the rows between, when it ran beside entries above and below it', () => {
    const { rows } = layoutGraph([item('m1', true, 2018, 2022), item('s', false, 2010, 2021), item('m2', true, 2014, 2018), item('m3', true, 2010, 2014)]);
    expect(rows.map((r) => r.id)).toEqual(['m1', 's', 'm2', 'm3']);
    expect(rows.map((r) => r.cells[1])).toEqual(['split', 'mid', 'pass', 'fork']);
  });

  it('starts a side line at its own node and joins it to the main entry below it that it ran beside', () => {
    const { rows } = layoutGraph([item('s', false, 2010, 2015), item('m', true, 2009, 2012)]);
    expect(rows.map((r) => r.cells[1])).toEqual(['node', 'fork']);
  });

  it('draws a side entry that ran beside no main entry as in a git log, down to where the main line was when it began', () => {
    const { rows } = layoutGraph([item('s', false, 2015, 2016), item('m', true, 2010, 2012)]);
    expect(rows.map((r) => r.cells[1])).toEqual(['node', 'fork']);
    expect(layoutGraph([item('only', false, 2010, 2012)]).rows[0]!.cells).toEqual(['pass', 'node']);
  });

  it('gives overlapping side lines lanes of their own', () => {
    const l = layoutGraph([item('m', true, 2000, 2005), item('s', false, 2010, 2012), item('s2', false, 2008, 2011)]);
    expect(l.rows.map((r) => r.id)).toEqual(['s', 's2', 'm']);
    expect(l.laneCount).toBe(3);
    expect(new Set(l.rows.flatMap((r) => r.cells.map((c, k) => (c === 'node' ? k : 0))).filter(Boolean)).size).toBe(2);
  });

  it('gives two side lines that leave the same main entry lanes of their own, in the order of their rows', () => {
    const l = layoutGraph([item('m', true, 2000, 2020), item('s1', false, 2005, 2010), item('s2', false, 2006, 2011)]);
    expect(l.rows.map((r) => r.id)).toEqual(['m', 's2', 's1']);
    expect(l.rows.map((r) => r.lane)).toEqual([0, 1, 2]);
    expect(l.rows[0]!.cells).toEqual(['node', 'split', 'split']);
  });

  it('draws a side lane that is used again in another colour, and a lane used for the first time in its own', () => {
    const { rows } = layoutGraph(real);
    const hue = (id: string): number => {
      const r = rows.find((x) => x.id === id)!;
      return r.hues[r.lane]!;
    };
    expect(hue('welfare')).toBe(1);
    expect(hue('health-inst')).toBe(2); // the second part-time job, on the same lane, in the next colour
    expect(rows.find((r) => r.id === 'chamber')!.hues).toEqual([0, 0]); // the main line has none of its own
  });

  it('puts a main entry before a side one that finished the same year', () => {
    const rows = layoutGraph([item('side', false, 2012, 2014), item('main', true, 2010, 2014)]).rows.map((r) => r.id);
    expect(rows).toEqual(['main', 'side']);
  });

  it('never lets two side lines overlap on the same lane', () => {
    for (const input of [real, [item('m1', true, 2018, 2022), item('s', false, 2010, 2021), item('m2', true, 2014, 2018), item('m3', true, 2010, 2014)]]) {
      const { rows, laneCount } = layoutGraph(input);
      for (let k = 1; k < laneCount; k++) {
        let open = false;
        for (const r of rows) {
          const c = r.cells[k];
          if (c === 'split' || c === 'node') { expect(open).toBe(false); open = true; }
          if (c === 'mid' || c === 'pass') expect(open).toBe(true);
          if (c === 'fork' || c === 'tip') { expect(open).toBe(true); open = false; }
        }
        expect(open).toBe(false);
      }
    }
  });

  it('handles a single main entry and an empty list', () => {
    expect(layoutGraph([]).rows).toEqual([]);
    const one = layoutGraph([{ id: 'a', main: true, start: 2000, end: 2001 }]);
    expect(one.laneCount).toBe(1);
    expect(one.rows[0].cells).toEqual(['node']);
  });
});

describe('layoutGraph ordering and lanes', () => {

  it('orders by end, then start, then id, so the picture never depends on the input order', () => {
    const rows = layoutGraph([item('b', true, 2010, 2014), item('c', true, 2012, 2014), item('a', true, 2012, 2014)]).rows.map((r) => r.id);
    expect(rows).toEqual(['a', 'c', 'b']);
  });

  it('forks a side entry that began before every other entry ended into the last row', () => {
    const { rows } = layoutGraph([item('main', true, 2010, 2020), item('side', false, 2009, 2015)]);
    expect(rows.map((r) => r.id)).toEqual(['main', 'side']);
    expect(rows[1].cells[0]).toBe('pass');
  });

  it('reuses a side lane once the earlier side entry has forked back', () => {
    const l = layoutGraph([
      item('m1', true, 2018, 2020), item('s1', false, 2018, 2019), item('m2', true, 2014, 2018),
      item('s2', false, 2014, 2015), item('m3', true, 2010, 2014),
    ]);
    expect(l.laneCount).toBe(2);
  });
});

