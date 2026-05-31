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
  private readonly mediaResetVersion = '2026-05-31-gallery-upload-reset';
  private readonly mediaResetKey = 'ssai-media-library-reset-version';
  private readonly settingsKey = 'ssai-github-cms-settings';
  private readonly mediaKey = 'ssai-media-library';

  readonly settings = signal<GitHubCmsSettings>(this.readSettings());
  readonly media = signal<MediaAsset[]>(this.readMedia());
  readonly status = signal('');

  isConfigured(): boolean {
    const settings = this.settings();
    return !!settings.owner && !!settings.repo && !!settings.branch && !!settings.token;
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

    if (!this.isConfigured()) {
      const url = await this.readAsDataUrl(uploadFile);
      const asset = this.recordAsset(uploadFile, category, url, undefined, metadata);
      this.status.set('Stored in this browser. Configure GitHub CMS settings for permanent public storage.');
      return asset;
    }

    const safeName = this.safeFileName(uploadFile.name);
    const path = `public/assets/uploads/${category}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const content = await this.fileToBase64(uploadFile);
    await this.putFile(path, content, `Upload ${category} media: ${safeName}`);
    const { owner, repo, branch } = this.settings();
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    const asset = this.recordAsset(uploadFile, category, url, path, metadata);
    this.status.set(`${file.name} uploaded to GitHub.`);
    return asset;
  }

  async saveJson(path: string, data: unknown): Promise<void> {
    if (!this.isConfigured()) return;
    const json = JSON.stringify(data, null, 2);
    const content = this.textToBase64(json);
    await this.putFile(path, content, `Update ${path}`);
    this.status.set(`${path} saved to GitHub.`);
  }

  async deleteAsset(asset: MediaAsset): Promise<void> {
    if (asset.path && this.isConfigured()) {
      const existing = await this.getFile(asset.path);
      if (existing?.sha) {
        await this.request(asset.path, {
          method: 'DELETE',
          body: JSON.stringify({
            message: `Delete media: ${asset.name}`,
            sha: existing.sha,
            branch: this.settings().branch
          })
        });
      }
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

  private async putFile(path: string, content: string, message: string): Promise<void> {
    const existing = await this.getFile(path);
    await this.request(path, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content,
        branch: this.settings().branch,
        ...(existing?.sha ? { sha: existing.sha } : {})
      })
    });
  }

  private async getFile(path: string): Promise<{ sha?: string } | null> {
    try {
      return await this.request(path, { method: 'GET' }) as { sha?: string };
    } catch {
      return null;
    }
  }

  private async request(path: string, init: RequestInit): Promise<unknown> {
    const { owner, repo, branch, token } = this.settings();
    const separator = path.includes('?') ? '&' : '?';
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}${separator}ref=${encodeURIComponent(branch)}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.headers ?? {})
      }
    });
    if (!response.ok) {
      throw new Error(`GitHub request failed: ${response.status}`);
    }
    return response.json();
  }

  private recordAsset(file: File, category: MediaCategory, url: string, path?: string, metadata: Pick<MediaAsset, 'galleryId'> = {}): MediaAsset {
    const asset: MediaAsset = {
      id: `${Date.now()}-${crypto.randomUUID()}`,
      name: file.name,
      category,
      url,
      path,
      ...metadata,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    };
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

  private textToBase64(value: string): string {
    let binary = '';
    new TextEncoder().encode(value).forEach((byte) => binary += String.fromCharCode(byte));
    return btoa(binary);
  }
}
