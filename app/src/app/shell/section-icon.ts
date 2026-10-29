import { Component, input } from '@angular/core';
import type { SectionId } from '../content/model';

/** The icon of a section: the same one in the top menu and in the tab bar. */
@Component({
  selector: 'app-section-icon',
  template: `
    <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      @switch (id()) {
        @case ('profile') { <circle cx="12" cy="8" r="3.6" /><path d="M5 20c1-4 4-5.6 7-5.6s6 1.6 7 5.6" /> }
        @case ('experience') { <rect x="3" y="7" width="18" height="12" rx="2.5" /><path d="M9 7V5.5h6V7M3 12.5h18" /> }
        @case ('skills') { <path d="M4 7h9M19 7h1M4 17h1M11 17h9" /><circle cx="16" cy="7" r="2.2" /><circle cx="8" cy="17" r="2.2" /> }
        @case ('projects') { <path d="M3.5 7.5V17a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V9.5a2 2 0 0 0-2-2H12L10 5.5H5.5a2 2 0 0 0-2 2z" /> }
        @case ('about') { <circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><circle cx="12" cy="8" r="0.7" fill="currentColor" stroke="none" /> }
        @case ('contact') { <rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M4 8l8 5.5L20 8" /> }
      }
    </svg>
  `,
  styles: [`:host { display: inline-flex; } svg { display: block; }`],
})
export class SectionIcon {
  readonly id = input.required<SectionId>();
  readonly size = input(22);
}
