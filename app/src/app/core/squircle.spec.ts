import { squirclePath } from './squircle';

const points = (d: string): [number, number][] => [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);

describe('squirclePath', () => {
  const pts = points(squirclePath(400, 60, 22));

  it('starts at the bottom-left corner, where the bottom edge begins, and closes', () => {
    expect(pts[0]).toEqual([22, 60]);
    expect(squirclePath(400, 60, 22).endsWith('Z')).toBe(true);
  });

  it('stays inside the box and touches all four edges', () => {
    for (const [x, y] of pts) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(400);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(60);
    }
    expect(Math.max(...pts.map((p) => p[0]))).toBe(400);
    expect(Math.min(...pts.map((p) => p[0]))).toBe(0);
    expect(Math.min(...pts.map((p) => p[1]))).toBe(0);
  });

  it('runs clockwise: bottom edge to the right first, then up the right edge', () => {
    expect(pts[1][1]).toBe(60);
    expect(pts[1][0]).toBe(378);
    const rightEdge = pts.findIndex(([x, y]) => x === 400 && y === 38);
    expect(rightEdge).toBeGreaterThan(1);
    expect(pts[rightEdge + 1]).toEqual([400, 22]);
  });
});
