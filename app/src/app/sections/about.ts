import { Component, input } from '@angular/core';
import { FILES, type SiteContent } from '../content/model';

@Component({
  selector: 'app-about',
  template: `
    <section id="about" class="block" tabindex="-1" aria-labelledby="about-h">
      <div class="wrap">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="about-h">{{ c().ui.sections.about }}</h2>
        <div class="grid">
          <div id="about-education" tabindex="-1">
            <h3 class="rule-fade">{{ c().about.education.heading }}</h3>
            <ul>@for (i of c().about.education.items; track $index) { <li>{{ i }}</li> }</ul>
          </div>
          <div id="about-languages" tabindex="-1">
            <h3 class="rule-fade">{{ c().about.languages.heading }}</h3>
            <ul>@for (i of c().about.languages.items; track $index) { <li>{{ i }}</li> }</ul>
          </div>
          <div id="about-award" tabindex="-1">
            <h3 class="rule-fade">{{ c().about.award.heading }}</h3>
            <p>{{ c().about.award.text }}</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .grid { display: grid; gap: 1.5rem; margin-top: 1.5rem; }
    .grid > div { scroll-margin-top: calc(var(--bar-h) + 1.25rem); outline: none; border-radius: 12px; }
    li + li { margin-top: 0.375rem; }
    @media (min-width: 900px) { .grid { grid-template-columns: repeat(3, 1fr); gap: 2rem; } }
  `],
})
export class About {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.about;
}
