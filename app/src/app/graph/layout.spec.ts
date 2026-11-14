import { FACTS } from '../content/model';
import { layoutGraph, type GraphInput } from './layout';

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

  it('draws a side lane through the rows it spans and forks it where the main line was when the side job began', () => {
    const { rows } = layoutGraph([item('m1', true, 2018, 2022), item('s', false, 2010, 2021), item('m2', true, 2014, 2018), item('m3', true, 2010, 2014)]);
    expect(rows.map((r) => r.id)).toEqual(['m1', 's', 'm2', 'm3']);
    expect(rows[1]!.cells[1]).toBe('node');
    expect(rows[2]!.cells[1]).toBe('pass'); // the lane runs on past m2
    expect(rows[3]!.cells[1]).toBe('fork'); // and joins the main line at the last row
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

  it('never lets two side branches overlap on the same lane', () => {
    const { rows } = layoutGraph(real);
    for (let k = 1; k < layoutGraph(real).laneCount; k++) {
      let open = false;
      for (const r of rows) {
        const c = r.cells[k];
        if (c === 'node') { expect(open).toBe(false); open = true; }
        if (c === 'fork') { expect(open).toBe(true); open = false; }
      }
      expect(open).toBe(false);
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
