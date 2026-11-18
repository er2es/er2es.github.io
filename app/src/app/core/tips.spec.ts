import { initTips } from './tips';

describe('initTips', () => {
  const root = document.documentElement;
  afterEach(() => root.classList.remove('tips-off'));

  it('hides the tooltips on Escape and brings them back when the pointer moves or the focus changes', () => {
    const stop = initTips();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(root.classList.contains('tips-off')).toBe(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(root.classList.contains('tips-off')).toBe(true);
    document.dispatchEvent(new Event('pointermove'));
    expect(root.classList.contains('tips-off')).toBe(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    document.dispatchEvent(new Event('focusin'));
    expect(root.classList.contains('tips-off')).toBe(false);
    stop();
  });

  it('lets the next tooltip come at once for a moment after one that was shown has been left, and not otherwise', () => {
    vi.useFakeTimers();
    const tip = document.createElement('a');
    tip.setAttribute('data-tip', 'x');
    const plain = document.createElement('p');
    document.body.append(tip, plain);
    const stop = initTips();
    const fire = (el: Element, type: string, props: object = {}): void => { el.dispatchEvent(Object.assign(new Event(type, { bubbles: true }), props)); };
    fire(tip, 'pointerout'); // left a tooltip that was never shown: no warm-up
    expect(root.classList.contains('tips-warm')).toBe(false);
    fire(tip, 'animationstart', { animationName: 'other' });
    fire(tip, 'pointerout');
    expect(root.classList.contains('tips-warm')).toBe(false);
    fire(tip, 'animationstart', { animationName: 'tip-in' });
    fire(plain, 'pointerout'); // left something that is not a tooltip's element
    expect(root.classList.contains('tips-warm')).toBe(false);
    fire(tip, 'pointerout');
    expect(root.classList.contains('tips-warm')).toBe(true);
    vi.advanceTimersByTime(200);
    fire(tip, 'animationstart', { animationName: 'tip-in' });
    fire(tip, 'pointerout'); // another one left meanwhile: the time starts again
    vi.advanceTimersByTime(200);
    expect(root.classList.contains('tips-warm')).toBe(true);
    vi.advanceTimersByTime(150);
    expect(root.classList.contains('tips-warm')).toBe(false);
    fire(tip, 'animationstart', { animationName: 'tip-in' });
    fire(tip, 'pointerout');
    stop(); // the cleanup takes the warm-up off too
    expect(root.classList.contains('tips-warm')).toBe(false);
    tip.remove();
    plain.remove();
    vi.useRealTimers();
  });

  it('stops listening, and leaves the tooltips on, after the cleanup', () => {
    const stop = initTips();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    stop();
    expect(root.classList.contains('tips-off')).toBe(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(root.classList.contains('tips-off')).toBe(false);
  });
});
