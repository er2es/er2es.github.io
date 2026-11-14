export interface GraphInput { id: string; main: boolean; start: number; end: number }
export type Cell = 'none' | 'pass' | 'node' | 'fork';
/** `hues[k]` is the colour (a lane number, 1 to 3) of what the cell on lane k belongs to: a lane that is used again by a later side entry changes colour. */
export interface GraphRow { id: string; lane: number; cells: Cell[]; hues: number[] }
export interface GraphLayout { laneCount: number; rows: GraphRow[] }

/**
 * One row per entry, newest-finished first (like `git log --graph`); of those that finished together, a main entry comes
 * before a side one, so a side entry sits under the main one it ran beside.
 * Main entries sit on lane 0. A side entry occupies a lane from its own row down to the
 * first row whose entry ended no later than the side entry started (its fork point).
 * Lanes are reused as soon as the previous branch has forked back.
 */
export function layoutGraph(items: readonly GraphInput[]): GraphLayout {
  const sorted = [...items].sort((a, b) => b.end - a.end || Number(b.main) - Number(a.main) || b.start - a.start || a.id.localeCompare(b.id));
  const n = sorted.length;

  const to = sorted.map((it, i) => {
    if (it.main) return i;
    for (let j = i + 1; j < n; j++) if (sorted[j]!.end <= it.start) return j;
    return n - 1;
  });

  const laneEnd: number[] = []; // laneEnd[k - 1] = last row occupied on side lane k
  const lane = sorted.map((it, i) => {
    if (it.main) return 0;
    let k = laneEnd.findIndex((end) => end < i);
    if (k === -1) {
      k = laneEnd.length;
      laneEnd.push(-1);
    }
    laneEnd[k] = to[i]!;
    return k + 1;
  });

  // a side lane used again is drawn in another colour, so that two part-time jobs one after the other are not mistaken for one
  const lastHue: number[] = [];
  const hue = sorted.map((it, i) => {
    if (it.main) return 0;
    const k = lane[i]!;
    const h = lastHue[k] === undefined ? k : (lastHue[k]! % 3) + 1;
    lastHue[k] = h;
    return h;
  });

  const laneCount = Math.max(1, ...lane.map((l) => l + 1));
  const rows = sorted.map((it, r) => {
    const cells: Cell[] = Array<Cell>(laneCount).fill('none');
    const hues: number[] = Array<number>(laneCount).fill(0);
    cells[0] = it.main ? 'node' : 'pass';
    sorted.forEach((o, i) => {
      if (o.main) return;
      const k = lane[i]!;
      if (r === i) cells[k] = 'node';
      else if (r === to[i]) cells[k] = 'fork';
      else if (r > i && r < to[i]!) cells[k] = 'pass';
      else return;
      hues[k] = hue[i]!;
    });
    return { id: it.id, lane: lane[r]!, cells, hues };
  });

  return { laneCount, rows };
}
