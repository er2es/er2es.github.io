import { Component, input } from '@angular/core';
import { FACTS, FACT_BY_ID, FILES, period, type ItemId, type Locale, type SiteContent } from '../content/model';
import { railGeometry } from '../graph/geometry';
import { layoutGraph } from '../graph/layout';
import { anchorHref, inPageClick } from '../core/nav';

const LAYOUT = layoutGraph(
  FACTS.filter((f) => f.inGraph).map((f) => ({ id: f.id, main: f.main, start: f.start!, end: f.end! })),
);
const ROWS = LAYOUT.rows.map((row, i) => ({
  id: row.id as ItemId,
  fact: FACT_BY_ID[row.id as ItemId],
  rail: railGeometry(row, LAYOUT.laneCount, i === 0, i === LAYOUT.rows.length - 1),
}));

@Component({
  selector: 'app-experience',
  template: `
    <section id="experience" class="block alt" tabindex="-1" aria-labelledby="experience-h">
      <div class="wrap">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="experience-h">{{ c().ui.sections.experience }}</h2>
        <p class="intro">{{ c().experience.intro }}</p>
        <ol class="log">
          @for (r of rows; track r.id; let first = $first) {
            <li class="row">
              <div class="railcol" [style.width.px]="r.rail.width" aria-hidden="true">
                <svg class="rail" [attr.width]="r.rail.width" height="100%" focusable="false">
                  @for (l of r.rail.lines; track $index) {
                    <line [attr.x1]="l.x" [attr.x2]="l.x" [attr.y1]="l.y1" [attr.y2]="l.y2" [style.stroke]="'var(--lane-' + l.lane + ')'" stroke-width="2" />
                  }
                  @for (cv of r.rail.curves; track $index) {
                    <path [attr.d]="cv.d" fill="none" stroke-width="2" [style.stroke]="'var(--lane-' + cv.lane + ')'" />
                  }
                  @for (d of r.rail.dots; track $index) {
                    <circle [attr.cx]="d.x" [attr.cy]="d.y" [attr.r]="d.r" [style.fill]="'var(--lane-' + d.lane + ')'" style="stroke: var(--bg-2); stroke-width: 2px" />
                  }
                </svg>
              </div>
              <div class="body">
                @if (r.fact.kind === 'job') {
                  <details [open]="first">
                    <summary>
                      <span class="role">{{ c().items[r.id].title }}</span>
                      <span class="org">{{ c().items[r.id].org }}</span>
                      <span class="per mono">{{ per(r.id) }}</span>
                    </summary>
                    <ul class="pts">@for (p of c().items[r.id].points; track $index) { <li>{{ p }}</li> }</ul>
                    @if (r.fact.keywords.length) {
                      <p class="tags"><span class="sr-only">{{ c().ui.tags }}: </span>@for (k of r.fact.keywords; track k) { <span>{{ k }}</span> }</p>
                    }
                  </details>
                } @else {
                  <div class="proj">
                    <span class="role">{{ c().items[r.id].title }}</span>
                    <span class="per mono">{{ per(r.id) }}</span>
                    <a [attr.href]="href('p-' + r.id)" (click)="go($event, 'p-' + r.id)">{{ c().ui.graph.seeProject }}</a>
                  </div>
                }
              </div>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
  styles: [`
    .log { margin-top: 2rem; }
    .row { display: flex; gap: 0.75rem; }
    .railcol { position: relative; flex: none; }
    .rail { position: absolute; inset: 0; height: 100%; overflow: visible; }
    .body { flex: 1; min-width: 0; padding-bottom: 1.5rem; padding-top: 0.5rem; }
    summary, .proj { display: grid; gap: 0.125rem; padding-block: 0.5rem; min-height: 44px; }
    summary { position: relative; cursor: pointer; margin-inline: -0.5rem; padding-inline: 0.5rem 2rem; border-radius: 10px; }
    summary::after {
      content: ''; position: absolute; right: 1rem; top: 1.125rem; width: 8px; height: 8px;
      border-right: 2px solid var(--fg-2); border-bottom: 2px solid var(--fg-2); rotate: 45deg;
      transition: rotate 0.2s ease;
    }
    details[open] > summary::after { rotate: 225deg; top: 1.375rem; }
    @media (hover: hover) { summary:hover { background: color-mix(in srgb, var(--fg) 6%, transparent); } }
    @media (prefers-reduced-motion: reduce) { summary::after { transition: none; } }
    .proj { cursor: default; }
    .role { font-weight: 700; }
    .org { color: var(--fg); }
    .per { color: var(--fg-2); font-size: var(--t-footnote); }
    .pts { margin: 0.5rem 0 0.75rem; display: grid; gap: 0.5rem; }
    .pts li { padding-left: 1rem; position: relative; }
    .pts li::before { content: ''; position: absolute; left: 0; top: 0.7em; width: 5px; height: 5px; border-radius: 50%; background: var(--fg-2); }
    @media (min-width: 700px) {
      summary { grid-template-columns: auto 1fr auto; align-items: baseline; gap: 0.75rem; }
      .proj { grid-template-columns: auto auto 1fr; align-items: baseline; gap: 0.75rem; }
      .per { text-align: right; }
    }
  `],
})
export class Experience {
  readonly c = input.required<SiteContent>();
  readonly locale = input.required<Locale>();
  protected readonly rows = ROWS;
  protected readonly file = FILES.experience;

  protected per(id: ItemId): string {
    return period(FACT_BY_ID[id]);
  }

  protected href(id: string): string {
    return anchorHref(this.locale(), id);
  }

  protected go(e: Event, id: string): void {
    inPageClick(e, id);
  }
}
