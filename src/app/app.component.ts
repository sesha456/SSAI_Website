import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { OfficerSessionService } from './core/services/officer-session.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div class="app-shell" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-navbar (collapsedChange)="sidebarCollapsed.set($event)" />
      <div class="app-main">
        <main>
          @if (theme.activeCelebration(); as celebration) {
            <section class="celebration-banner glass">
              <div>
                <strong>{{ celebration.name }}</strong>
                <span>{{ celebration.message }}</span>
              </div>
              <button type="button" (click)="theme.dismissCelebration()" aria-label="Dismiss announcement">×</button>
            </section>
          }
          <router-outlet />
        </main>
        <app-footer />
      </div>
      @if (officerSession.message()) {
        <div class="toast">
          {{ officerSession.message() }}
          <button type="button" (click)="officerSession.message.set('')" aria-label="Dismiss notification">×</button>
        </div>
      }
      @if (showBackTop()) {
        <button class="back-top glass" type="button" (click)="scrollTop()" aria-label="Back to top">↑</button>
      }
    </div>
  `,
  styles: [`
    .app-shell {
      --sidebar-width: 20rem;
    }

    .app-shell.sidebar-collapsed {
      --sidebar-width: 6.8rem;
    }

    .app-main {
      min-height: 100vh;
      padding-left: var(--sidebar-width);
      padding-top: .1rem;
      transition: padding-left 220ms ease;
    }

    .toast {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 80;
      display: flex;
      max-width: min(420px, calc(100vw - 2rem));
      gap: .8rem;
      align-items: center;
      padding: .9rem 1rem;
      border: 1px solid var(--line);
      border-radius: .9rem;
      background: var(--surface-strong);
      color: var(--text);
      box-shadow: var(--shadow);
      backdrop-filter: blur(18px);
      font-weight: 800;
    }

    .toast button {
      border: 0;
      background: transparent;
      color: var(--primary);
      cursor: pointer;
      font-size: 1.2rem;
      line-height: 1;
    }

    .celebration-banner {
      position: sticky;
      top: 1rem;
      z-index: 15;
      display: flex;
      width: min(1120px, calc(100% - 2rem));
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
      margin: 1rem auto -1rem;
      padding: .9rem 1rem;
      border-radius: 1rem;
    }

    .celebration-banner div {
      display: grid;
      gap: .2rem;
    }

    .celebration-banner strong {
      color: var(--primary);
    }

    .celebration-banner span {
      color: var(--muted);
      line-height: 1.5;
    }

    .celebration-banner button {
      border: 0;
      background: transparent;
      color: var(--primary);
      cursor: pointer;
      font-size: 1.4rem;
      font-weight: 900;
    }

    .back-top {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 79;
      display: grid;
      width: 3rem;
      height: 3rem;
      place-items: center;
      border-radius: 999px;
      color: var(--primary);
      cursor: pointer;
      font-size: 1.4rem;
      font-weight: 900;
    }

    @media (max-width: 920px) {
      .app-main {
        padding-left: 0;
      }
    }
  `]
})
export class AppComponent {
  readonly officerSession = inject(OfficerSessionService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  readonly sidebarCollapsed = signal(false);
  readonly showBackTop = signal(false);

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.officerSession.requireActiveSession();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.showBackTop.set(window.scrollY > 520);
  }

  scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
