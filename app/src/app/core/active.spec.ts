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
