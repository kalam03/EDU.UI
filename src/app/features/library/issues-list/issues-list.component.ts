import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LibraryBookIssueService } from '../../../core/services/library.service';
import { LibraryBookIssue } from '../../../core/models';

@Component({
  selector: 'app-issues-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './issues-list.component.html',
  styleUrl: './issues-list.component.scss'
})
export class IssuesListComponent implements OnInit {
  private issueService = inject(LibraryBookIssueService);

  issues: LibraryBookIssue[] = [];
  loading = true;
  error = '';
  overdueOnly = false;

  // Inline "Return Book" form state
  returningIssueId: number | null = null;
  returnDate = new Date().toISOString().substring(0, 10);
  finePerDay = 5;
  markLost = false;
  returnSaving = false;
  returnError = '';

  get visibleIssues(): LibraryBookIssue[] {
    return this.overdueOnly ? this.issues.filter(i => i.isOverdue) : this.issues;
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.issueService.getAll().subscribe({
      next: d => { this.issues = d; this.loading = false; },
      error: () => { this.loading = false; this.error = 'Failed to load issued books.'; }
    });
  }

  openReturnForm(issue: LibraryBookIssue): void {
    this.returningIssueId = issue.issueId;
    this.returnDate = new Date().toISOString().substring(0, 10);
    this.finePerDay = 5;
    this.markLost = false;
    this.returnError = '';
  }

  closeReturnForm(): void { this.returningIssueId = null; }

  confirmReturn(issue: LibraryBookIssue): void {
    this.returnSaving = true;
    this.returnError = '';
    this.issueService.returnBook(issue.issueId, {
      returnDate: this.returnDate,
      finePerDay: this.finePerDay,
      markLost: this.markLost
    }).subscribe({
      next: res => {
        this.returnSaving = false;
        if (!res.success) { this.returnError = res.message; return; }
        this.closeReturnForm();
        this.load();
      },
      error: err => { this.returnSaving = false; this.returnError = err?.error?.message ?? 'Failed to process return.'; }
    });
  }

  markFinePaid(issue: LibraryBookIssue): void {
    this.issueService.markFinePaid(issue.issueId).subscribe({
      next: res => { if (!res.success) alert(res.message); this.load(); },
      error: err => alert(err?.error?.message ?? 'Failed to update fine status.')
    });
  }
}
