import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GitHubCmsService } from '../../core/services/github-cms.service';
import { OfficerSessionService } from '../../core/services/officer-session.service';
import { MediaAsset, MediaCategory } from '../../shared/models/content.models';

@Component({
  selector: 'app-media-library',
  standalone: true,
  imports: [DatePipe, FormsModule, MatIconModule],
  template: `
    <section class="section page">
      <div class="section__inner reveal">
        <span class="eyebrow">Media Library</span>
        <h1 class="section-title">Uploaded SSAI website images.</h1>
        @if (officer.canManage('galleries')) {
          <div class="toolbar glass">
            <label>
              <span>Category</span>
              <select [ngModel]="category()" (ngModelChange)="setCategory($event)">
                @for (item of categories; track item) {
                  <option [value]="item">{{ item }}</option>
                }
              </select>
            </label>
            <label class="upload">
              <mat-icon>cloud_upload</mat-icon>
              <span>Upload Images</span>
              <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple (change)="upload($event)">
            </label>
            <input class="search" [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Search images">
          </div>
          @if (github.status()) {
            <p class="status">{{ github.status() }}</p>
          }
          <div class="media-grid top-gap">
            @for (asset of filtered(); track asset.id) {
              <article class="media-card glass">
                <img [src]="asset.url" [alt]="asset.name">
                <div>
                  <strong>{{ asset.name }}</strong>
                  <span>{{ asset.category }} | {{ asset.uploadedAt | date: 'medium' }}</span>
                </div>
                <div class="actions">
                  <button type="button" (click)="copy(asset.url)"><mat-icon>content_copy</mat-icon></button>
                  <label>
                    <mat-icon>sync</mat-icon>
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" (change)="replace(asset, $event)">
                  </label>
                  <button type="button" (click)="remove(asset)"><mat-icon>delete</mat-icon></button>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="locked glass">Officer access is required.</div>
        }
      </div>
    </section>
  `,
  styles: [`
    .page { padding-top: clamp(5rem, 10vw, 8rem); }
    .top-gap { margin-top: 1.5rem; }
    .toolbar { display: flex; gap: .8rem; align-items: end; flex-wrap: wrap; margin-top: 1.5rem; padding: 1rem; border-radius: 1rem; }
    .toolbar label { display: grid; gap: .35rem; color: var(--muted); font-weight: 800; }
    select, .search { min-height: 2.75rem; border: 1px solid var(--line); border-radius: .75rem; background: var(--surface-strong); color: var(--text); padding: 0 .8rem; }
    .upload { min-height: 2.75rem; grid-auto-flow: column; place-items: center; padding: 0 .9rem; border: 1px solid var(--line); border-radius: .75rem; color: var(--text); cursor: pointer; }
    .upload input, .actions input { display: none; }
    .media-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1rem; }
    .media-card { display: grid; gap: .75rem; padding: .8rem; border-radius: 1rem; }
    .media-card img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: .75rem; }
    .media-card div:not(.actions) { display: grid; gap: .25rem; }
    .media-card span, .status { color: var(--muted); }
    .actions { display: flex; gap: .4rem; }
    .actions button, .actions label { display: grid; width: 2.35rem; height: 2.35rem; place-items: center; border: 1px solid var(--line); border-radius: .65rem; background: var(--surface-strong); color: var(--text); cursor: pointer; }
    .locked { margin-top: 1.5rem; padding: 1rem; border-radius: 1rem; }
  `]
})
export class MediaLibraryComponent {
  readonly github = inject(GitHubCmsService);
  readonly officer = inject(OfficerSessionService);
  readonly categories: MediaCategory[] = ['leadership', 'events', 'gallery', 'projects', 'speakers'];
  readonly category = signal<MediaCategory>('gallery');
  readonly query = signal('');
  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.github.media().filter((asset) => !query || `${asset.name} ${asset.category} ${asset.url}`.toLowerCase().includes(query));
  });

  async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    await Promise.all(files.map((file) => this.github.uploadImage(file, this.category())));
    input.value = '';
  }

  setCategory(value: string): void {
    this.category.set(value as MediaCategory);
  }

  async replace(asset: MediaAsset, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      await this.github.replaceAsset(asset, file);
      input.value = '';
    }
  }

  async remove(asset: MediaAsset): Promise<void> {
    if (confirm(`Delete ${asset.name}?`)) {
      await this.github.deleteAsset(asset);
    }
  }

  copy(url: string): void {
    void navigator.clipboard.writeText(url);
    this.github.status.set('Image URL copied.');
  }
}
