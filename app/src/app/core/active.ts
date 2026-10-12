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
  return () => io.disconnect();
}
