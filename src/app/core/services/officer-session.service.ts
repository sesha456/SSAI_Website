import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EmailService } from './email.service';

export type OfficerRole = 'Super Admin' | 'President' | 'Vice President' | 'Event Coordinator' | 'Technical Lead' | 'Research Lead' | 'Marketing Lead' | 'Secretary' | 'Treasurer';

export interface OfficerSession {
  isOfficer: true;
  name: string;
  role: OfficerRole;
  email: string;
  loginTime: string;
  expiresAt: string;
}

export interface OfficerRegistryEntry {
  name: string;
  email: string;
  role: OfficerRole;
  active: boolean;
}

interface PendingOtp {
  email: string;
  otpHash: string;
  expiresAt: number;
  used: boolean;
  resendAttempts: number;
}

@Injectable({ providedIn: 'root' })
export class OfficerSessionService {
  private readonly router = inject(Router);
  private readonly email = inject(EmailService);
  private readonly storageKey = 'officerSession';
  private readonly otpKey = 'officerPendingOtp';
  private readonly registryKey = 'ssai-officer-registry';
  private readonly warningShown = signal(false);
  private readonly defaultRegistry: OfficerRegistryEntry[] = [
    {
      name: 'Sesha Siva Sankar',
      email: 'SeshaSivaSankar@my.unt.edu',
      role: 'Super Admin',
      active: true
    }
  ];

  readonly session = signal<OfficerSession | null>(null);
  readonly officers = signal<OfficerRegistryEntry[]>(this.readRegistry());
  readonly now = signal(Date.now());
  readonly message = signal('');
  readonly isOfficer = computed(() => !!this.session() && this.now() < new Date(this.session()!.expiresAt).getTime());
  readonly countdown = computed(() => {
    const session = this.session();
    if (!session) return '00:00';
    const remaining = Math.max(0, new Date(session.expiresAt).getTime() - this.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });
  readonly shouldWarn = computed(() => {
    const session = this.session();
    if (!session || this.warningShown()) return false;
    const remaining = new Date(session.expiresAt).getTime() - this.now();
    return remaining > 0 && remaining <= 120000;
  });

  constructor() {
    this.restoreSession();
    setInterval(() => this.tick(), 1000);
    setInterval(() => this.validateSession(true), 30000);
  }

  async sendOtp(email: string, resend = false): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
    const officer = this.findOfficer(email);
    if (!officer) {
      return { ok: false, message: 'This email is not registered as an active SSAI officer.' };
    }

    const existing = this.readPendingOtp();
    const resendAttempts = resend && existing?.email === officer.email.toLowerCase() ? existing.resendAttempts + 1 : 0;
    if (resendAttempts > 3) {
      return { ok: false, message: 'Maximum resend attempts reached. Please try again later.' };
    }

    const otp = this.generateOtp();
    const pending: PendingOtp = {
      email: officer.email.toLowerCase(),
      otpHash: await this.hashOtp(otp),
      expiresAt: Date.now() + 5 * 60 * 1000,
      used: false,
      resendAttempts
    };
    sessionStorage.setItem(this.otpKey, JSON.stringify(pending));

    try {
      await this.email.sendOfficerVerificationCode({ email: officer.email, code: otp });
    } catch (error) {
      sessionStorage.removeItem(this.otpKey);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Unable to send verification code. Please try again later.'
      };
    }

    return { ok: true, message: 'Verification code sent to the registered officer email.' };
  }

  async verifyOtp(email: string, otp: string): Promise<{ ok: true; session: OfficerSession } | { ok: false; message: string }> {
    const officer = this.findOfficer(email);
    const pending = this.readPendingOtp();
    if (!officer || !pending || pending.email !== officer.email.toLowerCase()) {
      return { ok: false, message: 'Please request a new verification code.' };
    }
    if (pending.used || Date.now() > pending.expiresAt) {
      sessionStorage.removeItem(this.otpKey);
      return { ok: false, message: 'Verification code has expired. Please request a new code.' };
    }
    if (pending.otpHash !== await this.hashOtp(otp.trim())) {
      return { ok: false, message: 'Invalid verification code.' };
    }

    pending.used = true;
    sessionStorage.setItem(this.otpKey, JSON.stringify(pending));
    const loginTime = new Date();
    const session: OfficerSession = {
      isOfficer: true,
      name: officer.name,
      role: officer.role,
      email: officer.email,
      loginTime: loginTime.toISOString(),
      expiresAt: new Date(loginTime.getTime() + 10 * 60 * 1000).toISOString()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    sessionStorage.removeItem(this.otpKey);
    this.session.set(session);
    this.warningShown.set(false);
    this.message.set(`Welcome ${session.name}`);
    return { ok: true, session };
  }

  canManage(area: 'leadership' | 'events' | 'projects' | 'galleries' | 'officers'): boolean {
    if (!this.requireActiveSession()) return false;
    const role = this.session()?.role;
    if (role === 'Super Admin') return true;
    if (area === 'events') return role === 'Event Coordinator' || role === 'Research Lead' || role === 'President' || role === 'Vice President';
    if (area === 'galleries') return role === 'Marketing Lead' || role === 'Event Coordinator' || role === 'President' || role === 'Vice President';
    if (area === 'projects') return role === 'Technical Lead' || role === 'Research Lead' || role === 'President' || role === 'Vice President';
    if (area === 'leadership') return role === 'President' || role === 'Vice President';
    return false;
  }

  logout(message = 'You have been logged out successfully.'): void {
    localStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.otpKey);
    this.session.set(null);
    this.warningShown.set(false);
    this.message.set(message);
    void this.router.navigateByUrl('/');
  }

  requireActiveSession(): boolean {
    return this.validateSession(false);
  }

  dismissWarning(): void {
    this.warningShown.set(true);
  }

  addOfficer(officer: OfficerRegistryEntry): void {
    if (!this.canManage('officers')) return;
    this.officers.set([...this.officers(), { ...officer, email: officer.email.trim() }]);
    this.saveRegistry();
  }

  updateOfficer(index: number, officer: OfficerRegistryEntry): void {
    if (!this.canManage('officers')) return;
    this.officers.set(this.officers().map((item, itemIndex) => itemIndex === index ? { ...officer, email: officer.email.trim() } : item));
    this.saveRegistry();
  }

  deactivateOfficer(index: number): void {
    if (!this.canManage('officers')) return;
    this.officers.set(this.officers().map((item, itemIndex) => itemIndex === index ? { ...item, active: false } : item));
    this.saveRegistry();
  }

  deleteOfficer(index: number): void {
    if (this.session()?.role !== 'Super Admin') return;
    this.officers.set(this.officers().filter((_, itemIndex) => itemIndex !== index));
    this.saveRegistry();
  }

  private findOfficer(email: string): OfficerRegistryEntry | null {
    const normalizedEmail = email.trim().toLowerCase();
    return this.officers().find((officer) => officer.active && officer.email.toLowerCase() === normalizedEmail) ?? null;
  }

  private readRegistry(): OfficerRegistryEntry[] {
    try {
      const stored = JSON.parse(localStorage.getItem(this.registryKey) || 'null') as OfficerRegistryEntry[] | null;
      return stored?.length ? stored : this.defaultRegistry;
    } catch {
      return this.defaultRegistry;
    }
  }

  private saveRegistry(): void {
    localStorage.setItem(this.registryKey, JSON.stringify(this.officers()));
  }

  private restoreSession(): void {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return;
    try {
      this.session.set(JSON.parse(stored) as OfficerSession);
      this.validateSession(false);
    } catch {
      localStorage.removeItem(this.storageKey);
    }
  }

  private tick(): void {
    this.now.set(Date.now());
    this.validateSession(true);
  }

  private validateSession(showExpiredMessage: boolean): boolean {
    const session = this.session();
    if (!session) return false;
    if (Date.now() < new Date(session.expiresAt).getTime()) return true;
    localStorage.removeItem(this.storageKey);
    this.session.set(null);
    this.warningShown.set(false);
    if (showExpiredMessage) {
      this.message.set('Officer session has expired. Please verify your email again.');
    }
    void this.router.navigateByUrl('/');
    return false;
  }

  private readPendingOtp(): PendingOtp | null {
    const stored = sessionStorage.getItem(this.otpKey);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as PendingOtp;
    } catch {
      sessionStorage.removeItem(this.otpKey);
      return null;
    }
  }

  private generateOtp(): string {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return String(values[0] % 1000000).padStart(6, '0');
  }

  private async hashOtp(otp: string): Promise<string> {
    const data = new TextEncoder().encode(otp);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map((value) => value.toString(16).padStart(2, '0')).join('');
  }

}
