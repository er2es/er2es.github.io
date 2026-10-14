import { Component, ElementRef, computed, inject, input } from '@angular/core';
import { EXTRA } from '../content/extra';
import { EMAIL, type SiteContent } from '../content/model';
import { Toast, copyText } from '../core/toast';

/**
 * The address as visible text on a button that copies it (a mail client is not a given), with the mailto link
 * as the secondary action next to it. If copying fails, the address is selected so it can be copied by hand.
 */
@Component({
  selector: 'app-email',
  template: `
    <div class="email">
      <button type="button" class="btn addr" (click)="copy()">
        <span class="text">{{ email }}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" /><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
        </svg>
        <span class="sr-only">{{ x().copy }}</span>
      </button>
      <a class="link-action" [attr.href]="'mailto:' + email">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3.5 7l8.5 6.5L20.5 7" /></svg>
        {{ c().hero.cta }}
      </a>
    </div>
  `,
  styles: [`
    :host { display: block; max-width: 100%; }
    .email { display: flex; flex-wrap: wrap; align-items: center; gap: 0.625rem 1.5rem; }
    .addr { gap: 0.625rem; max-width: 100%; border: 0; cursor: pointer; }
    .addr .text { user-select: text; -webkit-user-select: text; overflow-wrap: anywhere; text-align: left; line-height: 1.25; }
    .addr svg { flex: none; translate: 0 -0.5px; }
  `],
})
export class Email {
  readonly c = input.required<SiteContent>();
  protected readonly email = EMAIL;
  protected readonly x = computed(() => EXTRA[this.c().lang]);
  private readonly toast = inject(Toast);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected async copy(): Promise<void> {
    if (await copyText(EMAIL)) {
      this.toast.show(this.x().copied);
      return;
    }
    this.toast.show(this.x().copyFailed, 'error', 4000);
    const text = this.host.nativeElement.querySelector('.text');
    if (text) getSelection()?.selectAllChildren(text);
  }
}
