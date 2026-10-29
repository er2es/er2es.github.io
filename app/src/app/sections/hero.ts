import { Component, ElementRef, afterNextRender, inject, input, signal, DestroyRef } from '@angular/core';
import type { SiteContent } from '../content/model';
import { Email } from './email';

@Component({
  selector: 'app-hero',
  imports: [Email],
  template: `
    <div class="stage" [class.paused]="paused()">
      <div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div>
    <section class="hero wrap" aria-labelledby="hero-title">
      <div class="text">
        <h1 id="hero-title">{{ c().hero.name }}</h1>
        <p class="role">{{ c().hero.role }}</p>
        <p class="meta"><span class="in"><span class="status"><span class="dot" aria-hidden="true"></span>{{ c().hero.status }}</span> <span class="loc">{{ c().hero.location }}</span></span></p>
        <app-email [c]="c()" />
      </div>
      <picture class="portrait">
        <source type="image/avif" srcset="/img/portrait-320.avif 320w, /img/portrait-480.avif 480w, /img/portrait-640.avif 640w" sizes="(min-width: 800px) 320px, 240px">
        <source type="image/webp" srcset="/img/portrait-320.webp 320w, /img/portrait-480.webp 480w, /img/portrait-640.webp 640w" sizes="(min-width: 800px) 320px, 240px">
        <img src="/img/portrait-640.jpg" width="320" height="320" [alt]="c().hero.portraitAlt" fetchpriority="high" decoding="async">
      </picture>
    </section>
    </div>
  `,
  styles: [`
    .stage { position: relative; overflow: clip; isolation: isolate; }
    .hero { display: grid; gap: 1.5rem; align-items: center; padding-top: calc(var(--bar-h) + clamp(1.75rem, 4.5vw, 3.5rem)); padding-bottom: clamp(2rem, 4vw, 3.25rem); }
    .aurora { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
    .aurora i { position: absolute; border-radius: 50%; filter: blur(70px); will-change: transform; animation: drift 70s ease-in-out infinite alternate; }
    .aurora i:nth-child(1) { width: 46vmax; height: 46vmax; left: -12vmax; top: -18vmax; background: radial-gradient(circle at 40% 40%, var(--aurora-a), transparent 66%); }
    .aurora i:nth-child(2) { width: 38vmax; height: 38vmax; right: -10vmax; top: -8vmax; background: radial-gradient(circle at 50% 50%, var(--aurora-b), transparent 66%); animation-duration: 90s; animation-delay: -30s; }
    .aurora i:nth-child(3) { width: 34vmax; height: 34vmax; left: 30%; bottom: -22vmax; background: radial-gradient(circle at 50% 50%, var(--aurora-c), transparent 66%); animation-duration: 80s; animation-delay: -55s; }
    .paused .aurora i { animation-play-state: paused; will-change: auto; }
    @keyframes drift { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(7vmax, 5vmax, 0) scale(1.15); } }
    @media (prefers-reduced-motion: reduce) { .aurora i { animation: none; } }
    .text { display: grid; gap: 0.75rem; justify-items: start; }
    .role { font-size: var(--t-title2); line-height: 1.3; text-wrap: balance; } /* two lines break evenly, never leaving one word alone */
    /*
     * Availability and place on one line. Every part carries a leading separator dot; the inner line is pulled left
     * by one separator width and the outer one clips it, so a part that wraps to a new line loses its dot (no orphans).
     * The small clip margin leaves room for the status dot's one-off ring.
     */
    .meta { margin-bottom: 0.75rem; overflow: clip; overflow-clip-margin: 0.5rem; }
    .in { display: flex; flex-wrap: wrap; align-items: center; margin-left: -1.5rem; }
    .in > span { display: inline-flex; align-items: center; position: relative; padding-left: 1.5rem; }
    .in > span::before { content: '·'; position: absolute; left: 0; width: 1.5rem; text-align: center; color: var(--fg-2); }
    /* the same line as in the Contact section: muted, in the page's own font; only the green dot says "available" */
    .meta { color: var(--fg-2); font-size: var(--t-subhead); font-weight: 500; letter-spacing: 0.02em; }
    .status { gap: 0.5rem; }
    /* the box has a definite size of its own: with a content-sized width the percentage on the image resolved to 0 until the file arrived, and the text below jumped (layout shift) */
    .portrait { order: -1; position: relative; display: block; width: min(100%, 15rem); border-radius: 2rem; }
    .portrait.docked img { visibility: hidden; }
    .portrait img { display: block; width: 100%; height: auto; aspect-ratio: 1; object-fit: cover; border-radius: inherit; }
    @supports (corner-shape: squircle) { .portrait, .portrait img { corner-shape: squircle; } } /* like the cards beside it */
    @media (min-width: 800px) {
      .hero { grid-template-columns: 1.2fr 0.8fr; }
      .portrait { order: 0; justify-self: end; border-radius: 2.5rem; width: min(100%, 20rem); }
    }

    /*
     * First load, once: the lines settle into place one after another, the portrait settles in scale, all with a calm
     * ease-out and no overshoot. Transform only: everything is painted (and readable) from the first frame, the LCP
     * image is never hidden. Plays until html.settled is set, never under reduced motion, and never again on scrolling back.
     */
    @media (prefers-reduced-motion: no-preference) {
      :host-context(html:not(.settled)) .text > * { animation: settle 420ms var(--ease-out) both; }
      :host-context(html:not(.settled)) .text > :nth-child(2) { animation-delay: 40ms; }
      :host-context(html:not(.settled)) .text > :nth-child(3) { animation-delay: 80ms; }
      :host-context(html:not(.settled)) .text > :nth-child(4) { animation-delay: 120ms; }
      :host-context(html:not(.settled)) .text > :nth-child(5) { animation-delay: 160ms; }
      :host-context(html:not(.settled)) .portrait img { animation: settle-in 520ms var(--ease-out) both; }
      :host-context(html:not(.settled)) .dot::after { animation: ping var(--dur-ring) var(--ease-out) 180ms both; }
    }
    @keyframes settle { from { transform: translateY(8px); } }
    @keyframes settle-in { from { transform: scale(0.97); } }
    .dot { position: relative; }
    .dot::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: var(--accent); opacity: 0; pointer-events: none; }
    @keyframes ping { from { transform: scale(1); opacity: 0.55; } to { transform: scale(2.6); opacity: 0; } }

    /* the portrait leans a few degrees toward a fine pointer and catches a soft highlight (hero.ts sets the vars) */
    @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
      .portrait { transform: perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)); transition: transform var(--dur-med) var(--ease-spring); }
      .portrait.tracking { transition-duration: var(--dur-press); transition-timing-function: var(--ease-out); }
      .portrait::after {
        content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0;
        background: radial-gradient(circle at var(--spec-x, 50%) var(--spec-y, 30%), rgba(255, 255, 255, 0.22), transparent 55%);
        transition: opacity var(--dur-med) var(--ease-out);
      }
      .portrait.tracking::after { opacity: 1; }
    }
  `],
})
export class Hero {
  readonly c = input.required<SiteContent>();
  /** The aurora only drifts while the hero is on screen. */
  protected readonly paused = signal(false);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') return;
      const io = new IntersectionObserver(([e]) => this.paused.set(!e.isIntersecting));
      io.observe(host.nativeElement);
      destroy.onDestroy(() => io.disconnect());
      destroy.onDestroy(tilt(host.nativeElement));
    });
  }
}

/** The portrait leans toward a fine pointer anywhere over the hero (at most 4 degrees, a portrait-width away). Returns a cleanup. */
function tilt(stage: HTMLElement): () => void {
  const pic = stage.querySelector<HTMLElement>('.portrait');
  if (!pic || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => undefined;
  }
  let raf = 0;
  const move = (e: PointerEvent): void => {
    if (raf || e.pointerType !== 'mouse') return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = pic.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width));
      const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / r.height));
      pic.classList.add('tracking');
      pic.style.setProperty('--tilt-x', `${(-ny * 4).toFixed(2)}deg`);
      pic.style.setProperty('--tilt-y', `${(nx * 4).toFixed(2)}deg`);
      pic.style.setProperty('--spec-x', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      pic.style.setProperty('--spec-y', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    });
  };
  const leave = (): void => {
    cancelAnimationFrame(raf);
    raf = 0;
    pic.classList.remove('tracking');
    for (const p of ['--tilt-x', '--tilt-y']) pic.style.removeProperty(p);
  };
  stage.addEventListener('pointermove', move, { passive: true });
  stage.addEventListener('pointerleave', leave);
  return () => {
    leave();
    stage.removeEventListener('pointermove', move);
    stage.removeEventListener('pointerleave', leave);
  };
}
