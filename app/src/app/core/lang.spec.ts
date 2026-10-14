import { TestBed } from '@angular/core/testing';
import { LangSwitch, localeOf } from './lang';

describe('localeOf', () => {
  it('reads the page language from the path, with or without the trailing slash', () => {
    expect(localeOf('/')).toBe('en');
    expect(localeOf('/hu/')).toBe('hu');
    expect(localeOf('/hu')).toBe('hu');
    expect(localeOf('/hungary/')).toBe('en');
  });
});

describe('LangSwitch', () => {
  const setup = () => {
    history.replaceState(null, '', '/');
    sessionStorage.clear();
    return TestBed.inject(LangSwitch);
  };
  afterEach(() => {
    delete (document as unknown as Record<string, unknown>)['startViewTransition'];
    history.replaceState(null, '', '/');
  });

  it('switches the language in place: the URL is pushed, the choice is remembered for the session, the head follows', () => {
    const lang = setup();
    expect(lang.current()).toBe('en');
    lang.go('hu');
    expect(lang.current()).toBe('hu');
    expect(location.pathname).toBe('/hu/');
    expect(sessionStorage.getItem('cv:lang')).toBe('hu');
    expect(document.documentElement.lang).toBe('hu');
  });

  it('does not push a second entry for the language it is already in', () => {
    const lang = setup();
    const before = history.length;
    lang.go('en');
    expect(history.length).toBe(before);
    expect(lang.current()).toBe('en');
  });

  it('switches inside a view transition where the browser has one', () => {
    const lang = setup();
    let started = 0;
    (document as unknown as Record<string, unknown>)['startViewTransition'] = (cb: () => void) => {
      started++;
      cb();
    };
    lang.go('hu');
    expect(started).toBe(1);
    expect(lang.current()).toBe('hu');
  });

  it('follows back and forward, and ignores a popstate that stays on the same language', () => {
    const lang = setup();
    lang.go('hu');
    history.replaceState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(lang.current()).toBe('en');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(lang.current()).toBe('en');
  });

  it('still switches when session storage is blocked', () => {
    const lang = setup();
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    lang.go('hu');
    set.mockRestore();
    expect(lang.current()).toBe('hu');
  });
});

import { PLATFORM_ID } from '@angular/core';

describe('LangSwitch on the server', () => {
  it('does not listen for popstate where there is no window', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    expect(TestBed.inject(LangSwitch).current()).toBeDefined();
  });
});
