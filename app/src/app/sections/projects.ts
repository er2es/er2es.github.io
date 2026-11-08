import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal } from '@angular/core';
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
              @if (per(id)) { <p class="per">{{ per(id) }}</p> }
              <div class="fold" [id]="'sum-' + id" [class.cut]="long(id)" [class.open]="opened().has(id)">
                <p class="sum">{{ c().items[id].summary }}</p>
                @if (c().items[id].points.length) {
                  <ul class="pts">@for (p of c().items[id].points; track $index) { <li>{{ p }}</li> }</ul>
                }
              </div>
              @if (long(id)) {
                <button type="button" class="more" [attr.aria-expanded]="opened().has(id)" [attr.aria-controls]="'sum-' + id" (click)="fold(id)">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" /></svg>
                  <span class="sr-only">{{ opened().has(id) ? x().less : x().more }}</span>
                </button>
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
    .per { color: var(--fg-2); font-size: var(--t-footnote); font-weight: 500; font-variant-numeric: tabular-nums; }
    .pts li { padding-left: 1rem; position: relative; }
    .pts li::before { content: ''; position: absolute; left: 0; top: 0.7em; width: 5px; height: 5px; border-radius: 50%; background: var(--fg-2); }
    /* on narrow screens a long description folds to a few lines, with a chevron to unfold it */
    .fold { display: grid; gap: 0.75rem; }
    /* a small round button (a 44px target through its ::before) */
    .more { position: relative; justify-self: center; width: 32px; height: 32px; margin-top: -0.5rem; display: grid; place-items: center; border: 0; border-radius: 999px; background: color-mix(in srgb, var(--fg) 10%, transparent); color: var(--fg); cursor: pointer; }
    .more::before { content: ''; position: absolute; inset: -6px; }
    .more svg { transition: rotate var(--dur-short) var(--ease-out); }
    .more[aria-expanded='true'] svg { rotate: 180deg; }
    /* on a phone a long tile (the text and its list together) is cut off a few lines down, fading out instead of ending mid-word */
    @media (max-width: 799px) {
      .fold.cut { max-height: 80em; transition: max-height var(--dur-med) var(--ease-out); }
      .fold.cut:not(.open) { max-height: 8.5em; overflow: hidden; -webkit-mask-image: linear-gradient(#000 45%, transparent); mask-image: linear-gradient(#000 45%, transparent); }
    }
    /* two columns, and every tile as tall as its own text: each tile goes where there is room first, in the order of the list.
       The tiles are measured in script (--rows: how many 4px rows a tile takes) and the grid fills in; without the script the
       tiles are the plain rows of a two-column grid. */
    @media (min-width: 800px) {
      .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .cards.masonry { grid-auto-rows: 4px; row-gap: 0; grid-auto-flow: row dense; }
      .cards.masonry > .card { grid-row-end: span var(--rows, 1); align-self: start; }
      .more { display: none; }
    }
    @media (prefers-reduced-motion: reduce) { .more svg { transition: none; } }
  `],
})
export class Projects {
  readonly c = input.required<SiteContent>();
  protected readonly order = PROJECT_ORDER;

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const list = host.nativeElement.querySelector<HTMLElement>('.cards');
      if (!list) return;
      const cards = [...list.querySelectorAll<HTMLElement>(':scope > .card')];
      // each tile takes as many 4px rows as its height and the 16px gap below it need
      const measure = (): void => cards.forEach((c) => c.style.setProperty('--rows', String(Math.ceil((c.offsetHeight + 16) / 4))));
      list.classList.add('masonry');
      measure();
      const ro = new ResizeObserver(measure); // a tile changes height when its text reflows, and when it is first laid out (the section is rendered on demand)
      cards.forEach((c) => ro.observe(c));
      destroy.onDestroy(() => ro.disconnect());
    });
  }
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
