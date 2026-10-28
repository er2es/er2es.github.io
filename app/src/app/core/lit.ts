/**
 * Pointer-lit surfaces: while a fine pointer moves over a `.glass`, `.card` or skills `.group` element, its `--mx`/`--my`
 * custom properties follow the pointer so the CSS can draw a soft highlight there. One listener, rAF-throttled.
 * Does nothing for touch, or when the user prefers reduced motion. Returns a cleanup.
 */
export function initLit(): () => void {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => undefined;
  }
  let raf = 0;
  const move = (e: PointerEvent): void => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const el = (e.target as Element | null)?.closest<HTMLElement>('.glass, .card, .group');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  };
  document.addEventListener('pointermove', move, { passive: true });
  return () => {
    document.removeEventListener('pointermove', move);
    if (raf) cancelAnimationFrame(raf);
  };
}
