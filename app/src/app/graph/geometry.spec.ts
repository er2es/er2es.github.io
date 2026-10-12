import { railGeometry, LANE_W, NODE_Y } from './geometry';
import type { GraphRow } from './layout';

const row = (cells: GraphRow['cells'], lane = 0): GraphRow => ({ id: 'x', lane, cells });

describe('railGeometry', () => {
  it('draws a main node with a line that starts at the node on the first row', () => {
    const r = railGeometry(row(['node', 'none']), 2, true, false);
    expect(r.width).toBe(2 * LANE_W);
    expect(r.lines).toEqual([{ x: LANE_W / 2, y1: NODE_Y, y2: '100%', lane: 0 }]);
    expect(r.dots).toEqual([{ x: LANE_W / 2, y: NODE_Y, r: 5, lane: 0 }]);
  });

  it('ends the main line at the node on the last row', () => {
    const r = railGeometry(row(['node']), 1, false, true);
    expect(r.lines).toEqual([{ x: LANE_W / 2, y1: 0, y2: NODE_Y, lane: 0 }]);
  });

  it('draws a side node with a merge curve to lane 0', () => {
    const r = railGeometry(row(['pass', 'node'], 1), 2, false, false);
    expect(r.curves).toHaveLength(1);
    expect(r.curves[0].lane).toBe(1);
    expect(r.curves[0].d.startsWith(`M${LANE_W / 2},0`)).toBe(true);
    expect(r.dots.find((d) => d.lane === 1)?.r).toBe(4);
  });

  it('draws a fork curve and no vertical line on the fork lane', () => {
    const r = railGeometry(row(['node', 'fork']), 2, false, false);
    expect(r.curves.some((c) => c.lane === 1)).toBe(true);
    expect(r.lines.some((l) => l.lane === 1)).toBe(false);
  });
});
