export interface GraphInput { id: string; main: boolean; start: number; end: number }
export type Cell = 'none' | 'pass' | 'node' | 'fork';
export interface GraphRow { id: string; lane: number; cells: Cell[] }
export interface GraphLayout { laneCount: number; rows: GraphRow[] }

/**
 * One row per entry, newest-finished first (like `git log --graph`).
 * Main entries sit on lane 0. A side entry occupies a lane from its own row down to the
 * first row whose entry ended no later than the side entry started (its fork point).
 * Lanes are reused as soon as the previous branch has forked back.
 */
export function layoutGraph(items: readonly GraphInput[]): GraphLayout {
  const sorted = [...items].sort((a, b) => b.end - a.end || b.start - a.start || a.id.localeCompare(b.id));
  const n = sorted.length;

  const to = sorted.map((it, i) => {
    if (it.main) return i;
    for (let j = i + 1; j < n; j++) if (sorted[j].end <= it.start) return j;
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
    laneEnd[k] = to[i];
    return k + 1;
  });

  const laneCount = Math.max(1, ...lane.map((l) => l + 1));
  const rows = sorted.map((it, r) => {
    const cells: Cell[] = Array<Cell>(laneCount).fill('none');
    cells[0] = it.main ? 'node' : 'pass';
    sorted.forEach((o, i) => {
      if (o.main) return;
      if (r === i) cells[lane[i]] = 'node';
      else if (r === to[i]) cells[lane[i]] = 'fork';
      else if (r > i && r < to[i]) cells[lane[i]] = 'pass';
    });
    return { id: it.id, lane: lane[r], cells };
  });

  return { laneCount, rows };
}
