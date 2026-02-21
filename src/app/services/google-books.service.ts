import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { Book, GoogleBooksResponse, GoogleBooksVolume } from '@models/book.model';

const API_URL = 'https://www.googleapis.com/books/v1/volumes';
const GB_PREFIX = 'GB-';

@Injectable({ providedIn: 'root' })
export class GoogleBooksService {
    private readonly http = inject(HttpClient);

    searchBooks(query: string, maxResults = 20, startIndex = 0, orderBy = 'relevance') {
        const params = new HttpParams()
            .set('q', query)
            .set('maxResults', maxResults)
            .set('startIndex', startIndex)
            .set('orderBy', orderBy)
            .set('printType', 'books')
            .set('projection', 'lite');

        return this.http.get<GoogleBooksResponse>(API_URL, { params }).pipe(
            map(response => (response.items ?? []).map(this.mapVolume)),
            catchError(() => of([] as Book[])),
        );
    }

    private mapVolume(volume: GoogleBooksVolume): Book {
        const info = volume.volumeInfo;
        const rawThumb =
            info.imageLinks?.thumbnail ??
            info.imageLinks?.smallThumbnail ??
            '';
        const thumbnail = rawThumb.replace(/^http:\/\//, 'https://');
        const catalogNumber = `${GB_PREFIX}${volume.id.slice(0, 5).toUpperCase()}`;

        return {
            id: volume.id,
            catalogNumber,
            title: info.title ?? 'Unknown Title',
            authors: (info.authors ?? ['Unknown Author']).join(', '),
            publisher: info.publisher ?? '',
            publishedDate: info.publishedDate ?? '',
            description: info.description ?? '',
            pageCount: info.pageCount ?? null,
            categories: (info.categories ?? []).join(', '),
            thumbnail,
            isCheckedOut: false,
            checkedOutBy: '',
            dueDate: '',
        };
    }
}
