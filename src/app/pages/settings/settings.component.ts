import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { OfficerSessionService } from '../../core/services/officer-session.service';
import { GitHubCmsService } from '../../core/services/github-cms.service';
import { SiteSettings, ThemeId, ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="section page">
      <div class="section__inner reveal">
        <span class="eyebrow">Website Settings</span>
        <h1 class="section-title">Configure themes, celebrations, announcements, and carousel behavior.</h1>
        @if (officer.session()?.role === 'Super Admin') {
          <form class="settings glass" [formGroup]="form" (ngSubmit)="save()">
            <mat-form-field appearance="outline"><mat-label>Theme Rotation</mat-label><mat-select formControlName="themeRotation"><mat-option value="random-per-session">Random Per Session</mat-option><mat-option value="fixed">Fixed Theme</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Fixed Theme</mat-label><mat-select formControlName="fixedTheme">@for (theme of themes; track theme) { <mat-option [value]="theme">{{ theme }}</mat-option> }</mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Active Theme Pool (comma separated)</mat-label><input matInput formControlName="activeThemePool"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Carousel Speed (ms)</mat-label><input matInput type="number" formControlName="carouselSpeed"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Homepage / Event Announcements JSON</mat-label><textarea matInput rows="8" formControlName="announcements"></textarea></mat-form-field>
            <h2>GitHub CMS Storage</h2>
            <p class="hint">Required for permanent image and JSON persistence across browsers and deployments.</p>
            <mat-form-field appearance="outline"><mat-label>GitHub Owner</mat-label><input matInput formControlName="githubOwner"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Repository Name</mat-label><input matInput formControlName="githubRepo"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Branch</mat-label><input matInput formControlName="githubBranch"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Fine-grained GitHub Token</mat-label><input matInput type="password" formControlName="githubToken"></mat-form-field>
            <button class="primary-btn" type="submit">Save Settings</button>
            @if (github.status()) {
              <strong>{{ github.status() }}</strong>
            }
          </form>
        } @else {
          <div class="locked glass">Super Admin access is required.</div>
        }
      </div>
    </section>
  `,
  styles: [`
    .page { padding-top: clamp(5rem, 10vw, 8rem); }
    .settings, .locked { display: grid; gap: .9rem; margin-top: 1.5rem; padding: 1rem; border-radius: 1rem; }
    .primary-btn { width: fit-content; }
    .hint { margin: 0; color: var(--muted); line-height: 1.6; }
    h2 { margin: 1rem 0 0; }
  `]
})
export class SettingsComponent {
  private readonly fb = new FormBuilder();
  readonly themeService = inject(ThemeService);
  readonly github = inject(GitHubCmsService);
  readonly officer = inject(OfficerSessionService);
  readonly themes: ThemeId[] = ['ai-neon', 'cyberpunk-city', 'deep-space-ai', 'research-lab', 'data-network-world', 'agentic-ai', 'healthcare-ai', 'unt-academic'];
  readonly current = this.themeService.settings();
  readonly githubCurrent = this.github.settings();
  readonly form = this.fb.nonNullable.group({
    themeRotation: [this.current.themeRotation],
    fixedTheme: [this.current.fixedTheme],
    activeThemePool: [this.current.activeThemePool.join(', ')],
    carouselSpeed: [this.current.carouselSpeed],
    announcements: [JSON.stringify(this.current.announcements, null, 2)],
    githubOwner: [this.githubCurrent.owner],
    githubRepo: [this.githubCurrent.repo],
    githubBranch: [this.githubCurrent.branch],
    githubToken: [this.githubCurrent.token]
  });

  save(): void {
    const value = this.form.getRawValue();
    const settings: SiteSettings = {
      themeRotation: value.themeRotation as SiteSettings['themeRotation'],
      fixedTheme: value.fixedTheme as ThemeId,
      activeThemePool: value.activeThemePool.split(',').map((item) => item.trim()).filter(Boolean) as ThemeId[],
      carouselSpeed: Number(value.carouselSpeed) || 4000,
      announcements: JSON.parse(value.announcements || '[]') as SiteSettings['announcements']
    };
    this.themeService.updateSettings(settings);
    this.github.saveSettings({
      owner: value.githubOwner,
      repo: value.githubRepo,
      branch: value.githubBranch,
      token: value.githubToken
    });
  }
}
