import { Component, computed, input } from '@angular/core';
import { NO_USES } from '../content/extra';
import { FACTS, FILES, SKILLS, type SiteContent } from '../content/model';
import { usesOf } from './uses';

/**
 * The skills, by area, as plain labels: nothing here moves the page or lights up another section. Where each skill
 * was used is told by the career graph in the Experience section; a skill that no entry mentions carries the
 * owner's own line as a tooltip.
 */
@Component({
  selector: 'app-skills',
  template: `
    <section id="skills" class="block" tabindex="-1" aria-labelledby="skills-h">
      <div class="wrap">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="skills-h">{{ c().ui.sections.skills }}</h2>
        <p class="intro">{{ c().skills.intro }}</p>
        <dl class="groups">
          @for (g of view(); track g.group) {
            <div class="group" [id]="'skills-' + g.group" tabindex="-1">
              <dt>{{ g.label }}</dt>
              <dd>
                <ul class="pills">
                  @for (s of g.items; track s.name) {
                    <li class="pill" [attr.title]="s.note" [attr.lang]="s.note ? 'en' : null">{{ s.label }}</li>
                  }
                </ul>
              </dd>
            </div>
          }
        </dl>
      </div>
    </section>
  `,
  styles: [`
    .groups { margin-top: 1.5rem; border-top: 1px solid var(--line); }
    .group { display: grid; gap: 0.5rem; padding: 1rem 0.5rem; border-bottom: 1px solid var(--line); scroll-margin-top: calc(var(--bar-h) + 1.25rem); outline: none; }
    dt { font: 600 var(--t-subhead) / 1.3 var(--font); color: var(--fg-2); }
    dd { margin: 0; }
    .pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .pill {
      display: inline-block; padding: 0.4rem 0.85rem; border-radius: 999px; font: 500 var(--t-callout) / 1.2 var(--font); color: var(--fg);
      background: color-mix(in srgb, var(--fg) 7%, transparent);
      border: 1px solid color-mix(in srgb, var(--fg) 14%, transparent);
    }
    @media (min-width: 800px) { .group { grid-template-columns: 14rem 1fr; gap: 1.5rem; align-items: baseline; padding-block: 1.125rem; } }
  `],
})
export class Skills {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.skills;

  protected readonly view = computed(() => {
    const c = this.c();
    return SKILLS.map((g) => ({
      group: g.group,
      label: c.skills.groups[g.group],
      items: g.items.map((s) => ({
        label: s.label?.[c.lang] ?? s.name,
        name: s.name,
        note: usesOf(s.name, FACTS, c.items).length ? null : NO_USES,
      })),
    }));
  });
}
