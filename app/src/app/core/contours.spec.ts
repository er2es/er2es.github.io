import { SPACING, contourSegments, fieldAt, spacingAt } from './contours';

describe('spacingAt', () => {
  it('is the stop value at each stop, eased between two of them, and clamped at both ends', () => {
    SPACING.forEach((s, i) => expect(spacingAt(i)).toBeCloseTo(s));
    expect(spacingAt(-3)).toBe(SPACING[0]);
    expect(spacingAt(99)).toBe(SPACING[SPACING.length - 1]);
    const mid = spacingAt(0.5); // halfway between the first two stops
    expect(mid).toBeCloseTo((SPACING[0] + SPACING[1]) / 2);
    expect(spacingAt(0.25)).toBeGreaterThan(mid); // eased: the way down from the first stop is slow at first
  });
});

describe('fieldAt', () => {
  it('is a smooth bounded field that moves with t', () => {
    expect(Math.abs(fieldAt(10, 20, 0))).toBeLessThan(4);
    expect(fieldAt(10, 20, 0)).not.toBeCloseTo(fieldAt(10, 20, 1));
  });

  it('is raised around the pointer, by its strength, and not at all without it', () => {
    const base = fieldAt(300, 300, 0);
    expect(fieldAt(300, 300, 0, { x: 300, y: 300, k: 1 })).toBeCloseTo(base + 1.4);
    expect(fieldAt(300, 300, 0, { x: 300, y: 300, k: 0.5 })).toBeCloseTo(base + 0.7);
    expect(fieldAt(300, 300, 0, { x: 300, y: 300, k: 0 })).toBe(base);
    expect(fieldAt(300, 300, 0, { x: 2000, y: 2000, k: 1 })).toBeCloseTo(base, 3); // far away: no effect
  });
});

describe('contourSegments', () => {
  /** One cell (a 2x2 grid), corners a (top left), b (top right), d (bottom left), e (bottom right), level 0.5. */
  const cell = (a: number, b: number, d: number, e: number): number[] => {
    const out: number[] = [];
    contourSegments([a, b, d, e], 2, 2, 10, 0.5, out);
    return out;
  };

  it('draws nothing where every corner is on the same side', () => {
    expect(cell(0, 0, 0, 0)).toEqual([]);
    expect(cell(1, 1, 1, 1)).toEqual([]);
  });

  it('draws one segment for every other pattern of corners, and two for the two saddles', () => {
    for (let idx = 1; idx < 15; idx++) {
      const hi = (bit: number): number => (idx & bit ? 1 : 0);
      const out = cell(hi(8), hi(4), hi(1), hi(2));
      expect(out.length).toBe(idx === 5 || idx === 10 ? 8 : 4);
      expect(out.every((n) => n >= 0 && n <= 10)).toBe(true); // inside the cell
    }
  });

  it('puts a crossing where the field passes the level, between the two corners', () => {
    // a vertical edge between the left corners (0) and the right ones (1): the level 0.5 is halfway
    expect(cell(0, 1, 0, 1)).toEqual([5, 0, 5, 10]);
    // a slanted one: only the top right corner is high (0.75), so the line cuts the top and the right side
    const [x1, y1, x2, y2] = cell(0, 0.75, 0, 0);
    expect(x1).toBeCloseTo(10 * (0.5 / 0.75));
    expect(y1).toBe(0);
    expect(x2).toBe(10);
    expect(y2).toBeCloseTo(10 * (0.25 / 0.75));
  });

  it('walks a whole grid, row by row, and adds to what is already in the list', () => {
    const out: number[] = [9];
    const f = [0, 0, 0, 0, 1, 0, 0, 0, 0]; // 3x3, one high point in the middle
    contourSegments(f, 3, 3, 10, 0.5, out);
    expect(out[0]).toBe(9);
    expect((out.length - 1) / 4).toBe(4); // the ring around the middle point: one segment in each of the four cells
  });
});
