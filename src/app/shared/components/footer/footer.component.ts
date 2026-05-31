import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <footer class="footer">
      <div class="footer__inner">
        <div>
          <h2>Society for Students AI Innovations</h2>
          <p>Empowering the next generation of AI innovators through research, projects, mentorship, and community.</p>
        </div>
        <div class="footer__links">
          <a routerLink="/events">Events</a>
          <a routerLink="/projects">Projects</a>
          <a routerLink="/join">Join SSAI</a>
          <a routerLink="/contact">Contact</a>
        </div>
        <div class="footer__social">
          <a href="https://www.linkedin.com/company/society-for-student-ai-innovation/?viewAsMember=true" aria-label="LinkedIn"><mat-icon>work</mat-icon></a>
          <a href="https://github.com/" aria-label="GitHub"><mat-icon>code</mat-icon></a>
          <a href="mailto:contact@ssai.org" aria-label="Email"><mat-icon>mail</mat-icon></a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer { padding: 3rem 1rem 2rem; border-top: 1px solid var(--line); }
    .footer__inner { width: min(1180px, 100%); margin: 0 auto; display: grid; grid-template-columns: 1.4fr 1fr auto; gap: 1.5rem; align-items: start; }
    h2 { margin: 0 0 .7rem; font-family: Montserrat, Inter, sans-serif; }
    p { margin: 0; max-width: 620px; color: var(--muted); line-height: 1.7; }
    .footer__links, .footer__social { display: flex; gap: .7rem; flex-wrap: wrap; }
    .footer__links a, .footer__social a { color: var(--muted); font-weight: 700; }
    .footer__social a { display: grid; width: 2.5rem; height: 2.5rem; place-items: center; border: 1px solid var(--line); border-radius: .8rem; }
    @media (max-width: 760px) { .footer__inner { grid-template-columns: 1fr; } .footer__links a { width: calc(50% - .35rem); } }
    @media (max-width: 420px) { .footer__links a { width: 100%; } }
  `]
})
export class FooterComponent {}
