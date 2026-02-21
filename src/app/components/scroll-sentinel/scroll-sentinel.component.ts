import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { BookStoreService } from '@services/book-store.service';
import { ViewMode } from '@enums/view-mode.enum';

@Component({
  selector: 'app-scroll-sentinel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, MatIconModule],
  template: `
    <div #sentinel class="sentinel" aria-hidden="true">
      @if (store.hasMore()) {
        <mat-spinner diameter="32" />
      } @else if (!store.isApiMode() && store.viewMode() === ViewMode.DISCOVER) {
        <p class="end-message hint">
          <mat-icon>travel_explore</mat-icon>
          Search Google Books to discover titles
        </p>
      } @else if (store.filteredBooks().length > 0) {
        <p class="end-message">You've seen all <strong>{{ store.filteredBooks().length }}</strong> books</p>
      }
    </div>
  `,
  styles: `
    .sentinel {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 32px;
      min-height: 80px;
    }
    .end-message {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;

      &.hint {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-muted);

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          opacity: 0.6;
        }
      }
    }
  `,
})
export class ScrollSentinelComponent implements OnDestroy {
  readonly store = inject(BookStoreService);
  readonly loadMore = output<void>();
  protected readonly ViewMode = ViewMode;
  private readonly sentinelRef = viewChild<ElementRef<HTMLElement>>('sentinel');
  private observer: IntersectionObserver | null = null;

  private readonly isIntersecting = signal(false);

  constructor() {
    afterNextRender(() => {
      const el = this.sentinelRef()?.nativeElement;
      if (!el) return;

      this.observer = new IntersectionObserver(
        entries => {
          this.isIntersecting.set(entries[0].isIntersecting);
        },
        { threshold: 0.1 },
      );
      this.observer.observe(el);
    });

    effect(() => {
      if (this.isIntersecting() && this.store.hasMore()) {
        this.loadMore.emit();
      }
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
