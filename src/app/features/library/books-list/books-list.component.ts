import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LibraryBookService } from '../../../core/services/library.service';
import { LibraryBookCatalog } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-books-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent],
  templateUrl: './books-list.component.html',
  styleUrl: './books-list.component.scss'
})
export class BooksListComponent implements OnInit {
  private bookService = inject(LibraryBookService);
  private router = inject(Router);

  books: (LibraryBookCatalog & { availability: string })[] = [];
  loading = true;

  columns: TableColumn[] = [
    { key: 'title',        label: 'Title' },
    { key: 'author',       label: 'Author' },
    { key: 'category',     label: 'Category' },
    { key: 'isbn',         label: 'ISBN' },
    { key: 'availability', label: 'Available / Total' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.bookService.getCatalog().subscribe({
      next: d => {
        this.books = d.map(b => ({ ...b, availability: `${b.availableCopies} / ${b.totalCopies}` }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onView(row: Record<string, unknown>): void { this.router.navigate(['/library/books', row['bookId'], 'copies']); }
  onEdit(row: Record<string, unknown>): void { this.router.navigate(['/library/books', row['bookId'], 'edit']); }
  onDelete(row: Record<string, unknown>): void {
    if (confirm(`Delete book "${row['title']}"? This cannot be undone.`))
      this.bookService.delete(row['bookId'] as number).subscribe(() => this.load());
  }
}
