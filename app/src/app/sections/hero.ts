import { Component, input } from '@angular/core';
import { EMAIL, type SiteContent } from '../content/model';

@Component({
  selector: 'app-hero',
  template: `
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
  `,
  styles: [`
    .hero { display: grid; gap: 2rem; align-items: center; padding-top: calc(var(--bar-h) + clamp(2.5rem, 7vw, 5.5rem)); padding-bottom: clamp(2.5rem, 6vw, 5rem); }
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
}
