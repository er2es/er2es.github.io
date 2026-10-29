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

  it('stops listening, and leaves the tooltips on, after the cleanup', () => {
    const stop = initTips();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    stop();
    expect(root.classList.contains('tips-off')).toBe(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(root.classList.contains('tips-off')).toBe(false);
  });
});
