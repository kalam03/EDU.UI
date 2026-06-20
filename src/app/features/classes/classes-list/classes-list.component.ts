import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ClassService } from '../../../core/services/class.service';
import { EduClass } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-classes-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent],
  templateUrl: './classes-list.component.html',
  styleUrl: './classes-list.component.scss'
})
export class ClassesListComponent implements OnInit {
  private classService = inject(ClassService);
  private router = inject(Router);

  classes: EduClass[] = [];
  loading = true;

  columns: TableColumn[] = [
    { key: 'classId',   label: '#' },
    { key: 'className', label: 'Class Name' },
    { key: 'classCode', label: 'Code' },
    { key: 'authStatus',label: 'Status' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.classService.list().subscribe({
      next: d => { this.classes = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onEdit(row: Record<string, unknown>): void { this.router.navigate(['/classes', row['classId'], 'edit']); }
  onDelete(row: Record<string, unknown>): void {
    if (confirm(`Delete class "${row['className']}"?`))
      this.classService.delete(row['classId'] as number).subscribe(() => this.load());
  }
}
