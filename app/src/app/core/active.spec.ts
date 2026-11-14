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

  it('reports the section in the band, skips ids that are not on the page, and names a section once', () => {
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
    setMetrics(100, 800, 1800);
    const on = vi.fn();
    const stop = trackActive(['here', 'gone', 'b'], on);
    expect(observed).toEqual([here]);
    callback([{ isIntersecting: false, target: { id: 'a' } }, { isIntersecting: true, target: { id: 'b' } }]);
    callback([{ isIntersecting: true, target: { id: 'b' } }]);
    expect(on.mock.calls).toEqual([['b']]);
    stop();
    here.remove();
  });

  it('names the section that stayed in the band again once the page is no longer at the bottom', () => {
    let callback: (entries: { isIntersecting: boolean; target: { id: string } }[]) => void = () => undefined;
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb: typeof callback) { callback = cb; }
      observe(): void {}
      disconnect(): void {}
    });
    setMetrics(500, 800, 1800);
    const on = vi.fn();
    const stop = trackActive(['about', 'contact'], on);
    callback([{ isIntersecting: true, target: { id: 'about' } }]); // About is in the band
    setMetrics(1000, 800, 1800);
    window.dispatchEvent(new Event('scroll')); // the very bottom: Contact wins
    setMetrics(900, 800, 1800);
    window.dispatchEvent(new Event('scroll')); // a little up: About is still in the band, and is named again
    expect(on.mock.calls).toEqual([['about'], ['contact'], ['about']]);
    callback([{ isIntersecting: true, target: { id: 'contact' } }]); // two meet at a boundary: the later one
    expect(on.mock.calls[3]).toEqual(['contact']);
    stop();
  });
});
