/**
 * Replays an entrance whenever `el` comes back into view after having been fully out of view: the class `cls` is
 * re-added (CSS owns the animation) and removed again after `ms`. Guards: a cooldown so the boundary cannot
 * flicker it, and a short settle check so a smooth scroll jump that only passes through does not trigger it.
 * Does nothing under reduced motion or without IntersectionObserver. Returns a cleanup.
 */
export function replayOnReturn(el: HTMLElement, cls: string, ms = 900, cooldown = 1200): () => void {
  if (typeof IntersectionObserver === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined;
  let armed = false; // only after the element has been fully out of view
  let visible = false;
  let last = -Infinity;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const later = (fn: () => void, t: number) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, t);
    timers.add(id);
  };
  const play = (): void => {
    if (!visible || !armed || performance.now() - last < cooldown) return;
    armed = false;
    last = performance.now();
    el.classList.remove(cls);
    void el.offsetWidth; // restart the animation
    el.classList.add(cls);
    later(() => el.classList.remove(cls), ms);
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting && e.intersectionRatio >= 0.2;
    if (!e.isIntersecting) armed = true;
    else if (visible && armed) later(play, 120); // still there a moment later: the visitor has arrived
  }, { threshold: [0, 0.2] });
  io.observe(el);
  return () => {
    io.disconnect();
    timers.forEach(clearTimeout);
    el.classList.remove(cls);
  };
}
