import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SubjectService } from '../../../core/services/subject.service';
import { Subject } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-subjects-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent],
  templateUrl: './subjects-list.component.html',
  styleUrl: './subjects-list.component.scss'
})
export class SubjectsListComponent implements OnInit {
  private subjectService = inject(SubjectService);
  private router = inject(Router);
  subjects: Subject[] = [];
  loading = true;
  columns: TableColumn[] = [
    { key: 'subjectId',   label: '#' },
    { key: 'subjectName', label: 'Subject Name' },
    { key: 'subjectCode', label: 'Code' },
    { key: 'isPractical', label: 'Practical' },
    { key: 'authStatus',  label: 'Status' }
  ];
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.subjectService.list().subscribe({ next: d => { this.subjects = d; this.loading = false; }, error: () => { this.loading = false; } });
  }
  onEdit(row: Record<string, unknown>): void { this.router.navigate(['/subjects', row['subjectId'], 'edit']); }
  onDelete(row: Record<string, unknown>): void {
    if (confirm('Delete subject?')) this.subjectService.delete(row['subjectId'] as number).subscribe(() => this.load());
  }
}
