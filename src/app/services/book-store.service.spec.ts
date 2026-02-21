import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BookStoreService } from './book-store.service';
import { Book } from '@models/book.model';
import { ViewMode } from '@enums/view-mode.enum';
import { SortField } from '@enums/sort-field.enum';
import { SortDirection } from '@enums/sort-direction.enum';

function makeBook(overrides: Partial<Book> = {}): Book {
    return {
        id: crypto.randomUUID(),
        catalogNumber: 'TEST-001',
        title: 'Test Book',
        authors: 'Test Author',
        publisher: 'Test Publisher',
        publishedDate: '2024',
        description: '',
        pageCount: 100,
        categories: 'Fiction',
        thumbnail: '',
        isCheckedOut: false,
        checkedOutBy: '',
        dueDate: '',
        ...overrides,
    };
}

const snackBarSpy = { open: vi.fn() };

describe('BookStoreService', () => {
    let service: BookStoreService;

    beforeEach(() => {
        localStorage.clear();

        TestBed.configureTestingModule({
            providers: [
                BookStoreService,
                { provide: MatSnackBar, useValue: snackBarSpy },
            ],
        });

        service = TestBed.inject(BookStoreService);
        service.books.set([]);
    });

    describe('addBook', () => {
        it('adds a book to the library', () => {
            const book = makeBook({ title: 'Clean Code' });
            service.addBook(book);
            expect(service.books()).toContain(book);
        });

        it('prepends the new book to the top of the list', () => {
            const first = makeBook({ catalogNumber: 'A', title: 'First' });
            const second = makeBook({ catalogNumber: 'B', title: 'Second' });
            service.addBook(first);
            service.addBook(second);
            expect(service.books()[0].title).toBe('Second');
        });
    });

    describe('updateBook', () => {
        it('replaces the matching book with the updated version', () => {
            const original = makeBook({ title: 'Old Title' });
            service.books.set([original]);

            service.updateBook({ ...original, title: 'New Title' });

            expect(service.books().find(b => b.id === original.id)?.title).toBe('New Title');
        });

        it('does not change the list length', () => {
            const book = makeBook();
            service.books.set([book]);
            service.updateBook({ ...book, title: 'Changed' });
            expect(service.books().length).toBe(1);
        });
    });

    describe('deleteBook', () => {
        it('removes the target book from the library', () => {
            const book = makeBook();
            service.books.set([book]);
            service.deleteBook(book.id);
            expect(service.books()).not.toContain(book);
        });

        it('leaves other books intact', () => {
            const a = makeBook({ id: 'a', catalogNumber: 'A-001' });
            const b = makeBook({ id: 'b', catalogNumber: 'B-001' });
            service.books.set([a, b]);
            service.deleteBook('a');
            expect(service.books().length).toBe(1);
            expect(service.books()[0].id).toBe('b');
        });
    });

    describe('isCatalogNumberTaken', () => {
        it('returns true when another book owns that catalog number', () => {
            service.books.set([makeBook({ id: 'x', catalogNumber: 'CS-001' })]);
            expect(service.isCatalogNumberTaken('CS-001')).toBe(true);
        });

        it('returns false when the matching book is the one being edited (excludeId)', () => {
            service.books.set([makeBook({ id: 'x', catalogNumber: 'CS-001' })]);
            expect(service.isCatalogNumberTaken('CS-001', 'x')).toBe(false);
        });

        it('returns false when no book has that catalog number', () => {
            service.books.set([makeBook({ catalogNumber: 'CS-001' })]);
            expect(service.isCatalogNumberTaken('CS-999')).toBe(false);
        });
    });

    describe('filteredBooks — Inventory mode', () => {
        beforeEach(() => {
            service.viewMode.set(ViewMode.INVENTORY);
            service.books.set([
                makeBook({ title: 'Clean Code', authors: 'Martin', catalogNumber: 'CS-001' }),
                makeBook({ title: 'Design Patterns', authors: 'GoF', catalogNumber: 'CS-002' }),
                makeBook({ title: 'The Pragmatic Programmer', authors: 'Thomas', catalogNumber: 'CS-003' }),
            ]);
        });

        it('returns all books when the query is empty', () => {
            service.searchQuery.set('');
            expect(service.filteredBooks().length).toBe(3);
        });

        it('filters by title (case-insensitive)', () => {
            service.searchQuery.set('clean');
            expect(service.filteredBooks().length).toBe(1);
            expect(service.filteredBooks()[0].title).toBe('Clean Code');
        });

        it('filters by author', () => {
            service.searchQuery.set('gof');
            expect(service.filteredBooks().length).toBe(1);
            expect(service.filteredBooks()[0].title).toBe('Design Patterns');
        });

        it('filters by catalog number', () => {
            service.searchQuery.set('CS-003');
            expect(service.filteredBooks().length).toBe(1);
            expect(service.filteredBooks()[0].title).toBe('The Pragmatic Programmer');
        });

        it('returns empty array when nothing matches', () => {
            service.searchQuery.set('xyzzy');
            expect(service.filteredBooks().length).toBe(0);
        });
    });

    describe('sorting — Inventory mode', () => {
        beforeEach(() => {
            service.viewMode.set(ViewMode.INVENTORY);
            service.searchQuery.set('');
            service.books.set([
                makeBook({ title: 'Banana', authors: 'Zebra', catalogNumber: 'C' }),
                makeBook({ title: 'Apple', authors: 'Mango', catalogNumber: 'A' }),
                makeBook({ title: 'Cherry', authors: 'Ant', catalogNumber: 'B' }),
            ]);
        });

        it('sorts by title ascending', () => {
            service.inventorySortField.set(SortField.TITLE);
            service.sortDirection.set(SortDirection.ASC);
            expect(service.filteredBooks().map(b => b.title)).toEqual(['Apple', 'Banana', 'Cherry']);
        });

        it('sorts by title descending', () => {
            service.inventorySortField.set(SortField.TITLE);
            service.sortDirection.set(SortDirection.DESC);
            expect(service.filteredBooks().map(b => b.title)).toEqual(['Cherry', 'Banana', 'Apple']);
        });

        it('sorts by author ascending', () => {
            service.inventorySortField.set(SortField.AUTHORS);
            service.sortDirection.set(SortDirection.ASC);
            expect(service.filteredBooks().map(b => b.authors)).toEqual(['Ant', 'Mango', 'Zebra']);
        });

        it('sorts by catalog number ascending', () => {
            service.inventorySortField.set(SortField.CATALOG);
            service.sortDirection.set(SortDirection.ASC);
            expect(service.filteredBooks().map(b => b.catalogNumber)).toEqual(['A', 'B', 'C']);
        });
    });

    describe('visibleBooks / hasMore — Inventory mode', () => {
        beforeEach(() => {
            service.viewMode.set(ViewMode.INVENTORY);
            service.searchQuery.set('');
            service.books.set(
                Array.from({ length: 12 }, (_, i) =>
                    makeBook({ id: `book-${i}`, catalogNumber: `CAT-${String(i).padStart(3, '0')}`, title: `Book ${i}` }),
                ),
            );
            service.resetVisibleCount();
        });

        it('exposes only the first batch initially', () => {
            expect(service.visibleBooks().length).toBe(10);
        });

        it('hasMore is true when more books exist beyond the visible window', () => {
            expect(service.hasMore()).toBe(true);
        });

        it('shows all books after loadNextPage()', () => {
            service.loadNextPage();
            expect(service.visibleBooks().length).toBe(12);
        });

        it('hasMore becomes false once all books are visible', () => {
            service.loadNextPage();
            expect(service.hasMore()).toBe(false);
        });
    });

    describe('checkOut', () => {
        it('marks the book as checked out with borrower and due date', () => {
            const book = makeBook({ id: 'lend-1' });
            service.books.set([book]);
            service.checkOut('lend-1', 'Alice', '2026-03-01');

            const updated = service.books().find(b => b.id === 'lend-1')!;
            expect(updated.isCheckedOut).toBe(true);
            expect(updated.checkedOutBy).toBe('Alice');
            expect(updated.dueDate).toBe('2026-03-01');
        });
    });

    describe('checkIn', () => {
        it('clears the checkout state', () => {
            const book = makeBook({ id: 'lend-2', isCheckedOut: true, checkedOutBy: 'Bob', dueDate: '2026-03-01' });
            service.books.set([book]);
            service.checkIn('lend-2');

            const updated = service.books().find(b => b.id === 'lend-2')!;
            expect(updated.isCheckedOut).toBe(false);
            expect(updated.checkedOutBy).toBe('');
            expect(updated.dueDate).toBe('');
        });
    });

    describe('isInLibrary', () => {
        it('returns true for a book present in the library', () => {
            const book = makeBook({ id: 'local-1' });
            service.books.set([book]);
            expect(service.isInLibrary('local-1')).toBe(true);
        });

        it('returns false for an id not in the library', () => {
            service.books.set([]);
            expect(service.isInLibrary('ghost')).toBe(false);
        });
    });
});
