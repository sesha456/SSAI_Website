import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface OfficerVerificationMessage {
  email: string;
  code: string;
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  private readonly config = environment.emailjs;

  get configured(): boolean {
    return ![
      this.config.serviceId,
      this.config.templateId,
      this.config.publicKey
    ].some((value) => value.startsWith('YOUR_EMAILJS_'));
  }

  async sendContactMessage(message: ContactMessage): Promise<void> {
    if (!this.configured) {
      throw new Error('Email service is not configured yet.');
    }

    await emailjs.send(
      this.config.serviceId,
      this.config.templateId,
      {
        from_name: message.name,
        from_email: message.email,
        subject: message.subject,
        message: message.message,
        to_email: this.config.toEmail
      },
      {
        publicKey: this.config.publicKey
      }
    );
  }

  async sendOfficerVerificationCode(message: OfficerVerificationMessage): Promise<void> {
    if (!this.officerConfigured) {
      throw new Error('Officer email service is not configured yet.');
    }

    await emailjs.send(
      this.config.serviceId,
      this.officerTemplateId,
      {
        to_email: message.email,
        officer_email: message.email,
        verification_code: message.code,
        subject: 'SSAI Officer Verification Code',
        message: [
          'Hello Officer,',
          '',
          `Your verification code is: ${message.code}`,
          '',
          'This code expires in 5 minutes.',
          '',
          'If you did not request access, please ignore this email.',
          '',
          'Society for Student AI Innovation (SSAI)'
        ].join('\n')
      },
      {
        publicKey: this.config.publicKey
      }
    );
  }

  private get officerConfigured(): boolean {
    return ![
      this.config.serviceId,
      this.officerTemplateId,
      this.config.publicKey
    ].some((value) => value.startsWith('YOUR_EMAILJS_'));
  }

  private get officerTemplateId(): string {
    return this.config.officerTemplateId.startsWith('YOUR_EMAILJS_')
      ? this.config.templateId
      : this.config.officerTemplateId;
  }
}
