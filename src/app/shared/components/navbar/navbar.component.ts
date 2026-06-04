import { Component, inject, output, signal } from '@angular/core';
import { IsActiveMatchOptions, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ThemeService } from '../../../core/services/theme.service';
import { OfficerSessionService } from '../../../core/services/officer-session.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, MatIconModule, MatFormFieldModule, MatInputModule],
  template: `
    <button class="mobile-toggle glass" type="button" (click)="toggleMobile()" aria-label="Toggle menu">
      <mat-icon>{{ mobileOpen() ? 'close' : 'menu' }}</mat-icon>
    </button>

    <aside class="nav glass" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
      <a routerLink="/" class="brand" aria-label="SSAI home">
        <span class="brand__mark">S</span>
        <span class="brand__text">SSAI</span>
      </a>

      <nav class="nav__links">
        @for (link of links; track link.path) {
          @if (!link.permission || canAccessLink(link.permission)) {
            <a
              [routerLink]="link.path"
              [class.active]="isActiveLink(link.path)"
              (click)="navigateTo($event, link.path)"
              [attr.aria-label]="link.label"
            >
              <mat-icon>{{ link.icon }}</mat-icon>
              <span>{{ link.label }}</span>
            </a>
          }
        }
      </nav>

      <div class="nav__actions">
        @if (officer.isOfficer(); as active) {
          <div class="officer-badge">
            <mat-icon>admin_panel_settings</mat-icon>
            <span>Officer Mode Active</span>
            <small>{{ officer.session()?.role }} | {{ officer.session()?.name }}</small>
            <strong>Session Remaining: {{ officer.countdown() }}</strong>
          </div>
          <button class="icon-btn" type="button" (click)="officer.logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        } @else {
          <button class="officer-btn" type="button" (click)="verificationOpen.set(true)">
            <mat-icon>verified_user</mat-icon>
            <span>Are You an Officer?</span>
          </button>
        }
        <button class="icon-btn" type="button" (click)="theme.toggle()" [attr.aria-label]="theme.isLight() ? 'Use dark mode' : 'Use light mode'">
          <mat-icon>{{ theme.isLight() ? 'dark_mode' : 'light_mode' }}</mat-icon>
          <span>{{ theme.isLight() ? 'Dark' : 'Light' }}</span>
        </button>
        <button class="icon-btn" type="button" (click)="toggleSidebarControl()" [attr.aria-label]="collapsed() ? 'Open sidebar' : 'Close sidebar'">
          <mat-icon>{{ collapsed() ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left' }}</mat-icon>
          <span>{{ collapsed() ? 'Open' : 'Close' }}</span>
        </button>
      </div>
    </aside>

    @if (mobileOpen()) {
      <button class="scrim" type="button" aria-label="Close menu" (click)="closeMobile()"></button>
    }

    @if (verificationOpen()) {
      <div class="dialog-backdrop" role="dialog" aria-modal="true">
        <form class="dialog glass" [formGroup]="verificationForm" (ngSubmit)="otpSent() ? verifyOfficer() : sendOtp()">
          <h2>Officer Authentication</h2>
          @if (!otpSent()) {
            <mat-form-field appearance="outline">
              <mat-label>Registered Officer Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email">
            </mat-form-field>
          } @else {
            <p>Enter the verification code sent to {{ verificationForm.controls.email.value }}.</p>
            <mat-form-field appearance="outline">
              <mat-label>Verification Code</mat-label>
              <input matInput inputmode="numeric" maxlength="6" formControlName="otp" autocomplete="one-time-code">
            </mat-form-field>
          }
          @if (verificationMessage()) {
            <p class="dialog-message" [class.error]="verificationError()">{{ verificationMessage() }}</p>
          }
          <div class="dialog-actions">
            <button class="ghost-btn" type="button" (click)="closeVerification()">Cancel</button>
            @if (otpSent()) {
              <button class="ghost-btn" type="button" (click)="sendOtp(true)">Resend OTP</button>
            }
            <button class="primary-btn" type="submit">{{ otpSent() ? 'Verify OTP' : 'Send OTP' }}</button>
          </div>
        </form>
      </div>
    }

    @if (officer.shouldWarn()) {
      <div class="dialog-backdrop" role="dialog" aria-modal="true">
        <form class="dialog glass" [formGroup]="verificationForm" (ngSubmit)="otpSent() ? verifyOfficer() : sendOtp()">
          <h2>Your officer session will expire in 2 minutes.</h2>
          <p>Verify your registered email again to continue Officer Mode.</p>
          <mat-form-field appearance="outline">
            <mat-label>Registered Officer Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email">
          </mat-form-field>
          @if (otpSent()) {
            <mat-form-field appearance="outline">
              <mat-label>Verification Code</mat-label>
              <input matInput inputmode="numeric" maxlength="6" formControlName="otp" autocomplete="one-time-code">
            </mat-form-field>
          }
          <div class="dialog-actions">
            <button class="ghost-btn" type="button" (click)="officer.logout()">Logout</button>
            <button class="primary-btn" type="submit">{{ otpSent() ? 'Verify OTP' : 'Send OTP' }}</button>
          </div>
        </form>
      </div>
    }
  `,
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private readonly fb = new FormBuilder();
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);
  readonly officer = inject(OfficerSessionService);
  readonly collapsedChange = output<boolean>();
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly verificationOpen = signal(false);
  readonly otpSent = signal(false);
  readonly verificationMessage = signal('');
  readonly verificationError = signal(false);
  readonly verificationForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    otp: ['']
  });
  private readonly exactActiveOptions: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored'
  };
  private readonly sectionActiveOptions: IsActiveMatchOptions = {
    paths: 'subset',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored'
  };
  readonly links = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/about', label: 'About', icon: 'info' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/past-events', label: 'Past Events', icon: 'history' },
    { path: '/projects', label: 'Projects', icon: 'hub' },
    { path: '/leadership', label: 'Leadership', icon: 'groups' },
    { path: '/gallery', label: 'Gallery', icon: 'photo_library' },
    { path: '/media-library', label: 'Media Library', icon: 'perm_media', permission: 'galleries' as const },
    { path: '/manage-officers', label: 'Manage Officers', icon: 'manage_accounts', permission: 'officers' as const },
    { path: '/settings', label: 'Settings', icon: 'settings', permission: 'settings' as const },
    { path: '/join', label: 'Join', icon: 'person_add' },
    { path: '/contact', label: 'Contact', icon: 'mail' }
  ];

  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
    this.collapsedChange.emit(this.collapsed());
  }

  toggleSidebarControl(): void {
    if (this.mobileOpen()) {
      this.closeMobile();
      return;
    }

    this.toggleCollapsed();
  }

  toggleMobile(): void {
    this.mobileOpen.update((value) => !value);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  navigateTo(event: MouseEvent, path: string): void {
    this.closeMobile();
    void this.router.navigateByUrl(path);
  }

  isActiveLink(path: string): boolean {
    return this.router.isActive(path, path === '/' ? this.exactActiveOptions : this.sectionActiveOptions);
  }

  canAccessLink(permission: 'leadership' | 'events' | 'projects' | 'galleries' | 'officers' | 'settings'): boolean {
    return permission === 'settings' ? this.officer.isOfficer() : this.officer.canManage(permission);
  }

  closeVerification(): void {
    this.verificationOpen.set(false);
    this.otpSent.set(false);
    this.verificationMessage.set('');
    this.verificationError.set(false);
    this.verificationForm.reset();
  }

  async sendOtp(resend = false): Promise<void> {
    if (this.verificationForm.invalid) {
      this.verificationForm.markAllAsTouched();
      return;
    }
    try {
      const result = await this.officer.sendOtp(this.verificationForm.controls.email.value, resend);
      this.verificationError.set(!result.ok);
      this.verificationMessage.set(result.message);
      this.otpSent.set(result.ok);
    } catch {
      this.verificationError.set(true);
      this.verificationMessage.set('Unable to send verification code. Please try again later.');
    }
  }

  async verifyOfficer(): Promise<void> {
    if (!this.verificationForm.controls.otp.value.trim()) {
      this.verificationForm.controls.otp.markAsTouched();
      return;
    }
    try {
      const result = await this.officer.verifyOtp(this.verificationForm.controls.email.value, this.verificationForm.controls.otp.value);
      this.verificationError.set(!result.ok);
      this.verificationMessage.set(result.ok ? `Welcome ${result.session.name}` : result.message);
      if (result.ok) {
        setTimeout(() => this.closeVerification(), 700);
      }
    } catch {
      this.verificationError.set(true);
      this.verificationMessage.set('Unable to verify code. Please try again later.');
    }
  }
}
