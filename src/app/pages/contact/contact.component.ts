import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ContentService } from '../../core/services/content.service';
import { ContactFormComponent } from '../../shared/components/contact-form/contact-form.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ContactFormComponent, MatIconModule],
  template: `
    <section class="section page">
      <div class="section__inner layout reveal">
        <div>
          <span class="eyebrow">Contact</span>
          <h1 class="section-title">Connect with SSAI for membership, research, events, or partnerships.</h1>
          <p class="section-copy">Reach out to the organization team and we will route your message to the right student officer or faculty mentor.</p>
          <div class="contact-cards">
            <a class="glass" href="mailto:{{ email }}"><mat-icon>mail</mat-icon>{{ email }}</a>
            <a class="glass" href="https://www.linkedin.com/company/society-for-student-ai-innovation/?viewAsMember=true"><mat-icon>work</mat-icon>LinkedIn</a>
            <a class="glass" href="https://github.com/"><mat-icon>code</mat-icon>GitHub</a>
          </div>
        </div>
        <app-contact-form />
      </div>
    </section>

    <section class="section band">
      <div class="section__inner grid-two">
        <iframe class="map glass" [src]="mapUrl" title="Campus map" loading="lazy"></iframe>
        <div>
          <span class="eyebrow">FAQ</span>
          @for (faq of content.faqs; track faq.question) {
            <details class="glass">
              <summary>{{ faq.question }}</summary>
              <p>{{ faq.answer }}</p>
            </details>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  readonly content = inject(ContentService);
  readonly email = environment.organizationEmail;
  readonly mapUrl = environment.googleMapEmbedUrl;
}
