import { Component, input, output } from '@angular/core';

/**
 * The Shift x3 scene: the photo as an ambient backdrop (the same picture, blown up and blurred, so the glass header
 * and tab bar refract its colours) with the dog's three photos (born, teen, adult) floating in front on a dotted trail, leaning together towards the pointer. Home
 * decides when it shows what: `scene` is the photo, `sheet` is the backdrop only (the "Under the hood" sheet takes
 * the front), `leaving` fades whichever of the two is showing out. The picture is fetched on demand, and the first Shift press already warms it.
 */
@Component({
  selector: 'app-pup',
  template: `
    <button type="button" class="x" [class.leave]="leaving()" [class.sheet]="state() === 'sheet'" [attr.aria-label]="closeLabel()" (click)="dismiss.emit()">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
    <div class="pup" [class.sheet]="state() === 'sheet'" [class.leave]="leaving()" aria-hidden="true"
         (click)="advance.emit()" (pointermove)="lean($event)">
      <img class="bg" src="/img/pup.webp" alt="" decoding="async">
      <p class="eyebrow">dog/</p>
      <div class="stage">
        <div class="map" #map>
          <div class="stop p" style="--d: 110ms">
            <div class="frame"><img class="photo" src="/img/pup.webp" alt="" width="424" height="736" decoding="async"></div>
            <span class="tag">born</span>
          </div>
          <svg class="trail" style="--d: 650ms" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false"><path pathLength="1" d="M0 22 C 18 0, 26 74, 44 58 S 70 96, 100 70" /></svg>
          <div class="stop l" style="--d: 780ms">
            <div class="frame"><img class="photo" src="/img/dog-teen.webp" alt="" width="640" height="480" decoding="async"></div>
            <span class="tag">teen</span>
          </div>
          <svg class="trail" style="--d: 1320ms" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false"><path pathLength="1" d="M0 72 C 22 100, 34 20, 56 38 S 82 -4, 100 22" /></svg>
          <div class="stop p" style="--d: 1450ms">
            <div class="frame"><img class="photo" src="/img/dog-adult.webp" alt="" width="424" height="736" decoding="async"></div>
            <span class="tag">adult</span>
          </div>
        </div>
      </div>
      <span class="hint"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M9 5l7 7-7 7" /></svg></span>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .pup {
      position: fixed; inset: 0; z-index: 25; overflow: hidden; cursor: pointer; background: #1a0f08; /* over the bar and the tab bar (z-index 20): the scene is a layer of its own */
      animation: pup-in var(--dur-long) var(--ease-out) both;
    }
    .pup.sheet { cursor: default; }
    .pup.leave { animation: pup-out var(--dur-ring) ease-in-out both; pointer-events: none; }
    @keyframes pup-in { from { opacity: 0; } }
    @keyframes pup-out { to { opacity: 0; } }

    /* the ambient light: the photo itself, far out of focus, drifting slowly */
    .bg {
      position: absolute; inset: -10%; width: 120%; height: 120%; object-fit: cover; pointer-events: none;
      z-index: 0; filter: blur(60px) saturate(1.65) brightness(0.8); /* a fixed blur: animating a blur is the most expensive thing a page can do */
      animation: drift 22s ease-in-out infinite alternate;
    }
    /* the photo darkens behind the sheet through an overlay's opacity (cheap), not through the filter */
    .pup::before { content: ''; position: absolute; inset: 0; z-index: 1; pointer-events: none; background: #000; opacity: 0; transition: opacity var(--dur-long) var(--ease-out); }
    .pup.sheet::before { opacity: 0.31; }
    /* nothing keeps running behind the sheet or while it fades out */
    .pup.sheet .bg, .pup.sheet .frame, .pup.sheet .trail, .pup.sheet .tag, .pup.sheet .hint, .pup.sheet .hint::before, .pup.sheet .hint::after, .pup.sheet .hint svg, .pup.leave .bg, .pup.leave .frame { animation-play-state: paused; }
    .pup::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at center, transparent 35%, rgba(0, 0, 0, 0.6)); }
    @keyframes drift { to { scale: 1.1; translate: -2% 1.5%; } }

    .eyebrow { position: absolute; z-index: 2; left: max(1.5rem, 6vw); top: 1.75rem; margin: 0; font: 500 var(--t-footnote) / 1 var(--mono); letter-spacing: 0.04em; color: rgba(255, 255, 255, 0.75); pointer-events: none; }
    .eyebrow { transition: opacity var(--dur-fade) var(--ease-out); }
    .pup.sheet .eyebrow, .pup.leave .eyebrow { opacity: 0; }
    .stage { position: absolute; inset: 0; display: grid; place-items: center; perspective: 1100px; pointer-events: none; z-index: 1; padding: 4.5rem 1.5rem 7.5rem; transition: opacity var(--dur-fade) var(--ease-out), scale var(--dur-med) var(--ease-out); }
    .pup.sheet .stage { opacity: 0; scale: 0.94; }
    /* the life of the dog on one screen: three photos, a dotted trail winding between them, each a little off from the others */
    .map { display: flex; align-items: center; justify-content: center; transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transition: transform var(--dur-press) var(--ease-out); }
    .stop { position: relative; display: grid; justify-items: center; gap: 0.9rem; }
    .stop:nth-of-type(1) { translate: -1.5vw -2.25rem; } .stop:nth-of-type(1) .frame { rotate: -5deg; }
    .stop:nth-of-type(2) { translate: 0 2.75rem; } .stop:nth-of-type(2) .frame { rotate: 2.5deg; }
    .stop:nth-of-type(3) { translate: 1.5vw -1.25rem; } .stop:nth-of-type(3) .frame { rotate: 4deg; }
    .frame {
      position: relative; overflow: hidden; border-radius: var(--radius); corner-shape: squircle;
      box-shadow: 0 50px 90px -24px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.3);
      animation: land 800ms var(--ease-spring) var(--d) both, float 7s ease-in-out calc(var(--d) + 800ms) infinite;
    }
    .p .frame { height: min(48vh, 22rem); aspect-ratio: 424 / 736; }
    .l .frame { width: min(34vw, 28rem); aspect-ratio: 4 / 3; }
    .photo { display: block; width: 100%; height: 100%; object-fit: cover; }
    /* a soft highlight that follows the pointer across the pictures, like light on glass */
    .frame::after {
      content: ''; position: absolute; inset: 0; pointer-events: none; mix-blend-mode: soft-light;
      background: radial-gradient(420px circle at var(--mx, 30%) var(--my, 20%), rgba(255, 255, 255, 0.55), transparent 60%);
    }
    @keyframes land {
      from { opacity: 0; scale: 0.72; translate: 0 7vh; rotate: -14deg; }
    }
    @keyframes float { 50% { translate: 0 -8px; } }
    /* the stage of life: a small glass pill under each photo */
    .tag {
      padding: 0.35rem 0.85rem; border-radius: 999px; font: 500 var(--t-footnote) / 1 var(--font); color: #fff;
      background: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.38);
      -webkit-backdrop-filter: blur(14px) saturate(160%); backdrop-filter: blur(14px) saturate(160%); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
      animation: tag-in var(--dur-med) var(--ease-spring) calc(var(--d) + 400ms) both;
    }
    @keyframes tag-in { from { opacity: 0; scale: 0.6; } }
    /* the dotted trail draws itself between two photos; its ends slip under them */
    .trail { flex: 0 1 7rem; min-width: 3rem; height: 110px; margin-inline: -14px; overflow: visible; }
    .trail path { fill: none; stroke: rgba(255, 255, 255, 0.65); stroke-width: 2.6; stroke-linecap: round; stroke-dasharray: 0.004 0.03; vector-effect: non-scaling-stroke; }
    .trail { animation: trail-draw var(--dur-long) var(--ease-out) var(--d) both; }
    @keyframes trail-draw { from { clip-path: inset(-12px 100% -12px -12px); } to { clip-path: inset(-12px); } }
    @keyframes trail-draw-v { from { clip-path: inset(-12px -12px 100% -12px); } to { clip-path: inset(-12px); } }
    @media (max-width: 759px) {
      .stage { padding: 4.5rem 1.25rem calc(6.25rem + env(safe-area-inset-bottom)); }
      .map { flex-direction: column; }
      .p .frame { height: min(18vh, 9rem); }
      .l .frame { width: min(52vw, 13rem); }
      .stop { grid-auto-flow: column; align-items: center; gap: 0.75rem; }
      .stop:nth-of-type(1) { translate: -12vw 0; } .stop:nth-of-type(2) { translate: 6vw 0; } .stop:nth-of-type(3) { translate: -8vw 0; }
      .trail { flex: 0 1 3.25rem; width: 6rem; height: auto; min-height: 1.5rem; margin: -10px 0; animation-name: trail-draw-v; }
      .trail:nth-of-type(1) path { d: path('M28 0 C 0 22, 84 34, 62 60 S 92 84, 72 100'); }
      .trail:nth-of-type(2) path { d: path('M70 0 C 100 24, 14 36, 40 62 S 6 84, 30 100'); }
    }

    /* the way out: a small round glass button, above the scene, under the bar's right end */
    .x {
      position: fixed; z-index: 26; top: 1.25rem; right: max(1.5rem, 6vw); width: 44px; height: 44px; display: grid; place-items: center; padding: 0; border-radius: 50%; color: #fff; cursor: pointer;
      background: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.38); -webkit-backdrop-filter: blur(14px) saturate(160%); backdrop-filter: blur(14px) saturate(160%);
      box-shadow: 0 10px 30px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4);
      animation: pup-in var(--dur-long) var(--ease-out) both; transition: opacity var(--dur-fade) var(--ease-out), background-color var(--dur-fade) var(--ease-out), scale var(--dur-short) var(--ease-spring);
    }
    .x.sheet, .x.leave { opacity: 0; pointer-events: none; }
    @media (hover: hover) { .x:hover { background: rgba(255, 255, 255, 0.28); } }
    .x:active { scale: var(--press-scale); transition-duration: var(--dur-tap); transition-timing-function: var(--ease-out); }
    .x:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
    /* "click to go on": a glass bubble with rings that spread out of it, until the photo is dismissed */
    .hint {
      position: absolute; z-index: 2; left: 50%; bottom: max(2.5rem, env(safe-area-inset-bottom)); translate: -50% 0;
      width: 56px; height: 56px; display: grid; place-items: center; border-radius: 50%; color: #fff; pointer-events: none;
      background: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.38);
      -webkit-backdrop-filter: blur(14px) saturate(160%); backdrop-filter: blur(14px) saturate(160%);
      box-shadow: 0 10px 30px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4);
      animation: hint-in var(--dur-med) var(--ease-spring) both; transition: opacity var(--dur-fade) var(--ease-out);
    }
    .pup.sheet .hint { opacity: 0; }
    .hint::before, .hint::after { content: ''; position: absolute; inset: -1px; border-radius: 50%; border: 1.5px solid rgba(255, 255, 255, 0.55); animation: ring 2.4s ease-out 0.3s infinite; }
    .hint::after { animation-delay: 1.5s; }
    .hint svg { animation: nudge 1.6s ease-in-out 0.3s infinite; }
    @keyframes hint-in { from { opacity: 0; scale: 0.6; } }
    @keyframes ring { from { scale: 1; opacity: 0.8; } to { scale: 2.1; opacity: 0; } }
    @keyframes nudge { 50% { translate: 3px 0; } }
    @media (max-width: 899px) { .hint { bottom: calc(2.25rem + env(safe-area-inset-bottom)); } }
    /* on a phone both round buttons are smaller */
    @media (max-width: 759px) { .hint { width: 44px; height: 44px; } .hint svg { width: 18px; height: 18px; } .x { top: max(1rem, env(safe-area-inset-top)); width: 38px; height: 38px; } .x svg { width: 16px; height: 16px; } }

    @media (prefers-reduced-motion: reduce) {
      .pup, .pup.leave, .x, .bg, .frame, .tag, .trail, .hint, .hint svg, .stage, .map, .pup::before { animation: none; transition: none; }
      .hint::before, .hint::after { animation: none; }
    }
  `],
})
export class Pup {
  readonly state = input.required<'scene' | 'sheet'>();
  /** Fading out: whatever is showing (the photo, or only the glow behind the sheet) fades with it. */
  readonly leaving = input(false);
  readonly advance = output<void>();
  /** Spoken on the round close button. */
  readonly closeLabel = input('Close');
  /** The close button: the way out on a touch screen (a keyboard has Escape). */
  readonly dismiss = output<void>();

  protected lean(e: PointerEvent): void {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget as HTMLElement;
    const x = e.clientX / innerWidth;
    const y = e.clientY / innerHeight;
    const frame = el.querySelector<HTMLElement>('.map');
    if (!frame) return;
    frame.style.setProperty('--ry', `${((x - 0.5) * 16).toFixed(2)}deg`);
    frame.style.setProperty('--rx', `${(-(y - 0.5) * 12).toFixed(2)}deg`);
    frame.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    frame.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
  }
}
