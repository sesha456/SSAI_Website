import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { EventCardComponent } from '../../shared/components/event-card/event-card.component';
import { ContentService } from '../../core/services/content.service';
import { GitHubCmsService } from '../../core/services/github-cms.service';
import { OfficerSessionService } from '../../core/services/officer-session.service';
import { EventItem } from '../../shared/models/content.models';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, EventCardComponent],
  template: `
    <section class="section page">
      <div class="section__inner reveal">
        <span class="eyebrow">{{ content.siteContent.eventsHero.eyebrow }}</span>
        <h1 class="section-title">{{ content.siteContent.eventsHero.title }}</h1>
        <p class="section-copy">{{ content.siteContent.eventsHero.copy }}</p>
        @if (officer.isOfficer()) {
          <button class="edit-heading" type="button" (click)="openHeroEditor()"><mat-icon>edit</mat-icon>Edit</button>
        }
        <div class="filters">
          @for (category of categories; track category) {
            <button type="button" class="pill" [class.active]="selected() === category" (click)="selected.set(category)">{{ category }}</button>
          }
        </div>
        @if (officer.isOfficer()) {
          <div class="admin-bar glass">
            <span>{{ content.saveMessage() || 'Officer editing enabled' }}</span>
            <button class="primary-btn" type="button" (click)="openAdd()">Add Event</button>
            <button class="ghost-btn" type="button" (click)="content.exportJson('events.json', content.events)">Export Updated JSON</button>
          </div>
        }
        <div class="card-grid top-gap">
          @for (event of filteredEvents(); track event.id) {
            <div class="managed-card">
              <app-event-card [event]="event" />
              @if (officer.isOfficer()) {
                <div class="manage-actions">
                  <button type="button" (click)="openEdit(event)" aria-label="Edit event"><mat-icon>edit</mat-icon></button>
                  <button type="button" (click)="deleteEvent(event.id)" aria-label="Delete event"><mat-icon>delete</mat-icon></button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>

    @if (editorOpen()) {
      <div class="modal">
        <form class="editor glass" [formGroup]="form" (ngSubmit)="saveEvent()">
          <h2>{{ editingId() === null ? 'Add Event' : 'Edit Event' }}</h2>
          <mat-form-field appearance="outline"><mat-label>Event Title</mat-label><input matInput formControlName="title"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Tagline</mat-label><input matInput formControlName="tagline"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Category</mat-label><mat-select formControlName="category">@for (category of eventCategories; track category) { <mat-option [value]="category">{{ category }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Date</mat-label><input matInput type="date" formControlName="date"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Time</mat-label><input matInput formControlName="time"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Venue</mat-label><input matInput formControlName="venue"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Registration Link</mat-label><input matInput formControlName="registrationLink"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Organizing Team</mat-label><input matInput formControlName="organizingTeam"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Overview</mat-label><textarea matInput rows="4" formControlName="description"></textarea></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Banner Image or Gradient</mat-label><input matInput formControlName="image"></mat-form-field>
          <label class="upload-box">
            <mat-icon>add_photo_alternate</mat-icon>
            <span>Choose banner image from computer</span>
            <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" (change)="uploadBanner($event)">
          </label>
          <mat-form-field appearance="outline"><mat-label>Speakers (comma separated)</mat-label><input matInput formControlName="speakers"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Highlights (comma separated)</mat-label><input matInput formControlName="highlights"></mat-form-field>
          <div class="editor-actions">
            <button class="ghost-btn" type="button" (click)="editorOpen.set(false)">Cancel</button>
            <button class="primary-btn" type="submit">Save</button>
          </div>
        </form>
      </div>
    }

    @if (heroEditorOpen()) {
      <div class="modal">
        <form class="editor glass" [formGroup]="heroForm" (ngSubmit)="saveHero()">
          <h2>Edit Page Heading</h2>
          <mat-form-field appearance="outline"><mat-label>Eyebrow</mat-label><input matInput formControlName="eyebrow"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Heading</mat-label><input matInput formControlName="title"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Content</mat-label><textarea matInput rows="5" formControlName="copy"></textarea></mat-form-field>
          <div class="editor-actions">
            <button class="ghost-btn" type="button" (click)="heroEditorOpen.set(false)">Cancel</button>
            <button class="primary-btn" type="submit">Save</button>
          </div>
        </form>
      </div>
    }
  `,
  styleUrl: './events.component.scss'
})
export class EventsComponent {
  private readonly fb = new FormBuilder();
  public readonly content = inject(ContentService);
  public readonly github = inject(GitHubCmsService);
  public readonly officer = inject(OfficerSessionService);
  readonly selected = signal<EventItem['category'] | 'All'>('All');
  readonly categories: Array<EventItem['category'] | 'All'> = ['All', 'Workshop', 'Research', 'Competition', 'Networking'];
  readonly eventCategories: EventItem['category'][] = ['Workshop', 'Research', 'Competition', 'Networking'];
  readonly editorOpen = signal(false);
  readonly heroEditorOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly heroForm = this.fb.nonNullable.group({
    eyebrow: ['', Validators.required],
    title: ['', Validators.required],
    copy: ['', Validators.required]
  });
  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    tagline: [''],
    category: ['Workshop' as EventItem['category'], Validators.required],
    date: ['', Validators.required],
    time: ['', Validators.required],
    venue: ['', Validators.required],
    description: ['', Validators.required],
    registrationLink: [''],
    organizingTeam: [''],
    image: ['linear-gradient(135deg, #45f0d1, #2563eb)'],
    speakers: [''],
    highlights: ['']
  });
  readonly filteredEvents = computed(() => {
    this.content.version();
    const category = this.selected();
    return category === 'All' ? this.content.events : this.content.events.filter((event) => event.category === category);
  });

  openAdd(): void {
    if (!this.officer.requireActiveSession()) return;
    this.editingId.set(null);
    this.form.reset({ category: 'Workshop', image: 'linear-gradient(135deg, #45f0d1, #2563eb)' });
    this.editorOpen.set(true);
  }

  openHeroEditor(): void {
    if (!this.officer.requireActiveSession()) return;
    this.heroForm.setValue(this.content.siteContent.eventsHero);
    this.heroEditorOpen.set(true);
  }

  saveHero(): void {
    if (!this.officer.requireActiveSession() || this.heroForm.invalid) {
      this.heroForm.markAllAsTouched();
      return;
    }
    this.content.updateHero('eventsHero', this.heroForm.getRawValue());
    this.heroEditorOpen.set(false);
  }

  openEdit(event: EventItem): void {
    if (!this.officer.requireActiveSession()) return;
    this.editingId.set(event.id);
    this.form.setValue({
      title: event.title,
      tagline: event.tagline ?? '',
      category: event.category,
      date: event.date,
      time: event.time,
      venue: event.venue,
      description: event.description,
      registrationLink: event.registrationLink ?? '',
      organizingTeam: event.organizingTeam ?? '',
      image: event.image,
      speakers: event.speakers?.join(', ') ?? '',
      highlights: event.highlights?.join(', ') ?? ''
    });
    this.editorOpen.set(true);
  }

  saveEvent(): void {
    if (!this.officer.requireActiveSession() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const id = this.editingId();
    const event: EventItem = {
      id: id ?? 0,
      slug: id === null ? undefined : this.content.events.find((item) => item.id === id)?.slug,
      title: value.title,
      tagline: value.tagline,
      category: value.category,
      date: value.date,
      time: value.time,
      venue: value.venue,
      description: value.description,
      registrationLink: value.registrationLink,
      organizingTeam: value.organizingTeam,
      image: value.image || 'linear-gradient(135deg, #45f0d1, #2563eb)',
      speakers: this.csv(value.speakers),
      highlights: this.csv(value.highlights),
      page: id === null ? undefined : this.content.events.find((item) => item.id === id)?.page
    };
    if (id === null) {
      this.content.addEvent(event);
    } else {
      this.content.updateEvent(id, event);
    }
    this.editorOpen.set(false);
  }

  deleteEvent(id: number): void {
    if (this.officer.requireActiveSession()) {
      this.content.deleteEvent(id);
    }
  }

  async uploadBanner(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.form.controls.image.setValue((await this.github.uploadImage(file, 'events')).url);
    input.value = '';
  }

  private csv(value: string): string[] {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}
