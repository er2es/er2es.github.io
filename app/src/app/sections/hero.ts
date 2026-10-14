import { Component, ElementRef, afterNextRender, inject, input, signal, DestroyRef } from '@angular/core';
import { EMAIL, type SiteContent } from '../content/model';

@Component({
  selector: 'app-hero',
  template: `
    <div class="stage" [class.paused]="paused()">
      <div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div>
    <section class="hero wrap" aria-labelledby="hero-title">
      <div class="text">
        <h1 id="hero-title">{{ c().hero.name }}</h1>
        <p class="role">{{ c().hero.role }}</p>
        <p class="loc mono">{{ c().hero.location }}</p>
        <p class="status"><span class="dot" aria-hidden="true"></span>{{ c().hero.status }}</p>
        <a class="btn" [attr.href]="'mailto:' + email">{{ c().hero.cta }}</a>
      </div>
      <picture class="portrait">
        <source type="image/avif" srcset="/img/portrait-320.avif 320w, /img/portrait-640.avif 640w" sizes="(min-width: 800px) 320px, 240px">
        <source type="image/webp" srcset="/img/portrait-320.webp 320w, /img/portrait-640.webp 640w" sizes="(min-width: 800px) 320px, 240px">
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
    .paused .aurora i { animation-play-state: paused; }
    @keyframes drift { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(7vmax, 5vmax, 0) scale(1.15); } }
    @media (prefers-reduced-motion: reduce) { .aurora i { animation: none; } }
    .text { display: grid; gap: 0.75rem; justify-items: start; }
    .role { font-size: var(--t-title2); line-height: 1.3; }
    .loc { color: var(--fg-2); font-size: var(--t-subhead); }
    .status { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; font-weight: 500; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); }
    .portrait { order: -1; position: relative; display: block; width: fit-content; border-radius: 2rem; }
    .portrait img { display: block; width: min(100%, 15rem); height: auto; aspect-ratio: 1; object-fit: cover; border-radius: inherit; }
    @media (min-width: 800px) {
      .hero { grid-template-columns: 1.2fr 0.8fr; }
      .portrait { order: 0; justify-self: end; border-radius: 2.5rem; }
      .portrait img { width: min(100%, 20rem); }
    }

    /*
     * First load: the lines settle into place one after another, the portrait settles in scale.
     * Transform only: everything is painted (and readable) from the first frame, the LCP image is never hidden.
     * Played once per visit (html.settled is set afterwards), never under reduced motion.
     */
    @media (prefers-reduced-motion: no-preference) {
      :host-context(html:not(.settled)) .text > * { animation: settle 500ms var(--ease-spring) both; }
      :host-context(html:not(.settled)) .text > :nth-child(2) { animation-delay: 50ms; }
      :host-context(html:not(.settled)) .text > :nth-child(3) { animation-delay: 100ms; }
      :host-context(html:not(.settled)) .text > :nth-child(4) { animation-delay: 150ms; }
      :host-context(html:not(.settled)) .text > :nth-child(5) { animation-delay: 200ms; }
      :host-context(html:not(.settled)) .portrait img { animation: settle-in 650ms var(--ease-spring) both; }
      :host-context(html:not(.settled)) .dot::after { animation: ping 520ms var(--ease-out) 180ms both; }
    }
    @keyframes settle { from { transform: translateY(14px); } }
    @keyframes settle-in { from { transform: scale(0.96); } }
    .dot { position: relative; }
    .dot::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: var(--accent); opacity: 0; pointer-events: none; }
    @keyframes ping { from { transform: scale(1); opacity: 0.55; } to { transform: scale(3.2); opacity: 0; } }

    /* the portrait leans a few degrees toward a fine pointer and catches a soft highlight (hero.ts sets the vars) */
    @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
      .portrait { transform: perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)); transition: transform var(--dur-med) var(--ease-spring); }
      .portrait.tracking { transition-duration: 120ms; transition-timing-function: var(--ease-out); }
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
  protected readonly email = EMAIL;
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
