/**
 * The maths of the background contour lines (shell/backdrop.ts draws them): a smooth field over the page, the level lines of
 * that field found by marching squares, and how dense the lines are in each part of the page. No DOM in here.
 */

/** Distance between two level lines (in field units) at each of the five stops down the page: sparse, dense, medium, dense, sparse. */
export const SPACING: readonly number[] = [0.95, 0.5, 0.75, 0.55, 1.05];

const smooth = (t: number): number => t * t * (3 - 2 * t);

/** The line spacing for a position `p` down the page, 0 (top) to `SPACING.length - 1` (bottom), eased between the stops. */
export function spacingAt(p: number): number {
  const last = SPACING.length - 1;
  const clamped = Math.min(last, Math.max(0, p));
  const i = Math.min(last - 1, Math.floor(clamped));
  const f = smooth(clamped - i);
  return SPACING[i]! + (SPACING[i + 1]! - SPACING[i]!) * f;
}

/** A pointer that bends the field: a soft bump of strength `k` (0 to 1) at (`x`, `y`). */
export interface Bump { x: number; y: number; k: number }

/** The field: a few slow waves that move with `t` (the scroll position), and the bump the pointer makes. */
export function fieldAt(x: number, y: number, t: number, bump?: Bump): number {
  let v = Math.sin(x * 0.0042 + t * 1.1) + Math.sin(y * 0.0065 - t * 0.8) + Math.sin((x + y) * 0.0034 + t * 0.6)
    + 0.6 * Math.sin(Math.hypot(x * 0.7, y) * 0.005 - t);
  if (bump && bump.k > 0.001) v += bump.k * 1.4 * Math.exp(-((x - bump.x) ** 2 + (y - bump.y) ** 2) / (2 * 150 * 150));
  return v;
}

/**
 * The line segments of one level of a field sampled on a grid (`cols` x `rows` points, `cell` apart), by marching squares.
 * Pushes x1, y1, x2, y2 for every segment onto `out`.
 */
export function contourSegments(f: ArrayLike<number>, cols: number, rows: number, cell: number, level: number, out: number[]): void {
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = f[r * cols + c]!;
      const b = f[r * cols + c + 1]!;
      const d = f[(r + 1) * cols + c]!;
      const e = f[(r + 1) * cols + c + 1]!;
      const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (e > level ? 2 : 0) | (d > level ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const x = c * cell;
      const y = r * cell;
      // where the level crosses each side of the cell (only read for the sides it does cross)
      const top = x + (cell * (level - a)) / (b - a);
      const bottom = x + (cell * (level - d)) / (e - d);
      const left = y + (cell * (level - a)) / (d - a);
      const right = y + (cell * (level - b)) / (e - b);
      const seg = (x1: number, y1: number, x2: number, y2: number): void => void out.push(x1, y1, x2, y2);
      switch (idx) {
        case 1: case 14: seg(x, left, bottom, y + cell); break;
        case 2: case 13: seg(bottom, y + cell, x + cell, right); break;
        case 3: case 12: seg(x, left, x + cell, right); break;
        case 4: case 11: seg(top, y, x + cell, right); break;
        case 5: seg(x, left, top, y); seg(bottom, y + cell, x + cell, right); break;
        case 6: case 9: seg(top, y, bottom, y + cell); break;
        case 7: case 8: seg(x, left, top, y); break;
        default: seg(top, y, x + cell, right); seg(x, left, bottom, y + cell); // 10
      }
    }
  }
}
