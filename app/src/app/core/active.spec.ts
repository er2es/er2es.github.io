import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackActive } from './active';

class FakeIO {
  static disconnected = 0;
  observe(): void {}
  disconnect(): void {
    FakeIO.disconnected++;
  }
}

function setMetrics(scrollY: number, innerHeight: number, scrollHeight: number): void {
  Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true });
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: scrollHeight, configurable: true });
}

describe('trackActive', () => {
  beforeEach(() => {
    FakeIO.disconnected = 0;
    vi.stubGlobal('IntersectionObserver', FakeIO);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('activates the last id when scrolled to the bottom', () => {
    const on = vi.fn();
    const stop = trackActive(['a', 'b', 'c'], on);
    setMetrics(1000, 800, 1800);
    window.dispatchEvent(new Event('scroll'));
    expect(on).toHaveBeenCalledWith('c');
    stop();
  });

  it('does nothing away from the bottom', () => {
    const on = vi.fn();
    const stop = trackActive(['a', 'b', 'c'], on);
    setMetrics(100, 800, 1800);
    window.dispatchEvent(new Event('scroll'));
    expect(on).not.toHaveBeenCalled();
    stop();
  });

  it('cleanup disconnects the observer and removes the scroll listener', () => {
    const on = vi.fn();
    const stop = trackActive(['a', 'b', 'c'], on);
    stop();
    expect(FakeIO.disconnected).toBe(1);
    setMetrics(1000, 800, 1800);
    window.dispatchEvent(new Event('scroll'));
    expect(on).not.toHaveBeenCalled();
  });
});

describe('trackActive without or with partial support', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('does nothing where there is no IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const on = vi.fn();
    const stop = trackActive(['a'], on);
    window.dispatchEvent(new Event('scroll'));
    expect(on).not.toHaveBeenCalled();
    expect(stop()).toBeUndefined();
  });

  it('reports only the sections in the band, and skips ids that are not on the page', () => {
    let callback: (entries: { isIntersecting: boolean; target: { id: string } }[]) => void = () => undefined;
    const observed: Element[] = [];
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb: typeof callback) { callback = cb; }
      observe(el: Element): void { observed.push(el); }
      disconnect(): void {}
    });
    const here = document.createElement('section');
    here.id = 'here';
    document.body.appendChild(here);
    const on = vi.fn();
    const stop = trackActive(['here', 'gone'], on);
    expect(observed).toEqual([here]);
    callback([{ isIntersecting: false, target: { id: 'a' } }, { isIntersecting: true, target: { id: 'b' } }]);
    expect(on.mock.calls).toEqual([['b']]);
    stop();
    here.remove();
  });
});
