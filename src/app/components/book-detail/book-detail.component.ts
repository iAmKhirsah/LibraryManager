import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Book } from '@models/book.model';
import { BookStoreService } from '@services/book-store.service';
import { BookFormComponent } from '@components/book-form/book-form.component';
import { LendingFormComponent } from '@components/lending-form/lending-form.component';
import { ViewMode } from '@enums/view-mode.enum';

export interface BookDetailData {
  book: Book;
}

@Component({
  selector: 'app-book-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <div class="detail-header">
      <div class="cover-wrap">
        @if (book.thumbnail) {
          <img [src]="book.thumbnail" [alt]="book.title + ' cover'" class="cover" />
        } @else {
          <div class="cover-placeholder">
            <mat-icon>menu_book</mat-icon>
          </div>
        }
      </div>
      <div class="meta">
        <h2 mat-dialog-title class="book-title">{{ book.title }}</h2>
        <p class="authors">{{ book.authors }}</p>
        
        <div class="status-chips">
          @if (store.isInLibrary(book.id)) {
            @if (book.isCheckedOut) {
              <span class="status-badge checked-out">
                <mat-icon>person</mat-icon>
                Checked out · {{ book.checkedOutBy }}, due date · {{book.dueDate}}
              </span>
              @if (store.isOverdue(book)) {
                <span class="status-badge overdue">
                  <mat-icon>priority_high</mat-icon>
                  Overdue
                </span>
              }
            } @else {
              <span class="status-badge available">
                <mat-icon>check_circle</mat-icon>
                Available
              </span>
            }
          } @else {
            <span class="status-badge external">
              <mat-icon>public</mat-icon>
              External Title
            </span>
          }
        </div>

        <div class="meta-chips">
          @if (book.categories) {
            <span class="meta-chip">{{ book.categories }}</span>
          }
          @if (book.publishedDate) {
            <span class="meta-chip">{{ book.publishedDate }}</span>
          }
          @if (book.pageCount) {
            <span class="meta-chip">{{ book.pageCount }} pages</span>
          }
          @if (book.catalogNumber) {
            <span class="meta-chip">Cat# {{ book.catalogNumber }}</span>
          }
        </div>
      </div>
    </div>

    <mat-divider />

    <mat-dialog-content class="description">
      <h4 class="section-title">Description</h4>
      @if (book.description) {
        <p>{{ book.description }}</p>
      } @else {
        <p class="empty-desc">No description available for this title.</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="actions">
      @if (store.isInLibrary(book.id)) {
        @if (book.isCheckedOut) {
          <button mat-stroked-button color="warn" (click)="checkIn()">
            <mat-icon>assignment_return</mat-icon>
            Check In
          </button>
        } @else {
          <button mat-flat-button color="primary" (click)="openLending()">
            <mat-icon>assignment_ind</mat-icon>
            Check Out
          </button>
        }
      }

      <span class="flex-spacer"></span>
      
      <button mat-button mat-dialog-close>Close</button>
      
      @if (!store.isInLibrary(book.id)) {
        <button mat-flat-button color="primary" (click)="addToLibrary()">
          <mat-icon>library_add</mat-icon>
          Add
        </button>
      }

      @if (store.viewMode() === ViewMode.INVENTORY) {
        <button mat-icon-button (click)="openEdit()" matTooltip="Edit Book">
          <mat-icon>edit</mat-icon>
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: `
    .detail-header {
      display: flex;
      gap: 32px;
      padding: 32px;
    }

    .cover-wrap {
      flex-shrink: 0;
    }

    .cover {
      width: 140px;
      border-radius: var(--radius-md);
      object-fit: contain;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      background: var(--bg-section);
      padding: 8px;
    }

    .cover-placeholder {
      width: 140px;
      height: 200px;
      border-radius: var(--radius-md);
      background: var(--bg-section);
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 64px; color: var(--text-disabled); }
    }

    .meta {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .book-title {
      font-size: 1.75rem;
      font-weight: 800;
      line-height: 1.2;
      margin: 0;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .authors {
      color: var(--text-secondary);
      font-size: 1.1rem;
      font-weight: 500;
      margin: 0;
    }

    .status-chips {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      
      mat-icon { font-size: 18px; width: 18px; height: 18px; }

      &.available {
        background: var(--color-success-lt);
        color: var(--color-success);
        border: 1px solid var(--color-success);
        opacity: 0.85;
      }

      &.checked-out {
        background: var(--color-warning-lt);
        color: var(--color-warning);
        border: 1px solid var(--color-warning);
        opacity: 0.85;
      }

      &.overdue {
        background: var(--color-danger-lt);
        color: var(--color-danger);
        border: 1px solid var(--color-danger);
      }

      &.external {
        background: var(--color-external-lt);
        color: var(--color-external);
        border: 1px solid var(--color-external);
        opacity: 0.85;
      }
    }

    .meta-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .meta-chip {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      background: var(--bg-app);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
    }

    .section-title {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin: 0 0 12px;
    }

    .description {
      line-height: 1.7;
      color: var(--text-secondary);
      padding: 24px 32px;
      font-size: 1rem;
    }

    .empty-desc {
      font-style: italic;
      opacity: 0.7;
    }

    .flex-spacer {
      flex: 1;
    }
    
    @media (max-width: 600px) {
      .detail-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 24px;
        gap: 20px;
      }
      .meta { align-items: center; }
      .meta-chips { justify-content: center; }
    }
  `,
})
export class BookDetailComponent {
  private readonly dialogRef = inject(MatDialogRef<BookDetailComponent>);
  private readonly dialog = inject(MatDialog);
  readonly ViewMode = ViewMode;
  readonly store = inject(BookStoreService);
  readonly data = inject<BookDetailData>(MAT_DIALOG_DATA);

  get book(): Book {
    return this.data.book;
  }

  openEdit(): void {
    this.dialogRef.close();
    this.dialog.open(BookFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { book: this.book },
    });
  }

  openLending(): void {
    this.dialogRef.close();
    this.dialog.open(LendingFormComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: { book: this.book },
    });
  }

  checkIn(): void {
    this.store.checkIn(this.book.id);
    this.dialogRef.close();
  }

  addToLibrary(): void {
    this.store.addBook(this.book);
    this.dialogRef.close();
  }
}
