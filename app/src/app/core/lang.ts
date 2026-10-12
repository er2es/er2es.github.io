import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import type { Locale } from '../content/model';
import { store } from './storage';

@Injectable({ providedIn: 'root' })
export class LangSwitch {
  private readonly router = inject(Router);

  go(to: Locale): void {
    store.set('lang', to);
    void this.router.navigateByUrl(to === 'hu' ? '/hu' : '/');
  }
}
