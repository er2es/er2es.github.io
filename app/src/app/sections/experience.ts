import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input } from '@angular/core';
import { EXTRA } from '../content/extra';
import { FACTS, FACT_BY_ID, FILES, period, tagLabel, type ItemId, type SiteContent } from '../content/model';
import { railGeometry } from '../graph/geometry';
import { layoutGraph } from '../graph/layout';
import { BASE, CareerArc } from './career-arc';
import { SkillLens } from './uses';

const INPUTS = FACTS.filter((f) => f.inGraph).map((f) => ({ id: f.id, main: f.main, start: f.start!, end: f.end! }));
const LAYOUT = layoutGraph(INPUTS);
const ROWS = LAYOUT.rows.map((row, i) => ({
  id: row.id as ItemId,
  fact: FACT_BY_ID[row.id as ItemId],
  rail: railGeometry(row, LAYOUT.laneCount, i === 0, i === LAYOUT.rows.length - 1),
}));

@Component({
  selector: 'app-experience',
  imports: [CareerArc],
  template: `
    <section id="experience" class="block alt" tabindex="-1" aria-labelledby="experience-h">
      <div class="wrap">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="experience-h">{{ c().ui.sections.experience }}</h2>
        <app-career-arc [c]="c()" />
        <p class="eyebrow mono roles" aria-hidden="true">roles/</p>
        <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -- one delegated keydown handler for the summaries inside (roving arrow keys); the list itself is not an interactive element -->
        <ol class="log" (keydown)="onKey($event)" (click)="byHand($event)">
          <li class="spine" aria-hidden="true"></li>
          @for (r of rows; track r.id; let first = $first; let last = $last) {
            <li class="row" [class.first]="first" [class.last]="last" [id]="'job-' + r.id" tabindex="-1" [class.lit]="lens.ids().has(r.id)" [class.base]="r.id === base" [class.side]="!r.fact.main">
              <div class="railcol" [style.width.px]="r.rail.width" aria-hidden="true">
                <svg class="rail" [attr.width]="r.rail.width" height="100%" focusable="false">
                  @for (l of r.rail.lines; track $index) {
                    <line [attr.x1]="l.x" [attr.x2]="l.x" [attr.y1]="l.y1" [attr.y2]="l.y2" [style.stroke]="'var(--lane-' + l.lane + ')'" stroke-width="2" />
                  }
                  @for (cv of r.rail.curves; track $index) {
                    <path [attr.d]="cv.d" fill="none" [attr.stroke-width]="cv.dashed ? 1 : 2" [attr.stroke-dasharray]="cv.dashed ? '2 3' : null" [style.stroke]="'var(--lane-' + cv.lane + ')'" />
                  }
                  @for (d of r.rail.dots; track $index) {
                    <circle class="halo" [attr.cx]="d.x" [attr.cy]="d.y" [attr.r]="d.r" [style.fill]="'var(--lane-' + d.lane + ')'" />
                    <g class="dot" [style.transform-origin]="d.x + 'px ' + d.y + 'px'">
                      <circle class="node" [attr.cx]="d.x" [attr.cy]="d.y" [attr.r]="d.r" [style.fill]="'var(--lane-' + d.lane + ')'" />
                      @if (d.lane > 0) { <path class="half" [attr.d]="half(d.x, d.y, d.r)" style="fill: var(--lane-0)" /> }
                      <circle class="ring" [attr.cx]="d.x" [attr.cy]="d.y" [attr.r]="d.r" fill="none" style="stroke: var(--bg-2); stroke-width: 2px" />
                    </g>
                  }
                </svg>
                @for (d of r.rail.dots; track $index) {
                  <span class="hit" (click)="toggle($event)" [style.left.px]="d.x - 12" [style.top.px]="d.y - 12" [attr.data-tip]="r.fact.main ? x().fullTime : x().partTime" data-tip-align="start"></span>
                }
              </div>
              <div class="body">
                <details>
                  <summary>
                    <span class="role">{{ c().items[r.id].title }}</span>
                    <span class="org">{{ c().items[r.id].org }}</span>
                    <span class="per">{{ per(r.id) }}</span><span class="sr-only"> · {{ r.fact.main ? x().fullTime : x().partTime }}</span>
                  </summary>
                  <ul class="pts">@for (p of c().items[r.id].points; track $index) { <li>{{ p }}</li> }</ul>
                  @if (r.fact.keywords.length) {
                    <p class="tags"><span class="sr-only">{{ c().ui.tags }}: </span>@for (k of r.fact.keywords; track k) { <span>{{ tag(k) }}</span> }<i class="sel" aria-hidden="true"></i></p>
                  }
                </details>
                <!-- the keys of an open card, which a click uses as well as the keyboard (outside the summary: a button must not be inside it) -->
                <div class="keys">
                  <button type="button" class="key up" [disabled]="first" [attr.aria-label]="x().prevRole" (mousedown)="$event.preventDefault()" (click)="stepBy(-1)">↑</button>
                  <button type="button" class="key down" [disabled]="last" [attr.aria-label]="x().nextRole" (mousedown)="$event.preventDefault()" (click)="stepBy(1)">↓</button>
                  <button type="button" class="key esc" [attr.aria-label]="x().closeRole" (mousedown)="$event.preventDefault()" (click)="putAway($event)">esc</button>
                </div>
              </div>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
  styles: [`
    .roles { margin-top: 2rem; }
    .log { position: relative; margin-top: 0.5rem; }
    .row { display: flex; gap: 0.75rem; scroll-margin-top: calc(var(--bar-h) + 1.25rem); outline: none; border-radius: var(--r-ctl); }
    .railcol { position: relative; flex: none; }
    .rail { position: absolute; inset: 0 0 auto; height: calc(100% + 1px); overflow: visible; } /* one pixel into the next row: the rows are not whole pixels high, and a line that ends exactly on the seam shows a hairline gap there */
    /* the nodes of the line say, on hover, whether the role was full-time (the main line) or a branch of it (part-time), and open or close their entry */
    .hit { position: absolute; z-index: 2; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; }
    .body { flex: 1; min-width: 0; padding-bottom: 0.25rem; }
    /* a part-time role is set in a little, as the branch it is: it can be seen at a glance beside which entry it ran */
    .row.side .body { margin-left: 1.25rem; }
    @media (max-width: 480px) { .row.side .body { margin-left: 0.75rem; } }
    summary { display: grid; gap: 0.125rem; padding-block: calc(0.5rem + 2px) calc(0.5rem - 2px); min-height: 44px; } /* the letters sit a little above the middle of their line box, so the box is weighted down 2px: the title looks centred in its bar, level with the node */
    summary { -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; position: relative; cursor: pointer; margin-inline: -0.5rem; padding-inline: 0.5rem 2rem; border-radius: var(--r-pop); }
    summary::after {
      content: ''; position: absolute; right: 1rem; top: 1.125rem; width: 8px; height: 8px;
      border-right: 2px solid var(--fg-2); border-bottom: 2px solid var(--fg-2); rotate: 45deg;
      transition: rotate var(--dur-short) var(--ease-out), translate var(--dur-short) var(--ease-out);
    }
    details[open] > summary::after { rotate: 225deg; translate: 0 4px; }
    /* the colours of a skill pill's hover, without its glint: the outline warms to the accent */
    /* the tint of a hovered or lit summary is a layer of its own, so that it can fade out downward in the open card, and back, as one motion */
    @property --tint-keep { syntax: '<percentage>'; inherits: false; initial-value: 100%; }
    summary { isolation: isolate; }
    summary::before {
      content: ''; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none; background: var(--tint-accent); opacity: 0; --tint-keep: 100%;
      -webkit-mask-image: linear-gradient(#000 var(--tint-keep), transparent); mask-image: linear-gradient(#000 var(--tint-keep), transparent);
      transition: opacity var(--dur-fade) var(--ease-out), --tint-keep var(--dur-med) var(--ease-settle);
    }
    @media (hover: hover) { summary:hover { box-shadow: inset 0 0 0 1px var(--ring-accent); } summary:hover::before { opacity: 1; } }
    /* an open entry is a card of its own: readable on the busy backdrop, and its summary keeps the hover and lit tints inside it */
    /* the frame of an open card: closed it has the same properties, transparent. Closing, it keeps its width and shape while the height goes (the frame itself must not move), fades at the end, and only then does the margin
       snap back, when there is nothing left to see move (the padding and the corners go with the height: a step at the end would be a click) */
    details { margin-inline: 0; padding-bottom: 0; border-radius: var(--r-pop); background: color-mix(in srgb, var(--bg-2) 0%, transparent); box-shadow: 0 0 0 1px transparent; transition: margin-inline var(--dur-med) step-end, padding-bottom var(--dur-med) var(--ease-settle), background-color var(--dur-fade) var(--ease-out) 120ms, box-shadow var(--dur-fade) var(--ease-out) 120ms; }
    details[open] { margin-inline: -0.5rem; padding-bottom: 0.25rem; background: color-mix(in srgb, var(--bg-2) 72%, transparent); box-shadow: 0 0 0 1px var(--ring); transition: margin-inline var(--dur-med) var(--ease-in-out), padding-bottom var(--dur-med) var(--ease-in-out), background-color var(--dur-fade) var(--ease-out), box-shadow var(--dur-fade) var(--ease-out); }
    /* opening and closing: the height grows past its end and settles, the text fades in; closing has no spring: the height goes in one motion with the text clipped by it, which fades only near the end
       (a text that is gone first leaves an empty frame). The transition of the state it is going to decides each direction. Native details-content box, so no script; browsers without it just open at once. */
    @media (prefers-reduced-motion: no-preference) {
      details { interpolate-size: allow-keywords; }
      details::details-content {
        block-size: 0; opacity: 0; overflow: clip;
        transition: block-size var(--dur-med) var(--ease-settle), opacity var(--dur-fade) var(--ease-in) 120ms, content-visibility var(--dur-med) allow-discrete;
      }
      details[open]::details-content {
        block-size: auto; opacity: 1;
        transition: block-size var(--dur-med) var(--ease-spring), opacity var(--dur-fade) var(--ease-out) 50ms, content-visibility var(--dur-med) allow-discrete;
      }
    }
    details[open] > summary { margin-inline: 0; border-radius: var(--r-pop) var(--r-pop) 0 0; } /* flush with the card's top, so its tint does not round off inside it */
    details[open] > summary::before { --tint-keep: 45%; } /* in the open card the tint fades out downward instead of ending on a hard line above the text */
    @media (hover: hover) { details[open] > summary:hover, details.closing > summary:hover { box-shadow: none; } } /* the card has its ring: a second one inside it would read as a double border (and while it closes, the bar waits) */
    details > :not(summary) { margin-inline: 0.5rem; } /* open or closing: the text keeps its padding while the card shuts (hidden when closed anyway) */
    @media (prefers-reduced-motion: reduce) { summary::after { transition: none; } }
    /*
     * On a wide screen an open entry is a card that comes forward: it lies over the entries below it instead of pushing them down, they step back a little (fainter and softer, and where they are), and the line and its nodes stay where
     * they are. Nothing under it has to be laid out again while it opens or closes, which is what keeps the motion smooth. Closed, an entry is the bar it always was (the bar has a fixed height; the card is
     * taken out of the flow and sits on it). One card at a time.
     */
    .keys { display: none; } /* (only a wide screen's open card has them) */
    @media (min-width: 1000px) {
      #experience:has(details[open]), #experience:has(details.closing) { content-visibility: visible; } /* the section is not clipped to its own box while a card lies over what is below it (it is back to auto when the card has gone) */
      .body { position: relative; height: calc(44px + 0.25rem); }
      details { position: absolute; inset-inline: 0; top: 0; }
      summary { white-space: nowrap; }
      .org { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
      /* the keys of an open card: Up and Down step between the entries, Escape puts it away (a click does too); dim at the ends of the log */
      .keys { position: absolute; z-index: 11; right: 5.75rem; top: 22px; translate: 0 calc(-50% - 3px); gap: 0.25rem; }
      @media (hover: hover) { .body details[open] ~ .keys { display: inline-flex; animation: keys-in var(--dur-med) var(--ease-out) 150ms both; } }
      .keys[data-step] { animation: none !important; } /* a card brought by a key has its keys at once */
      @keyframes keys-in { from { opacity: 0; } }
      .key { min-width: 1.25rem; padding: 0.15rem 0.3rem; border: 1px solid var(--line); border-radius: 5px; background: none; color: var(--fg-2); font: 500 0.6875rem / 1 var(--font); text-align: center; cursor: pointer; transition: background-color var(--dur-fade) var(--ease-out), color var(--dur-fade) var(--ease-out), opacity var(--dur-fade) var(--ease-out), scale var(--dur-short) var(--ease-spring); }
      @media (hover: hover) { .key:not(:disabled):hover { background: var(--tint-hover); color: var(--fg); } }
      .key:active:not(:disabled), .keys[data-hit='up'] .up, .keys[data-hit='down'] .down { background: var(--tint-hover); color: var(--fg); scale: 0.92; transition-duration: var(--dur-tap); transition-timing-function: var(--ease-out); }
      .key:disabled { opacity: 0.35; cursor: default; }
      .row:has(details.closing) { position: relative; z-index: 9; } /* a card that is going away lies under the one that is coming */
      .row:has(details[open]) { position: relative; z-index: 10; }
      details[open] { -webkit-backdrop-filter: blur(18px) saturate(140%); backdrop-filter: blur(18px) saturate(140%); box-shadow: 0 0 0 1px var(--ring), 0 30px 70px -28px rgb(0 0 0 / 0.45), 0 10px 24px -14px rgb(0 0 0 / 0.25); scale: 1.008; translate: 0 -3px; }
      details { -webkit-backdrop-filter: blur(0px); backdrop-filter: blur(0px); transition: margin-inline var(--dur-med) step-end, padding-bottom var(--dur-med) var(--ease-settle), background-color var(--dur-fade) var(--ease-out) 250ms, box-shadow var(--dur-fade) var(--ease-out) 250ms, -webkit-backdrop-filter var(--dur-fade) var(--ease-out) 250ms, backdrop-filter var(--dur-fade) var(--ease-out) 250ms, scale var(--dur-med) var(--ease-settle), translate var(--dur-med) var(--ease-settle); }
      /* opening: the frame (fill and blur) is there from the first frame, or what is under a card that has hardly grown would show through */
      details[open] { background: color-mix(in srgb, var(--bg-2) 90%, transparent); transition: margin-inline var(--dur-med) var(--ease-in-out), padding-bottom var(--dur-med) var(--ease-in-out), background-color 0s, box-shadow var(--dur-fade) var(--ease-out), -webkit-backdrop-filter 0s, backdrop-filter 0s, scale var(--dur-med) var(--ease-spring), translate var(--dur-med) var(--ease-spring); }
      /* the others step back */
      .log:has(details[open]) .row:not(:has(details[open])) .body { opacity: 0.55; filter: blur(0.6px); } /* (they come back as soon as the card starts to close: the card is still blurred and opaque while it shrinks, and the rows it uncovers are already sharp) */
      .body { transition: opacity var(--dur-fade) var(--ease-out), filter var(--dur-fade) var(--ease-out); }
      .log .row:has(details[open]) .body { transition: none; } /* the entry that opens is at full strength at once: a body still fading up would make its card translucent and take its blur (an opacity or filter above it limits its backdrop) */
      .dot, .halo { transition: scale var(--dur-short) var(--ease-spring); }
    }
    .role { font-weight: 700; }
    .per { color: var(--fg-2); font-size: var(--t-footnote); font-weight: 500; font-variant-numeric: tabular-nums; } /* years in the page's own font, figures of one width */
    .pts { margin: 0.25rem 0 0.75rem; display: grid; gap: 0.5rem; }
    .pts { list-style: none; padding: 0; }
    .pts { gap: 0.75rem; } /* no bullet, dash or line: the spacing alone separates the points */
    .tags { padding-bottom: 0.5rem; }

    /* the commit node answers its row: grows a little on hover/focus, sends one ring out when the entry opens */
    .halo { transform-box: fill-box; transform-origin: center; }
    .dot { transform-box: view-box; } /* a node scales about its own centre (set on the element) */
    /* a node of a branch is half the colour of the main line: the role ran beside the main one */
    .halo { opacity: 0; }
    @media (prefers-reduced-motion: no-preference) {
      .dot { transition: scale var(--dur-short) var(--ease-spring); }
      .row:focus-within .dot { scale: 1.3; }
      @media (hover: hover) { .row:hover .dot { scale: 1.3; } } /* not on a touch screen, where a hover would stay after a tap */
      .row:has(details[open]) .halo { animation: ring var(--dur-ring) var(--ease-out); }
    }
    @keyframes ring { from { scale: 1; opacity: 0.5; } to { scale: 2.8; opacity: 0; } }

    /* lit by a skill chosen in the Skills section */
    summary { transition: box-shadow var(--dur-fade) var(--ease-out), margin-inline var(--dur-med) step-end, border-radius var(--dur-med) var(--ease-settle); }
    details[open] > summary { transition: box-shadow var(--dur-fade) var(--ease-out), margin-inline var(--dur-med) var(--ease-in-out), border-radius var(--dur-med) var(--ease-in-out); }
    .row.lit summary::before { opacity: 1; }
    .row.lit .per { color: var(--fg); } /* the tint is darker than the page: keep the small text readable */
    .row.lit .dot { scale: 1.3; }
    /* the foundation (the first job) is the same grey as its block in the graph, not the accent tint of the others */
    .row.lit.base summary::before { background: var(--tint-current); }

    /* the career line fills with the accent colour as you scroll: one line for the whole log, from the first node to the last
       (scroll-driven, transform only; --tail, the last entry's height less its node, is set in script) */
    .spine { position: absolute; z-index: 1; left: 7px; width: 2px; top: 22px; bottom: var(--tail, 0px); list-style: none; background: var(--accent); transform-origin: top; pointer-events: none; }
    @media (prefers-reduced-motion: no-preference) {
      @supports (animation-timeline: view()) {
        .spine { animation: grow linear both; animation-timeline: view(); animation-range: cover 5% cover 80%; }
      }
    }
    @media (prefers-reduced-motion: reduce) { .spine { display: none; } }
    @keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }

    @media (min-width: 700px) {
      summary { grid-template-columns: auto 1fr auto; align-items: baseline; gap: 0.75rem; }
      .per { text-align: right; }
    }
  `],
})
export class Experience {
  readonly c = input.required<SiteContent>();
  protected readonly rows = ROWS;
  protected readonly base = BASE;
  /** The left half of a node (a half circle), which is drawn in the colour of the main line. */
  protected half = (x: number, y: number, r: number): string => `M${x},${y - r} A${r},${r} 0 0 0 ${x},${y + r} Z`;
  protected readonly x = computed(() => EXTRA[this.c().lang]);
  protected tag = (k: string): string => tagLabel(k, this.c().lang);
  protected readonly file = FILES.experience;

  protected readonly lens = inject(SkillLens);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const host = this.host;
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      // the line of the career ends at the last node, whatever the height of the last entry
      const log = host.nativeElement.querySelector<HTMLElement>('.log');
      const last = log?.lastElementChild as HTMLElement | null;
      if (!log || !last) return;
      const ro = new ResizeObserver(() => log.style.setProperty('--tail', `${last.offsetHeight - 22}px`));
      ro.observe(last);
      destroy.onDestroy(() => ro.disconnect());
      // what a card's opening and closing change besides itself, seen at the moment the attribute changes (before the next frame)
      const mo = new MutationObserver((records) => {
        if (!matchMedia('(min-width: 1000px)').matches) return;
        for (const rec of records) {
          const d = rec.target as HTMLDetailsElement;
          const wasOpen = rec.oldValue !== null;
          if (d.open && !wasOpen) this.opened(d, log);
          else if (!d.open && wasOpen) this.shut(d);
        }
      });
      mo.observe(log, { attributes: true, attributeFilter: ['open'], attributeOldValue: true, subtree: true });
      destroy.onDestroy(() => mo.disconnect());
      // on a wide screen the open card is a layer: a click outside it, or Escape, puts it away
      const away = (e: Event): void => {
        if (!matchMedia('(min-width: 1000px)').matches) return;
        const open = log.querySelector<HTMLDetailsElement>('details[open]');
        if (!open) return;
        if (e instanceof KeyboardEvent) {
          if (e.key !== 'Escape') {
            this.arrow(e);
            return;
          }
          if (e.key === 'Escape') {
            open.open = false;
            open.querySelector('summary')?.focus();
          }
          return;
        }
        const t = e.target as Element;
        if (t.closest('.keys')) return; // the keys have stepped to another card already, which this click is not outside of
        if (t.closest('main') && !open.closest('.row')?.contains(t)) open.open = false; // a click in the page, not in a dialog or on the bars (a search result opens a card by a click of its own)
      };
      document.addEventListener('click', away);
      document.addEventListener('keydown', away);
      destroy.onDestroy(() => {
        document.removeEventListener('click', away);
        document.removeEventListener('keydown', away);
      });
    });
  }

  /** Up/Down (and Home/End) move between the entries' summaries, like a list. */
  protected onKey(e: KeyboardEvent): void {
    const t = e.target as HTMLElement;
    if (this.arrow(e)) return;
    if (t.tagName !== 'SUMMARY' || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const all = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(':scope > li > .body > details > summary')];
    const i = all.indexOf(t);
    const next = e.key === 'Home' ? all[0] : e.key === 'End' ? all[all.length - 1] : all[i + (e.key === 'ArrowDown' ? 1 : -1)];
    e.preventDefault();
    next?.focus();
  }

  /** Whether the card that opens now was opened by the reader's own hand (a click on its bar or its node, or a key), not by a jump: only then does it bring itself into view. */
  private byUser = false;
  protected byHand(e: Event): void {
    if ((e.target as Element).closest('summary, .hit')) this.hand();
  }
  private hand(): void {
    this.byUser = true;
    setTimeout(() => (this.byUser = false), 400);
  }

  /** Up and Down, with a card open on a wide screen, step to the entry above or below it: that one opens and the open one closes (Escape puts it away). Returns whether the key was taken. */
  private arrow(e: KeyboardEvent): boolean {
    const dir = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!dir || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return false;
    if ((e.target as Element).closest('dialog, input, textarea, select, [contenteditable]')) return false;
    if (!matchMedia('(min-width: 1000px)').matches) return false;
    if (!this.host.nativeElement.querySelector('.log details[open]')) return false;
    e.preventDefault(); // the page does not scroll under a card that is being stepped through
    this.step(dir);
    return true;
  }

  /** The entry above (-1) or below (1) the open card opens and the open one closes; at the ends of the log nothing happens. */
  private step(dir: 1 | -1): void {
    const all = [...this.host.nativeElement.querySelectorAll<HTMLDetailsElement>('.log details')];
    const next = all[all.findIndex((d) => d.open) + dir];
    if (!next || all.findIndex((d) => d.open) < 0) return;
    this.hand();
    next.open = true;
    next.querySelector('summary')?.focus({ preventScroll: true });
    const keys = next.closest('.body')?.querySelector('.keys');
    keys?.setAttribute('data-step', '');
    keys?.setAttribute('data-hit', dir > 0 ? 'down' : 'up');
    setTimeout(() => keys?.removeAttribute('data-hit'), 260);
  }

  /** The small keys of an open card, clicked. */
  protected stepBy(dir: 1 | -1): void {
    this.step(dir);
  }

  protected putAway(e: Event): void {
    const d = (e.currentTarget as HTMLElement).closest('.body')?.querySelector('details');
    if (!d) return;
    d.open = false;
    d.querySelector('summary')?.focus({ preventScroll: true });
  }

  /** A card has just opened: one at a time. */
  private opened(d: HTMLDetailsElement, log: Element): void {
    for (const other of log.querySelectorAll<HTMLDetailsElement>('details[open]')) if (other !== d) other.open = false; // one card at a time
    if (this.byUser) requestAnimationFrame(() => this.bring(d)); // (a jump from a search result or a link scrolls by itself)
  }

  /** A card that reaches below the screen brings itself into view: the page scrolls, gently, as far as its last line needs (never so far that its top goes under the bar). */
  private bring(d: HTMLDetailsElement): void {
    if (!d.open) return;
    const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) || 64;
    const top = d.getBoundingClientRect().top;
    const air = Math.max(40, innerHeight * 0.08); // room around it: a card that is cut to the pixel to the edge of the screen looks pinned there
    const above = bar + Math.max(32, innerHeight * 0.06);
    const bottom = (d.lastElementChild as HTMLElement).getBoundingClientRect().bottom + air; // laid out at its full size already, while the card is still growing
    const delta = top - above < -4 ? top - above : Math.min(bottom - innerHeight, top - above); // its top under the bar: up; its end below the screen: down, but not so far that the top goes under the bar
    if (Math.abs(delta) > 4) scrollBy({ top: delta, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  /** A card has just closed: it is `closing` while it settles (its hovered bar waits to show its ring,). */
  private shut(d: HTMLDetailsElement): void {
    d.classList.add('closing');
    setTimeout(() => d.classList.remove('closing'), 480);
  }

  /** A node of the line opens (or closes) the entry it belongs to. */
  protected toggle(e: Event): void {
    const details = (e.currentTarget as HTMLElement).closest('.row')?.querySelector('details');
    if (details) details.open = !details.open;
  }

  protected per(id: ItemId): string {
    return period(FACT_BY_ID[id]);
  }
}
