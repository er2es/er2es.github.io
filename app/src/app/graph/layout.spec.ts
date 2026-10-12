import { FACTS } from '../content/model';
import { layoutGraph, type GraphInput } from './layout';

const real: GraphInput[] = FACTS.filter((f) => f.inGraph).map((f) => ({
  id: f.id, main: f.main, start: f.start!, end: f.end!,
}));

describe('layoutGraph', () => {
  it('orders newest-finished first and keeps main entries on lane 0', () => {
    const { rows } = layoutGraph(real);
    expect(rows.map((r) => r.id)).toEqual([
      'chamber', 'uni-med', 'wordpress', 'uni-admin', 'welfare', 'health-inst', 'sport-programme', 'edu-authority', 'pricing-co', 'edu-nonprofit',
    ]);
    for (const r of rows) {
      const main = real.find((x) => x.id === r.id)!.main;
      expect(r.lane === 0).toBe(main);
      expect(r.cells[0]).toBe(main ? 'node' : 'pass');
    }
  });

  it('packs the real career into four lanes with reuse', () => {
    const { laneCount, rows } = layoutGraph(real);
    expect(laneCount).toBe(4);
    const lane = Object.fromEntries(rows.map((r) => [r.id, r.lane]));
    expect(lane['wordpress']).toBe(1);
    expect(lane['welfare']).toBe(2);
    expect(lane['health-inst']).toBe(3);
    expect(lane['sport-programme']).toBe(1); // reuses lane 1 after wordpress forked back
  });

  it('never lets two side branches overlap on the same lane', () => {
    const { rows } = layoutGraph(real);
    for (let k = 1; k < 4; k++) {
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
