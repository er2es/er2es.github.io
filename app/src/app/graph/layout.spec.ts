import { FACTS } from '../content/model';
import { layoutGraph, type GraphInput } from './layout';

const real: GraphInput[] = FACTS.filter((f) => f.inGraph).map((f) => ({
  id: f.id, main: f.main, start: f.start!, end: f.end!,
}));

describe('layoutGraph', () => {
  it('orders newest-finished first and keeps main entries on lane 0', () => {
    const { rows } = layoutGraph(real);
    expect(rows.map((r) => r.id)).toEqual([
      'chamber', 'uni-med', 'uni-admin', 'welfare', 'health-inst', 'edu-authority', 'pricing-co', 'edu-nonprofit',
    ]);
    for (const r of rows) {
      const main = real.find((x) => x.id === r.id)!.main;
      expect(r.lane === 0).toBe(main);
      expect(r.cells[0]).toBe(main ? 'node' : 'pass');
    }
  });

  it('puts the two overlapping jobs on two side lanes next to the main line', () => {
    const { laneCount, rows } = layoutGraph(real);
    expect(laneCount).toBe(3);
    const lane = Object.fromEntries(rows.map((r) => [r.id, r.lane]));
    expect(lane['welfare']).toBe(1);
    expect(lane['health-inst']).toBe(2);
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
