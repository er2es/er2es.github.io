import { Component, computed, input, signal } from '@angular/core';
import { EXTRA } from '../content/extra';
import { FACT_BY_ID, FILES, PROJECT_ORDER, period, type SiteContent } from '../content/model';

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
            <li class="card reveal" [id]="'p-' + id" tabindex="-1">
              <h3>{{ c().items[id].title }}</h3>
              @if (per(id)) { <p class="per mono">{{ per(id) }}</p> }
              <p class="sum" [id]="'sum-' + id" [class.open]="opened().has(id)">{{ c().items[id].summary }}</p>
              @if (long(id)) {
                <button type="button" class="more" [attr.aria-expanded]="opened().has(id)" [attr.aria-controls]="'sum-' + id" (click)="fold(id)">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" /></svg>
                  <span class="sr-only">{{ opened().has(id) ? x().less : x().more }}</span>
                </button>
              }
              @if (c().items[id].points.length) {
                <ul class="pts">@for (p of c().items[id].points; track $index) { <li>{{ p }}</li> }</ul>
              }
              @if (kw(id).length) {
                <p class="tags"><span class="sr-only">{{ c().ui.tags }}: </span>@for (k of kw(id); track k) { <span>{{ k }}</span> }<i class="sel" aria-hidden="true"></i></p>
              }
              @if (url(id); as u) {
                <p><a class="link-action" [attr.href]="u" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" /></svg>
                  {{ c().projects.open }}<span class="sr-only"> · {{ c().items[id].title }} {{ x().newTab }}</span>
                </a></p>
              }
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
    /* on narrow screens a long description folds to a few lines, with a chevron to unfold it */
    .more { justify-self: start; margin-top: -0.25rem; width: 44px; height: 44px; display: grid; place-items: center; border: 0; border-radius: 999px; background: color-mix(in srgb, var(--fg) 8%, transparent); color: var(--fg); cursor: pointer; }
    .more svg { transition: rotate var(--dur-short) var(--ease-out); }
    .more[aria-expanded='true'] svg { rotate: 180deg; }
    @media (max-width: 799px) {
      .sum:not(.open) { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 5; line-clamp: 5; overflow: hidden; }
    }
    @media (min-width: 800px) { .cards { grid-template-columns: repeat(2, 1fr); } .more { display: none; } }
    @media (prefers-reduced-motion: reduce) { .more svg { transition: none; } }
  `],
})
export class Projects {
  readonly c = input.required<SiteContent>();
  protected readonly order = PROJECT_ORDER;
  protected readonly x = computed(() => EXTRA[this.c().lang]);
  protected readonly file = FILES.projects;
  protected per = (id: (typeof PROJECT_ORDER)[number]) => period(FACT_BY_ID[id]);
  protected readonly opened = signal<ReadonlySet<string>>(new Set());
  protected long = (id: (typeof PROJECT_ORDER)[number]): boolean => (this.c().items[id].summary ?? '').length > 220;
  protected fold(id: string): void {
    const next = new Set(this.opened());
    if (!next.delete(id)) next.add(id);
    this.opened.set(next);
  }
  protected kw = (id: (typeof PROJECT_ORDER)[number]) => FACT_BY_ID[id].keywords;
  protected url = (id: (typeof PROJECT_ORDER)[number]) => FACT_BY_ID[id].url ?? null;
}
