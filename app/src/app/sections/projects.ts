import { Component, computed, input, signal } from '@angular/core';
import { EXTRA } from '../content/extra';
import { FACT_BY_ID, FILES, PROJECT_ORDER, period, tagLabel, type SiteContent } from '../content/model';

@Component({
  selector: 'app-projects',
  template: `
    <section id="projects" class="block alt" tabindex="-1" aria-labelledby="projects-h">
      <div class="wrap">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="projects-h">{{ c().ui.sections.projects }}</h2>
        <ul class="cards">
          @for (id of order; track id) {
            <li class="card reveal" [class.big]="big(id)" [attr.data-p]="id" [id]="'p-' + id" tabindex="-1">
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
                  <span class="lbl">{{ opened().has(id) ? x().less : x().more }}</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" /></svg>
                </button>
              }
              @if (kw(id).length) {
                <p class="tags"><span class="sr-only">{{ c().ui.tags }}: </span>@for (k of kw(id); track k) { <span>{{ tag(k) }}</span> }<i class="sel" aria-hidden="true"></i></p>
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
    .card { gap: 0.75rem; outline: none; }
    .per { color: var(--fg-2); font-size: var(--t-footnote); font-weight: 500; font-variant-numeric: tabular-nums; }
    .pts li { padding-left: 1rem; position: relative; }
    .pts li::before { content: ''; position: absolute; left: 0; top: 0.7em; width: 5px; height: 5px; border-radius: 50%; background: var(--fg-2); }
    /* on narrow screens a long description folds to a few lines, with a chevron to unfold it */
    .fold { display: grid; gap: 0.75rem; }
    /* a pill in the accent tint, with its words: it sits on the fade where the text trails off, and its chevron nods twice (not for ever: movement that starts by itself and goes on beside the text is not allowed to) */
    .more {
      position: relative; justify-self: center; margin-top: -0.375rem; display: inline-flex; align-items: center; gap: 0.4rem; height: 44px; padding: 0 1rem 0 1.1rem;
      border: 1px solid var(--ring-accent); border-radius: 999px; background: var(--tint-accent); color: var(--fg); font: 600 var(--t-footnote) / 1 var(--font); cursor: pointer;
      box-shadow: 0 8px 20px -12px var(--ring-accent); transition: scale var(--dur-short) var(--ease-spring), background-color var(--dur-fade) var(--ease-out);
    }
    .more:active { scale: var(--press-scale); background: var(--tint-accent-strong); transition-duration: var(--dur-tap); transition-timing-function: var(--ease-out); }
    .more svg { transition: rotate var(--dur-short) var(--ease-out); }
    .more[aria-expanded='true'] svg { rotate: 180deg; }
    @media (prefers-reduced-motion: no-preference) {
      .more[aria-expanded='false'] svg { animation: nod 2.8s var(--ease-in-out) 1.2s 2; }
    }
    @keyframes nod { 0%, 70%, 100% { translate: 0 0; } 80% { translate: 0 3px; } 90% { translate: 0 0; } }
    /* on a phone a long tile (the text and its list together) is cut off a few lines down, fading out instead of ending mid-word */
    @property --keep { syntax: '<percentage>'; inherits: false; initial-value: 100%; }
    @media (max-width: 799px) {
      .fold.cut { overflow: hidden; --keep: 100%; -webkit-mask-image: linear-gradient(#000 var(--keep), transparent); mask-image: linear-gradient(#000 var(--keep), transparent); transition: --keep var(--dur-med) var(--ease-out), max-height var(--dur-med) var(--ease-out); }
      .fold.cut:not(.open) { max-height: 8.5em; --keep: 45%; }
    }
    /*
     * A bento grid, with no script: the two big projects first, then three tiles to a row, then the last one as a slim strip. Every tile
     * fills the height of its row, with its tags (and link) at the foot, so a row is even whatever the text. The order of the list (and so
     * of reading and tabbing) is the order in the page; only the places differ. Below 1000px the tiles go two to a row, and below 800px
     * one under another, where a long text folds (see above).
     */
    .card { display: flex; flex-direction: column; }
    .card .tags, .card > p:last-child { margin-top: auto; }
    .card .tags + p { margin-top: 0; } /* the link follows its tags */
    .card:not(.big) .sum { font-size: var(--t-callout); }
    .card.big h3 { font-size: 1.25rem; }
    @media (min-width: 800px) {
      .cards { grid-template-columns: repeat(6, minmax(0, 1fr)); grid-template-areas: 'a a a a a a' 'b b b b b b' 'c c c d d d' 'e e e f f f' 'g g g h h h' 'i i i i i i'; }
      .more { display: none; }
    }
    @media (min-width: 1000px) {
      .cards { grid-template-columns: repeat(12, minmax(0, 1fr)); grid-template-areas: 'a a a a a a b b b b b b' 'c c c c d d d d e e e e' 'f f f f g g g g h h h h' 'i i i i i i i i i i i i'; }
      /* the last project is a strip: its name and years, its text, its tags, side by side */
      .card[data-p='admissions-map'] { display: grid; grid-template-columns: 15rem minmax(0, 1fr) auto; grid-template-areas: 't s g' 'p s g'; align-items: center; column-gap: 1.5rem; row-gap: 0.125rem; }
      .card[data-p='admissions-map'] h3 { grid-area: t; align-self: end; }
      .card[data-p='admissions-map'] .per { grid-area: p; align-self: start; }
      .card[data-p='admissions-map'] .fold { grid-area: s; }
      .card[data-p='admissions-map'] .tags { grid-area: g; margin-top: 0; }
    }
    .card[data-p='fuzzphony'] { grid-area: a; } .card[data-p='slimfony'] { grid-area: b; } .card[data-p='cv-site'] { grid-area: c; }
    .card[data-p='audit'] { grid-area: d; } .card[data-p='gov-reporting'] { grid-area: e; } .card[data-p='wordpress'] { grid-area: f; }
    .card[data-p='surveys'] { grid-area: g; } .card[data-p='sport-programme'] { grid-area: h; } .card[data-p='admissions-map'] { grid-area: i; }
    @media (max-width: 799px) { .card { grid-area: auto !important; } }
    @media (prefers-reduced-motion: reduce) { .more svg { transition: none; } }
  `],
})
export class Projects {
  readonly c = input.required<SiteContent>();
  protected readonly order = PROJECT_ORDER;

  protected readonly x = computed(() => EXTRA[this.c().lang]);
  protected readonly file = FILES.projects;
  protected per = (id: (typeof PROJECT_ORDER)[number]) => period(FACT_BY_ID[id]);
  /** The two big projects (the first two of the list) get the large tiles. */
  protected big = (id: (typeof PROJECT_ORDER)[number]): boolean => id === 'fuzzphony' || id === 'slimfony';
  protected readonly opened = signal<ReadonlySet<string>>(new Set());
  protected long = (id: (typeof PROJECT_ORDER)[number]): boolean => (this.c().items[id].summary ?? '').length > 220;
  protected fold(id: string): void {
    const el = document.getElementById('sum-' + id);
    if (el && matchMedia('(max-width: 799px)').matches) this.glide(el, !this.opened().has(id));
    const next = new Set(this.opened());
    if (!next.delete(id)) next.add(id);
    this.opened.set(next);
  }
  /** Moves a fold between its cut height and its full height in pixels (max-height cannot animate to "none"), then hands the height back to the stylesheet. */
  private glide(el: HTMLElement, open: boolean): void {
    const cut = parseFloat(getComputedStyle(el).fontSize) * 8.5;
    const full = el.scrollHeight;
    el.style.maxHeight = `${open ? cut : full}px`;
    void el.offsetHeight; // the starting height is taken in before the target is set
    el.style.maxHeight = `${open ? full : cut}px`;
    setTimeout(() => el.style.removeProperty('max-height'), 450);
  }
  protected tag = (k: string): string => tagLabel(k, this.c().lang);
  protected kw = (id: (typeof PROJECT_ORDER)[number]) => FACT_BY_ID[id].keywords;
  protected url = (id: (typeof PROJECT_ORDER)[number]) => FACT_BY_ID[id].url ?? null;
}
