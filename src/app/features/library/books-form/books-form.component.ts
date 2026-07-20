import { Component, OnInit, inject } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LibraryBookService } from '../../../core/services/library.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-books-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './books-form.component.html',
  styleUrl: './books-form.component.scss'
})
export class BooksFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bookService = inject(LibraryBookService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  id: number | null = null;
  loading = false;
  saving = false;
  error = '';

  form = this.fb.group({
    title:      ['', [Validators.required, Validators.maxLength(300)]],
    author:     [''],
    isbn:       [''],
    category:   [''],
    schoolEiin: [this.authService.schoolEiin]
  });

  get isEdit(): boolean { return this.id !== null; }

  ngOnInit(): void {
    const p = this.route.snapshot.paramMap.get('id');
    if (p) {
      this.id = +p; this.loading = true;
      this.bookService.fetch(this.id).subscribe({
        next: b => { this.form.patchValue(b as any); this.loading = false; },
        error: () => { this.loading = false; this.error = 'Failed to load.'; }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.isEdit
      ? this.bookService.update(this.id!, this.form.value as any)
      : this.bookService.create(this.form.value as any);
    obs.subscribe({
      next: () => this.router.navigate(['/library/books']),
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; }
    });
  }
}
