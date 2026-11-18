import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { EXTRA } from '../content/extra';
import { FACTS, FACT_BY_ID, SKILLS, period, type ItemId, type ItemText, type SiteContent } from '../content/model';
import { activeAt, fromYear } from '../graph/arc';
import { careerGrid } from '../graph/grid';
import { usesOf } from './uses';

const JOBS = FACTS.filter((f) => f.kind === 'job').map((f) => ({ id: f.id, start: f.start!, end: f.end!, main: f.main }));
/** The first job: not a skill family but the ground the others grew from, drawn as one block before the years. */
export const BASE: ItemId = 'edu-nonprofit';
/** Top to bottom. */
const ORDER = ['backend', 'frontend', 'quality', 'database', 'devops'];

/**
 * The career as a contribution graph: one row per skill family, one square per year, the first job as the foundation
 * block on the left. A square is the darker the more of that family's skills (the pills of the Skills section) the
 * jobs of the year use ("used in the role", not a level of skill), so the picture fills in and darkens towards the present.
 * Pointing at (or touching) the grid shows what that year looked like; the roles log below is not touched by it.
 * Nothing here moves the page. The log underneath stays the readable source, so the drawing is hidden from assistive technology.
 */
@Component({
  selector: 'app-career-arc',
  template: `
      <div class="arc" role="group" [attr.aria-label]="c().experience.arc">
        <p class="eyebrow mono" aria-hidden="true">skills/</p>
        @for (l of grid().lanes; track l.id; let i = $index; let last = $last) {
          <div class="lane" [class.shows]="tip()?.lane === l.id" [style.--i]="i">
            <div class="name">
              {{ c().skills.groups[l.group] }} <small>{{ from(l.since) }}</small>
            </div>
            <div class="track" aria-hidden="true" (pointermove)="scrub($event, l.id)" (pointerdown)="press($event, l.id)" (pointerup)="lift()" (pointercancel)="lift()" (pointerleave)="leave($event)">
              <div class="cells" [style.grid-template-columns]="'repeat(' + grid().cols + ', minmax(0, 1fr))'">
                <i class="base" [class.first]="i === 0" [class.last]="last" [style.grid-column]="'span ' + grid().baseYears"></i>
                @for (cell of l.cells; track cell.year) {
                  <i class="cell" [attr.data-l]="cell.level" [class.dim]="dim(cell.jobs)"><span class="fill"></span></i>
                }
              </div>
              @if (year() !== null) { <s class="head" [style.left.%]="head().left" [style.width.%]="head().width"></s> }
              @if (tip(); as tp) {
                @if (tp.lane === l.id) {
                  <div class="tip tip-card" [class.up]="tp.up" [style.--c]="tp.center">
                    <b>{{ tp.title }}</b>
                    @for (line of tp.lines; track line) { <span class="job">{{ line }}</span> }
                    @if (tp.tags) { <em>{{ tp.tags }}</em> }
                  </div>
                }
              }
            </div>
          </div>
        }
        <div class="axis" aria-hidden="true">
          @for (t of grid().ticks; track t.year; let last = $last) { <span [class.end]="last" [style.left.%]="last ? 100 : t.left">{{ t.year }}</span> }
        </div>
        <div class="status">
          <p class="readout touch" aria-hidden="true" [class.hide]="year() !== null">{{ x().touch }}</p>
        </div>
      </div>
  `,
  styles: [`
    :host { display: block; }
    .eyebrow { margin-bottom: 0.5rem; }
    .arc { margin-top: 1.5rem; --label: 8.5rem; --row: 52px; --cell: 26px; }
    .lane { display: grid; grid-template-columns: var(--label) 1fr; align-items: center; gap: 0.75rem; }
    /* each row's squares are their own layer (the entrance animation), so the row under the pointer comes to the front: its card must not sit behind the rows below */
    /* the row that shows the card is in front of the rows below it: under the pointer, and for a touch, where the card stays after the finger has lifted (there is no hover then) */
    .lane:hover, .lane.shows { position: relative; z-index: 6; }
    .name {
      padding: 0.375rem 0; min-height: 44px; display: grid; align-content: center; line-height: 1.2; font-weight: 600;
    }
    .name small { color: var(--fg-2); font-size: var(--t-footnote); font-weight: 500; font-variant-numeric: tabular-nums; }

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
      transition: opacity var(--dur-fade) var(--ease-out), scale var(--dur-short) var(--ease-spring);
    }
    .cell[data-l='1'] .fill { background: color-mix(in srgb, var(--accent) 36%, transparent); }
    .cell[data-l='2'] .fill { background: color-mix(in srgb, var(--accent) 60%, transparent); }
    .cell[data-l='3'] .fill { background: color-mix(in srgb, var(--accent) 82%, transparent); }
    .cell[data-l='4'] .fill { background: var(--accent); }
    .cell.dim .fill { opacity: 0.25; } /* a year is being pointed at, and this square's jobs are not in it */
    @media (hover: hover) { .cell[data-l='0'] { cursor: default; } .cell:not([data-l='0']):hover { z-index: 6; } .cell:not([data-l='0']):hover .fill { scale: 1.12; } .base:hover { z-index: 6; } }

    /* what the year under a mouse was (one card for the whole graph; the log below carries the same facts for everyone else) */
    .tip {
      position: absolute; z-index: 5; top: calc(50% + var(--cell) / 2 + 8px); left: calc(var(--c, 50) * 1%); translate: calc(var(--c, 50) * -1%) 0;
      width: max-content; max-width: 16rem; pointer-events: none; cursor: default; line-height: 1.35; color: var(--fg-2); white-space: normal;
    }
    /* a finger covers what is below the row: for a touch the card opens above it */
    .tip.up { top: auto; bottom: calc(50% + var(--cell) / 2 + 8px); }
    .tip b { display: block; color: var(--fg); font-weight: 600; }
    .tip .job { display: block; }
    .tip em { display: block; margin-top: 0.125rem; font-style: normal; }

    /* the year under the pointer */
    .head { position: absolute; top: 0; bottom: 0; border-radius: 5px; background: color-mix(in srgb, var(--fg) 12%, transparent); pointer-events: none; }

    .axis { position: relative; font-variant-numeric: tabular-nums; height: 1.25rem; margin-left: calc(var(--label) + 0.75rem); color: var(--fg-2); font-size: var(--t-footnote); }
    .axis span { position: absolute; top: 0.25rem; translate: -50%; }
    .axis span.end { translate: -100%; } /* the last year ends at the edge instead of hanging over it */
    /* the line under the grid: the year being pointed at, or else the touch hint */
    .status { display: grid; margin: 0.25rem 0 0 calc(var(--label) + 0.75rem); min-height: 2.75em; align-content: start; }
    .status > * { grid-area: 1 / 1; }
    .readout { margin: 0; color: var(--fg-2); font-size: var(--t-footnote); }
    .readout.touch { display: none; }
    .readout.hide { visibility: hidden; }
    @media (hover: none) { .readout.touch { display: block; } }

    @media (max-width: 599px) {
      .arc { --row: 40px; --cell: 26px; }
      .fill { border-radius: 4px; }
      .lane { grid-template-columns: 1fr; gap: 0; }
      .name { grid-auto-flow: column; justify-content: space-between; align-items: baseline; min-height: 44px; }
      .cells { column-gap: 2px; }
      .axis, .status { margin-left: 0; }
      .axis span:nth-last-child(2) { display: none; } /* the year before it would touch the last one on a narrow screen */
    }

    @media (prefers-reduced-motion: reduce) { .fill { transition: none; } }
  `],
  host: { '(document:pointerdown)': 'outside($event)' },
})
export class CareerArc {
  readonly c = input.required<SiteContent>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

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
        .sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group)),
      ticks: grid.years.map((year, i) => ({ year, left: ((i + 0.5) / cols) * 100 })).filter((_, i, all) => i % 4 === 0 || i === all.length - 1),
    };
  });

  protected readonly x = computed(() => EXTRA[this.c().lang]);

  protected readonly baseTags = computed(() => FACT_BY_ID[BASE].keywords.join(' · '));

  /** The year under the pointer, while it is scrubbing. */
  protected readonly year = signal<number | null>(null);
  /** Where the pointer is: which row, which year (a finger gets the card above its row). */
  private readonly hover = signal<{ lane: string; year: number; touch: boolean } | null>(null);
  protected readonly tip = computed(() => {
    const h = this.hover();
    const g = this.grid();
    const lane = h && g.lanes.find((l) => l.id === h.lane);
    if (!h || !lane) return null;
    if (h.year < g.min + g.baseYears) {
      return { lane: h.lane, up: h.touch, center: (g.baseYears / g.cols) * 50, title: this.t(BASE).title, lines: [`${this.t(BASE).org} · ${this.per(BASE)}`], tags: this.baseTags() };
    }
    const cell = lane.cells.find((c) => c.year === h.year);
    if (!cell || !cell.jobs.length) return null;
    return {
      lane: h.lane,
      up: h.touch,
      center: ((h.year - g.min + 0.5) / g.cols) * 100,
      title: String(h.year),
      lines: cell.jobs.map((j) => `${this.t(j).title} · ${this.t(j).org}`),
      tags: cell.tags.join(' · '),
    };
  });
  /** The highlight of the year under the pointer; over the foundation, the whole foundation block. */
  protected readonly head = computed(() => {
    const g = this.grid();
    const i = Math.max(0, (this.year() ?? 0) - g.min);
    return i < g.baseYears ? { left: 0, width: (g.baseYears / g.cols) * 100 } : { left: (i / g.cols) * 100, width: 100 / g.cols };
  });
  /** The jobs that ran in the year under the pointer. */
  private readonly active = signal<ReadonlySet<ItemId>>(new Set());
  private lit = '';

  protected t(id: string): ItemText {
    return this.c().items[id as ItemId];
  }

  protected from(y: number): string {
    return fromYear(this.c().lang, y);
  }

  protected per(id: string): string {
    return period(FACT_BY_ID[id as ItemId]);
  }

  /** While a year is pointed at, the squares whose jobs are not in it are dimmed. */
  protected dim(jobs: readonly string[]): boolean {
    if (this.year() === null) return false;
    const lit = this.active();
    return !jobs.some((id) => lit.has(id as ItemId));
  }

  /** A touch that has just put the year away does not pick another one while the finger drags on. */
  private stilled = false;

  /** The year of the grid under a pointer. */
  private yearAt(e: PointerEvent): number {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const g = this.grid();
    return g.min + Math.min(g.cols - 1, Math.floor(p * g.cols));
  }

  /** Whether a family has nothing in a year (a square that is not lit): there is nothing to show, so it is not a place to point at. */
  private idle(lane: string, year: number): boolean {
    const l = this.grid().lanes.find((x) => x.id === lane);
    const g = this.grid();
    return year >= g.min + g.baseYears && l?.cells.find((c) => c.year === year)?.level === 0;
  }

  /** A press: a finger on the year that is already shown puts it away (the year also goes with a touch elsewhere); anything else picks that year. */
  protected press(e: PointerEvent, lane: string): void {
    const h = this.hover();
    this.stilled = false;
    if (this.idle(lane, this.yearAt(e))) {
      this.dismiss(); // a square with nothing in it is not a place to point at: it puts away what was shown
      return;
    }
    if (e.pointerType !== 'mouse' && h && h.lane === lane && h.year === this.yearAt(e)) {
      this.stilled = true;
      this.dismiss();
      return;
    }
    this.scrub(e, lane);
  }

  protected lift(): void {
    this.stilled = false;
  }

  /** Pointing at (or touching) the grid lights the jobs of that year in the log (the chosen families are put back afterwards). */
  protected scrub(e: PointerEvent, lane: string): void {
    if (this.stilled) return;
    const year = this.yearAt(e);
    if (this.idle(lane, year)) {
      this.dismiss();
      return;
    }
    this.year.set(year);
    this.hover.set({ lane, year, touch: e.pointerType !== 'mouse' });
    const ids = activeAt(JOBS, year) as ItemId[];
    const key = ids.join();
    if (key !== this.lit) {
      this.lit = key;
      this.active.set(new Set(ids));
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
    this.active.set(new Set());
  }
}
