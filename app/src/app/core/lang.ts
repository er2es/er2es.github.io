import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import type { Locale } from '../content/model';

@Injectable({ providedIn: 'root' })
export class LangSwitch {
  private readonly router = inject(Router);

  /**
   * The choice is remembered for this tab session only (the head script in index.html reads it), so a
   * Hungarian browser opening the site later is sent to /hu/ again. Old localStorage values are ignored.
   */
  go(to: Locale): void {
    try {
      sessionStorage.setItem('cv:lang', to);
    } catch { /* blocked storage: the switch still works for this navigation */ }
    void this.router.navigateByUrl(to === 'hu' ? '/hu' : '/');
  }
}
