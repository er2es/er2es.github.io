import { Component, input } from '@angular/core';
import type { SiteContent } from '../content/model';

/** Soft skills: six small line-icon tiles in one row, each with its name as a tooltip (and for assistive technology), like the hobbies. */
@Component({
  selector: 'app-soft',
  template: `
    <p class="eyebrow mono" aria-hidden="true">soft skills/</p>
    <!-- the tiles are focusable only to show their name: keyboard parity with the hover tooltip -->
    <ul class="soft" [attr.aria-label]="c().about.soft.label" (pointerdown)="reveal($event)">
      <svg class="trail" viewBox="0 0 600 136.5" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M42.5 42.5 C94 42.5 94 76.5 145.5 76.5 S197 51 248.5 51 S300 85 351.5 85 S403 46.8 454.5 46.8 S506 72.3 557.5 72.3" vector-effect="non-scaling-stroke" /></svg>
      <li data-tip-pos="top" tabindex="0" class="tile team" [attr.data-tip]="c().about.soft.team">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><g class="p-c"><circle cx="24" cy="15" r="5" /><path d="M14 40v-4a10 10 0 0 1 20 0v4" /></g><g class="p-l"><circle cx="8.5" cy="21" r="3.6" /><path d="M3 38v-3a6 6 0 0 1 7.5-5.8" /></g><g class="p-r"><circle cx="39.5" cy="21" r="3.6" /><path d="M45 38v-3a6 6 0 0 0-7.5-5.8" /></g></svg>
        <span class="sr-only">{{ c().about.soft.team }}</span>
      </li>
      <li data-tip-pos="top" tabindex="0" class="tile comms" [attr.data-tip]="c().about.soft.comms">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><g class="c1"><path d="M7 7h20a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H15l-7 6v-6H7a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3z" /></g><g class="c2"><path d="M34 19h7a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3h-1v6l-7-6H22a3 3 0 0 1-3-3v-2" /></g></svg>
        <span class="sr-only">{{ c().about.soft.comms }}</span>
      </li>
      <li data-tip-pos="top" tabindex="0" class="tile solo" [attr.data-tip]="c().about.soft.solo">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="18" /><g class="needle"><path d="M32 16l-5.5 10.5L16 32l5.5-10.5z" /><circle cx="24" cy="24" r="1.4" /></g></svg>
        <span class="sr-only">{{ c().about.soft.solo }}</span>
      </li>
      <li data-tip-pos="top" tabindex="0" class="tile detail" [attr.data-tip]="c().about.soft.detail">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><g class="lens"><circle cx="21" cy="21" r="13" /><path d="M31 31l12 12" /><path class="tick" d="M15 21.5l4 4 8-8.5" /></g></svg>
        <span class="sr-only">{{ c().about.soft.detail }}</span>
      </li>
      <li data-tip-pos="top" tabindex="0" class="tile solve" [attr.data-tip]="c().about.soft.solve">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><g class="bulb"><path d="M18 33v-3c-4-2.5-7-6-7-11a13 13 0 0 1 26 0c0 5-3 8.5-7 11v3z" /><path d="M19 39h10M21 44h6" /></g><g class="rays"><path d="M5 16H2M43 16h3M9 5L7 3M39 5l2-2M24 1V-2" /></g></svg>
        <span class="sr-only">{{ c().about.soft.solve }}</span>
      </li>
      <li data-tip-pos="top" tabindex="0" class="tile learn" [attr.data-tip]="c().about.soft.learn">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M24 13c-4-3-10-4.500-18-4.500V37c8 0 14 1.500 18 4.500z" /><path d="M24 13v28.500" /><g class="page"><path d="M24 13c4-3 10-4.500 18-4.500V37c-8 0-14 1.500-18 4.500z" /><path d="M29 19.500c3-1.500 6-2 8-2M29 26c3-1.500 6-2 8-2" /></g><path d="M11 19.500c3 0 6 .5 8 2M11 26c3 0 6 .5 8 2" /></svg>
        <span class="sr-only">{{ c().about.soft.learn }}</span>
      </li>
    </ul>
  `,
  styles: [`
    :host { display: block; }
    .eyebrow { margin-bottom: 0.75rem; }
    .soft { position: relative; list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 3%; padding-bottom: 1.5%; } /* the whole width of the content; the gap is a share of it, which the trail's line is drawn for */
    .tile {
      aspect-ratio: 1; display: grid; place-items: center; border-radius: 24px; corner-shape: squircle; color: var(--fg-2);
      border: 1px solid var(--line); background: linear-gradient(color-mix(in srgb, var(--fg) 5%, transparent), color-mix(in srgb, var(--fg) 5%, transparent)), var(--bg);
      transition: color var(--dur-short) var(--ease-out), background-color var(--dur-short) var(--ease-out), translate var(--dur-med) var(--ease-spring), rotate var(--dur-med) var(--ease-spring), box-shadow var(--dur-short) var(--ease-out);
    }
    .tile svg { width: 52%; height: auto; overflow: visible; }
    @media (hover: hover) {
      .tile:hover { color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent); translate: 0 -4px; rotate: 0deg; box-shadow: 0 14px 28px -14px color-mix(in srgb, var(--accent) 55%, transparent); }
    }
    /* playful: the tiles are the same size but tilted and set at different heights (a percentage margin is a share of the tile's own width), led by a dashed line through them */
    .trail { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; color: var(--fg-2); pointer-events: none; }
    .trail path { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-dasharray: 2 7; stroke-linecap: round; opacity: 0.5; }
    .tile { position: relative; }
    .tile:focus-visible, .tile.tip-open { rotate: 0deg; } /* the name shown beside a tile stands straight */
    .tile:nth-of-type(1) { rotate: -5deg; margin-top: 0; }
    .tile:nth-of-type(2) { rotate: 4deg; margin-top: 40%; }
    .tile:nth-of-type(3) { rotate: -3deg; margin-top: 10%; }
    .tile:nth-of-type(4) { rotate: 6deg; margin-top: 50%; }
    .tile:nth-of-type(5) { rotate: -4deg; margin-top: 5%; }
    .tile:nth-of-type(6) { rotate: 3deg; margin-top: 35%; }
    @media (max-width: 480px) { .tile { border-radius: 16px; } }

    /* each icon has one small motion of its own, only while the tile is hovered */
    .tile g, .tile .tick { transform-box: fill-box; transform-origin: center; }
    .rays { opacity: 0; transition: opacity var(--dur-short) var(--ease-out); }
    .tile .page { transform-origin: 24px 24px; transform-box: view-box; }
    .tile .needle { transform-origin: 24px 24px; transform-box: view-box; }
    @media (hover: hover) { .solve:hover .rays { opacity: 1; } }
    @media (hover: hover) and (prefers-reduced-motion: no-preference) {
      .team:hover .p-l { animation: toward-r 900ms var(--ease-spring) both; }
      .team:hover .p-r { animation: toward-l 900ms var(--ease-spring) both; }
      .team:hover .p-c { animation: bob 900ms var(--ease-spring) both; }
      .comms:hover .c1 { animation: chat 900ms var(--ease-spring) both; }
      .comms:hover .c2 { animation: chat 900ms var(--ease-spring) 180ms both; }
      .solo:hover .needle { animation: swing 1.4s ease-in-out both; }
      .detail:hover .lens { animation: scan 1.2s ease-in-out both; }
      .detail:hover .tick { animation: tick 900ms var(--ease-spring) 250ms both; }
      .solve:hover .bulb { animation: glow 900ms var(--ease-spring) both; }
      .learn:hover .page { animation: flip 1s ease-in-out both; }
    }
    @keyframes toward-r { 40% { translate: 3px 0; } }
    @keyframes toward-l { 40% { translate: -3px 0; } }
    @keyframes bob { 40% { translate: 0 -3px; } }
    @keyframes chat { 35% { scale: 1.12; } }
    @keyframes swing { 0%, 100% { rotate: 0deg; } 25% { rotate: 50deg; } 55% { rotate: -35deg; } 80% { rotate: 15deg; } }
    @keyframes scan { 0%, 100% { translate: 0 0; } 25% { translate: -3px -3px; } 55% { translate: 3px -2px; } 80% { translate: 2px 3px; } }
    @keyframes tick { 0% { scale: 1; } 40% { scale: 1.35; } 100% { scale: 1; } }
    @keyframes glow { 35% { scale: 1.1; } }
    @keyframes flip { 45% { scale: 0.1 1; } 100% { scale: 1 1; } }
    @media (prefers-reduced-motion: reduce) { .tile { transition: none; } }
  `],
})
export class Soft {
  readonly c = input.required<SiteContent>();
  private openTimer: ReturnType<typeof setTimeout> | undefined;

  /** A finger on a tile shows its name for a moment (a mouse gets the hover tooltip); a touch elsewhere puts it away. */
  protected reveal(e: PointerEvent): void {
    if (e.pointerType === 'mouse') return;
    const host = e.currentTarget as HTMLElement;
    const tile = (e.target as Element).closest<HTMLElement>('.tile');
    const was = tile?.classList.contains('tip-open') ?? false;
    host.querySelectorAll('.tip-open').forEach((t) => t.classList.remove('tip-open'));
    clearTimeout(this.openTimer);
    if (!tile || was) return;
    tile.classList.add('tip-open');
    this.openTimer = setTimeout(() => tile.classList.remove('tip-open'), 2500);
  }
}
