import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { store } from './storage';

export type ThemeMode = 'auto' | 'light' | 'dark';
const ORDER: readonly ThemeMode[] = ['auto', 'light', 'dark'];

function stored(): ThemeMode {
  const v = store.get('theme');
  return v === 'light' || v === 'dark' ? v : 'auto';
}

@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly doc = inject(DOCUMENT);
  readonly mode = signal<ThemeMode>(stored());

  cycle(): void {
    this.set(ORDER[(ORDER.indexOf(this.mode()) + 1) % ORDER.length]);
  }

  set(mode: ThemeMode): void {
    store.set('theme', mode);
    const apply = () => {
      this.mode.set(mode);
      const root = this.doc.documentElement;
      if (mode === 'auto') delete root.dataset['theme'];
      else root.dataset['theme'] = mode;
    };
    const start = (this.doc as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition;
    if (start) start.call(this.doc, apply);
    else apply();
  }
}
