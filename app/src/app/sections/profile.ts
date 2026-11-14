import { Component, input } from '@angular/core';
import { FILES, type SiteContent } from '../content/model';
import { Afk } from './afk';

@Component({
  selector: 'app-profile',
  imports: [Afk],
  template: `
    <section id="profile" class="block" tabindex="-1" aria-labelledby="profile-h">
      <div class="wrap reveal">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="profile-h">{{ c().ui.sections.profile }}</h2>
        <div class="cols">
          <div class="measure body">
            @for (p of c().profile.paragraphs; track $index) {
              <p [class.lead]="$first">{{ p }}</p>
            }
          </div>
          <app-afk id="profile-afk" tabindex="-1" [c]="c()" />
        </div>
      </div>
    </section>
  `,
  styles: [`
    .body { margin-top: 1.5rem; }
    /* the first paragraph says who; the others are the reading that follows it, with room between them */
    .body p + p { margin-top: 1.125rem; }
    .body .lead + p { margin-top: 1.75rem; }
    .body p:not(.lead) { line-height: 1.6; }
    .cols { display: grid; gap: 2rem; }
    @media (min-width: 1000px) {
      .cols { grid-template-columns: minmax(0, 1fr) 17rem; gap: 4rem; align-items: start; }
      app-afk { margin-top: 1.5rem; scroll-margin-top: calc(var(--bar-h) + 1.25rem); outline: none; }
    }
  `],
})
export class Profile {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.profile;
}
