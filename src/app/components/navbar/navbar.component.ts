import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { BookStoreService } from '@services/book-store.service';
import { BookFormComponent } from '@components/book-form/book-form.component';
import { ThemeService, ThemeMode } from '@services/theme.service';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  template: `
    <mat-toolbar class="navbar">
      <div class="brand">
        <div class="logo-box">
          <mat-icon>library_books</mat-icon>
        </div>
        <span class="brand-name">Library<span class="accent-text">Manager</span></span>
      </div>

      <span class="spacer"></span>

      <button mat-icon-button
              class="theme-btn"
              (click)="theme.toggle()"
              [matTooltip]="themeTooltip()"
              aria-label="Toggle theme">
        <mat-icon>{{ themeIcon() }}</mat-icon>
      </button>

      <button mat-flat-button color="primary" (click)="openAddDialog()" class="add-btn">
        <mat-icon>add</mat-icon>
        Add Book
      </button>
    </mat-toolbar>
  `,
  styles: `
    .navbar {
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 8px;
      height: 64px;
      background-color: var(--bg-card) !important;
      border-bottom: 1px solid var(--border);
      color: var(--text-primary);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: default;
      user-select: none;
    }

    .logo-box {
      background: var(--color-primary);
      color: #fff;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .brand-name {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);

      .accent-text {
        color: var(--color-primary);
      }
    }

    .spacer { flex: 1; }

    .theme-btn {
      color: var(--text-secondary);
      transition: color var(--transition), transform var(--transition);

      &:hover {
        color: var(--color-primary);
        transform: rotate(20deg);
      }
    }

    .add-btn {
      font-weight: 600;
      border-radius: var(--radius-sm);
    }

    @media (max-width: 600px) {
      .navbar {
        padding: 0 12px;
        gap: 4px;
      }
      .brand-name {
        display: none;
      }
    }
  `,
})
export class NavbarComponent {
  readonly store = inject(BookStoreService);
  readonly theme = inject(ThemeService);
  private readonly dialog = inject(MatDialog);

  themeIcon(): string {
    const icons: Record<ThemeMode, string> = {
      light: 'light_mode',
      dark: 'dark_mode',
      system: 'brightness_auto',
    };
    return icons[this.theme.mode()];
  }

  themeTooltip(): string {
    const labels: Record<ThemeMode, string> = {
      light: 'Light mode — click for Dark',
      dark: 'Dark mode — click for System',
      system: 'System mode — click for Light',
    };
    return labels[this.theme.mode()];
  }

  openAddDialog(): void {
    this.dialog.open(BookFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { book: null },
    });
  }
}
