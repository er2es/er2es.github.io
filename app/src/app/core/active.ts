export function trackActive(ids: readonly string[], onActive: (id: string) => void): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => undefined;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) onActive(e.target.id);
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  }
  // The last section can be too short to reach the observer band: at the very bottom it wins.
  const onScroll = (): void => {
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) onActive(ids[ids.length - 1]);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    io.disconnect();
    window.removeEventListener('scroll', onScroll);
  };
}
