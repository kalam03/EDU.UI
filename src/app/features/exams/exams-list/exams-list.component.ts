import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { Exam } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({ selector: 'app-exams-list', standalone: true, imports: [CommonModule, RouterLink, DataTableComponent], templateUrl: './exams-list.component.html', styleUrl: './exams-list.component.scss' })
export class ExamsListComponent implements OnInit {
  private examService = inject(ExamService); private router = inject(Router);
  exams: Exam[] = []; loading = true;
  columns: TableColumn[] = [
    { key: 'examId', label: '#' }, { key: 'examName', label: 'Exam Name' },
    { key: 'examDate', label: 'Date' }, { key: 'startTime', label: 'Start' }, { key: 'authStatus', label: 'Status' }
  ];
  ngOnInit(): void { this.load(); }
  load(): void { this.loading = true; this.examService.list().subscribe({ next: d => { this.exams = d; this.loading = false; }, error: () => { this.loading = false; } }); }
  onEdit(row: Record<string, unknown>): void { this.router.navigate(['/exams', row['examId'], 'edit']); }
  onDelete(row: Record<string, unknown>): void { if (confirm('Delete?')) this.examService.delete(row['examId'] as number).subscribe(() => this.load()); }
}
