import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <form class="form glass" [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field appearance="outline">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" required>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email" required>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Subject</mat-label>
        <input matInput formControlName="subject" required>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Message</mat-label>
        <textarea matInput rows="6" formControlName="message" required></textarea>
      </mat-form-field>
      <button class="primary-btn" type="submit">Send Message</button>
      @if (sent()) { <p class="success">Message validated locally. Connect an email service or API endpoint to send it live.</p> }
    </form>
  `,
  styles: [`
    .form { display: grid; gap: .8rem; padding: clamp(1rem, 3vw, 1.5rem); border-radius: 1rem; }
    .success { margin: 0; color: var(--primary); font-weight: 800; }
  `]
})
export class ContactFormComponent {
  private readonly fb = new FormBuilder();
  readonly sent = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(12)]]
  });

  submit(): void {
    this.sent.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sent.set(true);
    this.form.reset();
  }
}
