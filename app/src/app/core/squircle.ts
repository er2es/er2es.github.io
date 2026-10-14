/**
 * The outline of a rounded box whose corners are squircles (superellipse, exponent 4: what `corner-shape: squircle`
 * draws), as an SVG path that starts at the bottom-left corner and runs clockwise, like the header's progress line.
 */
export function squirclePath(w: number, h: number, r: number, steps = 14): string {
  const corner = (cx: number, cy: number, sx: number, sy: number, from: number): string => {
    let d = '';
    for (let i = 1; i <= steps; i++) {
      const t = from + (i / steps) * (Math.PI / 2);
      const c = Math.cos(t);
      const s = Math.sin(t);
      // exponent 4: |cos|^(2/4) = sqrt(|cos|)
      d += ` L${(cx + sx * r * Math.sqrt(Math.abs(c))).toFixed(2)} ${(cy + sy * r * Math.sqrt(Math.abs(s))).toFixed(2)}`;
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
