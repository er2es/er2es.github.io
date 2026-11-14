import { Component, computed, input } from '@angular/core';
import { EXTRA } from '../content/extra';
import { Soft } from './soft';
import { ARTICLES } from '../content/research';
import { FILES, type SiteContent } from '../content/model';

@Component({
  selector: 'app-about',
  imports: [Soft],
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
        <div id="about-soft" class="soft-row" tabindex="-1"><app-soft [c]="c()" /></div>
        <div id="about-research" class="research" role="group" [attr.aria-label]="c().about.research.heading" tabindex="-1">
          <p class="eyebrow mono" aria-hidden="true">research/</p>
          <p class="intro">{{ c().about.research.intro }}</p>
          <ul class="cards">
            @for (a of articles; track a.url) {
              <li>
                <a class="art" [attr.href]="a.url" target="_blank" rel="noopener noreferrer">
                  <span class="src mono">dev.to</span>
                  <span class="t">{{ a.title }}<span class="sr-only"> {{ x().newTab }}</span></span>
                  <svg class="go" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17L17 7M8 7h9v9" /></svg>
                </a>
              </li>
            }
          </ul>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .grid { display: grid; gap: 1.5rem; margin-top: 1.5rem; }
    .grid > div { scroll-margin-top: calc(var(--bar-h) + 1.25rem); outline: none; border-radius: var(--r-ctl); }
    li + li { margin-top: 0.375rem; }
    .soft-row { margin-top: 2.5rem; scroll-margin-top: calc(var(--bar-h) + 1.25rem); outline: none; border-radius: var(--r-ctl); }
    .research { margin-top: 3.5rem; scroll-margin-top: calc(var(--bar-h) + 1.25rem); outline: none; border-radius: var(--r-ctl); }
    .research .eyebrow { margin-bottom: 0.75rem; }
    .cards { list-style: none; margin: 1.25rem 0 0; padding: 0; display: grid; gap: 0.75rem; }
    .cards li + li { margin-top: 0; }
    .art { position: relative; display: grid; gap: 0.5rem; height: 100%; padding: 1rem 2.5rem 1rem 1rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--bg-2); color: var(--fg); text-decoration: none; transition: border-color var(--dur-med), transform var(--dur-med); }
    .src { font-size: 0.75rem; letter-spacing: 0.06em; color: var(--accent); }
    .t { font-weight: 600; line-height: 1.35; }
    .go { position: absolute; top: 0.9rem; right: 0.9rem; opacity: 0.55; }
    .art:hover, .art:focus-visible { border-color: var(--accent); transform: translateY(-2px); }
    .art:hover .go, .art:focus-visible .go { opacity: 1; color: var(--accent); }
    @media (prefers-reduced-motion: reduce) { .art { transition: none; } .art:hover, .art:focus-visible { transform: none; } }
    @media (min-width: 560px) and (max-width: 899px) { .cards { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 900px) { .grid { grid-template-columns: repeat(3, 1fr); gap: 2rem; } .cards { grid-template-columns: repeat(4, 1fr); gap: 1rem; } }
  `],
})
export class About {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.about;
  protected readonly articles = ARTICLES;
  protected readonly x = computed(() => EXTRA[this.c().lang]);
}
