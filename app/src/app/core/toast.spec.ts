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
