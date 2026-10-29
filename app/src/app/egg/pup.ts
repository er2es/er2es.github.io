import { Component, input, output } from '@angular/core';

/**
 * The Shift x3 scene: the photo as an ambient backdrop (the same picture, blown up and blurred, so the glass header
 * and tab bar refract its colours) with the sharp photo floating in front, leaning towards the pointer. Home
 * decides when it shows what: `scene` is the photo, `sheet` is the backdrop only (the "Under the hood" sheet takes
 * the front), `leaving` fades whichever of the two is showing out. The picture is fetched on demand, and the first Shift press already warms it.
 */
@Component({
  selector: 'app-pup',
  template: `
    <div class="pup" [class.sheet]="state() === 'sheet'" [class.leave]="leaving()" aria-hidden="true"
         (click)="advance.emit()" (pointermove)="lean($event)">
      <img class="bg" src="/img/pup.webp" alt="" decoding="async">
      <div class="stage">
        <div class="frame" #frame>
          <img class="photo" src="/img/pup.webp" alt="" width="424" height="736" decoding="async">
        </div>
      </div>
      <span class="hint"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M9 5l7 7-7 7" /></svg></span>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .pup {
      position: fixed; inset: 0; z-index: 15; overflow: hidden; cursor: pointer; background: #1a0f08;
      animation: pup-in 700ms var(--ease-out) both;
    }
    .pup.sheet { cursor: default; }
    .pup.leave { animation: pup-out 520ms ease-in-out both; pointer-events: none; }
    @keyframes pup-in { from { opacity: 0; } }
    @keyframes pup-out { to { opacity: 0; } }

    /* the ambient light: the photo itself, far out of focus, drifting slowly */
    .bg {
      position: absolute; inset: -10%; width: 120%; height: 120%; object-fit: cover; pointer-events: none;
      z-index: 0; filter: blur(60px) saturate(1.65) brightness(0.8); /* a fixed blur: animating a blur is the most expensive thing a page can do */
      animation: drift 22s ease-in-out infinite alternate;
    }
    /* the photo darkens behind the sheet through an overlay's opacity (cheap), not through the filter */
    .pup::before { content: ''; position: absolute; inset: 0; z-index: 1; pointer-events: none; background: #000; opacity: 0; transition: opacity 700ms var(--ease-out); }
    .pup.sheet::before { opacity: 0.31; }
    /* nothing keeps running behind the sheet or while it fades out */
    .pup.sheet .bg, .pup.sheet .frame, .pup.sheet .hint, .pup.sheet .hint::before, .pup.sheet .hint::after, .pup.sheet .hint svg, .pup.leave .bg, .pup.leave .frame { animation-play-state: paused; }
    .pup::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at center, transparent 35%, rgba(0, 0, 0, 0.6)); }
    @keyframes drift { to { scale: 1.1; translate: -2% 1.5%; } }

    .stage { position: absolute; inset: 0; display: grid; place-items: center; perspective: 1100px; pointer-events: none; z-index: 1; }
    .frame {
      position: relative; height: min(76vh, 41rem); aspect-ratio: 424 / 736; max-width: 88vw; overflow: hidden;
      border-radius: 30px; corner-shape: squircle;
      box-shadow: 0 50px 90px -24px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.3);
      transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transition: transform var(--dur-press) var(--ease-out);
      animation: land 1000ms var(--ease-spring) 120ms both, float 7s ease-in-out 1.1s infinite;
    }
    .stage { transition: opacity 400ms var(--ease-out), scale 400ms var(--ease-out); }
    .pup.sheet .stage { opacity: 0; scale: 0.94; }
    .photo { display: block; width: 100%; height: 100%; object-fit: cover; }
    /* a soft highlight that follows the pointer across the picture, like light on glass */
    .frame::after {
      content: ''; position: absolute; inset: 0; pointer-events: none; mix-blend-mode: soft-light;
      background: radial-gradient(420px circle at var(--mx, 30%) var(--my, 20%), rgba(255, 255, 255, 0.55), transparent 60%);
    }
    @keyframes land {
      from { opacity: 0; scale: 0.72; translate: 0 7vh; rotate: -6deg; }
      to { opacity: 1; scale: 1; translate: 0 0; rotate: 0deg; }
    }
    @keyframes float { 50% { translate: 0 -8px; } }

    /* "click to go on": a glass bubble with rings that spread out of it, until the photo is dismissed */
    .hint {
      position: absolute; z-index: 2; left: 50%; bottom: max(2.5rem, env(safe-area-inset-bottom)); translate: -50% 0;
      width: 56px; height: 56px; display: grid; place-items: center; border-radius: 50%; color: #fff; pointer-events: none;
      background: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.38);
      -webkit-backdrop-filter: blur(14px) saturate(160%); backdrop-filter: blur(14px) saturate(160%);
      box-shadow: 0 10px 30px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4);
      animation: hint-in 450ms var(--ease-spring) both; transition: opacity 300ms var(--ease-out);
    }
    .pup.sheet .hint { opacity: 0; }
    .hint::before, .hint::after { content: ''; position: absolute; inset: -1px; border-radius: 50%; border: 1.5px solid rgba(255, 255, 255, 0.55); animation: ring 2.4s ease-out 0.3s infinite; }
    .hint::after { animation-delay: 1.5s; }
    .hint svg { animation: nudge 1.6s ease-in-out 0.3s infinite; }
    @keyframes hint-in { from { opacity: 0; scale: 0.6; } }
    @keyframes ring { from { scale: 1; opacity: 0.8; } to { scale: 2.1; opacity: 0; } }
    @keyframes nudge { 50% { translate: 3px 0; } }
    @media (max-width: 899px) { .hint { bottom: calc(var(--tabbar-h, 64px) + 2.5rem + env(safe-area-inset-bottom)); } }

    @media (prefers-reduced-motion: reduce) {
      .pup, .pup.leave, .bg, .frame, .hint, .hint svg, .stage, .pup::before { animation: none; transition: none; }
      .hint::before, .hint::after { animation: none; }
    }
  `],
})
export class Pup {
  readonly state = input.required<'scene' | 'sheet'>();
  /** Fading out: whatever is showing (the photo, or only the glow behind the sheet) fades with it. */
  readonly leaving = input(false);
  readonly advance = output<void>();

  protected lean(e: PointerEvent): void {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget as HTMLElement;
    const x = e.clientX / innerWidth;
    const y = e.clientY / innerHeight;
    const frame = el.querySelector<HTMLElement>('.frame');
    if (!frame) return;
    frame.style.setProperty('--ry', `${((x - 0.5) * 16).toFixed(2)}deg`);
    frame.style.setProperty('--rx', `${(-(y - 0.5) * 12).toFixed(2)}deg`);
    const r = frame.getBoundingClientRect();
    frame.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    frame.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  }
}
