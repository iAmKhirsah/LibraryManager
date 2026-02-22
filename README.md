# Library Manager

A responsive library management app built with **Angular 21**. Manage your book inventory, discover new titles via Google Books, and track lending — all in a clean, dark/light mode interface.

---

## Live Demo

[https://iAmKhirsah.github.io/LibraryManager](https://iAmKhirsah.github.io/LibraryManager)

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
npm install
npx ng serve
```

Open [http://localhost:4200](http://localhost:4200) in your browser. The app hot-reloads on file changes.

### Run Unit Tests

```bash
npx ng test
```

### Production Build

```bash
npx ng build --configuration=production
```

Build artifacts are written to `dist/`.

---

## Features

### Inventory Management
- Add, edit, and delete books with a reactive form (title, author, catalog number, publisher, year, page count, categories, cover image)
- Catalog number uniqueness is validated asynchronously against the current library
- Real-time search across title, author, and catalog number
- Sort by title, author, year, or catalog number in either direction
- Infinite scroll via `IntersectionObserver`

### Book Lending
- Check out a book to a borrower with a due date (date picker, future dates only)
- Check in returns the book to available status
- Overdue detection — books past their due date are flagged

### Discover Mode
- Search the Google Books API in real time with debounced input
- Results are paginated and accumulated via infinite scroll
- Books found in Discover can be added directly to your local inventory

### UI & Theming
- Light / dark / system theme toggle, persisted across sessions
- Color-coded status chips (available, checked out, overdue, external/Google Books)
- Color-coded snackbar notifications for all actions
- Fully responsive — single column layout on mobile

---

## Architecture

### State Management — Signals-first

All state lives in `BookStoreService` using Angular **Signals** and `computed()` — no NgRx, no BehaviorSubjects, no Zone.js.

- `books` — local library, persisted to `localStorage`
- `filteredBooks` / `visibleBooks` — derived via `computed()`
- `searchQuery`, `viewMode`, `sortField`, `sortDirection` — reactive filter signals
- `debouncedSearchQuery` — debounced via `toObservable` + `toSignal` for API calls only
- `rxResource` — wraps the Google Books HTTP call, re-fetches reactively on query/sort change

### Component Tree

```
App
├── NavbarComponent            (toolbar + theme toggle)
└── BookListComponent
    ├── BookFilterComponent    (search, sort, view mode tabs)
    ├── BookCardComponent      (grid card — view, edit, delete, lend)
    └── ScrollSentinelComponent (IntersectionObserver trigger)

Dialogs
├── BookDetailComponent        (full book info + check-out / check-in)
├── BookFormComponent          (add / edit with validation)
└── LendingFormComponent       (borrower name + due date picker)
```

All components are **standalone** with `ChangeDetectionStrategy.OnPush`.

### Theming

`ThemeService` manages `light | dark | system` preference, persisted to `localStorage`. The resolved mode is applied as a `data-theme` attribute on `<html>`. SCSS custom properties respond to both the attribute and `prefers-color-scheme` via a shared `dark-vars` mixin.

### Persistence

`localStorage` under the key `books`. A seeded set of books is loaded on first visit if storage is empty.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Angular 21 (standalone, zoneless, signals) |
| UI Components | Angular Material 21 (MDC-based) |
| Styling | SCSS + CSS custom properties |
| State | Angular Signals + `rxResource` |
| External API | Google Books API |
| Testing | Vitest |

---

## Known Limitations

- **No backend** — state is `localStorage` only; multiple tabs or users will not sync
- **Google Books quota** — the app queries without an API key; rate limits will silently return empty results
- **Test coverage** — `BookStoreService` is fully covered; component-level tests are not included
