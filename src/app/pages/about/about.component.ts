import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ContentService } from '../../core/services/content.service';
import { OfficerSessionService } from '../../core/services/officer-session.service';
import { SiteContent } from '../../shared/models/content.models';

type EditorMode = 'hero' | 'card' | 'focus' | 'timelineHeader' | 'timelineItem';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <section class="section page">
      <div class="section__inner reveal editable-wrap">
        <span class="eyebrow">{{ site().aboutHero.eyebrow }}</span>
        <h1 class="section-title">{{ site().aboutHero.title }}</h1>
        <p class="section-copy">{{ site().aboutHero.copy }}</p>
        @if (officer.isOfficer()) {
          <button class="edit-chip" type="button" (click)="openTextEditor('hero')"><mat-icon>edit</mat-icon>Edit</button>
        }
      </div>
    </section>

    <section class="section">
      <div class="section__inner card-grid">
        @for (block of site().aboutCards; track block.title; let i = $index) {
          <article class="glass about-card reveal editable-wrap">
            <h2>{{ block.title }}</h2>
            <p>{{ block.copy }}</p>
            @if (officer.isOfficer()) {
              <button class="edit-chip mini" type="button" (click)="openCardEditor(i)"><mat-icon>edit</mat-icon>Edit</button>
            }
          </article>
        }
      </div>
    </section>

    <section class="section band">
      <div class="section__inner editable-wrap">
        <span class="eyebrow">{{ site().aboutFocus.eyebrow }}</span>
        <h2 class="section-title">{{ site().aboutFocus.title }}</h2>
        <div class="focus">
          @for (area of site().aboutFocus.areas; track area) { <span class="pill">{{ area }}</span> }
        </div>
        @if (officer.isOfficer()) {
          <button class="edit-chip" type="button" (click)="openFocusEditor()"><mat-icon>edit</mat-icon>Edit</button>
        }
      </div>
    </section>

    <section class="section">
      <div class="section__inner editable-wrap">
        <span class="eyebrow">{{ site().aboutTimeline.eyebrow }}</span>
        <h2 class="section-title">{{ site().aboutTimeline.title }}</h2>
        @if (officer.isOfficer()) {
          <button class="edit-chip" type="button" (click)="openTextEditor('timelineHeader')"><mat-icon>edit</mat-icon>Edit</button>
        }
        <div class="timeline">
          @for (item of site().aboutTimeline.items; track item.year; let i = $index) {
            <article class="glass reveal editable-wrap">
              <strong>{{ item.year }}</strong>
              <h3>{{ item.title }}</h3>
              <p>{{ item.copy }}</p>
              @if (officer.isOfficer()) {
                <button class="edit-chip mini" type="button" (click)="openTimelineEditor(i)"><mat-icon>edit</mat-icon>Edit</button>
              }
            </article>
          }
        </div>
      </div>
    </section>

    @if (editorOpen()) {
      <div class="modal">
        <form class="editor glass" [formGroup]="form" (ngSubmit)="save()">
          <h2>Edit Content</h2>
          @if (mode() !== 'card' && mode() !== 'timelineItem') {
            <mat-form-field appearance="outline"><mat-label>Eyebrow</mat-label><input matInput formControlName="eyebrow"></mat-form-field>
          }
          <mat-form-field appearance="outline"><mat-label>Heading</mat-label><input matInput formControlName="title"></mat-form-field>
          @if (mode() !== 'focus' && mode() !== 'timelineHeader') {
            <mat-form-field appearance="outline"><mat-label>Content</mat-label><textarea matInput rows="5" formControlName="copy"></textarea></mat-form-field>
          }
          @if (mode() === 'focus') {
            <mat-form-field appearance="outline"><mat-label>Focus Areas (comma separated)</mat-label><textarea matInput rows="4" formControlName="areas"></textarea></mat-form-field>
          }
          @if (mode() === 'timelineItem') {
            <mat-form-field appearance="outline"><mat-label>Year</mat-label><input matInput formControlName="year"></mat-form-field>
          }
          <div class="editor-actions">
            <button class="ghost-btn" type="button" (click)="editorOpen.set(false)">Cancel</button>
            <button class="primary-btn" type="submit">Save</button>
          </div>
        </form>
      </div>
    }
  `,
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  private readonly fb = new FormBuilder();
  readonly content = inject(ContentService);
  readonly officer = inject(OfficerSessionService);
  readonly editorOpen = signal(false);
  readonly mode = signal<EditorMode>('hero');
  readonly editingIndex = signal<number | null>(null);
  readonly form = this.fb.nonNullable.group({
    eyebrow: [''],
    title: ['', Validators.required],
    copy: [''],
    areas: [''],
    year: ['']
  });

  site(): SiteContent {
    this.content.version();
    return this.content.siteContent;
  }

  openTextEditor(mode: 'hero' | 'timelineHeader'): void {
    if (!this.officer.requireActiveSession()) return;
    this.mode.set(mode);
    const block = mode === 'hero' ? this.site().aboutHero : this.site().aboutTimeline;
    this.form.reset({ eyebrow: block.eyebrow, title: block.title, copy: '', areas: '', year: '' });
    this.editorOpen.set(true);
  }

  openCardEditor(index: number): void {
    if (!this.officer.requireActiveSession()) return;
    const block = this.site().aboutCards[index];
    this.mode.set('card');
    this.editingIndex.set(index);
    this.form.reset({ title: block.title, copy: block.copy, eyebrow: '', areas: '', year: '' });
    this.editorOpen.set(true);
  }

  openFocusEditor(): void {
    if (!this.officer.requireActiveSession()) return;
    const focus = this.site().aboutFocus;
    this.mode.set('focus');
    this.form.reset({ eyebrow: focus.eyebrow, title: focus.title, areas: focus.areas.join(', '), copy: '', year: '' });
    this.editorOpen.set(true);
  }

  openTimelineEditor(index: number): void {
    if (!this.officer.requireActiveSession()) return;
    const item = this.site().aboutTimeline.items[index];
    this.mode.set('timelineItem');
    this.editingIndex.set(index);
    this.form.reset({ year: item.year, title: item.title, copy: item.copy, eyebrow: '', areas: '' });
    this.editorOpen.set(true);
  }

  save(): void {
    if (!this.officer.requireActiveSession() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const next = structuredClone(this.site());
    if (this.mode() === 'hero') {
      next.aboutHero = { eyebrow: value.eyebrow, title: value.title, copy: value.copy };
    }
    if (this.mode() === 'card') {
      next.aboutCards[this.editingIndex()!] = { title: value.title, copy: value.copy };
    }
    if (this.mode() === 'focus') {
      next.aboutFocus = { eyebrow: value.eyebrow, title: value.title, areas: this.csv(value.areas) };
    }
    if (this.mode() === 'timelineHeader') {
      next.aboutTimeline = { ...next.aboutTimeline, eyebrow: value.eyebrow, title: value.title };
    }
    if (this.mode() === 'timelineItem') {
      next.aboutTimeline.items[this.editingIndex()!] = { year: value.year, title: value.title, copy: value.copy };
    }
    this.content.updateSiteContent(next);
    this.editorOpen.set(false);
  }

  private csv(value: string): string[] {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}
