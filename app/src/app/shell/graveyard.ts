import { Injectable, signal } from '@angular/core';

/** Those who fell off the tiles, and off which side: they lie at the foot of the page, on that side (for as long as the page is open, nowhere else). */
@Injectable({ providedIn: 'root' })
export class Graveyard {
  readonly sides = signal<readonly (1 | -1)[]>([]);

  add(side: 1 | -1): void {
    this.sides.update((s) => [...s, side]);
  }
}
