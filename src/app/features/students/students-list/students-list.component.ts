import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { Student } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.scss'
})
export class StudentsListComponent implements OnInit {
  private studentService = inject(StudentService);
  private router = inject(Router);

  students: Student[] = [];
  loading = true;

  columns: TableColumn[] = [
    { key: 'admissionNo',    label: 'Admission No' },
    { key: 'firstName',      label: 'First Name' },
    { key: 'lastName',       label: 'Last Name' },
    { key: 'gender',         label: 'Gender' },
    { key: 'mobileNumber',   label: 'Mobile' },
    { key: 'enrollmentYear', label: 'Year' },
    { key: 'authStatus',     label: 'Status', type: 'badge' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.studentService.list().subscribe({
      next: d => { this.students = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onEdit(row: Record<string, unknown>): void {
    this.router.navigate(['/students', row['studentId'], 'edit']);
  }

  onDelete(row: Record<string, unknown>): void {
    if (confirm('Delete student?')) {
      this.studentService.delete(row['studentId'] as number).subscribe(() => this.load());
    }
  }
}
