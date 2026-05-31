import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EventItem } from '../../models/content.models';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule],
  template: `
    <article class="event glass">
      <div class="event__image" [style.background]="event().image"></div>
      <div class="event__body">
        <span class="pill">{{ event().category }}</span>
        <h3>{{ event().title }}</h3>
        <p>{{ event().description }}</p>
        <div class="meta">
          <span><mat-icon>calendar_today</mat-icon>{{ event().date | date: 'MMM d, y' }}</span>
          <span><mat-icon>schedule</mat-icon>{{ event().time }}</span>
          <span><mat-icon>location_on</mat-icon>{{ event().venue }}</span>
        </div>
        <div class="actions">
          <a class="primary-btn" [routerLink]="['/events', eventSlug()]">View Details</a>
          <a class="ghost-btn" [href]="event().registrationLink || 'mailto:events@ssai.org?subject=Register%20for%20SSAI%20event'">Register</a>
        </div>
      </div>
    </article>
  `,
  styleUrl: './event-card.component.scss'
})
export class EventCardComponent {
  readonly event = input.required<EventItem>();

  eventSlug(): string {
    return this.event().slug || this.slugify(this.event().title);
  }

  private slugify(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'event';
  }
}
