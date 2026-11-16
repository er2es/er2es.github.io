import type { GraphRow } from './layout';

export const LANE_W = 16;
export const NODE_Y = 22;
/** How far below its node a line that leaves the main line takes to be on its own lane. */
const SPLIT = 16;

export interface Line { x: number; y1: number; y2: number | '100%'; lane: number }
export interface Curve { d: string; lane: number; dashed?: boolean }
export interface Dot { x: number; y: number; r: number; lane: number }
export interface Rail { width: number; lines: Line[]; curves: Curve[]; dots: Dot[] }

const x = (lane: number): number => lane * LANE_W + LANE_W / 2;

/** Merge: lane 0 (row top) down into the side node. Fork: side lane (row top) into lane 0. */
const curve = (fromLane: number, toLane: number): string => {
  const x1 = x(fromLane);
  const x2 = x(toLane);
  return `M${x1},0 C${x1},${NODE_Y * 0.55} ${x2},${NODE_Y * 0.45} ${x2},${NODE_Y}`;
};

/** Split: from the main line's node, down and out to the side lane. */
const split = (toLane: number): string => {
  const x1 = x(0);
  const x2 = x(toLane);
  return `M${x1},${NODE_Y} C${x1},${NODE_Y + SPLIT * 0.55} ${x2},${NODE_Y + SPLIT * 0.45} ${x2},${NODE_Y + SPLIT}`;
};

/** Rejoin: from a side node, down and back into the main line. */
const rejoin = (fromLane: number): string => {
  const x1 = x(fromLane);
  const x2 = x(0);
  return `M${x1},${NODE_Y} C${x1},${NODE_Y + SPLIT * 0.55} ${x2},${NODE_Y + SPLIT * 0.45} ${x2},${NODE_Y + SPLIT}`;
};

export function railGeometry(row: GraphRow, laneCount: number, isFirst: boolean, isLast: boolean): Rail {
  const lines: Line[] = [];
  const curves: Curve[] = [];
  const dots: Dot[] = [];

  row.cells.forEach((cell, k) => {
    if (k === 0) {
      lines.push({ x: x(0), y1: isFirst ? NODE_Y : 0, y2: isLast ? NODE_Y : '100%', lane: 0 });
      if (cell === 'node') dots.push({ x: x(0), y: NODE_Y, r: 6.25, lane: 0 });
      return;
    }
    const hue = row.hues[k]!; // the colour: the lane's, unless it is used again
    if (cell === 'pass') lines.push({ x: x(k), y1: 0, y2: '100%', lane: hue });
    if (cell === 'node') {
      lines.push({ x: x(k), y1: NODE_Y, y2: '100%', lane: hue });
      curves.push({ d: curve(0, k), lane: hue });
    }
    if (cell === 'tip') {
      lines.push({ x: x(k), y1: 0, y2: NODE_Y, lane: hue });
      curves.push({ d: rejoin(k), lane: hue, dashed: true }); // the part-time role ended: a thin dashed hairline back into the main line
    }
    if (cell === 'mid') lines.push({ x: x(k), y1: 0, y2: '100%', lane: hue });
    if (cell === 'split') {
      curves.push({ d: split(k), lane: hue });
      lines.push({ x: x(k), y1: NODE_Y + SPLIT, y2: '100%', lane: hue });
    }
    if (cell === 'fork') curves.push({ d: curve(k, 0), lane: hue });
    if (cell === 'node' || cell === 'tip' || cell === 'mid') dots.push({ x: x(k), y: NODE_Y, r: 5, lane: hue });
  });

  return { width: laneCount * LANE_W, lines, curves, dots };
}
