import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { Book } from '@models/book.model';
import { BookStoreService } from '@services/book-store.service';

export interface LendingFormData {
  book: Book;
}

@Component({
  selector: 'app-lending-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="form-title">
      Check Out Book
      <span class="subtitle">{{ data.book.title }}</span>
    </h2>

    <mat-dialog-content class="form-content">
      <form [formGroup]="form" class="lending-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Borrower Name</mat-label>
          <input matInput formControlName="borrower" placeholder="Name of the person" />
          <mat-icon matPrefix>person</mat-icon>
          @if (form.get('borrower')?.hasError('required') && form.get('borrower')?.touched) {
            <mat-error>Borrower name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Due Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="dueDate" [min]="minDate" placeholder="Select date" (click)="picker.open()"/>
          <mat-icon matPrefix>calendar_today</mat-icon>
          <mat-datepicker-toggle matSuffix [for]="picker" />
          <mat-datepicker #picker />
          @if (form.get('dueDate')?.hasError('required') && form.get('dueDate')?.touched) {
            <mat-error>Due date is required</mat-error>
          }
          @if (form.get('dueDate')?.hasError('matDatepickerMin') && form.get('dueDate')?.touched) {
            <mat-error>Due date must be in the future</mat-error>
          }
          @if (form.get('dueDate')?.hasError('matDatepickerParse') && form.get('dueDate')?.touched) {
            <mat-error>Invalid date format</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="form-actions">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="form.invalid" class="submit-btn">
        Confirm Check Out
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
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .form-content {
      padding: 0 24px 24px !important;
    }

    .lending-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 12px;
    }

    .full-width { width: 100%; }

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
  `,
})
export class LendingFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<LendingFormComponent>);
  private readonly store = inject(BookStoreService);
  readonly data = inject<LendingFormData>(MAT_DIALOG_DATA);
  readonly minDate = new Date();

  readonly form = this.fb.group({
    borrower: ['', Validators.required],
    dueDate: [null as Date | null, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    const { borrower, dueDate } = this.form.getRawValue();
    const dueDateStr = dueDate ? this.toLocalDateString(dueDate as Date) : '';
    this.store.checkOut(this.data.book.id, borrower ?? '', dueDateStr);
    this.dialogRef.close();
  }

  private toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
