/**
 * Calls `onTriple` when Shift is pressed three times in a row within `windowMs`, with no other key in between
 * (so typing capital letters never triggers it). Key repeat from holding Shift is ignored. Returns a cleanup.
 */
export function onTripleShift(onTriple: () => void, windowMs = 700, target: Window = window): () => void {
  let times: number[] = [];
  const down = (e: KeyboardEvent): void => {
    if (e.key !== 'Shift') {
      times = [];
      return;
    }
    if (e.repeat) return;
    const now = performance.now();
    times = times.filter((t) => now - t < windowMs);
    times.push(now);
    if (times.length >= 3) {
      times = [];
      onTriple();
    }
  };
  target.addEventListener('keydown', down);
  return () => target.removeEventListener('keydown', down);
}
