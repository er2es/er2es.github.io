import { Component, DestroyRef, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { replayOnReturn } from '../core/replay';
import { FILES, type SiteContent } from '../content/model';
import { Email } from './email';

@Component({
  selector: 'app-contact',
  imports: [Email],
  template: `
    <section id="contact" class="block alt" tabindex="-1" aria-labelledby="contact-h">
      <div class="wrap reveal">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="contact-h">{{ c().ui.sections.contact }}</h2>
        <p class="lead measure">{{ c().contact.text }}</p>
        <p class="mode mono">{{ c().contact.workMode }}</p>
        <div class="act"><app-email [c]="c()" /></div>
      </div>
    </section>
  `,
  styles: [`
    .lead { margin-top: 1.25rem; }
    .mode { margin-top: 0.5rem; color: var(--fg-2); }
    .act { margin-top: 1.5rem; }
    /* the closing chapter settles in like the hero does, each time it scrolls into view (transform only) */
    @media (prefers-reduced-motion: no-preference) {
      .enter .wrap > * { animation: settle 500ms var(--ease-spring) both; }
      .enter .wrap > :nth-child(2) { animation-delay: 50ms; }
      .enter .wrap > :nth-child(3) { animation-delay: 100ms; }
      .enter .wrap > :nth-child(4) { animation-delay: 150ms; }
      .enter .wrap > :nth-child(5) { animation-delay: 200ms; }
    }
    @keyframes settle { from { transform: translateY(14px); } }
    @media (max-width: 899px) { .block { padding-bottom: calc(5rem + var(--tabbar-h) + env(safe-area-inset-bottom)); } }
  `],
})
export class Contact {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.contact;

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const section = host.nativeElement.querySelector<HTMLElement>('#contact');
      if (section) destroy.onDestroy(replayOnReturn(section, 'enter'));
    });
  }
}
