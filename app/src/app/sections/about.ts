import { Component, input } from '@angular/core';
import { FILES, type SiteContent } from '../content/model';

@Component({
  selector: 'app-about',
  template: `
    <section id="about" class="block" tabindex="-1" aria-labelledby="about-h">
      <div class="wrap reveal">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="about-h">{{ c().ui.sections.about }}</h2>
        <div class="grid">
          <div>
            <h3>{{ c().about.education.heading }}</h3>
            <ul>@for (i of c().about.education.items; track $index) { <li>{{ i }}</li> }</ul>
          </div>
          <div>
            <h3>{{ c().about.languages.heading }}</h3>
            <ul>@for (i of c().about.languages.items; track $index) { <li>{{ i }}</li> }</ul>
          </div>
          <div>
            <h3>{{ c().about.award.heading }}</h3>
            <p>{{ c().about.award.text }}</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .grid { display: grid; gap: 2rem; margin-top: 2rem; }
    h3 { margin-bottom: 0.5rem; }
    li + li { margin-top: 0.375rem; }
    @media (min-width: 900px) { .grid { grid-template-columns: repeat(3, 1fr); } }
  `],
})
export class About {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.about;
}
