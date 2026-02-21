import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'app-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    readonly mode = signal<ThemeMode>(this.loadPref());

    readonly resolved = signal<'light' | 'dark'>(this.resolve(this.mode()));

    constructor() {
        if (this.isBrowser) {
            const mql = window.matchMedia('(prefers-color-scheme: dark)');
            mql.addEventListener('change', () => {
                if (this.mode() === 'system') {
                    this.apply();
                }
            });
        }

        effect(() => {
            const mode = this.mode();
            if (this.isBrowser) {
                localStorage.setItem(STORAGE_KEY, mode);
            }
            this.apply();
        });
    }

    toggle(): void {
        const next: ThemeMode =
            this.mode() === 'light' ? 'dark'
                : this.mode() === 'dark' ? 'system'
                    : 'light';
        this.mode.set(next);
    }

    private resolve(mode: ThemeMode): 'light' | 'dark' {
        if (mode === 'system') {
            return this.isBrowser && window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark' : 'light';
        }
        return mode;
    }

    private apply(): void {
        if (!this.isBrowser) return;
        const resolved = this.resolve(this.mode());
        this.resolved.set(resolved);
        document.documentElement.setAttribute('data-theme', resolved);
    }

    private loadPref(): ThemeMode {
        if (!this.isBrowser) return 'system';
        return (localStorage.getItem(STORAGE_KEY) as ThemeMode) ?? 'system';
    }
}
