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
    .portrait { order: -1; }
    .portrait img { display: block; width: min(100%, 15rem); height: auto; aspect-ratio: 1; object-fit: cover; border-radius: 2rem; }
    @media (min-width: 800px) {
      .hero { grid-template-columns: 1.2fr 0.8fr; }
      .portrait { order: 0; justify-self: end; }
      .portrait img { width: min(100%, 20rem); border-radius: 2.5rem; }
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
    });
  }
}
