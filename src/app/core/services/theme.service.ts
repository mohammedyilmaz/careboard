import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.load());

  constructor() {
    effect(() => {
      const mode = this.mode();
      const link = document.getElementById('app-theme') as HTMLLinkElement | null;
      if (link) link.href = `themes/lara-${mode}-blue/theme.css`;
      document.documentElement.dataset['theme'] = mode;
      try { localStorage.setItem('cb-theme', mode); } catch { /* ignore */ }
    });
  }

  toggle(): void {
    this.mode.update((m) => (m === 'dark' ? 'light' : 'dark'));
  }

  private load(): ThemeMode {
    try {
      return localStorage.getItem('cb-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  }
}
