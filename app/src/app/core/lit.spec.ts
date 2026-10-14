import { initLit } from './lit';

const media = (hover: boolean, reduce: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('hover: hover') ? hover : reduce }));

describe('initLit', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  const card = () => {
    const el = document.createElement('div');
    el.className = 'card';
    el.getBoundingClientRect = () => ({ left: 100, top: 50 }) as DOMRect;
    const inner = document.createElement('span');
    el.appendChild(inner);
    document.body.appendChild(el);
    return { el, inner };
  };
  const move = (target: Element, x: number, y: number) =>
    target.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));

  it('does nothing for touch or when motion is reduced', () => {
    for (const [hover, reduce] of [[false, false], [true, true]] as const) {
      media(hover, reduce);
      const { el, inner } = card();
      const stop = initLit();
      move(inner, 130, 90);
      expect(el.style.getPropertyValue('--mx')).toBe('');
      stop();
    }
  });

  it('makes the highlight follow the pointer inside the nearest glass or card, once per frame', () => {
    media(true, false);
    const frames: (() => void)[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => frames.push(cb));
    const { el, inner } = card();
    const stop = initLit();
    move(inner, 130, 90);
    move(inner, 999, 999); // within the same frame: ignored
    expect(frames.length).toBe(1);
    frames[0]();
    expect(el.style.getPropertyValue('--mx')).toBe('30px');
    expect(el.style.getPropertyValue('--my')).toBe('40px');
    stop();
  });

  it('ignores the pointer outside lit surfaces and stops after cleanup', () => {
    media(true, false);
    const frames: (() => void)[] = [];
    const cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => frames.push(cb));
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const outside = document.createElement('p');
    document.body.appendChild(outside);
    const stop = initLit();
    move(outside, 5, 5);
    frames[0]();
    move(outside, 6, 6); // a frame is pending again
    stop();
    expect(cancel).toHaveBeenCalled();
    const before = frames.length;
    move(outside, 7, 7);
    expect(frames.length).toBe(before);
  });
});
