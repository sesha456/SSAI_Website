import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PastEvent } from '../../models/content.models';

@Component({
  selector: 'app-past-event-card',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule],
  template: `
    <article class="past-event glass">
      <div class="past-event__banner" [style.background]="event().bannerVideoUrl ? null : event().banner">
        @if (event().bannerVideoUrl) {
          <video
            class="past-event__video"
            [src]="event().bannerVideoUrl"
            autoplay
            loop
            playsinline
            controls
            preload="metadata"
          ></video>
        }
        <span class="badge">Past Event</span>
      </div>
      <div class="past-event__body">
        <span class="eyebrow">{{ event().tagline }}</span>
        <h2>{{ event().title }}</h2>
        <div class="meta">
          <span><mat-icon>calendar_today</mat-icon>{{ event().date | date: 'MMMM d, y' }}</span>
          <span><mat-icon>location_on</mat-icon>{{ event().venue }}</span>
        </div>
        <p>{{ event().overview }}</p>
        <a class="primary-btn" [routerLink]="['/past-events', event().slug]">View Event <mat-icon>arrow_forward</mat-icon></a>
      </div>
    </article>
  `,
  styleUrl: './past-event-card.component.scss'
})
export class PastEventCardComponent {
  readonly event = input.required<PastEvent>();
}
