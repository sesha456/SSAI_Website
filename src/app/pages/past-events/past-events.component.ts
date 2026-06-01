import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ContentService } from '../../core/services/content.service';
import { OfficerSessionService } from '../../core/services/officer-session.service';
import { EventCardComponent } from '../../shared/components/event-card/event-card.component';
import { PastEventCardComponent } from '../../shared/components/past-event-card/past-event-card.component';

@Component({
  selector: 'app-past-events',
  standalone: true,
  imports: [PastEventCardComponent, EventCardComponent, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <section class="section page">
      <div class="section__inner reveal">
        <span class="eyebrow">{{ content.siteContent.pastEventsHero.eyebrow }}</span>
        <h1 class="section-title">{{ content.siteContent.pastEventsHero.title }}</h1>
        <p class="section-copy">{{ content.siteContent.pastEventsHero.copy }}</p>
        @if (officer.isOfficer()) {
          <button class="edit-heading" type="button" (click)="openHeroEditor()"><mat-icon>edit</mat-icon>Edit</button>
        }
        <div class="event-list">
          @for (event of dynamicPastEvents(); track event.id) {
            <app-event-card [event]="event" />
          }
          @for (event of content.pastEvents; track event.slug) {
            <app-past-event-card [event]="event" />
          }
        </div>
      </div>
    </section>

    @if (heroEditorOpen) {
      <div class="modal">
        <form class="editor glass" [formGroup]="heroForm" (ngSubmit)="saveHero()">
          <h2>Edit Page Heading</h2>
          <mat-form-field appearance="outline"><mat-label>Eyebrow</mat-label><input matInput formControlName="eyebrow"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Heading</mat-label><input matInput formControlName="title"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Content</mat-label><textarea matInput rows="5" formControlName="copy"></textarea></mat-form-field>
          <div class="editor-actions">
            <button class="ghost-btn" type="button" (click)="heroEditorOpen = false">Cancel</button>
            <button class="primary-btn" type="submit">Save</button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .page { padding-top: clamp(5rem, 10vw, 8rem); }
    .event-list { display: grid; gap: 1.2rem; margin-top: 1.7rem; }
    .edit-heading { display: inline-flex; align-items: center; gap: .35rem; margin-top: 1rem; border: 1px solid var(--line); border-radius: 999px; background: var(--surface-strong); color: var(--primary); cursor: pointer; font-weight: 900; padding: .45rem .75rem; }
    .edit-heading mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
    .modal { position: fixed; inset: 0; z-index: 70; display: grid; overflow-y: auto; padding: 1rem; background: rgba(0,0,0,.72); place-items: center; }
    .editor { display: grid; width: min(640px, 100%); gap: .8rem; padding: 1.2rem; border-radius: 1rem; }
    .editor h2 { margin: 0; }
    .editor-actions { display: flex; justify-content: flex-end; gap: .7rem; }
  `]
})
export class PastEventsComponent {
  private readonly fb = new FormBuilder();
  readonly content = inject(ContentService);
  readonly officer = inject(OfficerSessionService);
  readonly dynamicPastEvents = computed(() => {
    this.content.version();
    return this.content.events.filter((event) => (event.status ?? 'Upcoming') === 'Past');
  });
  heroEditorOpen = false;
  readonly heroForm = this.fb.nonNullable.group({
    eyebrow: ['', Validators.required],
    title: ['', Validators.required],
    copy: ['', Validators.required]
  });

  openHeroEditor(): void {
    if (!this.officer.requireActiveSession()) return;
    this.heroForm.setValue(this.content.siteContent.pastEventsHero);
    this.heroEditorOpen = true;
  }

  saveHero(): void {
    if (!this.officer.requireActiveSession() || this.heroForm.invalid) {
      this.heroForm.markAllAsTouched();
      return;
    }
    this.content.updateHero('pastEventsHero', this.heroForm.getRawValue());
    this.heroEditorOpen = false;
  }
}
