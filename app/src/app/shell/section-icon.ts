import { Component, input } from '@angular/core';
import type { SectionId } from '../content/model';

/** The icon of a section: the same one in the top menu and in the tab bar. */
@Component({
  selector: 'app-section-icon',
  template: `
    <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" [class.on]="animate()" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      @switch (id()) {
        @case ('profile') { <circle pathLength="1" cx="12" cy="8" r="3.6" /><path pathLength="1" d="M5 20c1-4 4-5.6 7-5.6s6 1.6 7 5.6" /> }
        @case ('experience') { <rect pathLength="1" x="3" y="7" width="18" height="12" rx="2.5" /><path pathLength="1" d="M9 7V5.5h6V7M3 12.5h18" /> }
        @case ('skills') { <path pathLength="1" d="M4 7h9M19 7h1M4 17h1M11 17h9" /><circle pathLength="1" cx="16" cy="7" r="2.2" /><circle pathLength="1" cx="8" cy="17" r="2.2" /> }
        @case ('projects') { <path pathLength="1" d="M3.5 7.5V17a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V9.5a2 2 0 0 0-2-2H12L10 5.5H5.5a2 2 0 0 0-2 2z" /> }
        @case ('about') { <circle pathLength="1" cx="12" cy="12" r="8.5" /><path pathLength="1" d="M12 11v5" /><circle pathLength="1" cx="12" cy="8" r="0.7" fill="currentColor" stroke="none" /> }
        @case ('contact') { <rect pathLength="1" x="3" y="5.5" width="18" height="13" rx="2.5" /><path pathLength="1" d="M4 8l8 5.5L20 8" /> }
      }
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; }
    svg { display: block; }
    /* the strokes are drawn from nothing to the whole (pathLength 1 on every shape), each time the icon becomes the current one */
    @media (prefers-reduced-motion: no-preference) {
      svg.on * { stroke-dasharray: 1; animation: draw var(--dur-long) var(--ease-out) both; }
    }
    @keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  `],
})
export class SectionIcon {
  readonly id = input.required<SectionId>();
  readonly size = input(22);
  /** Draws the icon (once, when this turns true): for the current section. */
  readonly animate = input(false);
}
