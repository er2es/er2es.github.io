import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Theme } from './theme';

describe('Theme', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  it('cycles auto, light, dark, auto and mirrors it on <html>', () => {
    const theme = TestBed.inject(Theme);
    const root = TestBed.inject(DOCUMENT).documentElement;
    expect(theme.mode()).toBe('auto');
    theme.cycle();
    expect(theme.mode()).toBe('light');
    expect(root.dataset['theme']).toBe('light');
    theme.cycle();
    expect(root.dataset['theme']).toBe('dark');
    theme.cycle();
    expect(theme.mode()).toBe('auto');
    expect(root.dataset['theme']).toBeUndefined();
  });

  it('persists the choice', () => {
    TestBed.inject(Theme).set('dark');
    expect(localStorage.getItem('cv:theme')).toBe('dark');
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
