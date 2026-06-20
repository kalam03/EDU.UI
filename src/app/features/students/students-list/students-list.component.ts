import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { Student } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataTableComponent],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.scss'
})
export class StudentsListComponent implements OnInit {
  private studentService = inject(StudentService);
  private router = inject(Router);

  students: Student[] = [];
  filtered: Student[] = [];
  loading = true;
  searchTerm = '';

  columns: TableColumn[] = [
    { key: 'admissionNo', label: 'Admission No' },
    { key: 'firstName',   label: 'First Name' },
    { key: 'lastName',    label: 'Last Name' },
    { key: 'gender',      label: 'Gender' },
    { key: 'mobileNumber',label: 'Mobile' },
    { key: 'enrollmentYear', label: 'Year' },
    { key: 'authStatus',  label: 'Status' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.studentService.list().subscribe({
      next: d => { this.students = d; this.filtered = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered = this.students.filter(s =>
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.admissionNo?.toLowerCase().includes(q)
    );
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
