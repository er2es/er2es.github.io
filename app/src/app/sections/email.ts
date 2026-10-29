import { Component, DestroyRef, ElementRef, computed, inject, input, signal } from '@angular/core';
import { EXTRA } from '../content/extra';
import { EMAIL, type SiteContent } from '../content/model';
import { copyText } from '../core/clipboard';

/**
 * The address as visible text on a button that copies it (a mail client is not a given); the Contact section
 * adds a mailto icon next to its other links. The answer is given on the button itself: the copy icon turns into a
 * check that draws itself, and a small bubble under it says so (the same bubble as the theme button's). A screen reader
 * hears the full sentence. If copying fails, the address is selected so it can be copied by hand.
 */
@Component({
  selector: 'app-email',
  template: `
    <div class="email">
      <span class="anchor">
        <button type="button" class="btn addr" (click)="copy()">
          <span class="text">{{ email }}</span>
          @for (d of [done()?.id ?? 0]; track d) {
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
              @if (done()?.ok) {
                <path class="tick" d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" />
              } @else {
                <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" /><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
              }
            </svg>
          }
          <span class="sr-only">{{ x().copy }}</span>
        </button>
        <span class="sr-only" role="status">@for (d of [done()]; track d?.id) { {{ d?.speak }} }</span>
        @if (done(); as d) {
          <span class="bubble" [class.error]="!d.ok" aria-hidden="true">
            @if (d.ok) {
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            }
            {{ d.say }}
          </span>
        }
      </span>
    </div>
  `,
  styles: [`
    :host { display: block; max-width: 100%; }
    .email { display: flex; flex-wrap: wrap; align-items: center; gap: 0.625rem 1.5rem; }
    .anchor { position: relative; display: inline-flex; max-width: 100%; }
    .addr { gap: 0.625rem; max-width: 100%; border: 0; cursor: pointer; }
    .addr .text { user-select: text; -webkit-user-select: text; overflow-wrap: anywhere; text-align: left; line-height: 1.25; }
    .addr svg { flex: none; translate: 0 -0.5px; }
    /* the same bubble as the theme button's answer, under the end of the button where the icon is (above it, it would cover the line of text over the button) */
    .bubble {
      position: absolute; z-index: 5; right: 0; top: calc(100% + 8px); width: max-content; max-width: min(18rem, 100%); padding: 0.4rem 0.7rem; border-radius: 10px;
      display: inline-flex; align-items: center; gap: 0.4rem; background: var(--bg-2); color: var(--fg); border: 1px solid var(--line); box-shadow: var(--glass-shadow);
      font: 500 var(--t-footnote) / 1.3 var(--font); pointer-events: none;
    }
    .bubble svg { flex: none; color: var(--accent); }
    @keyframes bubble-in { from { opacity: 0; translate: 0 -4px; } }
    @keyframes tick { from { stroke-dashoffset: 1; } }
    @media (prefers-reduced-motion: no-preference) {
      .bubble { animation: bubble-in var(--dur-press) var(--ease-out) both; }
      .tick { stroke-dasharray: 1; animation: tick var(--dur-med) var(--ease-out) both; }
    }
  `],
})
export class Email {
  readonly c = input.required<SiteContent>();
  protected readonly email = EMAIL;
  protected readonly x = computed(() => EXTRA[this.c().lang]);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The answer to the last click: shown for a moment, and a new click gives it a new id so a repeat is announced again. */
  protected readonly done = signal<{ id: number; ok: boolean; say: string; speak: string } | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private seq = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  private answer(ok: boolean, say: string, speak: string, ms: number): void {
    clearTimeout(this.timer);
    this.done.set({ id: ++this.seq, ok, say, speak });
    this.timer = setTimeout(() => this.done.set(null), ms);
  }

  protected async copy(): Promise<void> {
    if (await copyText(EMAIL)) {
      this.answer(true, this.x().copiedShort, this.x().copied, 2000);
      return;
    }
    this.answer(false, this.x().copyFailed, this.x().copyFailed, 4000);
    const text = this.host.nativeElement.querySelector('.text');
    if (text) getSelection()?.selectAllChildren(text);
  }
}
