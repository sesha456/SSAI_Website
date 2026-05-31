import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EmailService } from '../../../core/services/email.service';

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
      <button class="primary-btn" type="submit" [disabled]="sending()">
        {{ sending() ? 'Sending...' : 'Send Message' }}
      </button>
      @if (sent()) { <p class="success">Message sent successfully.</p> }
      @if (error()) { <p class="error">{{ error() }}</p> }
    </form>
  `,
  styles: [`
    .form { display: grid; gap: .8rem; padding: clamp(1rem, 3vw, 1.5rem); border-radius: 1rem; }
    .success, .error { margin: 0; font-weight: 800; }
    .success { color: var(--primary); }
    .error { color: #ff7a90; }
    button[disabled] { opacity: .7; cursor: wait; }
  `]
})
export class ContactFormComponent {
  private readonly fb = new FormBuilder();
  private readonly email = inject(EmailService);
  readonly sent = signal(false);
  readonly sending = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(12)]]
  });

  async submit(): Promise<void> {
    this.sent.set(false);
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    try {
      await this.email.sendContactMessage(this.form.getRawValue());
      this.sent.set(true);
      this.form.reset();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to send message. Please try again later.');
    } finally {
      this.sending.set(false);
    }
  }
}
