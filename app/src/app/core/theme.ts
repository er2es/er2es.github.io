import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { store } from './storage';

export type ThemeMode = 'auto' | 'light' | 'dark';
export const ORDER: readonly ThemeMode[] = ['auto', 'light', 'dark'];

function stored(): ThemeMode {
  const v = store.get('theme');
  return v === 'light' || v === 'dark' ? v : 'auto';
}

@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly doc = inject(DOCUMENT);
  readonly mode = signal<ThemeMode>(stored());
  /** The newest theme transition: an older one that finishes late must not clean up after it. */
  private vtSeq = 0;

  /** `from` is the control that asked: the new theme grows out of it as a circle (CSS in _motion.scss). */
  cycle(from?: Element | null): void {
    this.set(ORDER[(ORDER.indexOf(this.mode()) + 1) % ORDER.length], from);
  }

  set(mode: ThemeMode, from?: Element | null): void {
    store.set('theme', mode);
    const root = this.doc.documentElement;
    const apply = () => {
      this.mode.set(mode);
      if (mode === 'auto') delete root.dataset['theme'];
      else root.dataset['theme'] = mode;
    };
    const start = (this.doc as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }).startViewTransition;
    if (!start) return apply();
    const view = this.doc.defaultView;
    if (from && view) {
      const r = from.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      root.style.setProperty('--vt-x', `${x}px`);
      root.style.setProperty('--vt-y', `${y}px`);
      root.style.setProperty('--vt-r', `${Math.hypot(Math.max(x, view.innerWidth - x), Math.max(y, view.innerHeight - y))}px`);
      root.classList.add('theme-vt');
    }
    const id = ++this.vtSeq;
    const done = () => {
      if (id !== this.vtSeq) return;
      root.classList.remove('theme-vt');
      for (const p of ['--vt-x', '--vt-y', '--vt-r']) root.style.removeProperty(p);
    };
    start.call(this.doc, apply).finished.then(done, done);
  }
}
