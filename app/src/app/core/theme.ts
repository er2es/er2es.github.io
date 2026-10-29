import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { store } from './storage';

export type ThemeMode = 'auto' | 'light' | 'dark';

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
  /** What the system prefers right now (light where the browser cannot tell, as on the server). */
  readonly systemDark = signal(false);
  /** The theme the visitor sees: their choice, or the system's own while they have made none. */
  readonly shown = computed<'light' | 'dark'>(() => (this.mode() === 'auto' ? this.system() : (this.mode() as 'light' | 'dark')));
  /** The other one: the second position of the switch (Auto is the first). */
  readonly opposite = computed<'light' | 'dark'>(() => (this.systemDark() ? 'light' : 'dark'));
  /** Whether what is shown differs from the system's own theme, i.e. the second position is the one in effect. */
  readonly offSystem = computed(() => this.shown() !== this.system());
  private readonly system = computed<'light' | 'dark'>(() => (this.systemDark() ? 'dark' : 'light'));

  constructor() {
    const query = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
    if (!query) return;
    this.systemDark.set(query.matches);
    query.addEventListener('change', (e) => this.systemDark.set(e.matches));
  }

  /**
   * The two-way switch: Auto follows the system (nothing is kept), the other position is the opposite of what the system
   * prefers right now, a choice that is kept.
   */
  choose(position: 'auto' | 'other', from?: Element | null): void {
    this.set(position === 'auto' ? 'auto' : this.opposite(), from);
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
