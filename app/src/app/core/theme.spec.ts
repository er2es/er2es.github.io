import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Theme } from './theme';

describe('Theme', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  it('sets light, dark and auto and mirrors it on <html>', () => {
    const theme = TestBed.inject(Theme);
    const root = TestBed.inject(DOCUMENT).documentElement;
    expect(theme.mode()).toBe('auto');
    theme.set('light');
    expect(theme.mode()).toBe('light');
    expect(root.dataset['theme']).toBe('light');
    theme.set('dark');
    expect(root.dataset['theme']).toBe('dark');
    theme.set('auto');
    expect(theme.mode()).toBe('auto');
    expect(root.dataset['theme']).toBeUndefined();
  });

  it('persists the choice', () => {
    TestBed.inject(Theme).set('dark');
    expect(localStorage.getItem('cv:theme')).toBe('dark');
  });
});

describe('Theme: the two-way switch', () => {
  const nav = globalThis as unknown as { matchMedia?: unknown };
  const original = nav.matchMedia;
  const listeners: ((e: { matches: boolean }) => void)[] = [];
  const system = (dark: boolean) => {
    nav.matchMedia = () => ({ matches: dark, addEventListener: (_: string, f: (e: { matches: boolean }) => void) => listeners.push(f) });
  };
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
    listeners.length = 0;
  });
  afterEach(() => {
    nav.matchMedia = original;
  });

  it('shows the system theme until a choice is made, and follows the system while it has none', () => {
    system(true);
    const theme = TestBed.inject(Theme);
    expect(theme.mode()).toBe('auto');
    expect(theme.shown()).toBe('dark');
    expect(theme.opposite()).toBe('light');
    expect(theme.offSystem()).toBe(false);
    listeners[0]({ matches: false });
    expect(theme.shown()).toBe('light');
    expect(theme.opposite()).toBe('dark');
  });

  it('makes the first position Auto (nothing kept) and the second the opposite of the system, kept', () => {
    system(true);
    const theme = TestBed.inject(Theme);
    theme.choose('other');
    expect(theme.mode()).toBe('light');
    expect(localStorage.getItem('cv:theme')).toBe('light');
    expect(theme.offSystem()).toBe(true);
    theme.choose('auto');
    expect(theme.mode()).toBe('auto');
    expect(theme.offSystem()).toBe(false);
    expect(document.documentElement.dataset['theme']).toBeUndefined();
  });

  it('counts a kept choice that has become the system’s own as the first position', () => {
    system(true);
    localStorage.setItem('cv:theme', 'dark');
    const theme = TestBed.inject(Theme);
    expect(theme.mode()).toBe('dark');
    expect(theme.offSystem()).toBe(false);
  });

  it('reads as light where the browser cannot tell', () => {
    nav.matchMedia = undefined;
    const theme = TestBed.inject(Theme);
    expect(theme.shown()).toBe('light');
    expect(theme.opposite()).toBe('dark');
  });
});

describe('Theme with view transitions', () => {
  afterEach(() => {
    delete (document as unknown as Record<string, unknown>)['startViewTransition'];
    document.documentElement.classList.remove('theme-vt');
    document.documentElement.removeAttribute('style');
  });

  it('starts from the stored choice', () => {
    localStorage.setItem('cv:theme', 'dark');
    expect(TestBed.inject(Theme).mode()).toBe('dark');
    localStorage.clear();
  });

  it('grows the new theme out of the control that asked, then cleans up', async () => {
    const root = document.documentElement;
    let during = '';
    (document as unknown as Record<string, unknown>)['startViewTransition'] = (cb: () => void) => {
      cb();
      during = `${root.classList.contains('theme-vt')} ${root.style.getPropertyValue('--vt-x')}`;
      return { finished: Promise.resolve() };
    };
    const from = document.createElement('button');
    from.getBoundingClientRect = () => ({ left: 10, top: 20, width: 40, height: 20 }) as DOMRect;
    TestBed.inject(Theme).set('dark', from);
    expect(during).toBe('true 30px');
    await Promise.resolve();
    await Promise.resolve();
    expect(root.classList.contains('theme-vt')).toBe(false);
    expect(root.style.getPropertyValue('--vt-x')).toBe('');
    expect(root.dataset['theme']).toBe('dark');
  });

  it('switches without the circle when no control is given', () => {
    (document as unknown as Record<string, unknown>)['startViewTransition'] = (cb: () => void) => {
      cb();
      return { finished: Promise.resolve() };
    };
    TestBed.inject(Theme).set('light');
    expect(document.documentElement.classList.contains('theme-vt')).toBe(false);
    expect(document.documentElement.dataset['theme']).toBe('light');
  });
});

describe('Theme: two quick changes', () => {
  afterEach(() => {
    delete (document as unknown as Record<string, unknown>)['startViewTransition'];
    document.documentElement.classList.remove('theme-vt');
    document.documentElement.removeAttribute('style');
  });

  it('lets only the newest transition clean up, so a late finish of the older one does not cut the newer one short', async () => {
    const root = document.documentElement;
    const finishers: (() => void)[] = [];
    (document as unknown as Record<string, unknown>)['startViewTransition'] = (cb: () => void) => {
      cb();
      return { finished: new Promise<void>((resolve) => finishers.push(resolve)) };
    };
    const from = document.createElement('button');
    from.getBoundingClientRect = () => ({ left: 0, top: 0, width: 10, height: 10 }) as DOMRect;
    const theme = TestBed.inject(Theme);
    theme.set('light', from);
    theme.set('dark', from);
    finishers[0](); // the first one ends late
    await Promise.resolve();
    await Promise.resolve();
    expect(root.classList.contains('theme-vt')).toBe(true); // the second one is still running
    finishers[1]();
    await Promise.resolve();
    await Promise.resolve();
    expect(root.classList.contains('theme-vt')).toBe(false);
  });
});

