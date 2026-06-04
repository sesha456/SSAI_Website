import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { OfficerSessionService } from '../../core/services/officer-session.service';
import { GitHubCmsService } from '../../core/services/github-cms.service';
import { ContentService } from '../../core/services/content.service';
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
        @if (officer.isOfficer()) {
          <div class="theme-panel glass">
            <div>
              <span class="eyebrow">Officer Theme Control</span>
              <h2>UNT theme</h2>
              <p class="hint">Apply the UNT-inspired academic visual style based on the provided Computer Science & Engineering and student event page references.</p>
            </div>
            <button class="primary-btn" type="button" (click)="applyUntTheme()">Apply UNT Theme</button>
          </div>
        }
        @if (officer.session()?.role === 'Super Admin') {
          <form class="settings glass" [formGroup]="form" (ngSubmit)="save()">
            <mat-form-field appearance="outline"><mat-label>Theme Rotation</mat-label><mat-select formControlName="themeRotation"><mat-option value="random-per-session">Random Per Session</mat-option><mat-option value="fixed">Fixed Theme</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Fixed Theme</mat-label><mat-select formControlName="fixedTheme">@for (theme of themes; track theme) { <mat-option [value]="theme">{{ theme }}</mat-option> }</mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Active Theme Pool (comma separated)</mat-label><input matInput formControlName="activeThemePool"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Carousel Speed (ms)</mat-label><input matInput type="number" formControlName="carouselSpeed"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Homepage / Event Announcements JSON</mat-label><textarea matInput rows="8" formControlName="announcements"></textarea></mat-form-field>
            <button class="primary-btn" type="submit">Save Settings</button>
            @if (github.status()) {
              <strong>{{ github.status() }}</strong>
            }
          </form>
          <div class="danger-zone glass">
            <h2>Clear CMS Data</h2>
            <p class="hint">Clears this browser's CMS media library and editable content cache. Use this after broken uploads or test content.</p>
            <button class="ghost-btn danger" type="button" (click)="clearCmsData()">Clear Browser CMS Data</button>
          </div>
        } @else if (!officer.isOfficer()) {
          <div class="locked glass">Officer access is required.</div>
        }
      </div>
    </section>
  `,
  styles: [`
    .page { padding-top: clamp(5rem, 10vw, 8rem); }
    .settings, .locked, .danger-zone, .theme-panel { display: grid; gap: .9rem; margin-top: 1.5rem; padding: 1rem; border-radius: 1rem; }
    .theme-panel { grid-template-columns: 1fr auto; align-items: center; }
    .primary-btn { width: fit-content; }
    .danger { width: fit-content; border-color: rgba(255,122,144,.45); color: #ff9aaa; }
    .hint { margin: 0; color: var(--muted); line-height: 1.6; }
    h2 { margin: 1rem 0 0; }
    @media (max-width: 720px) { .theme-panel { grid-template-columns: 1fr; } }
  `]
})
export class SettingsComponent {
  private readonly fb = new FormBuilder();
  readonly themeService = inject(ThemeService);
  readonly github = inject(GitHubCmsService);
  readonly content = inject(ContentService);
  readonly officer = inject(OfficerSessionService);
  readonly themes: ThemeId[] = ['ai-neon', 'cyberpunk-city', 'deep-space-ai', 'research-lab', 'data-network-world', 'agentic-ai', 'healthcare-ai', 'unt-academic', 'unt-cse'];
  readonly current = this.themeService.settings();
  readonly form = this.fb.nonNullable.group({
    themeRotation: [this.current.themeRotation],
    fixedTheme: [this.current.fixedTheme],
    activeThemePool: [this.current.activeThemePool.join(', ')],
    carouselSpeed: [this.current.carouselSpeed],
    announcements: [JSON.stringify(this.current.announcements, null, 2)]
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
  }

  clearCmsData(): void {
    if (!confirm('Clear this browser CMS media library and editable content cache?')) return;
    this.github.clearMediaLibrary();
    this.content.clearEditableCache();
    localStorage.removeItem('ssai-media-library');
    localStorage.removeItem('ssai-editable-content');
    window.location.reload();
  }

  applyUntTheme(): void {
    this.themeService.applyOfficerTheme('unt-cse');
  }
}
