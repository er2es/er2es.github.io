import { Component, input } from '@angular/core';
import { FILES, SKILLS, type SiteContent, type SkillFact } from '../content/model';

@Component({
  selector: 'app-skills',
  template: `
    <section id="skills" class="block alt" tabindex="-1" aria-labelledby="skills-h">
      <div class="wrap">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="skills-h">{{ c().ui.sections.skills }}</h2>
        <p class="intro">{{ c().skills.intro }}</p>
        <div class="groups">
          @for (g of groups; track g.group) {
            <div class="card reveal">
              <h3>{{ c().skills.groups[g.group] }}</h3>
              <ul>
                @for (s of g.items; track s.name) {
                  <li>
                    <span class="name">{{ s.name }}</span>
                    @if (s.usedIn.length) {
                      <span class="used"><span class="sr-only">{{ c().ui.usedIn }}: </span>{{ used(s) }}</span>
                    }
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .groups { display: grid; gap: 1rem; margin-top: 2rem; }
    h3 { margin-bottom: 0.75rem; }
    li { padding-block: 0.5rem; border-top: 1px solid var(--line); display: grid; gap: 0.125rem; }
    li:first-child { border-top: 0; }
    .name { font-weight: 600; }
    .used { color: var(--fg-2); font-size: var(--t-footnote); }
    @media (min-width: 700px) { .groups { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1000px) { .groups { grid-template-columns: repeat(3, 1fr); } }
  `],
})
export class Skills {
  readonly c = input.required<SiteContent>();
  protected readonly groups = SKILLS;
  protected readonly file = FILES.skills;

  protected used(s: SkillFact): string {
    return s.usedIn.map((id) => this.c().items[id].short).join(' · ');
  }
}
