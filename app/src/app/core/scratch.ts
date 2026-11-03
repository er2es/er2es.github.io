/** The maths of the scratch card on the portrait (egg/scratch.ts does the drawing). No DOM in here. */

/** The share (0 to 1) of the pixels of an RGBA image that are mostly see-through, i.e. scratched away. */
export function clearedShare(rgba: ArrayLike<number>): number {
  const pixels = rgba.length / 4;
  if (!pixels) return 0;
  let cleared = 0;
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] < 128) cleared++;
  return cleared / pixels;
}

/** Which of `count` prizes comes next: a random one, never the one that was shown last (when there is more than one). */
export function nextPrize(count: number, last: number | null, random: () => number = Math.random): number {
  if (count <= 1) return 0;
  if (last === null) return Math.floor(random() * count);
  const pick = Math.floor(random() * (count - 1)); // one fewer to draw from: the last one is left out
  return pick < last ? pick : pick + 1;
}
