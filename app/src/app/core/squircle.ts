/**
 * The outline of a rounded box whose corners are superellipses (exponent 4 by default: what `corner-shape: squircle`
 * draws; 2 is the plain circular corner of `border-radius`), as an SVG path that starts at the bottom-left corner and runs clockwise, like the header's progress line.
 */
export function squirclePath(w: number, h: number, r: number, exponent = 4, steps = 14): string {
  const corner = (cx: number, cy: number, sx: number, sy: number, from: number): string => {
    let d = '';
    for (let i = 1; i <= steps; i++) {
      const t = from + (i / steps) * (Math.PI / 2);
      const c = Math.cos(t);
      const s = Math.sin(t);
      d += ` L${(cx + sx * r * Math.abs(c) ** (2 / exponent)).toFixed(2)} ${(cy + sy * r * Math.abs(s) ** (2 / exponent)).toFixed(2)}`;
    }
    return d;
  };
  // bottom edge to the right, then up the right edge, along the top edge to the left, down the left edge
  return (
    `M${r} ${h} L${w - r} ${h}` + corner(w - r, h - r, 1, 1, -Math.PI / 2) +
    ` L${w} ${r}` + corner(w - r, r, 1, -1, 0) +
    ` L${r} 0` + corner(r, r, -1, -1, Math.PI / 2) +
    ` L0 ${h - r}` + corner(r, h - r, -1, 1, Math.PI) + ' Z'
  );
}
