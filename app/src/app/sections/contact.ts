import { Component, input } from '@angular/core';
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
    @media (max-width: 899px) { .block { padding-bottom: calc(5rem + var(--tabbar-h) + env(safe-area-inset-bottom)); } }
  `],
})
export class Contact {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.contact;
}
