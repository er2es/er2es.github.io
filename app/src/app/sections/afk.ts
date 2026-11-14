import { Component, input } from '@angular/core';
import type { SiteContent } from '../content/model';

/**
 * Away from keyboard: four small tiles with line icons, each with one little motion of its own on hover
 * (the clapper claps, the trees sway, the toes of the paw pop, the footprints step). The names are for assistive
 * technology and the hover tooltip; the picture does the talking.
 */
@Component({
  selector: 'app-afk',
  template: `
    <p class="eyebrow mono" aria-hidden="true">afk/</p>
    <!-- the tiles are focusable only to show their name: keyboard parity with the hover tooltip -->
    <ul class="afk" [attr.aria-label]="c().profile.hobbies.label" (pointerdown)="reveal($event)">
      <svg class="trail row" viewBox="0 0 600 121.5" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M37.5 37.5 C90 37.5 90 67.5 142.5 67.5 S195 45 247.5 45 S300 75 352.5 75 S405 41.25 457.5 41.25 S510 63.75 562.5 63.75" vector-effect="non-scaling-stroke" /></svg>
      <svg class="trail wide" viewBox="0 0 256 416" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M60 60 C128 60 128 84 196 84 C196 140 60 140 60 196 C128 196 128 220 196 220 C196 276 60 276 60 332 C128 332 128 356 196 356" vector-effect="non-scaling-stroke" /></svg>
      <li data-tip-pos="top" tabindex="0" class="tile cinema" [attr.data-tip]="c().profile.hobbies.cinema">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <rect x="7" y="20" width="34" height="21" rx="3" />
          <path d="M20 26.5l9 5-9 5z" />
          <g class="clap"><rect x="7" y="11" width="34" height="7" rx="2" /><path d="M16 11l-3 7M26 11l-3 7M36 11l-3 7" /></g>
        </svg>
        <span class="sr-only">{{ c().profile.hobbies.cinema }}</span>
      </li>
      <li data-tip-pos="top" tabindex="0" class="tile woods" [attr.data-tip]="c().profile.hobbies.woods">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <path d="M3 41h42" />
          <g class="tree a"><path d="M24 5l-7 12h14zM24 13l-9 15h18zM24 28v9" /></g>
          <g class="tree b"><path d="M9 21l-5 11h10zM9 32v5" /></g>
          <g class="tree c"><path d="M39 21l-5 11h10zM39 32v5" /></g>
        </svg>
        <span class="sr-only">{{ c().profile.hobbies.woods }}</span>
      </li>
      <li data-tip-pos="top" tabindex="0" class="tile dog" [attr.data-tip]="c().profile.hobbies.dog">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <path d="M24 26c-6 0-11 4-11 8.5 0 3.2 2.6 4.5 5.5 4.5 2 0 3.5-1 5.5-1s3.5 1 5.5 1c2.9 0 5.5-1.3 5.5-4.5C35 30 30 26 24 26z" />
          <ellipse class="toe t1" cx="11" cy="23" rx="3.2" ry="4.4" transform="rotate(-20 11 23)" />
          <ellipse class="toe t2" cx="18.5" cy="14" rx="3.4" ry="4.8" />
          <ellipse class="toe t3" cx="29.5" cy="14" rx="3.4" ry="4.8" />
          <ellipse class="toe t4" cx="37" cy="23" rx="3.2" ry="4.4" transform="rotate(20 37 23)" />
        </svg>
        <span class="sr-only">{{ c().profile.hobbies.dog }}</span>
      </li>
      <li data-tip-pos="top" tabindex="0" class="tile walk" [attr.data-tip]="c().profile.hobbies.walk">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <g class="foot l"><ellipse cx="16" cy="12" rx="5" ry="7" /><ellipse cx="16" cy="24.5" rx="3.6" ry="3.5" /></g>
          <g class="foot r"><ellipse cx="32" cy="28" rx="5" ry="7" /><ellipse cx="32" cy="40.5" rx="3.6" ry="3.5" /></g>
        </svg>
        <span class="sr-only">{{ c().profile.hobbies.walk }}</span>
      </li>
      <li data-tip-pos="top" tabindex="0" class="tile pho" [attr.data-tip]="c().profile.hobbies.pho">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <path d="M5 26h38c0 9.5-8.5 15-19 15S5 35.5 5 26z" />
          <path d="M18 44h12" />
          <g class="steam"><path class="s1" d="M15 20c-2.5-3 2.5-5 0-9" /><path class="s2" d="M22 20c-2.5-3 2.5-5 0-9" /><path class="s3" d="M29 20c-2.5-3 2.5-5 0-9" /></g>
          <path d="M32 28L45 9M37 29L48 13" />
        </svg>
        <span class="sr-only">{{ c().profile.hobbies.pho }}</span>
      </li>
      <li data-tip-pos="top" tabindex="0" class="tile games" [attr.data-tip]="c().profile.hobbies.games">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <g class="pad">
            <path d="M13 15h22c5.5 0 8.5 4.2 9.6 10.5l1.8 10.2c.6 3.6-1.4 6.3-4.4 6.3-2.3 0-3.9-1.3-5.5-3.8L33 34H15l-2.1 3.2c-1.6 2.5-3.2 3.8-5.5 3.8-3 0-5-2.7-4.4-6.3l1.8-10.2C4.5 19.2 7.5 15 13 15z" />
            <path d="M15 22v8M11 26h8" />
            <circle class="b1" cx="33" cy="24" r="1.6" /><circle class="b2" cx="38" cy="28" r="1.6" />
          </g>
        </svg>
        <span class="sr-only">{{ c().profile.hobbies.games }}</span>
      </li>
    </ul>
  `,
  styles: [`
    :host { display: block; }
    .eyebrow { margin-bottom: 0.75rem; }
    /* one row on a phone and a tablet, like the soft skills: the same size, tilted and set at different heights (a percentage margin is a share of the tile's own width), led by a dashed line */
    .afk { position: relative; list-style: none; margin: 0; padding: 0 0 1.5%; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 5%; }
    .trail { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; color: var(--fg-2); pointer-events: none; }
    .trail path { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-dasharray: 2 7; stroke-linecap: round; opacity: 0.5; }
    .trail.wide { display: none; }
    .tile {
      position: relative; aspect-ratio: 1; display: grid; place-items: center; border-radius: 24px; corner-shape: squircle; color: var(--fg-2);
      border: 1px solid var(--line); background: linear-gradient(color-mix(in srgb, var(--fg) 5%, transparent), color-mix(in srgb, var(--fg) 5%, transparent)), var(--bg);
      transition: color var(--dur-short) var(--ease-out), background-color var(--dur-short) var(--ease-out), translate var(--dur-med) var(--ease-spring), rotate var(--dur-med) var(--ease-spring), box-shadow var(--dur-short) var(--ease-out);
    }
    .tile svg { width: 52%; height: auto; overflow: visible; }
    @media (hover: hover) {
      .tile:hover { color: var(--accent); background: linear-gradient(color-mix(in srgb, var(--accent) 10%, transparent), color-mix(in srgb, var(--accent) 10%, transparent)), var(--bg); translate: 0 -4px; rotate: 0deg; box-shadow: 0 14px 28px -14px color-mix(in srgb, var(--accent) 55%, transparent); }
    }

    .tile:nth-of-type(1) { rotate: -5deg; margin-top: 0; }
    .tile:nth-of-type(2) { rotate: 4deg; margin-top: 40%; }
    .tile:nth-of-type(3) { rotate: -3deg; margin-top: 10%; }
    .tile:nth-of-type(4) { rotate: 6deg; margin-top: 50%; }
    .tile:nth-of-type(5) { rotate: -4deg; margin-top: 5%; }
    .tile:nth-of-type(6) { rotate: 3deg; margin-top: 35%; }
    .tile:focus-visible, .tile.tip-open { rotate: 0deg; } /* the name shown beside a tile stands straight */

    /* each icon has one motion of its own, only while the tile is hovered */
    .clap { transform-origin: 8px 18px; transform: rotate(-17deg); transition: transform 160ms ease-in; }
    .tree { transform-origin: 24px 38px; }
    .tree.b { transform-origin: 9px 37px; }
    .tree.c { transform-origin: 39px 37px; }
    .toe { transform-box: fill-box; transform-origin: center bottom; }
    .steam path { transform-box: fill-box; }
    .pad { transform-origin: 24px 28px; }
    .b1, .b2 { transform-box: fill-box; transform-origin: center; }
    @media (hover: hover) and (prefers-reduced-motion: no-preference) {
      .cinema:hover .clap { transform: rotate(0deg); }
      .woods:hover .tree { animation: sway 1.8s ease-in-out 2; }
      .woods:hover .tree.b { animation-delay: -0.6s; }
      .woods:hover .tree.c { animation-delay: -1.2s; }
      .dog:hover .toe { animation: pop 900ms var(--ease-spring) both; }
      .dog:hover .t2 { animation-delay: 90ms; }
      .dog:hover .t3 { animation-delay: 180ms; }
      .dog:hover .t4 { animation-delay: 270ms; }
      .walk:hover .foot { animation: step 1.4s ease-in-out 2; }
      .walk:hover .foot.r { animation-delay: 0.7s; }
      .pho:hover .steam path { animation: rise 1.6s ease-in-out 2; }
      .pho:hover .s2 { animation-delay: 0.25s; }
      .pho:hover .s3 { animation-delay: 0.5s; }
      .games:hover .pad { animation: wiggle 700ms var(--ease-spring) both; }
      .games:hover .b1 { animation: press 700ms ease-in-out 120ms both; }
      .games:hover .b2 { animation: press 700ms ease-in-out 320ms both; }
    }
    @keyframes sway { 50% { transform: rotate(4deg); } 0%, 100% { transform: rotate(-3deg); } }
    @keyframes pop { 40% { transform: translateY(-4px) scale(1.12); } }
    @keyframes rise { 0% { opacity: 0.3; translate: 0 3px; } 50% { opacity: 1; translate: 0 -3px; } 100% { opacity: 0.3; translate: 0 3px; } }
    @keyframes wiggle { 30% { transform: rotate(-6deg); } 65% { transform: rotate(4deg); } }
    @keyframes press { 40% { transform: scale(0.45); } }
    @keyframes step { 0%, 100% { translate: 0 2px; } 35% { translate: 0 -4px; } }

    /* beside the text on wide screens: a sticky 2x2 with the second column dropped, so it does not read as a grid of buttons */
    @media (min-width: 1000px) {
      :host { position: sticky; top: calc(var(--bar-h) + 3rem); }
      .afk { grid-template-columns: repeat(2, 7.5rem); gap: 1rem; justify-content: start; width: fit-content; padding-bottom: 0; }
      .trail.row { display: none; }
      .trail.wide { display: block; }
      .tile:nth-of-type(odd) { margin-top: 0; }
      .tile:nth-of-type(even) { margin-top: 1.5rem; }
    }
    @media (prefers-reduced-motion: reduce) { .tile, .clap { transition: none; } }
  `],
})
export class Afk {
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
