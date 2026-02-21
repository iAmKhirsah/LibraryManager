import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('@components/book-list/book-list.component').then(m => m.BookListComponent),
    },
    {
        path: '**',
        redirectTo: '',
    },
];
