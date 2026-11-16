export interface GraphInput { id: string; main: boolean; start: number; end: number }
/**
 * What a row draws on a side lane:
 *  - `node`: the side entry's own node, the line starting there and running down (it merges from the main line at the top of the row);
 *  - `tip`: its node, the line arriving from above and ending there;
 *  - `mid`: its node on a line that runs through;
 *  - `split`: a main row where the line leaves the main line, going down;
 *  - `fork`: a row where the line joins the main line, coming from above;
 *  - `pass`: the line runs through.
 */
export type Cell = 'none' | 'pass' | 'node' | 'tip' | 'mid' | 'split' | 'fork';
/** `hues[k]` is the colour (a lane number, 1 to 3) of what the cell on lane k belongs to: a lane that is used again by a later side entry changes colour. */
export interface GraphRow { id: string; lane: number; cells: Cell[]; hues: number[] }
export interface GraphLayout { laneCount: number; rows: GraphRow[] }

/** Whether two entries ran at the same time (the end of one is the start of the next: that is not an overlap). */
const together = (a: GraphInput, b: GraphInput): boolean => a.start < b.end && a.end > b.start;

/**
 * One row per entry, newest-finished first (like `git log --graph`); of those that finished together, a main entry comes
 * before a side one, so a side entry sits under the main one it ran beside.
 * Main entries sit on lane 0. A side entry has a line on a lane of its own that runs from its row to the main entries it ran
 * beside (above it, below it, or both): it leaves the main line at the first of them and joins it again at the last, so
 * the line stands next to exactly the entries it was parallel to. A side entry that ran beside no main entry is
 * drawn as in a git log, down to where the main line was when it began.
 * Lanes are reused as soon as the previous line has joined back.
 */
export function layoutGraph(items: readonly GraphInput[]): GraphLayout {
  const sorted = [...items].sort((a, b) => b.end - a.end || Number(b.main) - Number(a.main) || b.start - a.start || a.id.localeCompare(b.id));
  const n = sorted.length;

  /** The rows a side entry's line spans. */
  const span = sorted.map((it, i) => {
    if (it.main) return { top: i, bottom: i };
    const beside = sorted.flatMap((o, j) => (o.main && together(o, it) ? [j] : []));
    if (beside.length) return { top: Math.min(i, ...beside), bottom: Math.max(i, ...beside) };
    let j = i + 1;
    while (j < n && sorted[j]!.end > it.start) j++;
    return { top: i, bottom: Math.min(j, n - 1) };
  });

  // lanes and colours are given in the order the lines begin
  const order = sorted.map((_, i) => i).filter((i) => !sorted[i]!.main).sort((a, b) => span[a]!.top - span[b]!.top || a - b);
  const lane = sorted.map(() => 0);
  const hue = sorted.map(() => 0);
  const laneEnd: number[] = []; // laneEnd[k - 1] = the last row the line on side lane k occupies
  const lastHue: number[] = []; // a side lane used again is drawn in another colour, so that two part-time jobs one after the other are not mistaken for one
  for (const i of order) {
    const { top, bottom } = span[i]!;
    let k = laneEnd.findIndex((end) => end < top);
    if (k === -1) {
      k = laneEnd.length;
      laneEnd.push(-1);
    }
    laneEnd[k] = bottom;
    lane[i] = k + 1;
    const h = lastHue[k + 1] === undefined ? k + 1 : (lastHue[k + 1]! % 3) + 1;
    lastHue[k + 1] = h;
    hue[i] = h;
  }

  /** What entry `i`'s line draws on row `r`. */
  const kind = (i: number, r: number): Cell => {
    const { top, bottom } = span[i]!;
    if (r < top || r > bottom) return 'none';
    if (r === i) return top < i ? (bottom > i ? 'mid' : 'tip') : 'node';
    if (r === top && top < i) return 'split';
    if (r === bottom && bottom > i) return 'fork';
    return 'pass';
  };

  const laneCount = Math.max(1, ...lane.map((l) => l + 1));
  const rows = sorted.map((it, r) => {
    const cells: Cell[] = Array<Cell>(laneCount).fill('none');
    const hues: number[] = Array<number>(laneCount).fill(0);
    cells[0] = it.main ? 'node' : 'pass';
    sorted.forEach((o, i) => {
      if (o.main) return;
      const c = kind(i, r);
      if (c === 'none') return;
      cells[lane[i]!] = c;
      hues[lane[i]!] = hue[i]!;
    });
    return { id: it.id, lane: lane[r]!, cells, hues };
  });

  return { laneCount, rows };
}
