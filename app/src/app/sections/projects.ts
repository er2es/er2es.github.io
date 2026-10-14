import { Component, inject, input } from '@angular/core';
import { FACT_BY_ID, FILES, PROJECT_ORDER, period, type SiteContent } from '../content/model';
import { SkillLens } from './uses';

@Component({
  selector: 'app-projects',
  template: `
    <section id="projects" class="block alt" tabindex="-1" aria-labelledby="projects-h">
      <div class="wrap">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="projects-h">{{ c().ui.sections.projects }}</h2>
        <p class="intro">{{ c().projects.intro }}</p>
        <ul class="cards">
          @for (id of order; track id) {
            <li class="card reveal" [id]="'p-' + id" tabindex="-1" [class.lit]="lens.ids().has(id)">
              <h3>{{ c().items[id].title }}</h3>
              @if (per(id)) { <p class="per mono">{{ per(id) }}</p> }
              <p>{{ c().items[id].summary }}</p>
              @if (c().items[id].points.length) {
                <ul class="pts">@for (p of c().items[id].points; track $index) { <li>{{ p }}</li> }</ul>
              }
              @if (kw(id).length) {
                <p class="tags"><span class="sr-only">{{ c().ui.tags }}: </span>@for (k of kw(id); track k) { <span>{{ k }}</span> }</p>
              }
              @if (url(id); as u) { <p><a [attr.href]="u">{{ c().projects.open }}</a></p> }
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: [`
    .cards { display: grid; gap: 1rem; margin-top: 1.5rem; }
    .card { display: grid; gap: 0.75rem; align-content: start; outline: none; }
    .per { color: var(--fg-2); font-size: var(--t-footnote); }
    .pts li { padding-left: 1rem; position: relative; }
    .pts li::before { content: ''; position: absolute; left: 0; top: 0.7em; width: 5px; height: 5px; border-radius: 50%; background: var(--fg-2); }
    /* lit by a skill chosen in the Skills section */
    .card { transition: box-shadow var(--dur-short) var(--ease-out); }
    .card.lit { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--accent) 70%, transparent); }
    @media (min-width: 800px) { .cards { grid-template-columns: repeat(2, 1fr); } }
  `],
})
export class Projects {
  readonly c = input.required<SiteContent>();
  protected readonly order = PROJECT_ORDER;
  protected readonly lens = inject(SkillLens);
  protected readonly file = FILES.projects;
  protected per = (id: (typeof PROJECT_ORDER)[number]) => period(FACT_BY_ID[id]);
  protected kw = (id: (typeof PROJECT_ORDER)[number]) => FACT_BY_ID[id].keywords;
  protected url = (id: (typeof PROJECT_ORDER)[number]) => FACT_BY_ID[id].url ?? null;
}
