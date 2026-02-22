import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { lastValueFrom, of } from 'rxjs';
import { Book } from '@models/book.model';
import { ViewMode } from '@enums/view-mode.enum';
import { SortField } from '@enums/sort-field.enum';
import { SortDirection } from '@enums/sort-direction.enum';
import { GoogleBooksService } from './google-books.service';

const SEED_BOOKS: Book[] = [
    {
        id: 'seed-1',
        catalogNumber: 'CS-001',
        title: 'Clean Code',
        authors: 'Robert C. Martin',
        publisher: 'Prentice Hall',
        publishedDate: '2008',
        description:
            'A Handbook of Agile Software Craftsmanship. Even bad code can function, but if code isn\'t clean, it can bring a development organization to its knees.',
        pageCount: 431,
        categories: 'Programming',
        thumbnail: 'https://books.google.com/books/content?id=hjEFCAAAQBAJ&printsec=frontcover&img=1&zoom=1',
        isCheckedOut: false,
        checkedOutBy: '',
        dueDate: '',
    },
    {
        id: 'seed-2',
        catalogNumber: 'CS-002',
        title: 'The Pragmatic Programmer',
        authors: 'David Thomas, Andrew Hunt',
        publisher: 'Addison-Wesley',
        publishedDate: '2019',
        description:
            'Your journey to mastery. From journeyman to master — the classic guide to software craftsmanship, fully updated for the modern era.',
        pageCount: 352,
        categories: 'Programming',
        thumbnail: 'https://books.google.com/books/content?id=LhOlDwAAQBAJ&printsec=frontcover&img=1&zoom=1',
        isCheckedOut: true,
        checkedOutBy: 'Alice Johnson',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    },
    {
        id: 'seed-3',
        catalogNumber: 'CS-003',
        title: 'Design Patterns',
        authors: 'Gang of Four',
        publisher: 'Addison-Wesley',
        publishedDate: '1994',
        description:
            'Elements of Reusable Object-Oriented Software. The foundational reference for software design patterns.',
        pageCount: 395,
        categories: 'Software Engineering',
        thumbnail: 'https://books.google.com/books/content?id=6oHuKQe3TjQC&printsec=frontcover&img=1&zoom=1',
        isCheckedOut: false,
        checkedOutBy: '',
        dueDate: '',
    },
    {
        id: 'seed-4',
        catalogNumber: 'CS-004',
        title: 'Refactoring',
        authors: 'Martin Fowler',
        publisher: 'Addison-Wesley',
        publishedDate: '2018',
        description: 'Improving the Design of Existing Code.',
        pageCount: 448,
        categories: 'Programming',
        thumbnail: 'https://books.google.com/books/content?id=NoS9AwAAQBAJ&printsec=frontcover&img=1&zoom=1',
        isCheckedOut: true,
        checkedOutBy: 'Bob Smith',
        dueDate: '2025-12-25', // Overdue relative to Feb 2026
    },
];

const STORAGE_KEY = 'books';
const BATCH_SIZE = 10;
const RESULTS_PER_PAGE = 20;

@Injectable({ providedIn: 'root' })
export class BookStoreService {
    private readonly snackBar = inject(MatSnackBar);
    private readonly googleBooks = inject(GoogleBooksService);

    // ─── Local library state ────────────────────────────────────────────────────
    readonly books = signal<Book[]>(this.loadFromStorage());

    // ─── Search & sort signals ──────────────────────────────────────────────────
    readonly searchQuery = signal('');
    readonly viewMode = signal<ViewMode>(ViewMode.INVENTORY);
    readonly inventorySortField = signal<SortField>(SortField.TITLE);
    readonly discoverSortField = signal<SortField>(SortField.RELEVANCE);
    readonly sortDirection = signal<SortDirection>(SortDirection.ASC);

    // ─── Local-mode infinite scroll ────────────────────────────────────────────
    readonly visibleCount = signal(BATCH_SIZE);

    private readonly searchResource = rxResource<Book[], { q: string, start: number, order: string }>({
        params: () => ({
            q: this.searchQuery().trim(),
            start: this.apiStartIndex(),
            order: this.discoverSortField()
        }),
        stream: ({ params }) => {
            if (!params.q || this.viewMode() !== ViewMode.DISCOVER) return of([] as Book[]);
            return this.googleBooks.searchBooks(params.q, RESULTS_PER_PAGE, params.start, params.order);
        }
    });

    private readonly accumulatedApiResults = signal<Book[]>([]);
    readonly isLoadingApi = this.searchResource.isLoading;
    private readonly apiHasMore = signal(false);
    readonly apiStartIndex = signal(0);

    // ─── Derived signals ────────────────────────────────────────────────────────

    readonly isApiMode = computed(() => this.viewMode() === ViewMode.DISCOVER && this.searchQuery().trim().length > 0);

    readonly filteredBooks = computed(() => {
        const query = this.searchQuery().trim().toLowerCase();
        const mode = this.viewMode();

        if (mode === ViewMode.INVENTORY) {
            const field = this.inventorySortField();
            const dir = this.sortDirection();
            let results = [...this.books()];

            if (query) {
                results = results.filter(b =>
                    b.title.toLowerCase().includes(query) ||
                    b.authors.toLowerCase().includes(query) ||
                    b.catalogNumber.toLowerCase().includes(query)
                );
            }

            return results.sort((a, b) => {
                const aVal = ((a as any)[field] ?? '').toString().toLowerCase();
                const bVal = ((b as any)[field] ?? '').toString().toLowerCase();
                return dir === SortDirection.ASC ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            });
        } else {
            const api = this.accumulatedApiResults();
            const local = this.books();

            return api.map(apiBook => {
                const localMatch = local.find(lb => lb.id === apiBook.id);
                return localMatch ? localMatch : apiBook;
            });
        }
    });

    readonly visibleBooks = computed(() =>
        this.isApiMode()
            ? this.filteredBooks()
            : this.filteredBooks().slice(0, this.visibleCount()),
    );

    readonly hasMore = computed(() =>
        this.isApiMode()
            ? this.isLoadingApi() || this.apiHasMore()
            : this.visibleCount() < this.filteredBooks().length,
    );

    constructor() {
        effect(() => {
            const response = this.searchResource.value();
            const q = this.searchQuery().trim();

            if (!q) {
                this.accumulatedApiResults.set([]);
                this.apiStartIndex.set(0);
                this.apiHasMore.set(false);
                return;
            }

            if (response && response.length > 0) {
                if (this.apiStartIndex() === 0) {
                    this.accumulatedApiResults.set(response);
                } else {
                    this.accumulatedApiResults.update(current => {
                        const existingIds = new Set(current.map(b => b.id));
                        const newBooks = response.filter(b => !existingIds.has(b.id));
                        return [...current, ...newBooks];
                    });
                }

                this.apiHasMore.set(response.length === RESULTS_PER_PAGE);
            }
        });

        effect(() => {
            this.viewMode();
            this.searchQuery.set('');
            this.inventorySortField.set(SortField.TITLE);
            this.discoverSortField.set(SortField.RELEVANCE);
            this.sortDirection.set(SortDirection.ASC);
            this.apiStartIndex.set(0);
            this.resetVisibleCount();
        });

        effect(() => {
            this.searchQuery();
            this.apiStartIndex.set(0);
        });
    }

    loadNextPage(): void {
        if (this.isApiMode()) {
            if (this.isLoadingApi() || !this.apiHasMore()) return;
            this.apiStartIndex.update(s => s + RESULTS_PER_PAGE);
        } else {
            this.visibleCount.update(n => n + BATCH_SIZE);
        }
    }

    resetVisibleCount(): void {
        this.visibleCount.set(BATCH_SIZE);
    }

    // ─── CRUD ──────────────────────────────────────────────────────────────────

    addBook(book: Book): void {
        this.books.update(current => [book, ...current]);
        this.persist();
        this.snackBar.open(`"${book.title}" added to library`, 'Dismiss', {
            duration: 3000,
            horizontalPosition: 'start',
            verticalPosition: 'bottom',
            panelClass: 'snack-success',

        });
    }

    updateBook(updated: Book): void {
        this.books.update(current =>
            current.map(b => (b.id === updated.id ? updated : b)),
        );
        this.persist();
        this.snackBar.open(`"${updated.title}" updated`, 'Dismiss', {
            duration: 3000,
            horizontalPosition: 'start',
            verticalPosition: 'bottom',
            panelClass: 'snack-info',
        });
    }

    deleteBook(id: string): void {
        const book = this.books().find(b => b.id === id);
        this.books.update(current => current.filter(b => b.id !== id));
        this.persist();
        if (book) {
            this.snackBar.open(`"${book.title}" removed from library`, 'Dismiss', {
                duration: 3000,
                horizontalPosition: 'start',
                verticalPosition: 'bottom',
                panelClass: 'snack-danger',
            });
        }
    }

    // ─── Lending ───────────────────────────────────────────────────────────────

    checkOut(id: string, borrower: string, dueDate: string): void {
        this.books.update(current =>
            current.map(b =>
                b.id === id ? { ...b, isCheckedOut: true, checkedOutBy: borrower, dueDate } : b,
            ),
        );
        this.persist();
        const book = this.books().find(b => b.id === id);
        this.snackBar.open(
            `"${book?.title}" checked out to ${borrower}`,
            'Dismiss',
            {
                duration: 3000,
                horizontalPosition: 'start',
                verticalPosition: 'bottom',
                panelClass: 'snack-warning',
            },
        );
    }

    checkIn(id: string): void {
        const book = this.books().find(b => b.id === id);
        this.books.update(current =>
            current.map(b =>
                b.id === id ? { ...b, isCheckedOut: false, checkedOutBy: '', dueDate: '' } : b,
            ),
        );
        this.persist();
        this.snackBar.open(`"${book?.title}" checked back in`, 'Dismiss', {
            duration: 3000,
            horizontalPosition: 'start',
            verticalPosition: 'bottom',
            panelClass: 'snack-success',
        });
    }

    isCatalogNumberTaken(catalogNumber: string, excludeId?: string): boolean {
        return this.books().some(
            b => b.catalogNumber === catalogNumber && b.id !== excludeId,
        );
    }

    isInLibrary(id: string): boolean {
        return this.books().some(b => b.id === id);
    }

    isOverdue(book: Book): boolean {
        if (!book.isCheckedOut || !book.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(book.dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
    }

    private persist(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.books()));
        } catch (err) {
            // Storage quota exceeded — silently ignore.
        }
    }

    private loadFromStorage(): Book[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as Book[]) : SEED_BOOKS;
        } catch {
            return SEED_BOOKS;
        }
    }
}
