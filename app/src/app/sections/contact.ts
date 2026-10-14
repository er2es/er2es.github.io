import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input } from '@angular/core';
import { replayOnReturn } from '../core/replay';
import { EXTRA } from '../content/extra';
import { FILES, EMAIL, GITHUB_URL, LINKEDIN_URL, type SiteContent } from '../content/model';
import { Email } from './email';

@Component({
  selector: 'app-contact',
  imports: [Email],
  template: `
    <section id="contact" class="block alt" tabindex="-1" aria-labelledby="contact-h">
      <div class="wrap reveal">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="contact-h">{{ c().ui.sections.contact }}</h2>
        <p class="lead measure">{{ c().contact.text }}</p>
        <p class="mode mono">{{ c().contact.workMode }}</p>
        <div class="act">
          <app-email [c]="c()" />
          <div class="icons">
          <a class="icon mail" [attr.href]="'mailto:' + email">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3.5 7l8.5 6.5L20.5 7" /></svg>
            <span class="sr-only">{{ c().hero.cta }}</span>
          </a>
          <a class="icon" [attr.href]="github" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" width="22" height="22" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" /></svg>
            <span class="sr-only">GitHub {{ x().newTab }}</span>
          </a>
          <a class="icon" [attr.href]="linkedin" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true" focusable="false"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            <span class="sr-only">LinkedIn {{ x().newTab }}</span>
          </a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .lead { margin-top: 1.25rem; }
    .mode { margin-top: 0.5rem; color: var(--fg-2); }
    .act { margin-top: 1.5rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1rem; }
    .icons { display: flex; gap: 0.5rem; }
    .icon {
      display: inline-grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; color: var(--fg);
      border: 1px solid var(--line); transition: background-color var(--dur-short) var(--ease-out), scale var(--dur-press) var(--ease-out);
    }
    @media (hover: hover) { .icon:hover { background: var(--tint-hover); } }
    .icon:active { background: var(--tint-press); scale: 0.94; }
    /* the closing chapter settles in like the hero does, each time it scrolls into view (transform only) */
    @media (prefers-reduced-motion: no-preference) {
      .enter .wrap > * { animation: settle 500ms var(--ease-spring) both; }
      .enter .wrap > :nth-child(2) { animation-delay: 50ms; }
      .enter .wrap > :nth-child(3) { animation-delay: 100ms; }
      .enter .wrap > :nth-child(4) { animation-delay: 150ms; }
      .enter .wrap > :nth-child(5) { animation-delay: 200ms; }
    }
    @keyframes settle { from { transform: translateY(14px); } }
  `],
})
export class Contact {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.contact;
  protected readonly email = EMAIL;
  protected readonly github = GITHUB_URL;
  protected readonly linkedin = LINKEDIN_URL;
  protected readonly x = computed(() => EXTRA[this.c().lang]);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const section = host.nativeElement.querySelector<HTMLElement>('#contact');
      if (section) destroy.onDestroy(replayOnReturn(section, 'enter'));
    });
  }
}
