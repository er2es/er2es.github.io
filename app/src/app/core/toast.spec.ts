import { TestBed } from '@angular/core/testing';
import { Toast, copyText } from './toast';

describe('Toast', () => {
  afterEach(() => vi.useRealTimers());

  it('shows one message, replaces it on the next one and restarts the timer', () => {
    vi.useFakeTimers();
    const t = TestBed.inject(Toast);
    t.show('a', 'ok', 1000);
    vi.advanceTimersByTime(800);
    t.show('b', 'error', 1000);
    expect(t.current()?.text).toBe('b');
    expect(t.current()?.tone).toBe('error');
    vi.advanceTimersByTime(800);
    expect(t.current()?.text).toBe('b'); // the first timer no longer applies
    vi.advanceTimersByTime(300);
    expect(t.current()).toBeNull();
  });

  it('gives every message a new id, even with the same text', () => {
    const t = TestBed.inject(Toast);
    t.show('same');
    const first = t.current()!.id;
    t.show('same');
    expect(t.current()!.id).not.toBe(first);
    t.dismiss();
  });
});

describe('copyText', () => {
  const nav = navigator as Navigator & { clipboard?: Clipboard };
  const original = Object.getOwnPropertyDescriptor(nav, 'clipboard');
  afterEach(() => {
    if (original) Object.defineProperty(nav, 'clipboard', original);
    else delete (nav as { clipboard?: Clipboard }).clipboard;
  });

  it('uses the Clipboard API when it is there', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(nav, 'clipboard', { value: { writeText }, configurable: true });
    expect(await copyText('x@y.z')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('x@y.z');
  });

  it('reports failure honestly when both ways fail, and gives focus back', async () => {
    Object.defineProperty(nav, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) }, configurable: true });
    const exec = (document as Document & { execCommand?: unknown }).execCommand;
    (document as unknown as { execCommand: () => boolean }).execCommand = () => false;
    const btn = document.createElement('button');
    document.body.append(btn);
    btn.focus();
    expect(await copyText('x@y.z')).toBe(false);
    expect(document.activeElement).toBe(btn);
    expect(document.querySelector('textarea')).toBeNull();
    (document as unknown as { execCommand: unknown }).execCommand = exec;
    btn.remove();
  });
});

describe('copyText fallbacks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses the textarea fallback where the Clipboard API is missing, and reports what execCommand says', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined });
    document.execCommand = vi.fn(() => true);
    expect(await copyText('x')).toBe(true);
    document.execCommand = vi.fn(() => false);
    expect(await copyText('x')).toBe(false);
  });

  it('falls back after a refused write, and gives up quietly when nothing works', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText: () => Promise.reject(new Error('denied')) } });
    document.execCommand = vi.fn(() => true);
    expect(await copyText('x')).toBe(true);
    document.execCommand = vi.fn(() => {
      throw new Error('no');
    });
    expect(await copyText('x')).toBe(false);
    (document as unknown as Record<string, unknown>)['execCommand'] = undefined;
    expect(await copyText('x')).toBe(false);
  });
});

describe('Toast defaults', () => {
  it('is a plain confirmation that goes away by itself', () => {
    vi.useFakeTimers();
    const t = TestBed.inject(Toast);
    t.show('hi');
    expect(t.current()?.tone).toBe('ok');
    vi.advanceTimersByTime(2500);
    expect(t.current()).toBeNull();
    vi.useRealTimers();
  });
});
