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
