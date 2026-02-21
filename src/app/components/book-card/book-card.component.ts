import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Book } from '@models/book.model';
import { BookStoreService } from '@services/book-store.service';
import { BookDetailComponent } from '@components/book-detail/book-detail.component';
import { BookFormComponent } from '@components/book-form/book-form.component';
import { LendingFormComponent } from '@components/lending-form/lending-form.component';

@Component({
  selector: 'app-book-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <mat-card class="book-card" (click)="openDetail()" tabindex="0"
      (keydown.enter)="openDetail()" role="article" [attr.aria-label]="book().title">
      <div class="card-cover">
        @if (book().thumbnail) {
          <img [src]="book().thumbnail" [alt]="book().title + ' cover'" loading="lazy" />
        } @else {
          <div class="no-cover">
            <mat-icon>menu_book</mat-icon>
          </div>
        }

        <div class="status-badge" 
          [class.checked-out]="book().isCheckedOut" 
          [class.available]="store.isInLibrary(book().id) && !book().isCheckedOut"
          [class.global]="!store.isInLibrary(book().id)">
          @if (store.isInLibrary(book().id)) {
            <mat-icon>{{ book().isCheckedOut ? 'person' : 'check_circle' }}</mat-icon>
            {{ book().isCheckedOut ? 'Checked Out' : 'Available' }}
          } @else {
            <mat-icon>public</mat-icon>
            External
          }
        </div>
        @if (book().isCheckedOut && store.isOverdue(book())) {
          <div class="status-badge overdue">
            <mat-icon>priority_high</mat-icon>
            Overdue
          </div>
        }
      </div>

      <mat-card-content class="card-body">
        <h3 class="book-title" [matTooltip]="book().title">{{ book().title }}</h3>
        <p class="book-authors">{{ book().authors }}</p>
        <div class="card-footer">
          <p class="catalog-num">#{{ book().catalogNumber }}</p>
          @if (book().publishedDate) {
            <p class="book-meta">{{ book().publishedDate }}</p>
          }
        </div>
      </mat-card-content>

      <mat-card-actions class="card-actions" (click)="$event.stopPropagation()">
        @if (store.isInLibrary(book().id)) {
          <button mat-icon-button (click)="openDetail()" matTooltip="View details" aria-label="View book details">
            <mat-icon>visibility</mat-icon>
          </button>
          <button mat-icon-button (click)="openEdit()" matTooltip="Edit" aria-label="Edit book">
            <mat-icon>edit</mat-icon>
          </button>
          @if (book().isCheckedOut) {
            <button mat-icon-button (click)="checkIn()" matTooltip="Check in" aria-label="Check in book" class="status-btn">
              <mat-icon>assignment_return</mat-icon>
            </button>
          } @else {
            <button mat-icon-button (click)="openLending()" matTooltip="Check out" aria-label="Check out book" class="status-btn">
              <mat-icon>assignment_ind</mat-icon>
            </button>
          }
          <span class="spacer"></span>
          <button mat-icon-button color="warn" (click)="delete()" matTooltip="Delete" aria-label="Delete book">
            <mat-icon>delete</mat-icon>
          </button>
        } @else {
          <button mat-button color="primary" (click)="openDetail()">
            <mat-icon>visibility</mat-icon>
            Details
          </button>
          <span class="spacer"></span>
          <button mat-flat-button color="primary" (click)="addToLibrary()">
            <mat-icon>library_add</mat-icon>
            Add
          </button>
        }
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    .book-card {
      cursor: pointer;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--border) !important;
      background: var(--bg-card);

      &:hover, &:focus-visible {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md) !important;
        border-color: var(--color-primary) !important;
      }
    }

    .card-cover {
      position: relative;
      height: 180px;
      overflow: hidden;
      background: var(--bg-section);
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 12px;
        transition: transform 0.3s ease;
      }

      .no-cover {
        mat-icon { font-size: 48px; color: var(--text-disabled); }
      }
    }

    .book-card:hover img {
      transform: scale(1.05);
    }

    .status-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      background: var(--color-primary-lt);
      color: var(--color-primary);
      border: 1px solid var(--color-primary);

      mat-icon { font-size: 14px; width: 14px; height: 14px; }

      &.available {
        background: var(--color-success-lt);
        color: var(--color-success);
        border: 1px solid var(--color-success);
      }

      &.checked-out {
        background: var(--color-warning-lt);
        color: var(--color-warning);
        border: 1px solid var(--color-warning);
      }

      &.global {
        background: var(--color-external-lt);
        color: var(--color-external);
        border: 1px solid var(--color-external);
      }

      &.overdue {
        top: 40px;
        background: var(--color-danger-lt);
        color: var(--color-danger);
        border: 1px solid var(--color-danger);
      }
    }

    .card-body {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .book-title {
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.3;
      color: var(--text-primary);
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .book-authors {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .card-footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .book-meta, .catalog-num {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    .card-actions {
      padding: 8px 12px;
      border-top: 1px solid var(--border);
      background: var(--bg-section);
      opacity: 0.9;
    }

    .spacer { flex: 1; }

    .status-btn {
      color: var(--color-primary);
    }
  `,
})
export class BookCardComponent {
  readonly book = input.required<Book>();
  readonly store = inject(BookStoreService);
  private readonly dialog = inject(MatDialog);

  openDetail(): void {
    this.dialog.open(BookDetailComponent, {
      width: '640px',
      maxWidth: '95vw',
      data: { book: this.book() },
    });
  }

  openEdit(): void {
    this.dialog.open(BookFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { book: this.book() },
    });
  }

  openLending(): void {
    this.dialog.open(LendingFormComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: { book: this.book() },
    });
  }

  checkIn(): void {
    this.store.checkIn(this.book().id);
  }

  delete(): void {
    this.store.deleteBook(this.book().id);
  }

  addToLibrary(): void {
    this.store.addBook(this.book());
  }
}
