import type { GraphRow } from './layout';

export const LANE_W = 16;
export const NODE_Y = 22;

export interface Line { x: number; y1: number; y2: number | '100%'; lane: number }
export interface Curve { d: string; lane: number }
export interface Dot { x: number; y: number; r: number; lane: number }
export interface Rail { width: number; lines: Line[]; curves: Curve[]; dots: Dot[] }

const x = (lane: number): number => lane * LANE_W + LANE_W / 2;

/** Merge: lane 0 (row top) down into the side node. Fork: side lane (row top) into lane 0. */
const curve = (fromLane: number, toLane: number): string => {
  const x1 = x(fromLane);
  const x2 = x(toLane);
  return `M${x1},0 C${x1},${NODE_Y * 0.55} ${x2},${NODE_Y * 0.45} ${x2},${NODE_Y}`;
};

export function railGeometry(row: GraphRow, laneCount: number, isFirst: boolean, isLast: boolean): Rail {
  const lines: Line[] = [];
  const curves: Curve[] = [];
  const dots: Dot[] = [];

  row.cells.forEach((cell, k) => {
    if (k === 0) {
      lines.push({ x: x(0), y1: isFirst ? NODE_Y : 0, y2: isLast ? NODE_Y : '100%', lane: 0 });
      if (cell === 'node') dots.push({ x: x(0), y: NODE_Y, r: 5, lane: 0 });
      return;
    }
    if (cell === 'pass') lines.push({ x: x(k), y1: 0, y2: '100%', lane: k });
    if (cell === 'node') {
      lines.push({ x: x(k), y1: NODE_Y, y2: '100%', lane: k });
      curves.push({ d: curve(0, k), lane: k });
      dots.push({ x: x(k), y: NODE_Y, r: 4, lane: k });
    }
    if (cell === 'fork') curves.push({ d: curve(k, 0), lane: k });
  });

  return { width: laneCount * LANE_W, lines, curves, dots };
}
