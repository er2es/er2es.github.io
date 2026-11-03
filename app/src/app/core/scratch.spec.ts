import { clearedShare, nextPrize } from './scratch';

describe('clearedShare', () => {
  it('is the share of the pixels whose alpha is below half', () => {
    expect(clearedShare([])).toBe(0);
    expect(clearedShare([9, 9, 9, 255, 9, 9, 9, 255])).toBe(0); // all still covered
    expect(clearedShare([9, 9, 9, 0, 9, 9, 9, 0])).toBe(1);
    expect(clearedShare([9, 9, 9, 0, 9, 9, 9, 255, 9, 9, 9, 127, 9, 9, 9, 128])).toBe(0.5);
  });
});

describe('nextPrize', () => {
  it('is index 0 when there is nothing to choose from', () => {
    expect(nextPrize(1, null)).toBe(0);
    expect(nextPrize(0, 0)).toBe(0);
  });

  it('is any of the prizes the first time', () => {
    expect(nextPrize(4, null, () => 0)).toBe(0);
    expect(nextPrize(4, null, () => 0.999)).toBe(3);
  });

  it('never repeats the last one, and can still reach all the others', () => {
    const seen = new Set<number>();
    for (const r of [0, 0.34, 0.67, 0.999]) seen.add(nextPrize(4, 2, () => r));
    expect(seen.has(2)).toBe(false);
    expect([...seen].sort()).toEqual([0, 1, 3]);
    expect(nextPrize(4, 0, () => 0)).toBe(1); // after the last one the numbers shift up
    expect(nextPrize(4, 3, () => 0.999)).toBe(2); // and before it they stay
  });
});
