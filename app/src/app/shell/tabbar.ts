import { Component, input } from '@angular/core';
import type { Locale, SectionId, SiteContent } from '../content/model';
import { anchorHref, inPageClick } from '../core/nav';

const TABS: readonly SectionId[] = ['profile', 'experience', 'skills', 'contact'];

@Component({
  selector: 'app-tabbar',
  template: `
    <nav class="tabs glass" [attr.aria-label]="c().ui.tabsLabel">
      @for (s of tabs; track s) {
        <a [attr.href]="href(s)" [attr.aria-current]="active() === s ? 'location' : null" (click)="go($event, s)">{{ c().ui.sections[s] }}</a>
      }
    </nav>
  `,
  styles: [`
    .tabs {
      position: fixed; z-index: 20; left: 50%; translate: -50% 0; bottom: max(10px, env(safe-area-inset-bottom));
      width: min(100% - 20px, 28rem); min-height: var(--tabbar-h); padding: 6px; border-radius: 26px;
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;
    }
    a {
      display: grid; place-items: center; min-height: 52px; padding: 0 4px; border-radius: 20px;
      color: var(--fg-2); text-decoration: none; font-size: var(--t-footnote); font-weight: 600; text-align: center;
    }
    a[aria-current] { color: var(--fg); background: var(--tint-current); }
    a { transition: color var(--dur-short) var(--ease-out), background-color var(--dur-short) var(--ease-out), scale var(--dur-press) var(--ease-out); }
    @media (hover: hover) { a:not([aria-current]):hover { color: var(--fg); background: var(--tint-hover); } }
    a:active { background: var(--tint-press); scale: 0.95; }
    @media (prefers-reduced-motion: reduce) { a:active { scale: none; } }
    /* the selection glides between tabs (anchor positioning; a static highlight elsewhere) */
    @supports (anchor-name: --a) {
      .tabs { isolation: isolate; }
      a[aria-current] { anchor-name: --tab-current; background: none; }
      .tabs::after {
        content: ''; position: absolute; z-index: -1; position-anchor: --tab-current; pointer-events: none; opacity: 1;
        top: anchor(top); bottom: anchor(bottom); left: anchor(left); right: anchor(right); border-radius: 20px;
        background: var(--tint-current);
        transition: left var(--dur-med) var(--ease-spring), right var(--dur-med) var(--ease-spring);
      }
      .tabs:not(:has(a[aria-current]))::after { display: none; }
    }
    @media (min-width: 900px) { .tabs { display: none; } }
  `],
})
export class TabBar {
  readonly c = input.required<SiteContent>();
  readonly locale = input.required<Locale>();
  readonly active = input<SectionId>('profile');
  protected readonly tabs = TABS;

  protected href(s: SectionId): string {
    return anchorHref(this.locale(), s);
  }

  protected go(e: Event, id: SectionId): void {
    inPageClick(e, id);
  }
}
