import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MarkService } from '../../../core/services/mark.service';
import { ExamService } from '../../../core/services/exam.service';
import { Mark, Exam } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { SearchableSelectComponent, SelectOption } from '../../../common/searchable-select/searchable-select.component';

@Component({
  selector: 'app-marks-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataTableComponent, SearchableSelectComponent],
  templateUrl: './marks-list.component.html',
  styleUrl: './marks-list.component.scss'
})
export class MarksListComponent implements OnInit {
  private markService = inject(MarkService);
  private examService = inject(ExamService);
  private router = inject(Router);

  marks: Mark[] = [];
  filtered: Mark[] = [];
  exams: Exam[] = [];
  examOptions: SelectOption[] = [{ value: 0, label: 'All Exams' }];
  loading = true;
  filterExamId: number | null = null;

  columns: TableColumn[] = [
    { key: 'markId',          label: '#' },
    { key: 'examId',          label: 'Exam ID' },
    { key: 'subjectId',       label: 'Subject ID' },
    { key: 'studentId',       label: 'Student ID' },
    { key: 'obtainTotalMark', label: 'Total' },
    { key: 'grade',           label: 'Grade' }
  ];

  ngOnInit(): void {
    this.examService.list().subscribe(exams => {
      this.exams = exams;
      this.examOptions = [
        { value: 0, label: 'All Exams' },
        ...exams.map(e => ({ value: e.examId, label: e.examName || '' }))
      ];
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.markService.list().subscribe({
      next: d => { this.marks = d; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onExamSelect(val: number | string | null): void {
    this.filterExamId = (!val || val === 0) ? null : val as number;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filtered = this.filterExamId
      ? this.marks.filter(m => m.examId === this.filterExamId)
      : this.marks;
  }

  onEdit(row: Record<string, unknown>): void { this.router.navigate(['/marks', row['markId'], 'edit']); }
  onDelete(row: Record<string, unknown>): void {
    if (confirm('Delete?')) this.markService.delete(row['markId'] as number).subscribe(() => this.load());
  }
}
