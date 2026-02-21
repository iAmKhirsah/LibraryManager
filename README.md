# LibraryManager — Munters Home Assignment

A responsive library management application built with **Angular 21** that allows librarians to manage their book inventory, discover new titles via Google Books, and track lending.

---

## Live Demo

> _(Add deployment link here once deployed to Netlify / GitHub Pages)_

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200) in your browser. The app hot-reloads on file changes.

### Run Unit Tests

```bash
ng test
```

### Production Build

```bash
ng build
```

Build artifacts are written to `dist/`.

---

## Features

### Core (Required)

| Feature | Implementation |
|---|---|
| Book list | Responsive grid with infinite scroll via `IntersectionObserver` |
| Detailed book view | Material Dialog modal with full metadata |
| Add / Edit book | Reactive form with validation (required fields, 4-digit year, async duplicate catalog# check) |
| Delete book | Icon button on each card with snackbar confirmation |
| Search / filter | Real-time search across title, author, and catalog number |

### Bonus

| Feature | Implementation |
|---|---|
| Google Books API | "Discover" mode searches the Google Books API in real time |
| Sort books | Per-mode sorting — Inventory: Title / Author / Year / Catalog#; Discover: Relevance / Newest |
| Pagination | Infinite scroll in both Inventory and Discover modes |
| Book lending | "Check Out" flow captures borrower name and due date; "Check In" returns the book |

---

## Architecture & Design Decisions

### Angular 21 — Signals-first

State is managed entirely with Angular **Signals** and `computed()` — no NgRx, no BehaviorSubjects. `BookStoreService` is the single source of truth, providing:

- `books` — the local library (persisted to `localStorage`)
- `filteredBooks` / `visibleBooks` — derived via `computed()`
- `searchQuery`, `viewMode`, `sortField`, `sortDirection` — filter signals
- `rxResource` — wraps the Google Books HTTP call, re-fetching reactively when the query or sort changes

### Component Architecture

All components are **standalone** with `ChangeDetectionStrategy.OnPush`, resulting in zero-Zone change detection passes for reads.

```
App
├── NavbarComponent         (toolbar + theme toggle)
└── BookListComponent
    ├── BookFilterComponent (search, sort, tab switch)
    ├── BookCardComponent   (grid item — view, edit, delete, lend)
    └── ScrollSentinelComponent (IntersectionObserver trigger)

Dialogs (opened via MatDialog)
├── BookDetailComponent     (full book info + check-out/in)
├── BookFormComponent       (add / edit with reactive form)
└── LendingFormComponent    (borrower + due date)
```

### Theming

A `ThemeService` manages `light | dark | system` preference, persisted to `localStorage`. The resolved mode is applied as a `data-theme` attribute on `<html>`, which CSS variables respond to. Dark and light palettes are defined as a SCSS mixin applied to `:root` and media query respectively.

### Persistence

`localStorage` under the key `hw-munters-books`. A seeded set of 3 books is loaded on first visit if storage is empty.

---

## Trade-offs & Known Limitations

- **No backend** — the library state is stored in `localStorage` only; concurrent users or page refreshes in another tab will not sync.
- **Google Books quota** — the app queries the public Google Books API without an API key. Hitting rate limits will result in empty Discover results (no error is surfaced to the user — improvement: show a snackbar on HTTP error).
- **Infinite scroll in Discover** — results are accumulated client-side per search session. Navigating away resets the accumulated list.
- **No authentication** — any visitor to the deployed URL can add, edit, or delete books.
- **Unit test coverage** — `BookStoreService` CRUD and filter logic has unit tests; component-level tests were descoped for time.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Angular 21 (standalone, signals) |
| UI Components | Angular Material (MDC-based) |
| Styling | SCSS + CSS custom properties |
| State | Angular Signals + `rxResource` |
| External API | [Google Books API](https://developers.google.com/books) |
| Testing | Vitest (via `@analogjs/vitest-angular`) |
