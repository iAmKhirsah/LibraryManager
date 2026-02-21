import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Book } from '@models/book.model';
import { BookStoreService } from '@services/book-store.service';

export interface BookFormData {
  book: Book | null;
}

@Component({
  selector: 'app-book-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="form-title">
      {{ isEdit ? 'Edit Book' : 'Add New Book' }}
      <span class="subtitle">Enter the details of the book below</span>
    </h2>

    <mat-dialog-content class="form-content">
      <form [formGroup]="form" (ngSubmit)="submit()" class="book-form">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" placeholder="e.g. Clean Code" />
          <mat-icon matPrefix>title</mat-icon>
          @if (form.get('title')?.hasError('required') && form.get('title')?.touched) {
            <mat-error>Title is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Author(s)</mat-label>
          <input matInput formControlName="authors" placeholder="e.g. Robert C. Martin" />
          <mat-icon matPrefix>person</mat-icon>
          @if (form.get('authors')?.hasError('required') && form.get('authors')?.touched) {
            <mat-error>At least one author is required</mat-error>
          }
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Catalog Number</mat-label>
            <input matInput formControlName="catalogNumber" placeholder="CS-001" />
            <mat-icon matPrefix>tag</mat-icon>
            @if (form.get('catalogNumber')?.hasError('required') && form.get('catalogNumber')?.touched) {
              <mat-error>Required</mat-error>
            }
            @if (form.get('catalogNumber')?.hasError('catalogTaken')) {
              <mat-error>Already in use</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Published Year</mat-label>
            <input matInput formControlName="publishedDate" placeholder="2026 or 2026-03-15" />
            <mat-icon matPrefix>event</mat-icon>
            @if (form.get('publishedDate')?.hasError('invalidDate')) {
              <mat-error>Use 2026 or 2026-03-15</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Publisher</mat-label>
            <input matInput formControlName="publisher" />
            <mat-icon matPrefix>business</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Page Count</mat-label>
            <input matInput formControlName="pageCount" type="number" min="1" />
            <mat-icon matPrefix>description</mat-icon>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Categories</mat-label>
          <input matInput formControlName="categories" placeholder="Separated by commas" />
          <mat-icon matPrefix>category</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cover Image URL</mat-label>
          <input matInput formControlName="thumbnail" placeholder="https://..." />
          <mat-icon matPrefix>image</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="form-actions">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="form.invalid" class="submit-btn">
        {{ isEdit ? 'Update Book' : 'Add to Collection' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .form-title {
      padding: 24px 24px 16px;
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      display: flex;
      flex-direction: column;
      gap: 4px;

      .subtitle {
        font-size: 0.85rem;
        font-weight: 400;
        color: var(--text-secondary);
      }
    }

    .form-content {
      padding: 0 24px 24px !important;
    }

    .book-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 12px;
    }

    .full-width {
      width: 100%;
    }

    .row {
      display: flex;
      gap: 16px;
    }

    .flex-1 {
      flex: 1;
    }

    .submit-btn {
      font-weight: 600;
      border-radius: var(--radius-sm);
    }

    mat-icon[matPrefix] {
      margin-right: 8px;
      color: var(--text-muted);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    @media (max-width: 600px) {
      .row {
        flex-direction: column;
        gap: 8px;
      }
    }
  `,
})
export class BookFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<BookFormComponent>);
  private readonly store = inject(BookStoreService);
  readonly data = inject<BookFormData>(MAT_DIALOG_DATA);

  get isEdit(): boolean {
    return this.data.book !== null;
  }

  form = this.fb.group({
    title: ['', Validators.required],
    authors: ['', Validators.required],
    catalogNumber: ['', [Validators.required], [this.catalogValidator.bind(this)]],
    publishedDate: ['', [this.publishedDateValidator]],
    publisher: [''],
    pageCount: [null as number | null, [Validators.min(1)]],
    categories: [''],
    thumbnail: [''],
    description: [''],
  });

  ngOnInit(): void {
    if (this.data.book) {
      this.form.patchValue({
        ...this.data.book,
        pageCount: this.data.book.pageCount,
      });
    }
  }

  private async catalogValidator(control: AbstractControl): Promise<ValidationErrors | null> {
    const taken = this.store.isCatalogNumberTaken(control.value, this.data.book?.id);
    return taken ? { catalogTaken: true } : null;
  }

  publishedDateValidator(control: AbstractControl): ValidationErrors | null {
    const val = control.value;
    if (!val) return null;

    if (/^\d{4}$/.test(val)) {
      const year = parseInt(val);
      return year >= 1000 && year <= 2099 ? null : { invalidDate: true };
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const date = new Date(val);
      return !isNaN(date.getTime()) ? null : { invalidDate: true };
    }

    return { invalidDate: true };
  }

  submit(): void {
    if (this.form.invalid) return;

    const values = this.form.getRawValue();
    const existing = this.data.book;

    const book: Book = {
      id: existing?.id ?? crypto.randomUUID(),
      catalogNumber: values.catalogNumber ?? '',
      title: values.title ?? '',
      authors: values.authors ?? '',
      publisher: values.publisher ?? '',
      publishedDate: values.publishedDate ?? '',
      description: values.description ?? '',
      pageCount: values.pageCount ?? null,
      categories: values.categories ?? '',
      thumbnail: values.thumbnail ?? '',
      isCheckedOut: existing?.isCheckedOut ?? false,
      checkedOutBy: existing?.checkedOutBy ?? '',
      dueDate: existing?.dueDate ?? '',
    };

    if (existing) {
      this.store.updateBook(book);
    } else {
      this.store.addBook(book);
    }

    this.dialogRef.close();
  }
}
