import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LibraryBookCopyService, LibraryBookIssueService } from '../../../core/services/library.service';
import { StudentService } from '../../../core/services/student.service';
import { SelectOption, SearchableSelectComponent } from '../../../common/searchable-select/searchable-select.component';

@Component({
  selector: 'app-issue-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchableSelectComponent, IconComponent],
  templateUrl: './issue-form.component.html',
  styleUrl: './issue-form.component.scss'
})
export class IssueFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private copyService = inject(LibraryBookCopyService);
  private issueService = inject(LibraryBookIssueService);
  private studentService = inject(StudentService);
  private router = inject(Router);

  saving = false;
  error = '';

  copyOptions: SelectOption[] = [];
  studentOptions: SelectOption[] = [];

  private today = new Date().toISOString().substring(0, 10);
  private twoWeeksOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

  form = this.fb.group({
    copyId:    [null as number | null, Validators.required],
    studentId: [null as number | null, Validators.required],
    issueDate: [this.today, Validators.required],
    dueDate:   [this.twoWeeksOut, Validators.required]
  });

  ngOnInit(): void {
    this.copyService.getAvailable().subscribe(copies => {
      this.copyOptions = copies.map(c => ({ value: c.copyId, label: `${c.bookTitle} — ${c.barcode}` }));
    });
    this.studentService.list().subscribe(students => {
      this.studentOptions = students.map(s => ({ value: s.studentId, label: `${s.firstName} ${s.lastName ?? ''} (${s.admissionNo})` }));
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.error = '';
    const v = this.form.value;
    this.issueService.issue({
      copyId: v.copyId!,
      studentId: v.studentId!,
      issueDate: v.issueDate!,
      dueDate: v.dueDate!
    }).subscribe({
      next: res => {
        this.saving = false;
        if (!res.success) { this.error = res.message; return; }
        this.router.navigate(['/library/issues']);
      },
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Failed to issue book.'; }
    });
  }
}
