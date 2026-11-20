/**
 * Three quick taps on the same kind of thing (a selector), the touch screen's way to the Shift x3 scene: there is no Shift on a phone,
 * and the address button that copies is the one control that is both at the top of the page and at its foot.
 * Any tap elsewhere starts the count again. Returns what removes the listener.
 */
export function onTripleTap(selector: string, onTriple: () => void, windowMs = 900, target: Document = document): () => void {
  let times: number[] = [];
  const click = (e: Event): void => {
    if (!(e.target as Element | null)?.closest?.(selector)) {
      times = [];
      return;
    }
    const now = performance.now();
    times = times.filter((t) => now - t < windowMs);
    times.push(now);
    if (times.length >= 3) {
      times = [];
      onTriple();
    }
  };
  target.addEventListener('click', click, true);
  return () => target.removeEventListener('click', click, true);
}
