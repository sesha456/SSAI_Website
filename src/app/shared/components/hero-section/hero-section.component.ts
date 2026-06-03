import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { organizationAgeInfo } from '../../../core/utils/organization-age';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <section class="hero">
      <div class="particles" aria-hidden="true">
        @for (dot of dots; track dot.i) {
          <span [style.--i]="dot.i" [style.top.%]="dot.top" [style.left.%]="dot.left"></span>
        }
      </div>
      <div class="hero__inner reveal">
        <span class="eyebrow">University AI Research Community</span>
        <h1>Society for Students AI Innovations</h1>
        <p>Empowering the Next Generation of AI Innovators</p>
        <div class="hero__actions">
          <a routerLink="/join" class="primary-btn"><mat-icon>person_add</mat-icon>Join Us</a>
          <a routerLink="/projects" class="ghost-btn"><mat-icon>hub</mat-icon>Explore Projects</a>
          <a routerLink="/events" class="ghost-btn"><mat-icon>event</mat-icon>Upcoming Events</a>
        </div>
      </div>
      <div class="hero__panel glass" aria-label="AI innovation metrics">
        <div><strong>{{ age.ageLabel }}</strong><span>Founded: {{ age.foundedLabel }}</span></div>
        <div><strong>50+</strong><span>members</span></div>
        <div><strong>1</strong><span>annual conference</span></div>
      </div>
    </section>
  `,
  styleUrl: './hero-section.component.scss'
})
export class HeroSectionComponent {
  readonly age = organizationAgeInfo();
  readonly dots = Array.from({ length: 34 }, (_, index) => {
    const i = index + 1;
    return { i, top: (i * 13) % 100, left: (i * 29) % 100 };
  });
}
