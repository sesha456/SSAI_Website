import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ContentService } from '../../core/services/content.service';
import { GitHubCmsService } from '../../core/services/github-cms.service';
import { OfficerSessionService } from '../../core/services/officer-session.service';
import { GalleryCollection, GalleryPhoto } from '../../shared/models/content.models';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <section class="section page">
      <div class="section__inner reveal">
        <span class="eyebrow">Gallery</span>
        <h1 class="section-title">Event-based SSAI galleries.</h1>
        <p class="section-copy">Browse event collections, auto-scrolling carousels, and responsive photo grids.</p>
        @if (canManageGalleryMetadata()) {
          <div class="admin-bar glass">
            <span>{{ galleryAdminMessage() }}</span>
            <button class="primary-btn" type="button" (click)="openAdd()">Add Gallery</button>
          </div>
        }
        <div class="gallery-cards top-gap">
          @for (gallery of galleries(); track gallery.id) {
            <article class="gallery-card glass">
              <div class="cover" [style.background]="imageBackground(gallery.coverImage)"></div>
              <div>
                <span class="eyebrow">{{ gallery.eventDate | date: 'MMM d, y' }}</span>
                <h2>{{ gallery.title }}</h2>
                <p>{{ gallery.description }}</p>
                <strong>{{ photosFor(gallery).length }} photos</strong>
                <div class="card-actions">
                  <button class="primary-btn" type="button" (click)="openGallery(gallery)">Open Gallery</button>
                  @if (canUploadGalleryMedia()) {
                    <button class="ghost-btn" type="button" (click)="openGallery(gallery, true)">Upload Photos</button>
                  }
                </div>
              </div>
              @if (canManageGalleryMetadata()) {
                <div class="manage-actions">
                  <button type="button" (click)="openEdit(gallery)" aria-label="Edit gallery"><mat-icon>edit</mat-icon></button>
                  <button type="button" (click)="deleteGallery(gallery.id)" aria-label="Delete gallery"><mat-icon>delete</mat-icon></button>
                </div>
              }
            </article>
          }
        </div>
      </div>
    </section>

    @if (activeGallery(); as gallery) {
      <section class="section band" id="gallery-management">
        <div class="section__inner reveal">
          <div class="gallery-header">
            <div>
              <span class="eyebrow">{{ gallery.eventDate | date: 'MMMM d, y' }}</span>
              <h2 class="section-title">{{ gallery.title }}</h2>
            </div>
            <button class="ghost-btn" type="button" (click)="activeGallery.set(null)">Close Gallery</button>
          </div>

          @if (canUploadGalleryMedia()) {
            <div class="upload-panel glass">
              <label class="upload-box">
                <mat-icon>upload</mat-icon>
                <span>Upload single or multiple photos</span>
                <input #photoUpload type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple (change)="uploadPhotos(gallery, $event)">
              </label>
              <button class="primary-btn" type="button" (click)="photoUpload.click()" [disabled]="uploading()">
                {{ uploading() ? 'Uploading Photos...' : 'Choose Photos From Computer' }}
              </button>
              @if (uploadMessage()) {
                <strong class="upload-message">{{ uploadMessage() }}</strong>
              }
            </div>
          }

          @if (photosFor(gallery); as photos) {
            @if (photos.length) {
            <div class="carousel glass">
              <button type="button" (click)="previousPhoto(gallery)" aria-label="Previous photo"><mat-icon>chevron_left</mat-icon></button>
              <img [src]="photos[carouselIndex()].image" [alt]="photos[carouselIndex()].title" (click)="lightboxPhoto.set(photos[carouselIndex()])">
              <button type="button" (click)="nextPhoto(gallery)" aria-label="Next photo"><mat-icon>chevron_right</mat-icon></button>
            </div>
            <div class="photo-grid top-gap">
              @for (photo of photos; track photo.image; let i = $index) {
                <article class="photo-card glass">
                  <img [src]="photo.image" [alt]="photo.title" (click)="lightboxPhoto.set(photo)">
                  <strong>{{ photo.title }}</strong>
                  @if (canManageGalleryMetadata()) {
                    <div class="photo-actions">
                      <button type="button" (click)="content.moveGalleryPhoto(gallery.id, i, -1)"><mat-icon>arrow_upward</mat-icon></button>
                      <button type="button" (click)="content.moveGalleryPhoto(gallery.id, i, 1)"><mat-icon>arrow_downward</mat-icon></button>
                      <button type="button" (click)="content.deleteGalleryPhoto(gallery.id, i)"><mat-icon>delete</mat-icon></button>
                    </div>
                  }
                </article>
              }
            </div>
            } @else {
              <div class="empty-state glass">No photos are attached to this gallery yet.</div>
            }
          }
        </div>
      </section>
    }

    @if (editorOpen()) {
      <div class="modal">
        <form class="editor glass" [formGroup]="form" (ngSubmit)="saveGallery()">
          <h2>{{ editingId() === null ? 'Add Gallery' : 'Edit Gallery' }}</h2>
          <mat-form-field appearance="outline"><mat-label>Gallery Name</mat-label><input matInput formControlName="title"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Event Date</mat-label><input matInput type="date" formControlName="eventDate"></mat-form-field>
          <div class="cover-upload">
            <span>Cover Image</span>
            @if (form.controls.coverImage.value) {
              <div class="cover-preview" [style.background]="imageBackground(form.controls.coverImage.value)"></div>
            }
            <label class="upload-box compact">
              <mat-icon>add_photo_alternate</mat-icon>
              <span>Choose cover photo from computer</span>
              <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" (change)="uploadCover($event)" [disabled]="!github.isConfigured()">
            </label>
          </div>
          <mat-form-field appearance="outline"><mat-label>Description</mat-label><textarea matInput rows="4" formControlName="description"></textarea></mat-form-field>
          <div class="editor-actions">
            <button class="ghost-btn" type="button" (click)="editorOpen.set(false)">Cancel</button>
            <button class="primary-btn" type="submit">Save</button>
          </div>
        </form>
      </div>
    }

    @if (lightboxPhoto(); as photo) {
      <div class="lightbox" (click)="lightboxPhoto.set(null)">
        <img [src]="photo.image" [alt]="photo.title">
        <strong>{{ photo.title }}</strong>
      </div>
    }
  `,
  styles: [`
    .page { padding-top: clamp(5rem, 10vw, 8rem); }
    .top-gap { margin-top: 1.5rem; }
    .band { background: rgba(255,255,255,.035); }
    .admin-bar, .gallery-header { display: flex; gap: .8rem; align-items: center; justify-content: space-between; flex-wrap: wrap; }
    .admin-bar { margin-top: 1.5rem; padding: 1rem; border-radius: 1rem; }
    .admin-bar span { color: var(--primary); font-weight: 900; }
    .gallery-cards, .photo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
    .gallery-card { position: relative; overflow: hidden; border-radius: 1rem; cursor: pointer; }
    .cover { min-height: 12rem; }
    .gallery-card > div:not(.cover):not(.manage-actions) { padding: 1rem; }
    .gallery-card p { color: var(--muted); line-height: 1.6; }
    .manage-actions, .photo-actions, .card-actions { display: flex; gap: .4rem; }
    .card-actions { flex-wrap: wrap; margin-top: 1rem; }
    .card-actions button { cursor: pointer; }
    .manage-actions { position: absolute; top: .8rem; right: .8rem; }
    .manage-actions button, .photo-actions button, .carousel button { display: grid; width: 2.35rem; height: 2.35rem; place-items: center; border: 1px solid var(--line); border-radius: .7rem; background: var(--surface-strong); color: var(--text); cursor: pointer; }
    .upload-panel, .carousel, .photo-card, .editor, .empty-state { border-radius: 1rem; }
    .upload-panel { display: grid; gap: .8rem; margin: 1rem 0; padding: 1rem; }
    .upload-box { display: grid; min-height: 8rem; place-items: center; border: 1px dashed var(--line); border-radius: .9rem; color: var(--muted); cursor: pointer; text-align: center; }
    .upload-box.compact { min-height: 5rem; }
    .upload-box input { display: none; }
    .cover-upload { display: grid; gap: .65rem; }
    .cover-upload > span { color: var(--muted); font-size: .85rem; font-weight: 800; }
    .cover-preview { min-height: 11rem; border: 1px solid var(--line); border-radius: .8rem; }
    .upload-message { color: var(--primary); }
    .upload-message.warning { color: var(--warning); }
    button:disabled { cursor: not-allowed; opacity: .58; transform: none; }
    .carousel { display: grid; grid-template-columns: auto 1fr auto; gap: .8rem; align-items: center; padding: 1rem; }
    .carousel img { width: 100%; max-height: 62vh; object-fit: contain; border-radius: .8rem; cursor: zoom-in; }
    .photo-card { display: grid; gap: .7rem; padding: .8rem; }
    .photo-card img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: .8rem; cursor: zoom-in; }
    .empty-state { margin-top: 1rem; padding: 1rem; color: var(--muted); font-weight: 800; }
    .modal, .lightbox { position: fixed; inset: 0; z-index: 70; display: grid; padding: 1rem; background: rgba(0,0,0,.76); place-items: center; }
    .editor { display: grid; width: min(620px, 100%); gap: .8rem; padding: 1rem; }
    .editor-actions { display: flex; gap: .7rem; justify-content: flex-end; }
    .lightbox img { max-width: min(1100px, 94vw); max-height: 84vh; object-fit: contain; }
    .lightbox strong { color: #fff; }
    @media (max-width: 640px) { .carousel { grid-template-columns: 1fr; } .editor-actions button, .gallery-header button { width: 100%; } }
  `]
})
export class GalleryComponent {
  private readonly fb = new FormBuilder();
  readonly content = inject(ContentService);
  readonly github = inject(GitHubCmsService);
  readonly officer = inject(OfficerSessionService);
  readonly activeGallery = signal<GalleryCollection | null>(null);
  readonly lightboxPhoto = signal<GalleryPhoto | null>(null);
  readonly editorOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly carouselIndex = signal(0);
  readonly uploadMessage = signal('');
  readonly uploading = signal(false);
  readonly galleries = computed(() => {
    this.content.version();
    return this.content.galleryCollections;
  });
  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    eventDate: ['', Validators.required],
    coverImage: ['linear-gradient(135deg, #45f0d1, #2563eb)'],
    description: ['', Validators.required]
  });

  constructor() {
    setInterval(() => {
      const gallery = this.activeGallery();
      if (gallery?.photos.length) this.nextPhoto(gallery);
    }, 4000);
  }

  openGallery(gallery: GalleryCollection, upload = false): void {
    this.activeGallery.set(gallery);
    this.carouselIndex.set(0);
    setTimeout(() => {
      document.getElementById('gallery-management')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (upload && this.canUploadGalleryMedia()) {
        document.querySelector<HTMLElement>('#gallery-management .upload-box')?.focus();
      }
    });
  }

  openAdd(): void {
    if (!this.canManageGalleryMetadata()) return;
    this.editingId.set(null);
    this.form.reset({ coverImage: 'linear-gradient(135deg, #45f0d1, #2563eb)' });
    this.editorOpen.set(true);
  }

  openEdit(gallery: GalleryCollection): void {
    if (!this.canManageGalleryMetadata()) return;
    this.editingId.set(gallery.id);
    this.form.setValue({ title: gallery.title, eventDate: gallery.eventDate, coverImage: gallery.coverImage, description: gallery.description });
    this.editorOpen.set(true);
  }

  saveGallery(): void {
    if (!this.canManageGalleryMetadata() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const existing = this.content.galleryCollections.find((item) => item.id === this.editingId());
    const gallery: GalleryCollection = { id: this.editingId() ?? 0, ...value, photos: existing?.photos ?? [] };
    this.editingId() === null ? this.content.addGallery(gallery) : this.content.updateGallery(this.editingId()!, gallery);
    this.editorOpen.set(false);
  }

  deleteGallery(id: number): void {
    if (!this.canManageGalleryMetadata()) return;
    this.content.deleteGallery(id);
  }

  async uploadPhotos(gallery: GalleryCollection, event: Event): Promise<void> {
    if (!this.officer.requireActiveSession()) return;
    if (!this.ensureSharedCms()) return;
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    this.uploading.set(true);
    this.uploadMessage.set(`Uploading 0 of ${files.length} photos...`);
    let uploaded = 0;
    let failed = 0;

    for (const [index, file] of files.entries()) {
      if (!this.officer.requireActiveSession()) {
        failed += files.length - index;
        break;
      }

      try {
        this.uploadMessage.set(`Optimizing and uploading ${index + 1} of ${files.length} photos...`);
        const asset = await this.github.uploadImage(file, 'gallery', { galleryId: gallery.id });
        const photo = { title: this.photoTitle(file, index), image: asset.url };
        this.content.addGalleryPhotos(gallery.id, [photo]);
        uploaded += 1;
        this.refreshActiveGallery(gallery.id);
        const active = this.activeGallery();
        const activePhotos = active ? this.photosFor(active) : [];
        this.carouselIndex.set(Math.max(0, activePhotos.length - 1));
      } catch (error) {
        console.error('Gallery photo upload failed', error);
        failed += 1;
      }
    }

    this.uploading.set(false);
    this.uploadMessage.set(uploaded
      ? `${uploaded} of ${files.length} photo${files.length === 1 ? '' : 's'} uploaded${failed ? `, ${failed} failed` : ''}.`
      : 'Upload failed. Please try fewer photos or smaller image files.');
    input.value = '';
  }

  async uploadCover(event: Event): Promise<void> {
    if (!this.ensureSharedCms()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.form.controls.coverImage.setValue((await this.github.uploadImage(file, 'gallery')).url);
    input.value = '';
  }

  nextPhoto(gallery: GalleryCollection): void {
    const photos = this.photosFor(gallery);
    this.carouselIndex.set(photos.length ? (this.carouselIndex() + 1) % photos.length : 0);
  }

  previousPhoto(gallery: GalleryCollection): void {
    const photos = this.photosFor(gallery);
    this.carouselIndex.set(photos.length ? (this.carouselIndex() - 1 + photos.length) % photos.length : 0);
  }

  photosFor(gallery: GalleryCollection): GalleryPhoto[] {
    const saved = gallery.photos;
    const savedImages = new Set(saved.map((photo) => photo.image));
    const uploaded = this.github.media()
      .filter((asset) => asset.category === 'gallery' && asset.galleryId === gallery.id && !savedImages.has(asset.url))
      .map((asset) => ({ title: asset.name.replace(/\.[^.]+$/, ''), image: asset.url }));
    return [...saved, ...uploaded];
  }

  imageBackground(value: string): string {
    return /^https?:\/\//.test(value) || value.startsWith('/assets/') || value.startsWith('data:') ? `linear-gradient(0deg, rgba(4,17,29,.45), rgba(4,17,29,.05)), url("${value}") center/cover` : value;
  }

  canManageGalleryMetadata(): boolean {
    return this.officer.canManage('galleries');
  }

  canUploadGalleryMedia(): boolean {
    return this.canManageGalleryMetadata() && this.github.isConfigured();
  }

  galleryAdminMessage(): string {
    if (!this.github.isConfigured()) {
      return this.content.saveMessage() || 'Gallery management enabled. Configure GitHub CMS to upload photos.';
    }
    return this.content.saveMessage() || 'Gallery management enabled with GitHub CMS sync.';
  }

  private ensureSharedCms(): boolean {
    if (this.github.isConfigured()) return true;
    this.uploadMessage.set('GitHub CMS is not configured on this browser. Open Settings and save GitHub CMS storage first.');
    this.content.saveMessage.set('GitHub CMS is not configured on this browser. Open Settings and save GitHub CMS storage first.');
    return false;
  }

  private refreshActiveGallery(id: number): void {
    const updated = this.content.galleryCollections.find((item) => item.id === id);
    if (updated) {
      this.activeGallery.set(updated);
    }
  }

  private photoTitle(file: File, index: number): string {
    const title = file.name.replace(/\.[^.]+$/, '').trim();
    return title && title !== 'image' ? title : `Photo ${index + 1}`;
  }
}
