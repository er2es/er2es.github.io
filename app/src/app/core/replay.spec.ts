import { replayOnReturn } from './replay';

type Cb = (entries: { isIntersecting: boolean; intersectionRatio: number }[]) => void;

describe('replayOnReturn', () => {
  let cb: Cb;
  let el: HTMLElement;
  const see = (ratio: number) => cb([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('IntersectionObserver', class {
      constructor(fn: Cb) { cb = fn; }
      observe() {}
      disconnect() {}
    });
    el = document.createElement('div');
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('does not play while the element is in view from the start, only after it left and came back', () => {
    const stop = replayOnReturn(el, 'x', 900, 1200);
    see(1);
    vi.advanceTimersByTime(200);
    expect(el.classList.contains('x')).toBe(false);
    see(0);
    see(1);
    vi.advanceTimersByTime(130);
    expect(el.classList.contains('x')).toBe(true);
    vi.advanceTimersByTime(900);
    expect(el.classList.contains('x')).toBe(false);
    stop();
  });

  it('ignores a pass-through and respects the cooldown', () => {
    const stop = replayOnReturn(el, 'x', 900, 1200);
    see(0);
    see(1);
    see(0); // a scroll jump flew past
    vi.advanceTimersByTime(130);
    expect(el.classList.contains('x')).toBe(false);
    see(1);
    vi.advanceTimersByTime(130);
    expect(el.classList.contains('x')).toBe(true);
    see(0);
    see(1); // back too soon
    vi.advanceTimersByTime(130);
    vi.advanceTimersByTime(900);
    expect(el.classList.contains('x')).toBe(false);
    stop();
  });

  it('does nothing under reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    cb = () => undefined;
    const stop = replayOnReturn(el, 'x');
    see(0);
    see(1);
    vi.advanceTimersByTime(500);
    expect(el.classList.contains('x')).toBe(false);
    stop();
  });
});
