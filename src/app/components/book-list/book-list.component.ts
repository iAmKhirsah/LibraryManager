import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { BookStoreService } from '@services/book-store.service';
import { BookCardComponent } from '@components/book-card/book-card.component';
import { ScrollSentinelComponent } from '@components/scroll-sentinel/scroll-sentinel.component';
import { BookFormComponent } from '@components/book-form/book-form.component';
import { BookFilterComponent } from '@components/book-filter/book-filter.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BookCardComponent,
    ScrollSentinelComponent,
    BookFilterComponent,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <app-book-filter />
    <div class="scroll-content">
      @if (store.isLoadingApi() && store.visibleBooks().length === 0) {
        <div class="loading-state">
          <mat-icon class="spinning">sync</mat-icon>
          <h3>Searching...</h3>
          <p>Fetching results from Google Books.</p>
        </div>
      } @else if (store.visibleBooks().length === 0 && store.searchQuery()) {
        <div class="empty-state">
          <mat-icon>search_off</mat-icon>
          <h3>No books match "{{ store.searchQuery() }}"</h3>
          <p>Try a different search term or check your collection.</p>
        </div>
      } @else if (store.books().length === 0 && !store.isLoadingApi()) {
        <div class="empty-state">
          <mat-icon>library_books</mat-icon>
          <h3>Your library is empty</h3>
          <p>Add your first book to get started.</p>
          <button mat-raised-button color="primary" (click)="openAddDialog()">
            <mat-icon>add</mat-icon>
            Add First Book
          </button>
        </div>
      } @else {
        <div class="book-grid">
          @for (book of store.visibleBooks(); track book.id) {
            <app-book-card [book]="book" />
          }
        </div>

        <app-scroll-sentinel (loadMore)="store.loadNextPage()" />
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .scroll-content {
      flex: 1;
      overflow-y: auto;
      padding-inline-end: 12px;
      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 3px;
        &:hover { background: var(--text-disabled); }
      }
    }

    .book-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 24px;
      padding-bottom: 60px;
      margin-top: 8px;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 100px 24px;
      text-align: center;
      color: var(--text-secondary);

      mat-icon {
        font-size: 64px;
        height: 64px;
        width: 64px;
        color: var(--color-primary);
        opacity: 0.2;
      }

      .spinning {
        animation: spin 2s linear infinite;
        opacity: 0.8;
      }

      h3 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
        letter-spacing: -0.01em;
      }
      
      p { 
        margin: 0;
        max-width: 400px;
        line-height: 1.6;
      }

      button {
        margin-top: 12px;
        font-weight: 600;
      }
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 500px) {
      .book-grid {
        grid-template-columns: 1;
        gap: 12px;
      }
      .loading-state, .empty-state {
        padding: 60px 16px;
      }
    }
  `,
})
export class BookListComponent {
  readonly store = inject(BookStoreService);
  private readonly dialog = inject(MatDialog);

  openAddDialog(): void {
    this.dialog.open(BookFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { book: null },
    });
  }
}
