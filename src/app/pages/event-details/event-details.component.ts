import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ContentService } from '../../core/services/content.service';
import { EventHighlightsComponent } from '../../shared/components/event-highlights/event-highlights.component';
import { GalleryGridComponent } from '../../shared/components/gallery-grid/gallery-grid.component';
import { SpeakerCardComponent } from '../../shared/components/speaker-card/speaker-card.component';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule, EventHighlightsComponent, GalleryGridComponent, SpeakerCardComponent],
  template: `
    @if (event(); as event) {
      <section class="detail-hero section">
        @if (event.videoUrl) {
          <video #heroVideo class="hero-video" [src]="event.videoUrl" autoplay loop playsinline></video>
          <div class="hero-video__shade"></div>
          @if (showPlayPrompt()) {
            <button class="sound-prompt glass" type="button" (click)="playWithSound()">
              <mat-icon>volume_up</mat-icon>
              Play AI Horizons video with sound
            </button>
          }
        }
        <div class="section__inner detail-hero__grid reveal">
          <div>
            <span class="eyebrow">Past Event</span>
            <h1>{{ event.title }}</h1>
            <p>{{ event.tagline }}</p>
            <div class="badges">
              <span><mat-icon>calendar_today</mat-icon>{{ event.date | date: 'MMMM d, y' }}</span>
              <span><mat-icon>schedule</mat-icon>{{ event.time }}</span>
              <span><mat-icon>location_on</mat-icon>{{ event.venue }}</span>
            </div>
            <div class="actions">
              <a class="primary-btn" href="#" download><mat-icon>download</mat-icon>Download Brochure</a>
              <a class="ghost-btn" href="https://www.linkedin.com/shareArticle?mini=true" target="_blank" rel="noreferrer"><mat-icon>share</mat-icon>Share</a>
            </div>
          </div>
          <div class="banner glass" [class.video-card]="event.videoUrl" [style.background]="event.videoUrl ? null : event.banner">
            @if (event.videoUrl) {
              <mat-icon>movie</mat-icon>
              <span>Event day video is playing in the background</span>
            } @else {
              <span>{{ event.tagline }}</span>
            }
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section__inner about-grid reveal">
          <div>
            <span class="eyebrow">About Event</span>
            <h2 class="section-title">A one-day AI conference built around opportunity and applied insight.</h2>
            <p class="section-copy">{{ event.overview }}</p>
            <p class="organizers">{{ event.organizedBy }}<br>{{ event.campus }}</p>
          </div>
          <div class="stats">
            @for (stat of event.stats; track stat.label) {
              <div class="glass"><strong>{{ stat.value }}{{ stat.suffix }}</strong><span>{{ stat.label }}</span></div>
            }
          </div>
        </div>
      </section>

      <section class="section band">
        <div class="section__inner reveal">
          <span class="eyebrow">Highlights</span>
          <h2 class="section-title">Conference moments designed for learning, recognition, and connection.</h2>
          <div class="top-gap">
            <app-event-highlights [highlights]="event.highlights" />
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section__inner reveal">
          <span class="eyebrow">Featured Speakers</span>
          <h2 class="section-title">Industry professionals and founders who shaped the conversation.</h2>
          <div class="speaker-grid top-gap">
            @for (speaker of event.speakers; track speaker.name) {
              <app-speaker-card [speaker]="speaker" />
            }
          </div>
        </div>
      </section>

      <section class="section band">
        <div class="section__inner schedule-grid reveal">
          <div>
            <span class="eyebrow">Schedule</span>
            <h2 class="section-title">Conference timeline</h2>
          </div>
          <div class="timeline">
            @for (item of event.schedule; track item.time) {
              <article class="glass">
                <strong>{{ item.time }}</strong>
                <span>{{ item.title }}</span>
              </article>
            }
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section__inner reveal">
          <span class="eyebrow">Recap Gallery</span>
          <h2 class="section-title">Visual moments from AI Horizons 2026.</h2>
          <div class="video glass">
            <mat-icon>smart_display</mat-icon>
            <strong>Recap video placeholder</strong>
            <span>Connect a YouTube or hosted video URL when event media is available.</span>
          </div>
          <app-gallery-grid [items]="event.gallery" />
        </div>
      </section>
    } @else {
      <section class="section page">
        <div class="section__inner glass missing">
          <span class="eyebrow">Event Not Found</span>
          <h1>We could not find that past event.</h1>
          <a routerLink="/past-events" class="primary-btn">Back to Past Events</a>
        </div>
      </section>
    }
  `,
  styleUrl: './event-details.component.scss'
})
export class EventDetailsComponent implements AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly content = inject(ContentService);
  @ViewChild('heroVideo') private readonly heroVideo?: ElementRef<HTMLVideoElement>;
  readonly showPlayPrompt = signal(false);
  readonly event = computed(() => {
    const slug = this.route.snapshot.paramMap.get('slug');
    return this.content.pastEvents.find((item) => item.slug === slug) ?? null;
  });

  ngAfterViewInit(): void {
    setTimeout(() => void this.playWithSound(false));
  }

  async playWithSound(fromPrompt = true): Promise<void> {
    const video = this.heroVideo?.nativeElement;
    if (!video) {
      return;
    }
    video.muted = false;
    video.volume = 1;
    try {
      await video.play();
      this.showPlayPrompt.set(false);
    } catch {
      this.showPlayPrompt.set(!fromPrompt);
    }
  }
}
