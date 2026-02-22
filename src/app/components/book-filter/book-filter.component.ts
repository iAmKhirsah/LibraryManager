import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, effect, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { BookStoreService } from '@services/book-store.service';
import { ViewMode } from '@enums/view-mode.enum';
import { SortField } from '@enums/sort-field.enum';
import { SortDirection } from '@enums/sort-direction.enum';

interface SortOption {
  label: string;
  value: SortField;
}

@Component({
  selector: 'app-book-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  template: `
    <div class="filter-header" [class.scrolled]="isScrolled()">
      <div class="controls-grid">
        <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
          <mat-label>{{ store.viewMode() === ViewMode.INVENTORY ? 'Search Inventory' : 'Search Google Books' }}</mat-label>
          <input matInput [formControl]="searchControl" placeholder="Type to search..." />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <div class="sort-group">
          <mat-form-field appearance="outline" class="sort-field" subscriptSizing="dynamic">
            <mat-label>{{ store.viewMode() === ViewMode.INVENTORY ? 'Sort Inventory' : 'Sort by' }}</mat-label>
            <mat-select [value]="currentSortField()" (selectionChange)="onSortChange($event.value)">
              @for (opt of sortOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <div class="dir-toggle-wrap">
            @if (store.viewMode() === ViewMode.INVENTORY) {
              <button mat-icon-button (click)="toggleSortDir()" [matTooltip]="store.sortDirection() === SortDirection.ASC ? 'Ascending' : 'Descending'">
                <mat-icon>{{ store.sortDirection() === SortDirection.ASC ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </button>
            }
          </div>
        </div>
      </div>

      <div class="tabs-row">
        <mat-button-toggle-group [value]="store.viewMode()" (change)="store.viewMode.set($event.value)" class="subtle-tabs" hideSingleSelectionIndicator>
          <mat-button-toggle [value]="ViewMode.INVENTORY">
            <mat-icon>inventory_2</mat-icon>
            Inventory
          </mat-button-toggle>
          <mat-button-toggle [value]="ViewMode.DISCOVER">
            <mat-icon>travel_explore</mat-icon>
            Discover
          </mat-button-toggle>
        </mat-button-toggle-group>

        <span class="spacer"></span>

        <div class="stats-box">
          <p class="stats">
            @if (store.viewMode() === ViewMode.INVENTORY) {
              Showing <strong>{{ store.visibleBooks().length }}</strong> of <strong>{{ store.filteredBooks().length }}</strong> books
              @if (store.filteredBooks().length !== store.books().length) {
                <span class="muted">(from {{ store.books().length }} total)</span>
              }
            } @else {
              <strong>{{ store.visibleBooks().length }}</strong> results
            }
          </p>
        </div>
      </div>

      @if (store.isLoadingApi()) {
        <mat-progress-bar mode="indeterminate" class="loading-bar"></mat-progress-bar>
      }
    </div>
  `,
  styles: `
    .filter-header {
      background-color: var(--bg-section);
      z-index: 100;
      padding: 16px 24px;
      margin-bottom: 8px;
      border-bottom: 1px solid var(--border);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: box-shadow var(--transition), padding var(--transition);

      &.scrolled {
        box-shadow: var(--shadow-md);
      }
    }

    .controls-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      align-items: center;
    }

    .tabs-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .subtle-tabs {
      border: 1px solid var(--border);
      background: var(--bg-app);
      border-radius: var(--radius-sm);
      overflow: hidden;

      ::ng-deep .mat-button-toggle-button {
        .mat-button-toggle-focus-indicator {
          display: none;
        }
      }
      
      mat-button-toggle {
        height: 38px;
        line-height: 38px;
        padding: 0 4px;
        font-size: 0.875rem;
        color: var(--text-secondary);
        border-color: var(--border);
        transition: color var(--transition), background-color var(--transition), box-shadow var(--transition);

        &.mat-button-toggle-checked {
          background-color: var(--bg-card);
          color: var(--color-primary);
          font-weight: 600;
          box-shadow: inset 0 -2px 0 var(--color-primary);
        }
        
        mat-icon {
          font-size: 20px;
          height: 20px;
          width: 20px;
          margin-right: 8px;
          vertical-align: middle;
        }
      }
    }

    .spacer { flex: 1; }

    .sort-group {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 260px;
    }

    .dir-toggle-wrap {
      width: 40px;
      display: flex;
      justify-content: center;
    }

    .search-field {
      flex: 1;
    }
    
    .sort-field {
      flex: 1;
    }

    .stats {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin: 0;
      white-space: nowrap;
      padding: 4px 12px;
      background: var(--bg-app);
      border-radius: 999px;
      border: 1px solid var(--border);
    }

    .muted {
      color: var(--text-muted, #888);
      font-size: 0.85rem;
      margin-left: 4px;
    }

    .loading-bar {
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
    }

    @media (max-width: 900px) {
      .filter-header {
        top: 0;
      }
      .controls-grid {
        grid-template-columns: 1fr;
      }
      .sort-group {
        min-width: 0;
      }
    }
    
    @media (max-width: 480px) {
      .subtle-tabs mat-button-toggle mat-icon {
        display: none;
      }
    }
  `,
})
export class BookFilterComponent implements OnInit, OnDestroy {
  readonly store = inject(BookStoreService);
  private readonly destroy$ = new Subject<void>();

  readonly searchControl = new FormControl('');
  readonly isScrolled = signal(false);

  readonly ViewMode = ViewMode;
  readonly SortField = SortField;
  readonly SortDirection = SortDirection;

  private readonly inventoryOptions: SortOption[] = [
    { label: 'Title', value: SortField.TITLE },
    { label: 'Author', value: SortField.AUTHORS },
    { label: 'Year', value: SortField.DATE },
    { label: 'Catalog #', value: SortField.CATALOG },
  ];

  private readonly discoverOptions: SortOption[] = [
    { label: 'Relevance', value: SortField.RELEVANCE },
    { label: 'Newest', value: SortField.NEWEST },
  ];

  readonly sortOptions = computed(() =>
    this.store.viewMode() === ViewMode.INVENTORY ? this.inventoryOptions : this.discoverOptions
  );

  readonly currentSortField = computed(() =>
    this.store.viewMode() === ViewMode.INVENTORY ? this.store.inventorySortField() : this.store.discoverSortField()
  );


  constructor() {
    effect(() => {
      const q = this.store.searchQuery();
      if (this.searchControl.value !== q) {
        this.searchControl.setValue(q, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => {
        this.store.searchQuery.set(value ?? '');
        this.store.resetVisibleCount();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSortChange(value: SortField): void {
    if (this.store.viewMode() === ViewMode.INVENTORY) {
      this.store.inventorySortField.set(value);
    } else {
      this.store.discoverSortField.set(value);
    }
  }

  toggleSortDir(): void {
    this.store.sortDirection.update(d => (d === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC));
    this.store.resetVisibleCount();
  }
}