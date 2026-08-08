import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TeacherService } from '../../../core/services/teacher.service';
import { Teacher } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent],
  templateUrl: './teacher-list.component.html',
  styleUrl: './teacher-list.component.scss'
})
export class TeacherListComponent implements OnInit {
  private teacherService = inject(TeacherService);
  private router = inject(Router);

  teachers: Teacher[] = [];
  loading = true;

  columns: TableColumn[] = [
    { key: 'employeeNo',              label: 'Employee No' },
    { key: 'firstName',                label: 'First Name' },
    { key: 'lastName',                 label: 'Last Name' },
    { key: 'designation',              label: 'Designation' },
    { key: 'educationQualification',   label: 'Qualification' },
    { key: 'mobileNumber',             label: 'Mobile' },
    { key: 'authStatus',               label: 'Status', type: 'badge' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.teacherService.list().subscribe({
      next: d => { this.teachers = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onView(row: Record<string, unknown>): void {
    this.router.navigate(['/teachers', row['teacherId']]);
  }

  onEdit(row: Record<string, unknown>): void {
    this.router.navigate(['/teachers', row['teacherId'], 'edit']);
  }

  onDelete(row: Record<string, unknown>): void {
    if (confirm('Delete teacher?')) {
      this.teacherService.delete(row['teacherId'] as number).subscribe(() => this.load());
    }
  }
}
