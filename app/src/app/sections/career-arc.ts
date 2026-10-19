import { Component, computed, inject, input, signal, type OnInit } from '@angular/core';
import { revealEntry } from '../core/nav';
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
 * block on the left. A square is the darker the more of that family's skills (the pills of the Skills section) the jobs of the year use ("used in
 * the role", not a level of skill), so the picture fills in and darkens towards the present.
 * A lane name lights its jobs in the log below (the same lens the Skills section uses) and previews on hover, a square
 * (or the foundation) opens its entry in the log, a chip names the chosen lane and clears it, and pointing at the grid
 * shows what that year looked like.
 * The log underneath stays the readable source, so the drawing is hidden from assistive technology.
 */
@Component({
  selector: 'app-career-arc',
  template: `
      <div class="arc" role="group" [attr.aria-label]="c().experience.arc">
        <p class="eyebrow mono" aria-hidden="true">skills/</p>
        @for (l of grid().lanes; track l.id; let i = $index; let last = $last) {
          <div class="lane" [style.--i]="i">
            <button type="button" class="name" [attr.aria-pressed]="pressed(l.id)" (click)="toggle(l.id)" (pointerenter)="preview($event, l.id)" (pointerleave)="unpreview()">
              {{ c().skills.groups[l.group] }} <small class="mono">{{ from(l.since) }}</small>
            </button>
            <div class="track" aria-hidden="true" (pointermove)="scrub($event)" (pointerdown)="scrub($event)" (pointerleave)="leave()">
              <div class="cells" [style.grid-template-columns]="'repeat(' + grid().cols + ', minmax(0, 1fr))'">
                <i class="base" [class.first]="i === 0" [class.last]="last" [style.grid-column]="'span ' + grid().baseYears" [style.--c]="(grid().baseYears / grid().cols) * 50" (click)="go(base)">
                  <span class="tip"><b>{{ t(base).title }}</b>{{ t(base).org }} · {{ per(base) }}<em>{{ baseTags() }}</em></span>
                </i>
                @for (cell of l.cells; track cell.year) {
                  <i class="cell" [attr.data-l]="cell.level" [class.off]="off(l.id)" [class.dim]="dim(cell.jobs)" [style.--c]="((cell.year - grid().min + 0.5) / grid().cols) * 100" (click)="goCell(cell.jobs)">
                    <span class="fill"></span>
                    @if (cell.jobs.length) {
                      <span class="tip"><b>{{ cell.year }}</b>@for (j of cell.jobs; track j) { <span class="job">{{ t(j).title }} · {{ t(j).org }}</span> }@if (cell.tags.length) { <em>{{ cell.tags.join(' · ') }}</em> }</span>
                    }
                  </i>
                }
              </div>
              @if (year() !== null) { <s class="head" [style.left.%]="headLeft()" [style.width.%]="100 / grid().cols"></s> }
            </div>
          </div>
        }
        <div class="axis mono" aria-hidden="true">
          @for (t of grid().ticks; track t.year; let last = $last) { <span [class.end]="last" [style.left.%]="last ? 100 : t.left">{{ t.year }}</span> }
        </div>
        <div class="status">
          <p class="readout" aria-hidden="true">{{ readout() }}</p>
          @if (filterName(); as name) {
            <button type="button" class="filter" [class.hide]="year() !== null" (click)="clear()">
              {{ name }}
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" /></svg>
              <span class="sr-only">{{ x().clearFilter }}</span>
            </button>
          }
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
      margin-inline: -0.5rem; border-radius: 10px; min-height: 36px; display: grid; line-height: 1.2;
      transition: background-color var(--dur-short) var(--ease-out);
    }
    .name small { color: var(--fg-2); font-size: var(--t-footnote); }
    @media (hover: hover) { .name:hover { background: color-mix(in srgb, var(--fg) 6%, transparent); } }
    .name[aria-pressed='true'] { background: color-mix(in srgb, var(--accent) 14%, transparent); }
    .name[aria-pressed='true'] small { color: var(--fg); }

    .track { position: relative; align-self: stretch; min-height: var(--row); touch-action: pan-y; cursor: crosshair; }
    .cells { position: absolute; inset: 0; display: grid; align-items: center; column-gap: 3px; }

    /* the foundation: one block per lane, flush with its neighbours, so together they read as one tall block */
    .base { position: relative; align-self: stretch; background: color-mix(in srgb, var(--fg) 20%, transparent); cursor: pointer; }
    .base.first { border-top-left-radius: 10px; border-top-right-radius: 10px; }
    .base.last { border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; }

    /* a year: empty, or one of four accent levels (how many technologies of the family its jobs list) */
    .cell { position: relative; height: var(--cell); cursor: pointer; font-style: normal; }
    /* the coloured part is its own layer: it fades and grows on its own, while the card inside the square stays as it is */
    .fill {
      position: absolute; inset: 0; border-radius: 5px; background: color-mix(in srgb, var(--fg) 7%, transparent);
      transition: opacity var(--dur-short) var(--ease-out), scale var(--dur-short) var(--ease-spring);
    }
    .cell[data-l='1'] .fill { background: color-mix(in srgb, var(--accent) 36%, transparent); }
    .cell[data-l='2'] .fill { background: color-mix(in srgb, var(--accent) 60%, transparent); }
    .cell[data-l='3'] .fill { background: color-mix(in srgb, var(--accent) 82%, transparent); }
    .cell[data-l='4'] .fill { background: var(--accent); }
    .cell.off .fill { opacity: 0.5; } /* another lane is being shown */
    .cell.dim .fill { opacity: 0.25; } /* a year or a skill is being shown, and this square's jobs are not in it */
    @media (hover: hover) { .cell:not([data-l='0']):hover { z-index: 6; } .cell:not([data-l='0']):hover .fill { scale: 1.12; } .base:hover { z-index: 6; } }

    /* what a square is, on hover (the log below carries the same facts for everyone else) */
    .tip {
      display: none; position: absolute; z-index: 5; top: calc(100% + 8px); left: 50%; translate: calc(var(--c, 50) * -1%) 0;
      width: max-content; max-width: 16rem; padding: 0.5rem 0.75rem; border-radius: 12px; pointer-events: none; cursor: default;
      background: var(--bg-2); border: 1px solid var(--line); box-shadow: var(--glass-shadow);
      font-size: var(--t-footnote); line-height: 1.35; color: var(--fg-2); white-space: normal;
    }
    .tip b { display: block; color: var(--fg); font-weight: 600; }
    .tip .job { display: block; }
    .tip em { display: block; margin-top: 0.125rem; font-style: normal; }
    @media (hover: hover) { .cell:hover .tip, .base:hover .tip { display: block; } }

    /* the year under the pointer */
    .head { position: absolute; top: 0; bottom: 0; border-radius: 5px; background: color-mix(in srgb, var(--fg) 12%, transparent); pointer-events: none; }

    .axis { position: relative; height: 1.25rem; margin-left: calc(var(--label) + 0.75rem); color: var(--fg-2); font-size: var(--t-footnote); }
    .axis span { position: absolute; top: 0.25rem; translate: -50%; }
    .axis span.end { translate: -100%; } /* the last year ends at the edge instead of hanging over it */
    /* the line under the grid: the year being pointed at, or else the lane that is chosen, as a chip that clears it */
    .status { display: grid; margin: 0.25rem 0 0 calc(var(--label) + 0.75rem); min-height: 2.75em; align-content: start; }
    .status > * { grid-area: 1 / 1; }
    .readout { margin: 0; color: var(--fg-2); font-size: var(--t-footnote); }
    .filter {
      justify-self: start; align-self: start; display: inline-flex; align-items: center; gap: 0.5rem; min-height: 32px; padding: 0 0.75rem 0 0.9rem; border: 0; border-radius: 999px;
      background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--fg); font: 500 var(--t-footnote) / 1 var(--font); cursor: pointer;
    }
    .filter.hide { visibility: hidden; }
    @media (hover: hover) { .filter:hover { background: color-mix(in srgb, var(--accent) 26%, transparent); } }

    @media (max-width: 599px) {
      .arc { --row: 34px; --cell: 22px; }
      .fill { border-radius: 4px; }
      .lane { grid-template-columns: 1fr; gap: 0; }
      .name { grid-auto-flow: column; justify-content: space-between; align-items: baseline; min-height: 32px; }
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
})
export class CareerArc implements OnInit {
  readonly c = input.required<SiteContent>();
  private readonly lens = inject(SkillLens);
  protected readonly base = BASE;

  /** The log opens with the Backend lane lit. */
  ngOnInit(): void {
    if (!this.lens.ids().size) this.lens.ids.set(new Set(this.ids('backend') as ItemId[]));
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

  /** The lane that is chosen (a preview is not a choice), by its name. */
  protected readonly filterName = computed(() => {
    const chosen = this.chosen();
    const lane = this.grid().lanes.find((l) => chosen.size === l.ids.length && l.ids.every((id) => chosen.has(id as ItemId)));
    return lane ? this.c().skills.groups[lane.group] : null;
  });

  protected readonly baseTags = computed(() => FACT_BY_ID[BASE].keywords.join(' · '));

  /** The year under the pointer, while it is scrubbing. */
  protected readonly year = signal<number | null>(null);
  protected readonly headLeft = computed(() => (((this.year() ?? 0) - this.grid().min) / this.grid().cols) * 100);
  private saved: ReadonlySet<ItemId> | null = null;
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

  private ids(lane: string): string[] {
    return this.grid().lanes.find((l) => l.id === lane)?.ids ?? [];
  }

  /** The chosen lane's jobs while the pointer rests on another lane's name (which previews that lane in the log). */
  private readonly held = signal<ReadonlySet<ItemId> | null>(null);
  /** What is actually chosen: the preview is not a choice. */
  private readonly chosen = computed(() => this.held() ?? this.lens.ids());
  /** The lane whose jobs are exactly what the log shows right now, if any. */
  private readonly shown = computed(() => {
    const lit = this.lens.ids();
    return this.grid().lanes.find((l) => lit.size === l.ids.length && l.ids.every((id) => lit.has(id as ItemId)))?.id ?? null;
  });

  protected pressed(lane: string): boolean {
    if (this.year() !== null) return false; // the lens belongs to the scrubbing pointer for now
    const mine = this.ids(lane);
    const chosen = this.chosen();
    return chosen.size === mine.length && mine.every((id) => chosen.has(id as ItemId));
  }

  /** A lane fades a little while another lane is being shown. */
  protected off(lane: string): boolean {
    const shown = this.shown();
    return this.lens.ids().size > 0 && shown !== null && shown !== lane;
  }

  /** A square fades more while a year or a skill is shown and none of its jobs is part of it. */
  protected dim(jobs: readonly string[]): boolean {
    const lit = this.lens.ids();
    return lit.size > 0 && this.shown() === null && !jobs.some((id) => lit.has(id as ItemId));
  }

  protected toggle(lane: string): void {
    const next = this.pressed(lane) ? new Set<ItemId>() : new Set(this.ids(lane) as ItemId[]);
    if (this.held() !== null) this.held.set(next); // while the pointer rests here, leaving puts this choice back
    this.lens.ids.set(next); // and the log shows the choice at once, so a click that clears it clears the log too
  }

  /** A mouse resting on a lane's name shows that lane in the log, without choosing it. */
  protected preview(e: PointerEvent, lane: string): void {
    if (e.pointerType !== 'mouse' || this.year() !== null) return;
    if (this.held() === null) this.held.set(this.lens.ids());
    this.lens.ids.set(new Set(this.ids(lane) as ItemId[]));
  }

  protected unpreview(): void {
    const back = this.held();
    if (back === null) return;
    this.held.set(null);
    this.lens.ids.set(back);
  }

  /** The entry opens where it is, in the log below; nothing jumps. */
  protected go(id: string): void {
    revealEntry(`job-${id}`);
  }

  protected clear(): void {
    if (this.held() !== null) this.held.set(new Set());
    this.lens.ids.set(new Set());
  }

  /** A square opens the newest job of its year in the log. */
  protected goCell(jobs: readonly string[]): void {
    if (jobs.length) this.go(jobs[0]);
  }

  /** Pointing at the grid lights the jobs of that year in the log (the lens is put back afterwards). */
  protected scrub(e: PointerEvent): void {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const g = this.grid();
    const year = g.min + Math.min(g.cols - 1, Math.floor(p * g.cols));
    if (this.year() === null) this.saved = this.lens.ids();
    this.year.set(year);
    const ids = activeAt(JOBS, year) as ItemId[];
    const key = ids.join();
    if (key !== this.lit) {
      this.lit = key;
      this.lens.ids.set(new Set(ids));
    }
  }

  protected leave(): void {
    if (this.year() === null) return;
    this.year.set(null);
    this.lit = '';
    this.lens.ids.set(this.saved ?? new Set());
    this.saved = null;
  }
}
