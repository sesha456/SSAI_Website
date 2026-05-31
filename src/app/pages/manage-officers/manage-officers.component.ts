import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { OfficerRegistryEntry, OfficerRole, OfficerSessionService } from '../../core/services/officer-session.service';

@Component({
  selector: 'app-manage-officers',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    <section class="section page">
      <div class="section__inner reveal">
        <span class="eyebrow">Officer Management</span>
        <h1 class="section-title">Manage SSAI officer access without code changes.</h1>
        <p class="section-copy">Add officers, change roles, deactivate access, or permanently remove records as Super Admin.</p>
        @if (officer.canManage('officers')) {
          <div class="admin-bar glass">
            <span>{{ officer.officers().length }} officers registered</span>
            <button class="primary-btn" type="button" (click)="openAdd()">Add Officer</button>
          </div>
          <div class="officer-grid top-gap">
            @for (entry of officer.officers(); track entry.email; let i = $index) {
              <article class="glass officer-card">
                <span class="pill" [class.inactive]="!entry.active">{{ entry.active ? 'Active' : 'Inactive' }}</span>
                <h2>{{ entry.name }}</h2>
                <strong>{{ entry.role }}</strong>
                <p>{{ entry.email }}</p>
                <div class="actions">
                  <button class="ghost-btn" type="button" (click)="openEdit(entry, i)"><mat-icon>edit</mat-icon>Edit</button>
                  <button class="ghost-btn" type="button" (click)="officer.deactivateOfficer(i)"><mat-icon>block</mat-icon>Deactivate</button>
                  @if (officer.session()?.role === 'Super Admin') {
                    <button class="ghost-btn danger" type="button" (click)="deleteOfficer(i)"><mat-icon>delete</mat-icon>Delete</button>
                  }
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="glass locked">Super Admin access is required.</div>
        }
      </div>
    </section>

    @if (editorOpen()) {
      <div class="modal">
        <form class="editor glass" [formGroup]="form" (ngSubmit)="saveOfficer()">
          <h2>{{ editingIndex() === null ? 'Add Officer' : 'Edit Officer' }}</h2>
          <mat-form-field appearance="outline"><mat-label>Full Name</mat-label><input matInput formControlName="name"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>UNT Email Address</mat-label><input matInput type="email" formControlName="email"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Role</mat-label><mat-select formControlName="role">@for (role of roles; track role) { <mat-option [value]="role">{{ role }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select formControlName="active"><mat-option [value]="true">Active</mat-option><mat-option [value]="false">Inactive</mat-option></mat-select></mat-form-field>
          <div class="editor-actions">
            <button class="ghost-btn" type="button" (click)="editorOpen.set(false)">Cancel</button>
            <button class="primary-btn" type="submit">Save</button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .page { padding-top: clamp(5rem, 10vw, 8rem); }
    .top-gap { margin-top: 1.5rem; }
    .admin-bar { display: flex; gap: .8rem; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-top: 1.5rem; padding: 1rem; border-radius: 1rem; }
    .admin-bar span { color: var(--primary); font-weight: 900; }
    .officer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
    .officer-card, .locked { padding: 1rem; border-radius: 1rem; }
    .officer-card h2 { margin: .8rem 0 .25rem; }
    .officer-card p { color: var(--muted); overflow-wrap: anywhere; }
    .pill.inactive { color: #ff9aae; }
    .actions, .editor-actions { display: flex; flex-wrap: wrap; gap: .6rem; }
    .danger { border-color: rgba(255,122,144,.5); color: #ff9aae; }
    .modal { position: fixed; inset: 0; z-index: 70; display: grid; padding: 1rem; overflow-y: auto; background: rgba(0,0,0,.75); place-items: center; }
    .editor { display: grid; width: min(620px, 100%); gap: .8rem; padding: 1rem; border-radius: 1rem; }
    .editor h2 { margin: 0; }
    .editor-actions { justify-content: flex-end; }
  `]
})
export class ManageOfficersComponent {
  private readonly fb = new FormBuilder();
  readonly officer = inject(OfficerSessionService);
  readonly editorOpen = signal(false);
  readonly editingIndex = signal<number | null>(null);
  readonly roles: OfficerRole[] = ['Super Admin', 'President', 'Vice President', 'Event Coordinator', 'Technical Lead', 'Research Lead', 'Marketing Lead', 'Secretary', 'Treasurer'];
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['Event Coordinator' as OfficerRole, Validators.required],
    active: [true]
  });

  openAdd(): void {
    this.editingIndex.set(null);
    this.form.reset({ role: 'Event Coordinator', active: true });
    this.editorOpen.set(true);
  }

  openEdit(entry: OfficerRegistryEntry, index: number): void {
    this.editingIndex.set(index);
    this.form.setValue(entry);
    this.editorOpen.set(true);
  }

  saveOfficer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const entry = this.form.getRawValue();
    this.editingIndex() === null ? this.officer.addOfficer(entry) : this.officer.updateOfficer(this.editingIndex()!, entry);
    this.editorOpen.set(false);
  }

  deleteOfficer(index: number): void {
    if (confirm('Permanently delete this officer?')) {
      this.officer.deleteOfficer(index);
    }
  }
}
