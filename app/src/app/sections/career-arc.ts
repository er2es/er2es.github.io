import { Component, computed, inject, input, signal, type OnInit } from '@angular/core';
import { scrollToSection } from '../core/nav';
import { FACTS, FACT_BY_ID, SKILLS, period, type ItemId, type ItemText, type SiteContent } from '../content/model';
import { activeAt, careerArc, fromYear } from '../graph/arc';
import { SKILL_TERMS, SkillLens, usesOf } from './uses';

const JOBS = FACTS.filter((f) => f.kind === 'job').map((f) => ({ id: f.id, start: f.start!, end: f.end!, main: f.main }));
/** The first job: not a skill family but the ground the others grew from, drawn as a trunk beside every lane. */
const BASE: ItemId = 'edu-nonprofit';

/**
 * The career at a glance, as a branch graph: the first job is the trunk, each skill family a branch that grows
 * out of it, one bar per job that used the family ("used in the role", not a level of skill; side jobs are thin).
 * A lane name lights its jobs in the log below (the same lens the Skills section uses), a bar (or the trunk) jumps to its entry,
 * and pointing at the time axis shows what the year looked like.
 * The log underneath stays the readable source, so the drawing is hidden from assistive technology.
 */
@Component({
  selector: 'app-career-arc',
  template: `
      <div class="arc" role="group" [attr.aria-label]="c().experience.arc">
        <p class="eyebrow mono" aria-hidden="true">skills/</p>
        @for (l of arc().lanes; track l.id; let i = $index; let last = $last) {
          <div class="lane" [style.--i]="i">
            <button type="button" class="name" [attr.aria-pressed]="pressed(l.id)" (click)="toggle(l.id)" (pointerenter)="preview($event, l.id)" (pointerleave)="unpreview()">
              {{ c().skills.groups[l.group] }} <small class="mono">{{ from(l.since) }}</small>
            </button>
            <div class="track" aria-hidden="true" (pointermove)="scrub($event)" (pointerdown)="scrub($event)" (pointerleave)="leave()">
              @for (t of arc().ticks; track t.year) { @if (t.left < 100) { <i class="grid" [style.left.%]="t.left"></i> } }
              <i class="base" [class.first]="i === 0" [class.last]="last" [style.width.%]="arc().base.width" [style.--c]="arc().base.width / 2" (click)="go(base)">
                <span class="tip"><b>{{ t(base).title }}</b>{{ t(base).org }} · {{ per(base) }}<em>{{ baseTags() }}</em></span>
              </i>
              @for (b of l.bars; track b.id) {
                <i class="bar" [class.side]="!b.main" [class.dim]="dim(b.id)" [style.left.%]="b.left" [style.width.%]="b.width" [style.--c]="b.left + b.width / 2" (click)="go(b.id)">
                  <span class="fill"></span>
                  <span class="tip"><b>{{ t(b.id).title }}</b>{{ t(b.id).org }} · {{ per(b.id) }}@if (b.tags.length) { <em>{{ b.tags.join(' · ') }}</em> }</span>
                </i>
              }
              @if (pos() !== null) { <s class="head" [style.left.%]="(pos() ?? 0) * 100"></s> }
              <s class="now"></s>
            </div>
          </div>
        }
        <div class="axis mono" aria-hidden="true">
          @for (t of arc().ticks; track t.year; let last = $last) { <span [class.end]="last" [style.left.%]="t.left">{{ t.year }}</span> }
        </div>
        <p class="readout" aria-hidden="true">{{ readout() }}</p>
      </div>
  `,
  styles: [`
    :host { display: block; }
    .eyebrow { margin-bottom: 0.5rem; }
    .arc { margin-top: 1.5rem; --label: 8.5rem; --row: 46px; }
    .lane { display: grid; grid-template-columns: var(--label) 1fr; align-items: center; gap: 0.75rem; }
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
    /* the thin rail every branch runs along */
    .track::before { content: ''; position: absolute; inset: 50% 0 auto; height: 4px; translate: 0 -50%; border-radius: 2px; background: color-mix(in srgb, var(--fg) 7%, transparent); }
    .grid { position: absolute; top: 0; bottom: 0; width: 1px; background: color-mix(in srgb, var(--fg) 7%, transparent); }

    /* the trunk: one segment per lane, flush with its neighbours, so together they read as one tall bar */
    .base {
      position: absolute; left: 0; top: 0; bottom: 0; background: color-mix(in srgb, var(--fg) 20%, transparent); cursor: pointer;
    }
    .base.first { border-top-left-radius: 10px; border-top-right-radius: 10px; }
    .base.last { border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; }

    .bar { position: absolute; top: calc(50% - 15px); height: 24px; cursor: pointer; transform-origin: 0 50%; font-style: normal; transition: opacity var(--dur-short) var(--ease-out); }
    /* the coloured part is its own layer: it grows on hover, while the card inside the bar keeps its shape */
    .fill {
      position: absolute; inset: 0; background: var(--accent); border-radius: 8px; box-shadow: 0 0 0 1.5px var(--bg-2);
      transition: scale var(--dur-short) var(--ease-spring);
    }
    /* a side job runs alongside a main one: a thin bar just below it */
    .bar.side { top: calc(50% + 12px); height: 6px; }
    .bar.side .fill { border-radius: 3px; background: color-mix(in srgb, var(--accent) 60%, transparent); box-shadow: none; }
    .bar.dim { opacity: 0.25; }
    @media (hover: hover) { .bar:hover { z-index: 6; } .bar:hover .fill { scale: 1 1.2; } }

    /* what a bar is, on hover (the log below carries the same facts for everyone else) */
    .tip {
      display: none; position: absolute; z-index: 5; top: calc(100% + 8px); left: 50%; translate: calc(var(--c, 50) * -1%) 0;
      width: max-content; max-width: 16rem; padding: 0.5rem 0.75rem; border-radius: 12px; pointer-events: none; cursor: default;
      background: var(--bg-2); border: 1px solid var(--line); box-shadow: var(--glass-shadow);
      font-size: var(--t-footnote); line-height: 1.35; color: var(--fg-2); white-space: normal;
    }
    .tip b { display: block; color: var(--fg); font-weight: 600; }
    .tip em { display: block; margin-top: 0.125rem; font-style: normal; }
    @media (hover: hover) { .bar:hover .tip, .base:hover .tip { display: block; } .base:hover { z-index: 6; } }

    .head { position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: var(--accent); pointer-events: none; }
    .now { position: absolute; right: 0; top: 0; bottom: 0; width: 1px; background: color-mix(in srgb, var(--accent) 55%, transparent); pointer-events: none; }

    .axis { position: relative; height: 1.25rem; margin-left: calc(var(--label) + 0.75rem); color: var(--fg-2); font-size: var(--t-footnote); }
    .axis span { position: absolute; top: 0.25rem; translate: -50%; }
    .axis span:first-child { translate: 0; }
    .axis span.end { translate: -100%; } /* the last year ends at the edge instead of hanging over it */
    .readout { min-height: 2.75em; margin: 0.25rem 0 0 calc(var(--label) + 0.75rem); color: var(--fg-2); font-size: var(--t-footnote); }

    @media (max-width: 599px) {
      .arc { --row: 34px; }
      .lane { grid-template-columns: 1fr; gap: 0; }
      .name { grid-auto-flow: column; justify-content: space-between; align-items: baseline; min-height: 32px; }
      .bar { top: calc(50% - 13px); height: 22px; }
      .bar.side { top: calc(50% + 11px); height: 5px; }
      .axis, .readout { margin-left: 0; }
      .axis span:nth-last-child(2) { display: none; } /* the year before it would touch the last one on a narrow screen */
    }

    /* the branches grow out of the trunk as the chart scrolls into view (scroll-driven, transform only) */
    @media (prefers-reduced-motion: no-preference) {
      @supports (animation-timeline: view()) {
        .arc .bar { animation: sprout linear both; animation-timeline: view(); animation-range: entry calc(var(--i, 0) * 7%) entry calc(55% + var(--i, 0) * 7%); }
      }
    }
    @keyframes sprout { from { transform: scaleX(0); opacity: 0; } to { transform: scaleX(1); opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .name, .bar, .fill { transition: none; } }
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

  protected readonly arc = computed(() => {
    const items = this.c().items;
    const groups = SKILLS.filter((g) => g.group !== 'other');
    const lanes = groups.map((g) => ({
      id: g.group,
      jobs: [...new Set(g.items.flatMap((s) => usesOf(s.name, FACTS, items)))].filter((id) => id !== BASE && JOBS.some((j) => j.id === id)),
      terms: new Set(g.items.flatMap((s) => [s.name, ...(SKILL_TERMS[s.name] ?? [])]).map((t) => t.toLowerCase())),
    }));
    const arc = careerArc(JOBS, [...lanes, { id: BASE, jobs: [BASE] }]);
    const base = arc.lanes.find((l) => l.id === BASE)!.bars[0];
    const out = arc.lanes
      .filter((l) => l.id !== BASE)
      .map((l) => {
        const lane = lanes.find((x) => x.id === l.id)!;
        return {
          ...l,
          group: l.id as (typeof groups)[number]['group'],
          ids: lane.jobs,
          bars: l.bars.map((b) => ({ ...b, tags: FACT_BY_ID[b.id as ItemId].keywords.filter((k) => lane.terms.has(k.toLowerCase())) })),
        };
      })
      .sort((a, b) => a.since - b.since); // branches in the order they started
    return { ...arc, base, lanes: out };
  });

  protected readonly baseTags = computed(() => FACT_BY_ID[BASE].keywords.join(' · '));

  /** Where the pointer is on the time axis (0..1), while it is scrubbing. */
  protected readonly pos = signal<number | null>(null);
  private saved: ReadonlySet<ItemId> | null = null;
  private lit = '';

  protected readonly readout = computed(() => {
    const p = this.pos();
    if (p === null) return '';
    const a = this.arc();
    const year = Math.min(a.max, Math.floor(a.min + p * (a.max - a.min)));
    const ids = activeAt(JOBS, year);
    const families = a.lanes.filter((l) => ids.some((id) => l.ids.includes(id as ItemId))).map((l) => this.c().skills.groups[l.group]);
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
    return this.arc().lanes.find((l) => l.id === lane)?.ids ?? [];
  }

  /** The chosen lane's jobs while the pointer rests on another lane's name (which previews that lane in the log). */
  private readonly held = signal<ReadonlySet<ItemId> | null>(null);
  /** What is actually chosen: the preview is not a choice. */
  private readonly chosen = computed(() => this.held() ?? this.lens.ids());

  protected pressed(lane: string): boolean {
    if (this.pos() !== null) return false; // the lens belongs to the scrubbing pointer for now
    const mine = this.ids(lane);
    const chosen = this.chosen();
    return chosen.size === mine.length && mine.every((id) => chosen.has(id as ItemId));
  }

  protected dim(id: string): boolean {
    const lit = this.lens.ids();
    return lit.size > 0 && !lit.has(id as ItemId);
  }

  protected toggle(lane: string): void {
    const next = this.pressed(lane) ? new Set<ItemId>() : new Set(this.ids(lane) as ItemId[]);
    if (this.held() !== null) this.held.set(next); // while the pointer rests here, leaving puts this choice back
    this.lens.ids.set(next); // and the log shows the choice at once, so a click that clears it clears the log too
  }

  /** A mouse resting on a lane's name shows that lane in the log, without choosing it. */
  protected preview(e: PointerEvent, lane: string): void {
    if (e.pointerType !== 'mouse' || this.pos() !== null) return;
    if (this.held() === null) this.held.set(this.lens.ids());
    this.lens.ids.set(new Set(this.ids(lane) as ItemId[]));
  }

  protected unpreview(): void {
    const back = this.held();
    if (back === null) return;
    this.held.set(null);
    this.lens.ids.set(back);
  }

  protected go(id: string): void {
    scrollToSection(`job-${id}`);
  }

  /** Pointing at the axis lights the jobs of that year in the log (the lens is put back afterwards). */
  protected scrub(e: PointerEvent): void {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    if (this.pos() === null) this.saved = this.lens.ids();
    this.pos.set(p);
    const a = this.arc();
    const ids = activeAt(JOBS, Math.min(a.max, Math.floor(a.min + p * (a.max - a.min)))) as ItemId[];
    const key = ids.join();
    if (key !== this.lit) {
      this.lit = key;
      this.lens.ids.set(new Set(ids));
    }
  }

  protected leave(): void {
    if (this.pos() === null) return;
    this.pos.set(null);
    this.lit = '';
    this.lens.ids.set(this.saved ?? new Set());
    this.saved = null;
  }
}
