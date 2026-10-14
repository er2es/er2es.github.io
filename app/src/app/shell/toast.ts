import { Component, computed, inject } from '@angular/core';
import { Toast, type ToastMessage } from '../core/toast';

/** The page's one notification spot: a small glass toast under the header, top right. Never takes focus. */
@Component({
  selector: 'app-toast',
  template: `
    <div class="toast glass" role="status" aria-live="polite" [class.on]="!!toast.current()" [class.error]="shown()[0]?.tone === 'error'">
      @for (m of shown(); track m.id) {
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          @if (m.tone === 'ok') { <path d="M5 12.5l4.5 4.5L19 7.5" /> } @else { <path d="M12 7v6M12 16.5v.5" /> }
        </svg>
        <span>{{ m.text }}</span>
      }
    </div>
  `,
  styles: [`
    .toast {
      position: fixed; z-index: 30; right: max(10px, env(safe-area-inset-right));
      top: calc(max(10px, env(safe-area-inset-top)) + var(--bar-h) + 10px);
      max-width: min(22rem, 100vw - 20px); display: flex; align-items: center; gap: 0.625rem;
      padding: 0.75rem 1rem; border-radius: 16px; color: var(--fg); font: 500 var(--t-subhead) / 1.35 var(--font);
      transform: translateX(calc(100% + 24px)); visibility: hidden; pointer-events: none;
    }
    .toast.on { transform: none; visibility: visible; }
    svg { flex: none; color: var(--accent); }
    .error svg { color: var(--fg); }
    @media (min-width: 900px) { .toast { right: max(10px, calc((100vw - 70rem) / 2)); } }
    @media (prefers-reduced-motion: no-preference) {
      .toast { transition: transform var(--dur-med) var(--ease-spring), visibility 0s linear var(--dur-med); }
      .toast.on { transition: transform var(--dur-med) var(--ease-spring), visibility 0s; }
    }
  `],
})
export class ToastHost {
  protected readonly toast = inject(Toast);
  private last: ToastMessage | null = null;
  /**
   * The last message stays rendered while the toast slides away (hidden, so not announced again);
   * every message gets a fresh node, so screen readers announce a repeat of the same text too.
   */
  protected readonly shown = computed(() => {
    this.last = this.toast.current() ?? this.last;
    return this.last ? [this.last] : [];
  });
}
