import { Component, input } from '@angular/core';
import { FILES, type SiteContent } from '../content/model';

@Component({
  selector: 'app-profile',
  template: `
    <section id="profile" class="block" tabindex="-1" aria-labelledby="profile-h">
      <div class="wrap reveal">
        <p class="eyebrow mono">{{ file }}</p>
        <h2 id="profile-h">{{ c().ui.sections.profile }}</h2>
        <div class="measure body">
          @for (p of c().profile.paragraphs; track $index) {
            <p class="lead">{{ p }}</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: ['.body { margin-top: 1.5rem; }'],
})
export class Profile {
  readonly c = input.required<SiteContent>();
  protected readonly file = FILES.profile;
}
