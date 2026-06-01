import { Injectable, signal } from '@angular/core';
import { MediaAsset, MediaCategory } from '../../shared/models/content.models';

export interface GitHubCmsSettings {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class GitHubCmsService {
  private readonly mediaResetVersion = '2026-06-01-server-cms-reset';
  private readonly mediaResetKey = 'ssai-media-library-reset-version';
  private readonly settingsKey = 'ssai-github-cms-settings';
  private readonly mediaKey = 'ssai-media-library';

  readonly settings = signal<GitHubCmsSettings>(this.readSettings());
  readonly serverConfigured = signal(true);
  readonly media = signal<MediaAsset[]>(this.readMedia());
  readonly status = signal('');

  constructor() {
    void this.refreshServerStatus();
  }

  isConfigured(): boolean {
    return this.serverConfigured();
  }

  saveSettings(settings: GitHubCmsSettings): void {
    this.settings.set({
      owner: settings.owner.trim(),
      repo: settings.repo.trim(),
      branch: settings.branch.trim() || 'main',
      token: settings.token.trim()
    });
    localStorage.setItem(this.settingsKey, JSON.stringify(this.settings()));
    this.status.set('GitHub CMS settings saved.');
  }

  async uploadImage(file: File, category: MediaCategory, metadata: Pick<MediaAsset, 'galleryId'> = {}): Promise<MediaAsset> {
    const uploadFile = await this.prepareImageForUpload(file);

    const safeName = this.safeFileName(uploadFile.name);
    const content = await this.fileToBase64(uploadFile);
    const result = await this.api<{ asset: MediaAsset }>('/api/cms-upload', {
      category,
      content,
      name: safeName,
      size: uploadFile.size,
      type: uploadFile.type,
      ...metadata
    });
    const asset = this.recordAsset(result.asset);
    this.status.set(`${file.name} uploaded to GitHub.`);
    return asset;
  }

  async saveJson(path: string, data: unknown): Promise<void> {
    await this.api('/api/cms-json', { path, data });
    this.status.set(`${path} saved to GitHub.`);
  }

  async deleteAsset(asset: MediaAsset): Promise<void> {
    if (asset.path) {
      await this.api('/api/cms-delete', { path: asset.path });
    }
    this.media.set(this.media().filter((item) => item.id !== asset.id));
    this.persistMedia();
  }

  async replaceAsset(asset: MediaAsset, file: File): Promise<MediaAsset> {
    await this.deleteAsset(asset);
    return this.uploadImage(file, asset.category);
  }

  clearMediaLibrary(): void {
    this.media.set([]);
    localStorage.removeItem(this.mediaKey);
    localStorage.setItem(this.mediaResetKey, this.mediaResetVersion);
    this.status.set('CMS media library cleared.');
  }

  private async refreshServerStatus(): Promise<void> {
    try {
      const response = await fetch('/api/cms-status');
      const result = await response.json() as { configured?: boolean };
      this.serverConfigured.set(Boolean(result.configured));
    } catch {
      this.serverConfigured.set(false);
    }
  }

  private async api<T = unknown>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({ message: 'CMS request failed.' })) as { message?: string };
      throw new Error(result.message || `CMS request failed: ${response.status}`);
    }

    const result = await response.json() as { ok?: boolean; message?: string } & T;
    if (result.ok === false) throw new Error(result.message || 'CMS request failed.');
    return result;
  }

  private recordAsset(asset: MediaAsset): MediaAsset {
    this.media.set([asset, ...this.media()]);
    this.persistMedia();
    return asset;
  }

  private readSettings(): GitHubCmsSettings {
    try {
      return { owner: '', repo: '', branch: 'main', token: '', ...JSON.parse(localStorage.getItem(this.settingsKey) || '{}') };
    } catch {
      return { owner: '', repo: '', branch: 'main', token: '' };
    }
  }

  private readMedia(): MediaAsset[] {
    try {
      if (localStorage.getItem(this.mediaResetKey) !== this.mediaResetVersion) {
        localStorage.removeItem(this.mediaKey);
        localStorage.setItem(this.mediaResetKey, this.mediaResetVersion);
        return [];
      }
      return JSON.parse(localStorage.getItem(this.mediaKey) || '[]') as MediaAsset[];
    } catch {
      return [];
    }
  }

  private persistMedia(): void {
    localStorage.setItem(this.mediaKey, JSON.stringify(this.media()));
  }

  private safeFileName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/(^-|-$)/g, '') || 'image.png';
  }

  private async prepareImageForUpload(file: File): Promise<File> {
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 900_000) {
      return file;
    }

    try {
      const dataUrl = await this.readAsDataUrl(file);
      const image = await this.loadImage(dataUrl);
      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return file;

      context.drawImage(image, 0, 0, width, height);
      const blob = await this.canvasToBlob(canvas, 'image/jpeg', 0.82);
      if (!blob || blob.size >= file.size) return file;

      return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-optimized.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
    } catch {
      return file;
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to read image file.'));
      image.src = src;
    });
  }

  private canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  private fileToBase64(file: File): Promise<string> {
    return file.arrayBuffer().then((buffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      bytes.forEach((byte) => binary += String.fromCharCode(byte));
      return btoa(binary);
    });
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

}
