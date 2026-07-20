import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LibraryBookService, LibraryBookCopyService } from '../../../core/services/library.service';
import { AuthService } from '../../../core/services/auth.service';
import { LibraryBook, LibraryBookCopy } from '../../../core/models';

@Component({
  selector: 'app-book-copies',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './book-copies.component.html',
  styleUrl: './book-copies.component.scss'
})
export class BookCopiesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookService = inject(LibraryBookService);
  private copyService = inject(LibraryBookCopyService);
  private authService = inject(AuthService);

  bookId = 0;
  book: LibraryBook | null = null;
  copies: LibraryBookCopy[] = [];
  loading = true;
  error = '';

  newBarcode = '';
  adding = false;
  addError = '';

  ngOnInit(): void {
    this.bookId = +this.route.snapshot.paramMap.get('bookId')!;
    this.bookService.fetch(this.bookId).subscribe(b => this.book = b);
    this.load();
  }

  load(): void {
    this.loading = true;
    this.copyService.getAllByBook(this.bookId).subscribe({
      next: c => { this.copies = c; this.loading = false; },
      error: () => { this.loading = false; this.error = 'Failed to load copies.'; }
    });
  }

  addCopy(): void {
    if (!this.newBarcode.trim()) return;
    this.adding = true;
    this.addError = '';
    this.copyService.create({
      bookId: this.bookId,
      barcode: this.newBarcode.trim(),
      status: 'Available',
      schoolEiin: this.authService.schoolEiin
    }).subscribe({
      next: res => {
        this.adding = false;
        if (!res.success) { this.addError = res.message; return; }
        this.newBarcode = '';
        this.load();
      },
      error: err => { this.adding = false; this.addError = err?.error?.message ?? 'Failed to add copy.'; }
    });
  }

  deleteCopy(copy: LibraryBookCopy): void {
    if (!confirm(`Delete copy "${copy.barcode}"?`)) return;
    this.copyService.delete(copy.copyId).subscribe({
      next: res => { if (!res.success) alert(res.message); this.load(); },
      error: err => alert(err?.error?.message ?? 'Failed to delete copy.')
    });
  }
}
