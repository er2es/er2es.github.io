import { Component, ElementRef, computed, inject, input, signal, type OnInit } from '@angular/core';
import { EXTRA } from '../content/extra';
import { FACTS, FACT_BY_ID, SKILLS, period, type ItemId, type ItemText, type SiteContent } from '../content/model';
import { activeAt, fromYear } from '../graph/arc';
import { careerGrid } from '../graph/grid';
import { SkillLens, usesOf } from './uses';

const JOBS = FACTS.filter((f) => f.kind === 'job').map((f) => ({ id: f.id, start: f.start!, end: f.end!, main: f.main }));
/** The first job: not a skill family but the ground the others grew from, drawn as one block before the years. */
const BASE: ItemId = 'edu-nonprofit';

/**
 * The career as a contribution graph: one row per skill family, one square per year, the first job as the foundation
 * block on the left. A square is the darker the more of that family's skills (the pills of the Skills section) the
 * jobs of the year use ("used in the role", not a level of skill), so the picture fills in and darkens towards the present.
 * Lane names are toggles, any number of them: the roles log below lights the jobs of every chosen family, and a chip per
 * family says what is chosen and removes it. Pointing at (or touching) the grid shows what that year looked like.
 * Nothing here moves the page. The log underneath stays the readable source, so the drawing is hidden from assistive technology.
 */
@Component({
  selector: 'app-career-arc',
  template: `
      <div class="arc" role="group" [attr.aria-label]="c().experience.arc">
        <p class="eyebrow mono" aria-hidden="true">skills/</p>
        @for (l of grid().lanes; track l.id; let i = $index; let last = $last) {
          <div class="lane" [style.--i]="i">
            <button type="button" class="name" [attr.aria-pressed]="pressed(l.id)" (click)="toggle(l.id)">
              {{ c().skills.groups[l.group] }} <small class="mono">{{ from(l.since) }}</small>
            </button>
            <div class="track" aria-hidden="true" (pointermove)="scrub($event, l.id)" (pointerdown)="scrub($event, l.id)" (pointerleave)="leave($event)">
              <div class="cells" [style.grid-template-columns]="'repeat(' + grid().cols + ', minmax(0, 1fr))'">
                <i class="base" [class.first]="i === 0" [class.last]="last" [style.grid-column]="'span ' + grid().baseYears"></i>
                @for (cell of l.cells; track cell.year) {
                  <i class="cell" [attr.data-l]="cell.level" [class.off]="off(l.id)" [class.dim]="dim(cell.jobs)"><span class="fill"></span></i>
                }
              </div>
              @if (year() !== null) { <s class="head" [style.left.%]="headLeft()" [style.width.%]="100 / grid().cols"></s> }
              @if (tip(); as tp) {
                @if (tp.lane === l.id) {
                  <div class="tip" [style.--c]="tp.center">
                    <b>{{ tp.title }}</b>
                    @for (line of tp.lines; track line) { <span class="job">{{ line }}</span> }
                    @if (tp.tags) { <em>{{ tp.tags }}</em> }
                  </div>
                }
              }
            </div>
          </div>
        }
        <div class="axis mono" aria-hidden="true">
          @for (t of grid().ticks; track t.year; let last = $last) { <span [class.end]="last" [style.left.%]="last ? 100 : t.left">{{ t.year }}</span> }
        </div>
        <div class="status">
          <p class="readout" aria-hidden="true">{{ readout() }}</p>
          <div class="chips">
            @for (chip of chips(); track chip.id) {
              <button type="button" class="filter" [class.hide]="year() !== null" (click)="toggle(chip.id)">
                {{ chip.name }}
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" /></svg>
                <span class="sr-only">{{ x().clearFilter }}</span>
              </button>
            }
          </div>
        </div>
      </div>
  `,
  styles: [`
    :host { display: block; }
    .eyebrow { margin-bottom: 0.5rem; }
    .arc { margin-top: 1.5rem; --label: 8.5rem; --row: 46px; --cell: 26px; }
    .lane { display: grid; grid-template-columns: var(--label) 1fr; align-items: center; gap: 0.75rem; }
    /* each row's squares are their own layer (the entrance animation), so the row under the pointer comes to the front: its card must not sit behind the rows below */
    .lane:hover { position: relative; z-index: 6; }
    .name {
      text-align: left; font: inherit; color: inherit; background: none; border: 0; cursor: pointer; padding: 0.375rem 0.5rem;
      margin-inline: -0.5rem; border-radius: 10px; min-height: 44px; display: grid; line-height: 1.2;
      transition: background-color var(--dur-short) var(--ease-out);
    }
    .name small { color: var(--fg-2); font-size: var(--t-footnote); }
    @media (hover: hover) { .name:hover { background: color-mix(in srgb, var(--fg) 6%, transparent); } }
    .name[aria-pressed='true'] { background: color-mix(in srgb, var(--accent) 14%, transparent); }
    .name[aria-pressed='true'] small { color: var(--fg); }

    .track { position: relative; align-self: stretch; min-height: var(--row); touch-action: pan-y; cursor: crosshair; }
    .cells { position: absolute; inset: 0; display: grid; align-items: center; column-gap: 3px; }

    /* the foundation: one block per lane, flush with its neighbours, so together they read as one tall block */
    .base { position: relative; align-self: stretch; background: color-mix(in srgb, var(--fg) 20%, transparent); }
    .base.first { border-top-left-radius: 10px; border-top-right-radius: 10px; }
    .base.last { border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; }

    /* a year: empty, or one of four accent levels (how many technologies of the family its jobs list) */
    .cell { position: relative; height: var(--cell); font-style: normal; }
    /* the coloured part is its own layer: it fades and grows on its own, while the card inside the square stays as it is */
    .fill {
      position: absolute; inset: 0; border-radius: 5px; background: color-mix(in srgb, var(--fg) 7%, transparent);
      transition: opacity var(--dur-short) var(--ease-out), scale var(--dur-short) var(--ease-spring);
    }
    .cell[data-l='1'] .fill { background: color-mix(in srgb, var(--accent) 36%, transparent); }
    .cell[data-l='2'] .fill { background: color-mix(in srgb, var(--accent) 60%, transparent); }
    .cell[data-l='3'] .fill { background: color-mix(in srgb, var(--accent) 82%, transparent); }
    .cell[data-l='4'] .fill { background: var(--accent); }
    .cell.off .fill { opacity: 0.5; } /* a family that is not chosen */
    .cell.dim .fill { opacity: 0.25; } /* a year is being pointed at, and this square's jobs are not in it */
    @media (hover: hover) { .cell:not([data-l='0']):hover { z-index: 6; } .cell:not([data-l='0']):hover .fill { scale: 1.12; } .base:hover { z-index: 6; } }

    /* what the year under a mouse was (one card for the whole graph; the log below carries the same facts for everyone else) */
    .tip {
      position: absolute; z-index: 5; top: calc(50% + var(--cell) / 2 + 8px); left: calc(var(--c, 50) * 1%); translate: calc(var(--c, 50) * -1%) 0;
      width: max-content; max-width: 16rem; padding: 0.5rem 0.75rem; border-radius: 12px; pointer-events: none; cursor: default;
      background: var(--bg-2); border: 1px solid var(--line); box-shadow: var(--glass-shadow);
      font-size: var(--t-footnote); line-height: 1.35; color: var(--fg-2); white-space: normal;
    }
    .tip b { display: block; color: var(--fg); font-weight: 600; }
    .tip .job { display: block; }
    .tip em { display: block; margin-top: 0.125rem; font-style: normal; }

    /* the year under the pointer */
    .head { position: absolute; top: 0; bottom: 0; border-radius: 5px; background: color-mix(in srgb, var(--fg) 12%, transparent); pointer-events: none; }

    .axis { position: relative; height: 1.25rem; margin-left: calc(var(--label) + 0.75rem); color: var(--fg-2); font-size: var(--t-footnote); }
    .axis span { position: absolute; top: 0.25rem; translate: -50%; }
    .axis span.end { translate: -100%; } /* the last year ends at the edge instead of hanging over it */
    /* the line under the grid: the year being pointed at, or else a chip for every family that is chosen */
    .status { display: grid; margin: 0.25rem 0 0 calc(var(--label) + 0.75rem); min-height: 2.75em; align-content: start; }
    .status > * { grid-area: 1 / 1; }
    .readout { margin: 0; color: var(--fg-2); font-size: var(--t-footnote); }
    .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; align-content: start; }
    .filter {
      position: relative; display: inline-flex; align-items: center; gap: 0.5rem; min-height: 32px; padding: 0 0.75rem 0 0.9rem; border: 0; border-radius: 999px;
      background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--fg); font: 500 var(--t-footnote) / 1 var(--font); cursor: pointer;
    }
    .filter::before { content: ''; position: absolute; inset: -6px 0; } /* a 32 px pill with a 44 px target */
    .filter.hide { visibility: hidden; }
    @media (hover: hover) { .filter:hover { background: color-mix(in srgb, var(--accent) 26%, transparent); } }

    @media (max-width: 599px) {
      .arc { --row: 34px; --cell: 22px; }
      .fill { border-radius: 4px; }
      .lane { grid-template-columns: 1fr; gap: 0; }
      .name { grid-auto-flow: column; justify-content: space-between; align-items: baseline; min-height: 44px; }
      .cells { column-gap: 2px; }
      .axis, .status { margin-left: 0; }
      .axis span:nth-last-child(2) { display: none; } /* the year before it would touch the last one on a narrow screen */
    }

    /* the years fill in from the foundation towards the present as the grid scrolls into view (scroll-driven, clip only) */
    @media (prefers-reduced-motion: no-preference) {
      @supports (animation-timeline: view()) {
        .arc .cells { animation: wipe linear both; animation-timeline: view(); animation-range: entry 5% entry 75%; }
      }
    }
    @keyframes wipe { from { clip-path: inset(-300px 100% -300px -300px); } to { clip-path: inset(-300px); } }
    @media (prefers-reduced-motion: reduce) { .name, .fill { transition: none; } }
  `],
  host: { '(document:pointerdown)': 'outside($event)' },
})
export class CareerArc implements OnInit {
  readonly c = input.required<SiteContent>();
  private readonly lens = inject(SkillLens);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The skill families that are chosen (Backend to begin with): the log lights the jobs of any of them. */
  protected readonly chosen = signal<ReadonlySet<string>>(new Set(['backend']));

  ngOnInit(): void {
    this.lens.ids.set(this.union());
  }

  protected readonly grid = computed(() => {
    const items = this.c().items;
    const groups = SKILLS.filter((g) => g.group !== 'other');
    const families = groups.map((g) => {
      // which of the family's skills (the pills of the Skills section) each job uses: by its tags or by name in its text
      const used = g.items.map((s) => ({ name: s.label?.[this.c().lang] ?? s.name, jobs: new Set<string>(usesOf(s.name, FACTS, items)) }));
      return {
        id: g.group,
        jobs: [...new Set(used.flatMap((u) => [...u.jobs]))].filter((id) => id !== BASE && JOBS.some((j) => j.id === id)),
        tagsOf: (id: string) => used.filter((u) => u.jobs.has(id)).map((u) => u.name),
      };
    });
    const grid = careerGrid(JOBS, BASE, families);
    const cols = grid.years.length;
    return {
      ...grid,
      cols,
      lanes: grid.lanes
        .map((l) => ({ ...l, group: l.id as (typeof groups)[number]['group'], ids: families.find((f) => f.id === l.id)!.jobs }))
        .sort((a, b) => a.since - b.since), // families in the order they began
      ticks: grid.years.map((year, i) => ({ year, left: ((i + 0.5) / cols) * 100 })).filter((_, i, all) => i % 4 === 0 || i === all.length - 1),
    };
  });

  protected readonly x = computed(() => EXTRA[this.c().lang]);

  /** One chip per chosen family. */
  protected readonly chips = computed(() =>
    this.grid().lanes.filter((l) => this.chosen().has(l.id)).map((l) => ({ id: l.id, name: this.c().skills.groups[l.group] })),
  );

  protected readonly baseTags = computed(() => FACT_BY_ID[BASE].keywords.join(' · '));

  /** The year under the pointer, while it is scrubbing. */
  protected readonly year = signal<number | null>(null);
  /** Where a mouse is pointing (a finger gets the line under the graph instead): which row, which year. */
  private readonly hover = signal<{ lane: string; year: number } | null>(null);
  protected readonly tip = computed(() => {
    const h = this.hover();
    const g = this.grid();
    const lane = h && g.lanes.find((l) => l.id === h.lane);
    if (!h || !lane) return null;
    if (h.year < g.min + g.baseYears) {
      return { lane: h.lane, center: (g.baseYears / g.cols) * 50, title: this.t(BASE).title, lines: [`${this.t(BASE).org} · ${this.per(BASE)}`], tags: this.baseTags() };
    }
    const cell = lane.cells.find((c) => c.year === h.year);
    if (!cell || !cell.jobs.length) return null;
    return {
      lane: h.lane,
      center: ((h.year - g.min + 0.5) / g.cols) * 100,
      title: String(h.year),
      lines: cell.jobs.map((j) => `${this.t(j).title} · ${this.t(j).org}`),
      tags: cell.tags.join(' · '),
    };
  });
  protected readonly headLeft = computed(() => (((this.year() ?? 0) - this.grid().min) / this.grid().cols) * 100);
  private lit = '';

  protected readonly readout = computed(() => {
    const year = this.year();
    if (year === null) return '';
    const g = this.grid();
    const ids = activeAt(JOBS, year);
    const families = g.lanes.filter((l) => ids.some((id) => l.ids.includes(id as ItemId))).map((l) => this.c().skills.groups[l.group]);
    const jobs = ids.map((id) => `${this.t(id).title}, ${this.t(id).org}`);
    return `${year}: ${jobs.join(' / ')}${families.length ? ` (${families.join(', ')})` : ''}`;
  });

  protected t(id: string): ItemText {
    return this.c().items[id as ItemId];
  }

  protected from(y: number): string {
    return fromYear(this.c().lang, y);
  }

  protected per(id: string): string {
    return period(FACT_BY_ID[id as ItemId]);
  }

  /** The jobs of every chosen family. */
  private union(): Set<ItemId> {
    return new Set(this.grid().lanes.filter((l) => this.chosen().has(l.id)).flatMap((l) => l.ids as ItemId[]));
  }

  protected pressed(lane: string): boolean {
    return this.chosen().has(lane);
  }

  /** A family that is not chosen is dimmed a little, once any is chosen. */
  protected off(lane: string): boolean {
    return this.chosen().size > 0 && !this.chosen().has(lane);
  }

  /** While a year is pointed at, the squares whose jobs are not in it are dimmed. */
  protected dim(jobs: readonly string[]): boolean {
    if (this.year() === null) return false;
    const lit = this.lens.ids();
    return !jobs.some((id) => lit.has(id as ItemId));
  }

  protected toggle(lane: string): void {
    if (this.year() !== null) this.dismiss(); // a family was picked: the year being shown makes way
    const next = new Set(this.chosen());
    if (!next.delete(lane)) next.add(lane);
    this.chosen.set(next);
    if (this.year() === null) this.lens.ids.set(this.union());
  }

  /** Pointing at (or touching) the grid lights the jobs of that year in the log (the chosen families are put back afterwards). */
  protected scrub(e: PointerEvent, lane: string): void {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const g = this.grid();
    const year = g.min + Math.min(g.cols - 1, Math.floor(p * g.cols));
    this.year.set(year);
    this.hover.set(e.pointerType === 'mouse' ? { lane, year } : null);
    const ids = activeAt(JOBS, year) as ItemId[];
    const key = ids.join();
    if (key !== this.lit) {
      this.lit = key;
      this.lens.ids.set(new Set(ids));
    }
  }

  /** A mouse leaving the grid lets the year go; a finger lifting must not (the year stays until you touch elsewhere). */
  protected leave(e: PointerEvent): void {
    if (e.pointerType !== 'touch') this.dismiss();
  }

  /** A touch outside the graph lets the year go. */
  protected outside(e: Event): void {
    if (this.year() !== null && !this.host.nativeElement.contains(e.target as Node)) this.dismiss();
  }

  private dismiss(): void {
    if (this.year() === null) return;
    this.year.set(null);
    this.hover.set(null);
    this.lit = '';
    this.lens.ids.set(this.union());
  }
}
