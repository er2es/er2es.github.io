import { Component, input } from '@angular/core';
import { FACTS, FACT_BY_ID, FILES, period, type ItemId, type SiteContent } from '../content/model';
import { railGeometry } from '../graph/geometry';
import { layoutGraph } from '../graph/layout';

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
            <li class="row" [id]="'job-' + r.id" tabindex="-1">
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
                <span class="fill"></span>
              </div>
              <div class="body">
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
              </div>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
  styles: [`
    .log { margin-top: 1.5rem; }
    .row { display: flex; gap: 0.75rem; scroll-margin-top: calc(var(--bar-h) + 1.25rem); outline: none; border-radius: 12px; }
    .railcol { position: relative; flex: none; }
    .rail { position: absolute; inset: 0; height: 100%; overflow: visible; }
    .body { flex: 1; min-width: 0; padding-bottom: 0.25rem; }
    summary { display: grid; gap: 0.125rem; padding-block: 0.5rem; min-height: 44px; }
    summary { position: relative; cursor: pointer; margin-inline: -0.5rem; padding-inline: 0.5rem 2rem; border-radius: 10px; }
    summary::after {
      content: ''; position: absolute; right: 1rem; top: 1.125rem; width: 8px; height: 8px;
      border-right: 2px solid var(--fg-2); border-bottom: 2px solid var(--fg-2); rotate: 45deg;
      transition: rotate 0.25s ease, top 0.25s ease;
    }
    details[open] > summary::after { rotate: 225deg; top: 1.375rem; }
    @media (hover: hover) { summary:hover { background: color-mix(in srgb, var(--fg) 6%, transparent); } }
    @media (prefers-reduced-motion: reduce) { summary::after { transition: none; } }
    .role { font-weight: 700; }
    .per { color: var(--fg-2); font-size: var(--t-footnote); }
    .pts { margin: 0.25rem 0 0.75rem; display: grid; gap: 0.5rem; }
    .pts li { padding-left: 1rem; position: relative; }
    .pts li::before { content: ''; position: absolute; left: 0; top: 0.7em; width: 5px; height: 5px; border-radius: 50%; background: var(--fg-2); }
    .tags { padding-bottom: 0.5rem; }

    /* the career line fills with the accent colour as you scroll (scroll-driven, transform only) */
    .fill { position: absolute; left: 7px; width: 2px; top: 0; bottom: 0; background: var(--accent); transform-origin: top; pointer-events: none; }
    .row:first-child .fill { top: 22px; }
    .row:last-child .fill { bottom: calc(100% - 22px); }
    @media (prefers-reduced-motion: no-preference) {
      @supports (animation-timeline: view()) {
        .fill { animation: grow linear both; animation-timeline: view(); animation-range: cover 5% cover 55%; }
      }
    }
    @keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }

    /* smooth disclosure where the browser supports it (progressive enhancement) */
    @media (prefers-reduced-motion: no-preference) {
      details { interpolate-size: allow-keywords; }
      details::details-content { block-size: 0; overflow: hidden; transition: block-size 0.35s cubic-bezier(0.22, 1, 0.36, 1), content-visibility 0.35s allow-discrete; }
      details[open]::details-content { block-size: auto; }
    }

    @media (min-width: 700px) {
      summary { grid-template-columns: auto 1fr auto; align-items: baseline; gap: 0.75rem; }
      .per { text-align: right; }
    }
  `],
})
export class Experience {
  readonly c = input.required<SiteContent>();
  protected readonly rows = ROWS;
  protected readonly file = FILES.experience;

  protected per(id: ItemId): string {
    return period(FACT_BY_ID[id]);
  }
}
