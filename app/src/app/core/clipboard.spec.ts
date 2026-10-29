import { copyText } from './clipboard';

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
