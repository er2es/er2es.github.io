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
              <p class="lead">{{ p }}</p>
            }
          </div>
          <app-afk [c]="c()" />
        </div>
      </div>
    </section>
  `,
  styles: [`
    .body { margin-top: 1.5rem; }
    .cols { display: grid; gap: 2rem; }
    @media (min-width: 1000px) {
      .cols { grid-template-columns: minmax(0, 1fr) 17rem; gap: 4rem; align-items: start; }
      app-afk { margin-top: 1.5rem; }
    }
  `],
})
export class Profile {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.profile;
}
