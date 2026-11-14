/**
 * Reports which section the reader is in: the one in the thin band across the middle of the window; at the very bottom
 * the last one (it can be too short to reach the band). It is worked out afresh at every change and every scroll, from the
 * sections that are in the band now: an observer only reports a section when it enters or leaves, so a section that stayed in
 * the band while the bottom rule had the last one (About, above a short Contact) would never be named again on the way up.
 * Being at the bottom sticks until the reader scrolls away from it (more than 40px): the page growing under a reader who
 * is at the end (content that arrives late) is not the reader leaving.
 */
export function trackActive(ids: readonly string[], onActive: (id: string) => void): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => undefined;
  const inBand = new Set<string>();
  let shown = '';
  let atEnd = false;
  const show = (scrolled: boolean): void => {
    const left = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight); // how far from the very end
    if (left <= 2) atEnd = true;
    else if (scrolled && left > 40) atEnd = false;
    // of those in the band, the last one on the page (two meet only at a boundary)
    const id = atEnd ? ids[ids.length - 1]! : [...inBand].sort((a, b) => ids.indexOf(a) - ids.indexOf(b)).pop();
    if (id !== undefined && id !== shown) {
      shown = id;
      onActive(id);
    }
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) inBand.add(e.target.id);
        else inBand.delete(e.target.id);
      }
      show(false);
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  }
  const onScroll = (): void => show(true);
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    io.disconnect();
    window.removeEventListener('scroll', onScroll);
  };
}
