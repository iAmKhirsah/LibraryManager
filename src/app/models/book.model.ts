export interface Book {
    id: string;
    catalogNumber: string;
    title: string;
    authors: string;
    publisher: string;
    publishedDate: string;
    description: string;
    pageCount: number | null;
    categories: string;
    thumbnail: string;
    isCheckedOut: boolean;
    checkedOutBy: string;
    dueDate: string;
}

export interface GoogleBooksResponse {
    totalItems: number;
    items?: GoogleBooksVolume[];
}

export interface GoogleBooksVolume {
    id: string;
    volumeInfo: {
        title?: string;
        authors?: string[];
        publisher?: string;
        publishedDate?: string;
        description?: string;
        pageCount?: number;
        categories?: string[];
        imageLinks?: {
            thumbnail?: string;
            smallThumbnail?: string;
        };
    };
}
