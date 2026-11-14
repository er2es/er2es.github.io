import { Component, input } from '@angular/core';
import { FILES, type SiteContent } from '../content/model';
import { Social } from './social';

@Component({
  selector: 'app-contact',
  imports: [Social],
  template: `
    <section id="contact" class="block alt" tabindex="-1" aria-labelledby="contact-h">
      <div class="wrap reveal">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="contact-h">{{ c().ui.sections.contact }}</h2>
        <p class="lead measure">{{ c().contact.text }}</p>
        <p class="mode"><span class="dot" aria-hidden="true"></span>{{ c().contact.workMode }}</p>
        <app-social class="act" [c]="c()" />
      </div>
    </section>
  `,
  styles: [`
    .lead { margin-top: 1.25rem; }
    .mode { margin-top: 0.5rem; color: var(--fg-2); font-size: var(--t-subhead); font-weight: 500; letter-spacing: 0.02em; display: flex; align-items: center; gap: 0.5rem; }
    .act { display: block; margin-top: 1.5rem; }
  `],
})
export class Contact {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.contact;
}
