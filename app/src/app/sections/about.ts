import { Component, DestroyRef, ElementRef, Injector, afterNextRender, afterRenderEffect, computed, inject, input, signal } from '@angular/core';
import { EXTRA } from '../content/extra';
import { Soft } from './soft';
import { fetchArticles } from '../content/devto';
import { ARTICLES, cardTopics, filterTopics, formatDate, minutesLabel, toArticles, topicLabel, type Article } from '../content/research';
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
          <p class="eyebrow mono" aria-hidden="true">research/dev.to</p>
          <p class="intro">{{ c().about.research.intro }}</p>
          @if (topics().length) {
            <div class="topics" role="group" [attr.aria-label]="x().filterLabel">
              <i class="ind" aria-hidden="true"></i>
              <button type="button" class="topic" [attr.aria-pressed]="topic() === null" (click)="pick(null)">{{ x().allArticles }} <small>({{ list().length }})</small></button>
              @for (t of topics(); track t.id) {
                <button type="button" class="topic" [attr.aria-pressed]="topic() === t.id" (click)="pick(t.id)">{{ label(t.id) }} <small>({{ t.count }})</small></button>
              }
            </div>
          }
          <span class="sr-only" role="status">{{ loading() ? x().loadingArticles : '' }}</span>
          @if (failed() && !loading()) {
            <p class="notice">
              <svg class="broken" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M15 7h2a5 5 0 0 1 0 10h-2m-6 0H7A5 5 0 0 1 7 7h2" /></svg>
              <span>{{ x().articlesFailed }}</span>
              <a class="link-action" href="https://dev.to/_er2es_" target="_blank" rel="noopener noreferrer">{{ x().articlesOnDevto }}<span class="sr-only"> {{ x().newTab }}</span></a>
              <button type="button" class="chip retry" (click)="refresh()">{{ x().retry }}</button>
            </p>
          }
          <ul class="cards" [class.open]="expanded()" [attr.aria-busy]="loading()">
            @if (loading()) {
              @for (n of [1, 2, 3, 4]; track n) { <li class="skel" aria-hidden="true"><i></i><i></i><i></i></li> }
            } @else {
            @for (a of shown(); track key(a); let i = $index) {
              <li animate.enter="art-in" [style.--d.ms]="delay(i)">
                <a class="art" [attr.href]="a.url" target="_blank" rel="noopener noreferrer">
                  <span class="meta"><time [attr.datetime]="a.date">{{ date(a.date) }}</time><span aria-hidden="true">·</span><span>{{ mins(a.minutes) }}</span></span>
                  <span class="t">{{ a.title }}<span class="sr-only"> {{ x().newTab }}</span></span>
                  @if (pills(a).length) {
                    <span class="tags pills" aria-hidden="true">@for (id of pills(a); track id) { <span>{{ label(id) }}</span> }<i class="sel"></i></span>
                  }
                  <svg class="go" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17L17 7M8 7h9v9" /></svg>
                </a>
              </li>
            }
            }
          </ul>
          @if ((rest() > 0 || restOnPhone() > 0) && !loading()) {
            <div class="more-wrap" animate.leave="more-out" [class.phone-only]="rest() === 0" [class.wide-only]="restOnPhone() === 0">
              <button type="button" class="chip more-articles" (click)="expand()"><span class="wide">{{ x().moreArticles.replace('{n}', '' + rest()) }}</span><span class="phone">{{ x().moreArticles.replace('{n}', '' + restOnPhone()) }}</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" /></svg></button>
            </div>
          }
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
    .cards { list-style: none; margin: 1.25rem 0 0; padding: 0; display: grid; gap: 0.75rem; align-content: start; } /* (start: while the list's height is set in between, its rows keep their own height instead of stretching) */
    .cards li + li { margin-top: 0; }
    .art { position: relative; display: grid; grid-template-rows: auto 1fr auto; gap: 0.5rem; height: 100%; padding: 1rem 2.5rem 1rem 1rem; border: 1px solid transparent; border-radius: var(--radius); background: var(--bg-2); color: var(--fg); text-decoration: none; transition: border-color var(--dur-fade) var(--ease-out), scale var(--dur-short) var(--ease-spring); }
    .meta { display: flex; flex-wrap: wrap; gap: 0 0.5rem; font: 400 0.8125rem / 1.4 var(--font); font-variant-numeric: tabular-nums; color: var(--fg-2); white-space: nowrap; }
    /* the topics of an article: the same pills as the tags of the role cards, every one of them (a smaller size, one row; they take the room under the arrow as well) */
    .pills { align-self: end; margin-right: -1.5rem; font-size: 0.75rem; }
    .pills span { padding: 0.2rem 0.5rem; }
    .topics { position: relative; display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
    /* the chosen chip's tint is a layer of its own, which slides to the chip that is chosen next (it is the chip's own background until the script has measured) */
    .ind { position: absolute; left: 0; top: 0; z-index: 0; width: var(--iw, 0px); height: var(--ih, 0px); translate: var(--ix, 0px) var(--iy, 0px); border-radius: 999px; background: var(--tint-hover); border: 1px solid var(--line); pointer-events: none; opacity: 0; }
    .topics.ind-on .ind { opacity: 1; }
    .topics.slide .ind { transition: translate var(--dur-short) var(--ease-spring), width var(--dur-short) var(--ease-spring), height var(--dur-short) var(--ease-spring); }
    .topics.ind-on .topic[aria-pressed='true'] { background: none; border-color: transparent; }
    .topic { position: relative; z-index: 1; }
    .topic {
      padding: 0.4rem 0.85rem; border: 1px solid var(--line); border-radius: 999px; background: none; color: var(--fg-2); cursor: pointer;
      font: 500 var(--t-footnote) / 1.2 var(--font); transition: background-color var(--dur-fade) var(--ease-out), border-color var(--dur-fade) var(--ease-out), color var(--dur-fade) var(--ease-out), scale var(--dur-short) var(--ease-spring);
    }
    .topic small { font-size: inherit; color: var(--fg-2); font-variant-numeric: tabular-nums; } /* a colour, not an opacity: the count keeps the 7:1 contrast */
    .topic[aria-pressed='true'] small { color: var(--fg); }
    @media (hover: hover) { .topic:hover { background: var(--tint-hover); color: var(--fg); } }
    .topic[aria-pressed='true'] { background: var(--tint-hover); border-color: var(--line); color: var(--fg); }
    .topic:active { scale: var(--press-scale); transition-duration: var(--dur-tap); transition-timing-function: var(--ease-out); }
    @media (pointer: coarse) { .topic { min-height: 44px; } }
    @media (prefers-reduced-motion: reduce) { .topic:active { scale: none; } }
    .notice { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.75rem; margin: 1rem 0 0; padding: 0.75rem 1rem; border: 1px solid var(--line); border-radius: var(--r-ctl); color: var(--fg-2); font-size: var(--t-footnote); }
    .broken { flex: none; color: var(--fg-2); }
    .notice .link-action { min-height: 44px; margin-inline: 0; }
    .retry { border: 1px solid var(--ring); }
    .more-wrap { display: flex; justify-content: center; margin-top: 1.25rem; }
    .more-articles { gap: 0.4rem; border: 1px solid var(--ring); padding-inline: 1.25rem 1rem; background: var(--bg-2); }
    @media (hover: hover) and (prefers-reduced-motion: no-preference) { .more-articles:hover svg { animation: dip-more var(--dur-short) linear; } }
    @keyframes dip-more { 0% { animation-timing-function: var(--ease-out); } 35% { translate: 0 2px; animation-timing-function: var(--ease-in-out); } 100% { translate: 0 0; } }
    @media (hover: hover) { .chip.more-articles:hover { border-color: var(--ring-accent); background: linear-gradient(var(--tint-hover), var(--tint-hover)), var(--bg-2); } }
    /* while the list is being fetched: cards in the same place, with a soft light running through their lines */
    .skel { display: grid; align-content: start; gap: 0.75rem; min-height: 8.5rem; padding: 1rem; border: 1px solid transparent; border-radius: var(--radius); background: var(--bg-2); }
    .skel i { display: block; height: 0.75rem; border-radius: 6px; background: linear-gradient(90deg, var(--tint-current) 0%, var(--tint-hover) 50%, var(--tint-current) 100%); background-size: 250% 100%; }
    .skel i:nth-child(1) { width: 40%; }
    .skel i:nth-child(3) { width: 70%; }
    @media (prefers-reduced-motion: no-preference) { .skel i { animation: skel 1.4s linear infinite; } }
    @keyframes skel { from { background-position: 100% 0; } to { background-position: -150% 0; } }
    /* a new set of cards comes in one after the other, a little from below; the button that shows more turns its chevron and goes */
    .art-in { animation: art-in var(--dur-med) var(--ease-out) var(--d, 0ms) both; }
    @keyframes art-in { from { opacity: 0; translate: 0 10px; scale: 0.985; } }
    .more-out { overflow: clip; animation: more-out var(--dur-med) var(--ease-settle) both; } /* its place goes with it, in the same motion as the list grows: what is below does not jump */
    .more-out svg { animation: more-chev var(--dur-fade) var(--ease-out) both; }
    @keyframes more-out { from { height: 44px; margin-top: 1.25rem; } to { height: 0; margin-top: 0; opacity: 0; } }
    @keyframes more-chev { to { rotate: 180deg; } }
    @media (prefers-reduced-motion: reduce) { .art-in, .more-out, .more-out svg { animation: none; } }
    .t { font-weight: 600; font-size: var(--t-headline); line-height: 1.3; }
    .go { position: absolute; top: 0.9rem; right: 0.9rem; opacity: 0.55; }
    /* the same hover language as the role cards and the skill pills (an accent outline and a tint), not a lift: nothing here moves away from the pointer, and nothing sticks on a touch screen */
    @media (hover: hover) { .art:hover { border-color: var(--ring-accent); background-image: linear-gradient(var(--tint-hover), var(--tint-hover)); } }
    .art:focus-visible { border-color: var(--accent); }
    .art:hover .go, .art:focus-visible .go { opacity: 1; color: var(--accent); }
    .art:active { scale: var(--press-scale); background-image: linear-gradient(var(--tint-press), var(--tint-press)); transition-duration: var(--dur-tap); transition-timing-function: var(--ease-out); }
    @media (prefers-reduced-motion: reduce) { .art:active { scale: none; } }
    /* a phone starts with the three newest, and "more" shows the rest (CSS, so the page is the same before and after hydration); the button says how many each kind of screen would add */
    @media (max-width: 559px) { .cards:not(.open) li:nth-child(n+4) { display: none; } .wide, .wide-only { display: none; } }
    @media (min-width: 560px) { .phone, .phone-only { display: none; } }
    @media (min-width: 560px) and (max-width: 899px) { .cards { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 900px) { .grid { grid-template-columns: repeat(3, 1fr); gap: 2rem; } .cards { grid-template-columns: repeat(4, 1fr); gap: 1rem; } }
  `],
})
export class About {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.about;
  /** The articles shown: the list fetched at build time, until the browser has the one the API gives (a failed request leaves it as it is). */
  protected readonly list = signal<readonly Article[]>(ARTICLES);
  protected readonly loading = signal(false);
  /** The request failed or timed out: the list from the build is shown, with a notice and a way to the articles on dev.to itself. */
  protected readonly failed = signal(false);
  /** The topic chosen as a filter (null: every article), and whether the older ones are shown too. */
  protected readonly topic = signal<string | null>(null);
  protected readonly expanded = signal(false);
  protected readonly topics = computed(() => filterTopics(this.list()));
  private readonly chosen = computed(() => this.list().filter((a) => this.topic() === null || a.topics.includes(this.topic()!)));
  protected readonly shown = computed(() => (this.expanded() ? this.chosen() : this.chosen().slice(0, 8)));
  protected readonly rest = computed(() => this.chosen().length - this.shown().length);
  /** How many a phone does not show (it starts with three, the CSS hides the others) until "more" is pressed. */
  protected readonly restOnPhone = computed(() => (this.expanded() ? 0 : Math.max(0, this.chosen().length - 3)));
  /** Where the cards that are new in this set begin (the ones before it have been shown already): they come in one after another from there. */
  private from = 0;
  /** A card is the same card only within one filter: a new filter brings in a new set. */
  protected key = (a: Article): string => `${this.topic()}|${a.url}`;
  protected delay = (i: number): number => Math.min(400, Math.max(0, i - this.from) * 40);
  /** A chip that is already chosen puts the filter away again. */
  protected pick(id: string | null): void {
    this.glide(() => {
      this.from = 0;
      this.topic.set(id === this.topic() ? null : id);
    });
  }
  /** "More": the older cards come in below, the page brings the first of them into view, and the focus goes to it (the button it was on is gone). */
  protected expand(): void {
    const first = matchMedia('(max-width: 559px)').matches ? 3 : this.shown().length;
    this.glide(() => {
      this.from = first;
      this.expanded.set(true);
    }, () => {
      const li = this.host.querySelectorAll<HTMLElement>('.research .cards > li')[first];
      if (!li) return;
      li.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
      const over = li.getBoundingClientRect().bottom + 16 - innerHeight;
      if (over > 0) scrollBy({ top: Math.min(over, li.getBoundingClientRect().top - 100), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  }
  /**
   * A list that gets shorter under a reader who is near the end of the page would pull the end of the page up to the reader (the browser keeps the scroll position inside the page): the menu would name the last section, and the
   * block would shift down the screen. The page keeps its height instead, by a gap under the list that is released once the reader has scrolled away from it, and that growing lists use up first.
   */
  private keepPlace(delta: number, y0: number): void {
    const box = this.host.querySelector<HTMLElement>('#about-research');
    if (!box) return;
    let pad = parseFloat(box.style.paddingBottom) || 0;
    if (delta > 0) pad = Math.max(0, pad - delta);
    else {
      const over = y0 + innerHeight - document.documentElement.scrollHeight; // (where the reader was, not where the browser has put them since)
      if (over > -48) pad += over + 48; // and a little more: the reader is not made to be at the very end, which the menu would take for the last section
    }
    if (pad <= 0) return void box.style.removeProperty('padding-bottom');
    box.style.paddingBottom = `${pad}px`;
    if (Math.abs(scrollY - y0) > 1) scrollTo({ top: y0, behavior: 'instant' });
    if (this.letGo) return;
    this.letGo = (): void => {
      const gap = parseFloat(box.style.paddingBottom) || 0;
      if (scrollY + innerHeight > document.documentElement.scrollHeight - gap - 24) return; // the reader is still where the gap is
      box.style.removeProperty('padding-bottom');
      removeEventListener('scroll', this.letGo!);
      this.letGo = undefined;
    };
    addEventListener('scroll', this.letGo, { passive: true });
  }
  private letGo: (() => void) | undefined;

  /** Changes what the list shows, with the list growing or shrinking from the height it had to the one it has now in one motion (everything below follows it, instead of jumping by a row at once). */
  private glide(change: () => void, after?: () => void): void {
    const ul = this.host.querySelector<HTMLElement>('.research .cards');
    const from = ul?.offsetHeight ?? 0;
    const y0 = scrollY;
    change();
    afterNextRender(() => {
      after?.();
      if (!ul || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const to = ul.offsetHeight;
      if (Math.abs(to - from) < 2) return;
      this.keepPlace(to - from, y0);
      ul.style.overflow = 'clip';
      ul.style.overflowClipMargin = '8px';
      ul.style.transition = 'none';
      ul.style.height = `${from}px`;
      void ul.offsetHeight; // the height it had is taken in before the one it will have is set
      ul.style.transition = 'height var(--dur-med) var(--ease-settle)';
      ul.style.height = `${to}px`;
      setTimeout(() => {
        for (const prop of ['overflow', 'overflow-clip-margin', 'transition', 'height']) ul.style.removeProperty(prop);
      }, 450);
    }, { injector: this.injector });
  }
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  /** Puts the sliding tint under the chosen chip (and again when the chips change or wrap). */
  private tint(): void {
    const box = this.host.querySelector<HTMLElement>('.topics');
    const on = box?.querySelector<HTMLElement>('.topic[aria-pressed="true"]');
    if (!box || !on) return;
    const first = !box.classList.contains('ind-on');
    box.style.setProperty('--ix', `${on.offsetLeft}px`);
    box.style.setProperty('--iy', `${on.offsetTop}px`);
    box.style.setProperty('--iw', `${on.offsetWidth}px`);
    box.style.setProperty('--ih', `${on.offsetHeight}px`);
    box.classList.add('ind-on');
    if (first) requestAnimationFrame(() => box.classList.add('slide')); // the first one is put in place, not slid to
  }

  constructor() {
    const host = this.host;
    const destroy = inject(DestroyRef);
    afterRenderEffect(() => {
      this.topic();
      this.topics();
      this.c();
      this.tint();
    });
    afterNextRender(() => {
      const onResize = (): void => this.tint();
      addEventListener('resize', onResize);
      destroy.onDestroy(() => removeEventListener('resize', onResize));
      // once, when the block comes near the screen: nobody who does not scroll to it makes the request
      const target = host.querySelector('#about-research');
      if (!target || typeof IntersectionObserver === 'undefined') return;
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        void this.refresh();
      }, { rootMargin: '300px 0px' });
      io.observe(target);
      destroy.onDestroy(() => io.disconnect());
    });
  }

  /** Asks the API, for at most eight seconds. */
  protected async refresh(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    try {
      this.list.set(toArticles(await fetchArticles(fetch, ctl.signal)));
      if (this.topic() !== null && !this.topics().some((t) => t.id === this.topic())) this.topic.set(null);
    } catch {
      this.failed.set(true); // no answer, a bad one, or none in time: the list from the build stays
    } finally {
      clearTimeout(timer);
      this.loading.set(false);
    }
  }

  protected pills = cardTopics;
  protected label = (id: string): string => topicLabel(id, this.c().lang);
  protected date = (iso: string): string => formatDate(iso, this.c().lang);
  protected mins = (n: number): string => minutesLabel(n, this.c().lang);
  protected readonly x = computed(() => EXTRA[this.c().lang]);
}
