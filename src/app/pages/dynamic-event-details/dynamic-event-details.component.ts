import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ContentService } from '../../core/services/content.service';
import { OfficerSessionService } from '../../core/services/officer-session.service';
import { CustomEventSection, EventItem, EventPageContent } from '../../shared/models/content.models';

@Component({
  selector: 'app-dynamic-event-details',
  standalone: true,
  imports: [DatePipe, RouterLink, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    @if (event(); as event) {
      <section class="event-hero section" [style.background]="event.image">
        <div class="event-hero__shade"></div>
        <div class="section__inner event-hero__content reveal">
          <span class="eyebrow">{{ event.category }}</span>
          <h1>{{ event.title }}</h1>
          <p>{{ event.tagline || event.description }}</p>
          <div class="badges">
            <span><mat-icon>calendar_today</mat-icon>{{ event.date | date: 'MMMM d, y' }}</span>
            <span><mat-icon>schedule</mat-icon>{{ event.time }}</span>
            <span><mat-icon>location_on</mat-icon>{{ event.venue }}</span>
            @if (event.organizingTeam) {
              <span><mat-icon>groups</mat-icon>{{ event.organizingTeam }}</span>
            }
          </div>
          <div class="actions">
            <a class="primary-btn" [href]="event.registrationLink || '#'"><mat-icon>how_to_reg</mat-icon>Register</a>
            <a class="ghost-btn" routerLink="/events"><mat-icon>arrow_back</mat-icon>All Events</a>
            @if (officer.isOfficer()) {
              <button class="ghost-btn" type="button" (click)="openBuilder(event)"><mat-icon>edit</mat-icon>Edit Event Page</button>
            }
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section__inner two-col reveal">
          <div>
            <span class="eyebrow">About Event</span>
            <h2 class="section-title">{{ event.title }}</h2>
          </div>
          <div class="rich-copy" [innerHTML]="event.page?.about || event.description"></div>
        </div>
      </section>

      @if (event.page?.highlights?.length) {
        <section class="section band">
          <div class="section__inner reveal">
            <span class="eyebrow">Event Highlights</span>
            <h2 class="section-title">Key moments and opportunities.</h2>
            <div class="content-grid top-gap">
              @for (highlight of event.page?.highlights; track highlight.title) {
                <article class="glass info-card">
                  <mat-icon>{{ highlight.icon || 'stars' }}</mat-icon>
                  <h3>{{ highlight.title }}</h3>
                  <p>{{ highlight.description }}</p>
                </article>
              }
            </div>
          </div>
        </section>
      }

      @if (event.page?.speakers?.length) {
        <section class="section">
          <div class="section__inner reveal">
            <span class="eyebrow">Speakers</span>
            <h2 class="section-title">People shaping the event conversation.</h2>
            <div class="speaker-grid top-gap">
              @for (speaker of event.page?.speakers; track speaker.name) {
                <article class="glass speaker-card">
                  <div class="avatar">
                    @if (isImage(speaker.image)) { <img [src]="speaker.image" [alt]="speaker.name"> } @else { <span>{{ speaker.image }}</span> }
                  </div>
                  <h3>{{ speaker.name }}</h3>
                  <strong>{{ speaker.designation }}</strong>
                  <span>{{ speaker.organization }}</span>
                  <p>{{ speaker.bio }}</p>
                  @if (speaker.linkedin) { <a [href]="speaker.linkedin" target="_blank" rel="noreferrer"><mat-icon>work</mat-icon>LinkedIn</a> }
                </article>
              }
            </div>
          </div>
        </section>
      }

      @if (event.page?.gallery?.length) {
        <section class="section band">
          <div class="section__inner reveal">
            <span class="eyebrow">Gallery</span>
            <h2 class="section-title">Event photographs and visual moments.</h2>
            <div class="gallery-grid top-gap">
              @for (item of event.page?.gallery; track item.title) {
                <a class="gallery-item glass" [href]="item.image" target="_blank" rel="noreferrer" [style.background]="imageBackground(item.image)">
                  <span>{{ item.category }}</span>
                  <strong>{{ item.title }}</strong>
                </a>
              }
            </div>
          </div>
        </section>
      }

      @if (event.page?.sponsors?.length) {
        <section class="section">
          <div class="section__inner reveal">
            <span class="eyebrow">Sponsors & Partners</span>
            <h2 class="section-title">Organizations supporting the event.</h2>
            <div class="sponsor-grid top-gap">
              @for (sponsor of event.page?.sponsors; track sponsor.name) {
                <a class="glass sponsor" [href]="sponsor.website" target="_blank" rel="noreferrer">
                  @if (sponsor.logo) { <img [src]="sponsor.logo" [alt]="sponsor.name"> }
                  <strong>{{ sponsor.name }}</strong>
                </a>
              }
            </div>
          </div>
        </section>
      }

      @if (event.page?.videos?.length) {
        <section class="section band">
          <div class="section__inner reveal">
            <span class="eyebrow">Videos</span>
            <h2 class="section-title">Recordings and highlight reels.</h2>
            <div class="video-grid top-gap">
              @for (video of event.page?.videos; track video.url) {
                <article class="glass video-card">
                  @if (youtubeEmbed(video.url)) {
                    <iframe [src]="youtubeEmbed(video.url)" title="Event video" allowfullscreen></iframe>
                  } @else {
                    <video [src]="video.url" controls></video>
                  }
                  <strong>{{ video.title }}</strong>
                </article>
              }
            </div>
          </div>
        </section>
      }

      @for (section of event.page?.customSections || []; track section.title) {
        <section class="section">
          <div class="section__inner reveal custom-section">
            <span class="eyebrow">Custom Section</span>
            <h2 class="section-title">{{ section.title }}</h2>
            @if (section.image) { <img class="custom-image" [src]="section.image" [alt]="section.title"> }
            @if (section.layout === 'Cards') {
              <div class="content-grid top-gap">
                @for (card of cardLines(section.content); track card) {
                  <article class="glass info-card"><p>{{ card }}</p></article>
                }
              </div>
            } @else {
              <div class="rich-copy" [innerHTML]="section.content"></div>
            }
          </div>
        </section>
      }

      @if (builderOpen()) {
        <div class="modal">
          <div class="builder glass">
            <div class="builder__header">
              <div>
                <span class="eyebrow">Event Page Builder</span>
                <h2>{{ event.title }}</h2>
              </div>
              <button type="button" class="ghost-btn" (click)="builderOpen.set(false)">Close</button>
            </div>

            <form class="editor-block" [formGroup]="heroForm" (ngSubmit)="saveHero(event)">
              <h3>Hero Section</h3>
              <mat-form-field appearance="outline"><mat-label>Event Title</mat-label><input matInput formControlName="title"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Tagline</mat-label><input matInput formControlName="tagline"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Banner Image or Gradient</mat-label><input matInput formControlName="image"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Date</mat-label><input matInput type="date" formControlName="date"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Time</mat-label><input matInput formControlName="time"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Venue</mat-label><input matInput formControlName="venue"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Organizing Team</mat-label><input matInput formControlName="organizingTeam"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Registration Link</mat-label><input matInput formControlName="registrationLink"></mat-form-field>
              <button class="primary-btn" type="submit">Save Hero</button>
            </form>

            <form class="editor-block" [formGroup]="aboutForm" (ngSubmit)="saveAbout(event)">
              <h3>About Event</h3>
              <mat-form-field appearance="outline"><mat-label>Rich Text / HTML</mat-label><textarea matInput rows="6" formControlName="about"></textarea></mat-form-field>
              <button class="primary-btn" type="submit">Save About</button>
            </form>

            <div class="builder-grid">
              <form class="editor-block" [formGroup]="highlightForm" (ngSubmit)="saveHighlight(event)">
                <h3>{{ highlightIndex() === null ? 'Add Highlight' : 'Edit Highlight' }}</h3>
                <mat-form-field appearance="outline"><mat-label>Icon</mat-label><input matInput formControlName="icon"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput formControlName="title"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Description</mat-label><textarea matInput rows="3" formControlName="description"></textarea></mat-form-field>
                <button class="primary-btn" type="submit">Save Highlight</button>
              </form>

              <form class="editor-block" [formGroup]="speakerForm" (ngSubmit)="saveSpeaker(event)">
                <h3>{{ speakerIndex() === null ? 'Add Speaker' : 'Edit Speaker' }}</h3>
                <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Designation</mat-label><input matInput formControlName="designation"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Organization</mat-label><input matInput formControlName="organization"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Biography</mat-label><textarea matInput rows="3" formControlName="bio"></textarea></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Profile Photo URL or Initials</mat-label><input matInput formControlName="image"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>LinkedIn URL</mat-label><input matInput formControlName="linkedin"></mat-form-field>
                <button class="primary-btn" type="submit">Save Speaker</button>
              </form>

              <form class="editor-block" [formGroup]="galleryForm" (ngSubmit)="saveGallery(event)">
                <h3>{{ galleryIndex() === null ? 'Add Gallery Image' : 'Edit Gallery Image' }}</h3>
                <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput formControlName="title"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Category</mat-label><input matInput formControlName="category"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Image URL</mat-label><input matInput formControlName="image"></mat-form-field>
                <button class="primary-btn" type="submit">Save Image</button>
              </form>

              <form class="editor-block" [formGroup]="sponsorForm" (ngSubmit)="saveSponsor(event)">
                <h3>{{ sponsorIndex() === null ? 'Add Sponsor' : 'Edit Sponsor' }}</h3>
                <mat-form-field appearance="outline"><mat-label>Sponsor Name</mat-label><input matInput formControlName="name"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Logo URL</mat-label><input matInput formControlName="logo"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Website</mat-label><input matInput formControlName="website"></mat-form-field>
                <button class="primary-btn" type="submit">Save Sponsor</button>
              </form>

              <form class="editor-block" [formGroup]="videoForm" (ngSubmit)="saveVideo(event)">
                <h3>{{ videoIndex() === null ? 'Add Video' : 'Edit Video' }}</h3>
                <mat-form-field appearance="outline"><mat-label>Video Title</mat-label><input matInput formControlName="title"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>YouTube or MP4 URL</mat-label><input matInput formControlName="url"></mat-form-field>
                <button class="primary-btn" type="submit">Save Video</button>
              </form>

              <form class="editor-block" [formGroup]="customForm" (ngSubmit)="saveCustomSection(event)">
                <h3>{{ customIndex() === null ? 'Add Custom Section' : 'Edit Custom Section' }}</h3>
                <mat-form-field appearance="outline"><mat-label>Section Title</mat-label><input matInput formControlName="title"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Layout</mat-label><mat-select formControlName="layout"><mat-option value="Text">Rich Text + Images</mat-option><mat-option value="Cards">Cards</mat-option></mat-select></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Content</mat-label><textarea matInput rows="5" formControlName="content"></textarea></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Image URL</mat-label><input matInput formControlName="image"></mat-form-field>
                <button class="primary-btn" type="submit">Save Section</button>
              </form>
            </div>

            <div class="editor-block">
              <h3>Manage Existing Sections</h3>
              <div class="manage-list">
                @for (item of sectionItems(event); track item.key) {
                  <div>
                    <span>{{ item.label }}</span>
                    <div>
                      <button type="button" (click)="editSectionItem(event, item)"><mat-icon>edit</mat-icon></button>
                      <button type="button" (click)="moveSectionItem(event, item, -1)"><mat-icon>arrow_upward</mat-icon></button>
                      <button type="button" (click)="moveSectionItem(event, item, 1)"><mat-icon>arrow_downward</mat-icon></button>
                      <button type="button" (click)="deleteSectionItem(event, item)"><mat-icon>delete</mat-icon></button>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    } @else {
      <section class="section page">
        <div class="section__inner glass missing">
          <span class="eyebrow">Event Not Found</span>
          <h1>We could not find that event.</h1>
          <a routerLink="/events" class="primary-btn">Back to Events</a>
        </div>
      </section>
    }
  `,
  styleUrl: './dynamic-event-details.component.scss'
})
export class DynamicEventDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = new FormBuilder();
  private readonly sanitizer = inject(DomSanitizer);
  readonly content = inject(ContentService);
  readonly officer = inject(OfficerSessionService);
  readonly builderOpen = signal(false);
  readonly highlightIndex = signal<number | null>(null);
  readonly speakerIndex = signal<number | null>(null);
  readonly galleryIndex = signal<number | null>(null);
  readonly sponsorIndex = signal<number | null>(null);
  readonly videoIndex = signal<number | null>(null);
  readonly customIndex = signal<number | null>(null);
  readonly event = computed(() => {
    this.content.version();
    const slug = this.route.snapshot.paramMap.get('slug');
    return this.content.events.find((item) => (item.slug || this.slugify(item.title)) === slug) ?? null;
  });

  readonly heroForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    tagline: [''],
    image: ['', Validators.required],
    date: ['', Validators.required],
    time: ['', Validators.required],
    venue: ['', Validators.required],
    organizingTeam: [''],
    registrationLink: ['']
  });
  readonly aboutForm = this.fb.nonNullable.group({ about: ['', Validators.required] });
  readonly highlightForm = this.fb.nonNullable.group({ icon: ['stars'], title: ['', Validators.required], description: [''] });
  readonly speakerForm = this.fb.nonNullable.group({ name: ['', Validators.required], designation: [''], organization: [''], bio: [''], image: [''], linkedin: [''] });
  readonly galleryForm = this.fb.nonNullable.group({ title: ['', Validators.required], category: ['Event photo'], image: ['', Validators.required] });
  readonly sponsorForm = this.fb.nonNullable.group({ name: ['', Validators.required], logo: [''], website: [''] });
  readonly videoForm = this.fb.nonNullable.group({ title: ['', Validators.required], url: ['', Validators.required] });
  readonly customForm = this.fb.nonNullable.group({ title: ['', Validators.required], layout: ['Text' as CustomEventSection['layout']], content: ['', Validators.required], image: [''] });

  openBuilder(event: EventItem): void {
    if (!this.officer.requireActiveSession()) return;
    this.heroForm.setValue({
      title: event.title,
      tagline: event.tagline ?? '',
      image: event.image,
      date: event.date,
      time: event.time,
      venue: event.venue,
      organizingTeam: event.organizingTeam ?? '',
      registrationLink: event.registrationLink ?? ''
    });
    this.aboutForm.setValue({ about: event.page?.about || event.description });
    this.builderOpen.set(true);
  }

  saveHero(event: EventItem): void {
    if (!this.requireValid(this.heroForm.valid)) return;
    const value = this.heroForm.getRawValue();
    this.content.updateEvent(event.id, { ...event, ...value, description: event.description });
  }

  saveAbout(event: EventItem): void {
    if (!this.requireValid(this.aboutForm.valid)) return;
    this.patchPage(event, { about: this.aboutForm.getRawValue().about });
  }

  saveHighlight(event: EventItem): void {
    if (!this.requireValid(this.highlightForm.valid)) return;
    const page = this.page(event);
    this.upsert(page.highlights, this.highlightIndex(), this.highlightForm.getRawValue());
    this.highlightIndex.set(null);
    this.highlightForm.reset({ icon: 'stars', title: '', description: '' });
    this.content.updateEventPage(event.id, page);
  }

  saveSpeaker(event: EventItem): void {
    if (!this.requireValid(this.speakerForm.valid)) return;
    const value = this.speakerForm.getRawValue();
    const page = this.page(event);
    this.upsert(page.speakers, this.speakerIndex(), { ...value, image: value.image || this.initials(value.name) });
    this.speakerIndex.set(null);
    this.speakerForm.reset();
    this.content.updateEventPage(event.id, page);
  }

  saveGallery(event: EventItem): void {
    if (!this.requireValid(this.galleryForm.valid)) return;
    const page = this.page(event);
    this.upsert(page.gallery, this.galleryIndex(), this.galleryForm.getRawValue());
    this.galleryIndex.set(null);
    this.galleryForm.reset({ category: 'Event photo' });
    this.content.updateEventPage(event.id, page);
  }

  saveSponsor(event: EventItem): void {
    if (!this.requireValid(this.sponsorForm.valid)) return;
    const page = this.page(event);
    this.upsert(page.sponsors, this.sponsorIndex(), this.sponsorForm.getRawValue());
    this.sponsorIndex.set(null);
    this.sponsorForm.reset();
    this.content.updateEventPage(event.id, page);
  }

  saveVideo(event: EventItem): void {
    if (!this.requireValid(this.videoForm.valid)) return;
    const page = this.page(event);
    this.upsert(page.videos, this.videoIndex(), this.videoForm.getRawValue());
    this.videoIndex.set(null);
    this.videoForm.reset();
    this.content.updateEventPage(event.id, page);
  }

  saveCustomSection(event: EventItem): void {
    if (!this.requireValid(this.customForm.valid)) return;
    const page = this.page(event);
    this.upsert(page.customSections, this.customIndex(), this.customForm.getRawValue());
    this.customIndex.set(null);
    this.customForm.reset({ layout: 'Text' });
    this.content.updateEventPage(event.id, page);
  }

  sectionItems(event: EventItem): Array<{ type: keyof EventPageContent; index: number; label: string; key: string }> {
    const page = this.page(event);
    return [
      ...page.highlights.map((item, index) => ({ type: 'highlights' as const, index, label: `Highlight: ${item.title}`, key: `h-${index}` })),
      ...page.speakers.map((item, index) => ({ type: 'speakers' as const, index, label: `Speaker: ${item.name}`, key: `s-${index}` })),
      ...page.gallery.map((item, index) => ({ type: 'gallery' as const, index, label: `Gallery: ${item.title}`, key: `g-${index}` })),
      ...page.sponsors.map((item, index) => ({ type: 'sponsors' as const, index, label: `Sponsor: ${item.name}`, key: `p-${index}` })),
      ...page.videos.map((item, index) => ({ type: 'videos' as const, index, label: `Video: ${item.title}`, key: `v-${index}` })),
      ...page.customSections.map((item, index) => ({ type: 'customSections' as const, index, label: `Custom: ${item.title}`, key: `c-${index}` }))
    ];
  }

  editSectionItem(event: EventItem, item: ReturnType<DynamicEventDetailsComponent['sectionItems']>[number]): void {
    const page = this.page(event);
    if (item.type === 'highlights') { this.highlightIndex.set(item.index); this.highlightForm.setValue(page.highlights[item.index]); }
    if (item.type === 'speakers') { this.speakerIndex.set(item.index); this.speakerForm.setValue(page.speakers[item.index]); }
    if (item.type === 'gallery') { this.galleryIndex.set(item.index); this.galleryForm.setValue(page.gallery[item.index]); }
    if (item.type === 'sponsors') { this.sponsorIndex.set(item.index); this.sponsorForm.setValue(page.sponsors[item.index]); }
    if (item.type === 'videos') { this.videoIndex.set(item.index); this.videoForm.setValue(page.videos[item.index]); }
    if (item.type === 'customSections') {
      const section = page.customSections[item.index];
      this.customIndex.set(item.index);
      this.customForm.setValue({ ...section, image: section.image ?? '' });
    }
  }

  moveSectionItem(event: EventItem, item: ReturnType<DynamicEventDetailsComponent['sectionItems']>[number], direction: number): void {
    const page = this.page(event);
    const items = page[item.type] as unknown[];
    const nextIndex = item.index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    [items[item.index], items[nextIndex]] = [items[nextIndex], items[item.index]];
    this.content.updateEventPage(event.id, page);
  }

  deleteSectionItem(event: EventItem, item: ReturnType<DynamicEventDetailsComponent['sectionItems']>[number]): void {
    const page = this.page(event);
    (page[item.type] as unknown[]).splice(item.index, 1);
    this.content.updateEventPage(event.id, page);
  }

  youtubeEmbed(url: string): SafeResourceUrl | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${match[1]}`) : null;
  }

  imageBackground(value: string): string {
    return this.isImage(value) ? `linear-gradient(0deg, rgba(4,17,29,.65), rgba(4,17,29,.08)), url("${value}") center/cover` : value;
  }

  isImage(value: string): boolean {
    return /^https?:\/\//.test(value) || value.startsWith('/assets/');
  }

  cardLines(value: string): string[] {
    return value.split('\n').map((item) => item.trim()).filter(Boolean);
  }

  private patchPage(event: EventItem, patch: Partial<EventPageContent>): void {
    this.content.updateEventPage(event.id, { ...this.page(event), ...patch });
  }

  private page(event: EventItem): EventPageContent {
    return {
      about: event.page?.about || event.description,
      highlights: [...(event.page?.highlights ?? [])],
      speakers: [...(event.page?.speakers ?? [])],
      gallery: [...(event.page?.gallery ?? [])],
      sponsors: [...(event.page?.sponsors ?? [])],
      videos: [...(event.page?.videos ?? [])],
      customSections: [...(event.page?.customSections ?? [])]
    };
  }

  private upsert<T>(items: T[], index: number | null, value: T): void {
    if (index === null) {
      items.push(value);
    } else {
      items[index] = value;
    }
  }

  private requireValid(valid: boolean): boolean {
    return this.officer.requireActiveSession() && valid;
  }

  private initials(value: string): string {
    return value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }

  private slugify(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'event';
  }
}
