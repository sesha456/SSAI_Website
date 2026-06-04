import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, computed, signal } from '@angular/core';

export type ThemeId = 'ai-neon' | 'cyberpunk-city' | 'deep-space-ai' | 'research-lab' | 'data-network-world' | 'agentic-ai' | 'healthcare-ai' | 'unt-academic' | 'unt-cse' | 'modern-professional' | 'diwali' | 'holi' | 'christmas' | 'thanksgiving' | 'usa-independence' | 'india-independence';

export interface Celebration {
  id: string;
  name: string;
  message: string;
  theme: ThemeId;
  startsAt: string;
  endsAt: string;
}

export interface SiteSettings {
  activeThemePool: ThemeId[];
  themeRotation: 'random-per-session' | 'fixed';
  fixedTheme: ThemeId;
  carouselSpeed: number;
  announcements: Celebration[];
}

const BASE_THEMES: ThemeId[] = ['ai-neon', 'cyberpunk-city', 'deep-space-ai', 'research-lab', 'data-network-world', 'agentic-ai', 'healthcare-ai', 'unt-academic'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly sessionThemeKey = 'ssai-session-theme';
  private readonly lastThemeKey = 'ssai-last-theme';
  private readonly settingsKey = 'ssai-site-settings';
  private readonly dismissedKey = 'ssai-dismissed-celebrations';
  readonly settings = signal<SiteSettings>(this.readSettings());
  readonly activeCelebration = signal<Celebration | null>(null);
  readonly activeTheme = signal<ThemeId>('ai-neon');
  readonly isLight = computed(() => this.activeTheme() === 'modern-professional' || this.activeTheme() === 'research-lab' || this.activeTheme() === 'unt-academic' || this.activeTheme() === 'unt-cse');

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.initialize();
  }

  async initialize(): Promise<void> {
    const celebration = await this.detectCelebration(new Date());
    const randomTheme = this.pickSessionTheme();
    const nextTheme = celebration?.theme ?? randomTheme;
    this.activeCelebration.set(this.isDismissed(celebration) ? null : celebration);
    this.activeTheme.set(nextTheme);
    this.apply(nextTheme);
  }

  toggle(): void {
    const next = this.isLight() ? 'ai-neon' : 'modern-professional';
    sessionStorage.setItem(this.sessionThemeKey, next);
    this.activeTheme.set(next);
    this.apply(next);
  }

  dismissCelebration(): void {
    const celebration = this.activeCelebration();
    if (!celebration) return;
    const dismissed = new Set(this.readDismissed());
    dismissed.add(celebration.id);
    localStorage.setItem(this.dismissedKey, JSON.stringify([...dismissed]));
    this.activeCelebration.set(null);
  }

  updateSettings(settings: SiteSettings): void {
    this.settings.set(settings);
    localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    sessionStorage.removeItem(this.sessionThemeKey);
    void this.initialize();
  }

  applyOfficerTheme(theme: ThemeId): void {
    sessionStorage.setItem(this.sessionThemeKey, theme);
    localStorage.setItem(this.lastThemeKey, theme);
    this.activeTheme.set(theme);
    this.apply(theme);
  }

  private pickSessionTheme(): ThemeId {
    const settings = this.settings();
    const pool = settings.activeThemePool.length ? settings.activeThemePool : BASE_THEMES;
    const lastTheme = localStorage.getItem(this.lastThemeKey) as ThemeId | null;
    const availableThemes = pool.length > 1 ? pool.filter((theme) => theme !== lastTheme) : pool;
    const selected = settings.themeRotation === 'fixed' ? settings.fixedTheme : availableThemes[Math.floor(Math.random() * availableThemes.length)];
    sessionStorage.setItem(this.sessionThemeKey, selected);
    localStorage.setItem(this.lastThemeKey, selected);
    return selected;
  }

  private async detectCelebration(today: Date): Promise<Celebration | null> {
    const year = today.getFullYear();
    const candidates = [
      ...this.usHolidays(year),
      ...this.fixedCelebrations(year),
      ...this.settings().announcements,
      ...await this.fallbackIndianFestivals(year)
    ];
    return candidates.find((item) => this.inWindow(today, item.startsAt, item.endsAt)) ?? null;
  }

  private usHolidays(year: number): Celebration[] {
    const thanksgiving = this.nthWeekday(year, 10, 4, 4);
    const mlk = this.nthWeekday(year, 0, 1, 3);
    const memorial = this.lastWeekday(year, 4, 1);
    const labor = this.nthWeekday(year, 8, 1, 1);
    return [
      this.event('mlk', 'Martin Luther King Jr. Day', 'Honoring service, leadership, and community impact.', 'research-lab', mlk, -1, 0),
      this.event('memorial', 'Memorial Day', 'Remembering and honoring those who served.', 'modern-professional', memorial, -1, 0),
      this.event('labor', 'Labor Day', 'Happy Labor Day from SSAI.', 'modern-professional', labor, -1, 0),
      this.event('thanksgiving', 'Thanksgiving', 'Happy Thanksgiving from SSAI. Grateful for builders, mentors, and community.', 'thanksgiving', thanksgiving, 0, 3)
    ];
  }

  private fixedCelebrations(year: number): Celebration[] {
    return [
      this.range('new-year', 'New Year', "Happy New Year! Let's build the future of AI together.", 'agentic-ai', `${year}-01-01`, `${year}-01-03`),
      this.range('christmas', 'Christmas', 'Merry Christmas from the SSAI family.', 'christmas', `${year}-12-20`, `${year}-12-31`),
      this.range('usa-independence', 'Independence Day', 'Happy Independence Day!', 'usa-independence', `${year}-07-04`, `${year}-07-05`),
      this.range('india-independence', 'India Independence Day', 'Happy India Independence Day from SSAI.', 'india-independence', `${year}-08-15`, `${year}-08-15`),
      this.range('unt-fall', 'UNT Fall Semester', 'Welcome back, Mean Green!', 'research-lab', `${year}-08-18`, `${year}-08-30`),
      this.range('ssai-anniversary', 'SSAI Anniversary', 'Celebrating another year of student AI innovation.', 'ai-neon', `${year}-04-01`, `${year}-04-07`)
    ];
  }

  private async fallbackIndianFestivals(year: number): Promise<Celebration[]> {
    try {
      const response = await fetch('/assets/data/festival-config.json');
      const config = response.ok ? await response.json() as Record<string, Record<string, string>> : {};
      const yearConfig = config[String(year)] ?? {};
      return Object.entries(yearConfig).map(([name, date]) => this.indianFestival(name, date));
    } catch {
      return [];
    }
  }

  private indianFestival(name: string, date: string): Celebration {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (id.includes('diwali')) return this.event(id, name, 'Happy Diwali from SSAI!', 'diwali', new Date(`${date}T12:00:00`), -3, 2);
    if (id.includes('holi')) return this.event(id, name, 'Happy Holi! May your year be filled with innovation and success.', 'holi', new Date(`${date}T12:00:00`), 0, 1);
    return this.event(id, name, `${name} greetings from SSAI.`, 'research-lab', new Date(`${date}T12:00:00`), 0, 1);
  }

  private event(id: string, name: string, message: string, theme: ThemeId, date: Date, before: number, after: number): Celebration {
    const start = new Date(date);
    const end = new Date(date);
    start.setDate(start.getDate() + before);
    end.setDate(end.getDate() + after);
    return this.range(id, name, message, theme, this.toDate(start), this.toDate(end));
  }

  private range(id: string, name: string, message: string, theme: ThemeId, startsAt: string, endsAt: string): Celebration {
    return { id: `${id}-${startsAt}`, name, message, theme, startsAt, endsAt };
  }

  private nthWeekday(year: number, month: number, weekday: number, nth: number): Date {
    const date = new Date(year, month, 1);
    date.setDate(1 + ((7 + weekday - date.getDay()) % 7) + (nth - 1) * 7);
    return date;
  }

  private lastWeekday(year: number, month: number, weekday: number): Date {
    const date = new Date(year, month + 1, 0);
    date.setDate(date.getDate() - ((7 + date.getDay() - weekday) % 7));
    return date;
  }

  private inWindow(today: Date, start: string, end: string): boolean {
    const value = this.toDate(today);
    return value >= start && value <= end;
  }

  private toDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private isDismissed(celebration: Celebration | null): boolean {
    return !!celebration && this.readDismissed().includes(celebration.id);
  }

  private readDismissed(): string[] {
    try {
      return JSON.parse(localStorage.getItem(this.dismissedKey) || '[]') as string[];
    } catch {
      return [];
    }
  }

  private readSettings(): SiteSettings {
    const defaults: SiteSettings = {
      activeThemePool: BASE_THEMES,
      themeRotation: 'random-per-session',
      fixedTheme: 'ai-neon',
      carouselSpeed: 4000,
      announcements: []
    };
    try {
      const stored = { ...defaults, ...JSON.parse(localStorage.getItem(this.settingsKey) || '{}') } as SiteSettings;
      const validThemes = new Set<ThemeId>(['ai-neon', 'cyberpunk-city', 'deep-space-ai', 'research-lab', 'data-network-world', 'agentic-ai', 'healthcare-ai', 'unt-academic', 'unt-cse', 'modern-professional', 'diwali', 'holi', 'christmas', 'thanksgiving', 'usa-independence', 'india-independence']);
      stored.activeThemePool = stored.activeThemePool.filter((theme) => validThemes.has(theme));
      stored.fixedTheme = validThemes.has(stored.fixedTheme) ? stored.fixedTheme : 'ai-neon';
      return stored;
    } catch {
      return defaults;
    }
  }

  private apply(theme: ThemeId): void {
    this.document.body.classList.remove(...Array.from(this.document.body.classList).filter((item) => item.startsWith('theme-')));
    this.document.body.classList.toggle('light', this.isLight());
    this.document.body.classList.add(`theme-${theme}`);
  }
}
