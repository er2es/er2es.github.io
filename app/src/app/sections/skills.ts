import { Component, computed, input } from '@angular/core';
import { FILES, SKILLS, type SiteContent } from '../content/model';

/**
 * The skills, by area, as plain labels: nothing here moves the page or lights up another section. Where each skill
 * was used is told by the career graph in the Experience section.
 */
@Component({
  selector: 'app-skills',
  template: `
    <section id="skills" class="block" tabindex="-1" aria-labelledby="skills-h">
      <div class="wrap">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="skills-h">{{ c().ui.sections.skills }}</h2>
        <p class="intro">{{ c().skills.intro }}</p>
        <dl class="groups">
          @for (g of view(); track g.group) {
            <div class="group" [id]="'skills-' + g.group" tabindex="-1">
              <dt>{{ g.label }}</dt>
              <dd>
                <ul class="pills" (pointerdown)="glint($event)">
                  @for (s of g.items; track s.label) {
                    <li class="pill">{{ s.label }}</li>
                  }
                </ul>
              </dd>
            </div>
          }
        </dl>
      </div>
    </section>
  `,
  styles: [`
    .groups { margin-top: 1.5rem; border-top: 1px solid var(--line); }
    .group { position: relative; isolation: isolate; display: grid; gap: 0.5rem; padding: 1rem 0.5rem; border-bottom: 1px solid var(--line); scroll-margin-top: calc(var(--bar-h) + 1.25rem); outline: none; }
    dt { font: 600 var(--t-subhead) / 1.3 var(--font); color: var(--fg-2); }
    dd { margin: 0; }
    .pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .pill {
      position: relative; overflow: hidden; display: inline-block; padding: 0.4rem 0.85rem; border-radius: 999px; font: 500 var(--t-callout) / 1.2 var(--font); color: var(--fg);
      background: color-mix(in srgb, var(--fg) 7%, transparent);
      border: 1px solid color-mix(in srgb, var(--fg) 14%, transparent);
    }

    /*
     * Hover, mouse only, and deliberately not button-like (no lift, no pointer cursor, nothing to press):
     *  - the whole row catches the light that follows the pointer (--mx / --my, set by core/lit.ts) and a thin accent
     *    line grows down its left edge;
     *  - a pill gets one soft glint sweeping across it, and its outline warms to the accent colour; a touch does the same.
     */
    @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
      /* both exist only while the row is hovered: nothing lies over the text at rest */
      .group:hover::before {
        content: ''; position: absolute; inset: 0 -0.5rem; z-index: -1; border-radius: 14px; pointer-events: none;
        background: radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), var(--lit), transparent 70%);
        animation: row-lit var(--dur-med) var(--ease-out) both;
      }
      .group:hover::after {
        content: ''; position: absolute; left: -0.5rem; top: 0.9rem; bottom: 0.9rem; width: 2px; border-radius: 1px; pointer-events: none;
        background: var(--accent); transform-origin: top; animation: row-line var(--dur-med) var(--ease-out) both;
      }

      .pill:hover { border-color: color-mix(in srgb, var(--accent) 50%, transparent); background: color-mix(in srgb, var(--accent) 9%, transparent); }
      .pill:hover::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(105deg, transparent 30%, color-mix(in srgb, var(--accent) 38%, transparent) 50%, transparent 70%); background-size: 260% 100%; animation: glint 750ms var(--ease-out) both; }
    }
    /* the same glint on a touch screen, from the touch: the pill gets .touched for the length of the animation (glint() below) */
    @media (prefers-reduced-motion: no-preference) {
      .pill { transition: border-color var(--dur-short) var(--ease-out), background-color var(--dur-short) var(--ease-out); }
      .pill.touched { border-color: color-mix(in srgb, var(--accent) 50%, transparent); background: color-mix(in srgb, var(--accent) 9%, transparent); }
      .pill.touched::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(105deg, transparent 30%, color-mix(in srgb, var(--accent) 38%, transparent) 50%, transparent 70%); background-size: 260% 100%; animation: glint 750ms var(--ease-out) both; }
    }
    @keyframes row-lit { from { opacity: 0; } }
    @keyframes row-line { from { transform: scaleY(0); } }
    @keyframes glint { 0% { opacity: 1; background-position: 140% 0; } 100% { opacity: 1; background-position: -40% 0; } }
    @media (min-width: 800px) { .group { grid-template-columns: 14rem 1fr; gap: 1.5rem; align-items: baseline; padding-block: 1.125rem; } }
  `],
})
export class Skills {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.skills;

  protected readonly view = computed(() => {
    const c = this.c();
    return SKILLS.map((g) => ({
      group: g.group,
      label: c.skills.groups[g.group],
      items: g.items.map((s) => ({
        label: s.label?.[c.lang] ?? s.name,
      })),
    }));
  });

  /** A finger on a pill plays its glint once (a mouse does it on hover, in CSS). Nothing is pressed or opened. */
  protected glint(e: PointerEvent): void {
    if (e.pointerType === 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const pill = (e.target as Element).closest<HTMLElement>('.pill');
    if (!pill) return;
    pill.classList.remove('touched');
    void pill.offsetWidth; // restart the animation on a repeated touch
    pill.classList.add('touched');
    pill.addEventListener('animationend', () => pill.classList.remove('touched'), { once: true });
  }
}
