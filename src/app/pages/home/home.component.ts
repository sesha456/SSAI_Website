import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { HeroSectionComponent } from '../../shared/components/hero-section/hero-section.component';
import { EventCardComponent } from '../../shared/components/event-card/event-card.component';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { TestimonialCarouselComponent } from '../../shared/components/testimonial-carousel/testimonial-carousel.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, HeroSectionComponent, EventCardComponent, ProjectCardComponent, TestimonialCarouselComponent],
  template: `
    <app-hero-section />

    <section class="section">
      <div class="section__inner split reveal">
        <div>
          <span class="eyebrow">About SSAI</span>
          <h2 class="section-title">A launchpad for responsible AI research and student-built innovation.</h2>
          <p class="section-copy">SSAI connects students, faculty, researchers, and industry mentors through applied projects, research initiatives, events, and leadership pathways.</p>
        </div>
        <div class="stats">
          @for (stat of content.stats; track stat.label) {
            <div class="glass"><strong>{{ stat.value }}{{ stat.suffix }}</strong><span>{{ stat.label }}</span></div>
          }
        </div>
      </div>
    </section>

    <section class="section band">
      <div class="section__inner card-grid reveal">
        @for (item of pillars; track item.title) {
          <article class="info glass">
            <span class="eyebrow">{{ item.kicker }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.copy }}</p>
          </article>
        }
      </div>
    </section>

    <section class="section">
      <div class="section__inner reveal">
        <span class="eyebrow">Featured Events</span>
        <h2 class="section-title">Programs built for learning, making, and presenting.</h2>
        <div class="card-grid top-gap">
          @for (event of content.events.slice(0, 3); track event.id) { <app-event-card [event]="event" /> }
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section__inner reveal">
        <span class="eyebrow">Research Initiatives</span>
        <h2 class="section-title">Student-led AI projects with academic and industry relevance.</h2>
        <div class="card-grid top-gap">
          @for (project of content.projects.slice(0, 3); track project.id) {
            <app-project-card [project]="project" (open)="voidProject()" />
          }
        </div>
        <a routerLink="/projects" class="ghost-btn top-link">View all projects</a>
      </div>
    </section>

    <section class="section band">
      <div class="section__inner reveal">
        <span class="eyebrow">Sponsors & Testimonials</span>
        <h2 class="section-title">Built with a growing ecosystem of mentors, labs, and partners.</h2>
        <div class="partners">
          @for (partner of partners; track partner) { <span class="glass">{{ partner }}</span> }
        </div>
        <app-testimonial-carousel [testimonials]="content.testimonials" />
      </div>
    </section>

  `,
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  readonly content = inject(ContentService);
  readonly pillars = [
    { kicker: 'Mission', title: 'Make AI education actionable', copy: 'We help students transform theory into prototypes, research, publications, demos, and career-ready portfolios.' },
    { kicker: 'Vision', title: 'A campus AI innovation hub', copy: 'SSAI aims to become the central place for interdisciplinary AI exploration across university and industry communities.' },
    { kicker: 'Opportunities', title: 'Learn, lead, and collaborate', copy: 'Members join project teams, run events, conduct research, mentor peers, and connect with professional networks.' }
  ];
  readonly partners = ['AI Research Lab', 'Engineering College', 'Innovation Center', 'Health Data Studio', 'Startup Incubator'];

  voidProject(): void {}
}
