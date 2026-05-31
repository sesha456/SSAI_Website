import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-join-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <form class="form glass" [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field appearance="outline">
        <mat-label>Full Name</mat-label>
        <input matInput formControlName="fullName" required>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email" required>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>University ID</mat-label>
        <input matInput formControlName="universityId" required>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Department</mat-label>
        <input matInput formControlName="department" required>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Area of Interest</mat-label>
        <mat-select formControlName="interest" required>
          @for (area of interests; track area) { <mat-option [value]="area">{{ area }}</mat-option> }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Skills</mat-label>
        <textarea matInput rows="4" formControlName="skills" placeholder="Python, research, design, robotics..."></textarea>
      </mat-form-field>
      <label class="upload">
        <span>Resume Upload</span>
        <input type="file" accept=".pdf,.doc,.docx" (change)="onFile($event)">
        <small>{{ resumeName() || 'PDF, DOC, or DOCX' }}</small>
      </label>
      <button class="primary-btn" type="submit">Submit Application</button>
      @if (submitted()) { <p class="success">Application captured locally. SSAI will connect this form to a backend when admissions open.</p> }
    </form>
  `,
  styleUrl: './join-form.component.scss'
})
export class JoinFormComponent {
  private readonly fb = new FormBuilder();
  readonly submitted = signal(false);
  readonly resumeName = signal('');
  readonly interests = ['Artificial Intelligence', 'Machine Learning', 'Healthcare AI', 'Robotics', 'NLP', 'Computer Vision', 'Generative AI', 'AI Research'];

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    universityId: ['', Validators.required],
    department: ['', Validators.required],
    interest: ['', Validators.required],
    skills: ['', [Validators.required, Validators.minLength(8)]],
    resume: ['']
  });

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.resumeName.set(file?.name ?? '');
    this.form.controls.resume.setValue(file?.name ?? '');
  }

  submit(): void {
    this.submitted.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.set(true);
    this.form.reset();
    this.resumeName.set('');
  }
}
