import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { EXTRA, NO_USES } from '../content/extra';
import { FACTS, FACT_BY_ID, FILES, SKILLS, period, type ItemId, type SiteContent } from '../content/model';
import { anchorHref, inPageClick } from '../core/nav';
import { SkillLens, usesOf } from './uses';

interface Use { id: ItemId; job: boolean; title: string; meta: string; anchor: string }

@Component({
  selector: 'app-skills',
  template: `
    <section id="skills" class="block" tabindex="-1" aria-labelledby="skills-h">
      <div class="wrap">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="skills-h">{{ c().ui.sections.skills }}</h2>
        <p class="intro">{{ c().skills.intro }}</p>
        <div role="toolbar" [attr.aria-label]="x().skillsToolbar" (keydown)="onKey($event)">
          <dl class="groups">
            @for (g of view(); track g.group) {
              <div class="group" [id]="'skills-' + g.group" tabindex="-1">
                <dt>{{ g.label }}</dt>
                <dd>
                  <ul class="pills">
                    @for (s of g.items; track s.name) {
                      <li><button type="button" class="pill" [attr.data-skill]="s.name"
                          [attr.tabindex]="s.name === (focusable() ?? first()) ? 0 : -1"
                          [attr.aria-expanded]="open() === s.name" [attr.aria-controls]="open() === s.name ? 'uses-' + g.group : null"
                          (click)="toggle(s.name)" (focus)="focusable.set(s.name)">{{ s.label }}</button></li>
                    }
                  </ul>
                  @for (s of g.items; track s.name) {
                    @if (open() === s.name) {
                      <div class="uses" role="region" [id]="'uses-' + g.group" [attr.aria-label]="usedIn(s.label)">
                        @if (!uses().length) { <p class="none" lang="en">{{ noUses }}</p> } @else {
                        <ul>
                          @for (u of uses(); track u.id; let i = $index) {
                            <li [style.--i]="i">
                              <a [attr.href]="href(u.anchor)" (click)="go($event, u.anchor)">
                                <svg class="ico" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                                  @if (u.job) { <rect x="3" y="6" width="14" height="10" rx="2" /><path d="M7.5 6V4.5h5V6" /> }
                                  @else { <path d="M3 6.5V15a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 17 15V8a1.5 1.5 0 0 0-1.5-1.5H10L8.5 4.5h-4A1.5 1.5 0 0 0 3 6z" /> }
                                </svg>
                                <span class="sr-only">{{ u.job ? x().job : x().project }}: </span>
                                <span class="t">{{ u.title }}</span>
                                @if (u.meta) { <span class="m mono">{{ u.meta }}</span> }
                              </a>
                            </li>
                          }
                        </ul>
                        }
                      </div>
                    }
                  }
                </dd>
              </div>
            }
          </dl>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .groups { margin-top: 1.5rem; border-top: 1px solid var(--line); }
    .group { display: grid; gap: 0.5rem; padding: 1rem 0.5rem; border-bottom: 1px solid var(--line); scroll-margin-top: calc(var(--bar-h) + 1.25rem); outline: none; }
    dt { font: 600 var(--t-subhead) / 1.3 var(--font); color: var(--fg-2); }
    dd { margin: 0; }
    .pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .pill {
      display: inline-block; padding: 0.4rem 0.85rem; border-radius: 999px; font: 500 var(--t-callout) / 1.2 var(--font); color: var(--fg);
      background: color-mix(in srgb, var(--fg) 7%, transparent);
      border: 1px solid color-mix(in srgb, var(--fg) 14%, transparent);
    }
    button.pill { cursor: pointer; }
    @media (hover: hover) { button.pill:hover { background: color-mix(in srgb, var(--fg) 12%, transparent); } }
    button.pill[aria-expanded='true'] { background: var(--fg); color: var(--bg); border-color: var(--fg); }

    .uses { margin-top: 0.75rem; }
    .uses ul { display: grid; gap: 2px; }
    .uses a {
      display: flex; align-items: center; gap: 0.625rem; min-height: 44px; padding: 0.5rem 0.75rem; border-radius: 12px;
      color: var(--fg); text-decoration: none; background: color-mix(in srgb, var(--fg) 4%, transparent);
    }
    @media (hover: hover) { .uses a:hover { background: color-mix(in srgb, var(--accent) 12%, transparent); } }
    .uses .ico { flex: none; color: var(--accent); }
    .uses .t { flex: 1; min-width: 0; font-weight: 500; }
    .uses .none { padding: 0.5rem 0.75rem; color: var(--fg-2); font-size: var(--t-subhead); }
    @media (prefers-reduced-motion: no-preference) { .uses .none { animation: use-in var(--dur-short) var(--ease-spring) both; } }
    .uses .m { flex: none; color: var(--fg-2); font-size: var(--t-footnote); }
    @media (prefers-reduced-motion: no-preference) {
      .uses li { animation: use-in var(--dur-short) var(--ease-spring) both; animation-delay: calc(var(--i, 0) * 30ms); }
    }
    @keyframes use-in { from { transform: translateY(-6px); } }

    @media (min-width: 800px) { .group { grid-template-columns: 14rem 1fr; gap: 1.5rem; align-items: baseline; padding-block: 1.125rem; } }
  `],
  host: { '(keydown.escape)': 'close()' },
})
export class Skills {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.skills;
  protected readonly noUses = NO_USES;
  private readonly lens = inject(SkillLens);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly x = computed(() => EXTRA[this.c().lang]);
  protected readonly open = signal<string | null>(null);
  /** Roving tabindex: the one pill reachable with Tab; arrow keys move between pills. */
  protected readonly focusable = signal<string | null>(null);

  protected readonly view = computed(() => {
    const c = this.c();
    return SKILLS.map((g) => ({
      group: g.group,
      label: c.skills.groups[g.group],
      items: g.items.map((s) => ({
        name: s.name,
        label: s.label?.[c.lang] ?? s.name,
      })),
    }));
  });

  /** Where the open skill was used; worked out only when a panel opens, not while the page hydrates. */
  protected readonly uses = computed((): Use[] => {
    const name = this.open();
    const c = this.c();
    if (!name) return [];
    return usesOf(name, FACTS, c.items).map((id) => {
      const f = FACT_BY_ID[id];
      const t = c.items[id];
      return {
        id,
        job: f.kind === 'job',
        title: f.kind === 'job' && t.org ? `${t.title} · ${t.org}` : t.title,
        meta: period(f),
        anchor: f.kind === 'job' ? `job-${id}` : `p-${id}`,
      };
    });
  });

  protected readonly first = computed(() => this.view()[0]?.items[0]?.name);

  protected usedIn(skill: string): string {
    return this.x().usedIn.replace('{skill}', skill);
  }

  protected href(anchor: string): string {
    return anchorHref(this.c().lang, anchor);
  }

  protected go(e: Event, anchor: string): void {
    inPageClick(e, anchor);
  }

  protected toggle(name: string): void {
    this.set(this.open() === name ? null : name);
  }

  protected close(): void {
    const name = this.open();
    if (!name) return;
    const panel = this.host.nativeElement.querySelector('.uses');
    const fromPanel = !!panel?.contains(document.activeElement);
    this.set(null);
    if (fromPanel) this.pill(name)?.focus(); // the panel is going away: focus goes back to its skill
  }

  private set(name: string | null): void {
    this.open.set(name);
    this.lens.ids.set(new Set(this.uses().map((u) => u.id)));
  }

  private pill(name: string): HTMLButtonElement | null {
    return this.host.nativeElement.querySelector<HTMLButtonElement>(`button.pill[data-skill="${CSS.escape(name)}"]`);
  }

  protected onKey(e: KeyboardEvent): void {
    const t = e.target as HTMLElement;
    if (!t.matches('button.pill')) return;
    const pills = [...this.host.nativeElement.querySelectorAll<HTMLButtonElement>('button.pill')];
    const i = pills.indexOf(t as HTMLButtonElement);
    const groupOf = (b: HTMLElement) => b.closest('.group');
    let next: HTMLButtonElement | undefined;
    switch (e.key) {
      case 'ArrowRight': next = pills[Math.min(i + 1, pills.length - 1)]; break;
      case 'ArrowLeft': next = pills[Math.max(i - 1, 0)]; break;
      case 'Home': next = pills[0]; break;
      case 'End': next = pills[pills.length - 1]; break;
      case 'ArrowDown':
      case 'ArrowUp': {
        // the first pill of the next / previous group
        const groups = [...new Set(pills.map(groupOf))];
        const g = groups.indexOf(groupOf(t)) + (e.key === 'ArrowDown' ? 1 : -1);
        if (g >= 0 && g < groups.length) next = pills.find((p) => groupOf(p) === groups[g]);
        else next = t as HTMLButtonElement;
        break;
      }
      default: return;
    }
    e.preventDefault();
    if (next) {
      this.focusable.set(next.dataset['skill'] ?? '');
      next.focus();
    }
  }
}
