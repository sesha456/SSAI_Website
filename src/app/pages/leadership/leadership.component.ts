import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ContentService } from '../../core/services/content.service';
import { OfficerSessionService } from '../../core/services/officer-session.service';
import { TeamMemberCardComponent } from '../../shared/components/team-member-card/team-member-card.component';
import { TeamMember } from '../../shared/models/content.models';

@Component({
  selector: 'app-leadership',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, TeamMemberCardComponent],
  template: `
    <section class="section page">
      <div class="section__inner reveal">
        <span class="eyebrow">{{ content.siteContent.leadershipHero.eyebrow }}</span>
        <h1 class="section-title">{{ content.siteContent.leadershipHero.title }}</h1>
        <p class="section-copy">{{ content.siteContent.leadershipHero.copy }}</p>
        @if (officer.isOfficer()) {
          <button class="edit-heading" type="button" (click)="openHeroEditor()"><mat-icon>edit</mat-icon>Edit</button>
        }
        @if (officer.isOfficer()) {
          <div class="admin-bar glass">
            <span>{{ content.saveMessage() || 'Officer editing enabled' }}</span>
            <button class="primary-btn" type="button" (click)="openAdd()">Add Member</button>
            <button class="ghost-btn" type="button" (click)="content.exportJson('leadership.json', content.team)">Export Updated JSON</button>
          </div>
        }
      </div>
    </section>

    <section class="section band">
      <div class="section__inner reveal">
        <span class="eyebrow">Faculty Mentors</span>
        <h2 class="section-title">Faculty supporting SSAI research, programs, and mentorship.</h2>
        <div class="card-grid top-gap">
          @for (entry of facultyMentors(); track entry.member.name) {
            <div class="managed-card">
              <app-team-member-card [member]="entry.member" />
              @if (officer.isOfficer()) {
                <div class="manage-actions">
                  <button type="button" (click)="openEdit(entry.member, entry.index)" aria-label="Edit faculty mentor"><mat-icon>edit</mat-icon></button>
                  <button type="button" (click)="deleteMember(entry.index)" aria-label="Delete faculty mentor"><mat-icon>delete</mat-icon></button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section__inner reveal">
        <span class="eyebrow">Current Officers</span>
        <h2 class="section-title">Active SSAI officers leading this year's work.</h2>
        <div class="card-grid top-gap">
          @for (entry of currentOfficers(); track entry.member.name) {
            <div class="managed-card">
              <app-team-member-card [member]="entry.member" />
              @if (officer.isOfficer()) {
                <div class="manage-actions">
                  <button type="button" (click)="openEdit(entry.member, entry.index)" aria-label="Edit officer"><mat-icon>edit</mat-icon></button>
                  <button type="button" (click)="deleteMember(entry.index)" aria-label="Delete officer"><mat-icon>delete</mat-icon></button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>

    <section class="section band">
      <div class="section__inner reveal">
        <span class="eyebrow">Past Officers</span>
        <h2 class="section-title">Former SSAI leadership archived for continuity.</h2>
        <div class="card-grid top-gap">
          @for (entry of pastOfficers(); track entry.member.name) {
            <div class="managed-card">
              <app-team-member-card [member]="entry.member" />
              @if (officer.isOfficer()) {
                <div class="manage-actions">
                  <button type="button" (click)="openEdit(entry.member, entry.index)" aria-label="Edit past officer"><mat-icon>edit</mat-icon></button>
                  <button type="button" (click)="deleteMember(entry.index)" aria-label="Delete past officer"><mat-icon>delete</mat-icon></button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>

    @if (editorOpen()) {
      <div class="modal">
        <form class="editor glass" [formGroup]="form" (ngSubmit)="saveMember()">
          <h2>{{ editingIndex() === null ? 'Add Member' : 'Edit Member' }}</h2>
          <mat-form-field appearance="outline"><mat-label>Section</mat-label><mat-select formControlName="section"><mat-option value="faculty">Faculty Mentors</mat-option><mat-option value="current">Current Officers</mat-option><mat-option value="past">Past Officers</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Designation / Position</mat-label><input matInput formControlName="role"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Department</mat-label><input matInput formControlName="department"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Years Served</mat-label><input matInput formControlName="yearsServed"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Short Biography</mat-label><textarea matInput rows="4" formControlName="bio"></textarea></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Profile Image URL or Initials</mat-label><input matInput formControlName="image"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>LinkedIn URL</mat-label><input matInput formControlName="linkedin"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>GitHub URL</mat-label><input matInput formControlName="github"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Website URL</mat-label><input matInput formControlName="website"></mat-form-field>
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
  styles: [`
    .page { padding-top: clamp(5rem, 10vw, 8rem); }
    .band { background: rgba(255,255,255,.035); }
    .top-gap { margin-top: 1.5rem; }
    .admin-bar { display: flex; gap: .7rem; align-items: center; flex-wrap: wrap; justify-content: space-between; margin-top: 1.5rem; padding: 1rem; border-radius: 1rem; }
    .admin-bar span { color: var(--primary); font-weight: 900; }
    .edit-heading { display: inline-flex; align-items: center; gap: .35rem; margin-top: 1rem; border: 1px solid var(--line); border-radius: 999px; background: var(--surface-strong); color: var(--primary); cursor: pointer; font-weight: 900; padding: .45rem .75rem; }
    .edit-heading mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
    .managed-card { position: relative; min-height: 100%; }
    .manage-actions { position: absolute; top: .8rem; right: .8rem; display: flex; gap: .4rem; }
    .manage-actions button { display: grid; width: 2.35rem; height: 2.35rem; place-items: center; border: 1px solid var(--line); border-radius: .7rem; background: var(--surface-strong); color: var(--text); cursor: pointer; }
    .modal { position: fixed; inset: 0; z-index: 55; display: grid; padding: 1rem; overflow-y: auto; background: rgba(0,0,0,.72); place-items: center; }
    .editor { display: grid; width: min(680px, 100%); gap: .8rem; padding: 1.2rem; border-radius: 1rem; }
    .editor h2 { margin: 0; }
    .editor-actions { display: flex; gap: .7rem; justify-content: flex-end; }
    @media (max-width: 640px) { .admin-bar button, .editor-actions button { width: 100%; } .editor-actions { flex-direction: column-reverse; } }
  `]
})
export class LeadershipComponent {
  private readonly fb = new FormBuilder();
  readonly content = inject(ContentService);
  readonly officer = inject(OfficerSessionService);
  readonly entries = computed(() => {
    this.content.version();
    return this.content.team.map((member, index) => ({ member, index }));
  });
  readonly facultyMentors = computed(() => this.entries().filter((entry) => entry.member.type === 'faculty'));
  readonly currentOfficers = computed(() => this.entries().filter((entry) => entry.member.type !== 'faculty' && entry.member.isCurrent !== false));
  readonly pastOfficers = computed(() => this.entries().filter((entry) => entry.member.type !== 'faculty' && entry.member.isCurrent === false));
  readonly editorOpen = signal(false);
  readonly heroEditorOpen = signal(false);
  readonly editingIndex = signal<number | null>(null);
  readonly heroForm = this.fb.nonNullable.group({
    eyebrow: ['', Validators.required],
    title: ['', Validators.required],
    copy: ['', Validators.required]
  });
  readonly form = this.fb.nonNullable.group({
    section: ['current' as 'faculty' | 'current' | 'past', Validators.required],
    name: ['', Validators.required],
    role: ['', Validators.required],
    department: [''],
    yearsServed: ['2025 - Present'],
    bio: ['', Validators.required],
    image: [''],
    linkedin: [''],
    github: [''],
    website: ['']
  });

  openAdd(): void {
    if (!this.officer.requireActiveSession()) return;
    this.editingIndex.set(null);
    this.form.reset({ section: 'current', yearsServed: '2025 - Present' });
    this.editorOpen.set(true);
  }

  openHeroEditor(): void {
    if (!this.officer.requireActiveSession()) return;
    this.heroForm.setValue(this.content.siteContent.leadershipHero);
    this.heroEditorOpen.set(true);
  }

  saveHero(): void {
    if (!this.officer.requireActiveSession() || this.heroForm.invalid) {
      this.heroForm.markAllAsTouched();
      return;
    }
    this.content.updateHero('leadershipHero', this.heroForm.getRawValue());
    this.heroEditorOpen.set(false);
  }

  openEdit(member: TeamMember, index: number): void {
    if (!this.officer.requireActiveSession()) return;
    this.editingIndex.set(index);
    this.form.setValue({
      section: member.type === 'faculty' ? 'faculty' : member.isCurrent === false ? 'past' : 'current',
      name: member.name,
      role: member.role,
      department: member.department ?? '',
      yearsServed: member.yearsServed ?? '',
      bio: member.bio,
      image: member.image,
      linkedin: member.linkedin,
      github: member.github,
      website: member.website ?? ''
    });
    this.editorOpen.set(true);
  }

  saveMember(): void {
    if (!this.officer.requireActiveSession() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const image = value.image || value.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
    const member: TeamMember = {
      name: value.name,
      role: value.role,
      group: value.section === 'faculty' ? 'Faculty Mentors' : value.role,
      bio: value.bio,
      image,
      linkedin: value.linkedin,
      github: value.github,
      type: value.section === 'faculty' ? 'faculty' : 'officer',
      department: value.department,
      website: value.website,
      yearsServed: value.section === 'faculty' ? undefined : value.yearsServed,
      isCurrent: value.section === 'faculty' ? undefined : value.section === 'current'
    };
    const index = this.editingIndex();
    if (index === null) {
      this.content.addTeamMember(member);
    } else {
      this.content.updateTeamMember(index, member);
    }
    this.editorOpen.set(false);
  }

  deleteMember(index: number): void {
    if (this.officer.requireActiveSession()) {
      this.content.deleteTeamMember(index);
    }
  }
}
